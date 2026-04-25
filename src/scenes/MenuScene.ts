import Phaser from 'phaser';
import { loadGame, resetGame } from '../state/storage';
import { startAmbientBGM, sfx } from '../audio/sfxGenerator';

/**
 * Start-Screen mit Title und Continue/New-Game/Settings.
 * Wird als erste Scene geladen.
 */
export class MenuScene extends Phaser.Scene {

  constructor() {
    super('MenuScene');
  }

  public create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#1a2820');

    // Decorative: simple plant-icon
    const cx = width / 2;
    const plantY = 80;
    const stem = this.add.rectangle(cx, plantY + 30, 4, 30, 0x4a8228).setOrigin(0.5);
    const leaf1 = this.add.ellipse(cx - 14, plantY + 18, 22, 12, 0x6abf3a).setRotation(-0.3);
    const leaf2 = this.add.ellipse(cx + 14, plantY + 24, 22, 12, 0x6abf3a).setRotation(0.3);
    const flower = this.add.circle(cx, plantY, 14, 0xff7eb8).setStrokeStyle(2, 0x000000);
    const flowerCenter = this.add.circle(cx, plantY, 5, 0xfcd95c);
    void stem; void leaf1; void leaf2; void flower; void flowerCenter;

    // Title
    const _title = this.add.text(cx, plantY + 75, 'Plantinvasion', {
      fontFamily: 'monospace', fontSize: '36px', color: '#9be36e'
    }).setOrigin(0.5);
    const _subtitle = this.add.text(cx, plantY + 110, 'Cozy Botanik-RPG', {
      fontFamily: 'monospace', fontSize: '12px', color: '#8a6e4a'
    }).setOrigin(0.5);

    const save = loadGame();

    let by = plantY + 170;
    if (save) {
      void this.makeButton(cx, by, 'Weiterspielen', '#9be36e', () => {
        sfx.dialogAdvance();
        startAmbientBGM();
        const target = save.overworld?.lastSceneVisited ?? 'OverworldScene';
        this.scene.start(target);
      });
      by += 60;
    }
    const _newGameBtn = this.makeButton(cx, by, save ? 'Neues Spiel' : 'Spiel starten', '#fcd95c', () => {
      if (save) {
        // Confirm (simpler: just do it, V0.3 add confirm-dialog)
        resetGame();
      }
      sfx.dialogAdvance();
      startAmbientBGM();
      this.scene.start('OverworldScene');
    });
    by += 60;

    const _hint = this.add.text(cx, height - 24, 'v0.2 - Brave Browser empfohlen', {
      fontFamily: 'monospace', fontSize: '10px', color: '#553e2d'
    }).setOrigin(0.5);
    void _hint; void _title; void _subtitle; void _newGameBtn;
  }

  private makeButton(x: number, y: number, label: string, accent: string, onClick: () => void): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    const w = 220;
    const h = 44;
    const bg = this.add.rectangle(0, 0, w, h, 0x000000, 0.65).setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(accent).color).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const txt = this.add.text(0, 0, label, {
      fontFamily: 'monospace', fontSize: '14px', color: accent
    }).setOrigin(0.5);
    bg.on('pointerdown', () => { bg.setFillStyle(Phaser.Display.Color.HexStringToColor(accent).color, 0.4); });
    bg.on('pointerup', () => { bg.setFillStyle(0x000000, 0.65); onClick(); });
    bg.on('pointerout', () => { bg.setFillStyle(0x000000, 0.65); });
    c.add([bg, txt]);
    return c;
  }
}
