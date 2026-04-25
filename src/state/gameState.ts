import type { Plant } from '../types/plant';
import { rollStarterStats } from '../data/genetics';
import { tickPlant } from '../data/leveling';
import { getSpecies } from '../data/species';
import { loadGame, saveGame, SAVE_SCHEMA_VERSION, type GameState } from './storage';

export const GRID_COLUMNS = 4;
export const GRID_ROWS = 3;
export const GRID_CAPACITY = GRID_COLUMNS * GRID_ROWS;

function makeId(): string {
  return 'p_' + Math.random().toString(36).slice(2, 10);
}

function findFreeGridSlot(plants: Plant[]): { x: number; y: number } | null {
  const occupied = new Set(plants.map((p) => `${p.gridX},${p.gridY}`));
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLUMNS; x++) {
      if (!occupied.has(`${x},${y}`)) return { x, y };
    }
  }
  return null;
}

/**
 * Erstellt eine neue Pflanze einer Spezies (Stage Seed, Level 1).
 */
export function createPlantOfSpecies(speciesSlug: string, plants: Plant[]): Plant | null {
  const species = getSpecies(speciesSlug);
  if (!species) return null;
  const slot = findFreeGridSlot(plants);
  if (!slot) return null;
  const seed = Math.floor(Math.random() * 1_000_000_000);
  const stats = rollStarterStats(species, seed);
  const now = Date.now();
  return {
    id: makeId(),
    speciesSlug: species.slug,
    stats,
    geneSeed: seed,
    isMutation: false,
    level: 1,
    xp: 0,
    totalXp: 0,
    bornAt: now,
    lastWateredAt: now,
    lastTickAt: now,
    gridX: slot.x,
    gridY: slot.y
  };
}

/**
 * Initialer Spielzustand fuer neue Spieler.
 * Gibt eine Sunflower als Starter-Pflanze.
 */
export function newGame(): GameState {
  const state: GameState = {
    version: SAVE_SCHEMA_VERSION,
    playerId: 'local_' + Math.random().toString(36).slice(2, 10),
    plants: [],
    coins: 100,
    gems: 0,
    createdAt: Date.now(),
    overworld: {
      tileX: 14,
      tileY: 17,
      facing: 'up',
      zone: 'wurzelheim',
      lastSceneVisited: 'OverworldScene'
    },
    pokedex: { discovered: [], captured: [] },
    inventory: { 'basic-lure': 3, 'heal-tonic': 2 }
  };
  const starter = createPlantOfSpecies('sunflower', state.plants);
  if (starter) state.plants.push(starter);
  return state;
}

/**
 * Singleton-Game-State im Speicher.
 * Wird beim Start geladen oder neu erstellt.
 */
class GameStore {
  private state: GameState;
  private listeners: Set<(s: GameState) => void> = new Set();

  constructor() {
    this.state = loadGame() ?? newGame();
    if (this.state.plants.length === 0) {
      const starter = createPlantOfSpecies('sunflower', this.state.plants);
      if (starter) this.state.plants.push(starter);
    }
  }

  get(): GameState {
    return this.state;
  }

  /** Wendet einen Tick auf alle Pflanzen an, returniert geupdated state. */
  tick(now = Date.now()): void {
    let mutated = false;
    this.state.plants = this.state.plants.map((p) => {
      const updated = tickPlant(p, now);
      if (updated !== p) mutated = true;
      return updated;
    });
    if (mutated) this.notify();
  }

  updatePlant(plantId: string, fn: (p: Plant) => Plant): void {
    this.state.plants = this.state.plants.map((p) => (p.id === plantId ? fn(p) : p));
    this.notify();
  }

  movePlant(plantId: string, x: number, y: number): boolean {
    if (x < 0 || x >= GRID_COLUMNS || y < 0 || y >= GRID_ROWS) return false;
    const occupied = this.state.plants.find(
      (p) => p.id !== plantId && p.gridX === x && p.gridY === y
    );
    if (occupied) {
      // Tausch
      const moving = this.state.plants.find((p) => p.id === plantId);
      if (!moving) return false;
      this.state.plants = this.state.plants.map((p) => {
        if (p.id === plantId) return { ...p, gridX: x, gridY: y };
        if (p.id === occupied.id) return { ...p, gridX: moving.gridX, gridY: moving.gridY };
        return p;
      });
    } else {
      this.state.plants = this.state.plants.map((p) =>
        p.id === plantId ? { ...p, gridX: x, gridY: y } : p
      );
    }
    this.notify();
    return true;
  }

