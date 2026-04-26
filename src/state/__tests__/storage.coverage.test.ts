import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadGame, saveGame, SAVE_SCHEMA_VERSION, type GameState } from '../storage';

/**
 * Coverage-Targeted Tests fuer storage.ts.
 *
 * Schliesst die letzten zwei uncovered Pfade:
 *  1) Line 100: ensurePlantGrowthFields ternary `: plant.parentAId ? 1 : 0`
 *     wenn plant.parentAId truthy ist -> generation = 1 (vorher nur 0-Pfad covered).
 *  2) Lines 274-275: catch-Block in saveGame() loggt Fehler wenn
 *     localStorage.setItem wirft (Storage-Quota-Exceeded-Pfad).
 */

class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string): string | null { return this.store[key] ?? null; }
  setItem(key: string, value: string): void { this.store[key] = value; }
  removeItem(key: string): void { delete this.store[key]; }
  clear(): void { this.store = {}; }
  get length(): number { return Object.keys(this.store).length; }
  key(idx: number): string | null { return Object.keys(this.store)[idx] ?? null; }
}

const STORAGE_KEY = 'plantinvasion_save_v1';

beforeEach(() => {
  const mock = new LocalStorageMock();
  vi.stubGlobal('localStorage', mock);
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ensurePlantGrowthFields generation aus parentAId (Line 100)', () => {
  it('liefert generation = 1 wenn parentAId vorhanden und generation NICHT gesetzt ist', () => {
    // v1-Save-Plant ohne `generation`-Feld, aber MIT parentAId -> Hybrid-Kind.
    const plantWithParent = {
      id: 'p-hybrid',
      speciesSlug: 'sunflower',
      stats: { atk: 10, def: 10, spd: 10 },
      geneSeed: 1234,
      isMutation: false,
      level: 1,
      xp: 0,
      totalXp: 0,
      bornAt: 1_700_000_000_000,
      lastWateredAt: 1_700_000_000_000,
      lastTickAt: 1_700_000_000_000,
      gridX: 0,
      gridY: 0,
      parentAId: 'p-mom',
      parentBId: 'p-dad'
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1,
      playerId: 'test',
      plants: [plantWithParent],
      coins: 100,
      gems: 5,
      createdAt: 1_700_000_000_000
    }));
    const state = loadGame();
    expect(state).not.toBeNull();
    expect(state!.plants[0].generation).toBe(1);
  });

  it('liefert generation = 0 wenn weder generation noch parentAId gesetzt sind', () => {
    const plantOrphan = {
      id: 'p-orphan',
      speciesSlug: 'sunflower',
      stats: { atk: 10, def: 10, spd: 10 },
      geneSeed: 1234,
      isMutation: false,
      level: 1,
      xp: 0,
      totalXp: 0,
      bornAt: 1_700_000_000_000,
      lastWateredAt: 1_700_000_000_000,
      lastTickAt: 1_700_000_000_000,
      gridX: 0,
      gridY: 0
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1,
      playerId: 'test',
      plants: [plantOrphan],
      coins: 100,
      gems: 5,
      createdAt: 1_700_000_000_000
    }));
    const state = loadGame();
    expect(state).not.toBeNull();
    expect(state!.plants[0].generation).toBe(0);
  });

  it('respektiert vorhandenes generation-Feld (truthy number-Branch)', () => {
    const plantWithGen = {
      id: 'p-gen3',
      speciesSlug: 'sunflower',
      stats: { atk: 10, def: 10, spd: 10 },
      geneSeed: 1234,
      isMutation: false,
      level: 1,
      xp: 0,
      totalXp: 0,
      bornAt: 1_700_000_000_000,
      lastWateredAt: 1_700_000_000_000,
      lastTickAt: 1_700_000_000_000,
      gridX: 0,
      gridY: 0,
      generation: 3
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1,
      playerId: 'test',
      plants: [plantWithGen],
      coins: 100,
      gems: 5,
      createdAt: 1_700_000_000_000
    }));
    const state = loadGame();
    expect(state).not.toBeNull();
    expect(state!.plants[0].generation).toBe(3);
  });
});

describe('saveGame catch-Block bei localStorage-Failure (Lines 274-275)', () => {
  it('loggt console.error wenn localStorage.setItem wirft (Quota-Exceeded-Sim)', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const setItemSpy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    const state: Partial<GameState> = {
      version: SAVE_SCHEMA_VERSION,
      playerId: 'qe-test',
      plants: [],
      coins: 0,
      gems: 0,
      createdAt: 1_700_000_000_000
    };
    expect(() => saveGame(state as GameState)).not.toThrow();
    expect(errorSpy).toHaveBeenCalledWith('Failed to save game state', expect.any(DOMException));

    setItemSpy.mockRestore();
  });

  it('saveGame normaler Pfad ruft kein console.error', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const state: Partial<GameState> = {
      version: SAVE_SCHEMA_VERSION,
      playerId: 'ok-test',
      plants: [],
      coins: 1,
      gems: 1,
      createdAt: 1_700_000_000_000
    };
    saveGame(state as GameState);
    expect(errorSpy).not.toHaveBeenCalled();
  });
});

describe('Save-Migration v1 minimal-Save (Lines 232-235 ?? defaults)', () => {
  it('migriert v1 ohne plants/coins/gems/createdAt -> alle Defaults greifen', () => {
    // Minimal v1-Save ohne optionale Felder -> jede `?? default`-Zweige wird genommen.
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1,
      playerId: 'minimal'
    }));
    const state = loadGame();
    expect(state).not.toBeNull();
    expect(state!.version).toBe(SAVE_SCHEMA_VERSION);
    expect(state!.plants).toEqual([]);
    expect(state!.coins).toBe(0);
    expect(state!.gems).toBe(0);
    expect(typeof state!.createdAt).toBe('number');
  });
});

describe('Save-Migration v2 ohne plants (Lines 222-223 if-plants-Branch)', () => {
  it('migriert v2 ohne plants-Feld -> pokedex bleibt leer', () => {
    // v2-Save ohne plants -> if (parsed.plants) Branch wird false.
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 2,
      playerId: 'no-plants',
      coins: 50,
      gems: 0,
      createdAt: 1_700_000_000_000
    }));
    const state = loadGame();
    expect(state).not.toBeNull();
    expect(state!.pokedex!.discovered).toEqual([]);
    expect(state!.pokedex!.captured).toEqual([]);
  });
});
