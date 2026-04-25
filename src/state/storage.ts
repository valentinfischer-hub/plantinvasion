import type { GardenSlotMeta, Plant } from '../types/plant';
import { defaultGrowthFields } from '../data/leveling';

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

export interface StoryState {
  flags: Record<string, boolean>;
  currentAct: number;             // 0-7 (0 = pre-game, 1-7 = active acts)
  metNpcs: string[];              // npc-ids met
  diaryEntries: number[];         // collected diary-page IDs
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
  // V8: Story-State
  story?: StoryState;
}

const STORAGE_KEY = 'plantinvasion_save_v1';
export const SAVE_SCHEMA_VERSION = 8;

const DEFAULT_OVERWORLD: OverworldState = {
  tileX: 14,
  tileY: 17,
  facing: 'up',
  zone: 'wurzelheim',
  lastSceneVisited: 'OverworldScene'
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

/**
 * Backfill der V0.2 Growth-Felder fuer alle Pflanzen.
 */
function ensurePlantGrowthFields(plant: any): Plant {
  const defaults = defaultGrowthFields();
  const generation =
    typeof plant.generation === 'number'
      ? plant.generation
      : plant.parentAId
        ? 1
        : 0;
  return {
    ...defaults,
    generation,
    ...plant,
    hydration: typeof plant.hydration === 'number' ? plant.hydration : defaults.hydration,
    careScore: typeof plant.careScore === 'number' ? plant.careScore : defaults.careScore,
    pendingHarvest: typeof plant.pendingHarvest === 'boolean' ? plant.pendingHarvest : defaults.pendingHarvest,
    consecutiveDryHours:
      typeof plant.consecutiveDryHours === 'number'
        ? plant.consecutiveDryHours
        : defaults.consecutiveDryHours,
    highestStageReached:
      typeof plant.highestStageReached === 'number'
        ? plant.highestStageReached
        : defaults.highestStageReached,
    activeBoosters: Array.isArray(plant.activeBoosters) ? plant.activeBoosters : []
  } as Plant;
}

function migrate(parsed: any): GameState | null {
  if (!parsed || typeof parsed !== 'object') return null;
  if (parsed.version === 7) {
    parsed.version = 8;
    parsed.story = parsed.story ?? { flags: {}, currentAct: 0, metNpcs: [], diaryEntries: [] };
    console.log('[storage] migrated save v7 -> v8 (storyline)');
  }
  if (parsed.version === 6) {
    parsed.version = 7;
    if (Array.isArray(parsed.plants)) {
      parsed.plants = parsed.plants.map((p: any) => ({
        ...ensurePlantGrowthFields(p),
        activeBoosters: Array.isArray(p.activeBoosters) ? p.activeBoosters : []
      }));
    }
    if (!parsed.gardenSlots) parsed.gardenSlots = defaultGardenSlots();
    if (typeof parsed.lastDailyLoginAt !== 'number') parsed.lastDailyLoginAt = 0;
    if (typeof parsed.marketShopRosterDay !== 'number') parsed.marketShopRosterDay = -1;
    if (!parsed.marketShopRoster) parsed.marketShopRoster = { seedSlugs: [], boosterSlugs: [] };
    console.log('[storage] migrated save v6 -> v7 (booster-system V0.1)');
  }
  if (parsed.version === 5) {
    parsed.version = 6;
    if (Array.isArray(parsed.plants)) {
      parsed.plants = parsed.plants.map(ensurePlantGrowthFields);
    }
    console.log('[storage] migrated save v5 -> v6 (growth-system V0.2)');
    return migrate(parsed);
  }
  if (parsed.version === 4) {
    parsed.version = 5;
    parsed.quests = parsed.quests ?? {};
    console.log('[storage] migrated save v4 -> v5');
    return migrate(parsed);
  }
  if (parsed.version === 3) {
    parsed.version = 4;
    parsed.inventory = parsed.inventory ?? { 'basic-lure': 3, 'heal-tonic': 2 };
    console.log('[storage] migrated save v3 -> v4');
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
    if (parsed.overworld && (parsed.overworld as any).lastSceneVisited === 'GreenhouseScene') {
      (parsed.overworld as any).lastSceneVisited = 'GardenScene';
    }
    if (!parsed.overworld) parsed.overworld = { ...DEFAULT_OVERWORLD };
    return parsed as GameState;
  }
  if (parsed.version === 2) {
    parsed.version = 3;
    parsed.pokedex = parsed.pokedex ?? { discovered: [], captured: [] };
    if (parsed.plants) {
      const ownedSpecies = new Set<string>(parsed.plants.map((p: any) => p.speciesSlug));
      parsed.pokedex.captured = Array.from(new Set([...(parsed.pokedex.captured ?? []), ...ownedSpecies]));
      parsed.pokedex.discovered = Array.from(new Set([...(parsed.pokedex.discovered ?? []), ...ownedSpecies]));
    }
    console.log('[storage] migrated save v2 -> v3');
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
    console.log('[storage] migrated save v1 -> v3');
    return migrate(v3);
  }
  console.warn('[storage] unknown save-version, discarding', parsed.version);
  return null;
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return migrate(parsed);
  } catch (e) {
    console.error('Failed to load game state', e);
    return null;
  }
}

export function saveGame(state: GameState): void {
  try {
    if (!state.overworld) state.overworld = { ...DEFAULT_OVERWORLD };
    if (!state.pokedex) state.pokedex = { discovered: [], captured: [] };
    if (!state.inventory) state.inventory = { 'basic-lure': 3, 'heal-tonic': 2 };
    if (!state.quests) state.quests = {};
    if (!state.gardenSlots) state.gardenSlots = defaultGardenSlots();
    if (typeof state.lastDailyLoginAt !== 'number') state.lastDailyLoginAt = 0;
    if (typeof state.marketShopRosterDay !== 'number') state.marketShopRosterDay = -1;
    if (!state.marketShopRoster) state.marketShopRoster = { seedSlugs: [], boosterSlugs: [] };
    state.version = SAVE_SCHEMA_VERSION;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save game state', e);
  }
}

export function resetGame(): void {
  localStorage.removeItem(STORAGE_KEY);
}
