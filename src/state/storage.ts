import type { Plant } from '../types/plant';

export interface OverworldState {
  tileX: number;
  tileY: number;
  facing: 'up' | 'down' | 'left' | 'right';
  zone: string;             // z.B. 'wurzelheim'
  lastSceneVisited: 'OverworldScene' | 'GardenScene';
}

export interface GameState {
  version: number;
  playerId: string;
  plants: Plant[];
  coins: number;
  gems: number;
  createdAt: number;
  overworld?: OverworldState;     // V2 ergaenzt, optional fuer Backwards-Compat
}

const STORAGE_KEY = 'plantinvasion_save_v1';   // Bewusst v1 als Datei-Name beibehalten, internal version-Field steuert
export const SAVE_SCHEMA_VERSION = 2;

const DEFAULT_OVERWORLD: OverworldState = {
  tileX: 14,
  tileY: 17,
  facing: 'up',
  zone: 'wurzelheim',
  lastSceneVisited: 'OverworldScene'
};

function migrate(parsed: any): GameState | null {
  if (!parsed || typeof parsed !== 'object') return null;
  if (parsed.version === SAVE_SCHEMA_VERSION) {
    // Backwards-compat: alte GreenhouseScene-Strings zu GardenScene migrieren
    if (parsed.overworld && (parsed.overworld as any).lastSceneVisited === 'GreenhouseScene') {
      (parsed.overworld as any).lastSceneVisited = 'GardenScene';
    }
    // Falls overworld fehlt, default setzen
    if (!parsed.overworld) parsed.overworld = { ...DEFAULT_OVERWORLD };
    return parsed as GameState;
  }
  if (parsed.version === 1) {
    // V1 -> V2: overworld-Default einfuegen
    const v2: GameState = {
      version: SAVE_SCHEMA_VERSION,
      playerId: parsed.playerId,
      plants: parsed.plants ?? [],
      coins: parsed.coins ?? 0,
      gems: parsed.gems ?? 0,
      createdAt: parsed.createdAt ?? Date.now(),
      overworld: { ...DEFAULT_OVERWORLD }
    };
    console.log('[storage] migrated save v1 -> v2');
    return v2;
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
    state.version = SAVE_SCHEMA_VERSION;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save game state', e);
  }
}

export function resetGame(): void {
  localStorage.removeItem(STORAGE_KEY);
}
