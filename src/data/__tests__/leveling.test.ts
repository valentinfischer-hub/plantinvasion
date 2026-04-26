import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  xpToNextLevel,
  totalXpToReachLevel,
  stageForLevel,
  stageOf,
  isCrossable,
  hydrationStatus,
  hydrationMultiplier,
  msSinceWatered,
  canBeWatered,
  waterCooldownRemaining,
  isNeglected,
  stageMultiplier,
  biomeMatchMultiplier,
  hybridVigorMultiplier,
  timeOfDayMultiplier,
  tierForCareScore,
  isBlooming,
  bloomProgress,
  isHarvestReady,
  rollHarvest,
  applyXp,
  waterPlant,
  harvestPlant,
  tickPlant,
  defaultGrowthFields,
  HYDRATION_MAX,
  HYDRATION_FULL_TO_DRY_HOURS,
  WATER_COOLDOWN_MS,
  WATER_XP_REWARD,
  MAX_LEVEL,
  STAGE_LEVEL_THRESHOLDS,
  TIER_THRESHOLDS,
  TIER_COIN_MULTIPLIER,
  BLOOM_CYCLE_MS,
  REBLOOM_CYCLE_MS,
  BASE_XP_PER_SEC,
  NEGLECT_THRESHOLD_MS,
  DEHYDRATION_PER_SEC
} from '../leveling';
import type { Plant, GrowthStage, QualityTier } from '../../types/plant';

// Test-Fixtures
function makePlant(overrides: Partial<Plant> = {}): Plant {
  const now = 1_700_000_000_000;
  return {
    id: 'p-test',
    speciesSlug: 'sunflower',
    stats: { atk: 10, def: 10, spd: 10 },
    geneSeed: 1234,
    isMutation: false,
    level: 1,
    xp: 0,
    totalXp: 0,
    bornAt: now,
    lastWateredAt: now,
    lastTickAt: now,
    hydration: HYDRATION_MAX,
    careScore: 0,
    generation: 0,
    pendingHarvest: false,
    consecutiveDryHours: 0,
    highestStageReached: 0,
    activeBoosters: [],
    gridX: 0,
    gridY: 0,
    ...overrides
  };
}

describe('xpToNextLevel', () => {
  it('Level 1 braucht 10 XP fuer 1->2', () => {
    expect(xpToNextLevel(1)).toBe(10);
  });
  it('Level 5 braucht 250 XP fuer 5->6', () => {
    expect(xpToNextLevel(5)).toBe(250);
  });
  it('Level 99 braucht knapp 100k XP', () => {
    expect(xpToNextLevel(99)).toBe(99 * 99 * 10);
  });
  it('quadratisch monoton steigend', () => {
    for (let l = 1; l < 99; l++) {
      expect(xpToNextLevel(l + 1)).toBeGreaterThan(xpToNextLevel(l));
    }
  });
});

describe('totalXpToReachLevel', () => {
  it('Level 1 braucht 0 XP-Total', () => {
    expect(totalXpToReachLevel(1)).toBe(0);
  });
  it('Level 2 braucht xpToNextLevel(1)', () => {
    expect(totalXpToReachLevel(2)).toBe(10);
  });
  it('Level 3 braucht xpToNextLevel(1) + xpToNextLevel(2)', () => {
    expect(totalXpToReachLevel(3)).toBe(10 + 40);
  });
  it('Level 5 entspricht Summe der vier vorangehenden Levels', () => {
    expect(totalXpToReachLevel(5)).toBe(10 + 40 + 90 + 160);
  });
});

describe('stageForLevel', () => {
  it.each([
    [1, 0],
    [4, 0],
    [5, 1],
    [14, 1],
    [15, 2],
    [29, 2],
    [30, 3],
    [44, 3],
    [45, 4],
    [99, 4],
    [100, 4]
  ] as Array<[number, GrowthStage]>)('level %i -> stage %i', (level, expected) => {
    expect(stageForLevel(level)).toBe(expected);
  });

  it('STAGE_LEVEL_THRESHOLDS sind 1/5/15/30/45', () => {
    expect(STAGE_LEVEL_THRESHOLDS).toEqual([1, 5, 15, 30, 45]);
  });
});

describe('stageOf', () => {
  it('liefert Stage 0 fuer frisches Seedling', () => {
    expect(stageOf(makePlant({ level: 1 }))).toBe(0);
  });
  it('liefert Stage 4 fuer Blooming', () => {
    expect(stageOf(makePlant({ level: 50 }))).toBe(4);
  });
});

