import Phaser from 'phaser';
import { gameStore } from '../state/gameState';

/**
 * Ambient-Particles V0.1 (2026-04-25).
 * Atmosphaerische Partikel je nach Tageszeit/Saison/Wetter:
 * - Nacht: kleine gelbe Firefly-Punkte schweben
 * - Winter: weiss-blaue Schnee-Flocken fallen
 * - Regen: blaue Tropfen
 *
 * Sehr lightweight, kein echtes ParticleEmitter, nur ein paar Sprites
 * mit eigenem Tween. Reagiert auf TimeOverlay-Phase.
 */
type ParticleMode = 'night' | 'snow' | 'rain' | 'none';

export class AmbientParticles {
  private scene: Phaser.Scene;
  private uiCam!: Phaser.Cameras.Scene2D.Camera;
  private particles: Phaser.GameObjects.Rectangle[] = [];
  private currentMode: ParticleMode = 'none';

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const cam = scene.cameras.main;
    this.uiCam = scene.cameras.add(0, 0, cam.width, cam.height);
    this.uiCam.setZoom(1);
    this.uiCam.setScroll(0, 0);
    cam.ignore(this.particles);
    scene.children.list.forEach((obj) => this.uiCam.ignore(obj));
  }

  public update(weather: string): void {
    const time = gameStore.getTime();
    const phase = gameStore.getTimeOfDay?.() ?? 'day';
    const season = time.season;
    let mode: ParticleMode = 'none';
    if (weather === 'snow' || season === 3) mode = 'snow';
    else if (weather === 'rain' || weather === 'storm') mode = 'rain';
    else if (phase === 'night') mode = 'night';
    if (mode !== this.currentMode) {
      this.currentMode = mode;
      this.rebuild();
    }
  }

  private rebuild(): void {
    for (const p of this.particles) p.destroy();
    this.particles = [];
    if (this.currentMode === 'none') return;
    const cam = this.scene.cameras.main;
    const W = cam.width;
    const H = cam.height;
    const count = this.currentMode === 'snow' ? 30 : this.currentMode === 'rain' ? 50 : 14;
    const color = this.currentMode === 'snow' ? 0xffffff : this.currentMode === 'rain' ? 0x77b0ff : 0xfff0a0;
    for (let i = 0; i < count; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const size = this.currentMode === 'rain' ? 1 : 2;
      const p = this.scene.add.rectangle(x, y, size, size, color, this.currentMode === 'night' ? 0.85 : 0.7)
        .setScrollFactor(0)
        .setDepth(950);
      this.particles.push(p);
      this.scene.cameras.main.ignore(p);
      const fall = this.currentMode === 'snow' ? 30 + Math.random() * 30 : this.currentMode === 'rain' ? 80 + Math.random() * 60 : 5 + Math.random() * 8;
      const drift = this.currentMode === 'rain' ? 0 : (Math.random() - 0.5) * 20;
      const dur = (H / fall) * 1000;
      this.scene.tweens.add({
        targets: p,
        y: H + 8,
        x: x + drift * 4,
        duration: dur,
        repeat: -1,
        delay: Math.random() * dur,
        onRepeat: () => { p.x = Math.random() * W; p.y = -8; }
      });
      if (this.currentMode === 'night') {
        // Fireflies blinken
        this.scene.tweens.add({
          targets: p,
          alpha: { from: 0.2, to: 1 },
          duration: 800 + Math.random() * 800,
          yoyo: true,
          repeat: -1
        });
      }
    }
  }

  public ignoreInUICam(obj: Phaser.GameObjects.GameObject): void {
    this.uiCam?.ignore(obj);
  }

  public destroy(): void {
    for (const p of this.particles) p.destroy();
    if (this.uiCam) this.scene.cameras.remove(this.uiCam);
  }
}
