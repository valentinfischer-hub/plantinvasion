/**
 * Accessibility Tests - S-POLISH Batch 5 Run 12
 *
 * Reine Logik-Tests: clampFontScale, isHighContrast, getFontScale etc.
 * Keine DOM-Abhängigkeit.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Stub-Isolation via vi.resetModules ───────────────────────────────────

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ─── Konstanten ───────────────────────────────────────────────────────────

describe('Accessibility Konstanten', () => {
  it('FONT_SCALE_MIN = 0.75', async () => {
    const { FONT_SCALE_MIN } = await import('../accessibility');
    expect(FONT_SCALE_MIN).toBe(0.75);
  });

  it('FONT_SCALE_MAX = 1.5', async () => {
    const { FONT_SCALE_MAX } = await import('../accessibility');
    expect(FONT_SCALE_MAX).toBe(1.5);
  });

  it('FONT_SCALE_DEFAULT = 1.0', async () => {
    const { FONT_SCALE_DEFAULT } = await import('../accessibility');
    expect(FONT_SCALE_DEFAULT).toBe(1.0);
  });

  it('HC_STORAGE_KEY korrekt', async () => {
    const { HC_STORAGE_KEY } = await import('../accessibility');
    expect(HC_STORAGE_KEY).toBe('pi_high_contrast');
  });

  it('FS_STORAGE_KEY korrekt', async () => {
    const { FS_STORAGE_KEY } = await import('../accessibility');
    expect(FS_STORAGE_KEY).toBe('pi_font_scale');
  });
});

// ─── High-Contrast Toggle (ohne DOM) ─────────────────────────────────────

describe('High-Contrast ohne DOM', () => {
  beforeEach(() => {
    vi.stubGlobal('document', undefined);
    vi.stubGlobal('localStorage', undefined);
  });

  it('isHighContrast() startet als false', async () => {
    const { isHighContrast } = await import('../accessibility');
    expect(isHighContrast()).toBe(false);
  });

  it('setHighContrast(true) setzt Flag', async () => {
    const { setHighContrast, isHighContrast } = await import('../accessibility');
    setHighContrast(true);
    expect(isHighContrast()).toBe(true);
  });

  it('toggleHighContrast gibt neuen Wert zurueck', async () => {
    const { toggleHighContrast, isHighContrast } = await import('../accessibility');
    const result = toggleHighContrast();
    expect(result).toBe(isHighContrast());
  });
});

// ─── Font-Scale Clamping (ohne DOM) ──────────────────────────────────────

describe('Font-Scale Clamping', () => {
  beforeEach(() => {
    vi.stubGlobal('document', undefined);
    vi.stubGlobal('localStorage', undefined);
  });

  it('getFontScale() startet als 1.0', async () => {
    const { getFontScale } = await import('../accessibility');
    expect(getFontScale()).toBe(1.0);
  });

  it('setFontScale(1.2) akzeptiert Wert in Range', async () => {
    const { setFontScale, getFontScale } = await import('../accessibility');
    setFontScale(1.2);
    expect(getFontScale()).toBeCloseTo(1.2);
  });

  it('setFontScale(2.0) wird auf 1.5 geclampt', async () => {
    const { setFontScale, getFontScale } = await import('../accessibility');
    setFontScale(2.0);
    expect(getFontScale()).toBe(1.5);
  });

  it('setFontScale(0.5) wird auf 0.75 geclampt', async () => {
    const { setFontScale, getFontScale } = await import('../accessibility');
    setFontScale(0.5);
    expect(getFontScale()).toBe(0.75);
  });
});
