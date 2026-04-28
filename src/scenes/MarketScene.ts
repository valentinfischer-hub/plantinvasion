import Phaser from 'phaser';
import { gameStore } from '../state/gameState';
import { ITEMS, type ItemDef } from '../data/items';
import { sfx } from '../audio/sfxGenerator';

/**
 * Markt-UI mit Buy/Sell-Liste.
 * Aufgerufen von OverworldScene wenn Spieler mit Markt-NPC redet.
 */
export class MarketScene extends Phaser.Scene {
  private mode: 'buy' | 'sell' | 'roster' = 'roster';
  private listContainer!: Phaser.GameObjects.Container;
  private coinsText!: Phaser.GameObjects.Text;
  private modeButton!: Phaser.GameObjects.Container;

  constructor() {
    super('MarketScene');
  }

  private modeLabel(): string {
    if (this.mode === 'roster') return 'Modus: Tagesangebot';
    if (this.mode === 'buy') return 'Modus: Kaufen (alle)';
    return 'Modus: Verkaufen';
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#1a2820');

    this.add.text(width / 2, 30, 'Anyas Markt', {
      fontFamily: 'monospace', fontSize: '20px', color: '#fcd95c'
    }).setOrigin(0.5);

    this.coinsText = this.add.text(width / 2, 56, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#9be36e'
    }).setOrigin(0.5);
    this.updateCoinsText();

    // Mode-Toggle
    this.modeButton = this.makeButton(width / 2, 88, this.modeLabel(), '#9be36e', () => {
      this.mode = this.mode === 'roster' ? 'buy' : (this.mode === 'buy' ? 'sell' : 'roster');
      this.refreshList();
    });

    this.listContainer = this.add.container(0, 0);
    this.refreshList();

    // Back-Button
    const backY = height - 30;
    this.makeButton(width / 2, backY, 'Zurueck (B)', '#fcd95c', () => this.scene.start('OverworldScene'));
    if (this.input.keyboard) {
      const backKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
      backKey.on('down', () => this.scene.start('OverworldScene'));
      const escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      escKey.on('down', () => this.scene.start('OverworldScene'));
    }
  }

  private updateCoinsText(): void {
    const state = gameStore.get();
    this.coinsText.setText(`${state.coins} Gold`);
  }

  private refreshList(): void {
    const { width } = this.scale;
    this.listContainer.removeAll(true);
    const inv = gameStore.getInventory();

    // Update mode-Button-Text
    const modeText = this.modeButton.getAt(1) as Phaser.GameObjects.Text;
    if (modeText && modeText.setText) {
      modeText.setText(this.modeLabel());
    }

    let listToShow: ItemDef[];
    if (this.mode === 'roster') {
      const roster = gameStore.getMarketShopRoster();
      const slugs = new Set<string>([...roster.seedSlugs, ...roster.boosterSlugs, 'soil-bronze', 'soil-silver', 'soil-gold']);
      listToShow = ITEMS.filter((i) => slugs.has(i.slug));
    } else if (this.mode === 'buy') {
      listToShow = ITEMS;
    } else {
      // Nur Items die wir haben
      listToShow = ITEMS.filter((i) => (inv[i.slug] ?? 0) > 0);
    }

    let by = 130;
    for (const item of listToShow) {
      const have = inv[item.slug] ?? 0;
      const isBuy = this.mode === 'buy' || this.mode === 'roster';
      const price = isBuy ? item.buyPrice : item.sellPrice;
      const action = isBuy ? 'Kaufen' : 'Verkaufen';

      const row = this.add.container(width / 2, by);
      const bg = this.add.rectangle(0, 0, width - 40, 36, 0x000000, 0.5)
        .setStrokeStyle(1, 0x8a6e4a);
      const nameTxt = this.add.text(-(width - 40) / 2 + 10, -8, item.name, {
        fontFamily: 'monospace', fontSize: '12px', color: '#ffffff'
      });
      const detailTxt = this.add.text(-(width - 40) / 2 + 10, 6, `Bestand: ${have}  Preis: ${price}`, {
        fontFamily: 'monospace', fontSize: '10px', color: '#8a6e4a'
      });
      const buyBtn = this.add.text((width - 40) / 2 - 70, 0, action, {
        fontFamily: 'monospace', fontSize: '11px', color: isBuy ? '#9be36e' : '#fcd95c',
        backgroundColor: '#222222', padding: { x: 6, y: 4 }
      }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
      buyBtn.on('pointerup', () => this.tryTransaction(item));
      // S-POLISH-09b: Row Hover-Glow
      bg.setInteractive({ useHandCursor: false });
      bg.on('pointerover', () => { bg.setStrokeStyle(2, 0xc9a96a); });
      bg.on('pointerout', () => { bg.setStrokeStyle(1, 0x8a6e4a); });
      buyBtn.on('pointerover', () => { buyBtn.setAlpha(0.75); });
      buyBtn.on('pointerout', () => { buyBtn.setAlpha(1.0); });
      row.add([bg, nameTxt, detailTxt, buyBtn]);
      this.listContainer.add(row);
      by += 42;
    }

    if (listToShow.length === 0) {
      this.listContainer.add(
        this.add.text(width / 2, by, 'Keine Items verfuegbar.', {
          fontFamily: 'monospace', fontSize: '12px', color: '#8a6e4a'
        }).setOrigin(0.5)
      );
    }
  }

  private tryTransaction(item: ItemDef): void {
    if (this.mode === 'buy' || this.mode === 'roster') {
      const ok = gameStore.spendCoins(item.buyPrice);
      if (!ok) {
        sfx.bump();
        return;
      }
      gameStore.addItem(item.slug);
      sfx.pickup();
    } else {
      const has = gameStore.consumeItem(item.slug);
      if (!has) return;
      gameStore.addCoins(item.sellPrice);
      sfx.dialogAdvance();
    }
    this.updateCoinsText();
    this.refreshList();
  }

  private makeButton(x: number, y: number, label: string, color: string, onClick: () => void): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    const w = 220;
    const h = 32;
    const bg = this.add.rectangle(0, 0, w, h, 0x000000, 0.6)
      .setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(color).color)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    const txt = this.add.text(0, 0, label, {
      fontFamily: 'monospace', fontSize: '12px', color
    }).setOrigin(0.5);
    // S-POLISH-09b: Button Hover-State
    const colorVal = Phaser.Display.Color.HexStringToColor(color).color;
    bg.on('pointerover', () => {
      this.tweens.add({ targets: c, scale: 1.04, duration: 100, ease: 'Cubic.Out' });
      bg.setStrokeStyle(2, colorVal);
    });
    bg.on('pointerout', () => {
      this.tweens.add({ targets: c, scale: 1.0, duration: 100, ease: 'Cubic.Out' });
      bg.setStrokeStyle(1, colorVal);
    });
    bg.on('pointerup', onClick);
    c.add([bg, txt]);
    return c;
  }
}
