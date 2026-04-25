import Phaser from 'phaser';

/**
 * MainScene - V0.1 Skeleton-Scene.
 * Provisorischer Pflanzen-Platzhalter, wird durch PixelLab-Sprites ersetzt
 * sobald GDD und Pflanzen-Typen final sind.
 */
export class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.add
      .text(cx, cy - 100, 'Plantinvasion', {
        fontFamily: 'monospace',
        fontSize: '36px',
        color: '#9be36e'
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy - 60, 'v0.1.0  Skeleton', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#888888'
      })
      .setOrigin(0.5);

    // Provisorische Pflanze (Vector-Platzhalter)
    const stem = this.add.graphics();
    stem.fillStyle(0x2e7d32, 1);
    stem.fillRect(cx - 4, cy + 30, 8, 90);

    const leaves = this.add.graphics();
    leaves.fillStyle(0x4caf50, 1);
    leaves.fillCircle(cx - 22, cy + 20, 18);
    leaves.fillCircle(cx + 22, cy + 20, 18);
    leaves.fillCircle(cx, cy, 22);

    const flower = this.add.graphics();
    flower.fillStyle(0xffeb3b, 1);
    flower.fillCircle(cx, cy - 28, 10);

    this.add
      .text(cx, cy + 160, 'tap to interact', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#666666'
      })
      .setOrigin(0.5);

    this.input.on('pointerdown', () => {
      flower.clear();
      flower.fillStyle(0xff5722, 1);
      flower.fillCircle(cx, cy - 28, 12);
      console.log('plant tapped');
    });
  }
}
