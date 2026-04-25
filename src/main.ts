import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GreenhouseScene } from './scenes/GreenhouseScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 480,
  height: 720,
  pixelArt: true,
  backgroundColor: '#1a1f1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, GreenhouseScene]
};

new Phaser.Game(config);
