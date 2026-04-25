import type { GardenSlotMeta, Plant, SoilTier } from '../types/plant';
import { rollStarterStats, crossStats, rollMutation } from '../data/genetics';
import { tickPlant, defaultGrowthFields, harvestPlant, isHarvestReady } from '../data/leveling';
import { getSpecies } from '../data/species';
import { applyItemToPlant, nextSoilTier, SOIL_COSTS, SOIL_MUTATION_BONUS } from '../data/boosters';
import { getItem, isSeedItem, speciesSlugFromSeed } from '../data/items';
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
    gridY: slot.y,
    ...defaultGrowthFields()
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
    pokedex: { discovered: ['sunflower'], captured: ['sunflower'] },
    inventory: { 'basic-lure': 3, 'heal-tonic': 2, 'compost-tea': 2, 'seed-fern': 1 },
    quests: {},
    gardenSlots: defaultGardenSlots(),
    lastDailyLoginAt: 0,
    marketShopRosterDay: 0,
    marketShopRoster: { seedSlugs: [], boosterSlugs: [] }
  };
  const starter = createPlantOfSpecies('sunflower', state.plants);
  if (starter) state.plants.push(starter);
  return state;
}

export function defaultGardenSlots(): GardenSlotMeta[] {
  const slots: GardenSlotMeta[] = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLUMNS; x++) {
      slots.push({ x, y, soilTier: 'normal' });
    }
  }
  return slots;
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

  /** Wendet einen Tick auf alle Pflanzen an. Garten ist immer neutrale Zone "wurzelheim". */
  tick(now = Date.now()): void {
    let mutated = false;
    const zone = 'wurzelheim';
    this.state.plants = this.state.plants.map((p) => {
      const soilTier = this.getSoilTier(p.gridX, p.gridY);
      const updated = tickPlant(p, { zone, now, soilTier });
      if (updated !== p) mutated = true;
      return updated;
    });
    if (mutated) this.notify();
  }

  // =========================================================
  // Booster + Seed + Soil
  // =========================================================

  getGardenSlots(): GardenSlotMeta[] {
    if (!this.state.gardenSlots || this.state.gardenSlots.length === 0) {
      this.state.gardenSlots = defaultGardenSlots();
    }
    return this.state.gardenSlots;
  }

  getSoilTier(gridX: number, gridY: number): SoilTier {
    const slot = this.getGardenSlots().find((s) => s.x === gridX && s.y === gridY);
    return slot?.soilTier ?? 'normal';
  }

  upgradeSoil(gridX: number, gridY: number): { ok: boolean; reason?: string; newTier?: SoilTier } {
    const slot = this.getGardenSlots().find((s) => s.x === gridX && s.y === gridY);
    if (!slot) return { ok: false, reason: 'Slot nicht gefunden' };
    const next = nextSoilTier(slot.soilTier);
    if (!next) return { ok: false, reason: 'Bereits Gold-Tier' };
    const cost = SOIL_COSTS[next];
    if (this.state.coins < cost) return { ok: false, reason: `Brauchst ${cost} Coins` };
    this.state.coins -= cost;
    slot.soilTier = next;
    this.notify();
    return { ok: true, newTier: next };
  }

  applyItemToPlant(plantId: string, itemSlug: string): { ok: boolean; reason?: string; message?: string } {
    if (!this.hasItem(itemSlug)) return { ok: false, reason: 'Item nicht im Inventar' };
    const plant = this.state.plants.find((p) => p.id === plantId);
    if (!plant) return { ok: false, reason: 'Pflanze nicht gefunden' };
    const result = applyItemToPlant(plant, itemSlug);
    if (!result.ok) return { ok: false, reason: result.reason };
    this.state.plants = this.state.plants.map((p) => (p.id === plantId ? result.plant : p));
    this.consumeItem(itemSlug);
    this.notify();
    return { ok: true, message: result.message };
  }

  /**
   * Saet einen Seed-Item ein und erstellt eine neue Pflanze (Stage 0).
   * Item wird konsumiert.
   */
  plantSeed(seedSlug: string): { ok: boolean; reason?: string; plant?: Plant } {
    if (!isSeedItem(seedSlug)) return { ok: false, reason: 'Kein Seed-Item' };
    if (!this.hasItem(seedSlug)) return { ok: false, reason: 'Seed nicht im Inventar' };
    const speciesSlug = speciesSlugFromSeed(seedSlug);
    if (!speciesSlug) return { ok: false, reason: 'Ungueltiger Seed-Slug' };
    const plant = createPlantOfSpecies(speciesSlug, this.state.plants);
    if (!plant) return { ok: false, reason: 'Kein freier Slot oder unbekannte Spezies' };
    this.state.plants.push(plant);
    this.consumeItem(seedSlug);
    this.captureSpecies(speciesSlug);
    this.notify();
    return { ok: true, plant };
  }

  /**
   * Daily-Login-Reward. Gibt true zurueck wenn ein Reward heute schon verfuegbar ist.
   * State wird aktualisiert, Reward in Inventar oder Coins.
   */
  claimDailyLogin(now = Date.now()): { ok: boolean; reward?: { label: string; coins?: number; itemSlug?: string } } {
    const last = this.state.lastDailyLoginAt ?? 0;
    if (now - last < 24 * 60 * 60 * 1000) {
      return { ok: false };
    }
    const roll = Math.random();
    let reward: { label: string; coins?: number; itemSlug?: string };
    if (roll < 0.5) {
      const coins = 50 + Math.floor(Math.random() * 100);
      reward = { label: `+${coins} Coins`, coins };
      this.addCoins(coins);
    } else if (roll < 0.8) {
      // Random seed aus discovered-Pool
      const dex = this.getPokedex();
      const pool = dex.captured.length > 0 ? dex.captured : ['sunflower'];
      const slug = pool[Math.floor(Math.random() * pool.length)];
      const itemSlug = `seed-${slug}`;
      this.addItem(itemSlug, 1);
      reward = { label: `1x ${itemSlug}`, itemSlug };
    } else if (roll < 0.95) {
      const boosters = ['volcano-ash', 'swamp-pollen', 'compost-tea'];
      const slug = boosters[Math.floor(Math.random() * boosters.length)];
      this.addItem(slug, 1);
      reward = { label: `1x ${slug}`, itemSlug: slug };
    } else {
      this.addItem('pristine-pollen', 1);
      reward = { label: '1x Pristine-Pollen', itemSlug: 'pristine-pollen' };
    }
    this.state.lastDailyLoginAt = now;
    this.save();
    return { ok: true, reward };
  }

  /**
   * Markt-Shop-Roster. Aktualisiert taeglich auf Basis des Real-Time-Tags.
   */
  getMarketShopRoster(now = Date.now()): { seedSlugs: string[]; boosterSlugs: string[] } {
    const dayIndex = Math.floor((now - this.state.createdAt) / (24 * 60 * 60 * 1000));
    if (this.state.marketShopRosterDay !== dayIndex || !this.state.marketShopRoster) {
      const dex = this.getPokedex();
      const seedPool = dex.discovered.length > 0 ? dex.discovered : ['sunflower', 'fern', 'mint'];
      // Zufaellig 5 Seeds (mit Wiederholung-Toleranz wenn pool < 5)
      const seedSlugs: string[] = [];
      for (let i = 0; i < 5; i++) {
        const slug = seedPool[Math.floor(Math.random() * seedPool.length)];
        seedSlugs.push(`seed-${slug}`);
      }
      const boosterPool = ['compost-tea', 'volcano-ash', 'swamp-pollen', 'sun-lamp', 'sprinkler'];
      const boosterSlugs: string[] = [];
      for (let i = 0; i < 2; i++) {
        boosterSlugs.push(boosterPool[Math.floor(Math.random() * boosterPool.length)]);
      }
      this.state.marketShopRoster = { seedSlugs, boosterSlugs };
      this.state.marketShopRosterDay = dayIndex;
      this.save();
    }
    return this.state.marketShopRoster;
  }

  buyShopItem(itemSlug: string): { ok: boolean; reason?: string } {
    const item = getItem(itemSlug);
    if (!item) return { ok: false, reason: 'Item unbekannt' };
    if (this.state.coins < item.buyPrice) return { ok: false, reason: `Brauchst ${item.buyPrice} Coins` };
    this.state.coins -= item.buyPrice;
    this.addItem(itemSlug, 1);
    this.notify();
    return { ok: true };
  }

  // -------- Helpers fuer Mutation-Bonus aus Soil --------
  getMutationBonusForSlot(gridX: number, gridY: number): number {
    const tier = this.getSoilTier(gridX, gridY);
    return SOIL_MUTATION_BONUS[tier];
  }

  updatePlant(plantId: string, fn: (p: Plant) => Plant): void {
    this.state.plants = this.state.plants.map((p) => (p.id === plantId ? fn(p) : p));
    this.notify();
  }

  /**
   * Erntet eine Blooming-Pflanze. Gibt success + output zurueck.
   * Coins werden direkt addiert, Samen kommen ins Inventar.
   */
  harvestPlant(plantId: string): {
    ok: boolean;
    coins: number;
    seedSlug?: string;
    pollen: boolean;
    reason?: string;
  } {
    const plant = this.state.plants.find((p) => p.id === plantId);
    if (!plant) return { ok: false, coins: 0, pollen: false, reason: 'Pflanze nicht gefunden' };
    if (!isHarvestReady(plant)) return { ok: false, coins: 0, pollen: false, reason: 'Noch nicht reif' };
    const { plant: updated, output } = harvestPlant(plant);
    this.state.plants = this.state.plants.map((p) => (p.id === plantId ? updated : p));
    if (output.coins > 0) this.state.coins += output.coins;
    if (output.seedSpeciesSlug) {
      const seedItem = `seed-${output.seedSpeciesSlug}`;
      this.addItem(seedItem, 1);
    }
    if (output.pollenChance) {
      this.addItem('pristine-pollen', 1);
    }
    this.notify();
    return {
      ok: true,
      coins: output.coins,
      seedSlug: output.seedSpeciesSlug,
      pollen: output.pollenChance
    };
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

  resetToNewGame(): void {
    this.state = newGame();
    if (this.state.plants.length === 0) {
      const starter = createPlantOfSpecies('sunflower', this.state.plants);
      if (starter) this.state.plants.push(starter);
    }
    this.save();
    this.notify();
  }

  getTutorial(): { step: number; done: boolean } {
    return this.state.tutorial ?? { step: 5, done: true };
  }

  advanceTutorial(toStep: number): void {
    if (!this.state.tutorial) this.state.tutorial = { step: 0, done: false };
    if (this.state.tutorial.done) return;
    this.state.tutorial.step = Math.max(this.state.tutorial.step, toStep);
    if (this.state.tutorial.step >= 5) {
      this.state.tutorial.done = true;
    }
    this.save();
  }

  skipTutorial(): void {
    this.state.tutorial = { step: 5, done: true };
    this.save();
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

  getQuestState(questId: string): 'pending' | 'active' | 'completed' {
    return this.state.quests?.[questId] ?? 'pending';
  }

  acceptQuest(questId: string): void {
    if (!this.state.quests) this.state.quests = {};
    if (this.state.quests[questId] === 'completed') return;
    this.state.quests[questId] = 'active';
    this.save();
  }

  completeQuest(questId: string, rewardCoins = 0, rewardItems: Record<string, number> = {}): void {
    if (!this.state.quests) this.state.quests = {};
    this.state.quests[questId] = 'completed';
    if (rewardCoins) this.addCoins(rewardCoins);
    for (const [slug, n] of Object.entries(rewardItems)) {
      this.addItem(slug, n);
    }
    this.save();
  }

  getActiveQuests(): string[] {
    if (!this.state.quests) return [];
    return Object.entries(this.state.quests).filter(([, s]) => s === 'active').map(([id]) => id);
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

  crossPlants(parentAId: string, parentBId: string): { ok: boolean; reason?: string; child?: Plant } {
    const a = this.state.plants.find((p) => p.id === parentAId);
    const b = this.state.plants.find((p) => p.id === parentBId);
    if (!a || !b) return { ok: false, reason: 'Eltern nicht gefunden' };
    if (a.id === b.id) return { ok: false, reason: 'Selbe Pflanze gewaehlt' };
    if (a.level < 5 || b.level < 5) return { ok: false, reason: 'Beide Pflanzen brauchen Level 5+' };
    const COST = 50;
    if (this.state.coins < COST) return { ok: false, reason: `Du brauchst ${COST} Gold` };
    // Free Slot
    const slot = (() => {
      const occupied = new Set(this.state.plants.map((p) => `${p.gridX},${p.gridY}`));
      for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLUMNS; x++) {
          if (!occupied.has(`${x},${y}`)) return { x, y };
        }
      }
      return null;
    })();
    if (!slot) return { ok: false, reason: 'Kein freier Slot' };
    // Cross
    const seed = Math.floor(Math.random() * 1_000_000_000);
    const mutation = rollMutation(seed);
    const stats = crossStats(a.stats, b.stats, seed, mutation.isMutation);
    const now = Date.now();
    // Generation = max(parent.generation) + 1
    const childGeneration = Math.max(a.generation ?? 0, b.generation ?? 0) + 1;
    const child: Plant = {
      id: 'p_' + Math.random().toString(36).slice(2, 10),
      speciesSlug: a.speciesSlug,
      stats,
      geneSeed: seed,
      parentAId: a.id,
      parentBId: b.id,
      isMutation: mutation.isMutation,
      level: 1,
      xp: 0,
      totalXp: 0,
      bornAt: now,
      lastWateredAt: now,
      lastTickAt: now,
      gridX: slot.x,
      gridY: slot.y,
      ...defaultGrowthFields(),
      generation: childGeneration
    };
    this.state.plants.push(child);
    this.state.coins -= COST;
    this.captureSpecies(child.speciesSlug);
    this.save();
    return { ok: true, child };
  }

  capturePlant(slug: string, level: number, atkBias: number, defBias: number, spdBias: number): boolean {
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
      gridY: slot.y,
      ...defaultGrowthFields()
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
