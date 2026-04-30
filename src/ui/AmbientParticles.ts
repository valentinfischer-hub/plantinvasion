import Phaser from 'phaser';
import { gameStore } from '../state/gameState';

/**
 * Ambient-Particles V0.2 (2026-04-29 D-041 R26).
 * Atmosphaerische Partikel je nach Tageszeit/Saison/Wetter:
 * - Tag/Morgen/Nachmittag: gruenlich-gelbe Pollen schweben aufwaerts
 * - Nacht: kleine gelbe Firefly-Punkte schweben
 * - Winter: weiss-blaue Schnee-Flocken fallen
 * - Regen: blaue Tropfen
 */
type ParticleMode = 'day' | 'night' | 'snow' | 'rain' | 'none';

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
    else if ((phase as string) === 'night') mode = 'night';
    else if (phase === 'day' || (phase as string) === 'morning' || (phase as string) === 'afternoon') mode = 'day';
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
    // Partikel-Cap fuer 60fps-Budget (snow:20, rain:25, night:12, day:8)
    const count = this.currentMode === 'snow' ? 20
      : this.currentMode === 'rain' ? 25
      : this.currentMode === 'night' ? 12
      : 8;
    const color = this.currentMode === 'snow' ? 0xffffff
      : this.currentMode === 'rain' ? 0x77b0ff
      : this.currentMode === 'day' ? 0xd4f4a0
      : 0xfff0a0;
    for (let i = 0; i < count; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const size = this.currentMode === 'rain' ? 1 : 2;
      const alpha = this.currentMode === 'day' ? 0.55 : this.currentMode === 'night' ? 0.85 : 0.7;
      const p = this.scene.add.rectangle(x, y, size, size, color, alpha)
        .setScrollFactor(0)
        .setDepth(950);
      this.particles.push(p);
      this.scene.cameras.main.ignore(p);
      if (this.currentMode === 'day') {
        // Pollen: drift langsam nach oben
        const driftX = (Math.random() - 0.5) * 30;
        const dur = 4000 + Math.random() * 4000;
        this.scene.tweens.add({
          targets: p,
          y: y - H * 0.4,
          x: x + driftX,
          duration: dur,
          repeat: -1,
          delay: Math.random() * dur,
          ease: 'Sine.InOut',
          onRepeat: () => { p.x = Math.random() * W; p.y = H * 0.8 + Math.random() * H * 0.2; p.alpha = 0; }
        });
        this.scene.tweens.add({
          targets: p,
          alpha: { from: 0.3, to: 0.7 },
          duration: 1200 + Math.random() * 1000,
          yoyo: true,
          repeat: -1
        });
      } else {
        const fall = this.currentMode === 'snow' ? 30 + Math.random() * 30
          : this.currentMode === 'rain' ? 80 + Math.random() * 60
          : 5 + Math.random() * 8;
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
  }

  public ignoreInUICam(obj: Phaser.GameObjects.GameObject): void {
    this.uiCam?.ignore(obj);
  }

  public destroy(): void {
    for (const p of this.particles) p.destroy();
    if (this.uiCam) this.scene.cameras.remove(this.uiCam);
  }
}
