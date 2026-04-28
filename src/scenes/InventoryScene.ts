import Phaser from 'phaser';
import { gameStore } from '../state/gameState';
import { getItem } from '../data/items';

/**
 * Inventory-Scene V0.1 (2026-04-25).
 * Hotkey I in OverworldScene. Zeigt alle Items + Counts + Beschreibung.
 * Sortiert nach Kind (Seeds, Boosters, Heal, Lures, Other).
 */
export class InventoryScene extends Phaser.Scene {
  private listContainer!: Phaser.GameObjects.Container;
  private headerText!: Phaser.GameObjects.Text;
  private detailPanel!: Phaser.GameObjects.Container;
  private scrollY = 0;
  private maxScrollY = 0;
  private rowHeight = 22;
  private viewportTop = 90;
  private viewportBottom = 0;
  // selectedSlug not currently displayed elsewhere, kept for future
  // private selectedSlug: string | null = null;

  constructor() {
    super('InventoryScene');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#1a2820');
    this.viewportBottom = height - 60;

    this.add
      .text(width / 2, 30, 'Inventar', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#9be36e'
      })
      .setOrigin(0.5);

    this.headerText = this.add
      .text(width / 2, 56, '', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    // Liste links
    this.listContainer = this.add.container(0, this.viewportTop);
    this.renderList();

    // Detail-Panel rechts (nur sichtbar bei Auswahl)
    this.detailPanel = this.add.container(width - 220, this.viewportTop);
    this.detailPanel.setVisible(false);

    // Scroll
    this.input.on('wheel', (_p: unknown, _gos: unknown, _dx: number, dy: number) => {
      this.scrollBy(dy * 0.8);
    });

    // Hint
    this.add
      .text(width / 2, this.viewportBottom + 4, 'Klick auf Item fuer Details   ↑↓ scrollen   I/Esc zurueck', {
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
      .text(width / 2, backY, 'Zurueck (I)', {
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
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I).on('down', back);
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', back);
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP).on('down', () => this.scrollBy(-this.rowHeight * 3));
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN).on('down', () => this.scrollBy(this.rowHeight * 3));
    }
  }

  private renderList(): void {
    this.listContainer.removeAll(true);
    const inv = gameStore.getInventory();
    const slugs = Object.keys(inv).filter((s) => inv[s] > 0);
    this.headerText.setText(`${slugs.length} Item-Typen   |   ${this.totalCount(inv)} Items gesamt`);

    if (slugs.length === 0) {
      const empty = this.add
        .text(this.scale.width / 2, 0, '(Inventar leer - kaufe Items im Markt oder finde sie als Forage-Drop)', {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#553e2d',
          wordWrap: { width: this.scale.width - 80 }
        })
        .setOrigin(0.5, 0);
      this.listContainer.add(empty);
      return;
    }

    // Gruppiere nach Kind
    const grouped: Record<string, string[]> = {};
    for (const slug of slugs) {
      const def = getItem(slug);
      const kind = def?.kind ?? 'other';
      if (!grouped[kind]) grouped[kind] = [];
      grouped[kind].push(slug);
    }
    const kindOrder: string[] = ['seed', 'fertilizer', 'care-pollen', 'tier-pollen', 'soil-upgrade', 'sun-lamp', 'sprinkler', 'hybrid-booster', 'compost', 'heal', 'cure', 'boost', 'lure', 'water-can'];
    const sortedKinds = Object.keys(grouped).sort((a, b) => {
      const ia = kindOrder.indexOf(a);
      const ib = kindOrder.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    let by = 0;
    const colX = this.scale.width / 2 - 180;
    for (const kind of sortedKinds) {
      const head = this.add
        .text(colX, by, this.kindLabel(kind), {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#fcd95c',
          fontStyle: 'bold'
        })
        .setOrigin(0, 0);
      this.listContainer.add(head);
      by += 18;
      for (const slug of grouped[kind].sort()) {
        const def = getItem(slug);
        const name = def?.name ?? slug;
        const count = inv[slug];
        const row = this.add
          .text(colX + 12, by, `${name}  x${count}`, {
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#ffffff'
          })
          .setOrigin(0, 0)
          .setInteractive({ useHandCursor: true });
        row.on('pointerover', () => { row.setColor('#9be36e'); row.setBackgroundColor('#1a3525'); });
        row.on('pointerout', () => { row.setColor('#ffffff'); row.setBackgroundColor(''); });
        row.on('pointerup', () => this.selectItem(slug));
        this.listContainer.add(row);
        by += this.rowHeight;
      }
      by += 6;
    }
    this.maxScrollY = Math.max(0, by - (this.viewportBottom - this.viewportTop));
  }

  private renderDetail(slug: string): void {
    this.detailPanel.removeAll(true);
    const def = getItem(slug);
    if (!def) return;
    const w = 200;
    const bg = this.add.rectangle(0, 0, w, 220, 0x000000, 0.85)
      .setStrokeStyle(2, 0x9be36e)
      .setOrigin(0, 0);
    const title = this.add.text(8, 8, def.name, {
      fontFamily: 'monospace', fontSize: '13px', color: '#9be36e', fontStyle: 'bold',
      wordWrap: { width: w - 16 }
    });
    const kind = this.add.text(8, 30, `Typ: ${this.kindLabel(def.kind)}`, {
      fontFamily: 'monospace', fontSize: '10px', color: '#fcd95c'
    });
    const desc = this.add.text(8, 50, def.description, {
      fontFamily: 'monospace', fontSize: '11px', color: '#ffffff',
      wordWrap: { width: w - 16 }
    });
    const price = this.add.text(8, 160, `Kauf: ${def.buyPrice}c   Verkauf: ${def.sellPrice}c`, {
      fontFamily: 'monospace', fontSize: '10px', color: '#553e2d'
    });
    this.detailPanel.add([bg, title, kind, desc, price]);
    // S-POLISH Run5: Detail-Panel fade-in statt instant
    this.detailPanel.setAlpha(0);
    this.detailPanel.setVisible(true);
    this.tweens.add({ targets: this.detailPanel, alpha: 1, duration: 180, ease: 'Cubic.Out' });
  }

  private selectItem(slug: string): void {
    // this.selectedSlug = slug;
    this.renderDetail(slug);
  }

  private totalCount(inv: Record<string, number>): number {
    return Object.values(inv).reduce((a, b) => a + b, 0);
  }

  private kindLabel(kind: string): string {
    const map: Record<string, string> = {
      seed: 'Samen',
      fertilizer: 'XP-Booster',
      'care-pollen': 'Care-Pollen',
      'tier-pollen': 'Tier-Pollen',
      'soil-upgrade': 'Erde-Upgrade',
      'sun-lamp': 'Sonnenlampe',
      sprinkler: 'Sprinkler',
      'hybrid-booster': 'Hybrid-Booster',
      compost: 'Kompost',
      heal: 'Heilung',
      cure: 'Status-Heilung',
      boost: 'Stat-Boost',
      lure: 'Lockstoff',
      'water-can': 'Wasserkanne',
      other: 'Sonstige'
    };
    return map[kind] ?? kind;
  }

  private scrollBy(dy: number): void {
    this.scrollY = Math.max(0, Math.min(this.maxScrollY, this.scrollY + dy));
    this.listContainer.y = this.viewportTop - this.scrollY;
    this.listContainer.list.forEach((item) => {
      const obj = item as Phaser.GameObjects.Text;
      const absoluteY = this.listContainer.y + obj.y;
      const visible = absoluteY > this.viewportTop - 20 && absoluteY < this.viewportBottom + 4;
      obj.setVisible(visible);
    });
  }
}
