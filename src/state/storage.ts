import type { Plant } from '../types/plant';

export interface GameState {
  version: number;
  playerId: string;
  plants: Plant[];
  coins: number;
  gems: number;
  createdAt: number;
}

const STORAGE_KEY = 'plantinvasion_save_v1';
export const SAVE_SCHEMA_VERSION = 1;

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (parsed.version !== SAVE_SCHEMA_VERSION) {
      console.warn('Save schema mismatch, discarding save');
      return null;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load game state', e);
    return null;
  }
}

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save game state', e);
  }
}

export function resetGame(): void {
  localStorage.removeItem(STORAGE_KEY);
}
