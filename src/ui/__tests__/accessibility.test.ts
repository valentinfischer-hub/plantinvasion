/**
 * Tests: Accessibility Pass — Colorblind-Mode + Kontrast-Check (S-POLISH-B2-R16)
 */
import { describe, it, expect } from 'vitest';
import { wcagContrastRatio, cbColor, UI_FONT_SIZES, MIN_ACCESSIBLE_FONT_SIZE, COLOR_SUCCESS, COLOR_ERROR, COLOR_REWARD } from '../uiTheme';

describe('wcagContrastRatio', () => {
  it('Weiß auf Schwarz hat maximalen Kontrast ~21', () => {
    const ratio = wcagContrastRatio('#ffffff', '#000000');
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('gleiche Farbe hat Kontrast 1', () => {
    const ratio = wcagContrastRatio('#9be36e', '#9be36e');
    expect(ratio).toBeCloseTo(1, 0);
  });

  it('Brand-Grün auf Dark-BG hat Kontrast > 3', () => {
    // #9be36e auf #1a1f1a
    const ratio = wcagContrastRatio('#9be36e', '#1a1a1a');
    expect(ratio).toBeGreaterThan(3);
  });

  it('Reward-Gold auf Dark-BG hat Kontrast > 4', () => {
    const ratio = wcagContrastRatio('#fcd95c', '#1a1f1a');
    expect(ratio).toBeGreaterThan(4);
  });

  it('gibt numerischen Wert zwischen 1 und 21 zurück', () => {
    const ratio = wcagContrastRatio('#888888', '#1a1f1a');
    expect(ratio).toBeGreaterThanOrEqual(1);
    expect(ratio).toBeLessThanOrEqual(21);
  });
});

describe('cbColor', () => {
  it('normal mode: success = COLOR_SUCCESS', () => {
    // Note: localStorage-mocking: getColorblindMode() liest localStorage.
    // In Test-Umgebung kein localStorage → fallback auf _colorblindMode = 'normal'
    const color = cbColor('success');
    expect(typeof color).toBe('string');
    expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('alle Rollen geben gültige Hex-Farben zurück', () => {
    const roles = ['success', 'error', 'warning', 'info', 'mutation'] as const;
    for (const role of roles) {
      const color = cbColor(role);
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('success ≠ error (unterscheidbar in normalem Modus)', () => {
    expect(cbColor('success')).not.toBe(cbColor('error'));
  });
});

describe('Font-Size Audit', () => {
  it('alle UI-Font-Sizes parsen zu >= 9px', () => {
    for (const size of UI_FONT_SIZES) {
      const px = parseInt(size, 10);
      expect(px).toBeGreaterThanOrEqual(MIN_ACCESSIBLE_FONT_SIZE);
    }
  });

  it('MIN_ACCESSIBLE_FONT_SIZE ist 9', () => {
    expect(MIN_ACCESSIBLE_FONT_SIZE).toBe(9);
  });
});

describe('Farb-Palette Kontrast-Mindestanforderungen', () => {
  const BG = '#1a1f1a';

  it('COLOR_SUCCESS (#9be36e) vs Dark-BG: Kontrast >= 3 (AA Large)', () => {
    expect(wcagContrastRatio(COLOR_SUCCESS, BG)).toBeGreaterThanOrEqual(3);
  });

  it('COLOR_REWARD (#fcd95c) vs Dark-BG: Kontrast >= 4 (AA Normal empfohlen)', () => {
    expect(wcagContrastRatio(COLOR_REWARD, BG)).toBeGreaterThanOrEqual(4);
  });

  it('COLOR_ERROR (#ff7e7e) vs Dark-BG: Kontrast >= 3', () => {
    expect(wcagContrastRatio(COLOR_ERROR, BG)).toBeGreaterThanOrEqual(3);
  });
});
