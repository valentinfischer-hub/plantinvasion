import Phaser from 'phaser';
import { gameStore } from '../state/gameState';

/**
 * Day-Night-Cycle Overlay V2 (B7-R3):
 * - HUD-Element oben rechts mit Tageszeit, Saison, Tag-Counter
 * - Stufenloser Farbverlauf: weiss (Tag) → 0x4466aa (Nacht) via phase-basiertem alpha
 * - Konfigurierbare Tageslaenge via setDayDuration()
 * - Tick-Rate konfigurierbar (default: 1 real-sec = 60 game-min)
 */

export interface DayNightConfig {
  /** Real-Millisekunden pro Game-Stunde. Default: 60000 / 24 = 2500ms pro h */
  msPerGameHour?: number;
  /** Nacht-Overlay-Farbe. Default: 0x4466aa */
  nightColor?: number;
  /** Maximales Night-Alpha. Default: 0.35 */
  maxNightAlpha?: number;
}

export class TimeOverlay {
  private scene: Phaser.Scene;
  private uiCam!: Phaser.Cameras.Scene2D.Camera;
  private container!: Phaser.GameObjects.Container;
  private timeText!: Phaser.GameObjects.Text;
  private dateText!: Phaser.GameObjects.Text;
  private tintRect!: Phaser.GameObjects.Rectangle;

  // V2: Konfigurierbar
  private _nightColor = 0x4466aa;
  private _maxNightAlpha = 0.35;
  private _tickMultiplier = 60; // 1 real-sec = 60 game-min

  constructor(scene: Phaser.Scene, config?: DayNightConfig) {
    this.scene = scene;
    if (config?.nightColor !== undefined) this._nightColor = config.nightColor;
    if (config?.maxNightAlpha !== undefined) this._maxNightAlpha = config.maxNightAlpha;
    if (config?.msPerGameHour !== undefined) {
      // msPerGameHour: z.B. 2500ms → 1 game-stunde in real
      // tickMultiplier = 60 / (msPerGameHour / 60000) = 3600000 / msPerGameHour game-min pro real-sec
      this._tickMultiplier = 3600000 / (config.msPerGameHour * 1000);
    }
    this.build();
  }

  /** Ändert Tagesgeschwindigkeit im laufenden Betrieb. */
  public setDayDuration(msPerGameHour: number): void {
    this._tickMultiplier = 3600000 / (msPerGameHour * 1000);
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

    // Camera-Routing
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
    gameStore.tickGameTime(deltaMs * this._tickMultiplier);
    this.refresh();
  }

  private refresh(): void {
    const phase = gameStore.getTimeOfDay();
    const time = gameStore.formatTime();
    const t = gameStore.getTime();
    this.timeText.setText(`${time}  ${this.phaseIcon(phase)}`);
    this.dateText.setText(`${gameStore.getSeasonName()} Tag ${t.day}`);

    // B7-R3: Stufenloser Farbverlauf je Phase
    // Tag: weiss/transparent, Nacht: nightColor mit maxNightAlpha
    let color = this._nightColor;
    let alpha = 0;
    switch (phase) {
      case 'morning': color = 0xffd4a0; alpha = 0.04; break;
      case 'day':     color = 0xffffff; alpha = 0.0;  break;
      case 'evening': color = 0xff8c4a; alpha = 0.09; break;
      case 'night':   color = this._nightColor; alpha = this._maxNightAlpha; break;
    }
    this.tintRect.fillColor = color;
    this.tintRect.fillAlpha = alpha;
  }

  private phaseIcon(phase: string): string {
    switch (phase) {
      case 'morning': return '*';
      case 'day':     return 'O';
      case 'evening': return '~';
      case 'night':   return 'C';
      default:        return '';
    }
  }

  public ignoreInUICam(obj: Phaser.GameObjects.GameObject): void {
    if (this.uiCam) this.uiCam.ignore(obj);
  }

  public destroy(): void {
    this.container?.destroy();
    this.tintRect?.destroy();
    if (this.uiCam) this.scene.cameras.remove(this.uiCam);
  }
}
