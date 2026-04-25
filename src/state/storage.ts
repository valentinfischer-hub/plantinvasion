import type { Plant } from '../types/plant';

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
}

const STORAGE_KEY = 'plantinvasion_save_v1';   // Bewusst v1 als Datei-Name beibehalten, internal version-Field steuert
export const SAVE_SCHEMA_VERSION = 4;

const DEFAULT_OVERWORLD: OverworldState = {
  tileX: 14,
  tileY: 17,
  facing: 'up',
  zone: 'wurzelheim',
  lastSceneVisited: 'OverworldScene'
};

function migrate(parsed: any): GameState | null {
  if (!parsed || typeof parsed !== 'object') return null;
  if (parsed.version === 3) {
    parsed.version = 4;
    parsed.inventory = parsed.inventory ?? { 'basic-lure': 3, 'heal-tonic': 2 };
    console.log('[storage] migrated save v3 -> v4');
  }
  if (parsed.version === SAVE_SCHEMA_VERSION) {
    if (!parsed.pokedex) parsed.pokedex = { discovered: [], captured: [] };
    if (!parsed.inventory) parsed.inventory = { 'basic-lure': 3, 'heal-tonic': 2 };
    // Backwards-compat: alte GreenhouseScene-Strings zu GardenScene migrieren
    if (parsed.overworld && (parsed.overworld as any).lastSceneVisited === 'GreenhouseScene') {
      (parsed.overworld as any).lastSceneVisited = 'GardenScene';
    }
    // Falls overworld fehlt, default setzen
    if (!parsed.overworld) parsed.overworld = { ...DEFAULT_OVERWORLD };
    return parsed as GameState;
  }
  if (parsed.version === 2) {
    // V2 -> V3: pokedex hinzufuegen
    parsed.version = 3;
    parsed.pokedex = parsed.pokedex ?? { discovered: [], captured: [] };
    if (parsed.plants) {
      const ownedSpecies = new Set<string>(parsed.plants.map((p: any) => p.speciesSlug));
      parsed.pokedex.captured = Array.from(new Set([...(parsed.pokedex.captured ?? []), ...ownedSpecies]));
      parsed.pokedex.discovered = Array.from(new Set([...(parsed.pokedex.discovered ?? []), ...ownedSpecies]));
    }
    console.log('[storage] migrated save v2 -> v3');
    return parsed as GameState;
  }
  if (parsed.version === 1) {
    // V1 -> V3: overworld-Default + pokedex
    const v3: GameState = {
      version: SAVE_SCHEMA_VERSION,
      playerId: parsed.playerId,
      plants: parsed.plants ?? [],
      coins: parsed.coins ?? 0,
      gems: parsed.gems ?? 0,
      createdAt: parsed.createdAt ?? Date.now(),
      overworld: { ...DEFAULT_OVERWORLD },
      pokedex: { discovered: [], captured: [] }
    };
    console.log('[storage] migrated save v1 -> v3');
    return v3;
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
    state.version = SAVE_SCHEMA_VERSION;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save game state', e);
  }
}

export function resetGame(): void {
  localStorage.removeItem(STORAGE_KEY);
}
