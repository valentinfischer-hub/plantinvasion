import type { GardenSlotMeta, Plant, SoilTier } from '../types/plant';
import { ENERGY_MAX, canAffordEnergy, spendEnergy, regenEnergy } from '../systems/EnergySystem';
import { rollStarterStats, crossStats, rollMutation } from '../data/genetics';
import { defaultGenome, crossGenomes, canCross, setCrossCooldown, inheritQualityTier, formatCooldown } from '../data/breedingV2';
import { tickPlant, defaultGrowthFields, harvestPlant, isHarvestReady } from '../data/leveling';
import { getSpecies } from '../data/species';
import { applyItemToPlant, nextSoilTier, SOIL_COSTS, SOIL_MUTATION_BONUS } from '../data/boosters';
import { getItem, isSeedItem, speciesSlugFromSeed } from '../data/items';
import { findRecipe } from '../data/hybridRecipes';
import { companionBonus } from '../data/companion';
import { rollInitialGenes, inheritGenes } from '../data/genes';
import {
  FORAGE_COOLDOWN_MS,
  rollForagePool,
  rollHiddenSpotLoot,
  rollBattleDrop,
  findHiddenSpot,
  hiddenSpotKey
} from '../data/foraging';
import { ACHIEVEMENTS, getAchievement } from '../data/achievements';
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
export function isSlotOccupied(plants: Plant[], gridX: number, gridY: number): boolean {
  return plants.some((p) => p.gridX === gridX && p.gridY === gridY);
}

/**
 * B-012 V0.2: Variante von createPlantOfSpecies mit explizitem Slot.
 * Liefert null bei unbekannter Spezies, ungueltigen Koordinaten oder besetztem Slot.
 */
