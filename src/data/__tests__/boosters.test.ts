import { describe, it, expect } from 'vitest';
import {
  isBoosterExpired,
  pruneExpired,
  xpBoosterMultiplier,
  hasActiveSunLamp,
  hasActiveSprinkler,
  listActiveBoosters,
  boosterRemainingMs,
  SOIL_XP_MULTIPLIER,
  SOIL_HYDRATION_DECAY_FACTOR,
  SOIL_MUTATION_BONUS,
  SOIL_COSTS,
  nextSoilTier
} from '../boosters';
import type { Plant, ActiveBooster } from '../../types/plant';

function makePlant(boosters: ActiveBooster[] = []): Plant {
  return {
    id: 'p1',
    speciesSlug: 'sunflower',
    stats: { atk: 10, def: 10, spd: 10 },
    geneSeed: 1,
    isMutation: false,
    level: 1,
    xp: 0,
    totalXp: 0,
    bornAt: 0,
    lastWateredAt: 0,
    lastTickAt: 0,
    hydration: 50,
    careScore: 0,
    generation: 0,
    pendingHarvest: false,
    consecutiveDryHours: 0,
    highestStageReached: 0,
    activeBoosters: boosters,
    gridX: 0,
    gridY: 0
  };
}

describe('isBoosterExpired', () => {
  it('liefert true wenn now > startedAt + durationMs', () => {
    const b: ActiveBooster = { type: 'xp', startedAt: 0, durationMs: 1000, multiplier: 2 };
    expect(isBoosterExpired(b, 1500)).toBe(true);
  });
  it('liefert false wenn noch aktiv', () => {
    const b: ActiveBooster = { type: 'xp', startedAt: 0, durationMs: 1000, multiplier: 2 };
    expect(isBoosterExpired(b, 500)).toBe(false);
  });
});

describe('pruneExpired', () => {
  it('entfernt abgelaufene Booster', () => {
    const p = makePlant([
      { type: 'xp', startedAt: 0, durationMs: 100, multiplier: 2 },
      { type: 'sun-lamp', startedAt: 1000, durationMs: 5000 }
    ]);
    const r = pruneExpired(p, 2000);
    expect(r.activeBoosters.length).toBe(1);
    expect(r.activeBoosters[0].type).toBe('sun-lamp');
  });
  it('liefert Plant unveraendert wenn alle Booster aktiv', () => {
    const p = makePlant([{ type: 'xp', startedAt: 0, durationMs: 5000, multiplier: 2 }]);
    const r = pruneExpired(p, 1000);
    expect(r.activeBoosters.length).toBe(1);
  });
});

describe('xpBoosterMultiplier', () => {
  it('liefert 1.0 ohne Booster', () => {
    expect(xpBoosterMultiplier(makePlant(), 0)).toBe(1.0);
  });
  it('multipliziert xp-Booster', () => {
    const p = makePlant([{ type: 'xp', startedAt: 0, durationMs: 5000, multiplier: 2 }]);
    expect(xpBoosterMultiplier(p, 1000)).toBe(2);
  });
  it('ignoriert abgelaufene Booster', () => {
    const p = makePlant([{ type: 'xp', startedAt: 0, durationMs: 100, multiplier: 5 }]);
    expect(xpBoosterMultiplier(p, 5000)).toBe(1.0);
  });
  it('stapelt mehrere xp-Booster multiplikativ', () => {
    const p = makePlant([
      { type: 'xp', startedAt: 0, durationMs: 5000, multiplier: 2 },
      { type: 'xp', startedAt: 0, durationMs: 5000, multiplier: 3 }
    ]);
    expect(xpBoosterMultiplier(p, 1000)).toBe(6);
  });
});

describe('hasActiveSunLamp / hasActiveSprinkler', () => {
  it('Sun-Lamp aktiv', () => {
    const p = makePlant([{ type: 'sun-lamp', startedAt: 0, durationMs: 5000 }]);
    expect(hasActiveSunLamp(p, 1000)).toBe(true);
    expect(hasActiveSprinkler(p, 1000)).toBe(false);
  });
  it('Sprinkler aktiv', () => {
    const p = makePlant([{ type: 'sprinkler', startedAt: 0, durationMs: 5000 }]);
    expect(hasActiveSprinkler(p, 1000)).toBe(true);
    expect(hasActiveSunLamp(p, 1000)).toBe(false);
  });
  it('expired Sun-Lamp -> false', () => {
    const p = makePlant([{ type: 'sun-lamp', startedAt: 0, durationMs: 100 }]);
    expect(hasActiveSunLamp(p, 1000)).toBe(false);
  });
});

describe('listActiveBoosters', () => {
  it('filtert expired boosters', () => {
    const p = makePlant([
      { type: 'xp', startedAt: 0, durationMs: 100, multiplier: 2 },
      { type: 'sun-lamp', startedAt: 0, durationMs: 5000 }
    ]);
    const list = listActiveBoosters(p, 500);
    expect(list.length).toBe(1);
    expect(list[0].type).toBe('sun-lamp');
  });
});

describe('boosterRemainingMs', () => {
  it('berechnet verbleibende ms korrekt', () => {
    const b: ActiveBooster = { type: 'xp', startedAt: 1000, durationMs: 5000, multiplier: 2 };
    expect(boosterRemainingMs(b, 3000)).toBe(3000);
  });
  it('clamped auf 0 wenn abgelaufen', () => {
    const b: ActiveBooster = { type: 'xp', startedAt: 0, durationMs: 100, multiplier: 2 };
    expect(boosterRemainingMs(b, 5000)).toBe(0);
  });
});

describe('SOIL-Konstanten', () => {
  it('alle 4 SoilTiers in jedem Map', () => {
    for (const tier of ['normal', 'bronze', 'silver', 'gold'] as const) {
      expect(SOIL_XP_MULTIPLIER[tier]).toBeDefined();
      expect(SOIL_HYDRATION_DECAY_FACTOR[tier]).toBeDefined();
      expect(SOIL_MUTATION_BONUS[tier]).toBeDefined();
      expect(SOIL_COSTS[tier]).toBeDefined();
    }
  });
  it('XP-Multiplier steigt mit Tier', () => {
    expect(SOIL_XP_MULTIPLIER.gold).toBeGreaterThan(SOIL_XP_MULTIPLIER.normal);
  });
  it('Decay-Factor sinkt mit Tier (besser bei hoeherem Tier)', () => {
    expect(SOIL_HYDRATION_DECAY_FACTOR.gold).toBeLessThan(SOIL_HYDRATION_DECAY_FACTOR.normal);
  });
});

describe('nextSoilTier', () => {
  it('normal -> bronze', () => { expect(nextSoilTier('normal')).toBe('bronze'); });
  it('bronze -> silver', () => { expect(nextSoilTier('bronze')).toBe('silver'); });
  it('silver -> gold', () => { expect(nextSoilTier('silver')).toBe('gold'); });
  it('gold -> null (max)', () => { expect(nextSoilTier('gold')).toBeNull(); });
});
