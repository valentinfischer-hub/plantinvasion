import Phaser from 'phaser';
import { gameStore } from '../state/gameState';

/**
 * Wetter-System V0.1: Particle-Overlay fuer Regen, Schnee, Sturm.
 * Wetter wechselt deterministisch pro Game-Tag basierend auf Saison.
 */

export type Weather = 'clear' | 'rain' | 'snow' | 'storm' | 'fog';

interface Particle {
  sprite: Phaser.GameObjects.Rectangle;
  vx: number;
  vy: number;
}

export class WeatherOverlay {
  private scene: Phaser.Scene;
  private uiCam!: Phaser.Cameras.Scene2D.Camera;
  private particles: Particle[] = [];
  private currentWeather: Weather = 'clear';
  private currentDay = -1;
  private weatherText!: Phaser.GameObjects.Text;
  private windOverlay?: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.build();
  }

  private build(): void {
    const cam = this.scene.cameras.main;
    const W = cam.width;
    const H = cam.height;

    this.uiCam = this.scene.cameras.add(0, 0, W, H);
    this.uiCam.setZoom(1);
    this.uiCam.setScroll(0, 0);

    this.windOverlay = this.scene.add.rectangle(0, 0, W, H, 0xffffff, 0).setOrigin(0).setDepth(890).setScrollFactor(0);

    this.weatherText = this.scene.add.text(W - 60, 60, '', {
      fontFamily: 'monospace', fontSize: '9px', color: '#9be36e',
      backgroundColor: '#000000', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2300);

    cam.ignore(this.windOverlay);
    cam.ignore(this.weatherText);
    this.scene.children.list.forEach((obj) => {
      if (obj !== this.windOverlay && obj !== this.weatherText) {
        this.uiCam.ignore(obj);
      }
    });

    this.refreshWeather();
  }

  /** Get deterministic weather for given day-season combo. */
  private rollWeather(): Weather {
    const t = gameStore.getTime();
    const seed = (t.year * 1000 + t.season * 100 + t.day) % 1000;
    const r = (seed * 9301 + 49297) % 233280 / 233280;     // simple lcg
    if (t.season === 3) {
      // Winter: viel Schnee plus Sturm
      if (r < 0.5) return 'snow';
      if (r < 0.7) return 'storm';
      if (r < 0.85) return 'fog';
      return 'clear';
    }
    if (t.season === 0 || t.season === 2) {
      // Spring/Autumn: Regen + Klar
      if (r < 0.3) return 'rain';
      if (r < 0.4) return 'fog';
      if (r < 0.5) return 'storm';
      return 'clear';
    }
    // Sommer: meistens klar
    if (r < 0.15) return 'rain';
    if (r < 0.2) return 'storm';
    return 'clear';
  }

  private refreshWeather(): void {
    const t = gameStore.getTime();
    if (t.day === this.currentDay) return;
    this.currentDay = t.day;
    const newWeather = this.rollWeather();
    if (newWeather !== this.currentWeather) {
      this.changeWeather(newWeather);
    }
  }

  private changeWeather(w: Weather): void {
    // Cleanup alte Partikel
    for (const p of this.particles) p.sprite.destroy();
    this.particles = [];

    this.currentWeather = w;
    this.weatherText.setText(this.weatherIcon(w));

    const cam = this.scene.cameras.main;
    const W = cam.width;
    const H = cam.height;

    if (w === 'rain' || w === 'storm') {
      const count = w === 'storm' ? 80 : 45;
      for (let i = 0; i < count; i++) {
        const sprite = this.scene.add.rectangle(
          Math.random() * W,
          Math.random() * H,
          2, 8,
          0x9bc4e8, 0.6
        ).setOrigin(0.5).setDepth(950).setScrollFactor(0);
        cam.ignore(sprite);
        this.particles.push({ sprite, vx: w === 'storm' ? -4 : -1, vy: w === 'storm' ? 12 : 8 });
      }
      if (this.windOverlay) {
        this.windOverlay.fillColor = 0x223844;
        this.windOverlay.fillAlpha = w === 'storm' ? 0.30 : 0.18;
      }
    } else if (w === 'snow') {
      const count = 60;
      for (let i = 0; i < count; i++) {
        const sprite = this.scene.add.rectangle(
          Math.random() * W,
          Math.random() * H,
          3, 3,
          0xffffff, 0.9
        ).setOrigin(0.5).setDepth(950).setScrollFactor(0);
        cam.ignore(sprite);
        this.particles.push({ sprite, vx: (Math.random() - 0.5) * 1.5, vy: 1.5 + Math.random() * 1.5 });
      }
      if (this.windOverlay) {
        this.windOverlay.fillColor = 0xc8d8e8;
        this.windOverlay.fillAlpha = 0.12;
      }
    } else if (w === 'fog') {
      if (this.windOverlay) {
        this.windOverlay.fillColor = 0xc8c4b8;
        this.windOverlay.fillAlpha = 0.30;
      }
    } else {
      // clear
      if (this.windOverlay) {
        this.windOverlay.fillAlpha = 0;
      }
    }
  }

  public tick(_deltaMs: number): void {
    this.refreshWeather();
    const cam = this.scene.cameras.main;
    const W = cam.width;
    const H = cam.height;
    for (const p of this.particles) {
      p.sprite.x += p.vx;
      p.sprite.y += p.vy;
      if (p.sprite.y > H) p.sprite.y = -10;
      if (p.sprite.x < -10) p.sprite.x = W + 10;
      if (p.sprite.x > W + 10) p.sprite.x = -10;
    }
  }

  private weatherIcon(w: Weather): string {
    switch (w) {
      case 'rain': return 'Regen';
      case 'snow': return 'Schnee';
      case 'storm': return 'Sturm';
      case 'fog': return 'Nebel';
      default: return 'Klar';
    }
  }

  /**
   * Aktuelles Wetter, von externen Systemen lesbar (Encounter-Modifier S-09 D.o.D. #4).
   */
  public getCurrentWeather(): Weather {
    return this.currentWeather;
  }

  public destroy(): void {
    for (const p of this.particles) p.sprite.destroy();
    this.weatherText?.destroy();
    this.windOverlay?.destroy();
    if (this.uiCam) this.scene.cameras.remove(this.uiCam);
  }
}
