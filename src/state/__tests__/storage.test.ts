import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadGame, saveGame, resetGame, SAVE_SCHEMA_VERSION, type GameState } from '../storage';

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

function rawSave(version: number, extras: Record<string, unknown> = {}): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    version,
    playerId: 'test-player',
    plants: [],
    coins: 100,
    gems: 5,
    createdAt: 1_700_000_000_000,
    ...extras
  }));
}

function plantV1(id = 'p1'): Record<string, unknown> {
  return {
    id,
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
}

describe('loadGame ohne Save', () => {
  it('liefert null wenn Storage leer', () => {
    expect(loadGame()).toBeNull();
  });

  it('liefert null bei kaputtem JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json');
    expect(loadGame()).toBeNull();
  });

  it('liefert null bei null-Body', () => {
    localStorage.setItem(STORAGE_KEY, 'null');
    expect(loadGame()).toBeNull();
  });

  it('liefert null bei unbekannter Version', () => {
    rawSave(999);
    expect(loadGame()).toBeNull();
  });
});

describe('Save-Migration v1 -> aktuelle Version', () => {
  it('migriert v1 ueber v3 weiter zum aktuellen Schema', () => {
    rawSave(1, { plants: [plantV1()] });
    const state = loadGame();
    expect(state).not.toBeNull();
    expect(state!.version).toBe(SAVE_SCHEMA_VERSION);
    expect(state!.pokedex).toBeDefined();
    expect(state!.inventory).toBeDefined();
    expect(state!.quests).toEqual({});
  });

  it('v1 backfillt growth-fields auf alle Pflanzen', () => {
    rawSave(1, { plants: [plantV1()] });
    const state = loadGame();
    expect(state!.plants[0].hydration).toBeGreaterThan(0);
    expect(state!.plants[0].activeBoosters).toEqual([]);
    expect(state!.plants[0].consecutiveDryHours).toBe(0);
    expect(state!.plants[0].generation).toBe(0);
  });
});

describe('Save-Migration v2 -> aktuelle Version', () => {
  it('befuellt pokedex aus Plant-Liste', () => {
    rawSave(2, {
      plants: [
        { ...plantV1('p1'), speciesSlug: 'sunflower' },
        { ...plantV1('p2'), speciesSlug: 'spike-cactus' }
      ]
    });
    const state = loadGame();
    expect(state!.version).toBe(SAVE_SCHEMA_VERSION);
    expect(state!.pokedex!.captured).toContain('sunflower');
    expect(state!.pokedex!.captured).toContain('spike-cactus');
  });
});

describe('Save-Migration v3 -> aktuelle Version', () => {
  it('befuellt inventory mit Defaults', () => {
    rawSave(3, { plants: [], pokedex: { discovered: [], captured: [] } });
    const state = loadGame();
    expect(state!.version).toBe(SAVE_SCHEMA_VERSION);
    expect(state!.inventory).toEqual({ 'basic-lure': 3, 'heal-tonic': 2 });
  });
});

describe('Save-Migration v4 -> aktuelle Version', () => {
  it('befuellt quests mit leerem Objekt', () => {
    rawSave(4, {
      plants: [],
      pokedex: { discovered: [], captured: [] },
      inventory: {}
    });
    const state = loadGame();
    expect(state!.version).toBe(SAVE_SCHEMA_VERSION);
    expect(state!.quests).toEqual({});
  });
});

describe('Save-Migration v5 -> aktuelle Version', () => {
  it('backfillt Growth-Felder fuer alle Pflanzen', () => {
    rawSave(5, {
      plants: [plantV1('p1')],
      pokedex: { discovered: [], captured: [] },
      inventory: {},
      quests: {}
    });
    const state = loadGame();
    expect(state!.version).toBe(SAVE_SCHEMA_VERSION);
    expect(state!.plants[0].hydration).toBeGreaterThan(0);
    expect(state!.plants[0].careScore).toBe(0);
  });
});

