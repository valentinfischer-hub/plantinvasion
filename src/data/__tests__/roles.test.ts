import { describe, it, expect } from 'vitest';
import { plantRole } from '../roles';
import type { Plant } from '../../types/plant';

function makePlant(atk: number, def: number, spd: number): Plant {
  return {
    id: 'p1', speciesSlug: 's', stats: { atk, def, spd },
    geneSeed: 1, isMutation: false, level: 1, xp: 0, totalXp: 0,
    bornAt: 0, lastWateredAt: 0, lastTickAt: 0,
    hydration: 50, careScore: 0, generation: 0, pendingHarvest: false,
    consecutiveDryHours: 0, highestStageReached: 0, activeBoosters: [],
    gridX: 0, gridY: 0
  };
}

describe('plantRole', () => {
  it('DPS bei hohem ATK', () => {
    const r = plantRole(makePlant(50, 10, 10));
    expect(r.role).toBe('DPS');
    expect(r.color).toBe(0xff5c5c);
    expect(r.hint).toContain('Schaden');
  });
  it('Tank bei hohem DEF', () => {
    const r = plantRole(makePlant(10, 50, 10));
    expect(r.role).toBe('Tank');
    expect(r.color).toBe(0x5b8de8);
  });
  it('Support bei hohem SPD', () => {
    const r = plantRole(makePlant(10, 10, 50));
    expect(r.role).toBe('Support');
    expect(r.color).toBe(0x9be36e);
  });
  it('Control bei balanced Stats (max-avg < 8)', () => {
    const r = plantRole(makePlant(20, 22, 24));
    expect(r.role).toBe('Control');
    expect(r.color).toBe(0xb86ee3);
  });
  it('Control bei genau gleichen Stats', () => {
    const r = plantRole(makePlant(15, 15, 15));
    expect(r.role).toBe('Control');
  });
  it('DPS gewinnt vs Tank wenn ATK = DEF (Tie-Break: ATK first)', () => {
    const r = plantRole(makePlant(50, 50, 10));
    // max = 50, avg = ~37, max-avg = 13 (>= 8) -> nicht Control
    // atk === max -> DPS
    expect(r.role).toBe('DPS');
  });
  it('hint ist immer gesetzt', () => {
    const r = plantRole(makePlant(10, 20, 30));
    expect(r.hint).toBeDefined();
    expect(r.hint.length).toBeGreaterThan(0);
  });
  it('color ist immer gesetzt (4 unterscheidbare Werte)', () => {
    const colors = new Set([
      plantRole(makePlant(50, 10, 10)).color,
      plantRole(makePlant(10, 50, 10)).color,
      plantRole(makePlant(10, 10, 50)).color,
      plantRole(makePlant(15, 15, 15)).color
    ]);
    expect(colors.size).toBe(4);
  });
});
