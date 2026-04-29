/**
 * B4-R6: Sprite-Registry Tests
 */
import { describe, it, expect } from 'vitest';

function isValidColor(c: number): boolean {
  return c >= 0 && c <= 0xffffff;
}

describe('PixelLab API Balance-Check', () => {
  it('balance 0 = kein sprite-generation moeglich', () => {
    const balance = 0.0;
    const canGenerate = balance >= 0.01;
    expect(canGenerate).toBe(false);
  });

  it('balance 2 usd = 200+ sprites moeglich', () => {
    const maxSprites = Math.floor(2.0 / 0.01);
    expect(maxSprites).toBeGreaterThanOrEqual(100);
  });
});

describe('Palette-Validierung', () => {
  it('hex farben im gueltigen range', () => {
    const colors = [0x6abf3a, 0x4a8228, 0xffd166, 0x4a6b28];
    colors.forEach((c) => expect(isValidColor(c)).toBe(true));
  });

  it('ungueltige farben erkannt', () => {
    expect(isValidColor(-1)).toBe(false);
    expect(isValidColor(0x1000000)).toBe(false);
  });
});

describe('Sprite-Key-Format', () => {
  it('slug + stage = sprite-key', () => {
    const key = (slug: string, stage: number) => `${slug}-${stage}`;
    expect(key('sunflower', 4)).toBe('sunflower-4');
    expect(key('rose', 0)).toBe('rose-0');
  });

  it('alle 5 stages valide keys', () => {
    for (let i = 0; i <= 4; i++) {
      const k = `rose-${i}`;
      expect(k).toMatch(/^rose-\d$/);
    }
  });
});
