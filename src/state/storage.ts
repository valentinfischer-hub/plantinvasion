import type { GardenSlotMeta, Plant } from '../types/plant';
import { defaultGrowthFields } from '../data/leveling';
import { debugLog } from '../utils/debugLog';

export interface OverworldState {
  tileX: number;
  tileY: number;
  facing: 'up' | 'down' | 'left' | 'right';
  zone: string;
  lastSceneVisited: 'OverworldScene' | 'GardenScene';
}

export interface PokedexState {
  discovered: string[];
  captured: string[];
}

export type InventoryState = Record<string, number>;
export type QuestState = Record<string, 'pending' | 'active' | 'completed'>;

export interface TimeState {
  minute: number;       // 0-1439 (24h x 60min)
  day: number;          // 1+
  season: 0 | 1 | 2 | 3;  // Spring/Summer/Autumn/Winter
  year: number;
}

export interface TutorialState {
  step: number;       // 0=welcome, 1=move, 2=talk, 3=garden, 4=market, 5=done
  done: boolean;
}

export interface MarketShopRoster {
  seedSlugs: string[];
  boosterSlugs: string[];
}

export interface GameState {
  version: number;
  playerId: string;
  plants: Plant[];
  coins: number;
  gems: number;
  createdAt: number;
  overworld?: OverworldState;
  pokedex?: PokedexState;
  inventory?: InventoryState;
  quests?: QuestState;
  tutorial?: TutorialState;          // V6
  // V7: Booster + Soil + Daily-Login
  gardenSlots?: GardenSlotMeta[];
  lastDailyLoginAt?: number;
  marketShopRosterDay?: number;
  marketShopRoster?: MarketShopRoster;
  // V8: Foraging V0.2
  forageTilesCooldown?: Record<string, number>;     // "zone:x:y" -> ms
  collectedHiddenSpots?: string[];                  // "zone:x:y"
  lastBerryMasterAt?: number;                       // ms
  // V8: Achievements V0.1
  achievements?: string[];                          // unlocked-Slugs
  achievementCounters?: {
    crossings: number;
    mutations: number;
    visitedZones: string[];
  };
  // V9: Time-System (gameTime-Provider)
  time?: {
    minute: number;
    day: number;
    season: 0 | 1 | 2 | 3;
    year: number;
  };
  // S-09: Story-Akt-Tracking
  story?: {
    flags: Record<string, boolean>;
    currentAct: number;
    metNpcs: string[];
    diaryEntries: number[];
  };
  // V11: i18n Locale-Persistenz
  locale?: 'de' | 'en';
  // S-POLISH-17: Charakter-Profil (Name + Avatar-ID)
  playerName?: string;
  avatarId?: number;
}

const STORAGE_KEY = 'plantinvasion_save_v1';
export const SAVE_SCHEMA_VERSION = 11;

const DEFAULT_OVERWORLD: OverworldState = {
  tileX: 14,
  tileY: 17,
  facing: 'up',
  zone: 'wurzelheim',
  lastSceneVisited: 'GardenScene'
};

const GRID_COLS = 4;
const GRID_ROWS = 3;

function defaultGardenSlots(): GardenSlotMeta[] {
  const slots: GardenSlotMeta[] = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      slots.push({ x, y, soilTier: 'normal' });
    }
  }
  return slots;
}

/** B-013: Hilfstyp fuer legacy-Save-Strukturen aus alten Versionen. Vermeidet `any` an isolierten Stellen. */
type RawRecord = Record<string, unknown>;

function asRecord(v: unknown): RawRecord {
  return (v !== null && typeof v === 'object' ? v : {}) as RawRecord;
}

/**
 * B-013: Loose Schema fuer Migration-Inputs. Alle GameState-Felder sind optional damit
 * parsed-Objekte aus alten Schema-Versionen nicht TS-Errors werfen. version ist required
 * weil sie der erste Branching-Key ist. Index-Signature erlaubt Pre-V10-Felder die nicht
 * mehr in GameState existieren (z.B. legacy `time`-Feld).
 */
