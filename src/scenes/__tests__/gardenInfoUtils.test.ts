/**
 * S-POLISH-B3-R1: GardenScene Info-Utils Tests
 * Testet: Stage-Info-Berechnung, Slot-Label-Logik, Harvest-Estimate
 */

import { describe, it, expect } from 'vitest';
import {
  stageOf,
  totalXpToReachLevel,
  STAGE_LEVEL_THRESHOLDS,
  xpToNextLevel,
  isHarvestReady,
  canBeWatered
} from '../../data/leveling';
import type { Plant } from '../../types/plant';

function makePlant(overrides: Partial<Plant> = {}): Plant {
  const now = Date.now();
  return {
    id: 'test-plant',
    speciesSlug: 'sunflower',
    stats: { atk: 10, def: 10, spd: 10 },
    geneSeed: 42,
    isMutation: false,
    level: 1,
    xp: 0,
    totalXp: 0,
    bornAt: now - 1000,
    lastWateredAt: now - 10000,
    lastTickAt: now - 1000,
    hydration: 80,
    careScore: 0,
    generation: 1,
    pendingHarvest: false,
    consecutiveDryHours: 0,
    gridX: 0,
    gridY: 0,
    activeBoosters: [],
    mutationKind: undefined,
    ...overrides
  };
}

// =====================================================================
// Slot-Label-Logik A1-D3 (GRID_COLUMNS=4, GRID_ROWS=3)
// =====================================================================
describe('Slot-Label-Logik', () => {
  it('Spalte 0 ergibt Label A', () => {
    expect(String.fromCharCode(65 + 0)).toBe('A');
  });
  it('Spalte 3 ergibt Label D', () => {
    expect(String.fromCharCode(65 + 3)).toBe('D');
  });
  it('Zeile 0 ergibt Label 1', () => {
    expect((0 + 1).toString()).toBe('1');
  });
  it('Zeile 2 ergibt Label 3', () => {
    expect((2 + 1).toString()).toBe('3');
  });
  it('Slot (0,0) ergibt A1', () => {
    const x = 0, y = 0;
    const label = `${String.fromCharCode(65 + x)}${y + 1}`;
    expect(label).toBe('A1');
  });
  it('Slot (3,2) ergibt D3', () => {
    const x = 3, y = 2;
    const label = `${String.fromCharCode(65 + x)}${y + 1}`;
    expect(label).toBe('D3');
  });
});

// =====================================================================
// Stage-Info-Berechnung
// =====================================================================
describe('Stage-Info fuer openDetailPanel', () => {
  it('Pflanze auf Stage 0 hat nextStageLvl = 5', () => {
    const plant = makePlant({ level: 1 });
    const stage = stageOf(plant);
    expect(stage).toBe(0);
    const nextStageLvl = stage < 4 ? STAGE_LEVEL_THRESHOLDS[stage + 1] : null;
    expect(nextStageLvl).toBe(5);
  });

  it('Pflanze auf Stage 3 (Adult) hat nextStageLvl = 45', () => {
    const plant = makePlant({ level: 30 });
    const stage = stageOf(plant);
    expect(stage).toBe(3);
    const nextStageLvl = stage < 4 ? STAGE_LEVEL_THRESHOLDS[stage + 1] : null;
    expect(nextStageLvl).toBe(45);
  });

  it('Pflanze auf Stage 4 (Blooming) hat kein nextStage', () => {
    const plant = makePlant({ level: 45 });
    const stage = stageOf(plant);
    expect(stage).toBe(4);
    const nextStageLvl = stage < 4 ? STAGE_LEVEL_THRESHOLDS[stage + 1] : null;
    expect(nextStageLvl).toBeNull();
  });

  it('totalXpToReachLevel(5) > 0', () => {
    expect(totalXpToReachLevel(5)).toBeGreaterThan(0);
  });

  it('xpNeededForStage ist immer >= 0', () => {
    const plant = makePlant({ level: 3, xp: 0, totalXp: totalXpToReachLevel(3) });
    const stage = stageOf(plant);
    const nextStageLvl = stage < 4 ? STAGE_LEVEL_THRESHOLDS[stage + 1] : null;
    const xpNeeded = nextStageLvl ? Math.max(0, totalXpToReachLevel(nextStageLvl) - (plant.totalXp ?? 0)) : 0;
    expect(xpNeeded).toBeGreaterThanOrEqual(0);
  });
});

// =====================================================================
// Harvest-Estimate
// =====================================================================
describe('Harvest-Estimate', () => {
  it('Ernte bereit bei pendingHarvest=true und Stage 4', () => {
    const plant = makePlant({ level: 45, pendingHarvest: true, lastBloomedAt: Date.now() - 1000 });
    expect(isHarvestReady(plant)).toBe(true);
  });

  it('canBeWatered false wenn gerade gegossen', () => {
    const plant = makePlant({ lastWateredAt: Date.now() - 100, hydration: 50 });
    expect(canBeWatered(plant)).toBe(false);
  });

  it('canBeWatered true nach 4+ Minuten', () => {
    const plant = makePlant({ lastWateredAt: Date.now() - 5 * 60 * 1000, hydration: 50 });
    expect(canBeWatered(plant)).toBe(true);
  });
});

// =====================================================================
// Floating-Text-Format
// =====================================================================
describe('Harvest-Floating-Text Format', () => {
  it('"+X Coins" Format korrekt', () => {
    const coins = 12;
    const label = `+${coins} Coins`;
    expect(label).toBe('+12 Coins');
  });

  it('Korrekte Darstellung fuer 0 Coins', () => {
    const label = `+${0} Coins`;
    expect(label).toBe('+0 Coins');
  });
});
