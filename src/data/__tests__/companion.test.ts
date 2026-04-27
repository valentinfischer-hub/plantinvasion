import { describe, it, expect } from 'vitest';
import { companionBonus, getCompanionsFor, COMPANION_PAIRS } from '../companion';
import type { Plant } from '../../types/plant';

function makePlant(slug: string, x: number, y: number): Plant {
  return {
    id: `${slug}-${x}-${y}`,
    speciesSlug: slug,
    stats: { atk: 10, def: 10, spd: 10 },
    geneSeed: 1, isMutation: false, level: 1, xp: 0, totalXp: 0,
    bornAt: 0, lastWateredAt: 0, lastTickAt: 0,
    hydration: 50, careScore: 0, generation: 0, pendingHarvest: false,
    consecutiveDryHours: 0, highestStageReached: 0, activeBoosters: [],
    gridX: x, gridY: y
  };
}

describe('COMPANION_PAIRS Datenstruktur', () => {
  it('hat mindestens 5 Pairs', () => {
    expect(COMPANION_PAIRS.length).toBeGreaterThanOrEqual(5);
  });
  it('alle Pairs haben bonus zwischen 0.05 und 0.5', () => {
    for (const p of COMPANION_PAIRS) {
      expect(p.bonus).toBeGreaterThan(0);
      expect(p.bonus).toBeLessThanOrEqual(0.5);
    }
  });
  it('alle Pairs haben hint (nicht-leerer string)', () => {
    for (const p of COMPANION_PAIRS) {
      expect(typeof p.hint).toBe('string');
      expect(p.hint.length).toBeGreaterThan(0);
    }
  });
  it('keine duplizierten Pairs (slug-set)', () => {
    const sets = COMPANION_PAIRS.map(p => [...p.slugs].sort().join(','));
    const unique = new Set(sets);
    expect(unique.size).toBe(sets.length);
  });
});

describe('companionBonus', () => {
  it('liefert 0 wenn keine Nachbarn', () => {
    const p = makePlant('sunflower', 5, 5);
    const r = companionBonus(p, [p]);
    expect(r.bonus).toBe(0);
    expect(r.hint).toBeUndefined();
  });

  it('liefert 0 wenn Nachbar-Spezies kein Pair-Match', () => {
    const a = makePlant('sunflower', 0, 0);
    const b = makePlant('venus-flytrap', 1, 0);
    expect(companionBonus(a, [a, b]).bonus).toBe(0);
  });

  it('liefert bonus + hint bei korrektem Pair (sunflower+mint)', () => {
    const sun = makePlant('sunflower', 0, 0);
    const mint = makePlant('mint', 1, 0);
    const r = companionBonus(sun, [sun, mint]);
    expect(r.bonus).toBeGreaterThan(0);
    expect(r.hint).toContain('Schatten');
  });

  it('Pair-Match in beide Richtungen (slug A,B oder B,A)', () => {
    const a = makePlant('mint', 0, 0);
    const b = makePlant('sunflower', 1, 0);
    expect(companionBonus(a, [a, b]).bonus).toBeGreaterThan(0);
  });

  it('nimmt nur den max-bonus bei mehreren Nachbarn', () => {
    // tomato hat lavender als 0.15, aber kein anderes Pair mit z.B. mint
    const tom = makePlant('tomato-plant', 1, 1);
    const lav = makePlant('lavender', 0, 1);
    const sun = makePlant('sunflower', 1, 0);
    const r = companionBonus(tom, [tom, lav, sun]);
    expect(r.bonus).toBe(0.15);
    expect(r.hint).toContain('Lavendel');
  });

  it('non-orthogonal Nachbarn zaehlen NICHT (nur 4-connected)', () => {
    const sun = makePlant('sunflower', 0, 0);
    const mint = makePlant('mint', 1, 1);  // diagonal
    expect(companionBonus(sun, [sun, mint]).bonus).toBe(0);
  });
});

describe('getCompanionsFor', () => {
  it('liefert alle Pair-Partner einer Spezies', () => {
    const tomCompanions = getCompanionsFor('tomato-plant');
    expect(tomCompanions.length).toBeGreaterThan(0);
    expect(tomCompanions[0].partner).toBe('lavender');
  });

  it('leeres Array wenn Spezies in keinem Pair', () => {
    expect(getCompanionsFor('not-a-real-species')).toEqual([]);
  });

  it('Match in beide Richtungen', () => {
    // sunflower kommt als slug[0] in 'sunflower+mint'-Pair
    const sun = getCompanionsFor('sunflower');
    expect(sun.find(c => c.partner === 'mint')).toBeDefined();
    // mint kommt als slug[1] in 'sunflower+mint'-Pair
    const mint = getCompanionsFor('mint');
    expect(mint.find(c => c.partner === 'sunflower')).toBeDefined();
  });
});
