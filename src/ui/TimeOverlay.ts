import Phaser from 'phaser';
import { gameStore } from '../state/gameState';

/**
 * Day-Night-Cycle Overlay:
 * - HUD-Element oben rechts mit Tageszeit, Saison, Tag-Counter
 * - Color-Tint je Tageszeit als Phaser-Camera-Tint oder Rectangle-Overlay
 * - Tickt Game-Time im update()
 */

export class TimeOverlay {
  private scene: Phaser.Scene;
  private uiCam!: Phaser.Cameras.Scene2D.Camera;
  private container!: Phaser.GameObjects.Container;
  private timeText!: Phaser.GameObjects.Text;
  private dateText!: Phaser.GameObjects.Text;
  private tintRect!: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.build();
  }

  private build(): void {
    const cam = this.scene.cameras.main;
    const W = cam.width;
    const H = cam.height;

    // UI-Camera
    this.uiCam = this.scene.cameras.add(0, 0, W, H);
    this.uiCam.setZoom(1);
    this.uiCam.setScroll(0, 0);

    // Tint-Overlay (volles Viewport, semi-transparent)
    this.tintRect = this.scene.add.rectangle(0, 0, W, H, 0x000000, 0).setOrigin(0).setDepth(900);
    this.tintRect.setScrollFactor(0);

    // HUD oben-rechts
    const hudW = 130;
    const hudH = 36;
    const hudX = W - hudW / 2 - 8;
    const hudY = 24;
    this.container = this.scene.add.container(hudX, hudY).setDepth(2300);

    const bg = this.scene.add.rectangle(0, 0, hudW, hudH, 0x000000, 0.7)
      .setStrokeStyle(1, 0xfcd95c);
    this.timeText = this.scene.add.text(0, -8, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#fcd95c'
    }).setOrigin(0.5);
    this.dateText = this.scene.add.text(0, 6, '', {
      fontFamily: 'monospace', fontSize: '9px', color: '#9be36e'
    }).setOrigin(0.5);
    this.container.add([bg, this.timeText, this.dateText]);

    // Camera-Routing: Main-Cam ignoriert HUD und Tint, UI-Cam zeigt nur HUD und Tint
    cam.ignore(this.container);
    cam.ignore(this.tintRect);
    this.scene.children.list.forEach((obj) => {
      if (obj !== this.container && obj !== this.tintRect) {
        this.uiCam.ignore(obj);
      }
    });

    this.refresh();
  }

  /** Im OverworldScene.update aufrufen mit delta. */
  public tick(deltaMs: number): void {
    gameStore.tickGameTime(deltaMs * 60);    // 1 real-sec = 60 game-min, 1 game-day = 24 real-min
    this.refresh();
  }

  private refresh(): void {
    const phase = gameStore.getTimeOfDay();
    const time = gameStore.formatTime();
    const t = gameStore.getTime();
    this.timeText.setText(`${time}  ${this.phaseIcon(phase)}`);
    this.dateText.setText(`${gameStore.getSeasonName()} Tag ${t.day}`);

    // Tint-Color je Phase
    let color = 0x000000;
    let alpha = 0;
    switch (phase) {
      case 'morning': color = 0xffd4a0; alpha = 0.10; break;     // warm
      case 'day': color = 0xffffff; alpha = 0.0; break;
      case 'evening': color = 0xff8c4a; alpha = 0.18; break;     // sunset orange
      case 'night': color = 0x1a2858; alpha = 0.45; break;       // deep blue
    }
    this.tintRect.fillColor = color;
    this.tintRect.fillAlpha = alpha;
  }

  private phaseIcon(phase: string): string {
    switch (phase) {
      case 'morning': return '*';
      case 'day': return 'O';
      case 'evening': return '~';
      case 'night': return 'C';
      default: return '';
    }
  }

  public destroy(): void {
    this.container?.destroy();
    this.tintRect?.destroy();
    if (this.uiCam) this.scene.cameras.remove(this.uiCam);
  }
}