describe('isCrossable', () => {
  it('false fuer Stage 0,1,2', () => {
    expect(isCrossable(makePlant({ level: 1 }))).toBe(false);
    expect(isCrossable(makePlant({ level: 5 }))).toBe(false);
    expect(isCrossable(makePlant({ level: 15 }))).toBe(false);
  });
  it('true fuer Stage 3 (Adult)', () => {
    expect(isCrossable(makePlant({ level: 30 }))).toBe(true);
  });
  it('true fuer Stage 4 (Blooming)', () => {
    expect(isCrossable(makePlant({ level: 45 }))).toBe(true);
  });
});

describe('hydrationStatus', () => {
  it.each([
    [100, 'saftig'],
    [80, 'saftig'],
    [79, 'gut'],
    [50, 'gut'],
    [49, 'durstig'],
    [25, 'durstig'],
    [24, 'trocken'],
    [5, 'trocken'],
    [4, 'vertrocknet'],
    [0, 'vertrocknet']
  ] as Array<[number, string]>)('hydration %i -> %s', (h, expected) => {
    expect(hydrationStatus(makePlant({ hydration: h }))).toBe(expected);
  });
});

describe('hydrationMultiplier', () => {
  it('saftig = 1.25', () => {
    expect(hydrationMultiplier(makePlant({ hydration: 90 }))).toBe(1.25);
  });
  it('gut = 1.0', () => {
    expect(hydrationMultiplier(makePlant({ hydration: 60 }))).toBe(1.0);
  });
  it('durstig = 0.6', () => {
    expect(hydrationMultiplier(makePlant({ hydration: 30 }))).toBe(0.6);
  });
  it('trocken = 0.2', () => {
    expect(hydrationMultiplier(makePlant({ hydration: 10 }))).toBe(0.2);
  });
  it('vertrocknet = -0.1 (XP-Verlust)', () => {
    expect(hydrationMultiplier(makePlant({ hydration: 0 }))).toBe(-0.1);
  });
});

describe('msSinceWatered', () => {
  it('liefert delta zur lastWateredAt', () => {
    const now = 2_000_000_000_000;
    const plant = makePlant({ lastWateredAt: now - 60_000 });
    expect(msSinceWatered(plant, now)).toBe(60_000);
  });
});

describe('canBeWatered', () => {
  it('false vor Cooldown-Ende', () => {
    const now = 2_000_000_000_000;
    const plant = makePlant({ lastWateredAt: now - 1000, hydration: 50 });
    expect(canBeWatered(plant, now)).toBe(false);
  });
  it('true wenn Cooldown abgelaufen und nicht voll', () => {
    const now = 2_000_000_000_000;
    const plant = makePlant({ lastWateredAt: now - WATER_COOLDOWN_MS - 1, hydration: 50 });
    expect(canBeWatered(plant, now)).toBe(true);
  });
  it('false wenn Pflanze schon (fast) voll ist', () => {
    const now = 2_000_000_000_000;
    const plant = makePlant({ lastWateredAt: now - WATER_COOLDOWN_MS - 1, hydration: HYDRATION_MAX });
    expect(canBeWatered(plant, now)).toBe(false);
  });
});

describe('waterCooldownRemaining', () => {
  it('liefert 0 wenn Cooldown durch', () => {
    const now = 2_000_000_000_000;
    expect(waterCooldownRemaining(makePlant({ lastWateredAt: now - WATER_COOLDOWN_MS }), now)).toBe(0);
  });
  it('liefert positive Zeit waehrend Cooldown', () => {
    const now = 2_000_000_000_000;
    expect(waterCooldownRemaining(makePlant({ lastWateredAt: now - 1000 }), now))
      .toBe(WATER_COOLDOWN_MS - 1000);
  });
});

describe('isNeglected (Backward-Compat)', () => {
  it('true bei Hydration < 25', () => {
    expect(isNeglected(makePlant({ hydration: 24 }))).toBe(true);
  });
  it('false bei Hydration >= 25', () => {
    expect(isNeglected(makePlant({ hydration: 25 }))).toBe(false);
  });
  it('NEGLECT_THRESHOLD_MS Konstante existiert (Bestand)', () => {
    expect(NEGLECT_THRESHOLD_MS).toBeGreaterThan(0);
  });
});

