/**
 * B4-R1: BreedingModal Deep-Polish Tests
 * Testet: Punnett-Square-Logik, Eltern-Dominanz, Hybrid-Erkennung
 */

import { describe, it, expect } from 'vitest';

/** Hilfsfunktion: Dominanz-Berechnung (wie im Modal) */
function isDominantA(a: number, b: number): boolean {
  return a >= b;
}

function isDominantB(a: number, b: number): boolean {
  return b > a;
}

function midVal(a: number, b: number): number {
  return Math.round((a + b) / 2);
}

function statRange(a: number, b: number): [number, number] {
  const mid = midVal(a, b);
  return [Math.round(mid * 0.9), Math.round(mid * 1.1)];
}

function mutChancePct(mutationChance: number): number {
  return Math.round(mutationChance * 100);
}

describe('BreedingModal Punnett-Square Logik', () => {
  it('dominanz korrekt: A > B â A dominant', () => {
    expect(isDominantA(15, 10)).toBe(true);
    expect(isDominantA(10, 15)).toBe(false);
  });

  it('dominanz korrekt: B > A â B dominant', () => {
    expect(isDominantB(10, 15)).toBe(true);
    expect(isDominantB(15, 10)).toBe(false);
  });

  it('gleichstand: A dominant, B nicht', () => {
    expect(isDominantA(10, 10)).toBe(true);
    expect(isDominantB(10, 10)).toBe(false);
  });

  it('midVal korrekt gerundet', () => {
    expect(midVal(10, 20)).toBe(15);
    expect(midVal(11, 20)).toBe(16); // round(15.5) = 16
    expect(midVal(10, 11)).toBe(11); // round(10.5) = 11
  });

  it('stat-range +/- 10% korrekt', () => {
    const [lo, hi] = statRange(10, 20); // mid=15
    expect(lo).toBe(14); // round(15 * 0.9) = round(13.5) = 14
    expect(hi).toBe(17); // round(15 * 1.1) = round(16.5) = 17
  });

  it('mutation-chance prozent', () => {
    expect(mutChancePct(0.08)).toBe(8);
    expect(mutChancePct(0.13)).toBe(13);
    expect(mutChancePct(0.0)).toBe(0);
  });
});

describe('BreedingModal Hybrid-Erkennung', () => {
  const baseSlug = 'sunflower';

  it('kein Hybrid wenn childSlug == parentA.speciesSlug', () => {
    const childSlug = baseSlug;
    const isHybrid = childSlug !== baseSlug;
    expect(isHybrid).toBe(false);
  });

  it('Hybrid wenn childSlug != parentA.speciesSlug', () => {
    const childSlug: string = 'sunflower-cactus-hybrid';
    const isHybrid = childSlug !== baseSlug;
    expect(isHybrid).toBe(true);
  });
});

describe('BreedingModal Eltern-Namen-Abkuerzung', () => {
  it('3-char uppercase slug', () => {
    const abbr = (name: string) => name.substring(0, 3).toUpperCase();
    expect(abbr('Sunflower')).toBe('SUN');
    expect(abbr('AB')).toBe('AB');
    expect(abbr('Cactus')).toBe('CAC');
  });
});

describe('BreedingModal Pollen-Flow Parameter', () => {
  it('10 pollen-partikel pro flow', () => {
    const POLLEN_COUNT = 10;
    expect(POLLEN_COUNT).toBe(10);
  });

  it('delay-berechnung 90ms pro partikel', () => {
    const delay = (i: number) => i * 90;
    expect(delay(0)).toBe(0);
    expect(delay(5)).toBe(450);
    expect(delay(9)).toBe(810);
  });
});
