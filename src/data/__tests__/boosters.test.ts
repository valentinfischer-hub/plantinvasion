import { describe, it, expect } from 'vitest';
import {
  isBoosterExpired,
  pruneExpired,
  xpBoosterMultiplier,
  hasActiveSunLamp,
  hasActiveSprinkler,
  listActiveBoosters,
  boosterRemainingMs,
  SOIL_COSTS,
  SOIL_XP_MULTIPLIER,
  SOIL_MUTATION_BONUS,
} from '../boosters';
import type { Plant } from '../../types/plant';

function makePlant(boosters: { type: string; startedAt: number; durationMs: number; multiplier?: number }[] = []): Plant {
  return {
    id: 'test', speciesSlug: 'sunflower', stats: { hp: 10, atk: 5, def: 5, spd: 5, vit: 5, root: 5 },
    geneSeed: 0, isMutation: false, level: 1, xp: 0, totalXp: 0,
    bornAt: Date.now(), lastWateredAt: Date.now(), lastTickAt: Date.now(),
    gridX: 0, gridY: 0, hydration: 80, careScore: 0, pendingHarvest: false,
    consecutiveDryHours: 0, highestStageReached: 0,
    activeBoosters: boosters as Plant['activeBoosters'],
    genome: { alleleHp: [10,10], alleleAtk: [10,10], alleleDef: [10,10], alleleSpd: [10,10], alleleVit: [10,10], alleleRoot: [10,10], evHp: 0, evAtk: 0, evDef: 0, evSpd: 0, evVit: 0, evRoot: 0, eggMoves: [], traits: [] },
    genes: {}
  } as unknown as Plant;
}

describe('Boosters', () => {
  describe('isBoosterExpired', () => {
    it('gibt false zurück wenn Booster noch aktiv', () => {
      const booster = { type: 'xp', startedAt: Date.now(), durationMs: 60000, multiplier: 2 };
      expect(isBoosterExpired(booster as Plant['activeBoosters'][0], Date.now())).toBe(false);
    });
    it('gibt true zurück wenn Booster abgelaufen', () => {
      const booster = { type: 'xp', startedAt: Date.now() - 100000, durationMs: 60000, multiplier: 2 };
      expect(isBoosterExpired(booster as Plant['activeBoosters'][0], Date.now())).toBe(true);
    });
  });

  describe('xpBoosterMultiplier', () => {
    it('gibt 1.0 zurück wenn kein Booster aktiv', () => {
      const plant = makePlant([]);
      expect(xpBoosterMultiplier(plant, Date.now())).toBe(1.0);
    });
    it('gibt korrekten Multiplier zurück', () => {
      const plant = makePlant([{ type: 'xp', startedAt: Date.now(), durationMs: 60000, multiplier: 2.0 }]);
      expect(xpBoosterMultiplier(plant, Date.now())).toBe(2.0);
    });
    it('ignoriert abgelaufene Booster', () => {
      const plant = makePlant([{ type: 'xp', startedAt: Date.now() - 100000, durationMs: 60000, multiplier: 2.0 }]);
      expect(xpBoosterMultiplier(plant, Date.now())).toBe(1.0);
    });
  });

  describe('SOIL_COSTS', () => {
    it('normal Soil ist kostenlos', () => {
      expect(SOIL_COSTS.normal).toBe(0);
    });
    it('gold Soil ist teuerster', () => {
      expect(SOIL_COSTS.gold).toBeGreaterThan(SOIL_COSTS.silver);
      expect(SOIL_COSTS.silver).toBeGreaterThan(SOIL_COSTS.bronze);
    });
  });

  describe('SOIL_XP_MULTIPLIER', () => {
    it('gold gibt besten Multiplier', () => {
      expect(SOIL_XP_MULTIPLIER.gold).toBeGreaterThan(SOIL_XP_MULTIPLIER.silver);
      expect(SOIL_XP_MULTIPLIER.silver).toBeGreaterThan(SOIL_XP_MULTIPLIER.bronze);
      expect(SOIL_XP_MULTIPLIER.bronze).toBeGreaterThan(SOIL_XP_MULTIPLIER.normal);
    });
  });

  describe('SOIL_MUTATION_BONUS', () => {
    it('gold und silver geben Mutation-Bonus, bronze und normal nicht', () => {
      expect(SOIL_MUTATION_BONUS.gold).toBeGreaterThan(0);
      expect(SOIL_MUTATION_BONUS.silver).toBeGreaterThan(0);
      expect(SOIL_MUTATION_BONUS.bronze).toBe(0);
      expect(SOIL_MUTATION_BONUS.normal).toBe(0);
    });
  });

  describe('pruneExpired', () => {
    it('entfernt abgelaufene Booster', () => {
      const plant = makePlant([
        { type: 'xp', startedAt: Date.now() - 100000, durationMs: 60000, multiplier: 2 },
        { type: 'sun-lamp', startedAt: Date.now(), durationMs: 60000 }
      ]);
      const pruned = pruneExpired(plant, Date.now());
      expect(pruned.activeBoosters).toHaveLength(1);
      expect(pruned.activeBoosters[0].type).toBe('sun-lamp');
    });
  });

  describe('listActiveBoosters', () => {
    it('gibt nur aktive Booster zurück', () => {
      const plant = makePlant([
        { type: 'xp', startedAt: Date.now() - 100000, durationMs: 60000, multiplier: 2 },
        { type: 'sprinkler', startedAt: Date.now(), durationMs: 60000 }
      ]);
      const active = listActiveBoosters(plant, Date.now());
      expect(active).toHaveLength(1);
      expect(active[0].type).toBe('sprinkler');
    });
  });

  describe('hasActiveSunLamp und hasActiveSprinkler', () => {
    it('gibt true bei aktivem sun-lamp', () => {
      const plant = makePlant([{ type: 'sun-lamp', startedAt: Date.now(), durationMs: 60000 }]);
      expect(hasActiveSunLamp(plant, Date.now())).toBe(true);
    });
    it('gibt false wenn sun-lamp abgelaufen', () => {
      const plant = makePlant([{ type: 'sun-lamp', startedAt: Date.now() - 100000, durationMs: 60000 }]);
      expect(hasActiveSunLamp(plant, Date.now())).toBe(false);
    });
    it('gibt true bei aktivem sprinkler', () => {
      const plant = makePlant([{ type: 'sprinkler', startedAt: Date.now(), durationMs: 60000 }]);
      expect(hasActiveSprinkler(plant, Date.now())).toBe(true);
    });
  });

  describe('boosterRemainingMs', () => {
    it('gibt korrekte verbleibende Zeit zurück', () => {
      const booster = { type: 'xp', startedAt: Date.now() - 30000, durationMs: 60000, multiplier: 2 } as Plant['activeBoosters'][0];
      const remaining = boosterRemainingMs(booster, Date.now());
      expect(remaining).toBeGreaterThan(25000);
      expect(remaining).toBeLessThanOrEqual(30000);
    });
    it('gibt 0 zurück wenn abgelaufen', () => {
      const booster = { type: 'xp', startedAt: Date.now() - 100000, durationMs: 60000, multiplier: 2 } as Plant['activeBoosters'][0];
      expect(boosterRemainingMs(booster, Date.now())).toBe(0);
    });
  });
});