export function createPlantOfSpeciesAt(
  speciesSlug: string,
  plants: Plant[],
  gridX: number,
  gridY: number
): Plant | null {
  const species = getSpecies(speciesSlug);
  if (!species) return null;
  if (gridX < 0 || gridX >= GRID_COLUMNS || gridY < 0 || gridY >= GRID_ROWS) return null;
  if (isSlotOccupied(plants, gridX, gridY)) return null;
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
    gridX,
    gridY,
    ...defaultGrowthFields(),
    genome: defaultGenome(),
    genes: rollInitialGenes()
  };
}

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
    ...defaultGrowthFields(),
    genome: defaultGenome(),
    genes: rollInitialGenes()
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
    marketShopRoster: { seedSlugs: [], boosterSlugs: [] },
    energy: ENERGY_MAX  // S-POLISH-B2-R1: Startet mit vollem Energie-Tank
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

  getEnergy(): number {
    return this.state.energy ?? ENERGY_MAX;
  }

  /** Energie vollstÃ¤ndig regenerieren (nach dem Schlafen / Tagesende). */
  regenEnergyForNewDay(): void {
    this.state.energy = regenEnergy(this.state.energy ?? 0);
    this.notify();
  }

  /** Wendet einen Tick auf alle Pflanzen an. Garten ist immer neutrale Zone "wurzelheim". */
  tick(now = Date.now()): void {
    let mutated = false;
    const zone = 'wurzelheim';
    const allPlants = this.state.plants;
    this.state.plants = allPlants.map((p) => {
      const soilTier = this.getSoilTier(p.gridX, p.gridY);
      const cBonus = companionBonus(p, allPlants).bonus;
      const updated = tickPlant(p, { zone, now, soilTier, companionBonus: cBonus });
      if (updated !== p) mutated = true;
      return updated;
    });
    if (mutated) {
      this.checkAchievements();
      this.notify();
    }
  }

  /** Schaltet Bonsai-Mode auf einer Pflanze. */
  toggleBonsai(plantId: string): { ok: boolean; bonsai?: boolean; reason?: string } {
    const plant = this.state.plants.find((p) => p.id === plantId);
    if (!plant) return { ok: false, reason: 'Pflanze nicht gefunden' };
    if (plant.level >= 45 && !plant.bonsaiMode) {
      return { ok: false, reason: 'Pflanze ist bereits Blooming - kann nicht zu Bonsai werden' };
    }
    const newBonsai = !plant.bonsaiMode;
    this.state.plants = this.state.plants.map((p) =>
      p.id === plantId ? { ...p, bonsaiMode: newBonsai } : p
    );
    this.notify();
    return { ok: true, bonsai: newBonsai };
  }

  /**
   * Vorschau auf ein Crossing ohne State-Mutation. Zeigt Stat-Range und Mutation-Chance.
   */
  previewCross(parentAId: string, parentBId: string): {
    ok: boolean;
    reason?: string;
    childSlug?: string;
    statRange?: { atk: [number, number]; def: [number, number]; spd: [number, number] };
    mutationChance?: number;
  } {
    const a = this.state.plants.find((p) => p.id === parentAId);
    const b = this.state.plants.find((p) => p.id === parentBId);
    if (!a || !b) return { ok: false, reason: 'Eltern nicht gefunden' };
    if (a.id === b.id) return { ok: false, reason: 'Selbe Pflanze gewaehlt' };
    if (a.level < 5 || b.level < 5) return { ok: false, reason: 'Beide brauchen Level 5+' };
    const recipe = findRecipe(a.speciesSlug, b.speciesSlug);
    const childSlug = recipe ? recipe.childSlug : a.speciesSlug;
    // Stat-Range: Mittel +/- 10%
    const avg = (x: number, y: number) => Math.round((x + y) / 2);
    const range = (mid: number) => [Math.round(mid * 0.9), Math.round(mid * 1.1)] as [number, number];
    const slot = this.findFreeSlot();
    const soilBonus = slot ? SOIL_MUTATION_BONUS[this.getSoilTier(slot.x, slot.y)] : 0;
    const recipeBonus = recipe?.mutationBonus ?? 0;
    const hybridBoost = this.hasItem('hybrid-booster') ? 0.05 : 0;
    const totalMut = 0.08 + soilBonus + recipeBonus + hybridBoost;
    return {
      ok: true,
      childSlug,
      statRange: {
        atk: range(avg(a.stats.atk, b.stats.atk)),
        def: range(avg(a.stats.def, b.stats.def)),
        spd: range(avg(a.stats.spd, b.stats.spd))
      },
      mutationChance: Math.round(totalMut * 100) / 100
    };
  }

  /** Helfer: erste freie Slot-Position oder null. */
  private findFreeSlot(): { x: number; y: number } | null {
    const occupied = new Set(this.state.plants.map((p) => `${p.gridX},${p.gridY}`));
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLUMNS; x++) {
        if (!occupied.has(`${x},${y}`)) return { x, y };
      }
    }
    return null;
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
  /**
   * B-012: Helper fuer Vorab-Check vor Saeen-Modal. UI kann Slot-Count im Title anzeigen
   * und bei 0 freien Slots das Modal gar nicht erst oeffnen.
   */
  getFreeSlotCount(): number {
    return GRID_CAPACITY - this.state.plants.length;
  }

  plantSeed(seedSlug: string): { ok: boolean; reason?: string; plant?: Plant } {
    if (!isSeedItem(seedSlug)) return { ok: false, reason: 'Kein Seed-Item' };
    if (!this.hasItem(seedSlug)) return { ok: false, reason: 'Seed nicht im Inventar' };
    if (!canAffordEnergy(this.state.energy ?? ENERGY_MAX, 'sow')) return { ok: false, reason: 'Zu mÃ¼de zum SÃ¤en (Energy leer)' };
    const speciesSlug = speciesSlugFromSeed(seedSlug);
    if (!speciesSlug) return { ok: false, reason: 'Ungueltiger Seed-Slug' };
    // B-012: separater Reason fuer Garten-voll vs unbekannte Spezies (vorher beide vermischt -> User wusste nicht warum)
    if (this.getFreeSlotCount() === 0) return { ok: false, reason: 'Garten voll. Ernte oder verschiebe Pflanzen.' };
    const plant = createPlantOfSpecies(speciesSlug, this.state.plants);
    if (!plant) return { ok: false, reason: 'Unbekannte Spezies' };
    this.state.plants.push(plant);
    this.consumeItem(seedSlug);
    this.captureSpecies(speciesSlug);
    this.state.energy = spendEnergy(this.state.energy ?? ENERGY_MAX, 'sow');
    this.notify();
    return { ok: true, plant };
  }

  /**
   * B-012 V0.2: Slot-First-Variante. UI ruft das wenn der User zuerst einen leeren
   * Slot im Garten geklickt hat, dann den Seed gewaehlt hat. Liefert eindeutige
   * Reasons damit der UI-Toast kein Raten-Spiel mehr ist.
   */
  plantSeedAt(seedSlug: string, gridX: number, gridY: number): { ok: boolean; reason?: string; plant?: Plant } {
    if (!isSeedItem(seedSlug)) return { ok: false, reason: 'Kein Seed-Item' };
    if (!this.hasItem(seedSlug)) return { ok: false, reason: 'Seed nicht im Inventar' };
    if (!canAffordEnergy(this.state.energy ?? ENERGY_MAX, 'sow')) return { ok: false, reason: 'Zu mÃ¼de zum SÃ¤en (Energy leer)' };
    const speciesSlug = speciesSlugFromSeed(seedSlug);
    if (!speciesSlug) return { ok: false, reason: 'Ungueltiger Seed-Slug' };
    if (gridX < 0 || gridX >= GRID_COLUMNS || gridY < 0 || gridY >= GRID_ROWS) {
      return { ok: false, reason: 'Slot ausserhalb des Gartens' };
    }
    if (isSlotOccupied(this.state.plants, gridX, gridY)) {
      return { ok: false, reason: 'Slot belegt. Waehle einen leeren Slot.' };
    }
    const plant = createPlantOfSpeciesAt(speciesSlug, this.state.plants, gridX, gridY);
    if (!plant) return { ok: false, reason: 'Unbekannte Spezies' };
    this.state.plants.push(plant);
    this.consumeItem(seedSlug);
    this.captureSpecies(speciesSlug);
    this.state.energy = spendEnergy(this.state.energy ?? ENERGY_MAX, 'sow');
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
    this.updateLoginStreak(now);
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

  // -------- Save Export / Import + Cloud-Sync Stub (S-POLISH-B2-R17) --------

  /**
   * Exportiert den aktuellen Spielstand als JSON-String.
   * Kann in die Zwischenablage kopiert oder heruntergeladen werden.
   */
  exportSaveJSON(): string {
    return JSON.stringify(this.state, null, 2);
  }

  /**
   * Importiert einen JSON-Spielstand. Gibt { ok: true } zurÃ¼ck wenn erfolgreich,
   * sonst { ok: false, error: '<Grund>' }.
   */
  importSaveJSON(json: string): { ok: boolean; error?: string } {
    try {
      const parsed = JSON.parse(json);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return { ok: false, error: 'Kein valides JSON-Objekt' };
      }
      if (typeof parsed.version !== 'number') {
        return { ok: false, error: 'Fehlende version-Nummer im Spielstand' };
      }
      if (typeof parsed.playerId !== 'string') {
        return { ok: false, error: 'Fehlende playerId' };
      }
      // Spielstand als neuen State Ã¼bernehmen (in-Memory + save)
      this.state = parsed as GameState;
      this.save();
      this.notify();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: `JSON-Fehler: ${String(e)}` };
    }
  }

  /**
   * Cloud-Sync Stub (S-POLISH-B2-R17).
   * Wird in Sprint S-12 (Multiplayer) mit echtem Supabase-Aufruf ersetzt.
   * Gibt immer { ok: false, reason: 'stub' } zurÃ¼ck solange MP_ENABLED = false.
   */
  async cloudSyncUpload(): Promise<{ ok: boolean; reason?: string }> {
    return { ok: false, reason: 'Cloud-Sync noch nicht aktiviert (kommt in S-12)' };
  }

  async cloudSyncDownload(): Promise<{ ok: boolean; reason?: string }> {
    return { ok: false, reason: 'Cloud-Sync noch nicht aktiviert (kommt in S-12)' };
  }

  // -------- Login-Streak Tracking (S-POLISH-B2-R12) --------

  getLoginStreak(): number {
    return this.state.loginStreak ?? 0;
  }

  getLoginDaysTotal(): number {
    return this.state.loginDaysTotal ?? 0;
  }

  /** Interne Methode: Streak nach claimDailyLogin aktualisieren. */
  updateLoginStreak(now = Date.now()): void {
    const last = this.state.lastDailyLoginAt ?? 0;
    const todayDay = Math.floor(now / (24 * 60 * 60 * 1000));
    const lastDay = Math.floor(last / (24 * 60 * 60 * 1000));
    const dayDiff = todayDay - lastDay;
    if (dayDiff === 1) {
      // Konsekutiver Tag â Streak erhÃ¶hen
      this.state.loginStreak = (this.state.loginStreak ?? 0) + 1;
    } else if (dayDiff > 1) {
      // Streak gebrochen
      this.state.loginStreak = 1;
    }
    this.state.loginDaysTotal = (this.state.loginDaysTotal ?? 0) + 1;
  }

  // -------- Market: Bought-Today Tracking (S-POLISH-B2-R9) --------

  /** Holt und migriert das Bought-Today-Tracking. Tag-Reset wenn dayIndex anders. */
  private getBoughtTodayMap(now = Date.now()): Record<string, number> {
    const dayIndex = Math.floor((now - this.state.createdAt) / (24 * 60 * 60 * 1000));
    if (this.state.marketBoughtTodayDay !== dayIndex) {
      this.state.marketBoughtToday = {};
      this.state.marketBoughtTodayDay = dayIndex;
    }
    if (!this.state.marketBoughtToday) this.state.marketBoughtToday = {};
    return this.state.marketBoughtToday;
  }

  /** Gibt zurueck wie viele eines Items heute im Roster-Modus gekauft wurden. */
  getMarketBoughtToday(itemSlug: string, now = Date.now()): number {
    return this.getBoughtTodayMap(now)[itemSlug] ?? 0;
  }

  /** Markiert einen Kauf im Roster-Modus. */
  recordMarketRosterBought(itemSlug: string, now = Date.now()): void {
    const map = this.getBoughtTodayMap(now);
    map[itemSlug] = (map[itemSlug] ?? 0) + 1;
    this.save();
  }

  // -------- Helpers fuer Mutation-Bonus aus Soil --------
  getMutationBonusForSlot(gridX: number, gridY: number): number {
    const tier = this.getSoilTier(gridX, gridY);
    return SOIL_MUTATION_BONUS[tier];
  }

  // =========================================================
  // Foraging V0.2 (Pokemon-Style)
  // =========================================================

  /** Forage-Tile-Loot. Cooldown gilt pro Tile via Key "zone:x:y". */
  /**
   * B4-R7: forageTile mit Journal-Tracking und Rare-Drop-Flag.
   * isRareDrop = true wenn Drop aus einer seltenen Kategorie.
   */
  forageTile(zone: string, tileX: number, tileY: number, now = Date.now()): { ok: boolean; reason?: string; itemSlug?: string; toast?: string; isRareDrop?: boolean } {
    if (!this.state.forageTilesCooldown) this.state.forageTilesCooldown = {};
    const key = `${zone}:${tileX}:${tileY}`;
    const lastAt = this.state.forageTilesCooldown[key] ?? 0;
    if (now - lastAt < FORAGE_COOLDOWN_MS) {
      const remMin = Math.ceil((FORAGE_COOLDOWN_MS - (now - lastAt)) / 60000);
      return { ok: false, reason: `Schon abgeerntet (${remMin}m)` };
    }
    const drop = rollForagePool(zone);
    this.addItem(drop.itemSlug, 1);
    this.state.forageTilesCooldown[key] = now;
    // B4-R7: Journal-Update (dedupliciert)
    if (!this.state.forageJournal) this.state.forageJournal = {};
    if (!this.state.forageJournal[zone]) this.state.forageJournal[zone] = [];
    if (!this.state.forageJournal[zone].includes(drop.itemSlug)) {
      this.state.forageJournal[zone].push(drop.itemSlug);
    }
    // B4-R7: Rare-Drop-Erkennung (Pristine-Pollen, Booster-Items < 5% Chance)
    const rareItems = ['pristine-pollen', 'volcano-ash', 'swamp-pollen', 'hybrid-booster'];
    const isRareDrop = rareItems.includes(drop.itemSlug);
    this.notify();
    return { ok: true, itemSlug: drop.itemSlug, toast: drop.toastLabel, isRareDrop };
  }

  /** B4-R7: Foraging-Journal fuer alle Biome. */
  getForageJournal(): Record<string, string[]> {
    return this.state.forageJournal ?? {};
  }

  /** Hidden-Spot-Loot. One-shot pro Save. */
  searchHiddenSpot(zone: string, tileX: number, tileY: number): { ok: boolean; reason?: string; itemSlug?: string; coins?: number; toast?: string } {
    const spot = findHiddenSpot(zone, tileX, tileY);
    if (!spot) return { ok: false };
    const key = hiddenSpotKey(spot);
    if (!this.state.collectedHiddenSpots) this.state.collectedHiddenSpots = [];
    if (this.state.collectedHiddenSpots.includes(key)) {
      return { ok: false };
    }
    const loot = rollHiddenSpotLoot(zone);
    if (loot.itemSlug === 'coins' && loot.coins) {
      this.addCoins(loot.coins);
    } else {
      this.addItem(loot.itemSlug, 1);
    }
    this.state.collectedHiddenSpots.push(key);
    this.notify();
    return { ok: true, itemSlug: loot.itemSlug, coins: loot.coins, toast: loot.toastLabel };
  }

  /** Battle-Drop nach gewonnener Wild-Battle. */
  applyBattleDrop(speciesSlug: string): { itemSlug?: string; coins?: number } {
    const drop = rollBattleDrop(speciesSlug);
    if (drop.itemSlug) this.addItem(drop.itemSlug, 1);
    if (drop.coins) this.addCoins(drop.coins);
    return drop;
  }

  // =========================================================
  // Achievements V0.1
  // =========================================================

  getAchievements(): string[] {
    return this.state.achievements ?? [];
  }

  hasAchievement(slug: string): boolean {
    return (this.state.achievements ?? []).includes(slug);
  }

  /** Pflicht-Trigger: pruefe ob ein Achievement jetzt erfuellt ist. Gibt unlocked-Liste zurueck. */
  checkAchievements(): string[] {
    if (!this.state.achievements) this.state.achievements = [];
    if (!this.state.achievementCounters) this.state.achievementCounters = { crossings: 0, mutations: 0, visitedZones: [] };
    const unlocked: string[] = [];
    const dex = this.getPokedex();
    const counters = this.state.achievementCounters;
    for (const a of ACHIEVEMENTS) {
      if (this.state.achievements.includes(a.slug)) continue;
      let meets: boolean;
      switch (a.slug) {
        case 'first-bloom':
          meets = this.state.plants.some((p) => (p.highestStageReached ?? 0) >= 4);
          break;
        case 'pristine-grower':
          meets = this.state.plants.some((p) => p.qualityTier === 'pristine');
          break;
        case 'hybrid-architect':
          meets = (counters.crossings ?? 0) >= 10;
          break;
        case 'mutation-storm':
          meets = (counters.mutations ?? 0) >= 10;
          break;
        case 'cactus-bundle':
          meets = this.state.plants.filter(
            (p) => p.qualityTier === 'pristine' && p.speciesSlug.includes('cactus')
          ).length >= 5;
          break;
        case 'world-traveler':
          meets = (counters.visitedZones ?? []).length >= 7;
          break;
        case 'collector':
          meets = (dex.discovered ?? []).length >= 30;
          break;
        case 'completion':
          meets = (dex.discovered ?? []).length >= 60;
          break;
        // swamp-veteran und volcano-tamer kommen via Boss-Defeat-Hook in S-09
        default:
          meets = false;
      }
      if (meets) {
        this.state.achievements.push(a.slug);
        if (a.rewardCoins) this.addCoins(a.rewardCoins);
        if (a.rewardItem) this.addItem(a.rewardItem.slug, a.rewardItem.amount);
        unlocked.push(a.slug);
      }
    }
    if (unlocked.length > 0) this.notify();
    return unlocked;
  }

  /** Counter-Increment Helper - aufzurufen bei Crossing/Mutation/Zone-Visit. */
  incrementAchievementCounter(key: 'crossings' | 'mutations'): void {
    if (!this.state.achievementCounters) this.state.achievementCounters = { crossings: 0, mutations: 0, visitedZones: [] };
    this.state.achievementCounters[key] = (this.state.achievementCounters[key] ?? 0) + 1;
    this.checkAchievements();
  }

  getAchievementCounters(): { crossings: number; mutations: number; visitedZones: string[] } {
    if (!this.state.achievementCounters) this.state.achievementCounters = { crossings: 0, mutations: 0, visitedZones: [] };
    return this.state.achievementCounters ?? { crossings: 0, mutations: 0, visitedZones: [] };
  }

  recordZoneVisit(zone: string): void {
    if (!this.state.achievementCounters) this.state.achievementCounters = { crossings: 0, mutations: 0, visitedZones: [] };
    if (!this.state.achievementCounters.visitedZones) this.state.achievementCounters.visitedZones = [];
    if (!this.state.achievementCounters.visitedZones.includes(zone)) {
      this.state.achievementCounters.visitedZones.push(zone);
      this.checkAchievements();
    }
  }

  unlockAchievementBySlug(slug: string): void {
    if (!this.state.achievements) this.state.achievements = [];
    if (this.state.achievements.includes(slug)) return;
    const def = getAchievement(slug);
    if (!def) return;
    this.state.achievements.push(slug);
    // PostHog: achievement unlocked
    (window as unknown as { __posthog?: { capture: (e: string, p?: Record<string, unknown>) => void } }).__posthog?.capture('achievement_unlocked', { slug, coins: def.rewardCoins ?? 0 });
    if (def.rewardCoins) this.addCoins(def.rewardCoins);
    if (def.rewardItem) this.addItem(def.rewardItem.slug, def.rewardItem.amount);
    this.notify();
  }

  /** Berry-Master-NPC: einmal pro Real-Time-Tag einen Free-Seed. */
  claimBerryMaster(now = Date.now()): { ok: boolean; reason?: string; itemSlug?: string } {
    const last = this.state.lastBerryMasterAt ?? 0;
    if (now - last < 24 * 60 * 60 * 1000) {
      const remH = Math.ceil((24 * 60 * 60 * 1000 - (now - last)) / 3600000);
      return { ok: false, reason: `Komm in ${remH}h zurueck` };
    }
    const dex = this.getPokedex();
    const pool = dex.discovered.length > 0 ? dex.discovered : ['sunflower', 'fern', 'mint', 'rose', 'tulip'];
    const slug = pool[Math.floor(Math.random() * pool.length)];
    const itemSlug = `seed-${slug}`;
    this.addItem(itemSlug, 1);
    this.state.lastBerryMasterAt = now;
    this.save();
    return { ok: true, itemSlug };
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
    this.state.energy = spendEnergy(this.state.energy ?? ENERGY_MAX, 'harvest');
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

  /** S-POLISH-START-17: Charakter-Profil (Name + Avatar) nach Charakter-Erstellung setzen. */
  setPlayerProfile(name: string, avatarId: number): void {
    const trimmed = name.trim().slice(0, 16) || 'Botaniker';
    this.state.playerName = trimmed;
    this.state.avatarId   = Math.max(0, Math.min(3, avatarId));
    this.save();
    this.notify();
  }

  /** S-POLISH-START-17: Charakter-Profil abrufen. */
  getPlayerProfile(): { name: string; avatarId: number } {
    return {
      name:     this.state.playerName ?? 'Botaniker',
      avatarId: this.state.avatarId   ?? 0,
    };
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
    // S-POLISH-B2-R7: tutorial_skipped Flag fÃ¼r Analytics
    if (!this.state.story) this.state.story = { flags: {}, currentAct: 0, metNpcs: [], diaryEntries: [] };
    this.state.story.flags['tutorial_skipped'] = true;
    this.save();
  }

  isTutorialSkipped(): boolean {
    return this.state.story?.flags?.['tutorial_skipped'] === true;
  }


  // === TIME-STATE ===
  getTime(): { minute: number; day: number; season: 0|1|2|3; year: number } {
    return this.state.time ?? { minute: 360, day: 1, season: 0, year: 1 };
  }

  /** Advance game-time by N real-ms. 1 real-second = 1 game-minute. */
  tickGameTime(deltaMs: number): void {
    if (!this.state.time) this.state.time = { minute: 360, day: 1, season: 0, year: 1 };
    const t = this.state.time;
    t.minute += deltaMs / 1000;
    while (t.minute >= 1440) {
      t.minute -= 1440;
      t.day += 1;
      if (t.day > 28) {
        t.day = 1;
        t.season = ((t.season + 1) % 4) as 0|1|2|3;
        if (t.season === 0) t.year += 1;
      }
    }
  }

  /** Tageszeit-Phase: morning, day, evening, night */
  getTimeOfDay(): 'morning' | 'day' | 'evening' | 'night' {
    const m = this.getTime().minute;
    if (m < 360) return 'night';        // 0-6
    if (m < 540) return 'morning';      // 6-9
    if (m < 1080) return 'day';         // 9-18
    if (m < 1260) return 'evening';     // 18-21
    return 'night';                       // 21-24
  }

  getSeasonName(): string {
    const seasons = ['Fruehling', 'Sommer', 'Herbst', 'Winter'];
    return seasons[this.getTime().season];
  }

  formatTime(): string {
    const t = this.getTime();
    const h = Math.floor(t.minute / 60).toString().padStart(2, '0');
    const m = Math.floor(t.minute % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  // === STORY-STATE ===
  getStoryFlag(flag: string): boolean {
    return !!this.state.story?.flags?.[flag];
  }

  setStoryFlag(flag: string, value: boolean = true): void {
    if (!this.state.story) this.state.story = { flags: {}, currentAct: 0, metNpcs: [], diaryEntries: [] };
    this.state.story.flags[flag] = value;
    this.save();
  }

  getCurrentAct(): number {
    return this.state.story?.currentAct ?? 0;
  }

  advanceAct(toAct: number): void {
    if (!this.state.story) this.state.story = { flags: {}, currentAct: 0, metNpcs: [], diaryEntries: [] };
    if (toAct > this.state.story.currentAct) {
      this.state.story.currentAct = toAct;
      this.save();
    }
  }

  // === NPC-RELATION-SYSTEM (Hearts) ===
  getNpcHearts(npcId: string): number {
    return (this.state.story?.flags?.[`npc_hearts_${npcId}`] as unknown as number) ?? 0;
  }

  addNpcHearts(npcId: string, amount: number): void {
    if (!this.state.story) this.state.story = { flags: {}, currentAct: 0, metNpcs: [], diaryEntries: [] };
    const key = `npc_hearts_${npcId}`;
    const current = (this.state.story.flags[key] as unknown as number) ?? 0;
    this.state.story.flags[key] = Math.min(10, current + amount) as unknown as boolean;
    this.notify();
  }

  /** Weekly-Gift-Cooldown: Hat der Spieler dieser NPC diese Woche schon ein Geschenk gegeben? */
  hasGiftedNpcThisWeek(npcId: string): boolean {
    const time = this.getTime();
    const weekKey = `npc_gift_week_${npcId}_${time.year}_${Math.floor(time.day / 7)}`;
    return this.state.story?.flags?.[weekKey] === true;
  }

  markNpcGiftedThisWeek(npcId: string): void {
    if (!this.state.story) this.state.story = { flags: {}, currentAct: 0, metNpcs: [], diaryEntries: [] };
    const time = this.getTime();
    const weekKey = `npc_gift_week_${npcId}_${time.year}_${Math.floor(time.day / 7)}`;
    this.state.story.flags[weekKey] = true;
    this.addNpcHearts(npcId, 1);
    this.save();
  }

  meetNpc(npcId: string): boolean {
    if (!this.state.story) this.state.story = { flags: {}, currentAct: 0, metNpcs: [], diaryEntries: [] };
    if (this.state.story.metNpcs.includes(npcId)) return false;
    this.state.story.metNpcs.push(npcId);
    this.save();
    return true;
  }

  hasMetNpc(npcId: string): boolean {
    return this.state.story?.metNpcs?.includes(npcId) ?? false;
  }

  collectDiaryEntry(entryId: number): boolean {
    if (!this.state.story) this.state.story = { flags: {}, currentAct: 0, metNpcs: [], diaryEntries: [] };
    if (this.state.story.diaryEntries.includes(entryId)) return false;
    this.state.story.diaryEntries.push(entryId);
    this.save();
    return true;
  }

  getDiaryEntries(): number[] {
    return this.state.story?.diaryEntries ?? [];
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

  getCrossCooldown(plantId: string): string {
    const p = this.state.plants.find((pl) => pl.id === plantId);
    if (!p) return '';
    return formatCooldown(p);
  }

  crossPlants(parentAId: string, parentBId: string): { ok: boolean; reason?: string; child?: Plant } {
    const a = this.state.plants.find((p) => p.id === parentAId);
    const b = this.state.plants.find((p) => p.id === parentBId);
    if (!a || !b) return { ok: false, reason: 'Eltern nicht gefunden' };
    if (a.id === b.id) return { ok: false, reason: 'Selbe Pflanze gewaehlt' };
    // V2: Cross-Cooldown plus Level-Check via canCross
    const ccA = canCross(a);
    if (!ccA.ok) return { ok: false, reason: ccA.reason };
    const ccB = canCross(b);
    if (!ccB.ok) return { ok: false, reason: ccB.reason };
    if (!canAffordEnergy(this.state.energy ?? ENERGY_MAX, 'cross')) return { ok: false, reason: 'Zu mÃ¼de zum Kreuzen (Energy leer)' };
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
    // Hybrid-Recipe-Check: bestimmt childSlug und Mutation-Bonus
    const recipe = findRecipe(a.speciesSlug, b.speciesSlug);
    const childSlug = recipe ? recipe.childSlug : a.speciesSlug;
    // Soil-Mutation-Bonus + Recipe-Bonus + Hybrid-Booster-Item
    const soilBonus = SOIL_MUTATION_BONUS[this.getSoilTier(slot.x, slot.y)];
    const recipeBonus = recipe?.mutationBonus ?? 0;
    const hybridBoost = this.hasItem('hybrid-booster') ? 0.05 : 0;
    if (hybridBoost > 0) this.consumeItem('hybrid-booster');
    const baseMutationChance = 0.08;
    const totalMutationChance = baseMutationChance + soilBonus + recipeBonus + hybridBoost;
    const mutation = rollMutation(seed, totalMutationChance);
    const stats = crossStats(a.stats, b.stats, seed, mutation.isMutation);
    const now = Date.now();
    // Generation = max(parent.generation) + 1
    const childGeneration = Math.max(a.generation ?? 0, b.generation ?? 0) + 1;
    // Gen-Vererbung 70/20/10
    const childGenes = inheritGenes(a.genes ?? {}, b.genes ?? {}, mutation.isMutation);
    // Mutation-Art Roll (gleichmaessig 4-fach falls Mutation)
    const mutationKind = mutation.isMutation
      ? (['stat', 'skill', 'form', 'legendary'] as const)[Math.floor(Math.random() * 4)]
      : undefined;
    // Legendary-Mutation-Art: +20% all Stats
    if (mutationKind === 'legendary') {
      stats.atk = Math.floor(stats.atk * 1.20);
      stats.def = Math.floor(stats.def * 1.20);
      stats.spd = Math.floor(stats.spd * 1.20);
    }
    const child: Plant = {
      id: 'p_' + Math.random().toString(36).slice(2, 10),
      speciesSlug: childSlug,
      stats,
      geneSeed: seed,
      parentAId: a.id,
      parentBId: b.id,
      isMutation: mutation.isMutation,
      mutationKind,
      level: 1,
      xp: 0,
      totalXp: 0,
      bornAt: now,
      lastWateredAt: now,
      lastTickAt: now,
      gridX: slot.x,
      gridY: slot.y,
      genes: childGenes,
      ...defaultGrowthFields(),
      generation: childGeneration
    };
    // V2 Genome-Inheritance: Allele-Cross + Egg-Moves + Traits + Hidden-Power
    const parentAGenome = a.genome ?? defaultGenome();
    const parentBGenome = b.genome ?? defaultGenome();
    child.genome = crossGenomes(parentAGenome, parentBGenome, seed, mutation.isMutation);
    // Quality-Tier-Inheritance
    child.qualityTier = inheritQualityTier(a.qualityTier, b.qualityTier);
    // Cooldown auf beide Eltern
    setCrossCooldown(a);
    setCrossCooldown(b);
    this.state.plants.push(child);
    this.state.coins -= COST;
    this.captureSpecies(child.speciesSlug);
    this.incrementAchievementCounter('crossings');
    if (mutation.isMutation) this.incrementAchievementCounter('mutations');
    this.state.energy = spendEnergy(this.state.energy ?? ENERGY_MAX, 'cross');
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
    newPlant.genome = defaultGenome();
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

  private _savePending = false;

  private scheduleAutoSave(): void {
    if (this._savePending) return;
    this._savePending = true;
    setTimeout(() => {
      this.save();
      this._savePending = false;
    }, 15_000);
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.state));
    this.scheduleAutoSave(); // B-019: Debounce — max 1 Save alle 15s im Tick-Loop
  }
}

export const gameStore = new GameStore();
export type { GameState };
