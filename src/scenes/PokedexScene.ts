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
  private viewportTop = 126;
  private viewportBottom = 0;
  // S-POLISH-B2-R10: Completeness Bar + Sort/Filter
  private completenessBar!: Phaser.GameObjects.Graphics;
  private completenessText!: Phaser.GameObjects.Text;
  private filterMode: 'all' | 'discovered' | 'captured' | 'missing' = 'all';
  private sortMode: 'family' | 'rarity' | 'name' = 'family';
  private filterBtn!: Phaser.GameObjects.Text;
  private sortBtn!: Phaser.GameObjects.Text;
  // B7-R5: Plant-Encyclopedia Detail-Modal
  private detailModal?: Phaser.GameObjects.Container;

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

    // S-POLISH-B2-R10: Completeness-Bar
    const barW = width - 60;
    const barX = 30;
    this.completenessText = this.add.text(width / 2, 70, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#9be36e'
    }).setOrigin(0.5);
    this.completenessBar = this.add.graphics();
    this.drawCompletenessBar(barX, 78, barW, 8, 0);

    // S-POLISH-B2-R10: Filter + Sort Buttons
    this.filterBtn = this.add.text(width / 2 - 80, 96, 'Filter: Alle', {
      fontFamily: 'monospace', fontSize: '10px', color: '#fcd95c',
      backgroundColor: '#333', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.filterBtn.on('pointerup', () => {
      const modes: Array<'all' | 'discovered' | 'captured' | 'missing'> = ['all', 'discovered', 'captured', 'missing'];
      this.filterMode = modes[(modes.indexOf(this.filterMode) + 1) % modes.length];
      this.filterBtn.setText('Filter: ' + { all: 'Alle', discovered: 'Gesehen', captured: 'Gefangen', missing: 'Fehlt' }[this.filterMode]);
      this.scrollY = 0;
      this.renderTab();
    });
    this.sortBtn = this.add.text(width / 2 + 60, 96, 'Sortierung: Familie', {
      fontFamily: 'monospace', fontSize: '10px', color: '#b0e0ff',
      backgroundColor: '#333', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.sortBtn.on('pointerup', () => {
      const modes: Array<'family' | 'rarity' | 'name'> = ['family', 'rarity', 'name'];
      this.sortMode = modes[(modes.indexOf(this.sortMode) + 1) % modes.length];
      this.sortBtn.setText('Sortierung: ' + { family: 'Familie', rarity: 'Seltenheit', name: 'Name' }[this.sortMode]);
      this.scrollY = 0;
      this.renderTab();
    });

    // Tabs
    this.makeTab(width / 2 - 80, 84, 'species', 'Spezies');
    this.makeTab(width / 2 + 80, 84, 'achievements', 'Achievements');

    // Container fuer Liste-Inhalt (wird gescrollt)
    this.listContainer = this.add.container(0, this.viewportTop);

    this.entries = this.buildAllSpeciesEntries();
    // S-POLISH-B2-R10: Sortierung wird jetzt dynamisch in renderSpecies() gemacht

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
    this.rowHeight = 18;
    const dex = gameStore.getPokedex();
    const { width } = this.scale;
    const discovered = new Set(dex.discovered);
    const captured = new Set(dex.captured);

    // S-POLISH-B2-R10: Completeness-Bar aktualisieren
    const pct = this.entries.length > 0 ? captured.size / this.entries.length : 0;
    const barW = width - 60;
    this.drawCompletenessBar(30, 78, barW, 8, pct);
    this.completenessText.setText(
      `Pokedex: ${captured.size}/${this.entries.length} gefangen  (${Math.round(pct * 100)}%)`
    );

    this.headerCount.setText(
      `${discovered.size} gesehen  ·  ${captured.size} gefangen  ·  ${this.entries.length} total`
    );

    // S-POLISH-B2-R10: Filter anwenden
    let filtered = this.entries.filter((e) => {
      if (this.filterMode === 'all') return true;
      if (this.filterMode === 'discovered') return discovered.has(e.slug) && !captured.has(e.slug);
      if (this.filterMode === 'captured') return captured.has(e.slug);
      if (this.filterMode === 'missing') return !discovered.has(e.slug);
      return true;
    });

    // S-POLISH-B2-R10: Sortierung anwenden
    filtered = [...filtered].sort((a, b) => {
      if (this.sortMode === 'rarity') return b.rarity - a.rarity;
      if (this.sortMode === 'name') return a.name.localeCompare(b.name);
      // family (default)
      const aStarter = a.family === 'Starter' ? 0 : 1;
      const bStarter = b.family === 'Starter' ? 0 : 1;
      if (aStarter !== bStarter) return aStarter - bStarter;
      const fam = a.family.localeCompare(b.family);
      if (fam !== 0) return fam;
      return a.slug.localeCompare(b.slug);
    });

    let by = 0;
    for (const entry of filtered) {
      const isDiscovered = discovered.has(entry.slug);
      const isCaptured = captured.has(entry.slug);
      // S-POLISH-B2-R10: Silhouette fuer unentdeckte Eintraege
      const status = isCaptured ? '✓' : isDiscovered ? '?' : '▓';
      const color = isCaptured ? '#9be36e' : isDiscovered ? '#fcd95c' : '#3a3a3a';
      const displayName = isDiscovered ? entry.name : '???·???';
      const familyTag = isDiscovered
        ? (entry.family === 'Hybrid' ? '★ Hybrid' : entry.family)
        : '---';
      const rarityDots = '★'.repeat(entry.rarity);
      const t = this.add
        .text(width / 2, by, `${status}  ${displayName}  (${familyTag}) ${rarityDots}`, {
          fontFamily: 'monospace',
          fontSize: '12px',
          color
        })
        .setOrigin(0.5, 0);
      // B7-R5: Klick auf Eintrag öffnet Encyclopedia-Modal
      if (isDiscovered) {
        t.setInteractive({ useHandCursor: true });
        t.on('pointerdown', () => this.openEncyclopediaModal(entry.slug));
        t.on('pointerover', () => t.setColor('#ffffff'));
        t.on('pointerout', () => t.setColor(color));
      }
      // Glow-Pulse fuer gesehen-aber-nicht-gefangen
      if (isDiscovered && !isCaptured) {
        this.tweens.add({
          targets: t, alpha: { from: 1, to: 0.55 }, duration: 900,
          ease: 'Sine.InOut', yoyo: true, repeat: -1
        });
      }
      this.listContainer.add(t);
      by += this.rowHeight;
    }

    if (filtered.length === 0) {
      this.listContainer.add(
        this.add.text(width / 2, 0, 'Kein Eintrag mit diesem Filter.', {
          fontFamily: 'monospace', fontSize: '12px', color: '#553e2d'
        }).setOrigin(0.5, 0)
      );
    }
  }

  /** S-POLISH-B2-R10: Zeichnet Completeness-Bar mit Gradient-Feel. */
  private drawCompletenessBar(x: number, y: number, w: number, h: number, pct: number): void {
    this.completenessBar.clear();
    // Hintergrund
    this.completenessBar.fillStyle(0x222222, 0.8);
    this.completenessBar.fillRect(x, y, w, h);
    // Füllbalken (grün → gold bei > 80%)
    const fillColor = pct >= 0.8 ? 0xfcd95c : 0x4ab84a;
    const fillW = Math.round(w * Math.min(1, pct));
    if (fillW > 0) {
      this.completenessBar.fillStyle(fillColor, 1);
      this.completenessBar.fillRect(x + 1, y + 1, fillW - 2, h - 2);
    }
    // Rahmen
    this.completenessBar.lineStyle(1, 0x556655, 1);
    this.completenessBar.strokeRect(x, y, w, h);
  }

  /**
   * B7-R5: Plant-Encyclopedia Modal — zeigt botanischen Namen, Beschreibung, Stats, Unlock-Progress.
   */
  private openEncyclopediaModal(slug: string): void {
    // Schliesse bestehendes Modal
    if (this.detailModal) {
      this.detailModal.destroy();
      this.detailModal = undefined;
    }

    const allSp = [...STARTER_SPECIES, ...HYBRID_SPECIES];
    const sp = allSp.find((s) => s.slug === slug);
    if (!sp) return;

    const { width, height } = this.scale;
    const panelW = Math.min(360, width - 40);
    const panelH = 210;
    const c = this.add.container(width / 2, height / 2).setDepth(3000);

    // Hintergrund
    const bg = this.add.graphics();
    bg.fillStyle(0x111a11, 0.97);
    bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 10);
    bg.lineStyle(2, 0x9be36e, 1);
    bg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 10);
    c.add(bg);

    // Botanischer Name (italic Style via font)
    const sciName = this.add.text(0, -panelH / 2 + 14, sp.scientificName, {
      fontFamily: 'monospace', fontSize: '12px', color: '#9be36e', fontStyle: 'italic'
    }).setOrigin(0.5, 0);
    c.add(sciName);

    // Gemeinsamer Name gross
    const commonName = this.add.text(0, -panelH / 2 + 32, sp.commonName, {
      fontFamily: 'monospace', fontSize: '15px', color: '#ffffff'
    }).setOrigin(0.5, 0);
    c.add(commonName);

    // Beschreibung
    const descWords = sp.description ?? '';
    const desc = this.add.text(-panelW / 2 + 14, -panelH / 2 + 56, descWords, {
      fontFamily: 'monospace', fontSize: '10px', color: '#bbbbbb',
      wordWrap: { width: panelW - 28 }
    });
    c.add(desc);

    // Stats: ATK/DEF/SPD Bias
    const statsY = -panelH / 2 + 110;
    const atkBias = sp.atkBias ?? 0;
    const defBias = sp.defBias ?? 0;
    const spdBias = sp.spdBias ?? 0;
    const statsText = `ATK ${atkBias >= 0 ? '+' : ''}${atkBias}  DEF ${defBias >= 0 ? '+' : ''}${defBias}  SPD ${spdBias >= 0 ? '+' : ''}${spdBias}`;
    const statsLabel = this.add.text(0, statsY, statsText, {
      fontFamily: 'monospace', fontSize: '11px', color: '#fcd95c'
    }).setOrigin(0.5, 0);
    c.add(statsLabel);

    // Unlock-Progress-Bar (basierend auf captured)
    const dex = gameStore.getPokedex();
    const discovered = (dex.discovered ?? []).length;
    const captured = (dex.captured ?? []).length;
    const total = this.entries.length || 1;
    const pct = captured / total;
    const barW = panelW - 40;
    const barY = statsY + 24;
    const barBg = this.add.graphics();
    barBg.fillStyle(0x222222, 0.9);
    barBg.fillRect(-barW / 2, barY, barW, 8);
    const fillW = Math.max(2, Math.round(barW * pct));
    barBg.fillStyle(pct >= 0.8 ? 0xfcd95c : 0x4ab84a, 1);
    barBg.fillRect(-barW / 2 + 1, barY + 1, fillW - 2, 6);
    barBg.lineStyle(1, 0x556655, 1);
    barBg.strokeRect(-barW / 2, barY, barW, 8);
    c.add(barBg);
    const progText = this.add.text(0, barY + 11, `${captured}/${total} gefangen (${Math.round(pct * 100)}%) — ${discovered} gesehen`, {
      fontFamily: 'monospace', fontSize: '9px', color: '#888888'
    }).setOrigin(0.5, 0);
    c.add(progText);

    // Schliessenknopf
    const closeBtn = this.add.text(panelW / 2 - 14, -panelH / 2 + 8, '×', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ff7e7e'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      this.detailModal?.destroy();
      this.detailModal = undefined;
    });
    c.add(closeBtn);

    this.detailModal = c;
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
