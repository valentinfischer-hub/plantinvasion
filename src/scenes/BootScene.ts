import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    // Splash UI im preload (so kann der Benutzer den Lade-Status sehen)
    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;

    this.add.text(cx, cy - 20, 'Plantinvasion', {
      fontFamily: 'monospace', fontSize: '32px', color: '#9be36e'
    }).setOrigin(0.5);
    const status = this.add.text(cx, cy + 14, 'loading 0%', {
      fontFamily: 'monospace', fontSize: '11px', color: '#888888'
    }).setOrigin(0.5);

    this.load.on('progress', (v: number) => {
      status.setText(`loading ${Math.round(v * 100)}%`);
    });

    const species = ['sunflower', 'spike-cactus', 'venus-flytrap', 'lavender', 'tomato-plant'];
    const stageFiles = ['00_seed', '01_sprout', '02_juvenile', '03_adult', '04_blooming'];
    species.forEach((slug) => {
      stageFiles.forEach((sf, idx) => {
        this.load.image(`${slug}-${idx}`, `assets/sprites/plants/${slug}/${sf}.png`);
      });
    });
  }

  create(): void {
    console.log('[BootScene] create called, switching to GreenhouseScene');
    this.scene.start('GreenhouseScene');
  }
}