describe('Save-Migration v6 -> aktuelle Version', () => {
  it('migriert v6 vollstaendig nach SAVE_SCHEMA_VERSION', () => {
    rawSave(6, {
      plants: [plantV1('p1')],
      pokedex: { discovered: [], captured: [] },
      inventory: {},
      quests: {}
    });
    const state = loadGame();
    expect(state).not.toBeNull();
    expect(state!.version).toBe(SAVE_SCHEMA_VERSION);
  });

  it('legt gardenSlots an', () => {
    rawSave(6, { plants: [], pokedex: { discovered: [], captured: [] }, inventory: {}, quests: {} });
    const state = loadGame();
    expect(state!.gardenSlots).toBeDefined();
    expect(state!.gardenSlots!.length).toBeGreaterThan(0);
    expect(state!.gardenSlots![0].soilTier).toBe('normal');
  });
});

describe('Save-Migration v7 -> aktuelle Version', () => {
  it('migriert v7 vollstaendig zum aktuellen Schema', () => {
    rawSave(7, {
      plants: [],
      pokedex: { discovered: [], captured: [] },
      inventory: {},
      quests: {},
      gardenSlots: []
    });
    const state = loadGame();
    expect(state).not.toBeNull();
    expect(state!.version).toBe(SAVE_SCHEMA_VERSION);
  });

  it('befuellt foraging und achievements bei v7', () => {
    rawSave(7, {
      plants: [],
      pokedex: { discovered: [], captured: [] },
      inventory: {},
      quests: {}
    });
    const state = loadGame();
    expect(state!.forageTilesCooldown).toEqual({});
    expect(state!.collectedHiddenSpots).toEqual([]);
    expect(state!.lastBerryMasterAt).toBe(0);
    expect(state!.achievements).toEqual([]);
    expect(state!.achievementCounters).toBeDefined();
  });
});

describe('Save-Migration v8 -> aktuelle Version', () => {
  it('migriert v8 vollstaendig zum aktuellen Schema', () => {
    rawSave(8, {
      plants: [],
      pokedex: { discovered: [], captured: [] },
      inventory: {},
      quests: {},
      gardenSlots: []
    });
    const state = loadGame();
    expect(state).not.toBeNull();
    expect(state!.version).toBe(SAVE_SCHEMA_VERSION);
  });

  it('legt Time-System mit Default 06:00 Spring Day1 an', () => {
    rawSave(8, {
      plants: [],
      pokedex: { discovered: [], captured: [] },
      inventory: {},
      quests: {}
    });
    const state = loadGame();
    const time = (state as unknown as { time?: { minute: number; day: number; season: number; year: number } }).time;
    expect(time).toBeDefined();
    expect(time!.minute).toBe(360);
    expect(time!.day).toBe(1);
    expect(time!.season).toBe(0);
    expect(time!.year).toBe(1);
  });
});

describe('Save-Migration v9 -> aktuelle Version', () => {
  it('migriert v9 vollstaendig zum aktuellen Schema', () => {
    rawSave(9, {
      plants: [],
      pokedex: { discovered: [], captured: [] },
      inventory: {},
      quests: {}
    });
    const state = loadGame();
    expect(state).not.toBeNull();
    expect(state!.version).toBe(SAVE_SCHEMA_VERSION);
  });

  it('backfillt genome bei jeder Pflanze', () => {
    rawSave(9, {
      plants: [plantV1('p1')],
      pokedex: { discovered: [], captured: [] },
      inventory: {},
      quests: {}
    });
    const state = loadGame();
    const plant = state!.plants[0];
    expect(plant.genome).toBeDefined();
    expect(plant.genome!.alleleHp).toHaveLength(2);
    expect(plant.genome!.alleleAtk).toHaveLength(2);
    expect(plant.genome!.evHp).toBe(0);
    expect(plant.genome!.eggMoves).toEqual([]);
    expect(plant.genome!.traits).toEqual([]);
  });

  it('alleleHp Werte sind im Bereich 0-31', () => {
    rawSave(9, {
      plants: [plantV1('p1')],
      pokedex: { discovered: [], captured: [] },
      inventory: {},
      quests: {}
    });
    const state = loadGame();
    const plant = state!.plants[0];
    for (const a of plant.genome!.alleleHp) {
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThanOrEqual(31);
    }
  });

  it('vorhandenes genome wird nicht ueberschrieben', () => {
    const fixedGenome = {
      alleleHp: [5, 10] as [number, number],
      alleleAtk: [3, 7] as [number, number],
      alleleDef: [1, 2] as [number, number],
      alleleSpd: [4, 8] as [number, number],
      alleleVit: [9, 11] as [number, number],
      alleleRoot: [12, 15] as [number, number],
      evHp: 100, evAtk: 50, evDef: 0, evSpd: 25, evVit: 0, evRoot: 0,
      eggMoves: ['photon-bloom'],
      traits: ['glowing']
    };
    rawSave(9, {
      plants: [{ ...plantV1('p1'), genome: fixedGenome }],
      pokedex: { discovered: [], captured: [] },
      inventory: {},
      quests: {}
    });
    const state = loadGame();
    const plant = state!.plants[0];
    expect(plant.genome!.alleleHp).toEqual([5, 10]);
    expect(plant.genome!.evHp).toBe(100);
    expect(plant.genome!.eggMoves).toEqual(['photon-bloom']);
  });
});

