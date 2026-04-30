/**
 * DayNightCycle — Konfigurierbares Tageszeit-System.
 *
 * Unabhängig von TimeOverlay: reine Logik für Tint-Interpolation.
 * TimeOverlay bleibt für die HUD-Darstellung zuständig.
 *
 * Features:
 * - Cycle-Duration konfigurierbar (Standard: 24 real-min = 1 game-day)
 * - Smooth Tint-Interpolation zwischen Phasen
 * - Phaser-Camera-Tint-Helper
 * - Kein echter TimeOfDay-Content (nur visuell)
 *
 * B6-R5 | S-POLISH
 */
import Phaser from 'phaser';

export interface DayNightConfig {
  /** Dauer eines vollständigen Tages in Millisekunden (real). Standard: 24min */
  cycleDurationMs?: number;
  /** Tint-Intensität: 0.0 = kein Tint, 1.0 = voller Tint */
  tintStrength?: number;
}

/** Tageszeit-Phase */
export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night';

/** Tint-Farben und Alpha je Phase */
const PHASE_TINTS: Record<DayPhase, { color: number; alpha: number }> = {
  dawn:  { color: 0xffa060, alpha: 0.08 },
  day:   { color: 0xffffff, alpha: 0.00 },
  dusk:  { color: 0xff7040, alpha: 0.12 },
  night: { color: 0x2244aa, alpha: 0.30 },
};

/** Phase-Grenzen als Anteil des Tages [0, 1) */
const PHASE_THRESHOLDS: Array<{ phase: DayPhase; start: number }> = [
  { phase: 'night', start: 0.0 },   // 0:00–6:00
  { phase: 'dawn',  start: 0.25 },  // 6:00–9:00
  { phase: 'day',   start: 0.375 }, // 9:00–18:00
  { phase: 'dusk',  start: 0.75 },  // 18:00–21:00
];

export class DayNightCycle {
  private _cycleDurationMs: number;
  private _tintStrength: number;
  private _startTime: number;
  private _overlay?: Phaser.GameObjects.Rectangle;

  constructor(config: DayNightConfig = {}) {
    this._cycleDurationMs = config.cycleDurationMs ?? 24 * 60 * 1000; // 24min
    this._tintStrength = config.tintStrength ?? 1.0;
    this._startTime = Date.now();
  }

  /** Gibt die aktuelle Tageszeit als Anteil [0, 1) zurück. */
  getDayProgress(): number {
    return ((Date.now() - this._startTime) % this._cycleDurationMs) / this._cycleDurationMs;
  }

  /** Gibt die aktuelle Phase zurück. */
  getCurrentPhase(): DayPhase {
    const p = this.getDayProgress();
    let current: DayPhase = 'night';
    for (const t of PHASE_THRESHOLDS) {
      if (p >= t.start) current = t.phase;
    }
    return current;
  }

  /**
   * Berechnet interpolierten Tint für aktuellen Zeitpunkt.
   * Smooth-Blend zwischen aktueller und nächster Phase.
   */
  getCurrentTint(): { color: number; alpha: number } {
    const p = this.getDayProgress();
    let currentIdx = 0;
    for (let i = 0; i < PHASE_THRESHOLDS.length; i++) {
      if (p >= PHASE_THRESHOLDS[i].start) currentIdx = i;
    }
    const nextIdx = (currentIdx + 1) % PHASE_THRESHOLDS.length;
    const currentThreshold = PHASE_THRESHOLDS[currentIdx];
    const nextThreshold = PHASE_THRESHOLDS[nextIdx];

    // Blend-Faktor innerhalb der Phase
    const phaseStart = currentThreshold.start;
    const phaseEnd = nextIdx === 0 ? 1.0 : nextThreshold.start;
    const phaseDuration = phaseEnd - phaseStart;
    const blend = phaseDuration > 0 ? (p - phaseStart) / phaseDuration : 0;

    const from = PHASE_TINTS[currentThreshold.phase];
    const to   = PHASE_TINTS[nextThreshold.phase];

    const alpha = (from.alpha + (to.alpha - from.alpha) * blend) * this._tintStrength;

    // Farb-Interpolation (Rot/Grün/Blau getrennt)
    const fr = (from.color >> 16) & 0xff;
    const fg = (from.color >> 8)  & 0xff;
    const fb =  from.color        & 0xff;
    const tr = (to.color >> 16) & 0xff;
    const tg = (to.color >> 8)  & 0xff;
    const tb =  to.color        & 0xff;
    const r = Math.round(fr + (tr - fr) * blend);
    const g = Math.round(fg + (tg - fg) * blend);
    const b = Math.round(fb + (tb - fb) * blend);
    const color = (r << 16) | (g << 8) | b;

    return { color, alpha };
  }

  /**
   * Erstellt ein Fullscreen-Tint-Overlay für eine Phaser-Scene.
   * Muss im create() aufgerufen werden.
   */
  attachToScene(scene: Phaser.Scene): void {
    const { width, height } = scene.scale;
    this._overlay = scene.add.rectangle(0, 0, width, height, 0x000000, 0)
      .setOrigin(0)
      .setDepth(850)
      .setScrollFactor(0);
  }

  /**
   * Im update() aufrufen.
   * Aktualisiert den Overlay-Tint.
   */
  update(): void {
    if (!this._overlay) return;
    const { color, alpha } = this.getCurrentTint();
    this._overlay.fillColor = color;
    this._overlay.fillAlpha = alpha;
  }

  /** Cycle-Duration zur Laufzeit ändern. */
  setCycleDuration(ms: number): void {
    this._cycleDurationMs = ms;
  }

  /** Tint-Stärke zur Laufzeit ändern. */
  setTintStrength(strength: number): void {
    this._tintStrength = Math.max(0, Math.min(1, strength));
  }

  destroy(): void {
    this._overlay?.destroy();
    this._overlay = undefined;
  }
}
