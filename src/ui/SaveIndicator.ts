/**
 * SaveIndicator - Pulsierendes Speicher-Feedback.
 *
 * Zeigt beim Auto-Save kurz ein "💾 Gespeichert"-Badge an.
 * DOM-basiert (kein Phaser noetig), position: fixed oben rechts.
 *
 * Usage:
 *   import { initSaveIndicator, flashSaveIndicator } from './ui/SaveIndicator';
 *   initSaveIndicator();
 *   // beim Speichern:
 *   flashSaveIndicator();
 *
 * S-POLISH Batch 5 Run 11
 */

const ELEMENT_ID = 'pi-save-indicator';
const VISIBLE_CLASS = 'pi-save-visible';

// ─── CSS einbetten ────────────────────────────────────────────────────────

const STYLE = `
#${ELEMENT_ID} {
  position: fixed;
  top: 12px;
  right: 12px;
  background: rgba(20, 32, 20, 0.88);
  color: #7cdb60;
  font-family: monospace;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #3a6b2a;
  pointer-events: none;
  opacity: 0;
  transform: translateY(-6px);
  transition: opacity 0.25s ease, transform 0.25s ease;
  z-index: 9999;
  user-select: none;
}
#${ELEMENT_ID}.${VISIBLE_CLASS} {
  opacity: 1;
  transform: translateY(0);
}
`;

// ─── State ────────────────────────────────────────────────────────────────

let _el: HTMLElement | null = null;
let _hideTimer: ReturnType<typeof setTimeout> | null = null;

// ─── Exported API ─────────────────────────────────────────────────────────

/**
 * Initialisiert den Save-Indikator (einmalig beim App-Start aufrufen).
 * Ist idempotent — mehrfaches Aufrufen hat keinen Effekt.
 */
export function initSaveIndicator(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(ELEMENT_ID)) return; // bereits initialisiert

  // Style
  const style = document.createElement('style');
  style.textContent = STYLE;
  document.head.appendChild(style);

  // Element
  const el = document.createElement('div');
  el.id = ELEMENT_ID;
  el.textContent = '✓ Gespeichert';
  document.body.appendChild(el);
  _el = el;
}

/**
 * Zeigt den Save-Indikator kurz an (1.8 Sekunden).
 * Kann jederzeit aufgerufen werden — verlängert ggf. die Anzeigezeit.
 */
export function flashSaveIndicator(durationMs = 1800): void {
  if (!_el) return;

  // Bestehenden Timer abbrechen (verlängert Sichtbarkeit bei schnellem Save)
  if (_hideTimer) {
    clearTimeout(_hideTimer);
    _hideTimer = null;
  }

  _el.classList.add(VISIBLE_CLASS);

  _hideTimer = setTimeout(() => {
    if (_el) _el.classList.remove(VISIBLE_CLASS);
    _hideTimer = null;
  }, durationMs);
}

/**
 * Entfernt den Save-Indikator aus dem DOM (z.B. bei Game-Destroy).
 */
export function destroySaveIndicator(): void {
  if (_hideTimer) {
    clearTimeout(_hideTimer);
    _hideTimer = null;
  }
  if (_el) {
    _el.remove();
    _el = null;
  }
}

/** Gibt true zurueck wenn der Indikator gerade sichtbar ist. */
export function isSaveIndicatorVisible(): boolean {
  return _el?.classList.contains(VISIBLE_CLASS) ?? false;
}