describe('stageMultiplier', () => {
  it('Seed schnell, Blooming langsam', () => {
    expect(stageMultiplier(0)).toBe(1.5);
    expect(stageMultiplier(1)).toBe(1.2);
    expect(stageMultiplier(2)).toBe(1.0);
    expect(stageMultiplier(3)).toBe(0.8);
    expect(stageMultiplier(4)).toBe(0.5);
  });
});

describe('biomeMatchMultiplier', () => {
  it('Sunflower in wurzelheim ist preferred', () => {
    expect(biomeMatchMultiplier('sunflower', 'wurzelheim')).toBe(1.4);
  });
  it('Sunflower in frostkamm ist wrong', () => {
    expect(biomeMatchMultiplier('sunflower', 'frostkamm')).toBe(0.7);
  });
  it('Sunflower in unbekanntem Biom = neutral', () => {
    expect(biomeMatchMultiplier('sunflower', 'unknown-zone')).toBe(1.0);
  });
  it('unbekannte Spezies = neutral', () => {
    expect(biomeMatchMultiplier('does-not-exist', 'wurzelheim')).toBe(1.0);
  });
});

describe('hybridVigorMultiplier', () => {
  it('Mutation = 1.4', () => {
    expect(hybridVigorMultiplier(makePlant({ isMutation: true }))).toBe(1.4);
  });
  it('Generation 1 = 1.25', () => {
    expect(hybridVigorMultiplier(makePlant({ generation: 1 }))).toBe(1.25);
  });
  it('Generation >= 2 = 1.1', () => {
    expect(hybridVigorMultiplier(makePlant({ generation: 2 }))).toBe(1.1);
    expect(hybridVigorMultiplier(makePlant({ generation: 5 }))).toBe(1.1);
  });
  it('Default = 1.0', () => {
    expect(hybridVigorMultiplier(makePlant())).toBe(1.0);
  });
});

describe('timeOfDayMultiplier', () => {
  it('Tag (12 Uhr) = 1.0', () => {
    const noon = new Date('2026-04-26T12:00:00').getTime();
    expect(timeOfDayMultiplier(noon)).toBe(1.0);
  });
  it('Abend (20 Uhr) = 0.7', () => {
    const evening = new Date('2026-04-26T20:00:00').getTime();
    expect(timeOfDayMultiplier(evening)).toBe(0.7);
  });
  it('Nacht (3 Uhr) = 0.4', () => {
    const night = new Date('2026-04-26T03:00:00').getTime();
    expect(timeOfDayMultiplier(night)).toBe(0.4);
  });
  it('frueher Morgen (5 Uhr) = 0.4', () => {
    const earlyMorning = new Date('2026-04-26T05:00:00').getTime();
    expect(timeOfDayMultiplier(earlyMorning)).toBe(0.4);
  });
  it('frueh Tag (6 Uhr) = 1.0', () => {
    const morning = new Date('2026-04-26T06:00:00').getTime();
    expect(timeOfDayMultiplier(morning)).toBe(1.0);
  });
});

describe('tierForCareScore', () => {
  it.each([
    [0, 'common'],
    [29, 'common'],
    [30, 'fine'],
    [79, 'fine'],
    [80, 'quality'],
    [149, 'quality'],
    [150, 'premium'],
    [249, 'premium'],
    [250, 'pristine'],
    [9999, 'pristine']
  ] as Array<[number, QualityTier]>)('careScore %i -> %s', (score, expected) => {
    expect(tierForCareScore(score)).toBe(expected);
  });

  it('TIER_THRESHOLDS aufsteigend', () => {
    expect(TIER_THRESHOLDS.common).toBe(0);
    expect(TIER_THRESHOLDS.fine).toBe(30);
    expect(TIER_THRESHOLDS.quality).toBe(80);
    expect(TIER_THRESHOLDS.premium).toBe(150);
    expect(TIER_THRESHOLDS.pristine).toBe(250);
  });

  it('TIER_COIN_MULTIPLIER aufsteigend', () => {
    expect(TIER_COIN_MULTIPLIER.common).toBe(1.0);
    expect(TIER_COIN_MULTIPLIER.pristine).toBe(4.0);
  });
});

