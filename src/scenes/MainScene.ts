import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  create() {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 40, 'Plantinvasion', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#9be36e'
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 10, 'Phase 0: Skeleton OK', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#cccccc'
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 40, 'v0.1.0', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#888888'
      })
      .setOrigin(0.5);
  }
}
