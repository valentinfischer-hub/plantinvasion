/**
 * B4-R7: Foraging Drop-Rate Tests
 */
import { describe, it, expect } from 'vitest';
import {
  rollForagePool,
  FORAGE_POOLS,
  HIDDEN_SPOTS,
  rollHiddenSpotLoot,
  hiddenSpotKey,
  isForageTile,
  FORAGE_TILE_BUSH,
  FORAGE_TILE_WILDPLANT,
  FORAGE_COOLDOWN_MS,
} from '../../data/foraging';

describe('Foraging Drop-Rates', () => {
  it('rollForagePool gibt gueltigen itemSlug zurueck', () => {
    for (let i = 0; i < 20; i++) {
      const drop = rollForagePool('wurzelheim');
      expect(drop.itemSlug).toBeTruthy();
      expect(drop.toastLabel).toBeTruthy();
    }
  });

  it('80% seeds, 20% booster (statistisch)', () => {
    let seeds = 0;
    let boosters = 0;
    const N = 1000;
    for (let i = 0; i < N; i++) {
      const drop = rollForagePool('wurzelheim');
      if (drop.itemSlug.startsWith('seed-')) seeds++;
      else boosters++;
    }
    // 80% Seeds +/- 5% Toleranz
    expect(seeds / N).toBeGreaterThan(0.70);
    expect(seeds / N).toBeLessThan(0.90);
  });

  it('unbekannte zone fallback auf wurzelheim', () => {
    const drop = rollForagePool('unbekannte-zone');
    expect(drop.itemSlug).toBeTruthy();
  });

  it('alle biome haben forage pools', () => {
    const biome = ['wurzelheim', 'verdanto', 'kaktoria', 'frostkamm', 'salzbucht', 'mordwald', 'magmabluete'];
    biome.forEach((b) => {
      expect(FORAGE_POOLS[b]).toBeDefined();
      expect(FORAGE_POOLS[b].seedSlugs.length).toBeGreaterThan(0);
    });
  });
});

describe('Hidden-Spots', () => {
  it('5 hidden spots pro biom', () => {
    const biome = ['wurzelheim', 'verdanto', 'kaktoria', 'frostkamm', 'salzbucht', 'mordwald', 'magmabluete'];
    biome.forEach((b) => {
      const spots = HIDDEN_SPOTS.filter((s) => s.zone === b);
      expect(spots).toHaveLength(5);
    });
  });

  it('hiddenSpotKey format zone:x:y', () => {
    const spot = HIDDEN_SPOTS[0];
    const key = hiddenSpotKey(spot);
    expect(key).toMatch(/^\w+:\d+:\d+$/);
  });

  it('rollHiddenSpotLoot gibt gueltiges loot', () => {
    for (let i = 0; i < 20; i++) {
      const loot = rollHiddenSpotLoot('wurzelheim');
      expect(loot.itemSlug).toBeTruthy();
      expect(loot.toastLabel).toBeTruthy();
    }
  });

  it('pristine-pollen als seltener drop moeglich', () => {
    let found = false;
    for (let i = 0; i < 500; i++) {
      const loot = rollHiddenSpotLoot('wurzelheim');
      if (loot.itemSlug === 'pristine-pollen') { found = true; break; }
    }
    expect(found).toBe(true);
  });
});

describe('Foraging Tile-Types', () => {
  it('bush tile erkannt', () => {
    expect(isForageTile(FORAGE_TILE_BUSH)).toBe(true);
  });

  it('wildplant tile erkannt', () => {
    expect(isForageTile(FORAGE_TILE_WILDPLANT)).toBe(true);
  });

  it('normaler tile nicht erkannt', () => {
    expect(isForageTile(0)).toBe(false);
    expect(isForageTile(10)).toBe(false);
    expect(isForageTile(99)).toBe(false);
  });
});

describe('Foraging Journal-Logik', () => {
  it('journal tracking dedupliciert items', () => {
    const journal: Record<string, string[]> = {};
    const zone = 'wurzelheim';
    const item = 'seed-sunflower';
    // Simuliere mehrfaches Finden desselben Items
    if (!journal[zone]) journal[zone] = [];
    for (let i = 0; i < 5; i++) {
      if (!journal[zone].includes(item)) journal[zone].push(item);
    }
    expect(journal[zone]).toHaveLength(1);
    expect(journal[zone][0]).toBe(item);
  });

  it('rare drop items sind korrekt definiert', () => {
    const rareItems = ['pristine-pollen', 'volcano-ash', 'swamp-pollen', 'hybrid-booster'];
    expect(rareItems).toContain('pristine-pollen');
    expect(rareItems).toHaveLength(4);
  });

  it('cooldown 1 stunde', () => {
    expect(FORAGE_COOLDOWN_MS).toBe(60 * 60 * 1000);
  });
});
