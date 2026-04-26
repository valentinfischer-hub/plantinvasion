import { describe, it, expect, afterEach } from 'vitest';
import {
  defaultGenome,
  canCross,
  setCrossCooldown,
  isOnCooldown,
  formatCooldown,
  CROSS_COOLDOWN_MS,
  CROSS_COOLDOWN_MS_SYMBIOTIC,
} from '../breedingV2';
import { mulberry32 } from '../genetics';
import { freezeTime, resetNowProvider } from '../../utils/gameTime';
import type { Plant } from '../../types/plant';

/**
 * Integration-Tests fuer die gameTime-Migration in breedingV2.ts.
 * Verifiziert dass canCross, setCrossCooldown, isOnCooldown und
 * formatCooldown den injizierbaren gameTime-Provider nutzen statt
 * direkt Date.now() aufzurufen.
 */
describe('breedingV2.ts uses gameTime provider for default args', () => {
  const FROZEN = 1_700_000_000_000;

  function makePlant(overrides: Partial<Plant> = {}): Plant {
    return {
      id: 'p_test',
      speciesSlug: 'sunflower',
      stats: { hp: 100, atk: 100, def: 100, spd: 100 },
      geneSeed: 1,
      isMutation: false,
      level: 30,
      xp: 0,
      totalXp: 0,
      bornAt: 0,
      lastTickAt: 0,
      lastWateredAt: 0,
      hydration: 100,
      careScore: 0,
      generation: 1,
      pendingHarvest: false,
      consecutiveDryHours: 0,
      highestStageReached: 'seedling',
      gridX: 0,
      gridY: 0,
      isShiny: false,
      genome: defaultGenome(mulberry32(1)),
      ...overrides,
    } as Plant;
  }

  afterEach(() => {
    resetNowProvider();
  });

  it('setCrossCooldown verwendet gameTimeNow statt Date.now', () => {
    freezeTime(FROZEN);
    const plant = makePlant();
    setCrossCooldown(plant);
    expect(plant.genome?.crossCooldownUntil).toBe(FROZEN + CROSS_COOLDOWN_MS);
  });

  it('setCrossCooldown halbiert Cooldown fuer Symbiotic-Trait', () => {
    freezeTime(FROZEN);
    const plant = makePlant();
    plant.genome = { ...defaultGenome(mulberry32(2)), traits: ['symbiotic'] };
    setCrossCooldown(plant);
    expect(plant.genome.crossCooldownUntil).toBe(FROZEN + CROSS_COOLDOWN_MS_SYMBIOTIC);
  });

  it('setCrossCooldown initialisiert Genome wenn keines existiert', () => {
    freezeTime(FROZEN);
    const plant = makePlant({ genome: undefined });
    setCrossCooldown(plant);
    expect(plant.genome).toBeDefined();
    expect(plant.genome?.crossCooldownUntil).toBe(FROZEN + CROSS_COOLDOWN_MS);
  });

  it('canCross nutzt freezeTime ohne explizites now-Arg', () => {
    freezeTime(FROZEN);
    const plant = makePlant();
    plant.genome!.crossCooldownUntil = FROZEN + 60_000; // 1 Minute zukunft
    const result = canCross(plant);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('Erholungszeit');
  });

  it('canCross liefert ok=true wenn Cooldown gegenueber gameTime abgelaufen ist', () => {
    freezeTime(FROZEN);
    const plant = makePlant();
    plant.genome!.crossCooldownUntil = FROZEN - 1; // 1 ms vorbei
    const result = canCross(plant);
    expect(result.ok).toBe(true);
  });

  it('isOnCooldown zieht gameTimeNow als Default-Now', () => {
    freezeTime(FROZEN);
    const plant = makePlant();
    plant.genome!.crossCooldownUntil = FROZEN + 1;
    expect(isOnCooldown(plant)).toBe(true);
    plant.genome!.crossCooldownUntil = FROZEN - 1;
    expect(isOnCooldown(plant)).toBe(false);
  });

  it('formatCooldown rechnet relativ zu gameTimeNow', () => {
    freezeTime(FROZEN);
    const plant = makePlant();
    plant.genome!.crossCooldownUntil = FROZEN + 3 * 3600_000 + 30 * 60_000;
    expect(formatCooldown(plant)).toBe('3h 30m');
  });

  it('formatCooldown liefert Leerstring wenn Cooldown abgelaufen', () => {
    freezeTime(FROZEN);
    const plant = makePlant();
    plant.genome!.crossCooldownUntil = FROZEN - 1;
    expect(formatCooldown(plant)).toBe('');
  });

  it('formatCooldown liefert Leerstring wenn Cooldown nicht gesetzt', () => {
    freezeTime(FROZEN);
    const plant = makePlant();
    plant.genome!.crossCooldownUntil = undefined;
    expect(formatCooldown(plant)).toBe('');
  });

  it('Round-Trip: setCrossCooldown -> canCross/isOnCooldown sehen gefrorene Zeit konsistent', () => {
    freezeTime(FROZEN);
    const plant = makePlant();
    setCrossCooldown(plant);
    expect(isOnCooldown(plant)).toBe(true);
    expect(canCross(plant).ok).toBe(false);
    // Zeit ueber Cooldown hinweg vorspulen
    freezeTime(FROZEN + CROSS_COOLDOWN_MS + 1);
    expect(isOnCooldown(plant)).toBe(false);
    expect(canCross(plant).ok).toBe(true);
  });

  it('canCross blockt Plants unter Level 5 unabhaengig von gameTime', () => {
    freezeTime(FROZEN);
    const plant = makePlant({ level: 4 });
    const result = canCross(plant);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('Level 5');
  });
});