type LegacySave = {
  version: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

/**
 * Backfill der V0.2 Growth-Felder fuer alle Pflanzen.
 */
function ensurePlantGrowthFields(plant: unknown): Plant {
  const p = asRecord(plant);
  const defaults = defaultGrowthFields();
  const generation =
    typeof p.generation === 'number'
      ? p.generation
      : p.parentAId
        ? 1
        : 0;
  return {
    ...defaults,
    generation,
    ...p,
    hydration: typeof p.hydration === 'number' ? p.hydration : defaults.hydration,
    careScore: typeof p.careScore === 'number' ? p.careScore : defaults.careScore,
    pendingHarvest: typeof p.pendingHarvest === 'boolean' ? p.pendingHarvest : defaults.pendingHarvest,
    consecutiveDryHours:
      typeof p.consecutiveDryHours === 'number'
        ? p.consecutiveDryHours
        : defaults.consecutiveDryHours,
    highestStageReached:
      typeof p.highestStageReached === 'number'
        ? p.highestStageReached
        : defaults.highestStageReached,
    activeBoosters: Array.isArray(p.activeBoosters) ? p.activeBoosters : []
  } as Plant;
}

function migrate(parsedRaw: unknown): GameState | null {
  if (!parsedRaw || typeof parsedRaw !== 'object') return null;
  const parsed = parsedRaw as LegacySave;
  // Migrations-Kette ist ASCENDING geordnet, damit sequentielle if-Statements
  // jeweils die soeben gebumpte Version aufgreifen koennen. Reihenfolge ist
  // load-bearing: bei Reorder bricht die Kette fuer Saves von v6 oder aelter.
  if (parsed.version === 6) {
    parsed.version = 7;
    if (Array.isArray(parsed.plants)) {
      parsed.plants = parsed.plants.map((p: unknown) => {
        const pr = asRecord(p);
        return {
          ...ensurePlantGrowthFields(p),
          activeBoosters: Array.isArray(pr.activeBoosters) ? pr.activeBoosters : []
        };
      });
    }
    if (!parsed.gardenSlots) parsed.gardenSlots = defaultGardenSlots();
    if (typeof parsed.lastDailyLoginAt !== 'number') parsed.lastDailyLoginAt = 0;
    if (typeof parsed.marketShopRosterDay !== 'number') parsed.marketShopRosterDay = -1;
    if (!parsed.marketShopRoster) parsed.marketShopRoster = { seedSlugs: [], boosterSlugs: [] };
    debugLog('[storage] migrated save v6 -> v7 (booster-system V0.1)');
  }
  if (parsed.version === 7) {
    parsed.version = 8;
    if (!parsed.forageTilesCooldown) parsed.forageTilesCooldown = {};
    if (!Array.isArray(parsed.collectedHiddenSpots)) parsed.collectedHiddenSpots = [];
    if (typeof parsed.lastBerryMasterAt !== 'number') parsed.lastBerryMasterAt = 0;
    if (!Array.isArray(parsed.achievements)) parsed.achievements = [];
    if (!parsed.achievementCounters) parsed.achievementCounters = { crossings: 0, mutations: 0, visitedZones: [] };
    debugLog('[storage] migrated save v7 -> v8 (foraging V0.2)');
  }
  if (parsed.version === 8) {
    parsed.version = 9;
    parsed.time = parsed.time ?? { minute: 360, day: 1, season: 0, year: 1 };  // start at 06:00 spring day1
    debugLog('[storage] migrated save v8 -> v9 (time-system)');
  }
  if (parsed.version === 9) {
    parsed.version = 10;
    if (Array.isArray(parsed.plants)) {
      for (const pl of parsed.plants) {
        if (!pl.genome) {
          pl.genome = {
            alleleHp: [Math.floor(Math.random()*32), Math.floor(Math.random()*32)],
            alleleAtk: [Math.floor(Math.random()*32), Math.floor(Math.random()*32)],
            alleleDef: [Math.floor(Math.random()*32), Math.floor(Math.random()*32)],
            alleleSpd: [Math.floor(Math.random()*32), Math.floor(Math.random()*32)],
            alleleVit: [Math.floor(Math.random()*32), Math.floor(Math.random()*32)],
            alleleRoot: [Math.floor(Math.random()*32), Math.floor(Math.random()*32)],
            evHp: 0, evAtk: 0, evDef: 0, evSpd: 0, evVit: 0, evRoot: 0,
            eggMoves: [],
            traits: []
          };
        }
      }
    }
    debugLog('[storage] migrated save v9 -> v10 (breeding-v2 genome backfill)');
  }
  if (parsed.version === 10) {
    parsed.version = 11;
    // V11: Locale-Feld initialisieren (aus localStorage falls vorhanden, sonst 'de')
    if (!parsed.locale) {
      const storedLocale = typeof localStorage !== 'undefined'
        ? localStorage.getItem('plantinvasion_locale')
        : null;
      parsed.locale = (storedLocale === 'en') ? 'en' : 'de';
    }
    debugLog('[storage] migrated save v10 -> v11 (i18n locale field)');
  }
  if (parsed.version === 5) {
    parsed.version = 6;
    if (Array.isArray(parsed.plants)) {
      parsed.plants = parsed.plants.map(ensurePlantGrowthFields);
    }
    debugLog('[storage] migrated save v5 -> v6 (growth-system V0.2)');
    return migrate(parsed);
  }
  if (parsed.version === 4) {
    parsed.version = 5;
    parsed.quests = parsed.quests ?? {};
    debugLog('[storage] migrated save v4 -> v5');
    return migrate(parsed);
  }
  if (parsed.version === 3) {
    parsed.version = 4;
    parsed.inventory = parsed.inventory ?? { 'basic-lure': 3, 'heal-tonic': 2 };
    debugLog('[storage] migrated save v3 -> v4');
    return migrate(parsed);
  }
  if (parsed.version === SAVE_SCHEMA_VERSION) {
    if (!parsed.pokedex) parsed.pokedex = { discovered: [], captured: [] };
    if (!parsed.inventory) parsed.inventory = { 'basic-lure': 3, 'heal-tonic': 2 };
    if (!parsed.quests) parsed.quests = {};
    if (Array.isArray(parsed.plants)) {
      parsed.plants = parsed.plants.map(ensurePlantGrowthFields);
    }
    if (!parsed.gardenSlots) parsed.gardenSlots = defaultGardenSlots();
    if (typeof parsed.lastDailyLoginAt !== 'number') parsed.lastDailyLoginAt = 0;
    if (typeof parsed.marketShopRosterDay !== 'number') parsed.marketShopRosterDay = -1;
    if (!parsed.marketShopRoster) parsed.marketShopRoster = { seedSlugs: [], boosterSlugs: [] };
    if (!parsed.forageTilesCooldown) parsed.forageTilesCooldown = {};
    if (!Array.isArray(parsed.collectedHiddenSpots)) parsed.collectedHiddenSpots = [];
    if (typeof parsed.lastBerryMasterAt !== 'number') parsed.lastBerryMasterAt = 0;
    if (!Array.isArray(parsed.achievements)) parsed.achievements = [];
    if (!parsed.achievementCounters) parsed.achievementCounters = { crossings: 0, mutations: 0, visitedZones: [] };
    {
      const ow = asRecord(parsed.overworld);
      if (ow.lastSceneVisited === 'GreenhouseScene') {
        ow.lastSceneVisited = 'GardenScene';
        parsed.overworld = ow;
      }
    }
    if (!parsed.overworld) parsed.overworld = { ...DEFAULT_OVERWORLD };
    if (!parsed.locale) {
      const storedLocale = typeof localStorage !== 'undefined'
        ? localStorage.getItem('plantinvasion_locale')
        : null;
      parsed.locale = (storedLocale === 'en') ? 'en' : 'de';
    }
    return parsed as GameState;
  }
  if (parsed.version === 2) {
    parsed.version = 3;
    parsed.pokedex = parsed.pokedex ?? { discovered: [], captured: [] };
    if (parsed.plants) {
      const ownedSpecies = new Set<string>(parsed.plants.map((p: unknown) => asRecord(p).speciesSlug as string));
      parsed.pokedex.captured = Array.from(new Set([...(parsed.pokedex.captured ?? []), ...ownedSpecies]));
      parsed.pokedex.discovered = Array.from(new Set([...(parsed.pokedex.discovered ?? []), ...ownedSpecies]));
    }
    debugLog('[storage] migrated save v2 -> v3');
    return migrate(parsed);
  }
  if (parsed.version === 1) {
    const v3: GameState = {
      version: 3,
      playerId: parsed.playerId,
      plants: (parsed.plants ?? []).map(ensurePlantGrowthFields),
      coins: parsed.coins ?? 0,
      gems: parsed.gems ?? 0,
      createdAt: parsed.createdAt ?? Date.now(),
      overworld: { ...DEFAULT_OVERWORLD },
      pokedex: { discovered: [], captured: [] }
    };
    debugLog('[storage] migrated save v1 -> v3');
    return migrate(v3);
  }
  console.warn('[storage] unknown save-version, discarding', parsed.version);
  return null;
}

export function loadGame(): GameState | null {
  // S-POLISH Run10: corrupt-save detection + size-warning
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
  } catch (e) {
    console.error('[storage] localStorage.getItem failed', e);
    return null;
  }
  // Größen-Warnung (kein Crash)
  if (raw.length > 1_000_000) {
    console.warn('[storage] Save-Datei > 1MB (' + Math.round(raw.length / 1024) + 'KB) - Performance-Impact moeglich');
  }
  try {
    const parsed = JSON.parse(raw);
    return migrate(parsed);
  } catch (e) {
    console.error('[storage] corrupt save detected, discarding (JSON.parse failed)', e);
    return null;
  }
}

