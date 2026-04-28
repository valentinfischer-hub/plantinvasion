import Phaser from 'phaser';

/**
 * S-POLISH-START-16: SplashScene als Vor-Hauptmenu-Boot.
 * 2.5s Logo-Reveal mit Pollen-Drift, dann 'Drueck irgendeine Taste'.
 * Auf Key/Click: Fade-Out plus Switch zu MenuScene.
 */
export class SplashScene extends Phaser.Scene {
  constructor() {
    super('SplashScene');
  }

  preload(): void {
    if (!this.textures.exists('plants_sprint_1')) {
      this.load.atlas(
        'plants_sprint_1',
        'assets/atlases/plants_sprint_1.webp',
        'assets/atlases/plants_sprint_1.json'
      );
    }
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#0a0e0a');

    const cx = width / 2;
    const cy = height / 2;

    let hero: Phaser.GameObjects.Image | undefined;
    if (this.textures.exists('plants_sprint_1')) {
      hero = this.add.image(cx, cy - 40, 'plants_sprint_1', 'mondlilie_bloom.webp')
        .setOrigin(0.5)
        .setScale(0)
        .setAlpha(0);
      this.tweens.add({
        targets: hero,
        scale: 1.4,
        alpha: 1,
        duration: 900,
        ease: 'Back.Out'
      });
    }

    for (let i = 0; i < 30; i++) {
      const px = Math.random() * width;
      const py = height + Math.random() * 50;
      const particle = this.add.circle(px, py, 1 + Math.random() * 2, 0xfcd95c, 0.6);
      this.tweens.add({
        targets: particle,
        y: -20,
        x: px + (Math.random() - 0.5) * 60,
        alpha: { from: 0.6, to: 0 },
        duration: 6000 + Math.random() * 3000,
        ease: 'Linear',
        repeat: -1,
        delay: Math.random() * 2000
      });
    }

    const title = this.add.text(cx, cy + 70, 'Plantinvasion', {
      fontFamily: 'monospace', fontSize: '32px', color: '#9be36e'
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 600, delay: 500 });

    const hint = this.add.text(cx, cy + 120, 'Drueck irgendeine Taste...', {
      fontFamily: 'monospace', fontSize: '12px', color: '#8a6e4a'
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({
      targets: hint,
      alpha: 1,
      duration: 500,
      delay: 1500,
      onComplete: () => {
        this.tweens.add({
          targets: hint, alpha: 0.4, duration: 800,
          ease: 'Sine.InOut', yoyo: true, repeat: -1
        });
      }
    });

    let canSkip = false;
    this.time.delayedCall(1000, () => { canSkip = true; });

    const goToMenu = () => {
      if (!canSkip) return;
      canSkip = false;
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('MenuScene');
      });
    };

    this.input.keyboard?.once('keydown', goToMenu);
    this.input.once('pointerdown', goToMenu);
    this.time.delayedCall(8000, goToMenu);

    void hero;
  }
}
