import Phaser from 'phaser';
import { gameStore } from '../state/gameState';
import { setMasterVolume, getMasterVolume, sfx, stopAmbientBGM, startAmbientBGM } from '../audio/sfxGenerator';

/**
 * Settings-Scene V0.1 (2026-04-25).
 * Volume-Slider, Save-Reset, Layout-Hint.
 * Aufruf via MenuScene-Button oder spaeter Esc-Pause-Menu.
 */
export class SettingsScene extends Phaser.Scene {
  private volumeBarFill!: Phaser.GameObjects.Rectangle;
  private volumeText!: Phaser.GameObjects.Text;
  private bgmEnabled = true;
  private bgmStatusText!: Phaser.GameObjects.Text;

  constructor() {
    super('SettingsScene');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#1a2820');

    this.add
      .text(width / 2, 40, 'Einstellungen', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#9be36e'
      })
      .setOrigin(0.5);

    let by = 100;
    // Volume-Slider
    this.add.text(width / 2 - 150, by, 'Lautstaerke', {
      fontFamily: 'monospace', fontSize: '13px', color: '#fcd95c'
    });
    by += 24;
    const barW = 300;
    const barH = 20;
    const barX = width / 2 - barW / 2;
    const barBg = this.add
      .rectangle(barX, by, barW, barH, 0x000000, 0.6)
      .setStrokeStyle(1, 0x553e2d)
      .setOrigin(0, 0)
      .setInteractive(new Phaser.Geom.Rectangle(0, 0, barW, barH), Phaser.Geom.Rectangle.Contains);
    this.volumeBarFill = this.add
      .rectangle(barX, by, barW * getMasterVolume(), barH, 0x9be36e, 0.85)
      .setOrigin(0, 0);
    this.volumeText = this.add
      .text(width / 2, by + barH + 14, `${Math.round(getMasterVolume() * 100)}%`, {
        fontFamily: 'monospace', fontSize: '12px', color: '#ffffff'
      })
      .setOrigin(0.5, 0);
    barBg.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const localX = p.x - barX;
      this.setVolume(Math.max(0, Math.min(1, localX / barW)));
    });
    barBg.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!p.isDown) return;
      const localX = p.x - barX;
      this.setVolume(Math.max(0, Math.min(1, localX / barW)));
    });

    by += 60;
    // BGM Toggle
    this.add.text(width / 2 - 150, by, 'Hintergrundmusik', {
      fontFamily: 'monospace', fontSize: '13px', color: '#fcd95c'
    });
    by += 24;
    this.bgmStatusText = this.add.text(width / 2, by, this.bgmEnabled ? 'AN' : 'AUS', {
      fontFamily: 'monospace', fontSize: '13px', color: this.bgmEnabled ? '#9be36e' : '#ff7e7e'
    }).setOrigin(0.5, 0);
    const bgmToggle = this.makeButton(width / 2, by + 30, 'BGM umschalten', '#fcd95c', () => this.toggleBGM());
    void bgmToggle;

    by += 80;
    // Layout-Info
    const layout = (globalThis as { __layout?: string }).__layout || 'unknown';
    this.add.text(width / 2, by, `Layout: ${layout}`, {
      fontFamily: 'monospace', fontSize: '11px', color: '#553e2d'
    }).setOrigin(0.5, 0);
    by += 16;
    this.add.text(width / 2, by, '(Window-Resize beim Reload aendert das Layout)', {
      fontFamily: 'monospace', fontSize: '9px', color: '#553e2d'
    }).setOrigin(0.5, 0);

    by += 50;
    // Save-Reset (mit Bestaetigung)
    const _resetBtn = this.makeButton(width / 2, by, 'Spielstand loeschen', '#ff7e7e', () => this.confirmReset());
    void _resetBtn;

    by += 60;
    // Save-Info
    const save = gameStore.get();
    this.add.text(width / 2, by, `Spielstand: v${save.version ?? '?'}   Coins: ${save.coins}   Pflanzen: ${save.plants.length}`, {
      fontFamily: 'monospace', fontSize: '10px', color: '#9be36e'
    }).setOrigin(0.5, 0);

    // Back
    const backY = height - 30;
    const _backBtn = this.makeButton(width / 2, backY, 'Zurueck (Esc)', '#9be36e', () => this.back());
    void _backBtn;
    if (this.input.keyboard) {
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => this.back());
    }
  }

  private back(): void {
    sfx.dialogAdvance();
    this.scene.start('MenuScene');
  }

  private setVolume(v: number): void {
    setMasterVolume(v);
    this.volumeBarFill.width = 300 * v;
    this.volumeText.setText(`${Math.round(v * 100)}%`);
    sfx.click();
  }

  private toggleBGM(): void {
    this.bgmEnabled = !this.bgmEnabled;
    if (this.bgmEnabled) startAmbientBGM();
    else stopAmbientBGM();
    this.bgmStatusText.setText(this.bgmEnabled ? 'AN' : 'AUS');
    this.bgmStatusText.setColor(this.bgmEnabled ? '#9be36e' : '#ff7e7e');
    sfx.click();
  }

  private confirmReset(): void {
    // Zeige Bestaetigungs-Dialog inline
    const { width, height } = this.scale;
    const overlay = this.add.rectangle(width / 2, height / 2, 360, 180, 0x000000, 0.95)
      .setStrokeStyle(2, 0xff7e7e)
      .setDepth(2000);
    const text = this.add.text(width / 2, height / 2 - 30, 'Spielstand wirklich loeschen?\n\nAlle Pflanzen, Items, Achievements\nund Story-Fortschritt gehen verloren!', {
      fontFamily: 'monospace', fontSize: '11px', color: '#ffffff', align: 'center'
    }).setOrigin(0.5).setDepth(2001);
    const yesBtn = this.makeButton(width / 2 - 80, height / 2 + 50, 'Ja, loeschen', '#ff7e7e', () => {
      gameStore.resetToNewGame();
      sfx.click();
      overlay.destroy();
      text.destroy();
      yesBtn.destroy();
      noBtn.destroy();
      this.scene.start('MenuScene');
    });
    yesBtn.setDepth(2001);
    const noBtn = this.makeButton(width / 2 + 80, height / 2 + 50, 'Abbrechen', '#9be36e', () => {
      overlay.destroy();
      text.destroy();
      yesBtn.destroy();
      noBtn.destroy();
    });
    noBtn.setDepth(2001);
  }

  private makeButton(x: number, y: number, label: string, accent: string, onClick: () => void): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    const w = 160;
    const h = 32;
    const bg = this.add.rectangle(0, 0, w, h, 0x000000, 0.7)
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(accent).color)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    const txt = this.add.text(0, 0, label, {
      fontFamily: 'monospace', fontSize: '11px', color: accent
    }).setOrigin(0.5);
    bg.on('pointerup', () => { sfx.click(); onClick(); });
    c.add([bg, txt]);
    return c;
  }
}