  save(): void {
    saveGame(this.state);
  }

  setOverworldPos(tileX: number, tileY: number, facing: 'up' | 'down' | 'left' | 'right', scene: 'OverworldScene' | 'GardenScene' = 'OverworldScene', zone?: string): void {
    const currentZone = zone ?? this.state.overworld?.zone ?? 'wurzelheim';
    this.state.overworld = {
      tileX,
      tileY,
      facing,
      zone: currentZone,
      lastSceneVisited: scene
    };
    this.save();
  }

  discoverSpecies(slug: string): void {
    if (!this.state.pokedex) this.state.pokedex = { discovered: [], captured: [] };
    if (!this.state.pokedex.discovered.includes(slug)) {
      this.state.pokedex.discovered.push(slug);
      this.save();
    }
  }

  captureSpecies(slug: string): void {
    if (!this.state.pokedex) this.state.pokedex = { discovered: [], captured: [] };
    if (!this.state.pokedex.discovered.includes(slug)) {
      this.state.pokedex.discovered.push(slug);
    }
    if (!this.state.pokedex.captured.includes(slug)) {
      this.state.pokedex.captured.push(slug);
    }
    this.save();
  }

  getPokedex() {
    return this.state.pokedex ?? { discovered: [], captured: [] };
  }

  getInventory(): Record<string, number> {
    return this.state.inventory ?? {};
  }

  hasItem(slug: string): boolean {
    return (this.state.inventory?.[slug] ?? 0) > 0;
  }

  consumeItem(slug: string): boolean {
    if (!this.state.inventory) return false;
    const c = this.state.inventory[slug] ?? 0;
    if (c <= 0) return false;
    this.state.inventory[slug] = c - 1;
    if (this.state.inventory[slug] <= 0) delete this.state.inventory[slug];
    this.save();
    return true;
  }

  addItem(slug: string, amount = 1): void {
    if (!this.state.inventory) this.state.inventory = {};
    this.state.inventory[slug] = (this.state.inventory[slug] ?? 0) + amount;
    this.save();
  }

  spendCoins(n: number): boolean {
    if (this.state.coins < n) return false;
    this.state.coins -= n;
    this.save();
    return true;
  }

  addCoins(n: number): void {
    this.state.coins += n;
    this.save();
  }

  capturePlant(slug: string, level: number, atkBias: number, defBias: number, spdBias: number): boolean {
    // Plant in Garden hinzufuegen
    const slot = (() => {
      const occupied = new Set(this.state.plants.map((p) => `${p.gridX},${p.gridY}`));
      for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLUMNS; x++) {
          if (!occupied.has(`${x},${y}`)) return { x, y };
        }
      }
      return null;
    })();
    if (!slot) return false;
    const seed = Math.floor(Math.random() * 1_000_000_000);
    const now = Date.now();
    const newPlant: Plant = {
      id: 'p_' + Math.random().toString(36).slice(2, 10),
      speciesSlug: slug,
      stats: { atk: 50 + atkBias, def: 50 + defBias, spd: 50 + spdBias },
      geneSeed: seed,
      isMutation: false,
      level,
      xp: 0,
      totalXp: 0,
      bornAt: now,
      lastWateredAt: now,
      lastTickAt: now,
      gridX: slot.x,
      gridY: slot.y
    };
    this.state.plants.push(newPlant);
    this.captureSpecies(slug);
    this.save();
    return true;
  }

  getOverworldPos() {
    return this.state.overworld ?? {
      tileX: 14, tileY: 17, facing: 'up' as const, zone: 'wurzelheim', lastSceneVisited: 'OverworldScene' as const
    };
  }

  subscribe(fn: (s: GameState) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.state));
    this.save();
  }
}

export const gameStore = new GameStore();
export type { GameState };
