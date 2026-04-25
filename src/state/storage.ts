import type { Plant } from '../types/plant';
import { defaultGrowthFields } from '../data/leveling';

export interface OverworldState {
  tileX: number;
  tileY: number;
  facing: 'up' | 'down' | 'left' | 'right';
  zone: string;             // z.B. 'wurzelheim'
  lastSceneVisited: 'OverworldScene' | 'GardenScene';
}

export interface PokedexState {
  discovered: string[];     // species-slugs gesehen
  captured: string[];       // species-slugs in Garden
}

export type InventoryState = Record<string, number>;

export type QuestState = Record<string, 'pending' | 'active' | 'completed'>;

export interface TutorialState {
  step: number;       // 0=welcome, 1=move, 2=talk, 3=garden, 4=market, 5=done
  done: boolean;
}

export interface GameState {
  version: number;
  playerId: string;
  plants: Plant[];
  coins: number;
  gems: number;
  createdAt: number;
  overworld?: OverworldState;     // V2
  pokedex?: PokedexState;          // V3
  inventory?: InventoryState;       // V4
  quests?: QuestState;               // V5
  tutorial?: TutorialState;          // V6
}

const STORAGE_KEY = 'plantinvasion_save_v1';   // Bewusst v1 als Datei-Name beibehalten, internal version-Field steuert
export const SAVE_SCHEMA_VERSION = 6;          // V6 = Growth-System V0.2 + Tutorial-State

const DEFAULT_OVERWORLD: OverworldState = {
  tileX: 14,
  tileY: 17,
  facing: 'up',
  zone: 'wurzelheim',
  lastSceneVisited: 'OverworldScene'
};

/**
 * Backfill der V0.2 Growth-Felder fuer alle Pflanzen.
 * Hydration startet bei 100 (frische Frische), careScore bei 0.
 * Generation wird aus parentIds und isMutation abgeleitet.
 */
function ensurePlantGrowthFields(plant: any): Plant {
  const defaults = defaultGrowthFields();
  const generation =
    typeof plant.generation === 'number'
      ? plant.generation
      : plant.parentAId
        ? (plant.isMutation ? 1 : 1)
        : 0;
  return {
    ...defaults,
    generation,
    ...plant,
    // Defaults nur als Fallback ueberschreibt
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
        : defaults.highestStageReached
  } as Plant;
}

function migrate(parsed: any): GameState | null {
  if (!parsed || typeof parsed !== 'object') return null;
  if (parsed.version === 5) {
    parsed.version = 6;
    if (Array.isArray(parsed.plants)) {
      parsed.plants = parsed.plants.map(ensurePlantGrowthFields);
    }
    parsed.tutorial = parsed.tutorial ?? { step: 5, done: true };  // bestehende Saves: Tutorial done
    console.log('[storage] migrated save v5 -> v6 (growth-system V0.2 + tutorial)');
  }
  if (parsed.version === 4) {
    parsed.version = 5;
    parsed.quests = parsed.quests ?? {};
    console.log('[storage] migrated save v4 -> v5');
  }
  if (parsed.version === 3) {
    parsed.version = 4;
    parsed.inventory = parsed.inventory ?? { 'basic-lure': 3, 'heal-tonic': 2 };
    console.log('[storage] migrated save v3 -> v4');
  }
  if (parsed.version === SAVE_SCHEMA_VERSION) {
    if (!parsed.pokedex) parsed.pokedex = { discovered: [], captured: [] };
    if (!parsed.inventory) parsed.inventory = { 'basic-lure': 3, 'heal-tonic': 2 };
    if (!parsed.quests) parsed.quests = {};
    if (Array.isArray(parsed.plants)) {
      parsed.plants = parsed.plants.map(ensurePlantGrowthFields);
    }
    if (!parsed.tutorial) parsed.tutorial = { step: 5, done: true };
    // Backwards-compat: alte GreenhouseScene-Strings zu GardenScene migrieren
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
    // Recurse durch die hoeheren Migrations
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
    if (!state.tutorial) state.tutorial = { step: 0, done: false };
    state.version = SAVE_SCHEMA_VERSION;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save game state', e);
  }
}

export function resetGame(): void {
  localStorage.removeItem(STORAGE_KEY);
}
