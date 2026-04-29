// FI-Boot-Mark: frühestmöglicher Timestamp für Boot-Time-Messung (D-041)
performance.mark('boot-start');

import Phaser from 'phaser';
import * as Sentry from '@sentry/browser';
import posthog from 'posthog-js';
import { SplashScene } from './scenes/SplashScene';
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
import { CharacterCreationScene } from './scenes/CharacterCreationScene';
import { fpsMonitor } from './utils/fpsMonitor';
import { initDebugOverlay } from './ui/DebugOverlay';

/**
 * Adaptive Resolution (D-001 Fix 2026-04-25):
 * - Mobile / Portrait Window: 480x720 (Mobile-First)
 * - Desktop / Landscape Window: 720x540 - 4:3 Aspect
 */

// S-POLISH-10/11: Sentry plus PostHog SDK Init
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://eu.posthog.com';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()]
  });
  Sentry.captureMessage('plantinvasion-boot', 'info');
}

if (POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true
  });
  posthog.capture('game_started', {
    timestamp: new Date().toISOString(),
    layout: window.innerWidth > window.innerHeight && window.innerWidth >= 900 ? 'landscape' : 'portrait'
  });
  (window as Window & { __posthog?: typeof posthog }).__posthog = posthog;
}

const isLandscape = window.innerWidth > window.innerHeight && window.innerWidth >= 900;
const GAME_W = isLandscape ? 720 : 480;
const GAME_H = isLandscape ? 540 : 720;

// P0 Fix 5 (D-041): render.roundPixels + antialias sicherstellen
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  pixelArt: true,
  backgroundColor: '#1a1f1a',
  render: {
    roundPixels: true,
    antialias: false,
    pixelArt: true
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  fps: {
    target: 60,
    forceSetTimeOut: false,
    smoothStep: true
  },
  scene: [
    SplashScene,
    MenuScene,
    CharacterCreationScene,
    OverworldScene,
    GardenScene,
    BattleScene,
    PokedexScene,
    MarketScene,
    QuestLogScene,
    DiaryScene,
    InventoryScene,
    SettingsScene,
    HelpScene
  ]
};

// Debug-Overlay (nur wenn ?debug=1 in URL)
initDebugOverlay();

const game = new Phaser.Game(config);
(globalThis as { __game?: Phaser.Game; __layout?: string }).__game = game;
// D-041 FI: FPS-Drop-Monitor aktivieren
fpsMonitor.attach(game);
(globalThis as { __game?: Phaser.Game; __layout?: string }).__layout = isLandscape ? 'landscape' : 'portrait';

// Auto-Focus auf Canvas damit Keyboard-Events sofort funktionieren
game.events.once('ready', () => {
  const canvas = game.canvas;
  if (canvas) {
    canvas.setAttribute('tabindex', '0');
    canvas.focus();
  }
});
