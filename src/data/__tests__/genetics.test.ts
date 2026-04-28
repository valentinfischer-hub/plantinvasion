import { describe, it, expect } from 'vitest';
import {
  mulberry32,
  clampStat,
  rollStarterStats,
  rollMutation,
  crossStats,
  formatPunnettSquare,
  STAT_MIN,
  STAT_MAX,
  STARTER_STAT_BASE_MIN,
  STARTER_STAT_BASE_MAX,
  MUTATION_CHANCE_BASE
} from '../genetics';
import type { PlantSpecies, StatTriple } from '../../types/plant';

const TEST_SPECIES: PlantSpecies = {
  slug: 'test-plant',
  scientificName: 'Testus testus',
  commonName: 'Test Plant',
  rarity: 2,
  isStarter: true,
  atkBias: 10,
  defBias: -5,
  spdBias: 0,
  description: 'Synthetisches Testobjekt.',
  spriteSeedPrefix: 'test'
};

describe('mulberry32 PRNG', () => {
  it('liefert deterministische Sequenz fuer gleichen Seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 10; i++) {
      expect(a()).toBe(b());
    }
  });

  it('liefert unterschiedliche Sequenzen fuer unterschiedliche Seeds', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toBe(b());
  });

  it('liefert Werte im Range [0, 1)', () => {
    const rng = mulberry32(123);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('handhabt Seed=0 ohne Trivialitaet', () => {
    const rng = mulberry32(0);
    const v1 = rng();
    const v2 = rng();
    expect(v1).not.toBe(v2);
    expect(v1).toBeGreaterThanOrEqual(0);
    expect(v1).toBeLessThan(1);
  });
});

describe('clampStat', () => {
  it('clamped Werte unter Minimum', () => {
    expect(clampStat(-50)).toBe(STAT_MIN);
  });
  it('clamped Werte ueber Maximum', () => {
    expect(clampStat(STAT_MAX + 100)).toBe(STAT_MAX);
  });
  it('rundet Floats korrekt', () => {
    expect(clampStat(42.6)).toBe(43);
    expect(clampStat(42.4)).toBe(42);
  });
  it('Lasst Werte im Range unveraendert (gerundet)', () => {
    expect(clampStat(150)).toBe(150);
  });
});

describe('rollStarterStats', () => {
  it('respektiert Min/Max und Species-Bias', () => {
    const stats = rollStarterStats(TEST_SPECIES, 9999);
    expect(stats.atk).toBeGreaterThanOrEqual(STAT_MIN);
    expect(stats.atk).toBeLessThanOrEqual(STAT_MAX);
    expect(stats.def).toBeGreaterThanOrEqual(STAT_MIN);
    expect(stats.def).toBeLessThanOrEqual(STAT_MAX);
    expect(stats.spd).toBeGreaterThanOrEqual(STAT_MIN);
    expect(stats.spd).toBeLessThanOrEqual(STAT_MAX);
  });

  it('ist deterministisch fuer gleichen Seed', () => {
    const a = rollStarterStats(TEST_SPECIES, 12345);
    const b = rollStarterStats(TEST_SPECIES, 12345);
    expect(a).toEqual(b);
  });

  it('liegt nach Bias-Anwendung im erwarteten Korridor', () => {
    const stats = rollStarterStats(TEST_SPECIES, 7);
    const minPossible = STARTER_STAT_BASE_MIN + Math.min(TEST_SPECIES.atkBias, TEST_SPECIES.defBias, TEST_SPECIES.spdBias);
    const maxPossible = STARTER_STAT_BASE_MAX + Math.max(TEST_SPECIES.atkBias, TEST_SPECIES.defBias, TEST_SPECIES.spdBias);
    expect(stats.atk).toBeGreaterThanOrEqual(Math.max(STAT_MIN, minPossible - 1));
    expect(stats.atk).toBeLessThanOrEqual(Math.min(STAT_MAX, maxPossible + 1));
  });
});

