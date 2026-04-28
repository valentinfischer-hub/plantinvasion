import Phaser from 'phaser';
import { gameStore } from '../state/gameState';
import {
  WURZELHEIM_TALLGRASS,
  VERDANTO_TALLGRASS,
  VERDANTO_BROMELIEN,
  KAKTORIA_TALLGRASS,
  FROSTKAMM_TALLGRASS,
  SALZBUCHT_TALLGRASS,
  MORDWALD_TALLGRASS,
  MAGMABLUETE_TALLGRASS,
  type EncounterDef
} from '../data/encounters';
import { STARTER_SPECIES } from '../data/species';
import { HYBRID_SPECIES } from '../data/hybridRecipes';
import { ACHIEVEMENTS } from '../data/achievements';

interface PokedexEntry {
  slug: string;
  name: string;
  family: string;
  rarity: number;
}

type Tab = 'species' | 'achievements';

/**
 * Pokedex-UI mit Tab-Switch (Spezies/Achievements) und Scroll-Support.
 *
 * 2026-04-25 Bug-Fix D-002: Vorher nur 25 Eintraege sichtbar (STARTER + Wurzelheim).
 * Jetzt alle 60+ Spezies aus allen Biomen + Hybriden + Achievements-Tab + Scroll.
 */
export class PokedexScene extends Phaser.Scene {
  private entries: PokedexEntry[] = [];
  private listContainer!: Phaser.GameObjects.Container;
  private headerCount!: Phaser.GameObjects.Text;
  private currentTab: Tab = 'species';
  private tabButtons: { tab: Tab; bg: Phaser.GameObjects.Rectangle; txt: Phaser.GameObjects.Text }[] = [];
  private scrollY = 0;
  private maxScrollY = 0;
  private rowHeight = 18;
  private viewportTop = 110;
  private viewportBottom = 0;

  constructor() {
    super('PokedexScene');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#1a2820');
    this.viewportBottom = height - 60;

    this.add
      .text(width / 2, 28, 'Pokedex', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#9be36e'
      })
      .setOrigin(0.5);