describe('Save schon auf SAVE_SCHEMA_VERSION', () => {
  it('aktuelle Version laedt direkt zurueck', () => {
    rawSave(SAVE_SCHEMA_VERSION, {
      plants: [],
      pokedex: { discovered: ['sunflower'], captured: [] },
      inventory: { coin: 5 },
      quests: {}
    });
    const state = loadGame();
    expect(state!.version).toBe(SAVE_SCHEMA_VERSION);
    expect(state!.pokedex!.discovered).toContain('sunflower');
  });

  it('legt fehlende Defaults nach (gardenSlots, achievements, etc.)', () => {
    rawSave(SAVE_SCHEMA_VERSION, { plants: [] });
    const state = loadGame();
    expect(state!.gardenSlots!.length).toBeGreaterThan(0);
    expect(state!.achievements).toEqual([]);
    expect(state!.achievementCounters).toBeDefined();
    expect(state!.lastDailyLoginAt).toBe(0);
    expect(state!.forageTilesCooldown).toEqual({});
  });

  it('mappt veraltete GreenhouseScene auf GardenScene', () => {
    rawSave(SAVE_SCHEMA_VERSION, {
      plants: [],
      overworld: { tileX: 1, tileY: 2, facing: 'up', zone: 'wurzelheim', lastSceneVisited: 'GreenhouseScene' }
    });
    const state = loadGame();
    expect(state!.overworld!.lastSceneVisited).toBe('GardenScene');
  });
});

describe('saveGame', () => {
  it('persistiert state in localStorage und stempelt Version', () => {
    const state: GameState = {
      version: 0,
      playerId: 'p',
      plants: [],
      coins: 0,
      gems: 0,
      createdAt: 1_700_000_000_000
    };
    saveGame(state);
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.version).toBe(SAVE_SCHEMA_VERSION);
    expect(parsed.playerId).toBe('p');
  });

  it('legt Defaults fuer fehlende Felder an', () => {
    const state: GameState = {
      version: SAVE_SCHEMA_VERSION,
      playerId: 'p',
      plants: [],
      coins: 0,
      gems: 0,
      createdAt: 1_700_000_000_000
    };
    saveGame(state);
    expect(state.gardenSlots).toBeDefined();
    expect(state.pokedex).toBeDefined();
    expect(state.inventory).toBeDefined();
    expect(state.quests).toBeDefined();
    expect(state.forageTilesCooldown).toEqual({});
    expect(state.collectedHiddenSpots).toEqual([]);
    expect(state.lastBerryMasterAt).toBe(0);
  });

  it('Round-Trip: saveGame dann loadGame liefert aequivalenten State', () => {
    const state: GameState = {
      version: SAVE_SCHEMA_VERSION,
      playerId: 'rt-test',
      plants: [],
      coins: 42,
      gems: 7,
      createdAt: 1_700_000_000_000,
      pokedex: { discovered: ['sunflower'], captured: ['sunflower'] }
    };
    saveGame(state);
    const loaded = loadGame();
    expect(loaded!.playerId).toBe('rt-test');
    expect(loaded!.coins).toBe(42);
    expect(loaded!.gems).toBe(7);
    expect(loaded!.pokedex!.discovered).toContain('sunflower');
  });
});

