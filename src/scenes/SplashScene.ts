import Phaser from 'phaser';

/**
 * S-POLISH-START-16: SplashScene als Vor-Hauptmenu-Boot.
 * Logo-Reveal mit Pollen-Drift, dann auto-switch zu MenuScene nach 4s
 * oder beim Klick/Tastendruck.
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

    if (this.textures.exists('plants_sprint_1')) {
      const hero = this.add.image(cx, cy - 40, 'plants_sprint_1', 'mondlilie_bloom.webp')
        .setOrigin(0.5)
        .setScale(0)
        .setAlpha(0);
      this.tweens.add({
        targets: hero,
        scale: 1.4,
        alpha: 1,
        duration: 700,
        ease: 'Back.Out'
      });
    }

    for (let i = 0; i < 25; i++) {
      const px = Math.random() * width;
      const py = height + Math.random() * 50;
      const particle = this.add.circle(px, py, 1 + Math.random() * 2, 0xfcd95c, 0.6);
      this.tweens.add({
        targets: particle,
        y: -20,
        alpha: { from: 0.6, to: 0 },
        duration: 5000 + Math.random() * 2000,
        ease: 'Linear',
        repeat: -1,
        delay: Math.random() * 1500
      });
    }

    const title = this.add.text(cx, cy + 70, 'Plantinvasion', {
      fontFamily: 'monospace', fontSize: '32px', color: '#9be36e'
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 500, delay: 300 });

    const hint = this.add.text(cx, cy + 120, 'Klick oder Taste...', {
      fontFamily: 'monospace', fontSize: '11px', color: '#8a6e4a'
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({
      targets: hint,
      alpha: 1,
      duration: 400,
      delay: 1000
    });

    let switched = false;
    const goToMenu = () => {
      if (switched) return;
      switched = true;
      this.scene.start('MenuScene');
    };

    // Klick und Taste sofort verfuegbar (kein Cooldown der Bugs erzeugt)
    this.input.on('pointerdown', goToMenu);
    this.input.keyboard?.on('keydown', goToMenu);

    // Auto-Skip nach 3.5s
    this.time.delayedCall(3500, goToMenu);
  }
}
