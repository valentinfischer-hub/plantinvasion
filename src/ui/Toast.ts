import Phaser from 'phaser';

/**
 * Tier-3 zentraler Toast-Helper fuer konsistentes Feedback ueber alle Scenes.
 *
 * Vorher: GardenScene.showFlash, OverworldScene.showZoneToast und tagesbelohnung-toast
 * hatten alle leicht unterschiedliche Background-Color/Depth/Padding/Duration.
 *
 * Standardisierung:
 *  - backgroundColor: #1a1f1a (Plantinvasion-Dark, wie OverworldScene)
 *  - fontSize: 14px monospace (wie 90 Prozent der bisherigen Toasts)
 *  - padding: { x: 10, y: 6 }
 *  - depth: 2000 (ueber Plant-Cards, unter Achievement-Toast 2100)
 *  - duration default 1800ms (wie alte showFlash)
 *
 * Color-Konventionen:
 *  - success: #9be36e (gruen)
 *  - error: #ff7e7e (rot)
 *  - info: #8eaedd (blau)
 *  - reward: #fcd95c (gold)
 *  - mutation: #b86ee3 (lila)
 *
 * Usage:
 *   import { showToast } from '../ui/Toast';
 *   showToast(this, 'Pflanze eingesaeet', 'success');
 *   showToast(this, 'Garten voll', 'error');
 *
 * Die Scene-Camera muss NICHT zoom-skaliert sein. Toast nutzt Scene-eigene
 * Coordinates und respektiert nicht die scrollFactor. Fuer Overworld mit Zoom
 * empfiehlt sich der Helper showZoomedToast(scene, message, type, zoom).
 */

export type ToastType = 'success' | 'error' | 'info' | 'reward' | 'mutation';

const COLOR_BY_TYPE: Record<ToastType, string> = {
  success: '#9be36e',
  error: '#ff7e7e',
  info: '#8eaedd',
  reward: '#fcd95c',
  mutation: '#b86ee3'
};

export interface ToastOptions {
  duration?: number;
  delay?: number;
  /** Scenes mit Camera-Zoom: zoom-Faktor fuer Skalierung. Default 1 (keine Skalierung). */
  cameraZoom?: number;
  /** Optionale y-Position relativ zur Scene-Mitte. Default: Mitte. */
  yOffset?: number;
  /** Absolute y-Position in Camera-Coordinates. Wenn gesetzt, ueberschreibt yOffset. */
  yAbsolute?: number;
  /** Custom fontSize fuer Header-style Toasts (z.B. Zone-Toast). Default '14px'. */
  fontSize?: string;
  /** Custom padding. Default { x: 10, y: 6 }. */
  padding?: { x: number; y: number };
  /** Custom Depth. Default 2000. */
  depth?: number;
}

let activeToast: Phaser.GameObjects.Text | undefined;

export function showToast(
  scene: Phaser.Scene,
  message: string,
  type: ToastType = 'info',
  opts: ToastOptions = {}
): Phaser.GameObjects.Text {
  // Aelteren Toast direkt entfernen damit nicht stapeln.
  if (activeToast && activeToast.scene === scene && activeToast.active) {
    activeToast.destroy();
    activeToast = undefined;
  }

  const { width, height } = scene.scale;
  const z = opts.cameraZoom ?? 1;
  const x = (width / 2) / z;
  const y = opts.yAbsolute !== undefined
    ? opts.yAbsolute / z
    : ((height / 2) + (opts.yOffset ?? 0)) / z;

  const toast = scene.add.text(x, y, message, {
    fontFamily: 'monospace',
    fontSize: opts.fontSize ?? '14px',
    color: COLOR_BY_TYPE[type],
    backgroundColor: '#1a1f1a',
    padding: opts.padding ?? { x: 10, y: 6 }
  })
    .setOrigin(0.5)
    .setDepth(opts.depth ?? 2000)
    .setScrollFactor(0)
    .setScale(1 / z);

  scene.tweens.add({
    targets: toast,
    alpha: 0,
    duration: opts.duration ?? 1800,
    delay: opts.delay ?? 0,
    onComplete: () => {
      toast.destroy();
      if (activeToast === toast) activeToast = undefined;
    }
  });

  activeToast = toast;
  return toast;
}

/** Test-Helper: aktiven Toast-Cache zuruecksetzen. NICHT im Production-Code aufrufen. */
export function _resetActiveToastForTest(): void {
  activeToast = undefined;
}