describe('resetGame', () => {
  it('entfernt Save aus localStorage', () => {
    rawSave(SAVE_SCHEMA_VERSION, { plants: [] });
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    resetGame();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('reset auf leerem Storage ist no-op', () => {
    expect(() => resetGame()).not.toThrow();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe('V11 Locale-Persistenz', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('migriert v10 zu v11 mit Default-Locale de', () => {
    rawSave(10, { plants: [] });
    const state = loadGame();
    expect(state).not.toBeNull();
    expect(state!.version).toBe(SAVE_SCHEMA_VERSION);
    expect(state!.locale).toBe('de');
  });

  it('migriert v10 zu v11 und liest locale aus localStorage', () => {
    localStorage.setItem('plantinvasion_locale', 'en');
    rawSave(10, { plants: [] });
    const state = loadGame();
    expect(state!.locale).toBe('en');
  });

  it('neuer Save hat locale-Feld', () => {
    rawSave(SAVE_SCHEMA_VERSION, { plants: [] });
    const state = loadGame();
    expect(state).not.toBeNull();
    expect(['de', 'en']).toContain(state!.locale);
  });

  it('saveGame persistiert locale-Feld', () => {
    const st: GameState = {
      version: SAVE_SCHEMA_VERSION,
      playerId: 'locale-test',
      plants: [],
      coins: 0,
      gems: 0,
      createdAt: 0,
      locale: 'en',
    };
    saveGame(st);
    const loaded = loadGame();
    expect(loaded!.locale).toBe('en');
  });
});

describe('S-POLISH Run10: loadGame corrupt-detection + size-warning', () => {
  it('liefert null bei corruptem JSON (kein Crash)', () => {
    localStorage.setItem('plantinvasion_save_v1', 'KEIN_VALID_JSON!!!');
    expect(loadGame()).toBeNull();
  });

  it('gibt console.error aus bei corrupt JSON', () => {
    localStorage.setItem('plantinvasion_save_v1', '{broken json');
    loadGame();
    expect(console.error).toHaveBeenCalled();
  });

  it('migriert v11 korrekt auf SAVE_SCHEMA_VERSION', () => {
    rawSave(11, { locale: 'de', soilTiers: {}, diaryEntries: [], storyFlags: {}, achievements: [] });
    const state = loadGame();
    expect(state).not.toBeNull();
    expect(state?.version).toBe(SAVE_SCHEMA_VERSION);
  });
});

describe('Save-Migration v10 -> v11: energy + loginStreak + marketBoughtToday Defaults', () => {
  it('setzt energy auf 100 bei v10-Save ohne energy-Feld', () => {
    rawSave(10, { plants: [] });
    const state = loadGame();
    expect(state).not.toBeNull();
    expect(state!.version).toBe(SAVE_SCHEMA_VERSION);
    expect(state!.energy).toBe(100);
    expect(state!.loginStreak).toBe(0);
    expect(state!.loginDaysTotal).toBe(0);
    expect(state!.marketBoughtToday).toEqual({});
    expect(state!.marketBoughtTodayDay).toBe(-1);
  });

  it('setzt energy auf 100 bei aktuellem Save ohne energy-Feld', () => {
    rawSave(SAVE_SCHEMA_VERSION, { plants: [] });
    const state = loadGame();
    expect(state).not.toBeNull();
    expect(state!.energy).toBe(100);
  });

  it('behaelt vorhandenes energy-Feld beim Laden', () => {
    rawSave(SAVE_SCHEMA_VERSION, { plants: [], energy: 42 });
    const state = loadGame();
    expect(state!.energy).toBe(42);
  });

  it('loginStreak wird nicht ueberschrieben wenn vorhanden', () => {
    rawSave(SAVE_SCHEMA_VERSION, { plants: [], loginStreak: 7, loginDaysTotal: 14 });
    const state = loadGame();
    expect(state!.loginStreak).toBe(7);
    expect(state!.loginDaysTotal).toBe(14);
  });
});
