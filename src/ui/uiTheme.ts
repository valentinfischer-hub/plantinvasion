/**
 * Tier-3 UI/UX Theme-Konstanten.
 *
 * Zentrale Style-Werte fuer Modale, Panels, Header, Borders. Vorher waren diese
 * in 5+ Stellen in GardenScene plus PauseOverlay plus OverworldScene hardcoded.
 *
 * Farb-Palette folgt dem Plantinvasion-Pixel-Pop-Look:
 *  - Dark-BG: #1a1f1a (forest-shadow)
 *  - Brand-Green: #9be36e (success, plant)
 *  - Reward-Gold: #fcd95c
 *  - Mutation-Lila: #b86ee3
 *  - Error-Red: #ff7e7e
 *  - Info-Blue: #8eaedd
 *
 * Bei Style-Aenderungen NUR diese Datei bearbeiten, nie inline.
 */

// Modal/Panel-Hintergrund (semi-transparent dark)
export const MODAL_BG_COLOR = 0x1a1f1a;
export const MODAL_BG_ALPHA = 0.96;
export const MODAL_BORDER_COLOR = 0x9be36e;
export const MODAL_BORDER_ALPHA = 0.8;
export const MODAL_BORDER_WIDTH = 2;
export const MODAL_CORNER_RADIUS = 8;

// Pause/Settings-Overlay (etwas transparenter als Modal)
export const OVERLAY_BG_COLOR = 0x1a1f1a;
export const OVERLAY_BG_ALPHA = 0.95;

// Toast-Farben (Spiegel zu Toast.ts ToastType-Map, hier als Konstanten fuer non-Toast-Renders)
export const COLOR_SUCCESS = '#9be36e';
export const COLOR_ERROR = '#ff7e7e';
export const COLOR_INFO = '#8eaedd';
export const COLOR_REWARD = '#fcd95c';
export const COLOR_MUTATION = '#b86ee3';
export const COLOR_TEXT_DEFAULT = '#dcdcdc';
export const COLOR_TEXT_DIM = '#888888';

// Font
export const FONT_FAMILY = 'monospace';
export const FONT_SIZE_TITLE = '14px';
export const FONT_SIZE_BODY = '11px';
export const FONT_SIZE_SMALL = '10px';

// Garden-Tile-Layout (zentralisiert weil GardenScene sie selber definiert)
export const TILE_BG_COLOR = 0x223520;
export const TILE_BG_ALPHA = 0.5;
export const TILE_BORDER_COLOR = 0x44603f;
export const TILE_BORDER_ALPHA = 0.5;

// Helper-Funktion fuer Phaser-Graphics: Standard-Modal-Box rendern
export interface ModalBoxOptions {
  width: number;
  height: number;
  /** Optional override fuer Border-Color (z.B. Mutations-Lila). */
  borderColor?: number;
}

/**
 * Phaser-Graphics-Renderer fuer Modal-Backgrounds. Vermeidet Duplikate des
 * fillStyle/fillRoundedRect/lineStyle/strokeRoundedRect-Blocks.
 *
 * Verwendung:
 *   const bg = this.add.graphics();
 *   drawModalBox(bg, { width: 320, height: 240 });
 *   container.add(bg);
 */
import type Phaser from 'phaser';

export function drawModalBox(g: Phaser.GameObjects.Graphics, opts: ModalBoxOptions): void {
  const { width, height } = opts;
  const border = opts.borderColor ?? MODAL_BORDER_COLOR;
  g.fillStyle(MODAL_BG_COLOR, MODAL_BG_ALPHA);
  g.fillRoundedRect(-width / 2, -height / 2, width, height, MODAL_CORNER_RADIUS);
  g.lineStyle(MODAL_BORDER_WIDTH, border, MODAL_BORDER_ALPHA);
  g.strokeRoundedRect(-width / 2, -height / 2, width, height, MODAL_CORNER_RADIUS);
}