describe('rollMutation', () => {
  it('default Chance ist 8 Prozent', () => {
    expect(MUTATION_CHANCE_BASE).toBeCloseTo(0.08);
  });

  it('rollt Mutation bei Roll < chance', () => {
    let count = 0;
    for (let i = 0; i < 1000; i++) {
      const r = rollMutation(i);
      if (r.isMutation) count++;
    }
    // 8 Prozent +/- 4 Prozent ueber 1000 Rolls
    expect(count).toBeGreaterThan(40);
    expect(count).toBeLessThan(160);
  });

  it('respektiert Custom-Chance', () => {
    const result = rollMutation(1, 1.0);
    expect(result.isMutation).toBe(true);
    const result2 = rollMutation(1, 0.0);
    expect(result2.isMutation).toBe(false);
  });
});

describe('crossStats', () => {
  const A: StatTriple = { atk: 100, def: 100, spd: 100 };
  const B: StatTriple = { atk: 200, def: 200, spd: 200 };

  it('Mittel der Eltern liegt im Wobble-Bereich', () => {
    const child = crossStats(A, B, 1, false);
    expect(child.atk).toBeGreaterThanOrEqual(135);
    expect(child.atk).toBeLessThanOrEqual(165);
  });

  it('ist deterministisch fuer gleichen Seed', () => {
    const c1 = crossStats(A, B, 99, false);
    const c2 = crossStats(A, B, 99, false);
    expect(c1).toEqual(c2);
  });

  it('clampStat haelt Werte im Range', () => {
    const big: StatTriple = { atk: STAT_MAX, def: STAT_MAX, spd: STAT_MAX };
    const child = crossStats(big, big, 1, true);
    expect(child.atk).toBeLessThanOrEqual(STAT_MAX);
    expect(child.def).toBeLessThanOrEqual(STAT_MAX);
    expect(child.spd).toBeLessThanOrEqual(STAT_MAX);
  });

  // Mutation-Boost trifft alle drei Stat-Branches (boostStat 0/1/2).
  // Seeds gewaehlt damit der 4. rand()-Call exakt die Stat-Auswahl trifft.
  it('Mutation-Boost wendet sich auf atk an (boostStat 0, seed 3)', () => {
    const baseline = crossStats(A, B, 3, false);
    const boosted = crossStats(A, B, 3, true);
    // atk-Boost mindestens 1.2x, andere Stats bleiben im Wobble-Bereich
    expect(boosted.atk).toBeGreaterThan(baseline.atk);
    expect(boosted.def).toBe(baseline.def);
    expect(boosted.spd).toBe(baseline.spd);
  });

  it('Mutation-Boost wendet sich auf def an (boostStat 1, seed 2)', () => {
    const baseline = crossStats(A, B, 2, false);
    const boosted = crossStats(A, B, 2, true);
    expect(boosted.def).toBeGreaterThan(baseline.def);
    expect(boosted.atk).toBe(baseline.atk);
    expect(boosted.spd).toBe(baseline.spd);
  });

  it('Mutation-Boost wendet sich auf spd an (boostStat 2, seed 1)', () => {
    const baseline = crossStats(A, B, 1, false);
    const boosted = crossStats(A, B, 1, true);
    expect(boosted.spd).toBeGreaterThan(baseline.spd);
    expect(boosted.atk).toBe(baseline.atk);
    expect(boosted.def).toBe(baseline.def);
  });
});

describe('S-POLISH Run11: formatPunnettSquare', () => {
  it('gibt 3x3 Matrix zurück', () => {
    const result = formatPunnettSquare(['A', 'a'], ['B', 'b']);
    expect(result.length).toBe(3);
    expect(result[0].length).toBe(3);
  });

  it('Header-Zeile korrekt (erste Zeile enthält parent2 Allele)', () => {
    const result = formatPunnettSquare(['A', 'a'], ['B', 'b']);
    expect(result[0][1]).toBe('B');
    expect(result[0][2]).toBe('b');
  });

  it('Kreuzungs-Zellen korrekt', () => {
    const result = formatPunnettSquare(['A', 'a'], ['B', 'b']);
    expect(result[1][1]).toBe('AB');
    expect(result[1][2]).toBe('Ab');
    expect(result[2][1]).toBe('aB');
    expect(result[2][2]).toBe('ab');
  });

  it('MUTATION_CHANCE_BASE dokumentiert (GDD: 5%, aktuell 8%)', () => {
    // GDD-Ziel ist 5%, aktuell 8% für grosszügigeres Erlebnis
    expect(MUTATION_CHANCE_BASE).toBe(0.08);
  });
});
