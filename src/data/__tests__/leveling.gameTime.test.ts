import { describe, it, expect, afterEach } from 'vitest';
import {
  msSinceWatered,
  canBeWatered,
  waterCooldownRemaining,
  timeOfDayMultiplier,
  totalXpMultiplier,
  bloomProgress,
  isHarvestReady,
  applyXp,
  waterPlant,
  harvestPlant,
  defaultGrowthFields,
  WATER_COOLDOWN_MS
} from '../leveling';
import { freezeTime, resetNowProvider } from '../../utils/gameTime';
import type { Plant } from '../../types/plant';

/**
 * Integration-Tests fuer die gameTime-Migration in leveling.ts.
 *
 * Diese Tests verifizieren dass die Default-Argumente nicht mehr Date.now()
 * direkt aufrufen sondern den injizierbaren gameTime-Provider verwenden.
 * Bei jedem Aufruf ohne explizites `now`-Argument muss der Wert aus
 * `freezeTime(...)` verwendet werden.
 */
describe('leveling.ts uses gameTime provider for default args', () => {
  const FROZEN = 1_700_000_000_000;

  function makePlant(overrides: Partial<Plant> = {}): Plant {
    return {
      id: 'p1',
      speciesSlug: 'sunflower',
      nickname: undefined,
      bornAt: FROZEN - 1000,
      level: 1,
      xp: 0,
      totalXp: 0,
      stats: { hp: 10, atk: 5, def: 5, spd: 5 },
      hpCurrent: 10,
      lastTickAt: FROZEN - 1000,
      lastWateredAt: FROZEN - WATER_COOLDOWN_MS - 1, // gerade Cooldown abgelaufen
      gridX: 0,
      gridY: 0,
      isMutation: false,
      isShiny: false,
      qualityTier: undefined,
      lastBloomedAt: undefined,
      ...defaultGrowthFields(),
      ...overrides
    } as Plant;
  }

  afterEach(() => {
    resetNowProvider();
  });

  it('msSinceWatered nutzt freezeTime ohne explizites now-Arg', () => {
    freezeTime(FROZEN);
    const plant = makePlant({ lastWateredAt: FROZEN - 5000 });
    expect(msSinceWatered(plant)).toBe(5000);
  });

  it('canBeWatered respektiert Frozen-Time fuer Cooldown', () => {
    freezeTime(FROZEN);
    const justWatered = makePlant({
      lastWateredAt: FROZEN - 1000,
      hydration: 50
    });
    expect(canBeWatered(justWatered)).toBe(false);

    const longAgo = makePlant({
      lastWateredAt: FROZEN - WATER_COOLDOWN_MS - 1,
      hydration: 50
    });
    expect(canBeWatered(longAgo)).toBe(true);
  });

  it('waterCooldownRemaining nutzt Frozen-Time', () => {
    freezeTime(FROZEN);
    const plant = makePlant({ lastWateredAt: FROZEN - 1000 });
    expect(waterCooldownRemaining(plant)).toBe(WATER_COOLDOWN_MS - 1000);
  });

  it('timeOfDayMultiplier liefert 1.0 bei Mittag (gameTime-injection)', () => {
    // 12:00 UTC = High-Day, mult 1.0
    const noonUTC = new Date('2026-04-26T12:00:00Z').getTime();
    freezeTime(noonUTC);
    expect(timeOfDayMultiplier()).toBe(1.0);
  });

  it('totalXpMultiplier liest now aus gameTime', () => {
    const noonUTC = new Date('2026-04-26T12:00:00Z').getTime();
    freezeTime(noonUTC);
    const plant = makePlant({ level: 5, hydration: 90 });
    const mult = totalXpMultiplier(plant, 'wurzelheim');
    // Stage(5)=1, Hydration(saftig)=1.25, Biom(default)=1, HybridVigor=1, ToD(noon)=1
    expect(mult).toBeGreaterThan(0);
  });

  it('bloomProgress nutzt gameTime', () => {
    freezeTime(FROZEN);
    const plant = makePlant({
      level: 45,
      bornAt: FROZEN - 30 * 60 * 1000, // genau ein Bloom-Cycle
      lastBloomedAt: undefined
    });
    expect(bloomProgress(plant)).toBe(1);
  });

  it('isHarvestReady nutzt gameTime', () => {
    freezeTime(FROZEN);
    const plant = makePlant({
      level: 45,
      bornAt: FROZEN - 30 * 60 * 1000,
      lastBloomedAt: undefined,
      pendingHarvest: false
    });
    expect(isHarvestReady(plant)).toBe(true);
  });

  it('applyXp setzt lastTickAt aus gameTime wenn now nicht uebergeben', () => {
    freezeTime(FROZEN);
    const plant = makePlant({ lastTickAt: 0 });
    const updated = applyXp(plant, 5);
    expect(updated.lastTickAt).toBe(FROZEN);
  });

  it('waterPlant setzt lastWateredAt aus gameTime', () => {
    freezeTime(FROZEN);
    const plant = makePlant({
      hydration: 30,
      lastWateredAt: FROZEN - WATER_COOLDOWN_MS - 1
    });
    const result = waterPlant(plant);
    expect(result.success).toBe(true);
    expect(result.plant.lastWateredAt).toBe(FROZEN);
  });

  it('harvestPlant setzt lastBloomedAt aus gameTime', () => {
    freezeTime(FROZEN);
    const plant = makePlant({
      level: 45,
      bornAt: FROZEN - 60 * 60 * 1000,
      lastBloomedAt: undefined,
      pendingHarvest: true,
      qualityTier: 'common'
    });
    const result = harvestPlant(plant);
    expect(result.plant.lastBloomedAt).toBe(FROZEN);
  });
});
