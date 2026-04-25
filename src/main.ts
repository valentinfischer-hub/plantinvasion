import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { OverworldScene } from './scenes/OverworldScene';
import { GardenScene } from './scenes/GardenScene';
import { BattleScene } from './scenes/BattleScene';
import { PokedexScene } from './scenes/PokedexScene';
import { MarketScene } from './scenes/MarketScene';
import { QuestLogScene } from './scenes/QuestLogScene';
import { DiaryScene } from './scenes/DiaryScene';

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
  fps: {
    target: 60,
    forceSetTimeOut: true
  },
  scene: [MenuScene, OverworldScene, GardenScene, BattleScene, PokedexScene, MarketScene, QuestLogScene, DiaryScene]
};

const game = new Phaser.Game(config);
(window as any).__game = game;

// Auto-Focus auf Canvas damit Keyboard-Events sofort funktionieren
game.events.once('ready', () => {
  const canvas = game.canvas;
  if (canvas) {
    canvas.setAttribute('tabindex', '0');
    canvas.focus();
  }
});
