import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tickPlant, BLOOM_CYCLE_MS, REBLOOM_CYCLE_MS, HYDRATION_MAX, STAGE_LEVEL_THRESHOLDS } from '../leveling';
import type { Plant } from '../../types/plant';

/**
 * Coverage-Targeted Tests fuer leveling.ts.
 *
 * Schliesst die letzten zwei uncovered Pfade in tickPlant():
 *  1) Lines 303-312: Stage-Down-Risiko bei consecutiveDryHours >= 24, Math.random < probPerSec * dtSec.
 *  2) Lines 338-344: Bloom-Cycle setzt pendingHarvest wenn bloomProgress >= 1.
 *
 * Hinweis: Stage-Down wirft level auf STAGE_LEVEL_THRESHOLDS[currStage - 1] zurueck.
 * Da bei vertrockneter Pflanze (hydration < 5) hydrationMultiplier negativ ist, kann
 * applyXp danach noch einen weiteren Level-Down ausloesen. Tests verifizieren den
 * Stage-Down-Effekt deshalb im Bereich [prevThreshold - 1, prevThreshold].
 *
 * Bloom-Cycle-Hinweis: Beim ersten Bloom wird `lastBloomedAt = bornAt` gesetzt
 * BEVOR bloomProgress aufgerufen wird. Da lastBloomedAt dann truthy ist, nutzt
 * bloomProgress den REBLOOM_CYCLE_MS, nicht den initialen BLOOM_CYCLE_MS.
 */

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

describe('tickPlant Stage-Down bei langer Trockenheit (Lines 303-312)', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random');
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('triggert Stage-Down wenn consecutiveDryHours >= 24 und Math.random klein genug ist', () => {
    (Math.random as unknown as { mockReturnValue: (v: number) => void }).mockReturnValue(0);
    const now = 2_000_000_000_000;
    const dtSec = 1;
    const plant = makePlant({
      level: 50,
      hydration: 0,
      consecutiveDryHours: 24,
      lastTickAt: now - dtSec * 1000
    });
    const r = tickPlant(plant, { zone: 'wurzelheim', now });
    // Stage-Down setzt level auf STAGE_LEVEL_THRESHOLDS[3] = 30, applyXp kann durch
    // negativen xpDelta (vertrocknet) noch ein Level abziehen -> Bereich [29, 30].
    expect(r.level).toBeLessThan(50);
    expect(r.level).toBeLessThanOrEqual(STAGE_LEVEL_THRESHOLDS[3]);
    expect(r.level).toBeGreaterThanOrEqual(STAGE_LEVEL_THRESHOLDS[3] - 1);
  });

  it('Stage-Down kann Level minimum 1 nicht unterschreiten (Math.max-Guard)', () => {
    (Math.random as unknown as { mockReturnValue: (v: number) => void }).mockReturnValue(0);
    const now = 2_000_000_000_000;
    const dtSec = 1;
    // Level >= STAGE_LEVEL_THRESHOLDS[1] (= 5) -> currStage = 1.
    // prevThreshold = STAGE_LEVEL_THRESHOLDS[0] = 1. Math.max(1, 1) = 1.
    const plant = makePlant({
      level: STAGE_LEVEL_THRESHOLDS[1],
      hydration: 0,
      consecutiveDryHours: 24,
      lastTickAt: now - dtSec * 1000
    });
    const r = tickPlant(plant, { zone: 'wurzelheim', now });
    expect(r.level).toBeGreaterThanOrEqual(1);
    expect(r.level).toBeLessThanOrEqual(STAGE_LEVEL_THRESHOLDS[0]);
  });

  it('triggert KEINEN Stage-Down wenn Math.random den Schwellwert ueberschreitet', () => {
    (Math.random as unknown as { mockReturnValue: (v: number) => void }).mockReturnValue(0.999999);
    const now = 2_000_000_000_000;
    const dtSec = 1;
    const plant = makePlant({
      level: 50,
      hydration: 0,
      consecutiveDryHours: 24,
      lastTickAt: now - dtSec * 1000
    });
    const r = tickPlant(plant, { zone: 'wurzelheim', now });
    // Kein Stage-Down: level bleibt nahe 50 (max ein Level-Down durch hydMult<0).
    expect(r.level).toBeGreaterThan(STAGE_LEVEL_THRESHOLDS[3]);
    expect(r.level).toBeGreaterThanOrEqual(49);
  });

  it('Stage-Down-Roll bei currStage 0 reduziert Level nicht (Schutz-Branch)', () => {
    (Math.random as unknown as { mockReturnValue: (v: number) => void }).mockReturnValue(0);
    const now = 2_000_000_000_000;
    const dtSec = 1;
    const plant = makePlant({
      level: 1,
      hydration: 0,
      consecutiveDryHours: 24,
      lastTickAt: now - dtSec * 1000
    });
    const r = tickPlant(plant, { zone: 'wurzelheim', now });
    expect(r.level).toBe(1);
  });
});