export function saveGame(state: GameState): void {
  // S-POLISH Run14: Sentry-Context bei save-Fehlern
  try {
    if (!state.overworld) state.overworld = { ...DEFAULT_OVERWORLD };
    if (!state.pokedex) state.pokedex = { discovered: [], captured: [] };
    if (!state.inventory) state.inventory = { 'basic-lure': 3, 'heal-tonic': 2 };
    if (!state.quests) state.quests = {};
    if (!state.gardenSlots) state.gardenSlots = defaultGardenSlots();
    if (typeof state.lastDailyLoginAt !== 'number') state.lastDailyLoginAt = 0;
    if (typeof state.marketShopRosterDay !== 'number') state.marketShopRosterDay = -1;
    if (!state.marketShopRoster) state.marketShopRoster = { seedSlugs: [], boosterSlugs: [] };
    if (!state.forageTilesCooldown) state.forageTilesCooldown = {};
    if (!Array.isArray(state.collectedHiddenSpots)) state.collectedHiddenSpots = [];
    if (typeof state.lastBerryMasterAt !== 'number') state.lastBerryMasterAt = 0;
    state.version = SAVE_SCHEMA_VERSION;
    const json = JSON.stringify(state);
    // S-POLISH Run10: Größen-Warnung
    if (json.length > 1_000_000) {
      console.warn('[storage] Save > 1MB (' + Math.round(json.length / 1024) + 'KB) - consider pruning');
    }
    localStorage.setItem(STORAGE_KEY, json);
  } catch (e) {
    console.error('[storage] saveGame failed', e);
    // S-POLISH Run14: Sentry-Context + User-Feedback hint
    try {
      const S = window.__sentry;
      if (S?.captureException) {
        S.captureException(e, { contexts: { save: { playerId: state.playerId, plantCount: state.plants?.length } } });
      }
    } catch { /* noop */ }
    console.warn('[storage] ui: errors.saveFailed');
  }
}

export function resetGame(): void {
  localStorage.removeItem(STORAGE_KEY);
}
