/**
 * BattleHud Tests - S-POLISH Batch 5 Run 10
 *
 * Testet hpBarColor(), formatHp(), hpBarWidth() (reine Logik, ohne Phaser).
 */
import { describe, it, expect } from 'vitest';
import { hpBarColor, formatHp, hpBarWidth } from '../BattleHud';

describe('hpBarColor', () => {
  it('gruen bei > 50%', () => {
    expect(hpBarColor(0.51)).toBe(0x6abf3a);
    expect(hpBarColor(1.0)).toBe(0x6abf3a);
  });

  it('gelb bei 21-50%', () => {
    expect(hpBarColor(0.5)).toBe(0xfcd95c);
    expect(hpBarColor(0.21)).toBe(0xfcd95c);
  });

  it('rot bei <= 20%', () => {
    expect(hpBarColor(0.2)).toBe(0xc94a4a);
    expect(hpBarColor(0.0)).toBe(0xc94a4a);
  });
});

describe('formatHp', () => {
  it('formatiert korrekt', () => {
    expect(formatHp(42, 100)).toBe('HP 42 / 100');
    expect(formatHp(0, 50)).toBe('HP 0 / 50');
  });

  it('rundet HP ab (floored)', () => {
    expect(formatHp(42.9, 100)).toBe('HP 42 / 100');
  });

  it('negatives HP wird 0', () => {
    expect(formatHp(-5, 100)).toBe('HP 0 / 100');
  });
});

describe('hpBarWidth', () => {
  it('volle HP = maximale Breite', () => {
    expect(hpBarWidth(100, 100, 200)).toBe(200);
  });

  it('halbe HP = halbe Breite', () => {
    expect(hpBarWidth(50, 100, 200)).toBe(100);
  });

  it('0 HP = 0 Breite', () => {
    expect(hpBarWidth(0, 100, 200)).toBe(0);
  });

  it('HP ueber Maximum wird auf Max geclamped', () => {
    expect(hpBarWidth(150, 100, 200)).toBe(200);
  });

  it('negative HP wird 0', () => {
    expect(hpBarWidth(-10, 100, 200)).toBe(0);
  });
});