describe('tickPlant Bloom-Cycle setzt pendingHarvest (Lines 338-344)', () => {
  it('setzt pendingHarvest = true beim ersten Bloom (lastBloomedAt undefined, REBLOOM-Cycle erreicht)', () => {
    const bornAt = 2_000_000_000_000;
    // Plant in Stage 4, kein lastBloomedAt. Beim ersten Aufruf wird lastBloomedAt = bornAt
    // gesetzt, danach prueft bloomProgress mit REBLOOM_CYCLE_MS (lastBloomedAt ist truthy).
    const plant = makePlant({
      level: 50,
      bornAt,
      lastTickAt: bornAt + REBLOOM_CYCLE_MS - 1000,
      lastBloomedAt: undefined,
      pendingHarvest: false,
      hydration: HYDRATION_MAX
    });
    const now = bornAt + REBLOOM_CYCLE_MS + 5000;
    const r = tickPlant(plant, { zone: 'wurzelheim', now });
    expect(r.pendingHarvest).toBe(true);
    expect(r.lastBloomedAt).toBe(bornAt);
  });

  it('setzt pendingHarvest NICHT wenn bloomProgress < 1, initialisiert aber lastBloomedAt', () => {
    const bornAt = 2_000_000_000_000;
    const plant = makePlant({
      level: 50,
      bornAt,
      lastTickAt: bornAt + 100,
      lastBloomedAt: undefined,
      pendingHarvest: false,
      hydration: HYDRATION_MAX
    });
    // Tick noch deutlich vor REBLOOM_CYCLE_MS.
    const now = bornAt + REBLOOM_CYCLE_MS / 4;
    const r = tickPlant(plant, { zone: 'wurzelheim', now });
    expect(r.pendingHarvest).toBe(false);
    expect(r.lastBloomedAt).toBe(bornAt);
  });

  it('respektiert bestehendes lastBloomedAt im Re-Bloom-Cycle', () => {
    const bornAt = 2_000_000_000_000;
    const lastBloomedAt = bornAt + BLOOM_CYCLE_MS;
    const plant = makePlant({
      level: 50,
      bornAt,
      lastBloomedAt,
      lastTickAt: lastBloomedAt + REBLOOM_CYCLE_MS - 1000,
      pendingHarvest: false,
      hydration: HYDRATION_MAX
    });
    const now = lastBloomedAt + REBLOOM_CYCLE_MS + 5000;
    const r = tickPlant(plant, { zone: 'wurzelheim', now });
    expect(r.pendingHarvest).toBe(true);
    // lastBloomedAt unveraendert (ein Re-Bloom updatet lastBloomedAt nicht in tickPlant).
    expect(r.lastBloomedAt).toBe(lastBloomedAt);
  });

  it('blueht NICHT erneut wenn bereits pendingHarvest gesetzt ist (Idempotenz-Guard)', () => {
    const bornAt = 2_000_000_000_000;
    const plant = makePlant({
      level: 50,
      bornAt,
      lastTickAt: bornAt + BLOOM_CYCLE_MS,
      lastBloomedAt: bornAt,
      pendingHarvest: true,
      hydration: HYDRATION_MAX
    });
    const now = bornAt + BLOOM_CYCLE_MS + 5000;
    const r = tickPlant(plant, { zone: 'wurzelheim', now });
    expect(r.pendingHarvest).toBe(true);
  });
});