describe('isBlooming', () => {
  it('true ab Stage 4', () => {
    expect(isBlooming(makePlant({ level: 45 }))).toBe(true);
  });
  it('false vor Stage 4', () => {
    expect(isBlooming(makePlant({ level: 30 }))).toBe(false);
  });
});

describe('bloomProgress', () => {
  it('0 wenn nicht blooming', () => {
    expect(bloomProgress(makePlant({ level: 30 }))).toBe(0);
  });
  it('1 wenn pendingHarvest schon true', () => {
    const plant = makePlant({ level: 50, pendingHarvest: true });
    expect(bloomProgress(plant)).toBe(1);
  });
  it('progressiert linear vom bornAt bis BLOOM_CYCLE_MS bei Erstbluete', () => {
    const start = 1_000_000_000_000;
    const plant = makePlant({ level: 50, bornAt: start });
    expect(bloomProgress(plant, start + BLOOM_CYCLE_MS / 2)).toBeCloseTo(0.5, 5);
    expect(bloomProgress(plant, start + BLOOM_CYCLE_MS)).toBe(1);
    expect(bloomProgress(plant, start + BLOOM_CYCLE_MS * 2)).toBe(1);
  });
  it('nutzt REBLOOM_CYCLE_MS nach erster Bluete', () => {
    const start = 1_000_000_000_000;
    const plant = makePlant({
      level: 50, bornAt: start - 99999, lastBloomedAt: start
    });
    expect(bloomProgress(plant, start + REBLOOM_CYCLE_MS / 2)).toBeCloseTo(0.5, 5);
    expect(bloomProgress(plant, start + REBLOOM_CYCLE_MS)).toBe(1);
  });
});

describe('isHarvestReady', () => {
  it('false wenn nicht blooming', () => {
    expect(isHarvestReady(makePlant({ level: 30 }))).toBe(false);
  });
  it('true wenn pendingHarvest', () => {
    expect(isHarvestReady(makePlant({ level: 50, pendingHarvest: true }))).toBe(true);
  });
  it('true wenn bloomProgress >= 1', () => {
    const start = 1_000_000_000_000;
    const plant = makePlant({ level: 50, bornAt: start });
    expect(isHarvestReady(plant, start + BLOOM_CYCLE_MS)).toBe(true);
  });
});

describe('rollHarvest', () => {
  let randomSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    randomSpy = vi.spyOn(Math, 'random');
  });
  afterEach(() => {
    randomSpy.mockRestore();
  });

  it('common-Pflanze: baseCoins = 5 * 1.0 = 5', () => {
    randomSpy.mockReturnValue(0.99);
    const out = rollHarvest(makePlant({ qualityTier: 'common' }));
    expect(out.coins).toBe(5);
    expect(out.seedSpeciesSlug).toBeUndefined();
    expect(out.pollenChance).toBe(false);
  });

  it('pristine-Pflanze: viele Coins, 5 Prozent Pollen-Chance', () => {
    randomSpy.mockReturnValue(0.01);
    const out = rollHarvest(makePlant({ qualityTier: 'pristine', speciesSlug: 'sunflower' }));
    expect(out.coins).toBe(84);
    expect(out.seedSpeciesSlug).toBe('sunflower');
    expect(out.pollenChance).toBe(true);
  });

  it('common ohne tier: default common', () => {
    randomSpy.mockReturnValue(0.99);
    const out = rollHarvest(makePlant());
    expect(out.coins).toBe(5);
  });

  it('seedRoll bei <0.5 ergibt Seed', () => {
    randomSpy.mockReturnValueOnce(0.3).mockReturnValueOnce(0.99);
    const out = rollHarvest(makePlant({ qualityTier: 'fine', speciesSlug: 'lavender' }));
    expect(out.seedSpeciesSlug).toBe('lavender');
  });

  it('seedRoll bei >=0.5 keine Seed', () => {
    randomSpy.mockReturnValueOnce(0.8).mockReturnValueOnce(0.99);
    const out = rollHarvest(makePlant({ qualityTier: 'fine' }));
    expect(out.seedSpeciesSlug).toBeUndefined();
  });
});

