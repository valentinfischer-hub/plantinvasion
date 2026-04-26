import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { OverworldScene } from './scenes/OverworldScene';
import { GardenScene } from './scenes/GardenScene';
import { BattleScene } from './scenes/BattleScene';
import { PokedexScene } from './scenes/PokedexScene';
import { MarketScene } from './scenes/MarketScene';
import { QuestLogScene } from './scenes/QuestLogScene';
import { DiaryScene } from './scenes/DiaryScene';
import { InventoryScene } from './scenes/InventoryScene';
import { SettingsScene } from './scenes/SettingsScene';
import { HelpScene } from './scenes/HelpScene';

/**
 * Adaptive Resolution (D-001 Fix 2026-04-25):
 * - Mobile / Portrait Window: 480x720 (Mobile-First)
 * - Desktop / Landscape Window: 720x540 - 4:3 Aspect, breiter als bisher,
 *   passt besser auf Desktop-Bildschirme. Hoehe 540 hilft, dass die UI
 *   weiterhin in den meisten Browsern in einer Bildschirmhoehe Platz hat.
 */
const isLandscape = window.innerWidth > window.innerHeight && window.innerWidth >= 900;
const GAME_W = isLandscape ? 720 : 480;
const GAME_H = isLandscape ? 540 : 720;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
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
  scene: [MenuScene, OverworldScene, GardenScene, BattleScene, PokedexScene, MarketScene, QuestLogScene, DiaryScene, InventoryScene, SettingsScene, HelpScene]
};

const game = new Phaser.Game(config);
(window as any).__game = game;
(window as any).__layout = isLandscape ? 'landscape' : 'portrait';

// Auto-Focus auf Canvas damit Keyboard-Events sofort funktionieren
game.events.once('ready', () => {
  const canvas = game.canvas;
  if (canvas) {
    canvas.setAttribute('tabindex', '0');
    canvas.focus();
  }
});
