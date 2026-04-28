import { describe, it, expect } from 'vitest';
import {
  FORAGE_TILE_BUSH, FORAGE_TILE_WILDPLANT, FORAGE_COOLDOWN_MS,
  FORAGE_POOLS,
  rollForagePool,
  isForageTile,
  HIDDEN_SPOTS,
  findHiddenSpot
} from '../foraging';

describe('Foraging-Konstanten', () => {
  it('FORAGE_COOLDOWN_MS = 1 Stunde', () => {
    expect(FORAGE_COOLDOWN_MS).toBe(60 * 60 * 1000);
  });

  it('FORAGE_TILE_BUSH und WILDPLANT sind unterschiedlich', () => {
    expect(FORAGE_TILE_BUSH).not.toBe(FORAGE_TILE_WILDPLANT);
  });
});

describe('FORAGE_POOLS', () => {
  it('hat Pools fuer alle 7 Biome', () => {
    expect(FORAGE_POOLS.wurzelheim).toBeDefined();
    expect(FORAGE_POOLS.verdanto).toBeDefined();
    expect(FORAGE_POOLS.kaktoria).toBeDefined();
    expect(FORAGE_POOLS.frostkamm).toBeDefined();
    expect(FORAGE_POOLS.salzbucht).toBeDefined();
    expect(FORAGE_POOLS.mordwald).toBeDefined();
    expect(FORAGE_POOLS.magmabluete).toBeDefined();
  });

  it('jeder Pool hat mindestens 3 Seeds', () => {
    for (const pool of Object.values(FORAGE_POOLS)) {
      expect(pool.seedSlugs.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('rollForagePool', () => {
  it('liefert itemSlug + toastLabel aus dem Pool', () => {
    const r = rollForagePool('wurzelheim');
    expect(r.itemSlug).toBeTruthy();
    expect(r.toastLabel).toBeTruthy();
  });

  it('Fallback auf wurzelheim bei unbekannter zone', () => {
    const r = rollForagePool('not-a-zone');
    const wurzelheimItems = [...FORAGE_POOLS.wurzelheim.seedSlugs, ...(FORAGE_POOLS.wurzelheim.itemSlugs ?? [])];
    expect(wurzelheimItems).toContain(r.itemSlug);
  });

  it('liefert nur Items aus dem zone-Pool', () => {
    for (let i = 0; i < 30; i++) {
      const r = rollForagePool('mordwald');
      const validItems = [...FORAGE_POOLS.mordwald.seedSlugs, ...(FORAGE_POOLS.mordwald.itemSlugs ?? [])];
      expect(validItems).toContain(r.itemSlug);
    }
  });
});

describe('isForageTile', () => {
  it('true fuer Bush und Wildplant', () => {
    expect(isForageTile(FORAGE_TILE_BUSH)).toBe(true);
    expect(isForageTile(FORAGE_TILE_WILDPLANT)).toBe(true);
  });

  it('false fuer andere Tiles', () => {
    expect(isForageTile(0)).toBe(false);
    expect(isForageTile(1)).toBe(false);
    expect(isForageTile(99)).toBe(false);
  });
});

describe('HIDDEN_SPOTS', () => {
  it('hat mindestens 3 Hidden-Spots', () => {
    expect(HIDDEN_SPOTS.length).toBeGreaterThanOrEqual(3);
  });

  it('jeder Spot hat zone, x, y, reward', () => {
    for (const s of HIDDEN_SPOTS) {
      expect(s.zone).toBeTruthy();
      expect(typeof s.tileX).toBe('number');
      expect(typeof s.tileY).toBe('number');
    }
  });
});

describe('findHiddenSpot', () => {
  it('liefert spot bei matchenden Koordinaten', () => {
    const first = HIDDEN_SPOTS[0];
    expect(findHiddenSpot(first.zone, first.tileX, first.tileY)).toEqual(first);
  });

  it('liefert undefined bei unbekannten Koordinaten', () => {
    expect(findHiddenSpot('wurzelheim', 9999, 9999)).toBeUndefined();
  });

  it('liefert undefined bei richtiger Pos aber falscher zone', () => {
    const first = HIDDEN_SPOTS[0];
    expect(findHiddenSpot('not-a-zone', first.tileX, first.tileY)).toBeUndefined();
  });
});
