import Phaser from 'phaser';
import { OverworldScene } from './scenes/OverworldScene';
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
  // forceSetTimeOut laesst den Game-Loop auch laufen wenn der Tab im Hintergrund ist.
  // Wichtig fuer headless-Browser-Tests via Chrome MCP. In V1.0 Production evtl. wieder
  // entfernen, dann pausiert das Spiel automatisch wenn man den Tab wechselt.
  fps: {
    target: 60,
    forceSetTimeOut: true
  },
  scene: [OverworldScene, GreenhouseScene]
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
