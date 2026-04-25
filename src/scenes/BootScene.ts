import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;

    this.add.text(cx, cy - 20, 'Plantinvasion', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#9be36e'
    }).setOrigin(0.5);
    this.add.text(cx, cy + 14, 'loading...', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#888888'
    }).setOrigin(0.5);

    this.time.delayedCall(800, () => this.scene.start('MainScene'));
  }
}