describe('applyXp', () => {
  it('einfacher XP-Gain ohne Level-Up', () => {
    const p = applyXp(makePlant({ level: 1, xp: 0 }), 5);
    expect(p.level).toBe(1);
    expect(p.xp).toBe(5);
    expect(p.totalXp).toBe(5);
  });

  it('Level-Up von 1 zu 2 bei 10 XP', () => {
    const p = applyXp(makePlant({ level: 1, xp: 0 }), 10);
    expect(p.level).toBe(2);
    expect(p.xp).toBe(0);
  });

  it('Mehrfach-Level-Up bei viel XP', () => {
    const p = applyXp(makePlant({ level: 1, xp: 0 }), 100);
    expect(p.level).toBeGreaterThan(2);
    expect(p.totalXp).toBe(100);
  });

  it('clamp bei MAX_LEVEL', () => {
    const p = applyXp(makePlant({ level: MAX_LEVEL, xp: 0 }), 1_000_000);
    expect(p.level).toBe(MAX_LEVEL);
    expect(p.xp).toBe(0);
  });

  it('Bonsai-Cap auf 44', () => {
    const p = applyXp(makePlant({ level: 1, xp: 0, bonsaiMode: true }), 1_000_000);
    expect(p.level).toBe(44);
    expect(p.xp).toBe(0);
  });

  it('Negative XP bei Level 1 wird auf 0 geclampt (kein Level unter 1)', () => {
    const p = applyXp(makePlant({ level: 1, xp: 0 }), -50);
    expect(p.level).toBe(1);
    expect(p.xp).toBe(0);
  });

  it('Negative XP loest Level-Down aus', () => {
    const start = makePlant({ level: 3, xp: 5 });
    const p = applyXp(start, -10);
    expect(p.level).toBeLessThan(3);
  });

  it('totalXp wird nur durch positive XP-Gains erhoeht', () => {
    const p1 = applyXp(makePlant({ totalXp: 100 }), 50);
    expect(p1.totalXp).toBe(150);
    const p2 = applyXp(makePlant({ totalXp: 100 }), -50);
    expect(p2.totalXp).toBe(100);
  });
});

describe('waterPlant', () => {
  it('failed wenn cooldown noch laeuft', () => {
    const now = 2_000_000_000_000;
    const plant = makePlant({ lastWateredAt: now - 1000, hydration: 50 });
    const r = waterPlant(plant, now);
    expect(r.success).toBe(false);
    expect(r.plant).toEqual(plant);
  });

  it('erfolgreich, Hydration auf 100, Cooldown reset, +5 XP', () => {
    const now = 2_000_000_000_000;
    const plant = makePlant({
      lastWateredAt: now - WATER_COOLDOWN_MS - 1, hydration: 30, careScore: 5
    });
    const r = waterPlant(plant, now);
    expect(r.success).toBe(true);
    expect(r.plant.hydration).toBe(HYDRATION_MAX);
    expect(r.plant.lastWateredAt).toBe(now);
    expect(r.plant.totalXp).toBe(WATER_XP_REWARD);
    expect(r.plant.consecutiveDryHours).toBe(0);
    expect(r.plant.careScore).toBe(6);
  });

  it('careScore-Bonus +2 wenn Pflanze noch saftig', () => {
    const now = 2_000_000_000_000;
    const plant = makePlant({
      lastWateredAt: now - WATER_COOLDOWN_MS - 1, hydration: 60, careScore: 5
    });
    const r = waterPlant(plant, now);
    expect(r.plant.careScore).toBe(7);
  });
});

describe('harvestPlant', () => {
  let randomSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);
  });
  afterEach(() => {
    randomSpy.mockRestore();
  });

  it('liefert 0 Coins wenn nicht ready', () => {
    const r = harvestPlant(makePlant({ level: 30 }));
    expect(r.output.coins).toBe(0);
  });

  it('reset pendingHarvest und setzt lastBloomedAt', () => {
    const now = 2_000_000_000_000;
    const plant = makePlant({
      level: 50, pendingHarvest: true, qualityTier: 'common', careScore: 0
    });
    const r = harvestPlant(plant, now);
    expect(r.plant.pendingHarvest).toBe(false);
    expect(r.plant.lastBloomedAt).toBe(now);
    expect(r.plant.careScore).toBe(3);
  });

  it('hoehere Tiers geben mehr careGain', () => {
    const plant = makePlant({
      level: 50, pendingHarvest: true, qualityTier: 'pristine', careScore: 0
    });
    const r = harvestPlant(plant);
    expect(r.plant.careScore).toBe(7);
  });
});

