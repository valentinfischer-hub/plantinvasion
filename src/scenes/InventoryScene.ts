import Phaser from 'phaser';
import { gameStore } from '../state/gameState';
import { getItem } from '../data/items';
import { t } from '../i18n/index';

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
  private selectedSlug: string | null = null;
  private cardBgMap: Map<string, Phaser.GameObjects.Rectangle> = new Map();

  constructor() {
    super('InventoryScene');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#1a2820');
    this.viewportBottom = height - 60;

    this.add
      .text(width / 2, 30, t('inv.title'), {
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
      .text(width / 2, this.viewportBottom + 4, t('inv.hint'), {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#553e2d'
      })
      .setOrigin(0.5, 0);

    // Back-Button
    const backY = height - 24;
    const backBg = this.add
      // S-POLISH Run18: 44px Touch-Target Back-Button
      .rectangle(width / 2, backY, 160, 44, 0x000000, 0.7)
      .setStrokeStyle(1, 0x9be36e)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(width / 2, backY, t('inv.back'), {
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

  /**
   * B4-R3: Verbessertes Grid-Layout.
   * Items nach Kategorie gruppiert, Card-Raster mit Item-Count-Badge,
   * leere Slots als gestrichelte Platzhalter.
   */
  private renderList(): void {
    this.cardBgMap = new Map();
    this.listContainer.removeAll(true);
    const inv = gameStore.getInventory();
    const slugs = Object.keys(inv).filter((s) => (inv[s] ?? 0) > 0);
    this.headerText.setText(`${slugs.length} Item-Typen   |   ${this.totalCount(inv)} Items gesamt`);

    if (slugs.length === 0) {
      const empty = this.add.text(this.scale.width / 2, 20,
        '(Inventar leer — kaufe Items im Markt oder finde sie als Forage-Drop)', {
          fontFamily: 'monospace', fontSize: '12px', color: '#553e2d',
          wordWrap: { width: this.scale.width - 80 }
        }).setOrigin(0.5, 0);
      this.listContainer.add(empty);
      // Leere Slot-Platzhalter zeigen
      this.drawEmptySlots(40, 20);
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
    const kindOrder: string[] = [
      'seed', 'fertilizer', 'care-pollen', 'tier-pollen', 'soil-upgrade',
      'sun-lamp', 'sprinkler', 'hybrid-booster', 'compost',
      'heal', 'cure', 'boost', 'lure', 'water-can'
    ];
    const sortedKinds = Object.keys(grouped).sort((a, b) => {
      const ia = kindOrder.indexOf(a);
      const ib = kindOrder.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    const { width } = this.scale;
    const cardW = 70;
    const cardH = 54;
    const cardsPerRow = Math.floor((width - 32) / (cardW + 8));
    let by = 0;

    for (const kind of sortedKinds) {
      // Kategorie-Header
      const head = this.add.text(16, by, this.kindLabel(kind), {
        fontFamily: 'monospace', fontSize: '11px', color: '#fcd95c', fontStyle: 'bold'
      }).setOrigin(0, 0);
      this.listContainer.add(head);
      by += 18;

      // Item-Cards in Raster
      const items = grouped[kind].sort();
      items.forEach((slug, idx) => {
        const col = idx % cardsPerRow;
        const row = Math.floor(idx / cardsPerRow);
        const cx = 16 + col * (cardW + 8) + cardW / 2;
        const cy = by + row * (cardH + 8) + cardH / 2;
        this.drawItemCard(slug, cx, cy, cardW, cardH, inv[slug] ?? 0);
      });

      const rows = Math.ceil(items.length / cardsPerRow);
      by += rows * (cardH + 8) + 10;
    }
    this.maxScrollY = Math.max(0, by - (this.viewportBottom - this.viewportTop));
  }

  /**
   * B4-R3: Item-Card mit Count-Badge (Stardew-Stil).
   */
  private drawItemCard(
    slug: string, cx: number, cy: number, cardW: number, cardH: number, count: number
  ): void {
    const def = getItem(slug);
    const name = def?.name ?? slug;
    const shortName = name.length > 9 ? name.substring(0, 9) + '.' : name;

    // Karten-Hintergrund
    const cardBg = this.add.rectangle(cx, cy, cardW, cardH, 0x1a3525, 0.85)
      .setStrokeStyle(1, 0x3a5a3a)
      .setInteractive({ useHandCursor: true });

    // Name
    const nameTxt = this.add.text(cx, cy - 8, shortName, {
      fontFamily: 'monospace', fontSize: '9px', color: '#dddddd'
    }).setOrigin(0.5);

    // Count-Badge oben-rechts (Stardew-Stil)
    const badgeBg = this.add.rectangle(cx + cardW / 2 - 10, cy - cardH / 2 + 10, 20, 14, 0x2a2a2a, 0.9)
      .setStrokeStyle(1, 0x9be36e);
    const badgeTxt = this.add.text(cx + cardW / 2 - 10, cy - cardH / 2 + 10, `${count}`, {
      fontFamily: 'monospace', fontSize: '9px', color: '#9be36e'
    }).setOrigin(0.5);

    // Kind-Farbstreifen unten
    const kindColor = this.kindColor(def?.kind ?? 'other');
    const stripe = this.add.rectangle(cx, cy + cardH / 2 - 5, cardW, 10, kindColor, 0.6);

    // Hover-Effekt
    cardBg.on('pointerover', () => {
      cardBg.setStrokeStyle(2, 0x9be36e);
      cardBg.setFillStyle(0x2a4a35, 0.95);
      nameTxt.setColor('#9be36e');
    });
    cardBg.on('pointerout', () => {
      cardBg.setStrokeStyle(1, 0x3a5a3a);
      cardBg.setFillStyle(0x1a3525, 0.85);
      nameTxt.setColor('#dddddd');
    });
    this.cardBgMap.set(slug, cardBg);
    cardBg.on('pointerup', () => this.selectItem(slug));

    [cardBg, stripe, nameTxt, badgeBg, badgeTxt].forEach((o) => this.listContainer.add(o));
  }

  /**
   * B4-R3: Leere Slot-Platzhalter (gestrichelte Rahmen).
   */
  private drawEmptySlots(startX: number, startY: number): void {
    const cardW = 70;
    const cardH = 54;
    const cardsPerRow = Math.floor((this.scale.width - 32) / (cardW + 8));
    const totalEmpty = cardsPerRow * 2;
    for (let i = 0; i < totalEmpty; i++) {
      const col = i % cardsPerRow;
      const row = Math.floor(i / cardsPerRow);
      const cx = startX + col * (cardW + 8) + cardW / 2;
      const cy = startY + row * (cardH + 8) + cardH / 2;
      const slot = this.add.rectangle(cx, cy, cardW, cardH, 0x000000, 0.0)
        .setStrokeStyle(1, 0x333333);
      // Gestrichelte Optik per kurze Linie-Elemente
      const dash1 = this.add.text(cx, cy, '- - -', {
        fontFamily: 'monospace', fontSize: '8px', color: '#333333'
      }).setOrigin(0.5);
      this.listContainer.add(slot);
      this.listContainer.add(dash1);
    }
  }

  /** B4-R3: Farbe pro Item-Kind fuer den Karten-Streifen */
  private kindColor(kind: string): number {
    const map: Record<string, number> = {
      seed: 0x4caf50,
      fertilizer: 0x8bc34a,
      'care-pollen': 0xffeb3b,
      'tier-pollen': 0xff9800,
      'soil-upgrade': 0x795548,
      'sun-lamp': 0xffc107,
      sprinkler: 0x2196f3,
      'hybrid-booster': 0xb86ee3,
      compost: 0x6d4c41,
      heal: 0xe91e63,
      cure: 0x9c27b0,
      boost: 0x00bcd4,
      lure: 0xff5722,
      'water-can': 0x03a9f4,
    };
    return map[kind] ?? 0x607d8b;
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
    if (this.selectedSlug && this.cardBgMap.has(this.selectedSlug)) {
      const prev = this.cardBgMap.get(this.selectedSlug)!;
      prev.setStrokeStyle(1, 0x3a5a3a); prev.setFillStyle(0x1a3525, 0.85);
    }
    this.selectedSlug = slug;
    const cur = this.cardBgMap.get(slug);
    if (cur) { cur.setStrokeStyle(2, 0xfcd95c); cur.setFillStyle(0x2a4535, 0.95); }
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
