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
  /** Optional override fuer Border-Alpha (z.B. 0.9 fuer prominentere Modale). */
  borderAlpha?: number;
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
  g.lineStyle(MODAL_BORDER_WIDTH, border, opts.borderAlpha ?? MODAL_BORDER_ALPHA);
  g.strokeRoundedRect(-width / 2, -height / 2, width, height, MODAL_CORNER_RADIUS);
}

// Z-Order Depth-Konstanten (zentral fuer konsistente Layer-Reihenfolge)
// Hoehere Werte = weiter vorne
export const DEPTH_GROUND = 0;
export const DEPTH_PLAYER = 100;
export const DEPTH_NPC = 100;
export const DEPTH_ITEMS = 150;
export const DEPTH_EFFECTS = 200;
export const DEPTH_UI = 500;
export const DEPTH_HUD = 800;
export const DEPTH_PARTICLES = 950;
export const DEPTH_OVERLAY = 1000;
export const DEPTH_MODAL = 1500;
export const DEPTH_TOAST = 2000;
export const DEPTH_DEBUG = 9999;

// ============================================================
// S-POLISH-B2-R16: Accessibility — Colorblind-Mode + Kontrast-Check
// ============================================================

/** Colorblind-Modus-Typen: normal | deuteranopia | protanopia | tritanopia */
export type ColorblindMode = 'normal' | 'deuteranopia' | 'protanopia' | 'tritanopia';

let _colorblindMode: ColorblindMode = 'normal';
const CB_STORAGE_KEY = 'pi_colorblind_mode';

export function getColorblindMode(): ColorblindMode {
  if (typeof localStorage === 'undefined') return _colorblindMode;
  const stored = localStorage.getItem(CB_STORAGE_KEY) as ColorblindMode | null;
  if (stored) _colorblindMode = stored;
  return _colorblindMode;
}

export function setColorblindMode(mode: ColorblindMode): void {
  _colorblindMode = mode;
  try { localStorage.setItem(CB_STORAGE_KEY, mode); } catch {}
}

/**
 * Gibt eine Farbe zurück, die für den aktuellen Colorblind-Modus angepasst ist.
 * Ersetzt grün/rot durch unterscheidbare Farben.
 */
export function cbColor(role: 'success' | 'error' | 'warning' | 'info' | 'mutation'): string {
  const mode = getColorblindMode();
  if (mode === 'normal') {
    const map: Record<string, string> = {
      success: COLOR_SUCCESS, error: COLOR_ERROR, warning: COLOR_REWARD,
      info: COLOR_INFO, mutation: COLOR_MUTATION
    };
    return map[role] ?? '#ffffff';
  }
  // Deuteranopia + Protanopia: Grün/Rot nicht unterscheidbar → Blau/Orange nutzen
  if (mode === 'deuteranopia' || mode === 'protanopia') {
    const map: Record<string, string> = {
      success: '#5599ff',   // Blau statt Grün
      error: '#ff8800',     // Orange statt Rot
      warning: '#ffee00',   // Gelb-intensiv
      info: '#aaddff',
      mutation: '#cc99ff'
    };
    return map[role] ?? '#ffffff';
  }
  // Tritanopia: Blau/Gelb nicht unterscheidbar → Magenta/Türkis nutzen
  if (mode === 'tritanopia') {
    const map: Record<string, string> = {
      success: '#00ddaa',   // Türkis statt Grün
      error: '#ff5588',     // Magenta statt Rot
      warning: '#ff9944',   // Orange statt Gelb
      info: '#aaccee',
      mutation: '#dd88ff'
    };
    return map[role] ?? '#ffffff';
  }
  return '#ffffff';
}

/** Minimal-Kontrast-Prüfung für Debugging-Outputs (vereinfachter WC3-Check). */
export function wcagContrastRatio(hex1: string, hex2: string): number {
  function lum(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const linearize = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
  }
  const l1 = lum(hex1), l2 = lum(hex2);
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Font-Size-Audit: alle UI-Sizes müssen ≥ 9px sein */
export const MIN_ACCESSIBLE_FONT_SIZE = 9;
export const UI_FONT_SIZES = [
  FONT_SIZE_TITLE, // '14px'
  FONT_SIZE_BODY,  // '11px'
  FONT_SIZE_SMALL  // '10px'
];