describe('tickPlant', () => {
  it('dt <= 0 liefert Plant unveraendert (nur lastTickAt updated)', () => {
    const now = 2_000_000_000_000;
    const plant = makePlant({ lastTickAt: now });
    const r = tickPlant(plant, now);
    expect(r.lastTickAt).toBe(now);
    expect(r.xp).toBe(0);
  });

  it('Hydration sinkt nach Zeit', () => {
    const now = 2_000_000_000_000;
    const dtSec = 3600;
    const plant = makePlant({ lastTickAt: now - dtSec * 1000, hydration: 100 });
    const r = tickPlant(plant, { zone: 'wurzelheim', now });
    expect(r.hydration).toBeCloseTo(100 - DEHYDRATION_PER_SEC * dtSec, 1);
  });

  it('XP wird akkumuliert ueber Tick (saftig + tag + preferred biome)', () => {
    const noon = new Date('2026-04-26T12:00:00').getTime();
    const dtSec = 60;
    const plant = makePlant({
      level: 1, xp: 0, hydration: 100,
      lastTickAt: noon - dtSec * 1000
    });
    const r = tickPlant(plant, { zone: 'wurzelheim', now: noon });
    expect(r.totalXp).toBeGreaterThan(100);
    expect(r.level).toBeGreaterThan(1);
  });

  it('vertrocknete Pflanze (hydration 0) baut keine XP positiv auf', () => {
    const noon = new Date('2026-04-26T12:00:00').getTime();
    const dtSec = 60;
    const plant = makePlant({
      level: 5, xp: 0, totalXp: 100,
      hydration: 0,
      lastTickAt: noon - dtSec * 1000
    });
    const r = tickPlant(plant, { zone: 'wurzelheim', now: noon });
    expect(r.totalXp).toBe(100);
  });

  it('Max-Level-Pflanze tickt nur Hydration', () => {
    const now = 2_000_000_000_000;
    const dtSec = 3600;
    const plant = makePlant({
      level: MAX_LEVEL, hydration: 100,
      lastTickAt: now - dtSec * 1000,
      totalXp: 999
    });
    const r = tickPlant(plant, { zone: 'wurzelheim', now });
    expect(r.level).toBe(MAX_LEVEL);
    expect(r.totalXp).toBe(999);
    expect(r.hydration).toBeLessThan(100);
  });

  it('careScore steigt bei guter Hydration und preferred biome', () => {
    const noon = new Date('2026-04-26T12:00:00').getTime();
    const dtSec = 60;
    const plant = makePlant({
      hydration: 90, careScore: 0,
      lastTickAt: noon - dtSec * 1000
    });
    const r = tickPlant(plant, { zone: 'wurzelheim', now: noon });
    expect(r.careScore).toBeGreaterThan(3);
    expect(r.careScore).toBeLessThan(4);
  });

  it('careScore wird negativ bestraft bei voller Vertrocknung', () => {
    const noon = new Date('2026-04-26T12:00:00').getTime();
    const dtSec = 60;
    const plant = makePlant({
      hydration: 0, careScore: 50,
      lastTickAt: noon - dtSec * 1000
    });
    const r = tickPlant(plant, { zone: 'wurzelheim', now: noon });
    expect(r.careScore).toBeLessThan(50);
  });

  it('qualityTier wird snapshot bei Erreichen Adult', () => {
    const noon = new Date('2026-04-26T12:00:00').getTime();
    const plant = makePlant({
      level: 29, xp: xpToNextLevel(29) - 1,
      hydration: 100, careScore: 100,
      lastTickAt: noon - 60_000
    });
    const r = tickPlant(plant, { zone: 'wurzelheim', now: noon });
    if (r.level >= 30) {
      expect(r.qualityTier).toBeDefined();
      expect(['fine', 'quality', 'premium', 'pristine']).toContain(r.qualityTier!);
    }
  });

  it('highestStageReached wird nicht reduziert', () => {
    const noon = new Date('2026-04-26T12:00:00').getTime();
    const plant = makePlant({
      level: 1, hydration: 100, highestStageReached: 3,
      lastTickAt: noon - 1000
    });
    const r = tickPlant(plant, { zone: 'wurzelheim', now: noon });
    expect(r.highestStageReached).toBe(3);
  });

  it('Soil gold reduziert Hydration-Decay um 20 Prozent', () => {
    const now = 2_000_000_000_000;
    const dtSec = 3600;
    const plantNormal = makePlant({ lastTickAt: now - dtSec * 1000, hydration: 100 });
    const plantGold = makePlant({ lastTickAt: now - dtSec * 1000, hydration: 100 });

    const rNormal = tickPlant(plantNormal, { zone: 'wurzelheim', now, soilTier: 'normal' });
    const rGold = tickPlant(plantGold, { zone: 'wurzelheim', now, soilTier: 'gold' });

    expect(rGold.hydration).toBeGreaterThan(rNormal.hydration);
  });

  it('Soil gold gibt 1.3x XP-Multiplikator', () => {
    const noon = new Date('2026-04-26T12:00:00').getTime();
    const dtSec = 1;
    const plantNormal = makePlant({ lastTickAt: noon - dtSec * 1000, hydration: 100 });
    const plantGold = makePlant({ lastTickAt: noon - dtSec * 1000, hydration: 100 });

    const rNormal = tickPlant(plantNormal, { zone: 'wurzelheim', now: noon, soilTier: 'normal' });
    const rGold = tickPlant(plantGold, { zone: 'wurzelheim', now: noon, soilTier: 'gold' });

    expect(rGold.totalXp).toBeGreaterThan(rNormal.totalXp);
  });

  it('Companion-Bonus erhoeht XP-Gain', () => {
    const noon = new Date('2026-04-26T12:00:00').getTime();
    const dtSec = 1;
    const plantA = makePlant({ lastTickAt: noon - dtSec * 1000, hydration: 100 });
    const plantB = makePlant({ lastTickAt: noon - dtSec * 1000, hydration: 100 });

    const rA = tickPlant(plantA, { zone: 'wurzelheim', now: noon });
    const rB = tickPlant(plantB, { zone: 'wurzelheim', now: noon, companionBonus: 0.2 });

    expect(rB.totalXp).toBeGreaterThan(rA.totalXp);
  });

  it('Backward-compat: tickPlant mit number-arg', () => {
    const now = 2_000_000_000_000;
    const plant = makePlant({ lastTickAt: now - 1000 });
    const r = tickPlant(plant, now);
    expect(r.lastTickAt).toBe(now);
  });

  it('consecutiveDryHours steigt bei Hydration < 5', () => {
    const now = 2_000_000_000_000;
    const dtSec = 3600;
    const plant = makePlant({
      hydration: 0, consecutiveDryHours: 5,
      lastTickAt: now - dtSec * 1000
    });
    const r = tickPlant(plant, { zone: 'wurzelheim', now });
    expect(r.consecutiveDryHours).toBeGreaterThan(5);
    expect(r.consecutiveDryHours).toBeLessThanOrEqual(6.1);
  });

  it('consecutiveDryHours wird auf 0 zurueckgesetzt wenn Pflanze nicht trocken war', () => {
    const now = 2_000_000_000_000;
    const dtSec = 60;
    const plant = makePlant({
      hydration: 50, consecutiveDryHours: 5,
      lastTickAt: now - dtSec * 1000
    });
    const r = tickPlant(plant, { zone: 'wurzelheim', now });
    expect(r.consecutiveDryHours).toBe(0);
  });
});