describe('tickPlant Sprinkler-Booster (Lines 261-263)', () => {
  it('Sprinkler haelt hydration min 80 selbst nach langem dtSec', () => {
    const startedAt = 2_000_000_000_000;
    const now = startedAt + 60 * 60 * 1000; // 1h spaeter
    const plant = makePlant({
      level: 30,
      hydration: 0,
      lastTickAt: startedAt,
      activeBoosters: [{
        type: 'sprinkler',
        startedAt,
        durationMs: 2 * 60 * 60 * 1000 // 2h aktiv
      }]
    });
    const r = tickPlant(plant, { zone: 'wurzelheim', now });
    expect(r.hydration).toBeGreaterThanOrEqual(80);
  });

  it('Ohne Sprinkler kann hydration auf 0 fallen', () => {
    const startedAt = 2_000_000_000_000;
    const now = startedAt + 60 * 60 * 1000;
    const plant = makePlant({
      level: 30,
      hydration: 0,
      lastTickAt: startedAt,
      activeBoosters: []
    });
    const r = tickPlant(plant, { zone: 'wurzelheim', now });
    expect(r.hydration).toBe(0);
  });
});

describe('tickPlant Edge-Cases (Lines 247, 277, 415)', () => {
  it('Default ctxOrNow: tickPlant ohne 2. Arg verwendet gameTimeNow', () => {
    // Line 247: `: ctxOrNow ?? { zone: 'wurzelheim', now: gameTimeNow() }`
    // ctxOrNow ist undefined -> Default-Branch wird genommen.
    const plant = makePlant({ lastTickAt: 1 });
    const r = tickPlant(plant);
    expect(r.lastTickAt).toBeGreaterThan(plant.lastTickAt);
  });

  it('Sun-Lamp setzt todMult auf 1.0 (Line 277, true-Branch)', () => {
    const startedAt = 2_000_000_000_000;
    const now = startedAt + 60_000;
    // Mitternacht waere normal todMult < 1, mit Sun-Lamp aber 1.0.
    const midnight = new Date('2026-04-26T03:00:00').getTime();
    const lampStartedAt = midnight - 1000;
    const plant = makePlant({
      level: 30,
      lastTickAt: midnight - 1000,
      bornAt: midnight - 1000,
      activeBoosters: [{
        type: 'sun-lamp',
        startedAt: lampStartedAt,
        durationMs: 60 * 60 * 1000
      }]
    });
    const r = tickPlant(plant, { zone: 'wurzelheim', now: midnight });
    // Mit Sun-Lamp wird die XP nicht durch Mitternachts-Penalty reduziert.
    expect(r.totalXp).toBeGreaterThan(plant.totalXp);
    // Plant-State unveraendert ausser durch tick (kein Crash).
    expect(r.lastTickAt).toBe(midnight);
    void startedAt; void now;
  });
});

import { harvestPlant } from '../leveling';

describe('harvestPlant ohne Harvest-Ready (Line 415)', () => {
  it('liefert leere Output und unveraenderten Plant wenn nicht harvest-ready', () => {
    const plant = makePlant({ level: 1, pendingHarvest: false });
    const result = harvestPlant(plant, plant.bornAt + 1000);
    expect(result.output.coins).toBe(0);
    expect(result.output.pollenChance).toBe(false);
    expect(result.output.seedSpeciesSlug).toBeUndefined();
    expect(result.plant).toBe(plant);
  });
});
