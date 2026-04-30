/**
 * Accessibility-Einstellungen fuer Plantinvasion.
 *
 * High-Contrast-Mode: Erhoeht Kontrast fuer Spieler mit Sehbeeintraechtigungen.
 * Font-Scale: Erlaubt Skalierung der Schriftgroesse (75% bis 150%).
 *
 * Alle Einstellungen werden in localStorage persistiert.
 * DOM-CSS-Variablen werden direkt gesetzt (kein Phaser noetig).
 *
 * Usage:
 *   import { initAccessibility, setHighContrast, setFontScale } from './ui/accessibility';
 *   initAccessibility(); // beim App-Start aufrufen
 *   setHighContrast(true);
 *   setFontScale(1.2);
 *
 * S-POLISH Batch 5 Run 12
 */

// ─── Storage-Keys ─────────────────────────────────────────────────────────

export const HC_STORAGE_KEY = 'pi_high_contrast';
export const FS_STORAGE_KEY = 'pi_font_scale';

// ─── Konstanten ───────────────────────────────────────────────────────────

/** Minimale Font-Skalierung (75%). */
export const FONT_SCALE_MIN = 0.75;
/** Maximale Font-Skalierung (150%). */
export const FONT_SCALE_MAX = 1.5;
/** Standard Font-Skalierung. */
export const FONT_SCALE_DEFAULT = 1.0;

// ─── High-Contrast-Palette ────────────────────────────────────────────────

/** High-Contrast-Farben als CSS-Custom-Properties. */
const HC_VARS: Record<string, string> = {
  '--pi-bg': '#000000',
  '--pi-bg-panel': '#111111',
  '--pi-text': '#ffffff',
  '--pi-text-dim': '#cccccc',
  '--pi-brand-green': '#00ff88',
  '--pi-reward-gold': '#ffff00',
  '--pi-error': '#ff4444',
  '--pi-info': '#44aaff',
  '--pi-border': '#ffffff',
};

/** Standard-Palette (normale Werte). */
const DEFAULT_VARS: Record<string, string> = {
  '--pi-bg': '#1a1f1a',
  '--pi-bg-panel': '#1a1f1a',
  '--pi-text': '#dcdcdc',
  '--pi-text-dim': '#888888',
  '--pi-brand-green': '#9be36e',
  '--pi-reward-gold': '#fcd95c',
  '--pi-error': '#ff7e7e',
  '--pi-info': '#8eaedd',
  '--pi-border': '#9be36e',
};

// ─── State ────────────────────────────────────────────────────────────────

let _highContrast = false;
let _fontScale = FONT_SCALE_DEFAULT;

// ─── Helfer ───────────────────────────────────────────────────────────────

function setDocumentVars(vars: Record<string, string>): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const [key, val] of Object.entries(vars)) {
    root.style.setProperty(key, val);
  }
}

function clampFontScale(scale: number): number {
  return Math.max(FONT_SCALE_MIN, Math.min(FONT_SCALE_MAX, scale));
}

function applyFontScale(scale: number): void {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty('--pi-font-scale', String(scale));
}

// ─── Exported API ─────────────────────────────────────────────────────────

/**
 * Initialisiert Accessibility-Einstellungen aus localStorage.
 * Einmalig beim App-Start aufrufen.
 */
export function initAccessibility(): void {
  if (typeof localStorage === 'undefined') return;

  // High-Contrast wiederherstellen
  const hc = localStorage.getItem(HC_STORAGE_KEY);
  if (hc === '1') {
    _highContrast = true;
    setDocumentVars(HC_VARS);
  } else {
    setDocumentVars(DEFAULT_VARS);
  }

  // Font-Scale wiederherstellen
  const fs = parseFloat(localStorage.getItem(FS_STORAGE_KEY) ?? '');
  if (!isNaN(fs)) {
    _fontScale = clampFontScale(fs);
  }
  applyFontScale(_fontScale);
}

/**
 * Schaltet den High-Contrast-Modus ein oder aus.
 */
export function setHighContrast(enabled: boolean): void {
  _highContrast = enabled;
  if (typeof localStorage !== 'undefined') {
    try { localStorage.setItem(HC_STORAGE_KEY, enabled ? '1' : '0'); } catch {}
  }
  setDocumentVars(enabled ? HC_VARS : DEFAULT_VARS);
}

/**
 * Gibt zurueck ob High-Contrast gerade aktiv ist.
 */
export function isHighContrast(): boolean {
  return _highContrast;
}

/**
 * Setzt die Font-Skalierung (0.75 bis 1.5).
 */
export function setFontScale(scale: number): void {
  _fontScale = clampFontScale(scale);
  if (typeof localStorage !== 'undefined') {
    try { localStorage.setItem(FS_STORAGE_KEY, String(_fontScale)); } catch {}
  }
  applyFontScale(_fontScale);
}

/**
 * Gibt die aktuelle Font-Skalierung zurueck.
 */
export function getFontScale(): number {
  return _fontScale;
}

/**
 * Togglet den High-Contrast-Modus.
 */
export function toggleHighContrast(): boolean {
  setHighContrast(!_highContrast);
  return _highContrast;
}