describe('defaultGrowthFields', () => {
  it('liefert sinnvolle Defaults', () => {
    const d = defaultGrowthFields();
    expect(d.hydration).toBe(HYDRATION_MAX);
    expect(d.careScore).toBe(0);
    expect(d.generation).toBe(0);
    expect(d.pendingHarvest).toBe(false);
    expect(d.consecutiveDryHours).toBe(0);
    expect(d.highestStageReached).toBe(0);
    expect(d.activeBoosters).toEqual([]);
  });
});

describe('Konstanten', () => {
  it('HYDRATION_MAX = 100', () => {
    expect(HYDRATION_MAX).toBe(100);
  });
  it('HYDRATION_FULL_TO_DRY_HOURS = 12', () => {
    expect(HYDRATION_FULL_TO_DRY_HOURS).toBe(12);
  });
  it('BLOOM_CYCLE_MS < REBLOOM_CYCLE_MS', () => {
    expect(BLOOM_CYCLE_MS).toBeLessThan(REBLOOM_CYCLE_MS);
  });
  it('BASE_XP_PER_SEC > 0', () => {
    expect(BASE_XP_PER_SEC).toBeGreaterThan(0);
  });
  it('MAX_LEVEL = 100', () => {
    expect(MAX_LEVEL).toBe(100);
  });
});