    this.headerCount = this.add
      .text(width / 2, 54, '', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    // Tabs
    this.makeTab(width / 2 - 80, 84, 'species', 'Spezies');
    this.makeTab(width / 2 + 80, 84, 'achievements', 'Achievements');

    // Container fuer Liste-Inhalt (wird gescrollt)
    this.listContainer = this.add.container(0, this.viewportTop);

    this.entries = this.buildAllSpeciesEntries();
    this.entries.sort((a, b) => {
      const aStarter = a.family === 'Starter' ? 0 : 1;
      const bStarter = b.family === 'Starter' ? 0 : 1;
      if (aStarter !== bStarter) return aStarter - bStarter;
      const fam = a.family.localeCompare(b.family);
      if (fam !== 0) return fam;
      return a.slug.localeCompare(b.slug);
    });

    this.renderTab();

    // Scroll-Mechanik
    this.input.on('wheel', (_p: unknown, _gos: unknown, _dx: number, dy: number) => {
      this.scrollBy(dy * 0.8);
    });
    if (this.input.keyboard) {
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP).on('down', () => this.scrollBy(-this.rowHeight * 3));
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN).on('down', () => this.scrollBy(this.rowHeight * 3));
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PAGE_UP).on('down', () => this.scrollBy(-(this.viewportBottom - this.viewportTop)));
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PAGE_DOWN).on('down', () => this.scrollBy(this.viewportBottom - this.viewportTop));
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB).on('down', () => {
        this.switchTab(this.currentTab === 'species' ? 'achievements' : 'species');
      });
    }

    // Hint
    this.add
      .text(width / 2, this.viewportBottom + 4, 'Tab wechseln   ↑↓ scrollen   B/Esc zurueck', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#553e2d'
      })
      .setOrigin(0.5, 0);

    // Back-Button
    const backY = height - 24;
    const backBg = this.add
      .rectangle(width / 2, backY, 160, 28, 0x000000, 0.7)
      .setStrokeStyle(1, 0x9be36e)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(width / 2, backY, 'Zurueck (B)', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#9be36e'
      })
      .setOrigin(0.5);

    // S-POLISH-09b: Back-Button Hover-Glow
    backBg.on('pointerover', () => { backBg.setStrokeStyle(2, 0x9be36e); backBg.setFillStyle(0x000000, 0.9); });
    backBg.on('pointerout', () => { backBg.setStrokeStyle(1, 0x9be36e); backBg.setFillStyle(0x000000, 0.7); });
    const back = () => this.scene.start('OverworldScene');
    backBg.on('pointerup', back);
    if (this.input.keyboard) {
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B).on('down', back);
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', back);
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P).on('down', back);
    }
  }

  private makeTab(x: number, y: number, tab: Tab, label: string): void {
    const w = 130;
    const h = 28;
    const bg = this.add
      .rectangle(x, y, w, h, 0x000000, 0.6)
      .setStrokeStyle(2, 0x553e2d)
      .setInteractive({ useHandCursor: true });
    const txt = this.add
      .text(x, y, label, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#9be36e'
      })
      .setOrigin(0.5);
    // S-POLISH-09b: Tab-Button Hover
    bg.on('pointerover', () => { bg.setStrokeStyle(2, 0x9be36e); });
    bg.on('pointerout', () => {
      const active = this.currentTab === tab;
      bg.setStrokeStyle(2, active ? 0x9be36e : 0x553e2d);
    });
    bg.on('pointerup', () => this.switchTab(tab));
    this.tabButtons.push({ tab, bg, txt });
  }

  private switchTab(tab: Tab): void {
    this.currentTab = tab;
    this.scrollY = 0;
    this.renderTab();
  }

  private renderTab(): void {
    // Update Tab-Buttons (Active-Highlight)
    for (const t of this.tabButtons) {
      const active = t.tab === this.currentTab;
      t.bg.setStrokeStyle(2, active ? 0x9be36e : 0x553e2d);
      t.txt.setColor(active ? '#9be36e' : '#aaaaaa');
    }
    if (this.currentTab === 'species') {
      this.renderSpecies();
    } else {
      this.renderAchievements();
    }
    this.updateMaxScroll();
  }

  private buildAllSpeciesEntries(): PokedexEntry[] {
    const map = new Map<string, PokedexEntry>();
    for (const sp of STARTER_SPECIES) {
      const family = sp.isStarter ? 'Starter' : this.guessFamily(sp.scientificName);
      map.set(sp.slug, { slug: sp.slug, name: sp.commonName, family, rarity: sp.rarity });
    }
    for (const sp of HYBRID_SPECIES) {
      if (!map.has(sp.slug)) {
        map.set(sp.slug, { slug: sp.slug, name: sp.commonName, family: 'Hybrid', rarity: sp.rarity });
      } else {
        map.get(sp.slug)!.family = 'Hybrid';
      }
    }
    const allEncounters: EncounterDef[][] = [
      WURZELHEIM_TALLGRASS,
      VERDANTO_TALLGRASS,
      VERDANTO_BROMELIEN,
      KAKTORIA_TALLGRASS,
      FROSTKAMM_TALLGRASS,
      SALZBUCHT_TALLGRASS,
      MORDWALD_TALLGRASS,
      MAGMABLUETE_TALLGRASS
    ];
    for (const pool of allEncounters) {
      for (const e of pool) {
        if (!map.has(e.slug)) {
          map.set(e.slug, { slug: e.slug, name: e.commonName, family: e.family, rarity: 1 });
        }
      }
    }
    return Array.from(map.values());
  }

  private guessFamily(scientificName: string): string {
    const genus = scientificName.split(' ')[0] ?? 'Unbekannt';
    return genus;
  }

  private renderSpecies(): void {
    this.listContainer.removeAll(true);
    const dex = gameStore.getPokedex();
    const { width } = this.scale;
    this.headerCount.setText(
      `${dex.discovered.length} entdeckt, ${dex.captured.length} gefangen, ${this.entries.length} bekannt`
    );

    let by = 0;
    for (const entry of this.entries) {
      const isDiscovered = dex.discovered.includes(entry.slug);
      const isCaptured = dex.captured.includes(entry.slug);
      const status = isCaptured ? '✓' : isDiscovered ? '?' : '·';
      const color = isCaptured ? '#9be36e' : isDiscovered ? '#fcd95c' : '#553e2d';
      const displayName = isDiscovered ? entry.name : '???';
      const familyTag = entry.family === 'Hybrid' ? '★ Hybrid' : entry.family;
      const t = this.add
        .text(width / 2, by, `${status}  ${displayName}  (${familyTag})`, {
          fontFamily: 'monospace',
          fontSize: '12px',
          color
        })
        .setOrigin(0.5, 0);
      this.listContainer.add(t);
      by += this.rowHeight;
    }
  }

  private renderAchievements(): void {
    this.listContainer.removeAll(true);
    const unlocked = new Set(gameStore.getAchievements());
    const { width } = this.scale;
    this.headerCount.setText(
      `${unlocked.size} / ${ACHIEVEMENTS.length} freigeschaltet`
    );

    let by = 0;
    for (const a of ACHIEVEMENTS) {
      const isUnlocked = unlocked.has(a.slug);
      const status = isUnlocked ? '★' : '·';
      const color = isUnlocked ? '#fcd95c' : '#553e2d';
      const reward = a.rewardCoins
        ? ` (+${a.rewardCoins}c)`
        : a.rewardItem
        ? ` (+${a.rewardItem.amount}x ${a.rewardItem.slug})`
        : '';
      const line = `${status} ${a.name}${reward}`;
      const desc = `   ${a.description}`;
      const t = this.add
        .text(width / 2, by, line, {
          fontFamily: 'monospace',
          fontSize: '12px',
          color
        })
        .setOrigin(0.5, 0);
      this.listContainer.add(t);
      by += 14;
      const d = this.add
        .text(width / 2, by, desc, {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#7d6a4a'
        })
        .setOrigin(0.5, 0);
      this.listContainer.add(d);
      by += 18;
    }
    this.rowHeight = 32;
  }

  private updateMaxScroll(): void {
    const contentHeight = this.listContainer.list.length === 0
      ? 0
      : (this.listContainer.list[this.listContainer.list.length - 1] as Phaser.GameObjects.Text).y + 18;
    const visible = this.viewportBottom - this.viewportTop;
    this.maxScrollY = Math.max(0, contentHeight - visible);
    this.scrollY = Math.min(this.scrollY, this.maxScrollY);
    this.applyScroll();
  }

  private scrollBy(dy: number): void {
    this.scrollY = Math.max(0, Math.min(this.maxScrollY, this.scrollY + dy));
    this.applyScroll();
  }

  private applyScroll(): void {
    this.listContainer.y = this.viewportTop - this.scrollY;
    this.listContainer.list.forEach((item) => {
      const obj = item as Phaser.GameObjects.Text;
      const absoluteY = this.listContainer.y + obj.y;
      const visible = absoluteY > this.viewportTop - 18 && absoluteY < this.viewportBottom + 4;
      obj.setVisible(visible);
    });
  }
}
