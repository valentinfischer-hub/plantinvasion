import type { GrowthStage, Plant, QualityTier, SoilTier } from '../types/plant';
import { getSpecies } from './species';
import {
  xpBoosterMultiplier,
  hasActiveSunLamp,
  hasActiveSprinkler,
  pruneExpired,
  SOIL_XP_MULTIPLIER,
  SOIL_HYDRATION_DECAY_FACTOR
} from './boosters';

/**
 * Leveling-System V0.4 (Growth V0.2)
 * Stage-Trigger: 1/5/15/30/45 (Seed/Sprout/Juvenile/Adult/Blooming)
 *
 * V0.2 erweitert um:
 * - Hydration-Skala (kontinuierlich) statt binaerem isNeglected
 * - Stage-, Biom-, Hybrid-, Tageszeit-Multiplikatoren
 * - Care-Score und Quality-Tier-Snapshot bei Adult
 * - Bloom-Cycle und Harvest-Loop
 * - Stage-Down-Risiko bei Vertrocknung
 */

export const MAX_LEVEL = 100;
export const STAGE_LEVEL_THRESHOLDS = [1, 5, 15, 30, 45] as const;

/** XP-Curve: quadratisch sanft. Level 1->2 = 10 XP, Level 99->100 = 100k XP. */
export function xpToNextLevel(currentLevel: number): number {
  return currentLevel * currentLevel * 10;
}

/** Total-XP von Level 1 bis zum Anfang des angegebenen Levels. */
export function totalXpToReachLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpToNextLevel(l);
  return total;
}

/** Welche Wachstumsstufe entspricht einem Level. */
export function stageForLevel(level: number): GrowthStage {
  let stage: GrowthStage = 0;
  for (let i = 0; i < STAGE_LEVEL_THRESHOLDS.length; i++) {
    if (level >= STAGE_LEVEL_THRESHOLDS[i]) stage = i as GrowthStage;
  }
  return stage;
}

/** Aktueller Wachstumsstufen-Name aus dem Level. */
export function stageOf(plant: Plant): GrowthStage {
  return stageForLevel(plant.level);
}

/** True wenn Pflanze adult oder blooming und damit kreuzungsreif. */
export function isCrossable(plant: Plant): boolean {
  return stageOf(plant) >= 3;
}

// =========================================================
// Wasser-Mechanik V0.2
// =========================================================
export const HYDRATION_MAX = 100;
export const HYDRATION_FULL_TO_DRY_HOURS = 12;
export const DEHYDRATION_PER_SEC = HYDRATION_MAX / (HYDRATION_FULL_TO_DRY_HOURS * 3600);
export const WATER_COOLDOWN_MS = 4 * 60 * 1000; // 4 Min, weniger spammy
export const WATER_XP_REWARD = 5;

export type HydrationStatus = 'saftig' | 'gut' | 'durstig' | 'trocken' | 'vertrocknet';

export function hydrationStatus(plant: Plant): HydrationStatus {
  const h = plant.hydration;
  if (h >= 80) return 'saftig';
  if (h >= 50) return 'gut';
  if (h >= 25) return 'durstig';
  if (h >= 5) return 'trocken';
  return 'vertrocknet';
}

export function hydrationMultiplier(plant: Plant): number {
  switch (hydrationStatus(plant)) {
    case 'saftig': return 1.25;
    case 'gut': return 1.0;
    case 'durstig': return 0.6;
    case 'trocken': return 0.2;
    case 'vertrocknet': return -0.1;
  }
}

export function msSinceWatered(plant: Plant, now = Date.now()): number {
  return now - plant.lastWateredAt;
}

export function canBeWatered(plant: Plant, now = Date.now()): boolean {
  // Cooldown plus Hydration darf nicht voll sein (Wassergiessen sinnlos bei 100)
  return msSinceWatered(plant, now) >= WATER_COOLDOWN_MS && plant.hydration < HYDRATION_MAX - 1;
}

export function waterCooldownRemaining(plant: Plant, now = Date.now()): number {
  return Math.max(0, WATER_COOLDOWN_MS - msSinceWatered(plant, now));
}

// Backward-compat: alte API erwarten viele Stellen noch
export const NEGLECT_THRESHOLD_MS = 8 * 60 * 60 * 1000;
export function isNeglected(plant: Plant): boolean {
  return plant.hydration < 25;
}

// =========================================================
// Multiplikatoren V0.2
// =========================================================
export const BASE_XP_PER_SEC = 2.0;

export function stageMultiplier(stage: GrowthStage): number {
  switch (stage) {
    case 0: return 1.5;
    case 1: return 1.2;
    case 2: return 1.0;
    case 3: return 0.8;
    case 4: return 0.5;
  }
}

export function biomeMatchMultiplier(speciesSlug: string, currentZone: string): number {
  const species = getSpecies(speciesSlug);
  if (!species) return 1.0;
  if (species.preferredBiomes?.includes(currentZone)) return 1.4;
  if (species.wrongBiomes?.includes(currentZone)) return 0.7;
  return 1.0;
}

export function hybridVigorMultiplier(plant: Plant): number {
  if (plant.isMutation) return 1.4;
  if (plant.generation === 1) return 1.25;
  if (plant.generation >= 2) return 1.1;
  return 1.0;
}

export function timeOfDayMultiplier(now = Date.now()): number {
  const hour = new Date(now).getHours();
  if (hour >= 6 && hour < 18) return 1.0;
  if (hour >= 18 && hour < 22) return 0.7;
  return 0.4;
}

export function totalXpMultiplier(plant: Plant, currentZone: string, now = Date.now()): number {
  return (
    stageMultiplier(stageOf(plant)) *
    Math.max(0, hydrationMultiplier(plant)) * // negativ wird in tickPlant separat behandelt
    biomeMatchMultiplier(plant.speciesSlug, currentZone) *
    hybridVigorMultiplier(plant) *
    timeOfDayMultiplier(now)
  );
}

// =========================================================
// Quality-Tier
// =========================================================
export const TIER_THRESHOLDS: Record<QualityTier, number> = {
  common: 0,
  fine: 30,
  quality: 80,
  premium: 150,
  pristine: 250
};

export function tierForCareScore(careScore: number): QualityTier {
  if (careScore >= TIER_THRESHOLDS.pristine) return 'pristine';
  if (careScore >= TIER_THRESHOLDS.premium) return 'premium';
  if (careScore >= TIER_THRESHOLDS.quality) return 'quality';
  if (careScore >= TIER_THRESHOLDS.fine) return 'fine';
  return 'common';
}

export const TIER_COIN_MULTIPLIER: Record<QualityTier, number> = {
  common: 1.0,
  fine: 1.4,
  quality: 1.8,
  premium: 2.5,
  pristine: 4.0
};

export const TIER_COLORS: Record<QualityTier, number> = {
  common: 0xdcdcdc,
  fine: 0x9be36e,
  quality: 0x5b8de8,
  premium: 0xb86ee3,
  pristine: 0xffd166
};

// =========================================================
// Bloom-Cycle (Harvest)
// =========================================================
export const BLOOM_CYCLE_MS = 30 * 60 * 1000; // 30 Min bis erstes Bloom-Output
export const REBLOOM_CYCLE_MS = 60 * 60 * 1000; // 1h Re-Bloom

export function isBlooming(plant: Plant): boolean {
  return stageOf(plant) === 4;
}

export function bloomProgress(plant: Plant, now = Date.now()): number {
  if (!isBlooming(plant)) return 0;
  if (plant.pendingHarvest) return 1;
  const start = plant.lastBloomedAt ?? plant.bornAt;
  const cycle = plant.lastBloomedAt ? REBLOOM_CYCLE_MS : BLOOM_CYCLE_MS;
  return Math.min(1, (now - start) / cycle);
}

export function isHarvestReady(plant: Plant, now = Date.now()): boolean {
  return isBlooming(plant) && (plant.pendingHarvest || bloomProgress(plant, now) >= 1);
}

export interface HarvestOutput {
  coins: number;
  seedSpeciesSlug?: string;
  pollenChance: boolean;
}

export function rollHarvest(plant: Plant): HarvestOutput {
  const tier = plant.qualityTier ?? 'common';
  const tierIndex = ['common', 'fine', 'quality', 'premium', 'pristine'].indexOf(tier);
  const baseCoins = (5 + tierIndex * 4) * TIER_COIN_MULTIPLIER[tier];
  const seedRoll = Math.random() < 0.5;
  const pollenRoll = tier === 'pristine' && Math.random() < 0.05;
  return {
    coins: Math.round(baseCoins),
    seedSpeciesSlug: seedRoll ? plant.speciesSlug : undefined,
    pollenChance: pollenRoll
  };
}

// =========================================================
// Tick: Pflanze pro Sekunde aktualisieren
// =========================================================

export interface TickContext {
  zone: string;
  now: number;
  soilTier?: SoilTier;
}

export function tickPlant(plant: Plant, ctxOrNow?: TickContext | number): Plant {
  const ctx: TickContext =
    typeof ctxOrNow === 'number'
      ? { zone: 'wurzelheim', now: ctxOrNow }
      : ctxOrNow ?? { zone: 'wurzelheim', now: Date.now() };
  const { now, zone } = ctx;
  const soilTier: SoilTier = ctx.soilTier ?? 'normal';

  const dtMs = now - plant.lastTickAt;
  if (dtMs <= 0) return { ...plant, lastTickAt: now };

  // Booster-Cleanup zuerst
  plant = pruneExpired(plant, now);

  const dtSec = dtMs / 1000;
  // Hydration sinkt - Soil-Tier kann Decay verlangsamen, Sprinkler haelt min 80
  const decayFactor = SOIL_HYDRATION_DECAY_FACTOR[soilTier];
  let hydration = Math.max(0, plant.hydration - DEHYDRATION_PER_SEC * dtSec * decayFactor);
  if (hasActiveSprinkler(plant, now)) {
    hydration = Math.max(hydration, 80);
  }
  // Tracking trockene Stunden
  const wasDry = plant.hydration < 5;
  let consecutiveDryHours = wasDry
    ? plant.consecutiveDryHours + dtSec / 3600
    : 0;

  // Pflanze ist max-Level: nichts ausser Hydration sinkt
  if (plant.level >= MAX_LEVEL) {
    return { ...plant, hydration, consecutiveDryHours, lastTickAt: now };
  }

  // XP-Delta berechnen
  const hydMult = hydrationMultiplier({ ...plant, hydration });
  const todMult = hasActiveSunLamp(plant, now) ? 1.0 : timeOfDayMultiplier(now);
  const boosterMult = xpBoosterMultiplier(plant, now);
  const soilMult = SOIL_XP_MULTIPLIER[soilTier];
  const xpPerSec = BASE_XP_PER_SEC *
    stageMultiplier(stageOf(plant)) *
    biomeMatchMultiplier(plant.speciesSlug, zone) *
    hybridVigorMultiplier(plant) *
    todMult *
    hydMult *
    boosterMult *
    soilMult;

  const xpDelta = xpPerSec * dtSec;

  // Care-Score: passive Akkumulation bei guter Hydration und Biom-Match
  let careDelta = 0;
  if (hydration >= 50) careDelta += 0.04 * dtSec;          // ~2.4/min in Top-Form
  if (biomeMatchMultiplier(plant.speciesSlug, zone) > 1) careDelta += 0.02 * dtSec;
  if (hydration < 5) careDelta -= 0.5 * dtSec;             // Strafe wenn vertrocknet

  // Stage-Down-Risiko bei langer Trockenheit
  let level = plant.level;
  if (consecutiveDryHours >= 24) {
    // 5% Roll pro Stunde, aber max 1x pro 2h via Sekundengranular
    const probPerSec = 0.05 / 3600;
    if (Math.random() < probPerSec * dtSec) {
      // Stage-Down: Level zurueck auf Anfang der vorherigen Stage
      const currStage = stageOf(plant);
      if (currStage > 0) {
        const prevThreshold = STAGE_LEVEL_THRESHOLDS[currStage - 1];
        level = Math.max(1, prevThreshold);
      }
    }
  }

  let updated = applyXp(
    { ...plant, level, hydration, consecutiveDryHours },
    xpDelta,
    now
  );

  updated = {
    ...updated,
    careScore: Math.max(0, updated.careScore + careDelta)
  };

  // Quality-Tier-Snapshot bei Erreichen Adult
  if (!updated.qualityTier && stageOf(updated) >= 3) {
    updated.qualityTier = tierForCareScore(updated.careScore);
  }

  // Stage-Tracking
  const newStage = stageOf(updated);
  if (newStage > updated.highestStageReached) {
    updated.highestStageReached = newStage;
  }

  // Bloom-Cycle: setze pendingHarvest
  if (isBlooming(updated) && !updated.pendingHarvest) {
    if (!updated.lastBloomedAt) {
      updated.lastBloomedAt = updated.bornAt;
    }
    if (bloomProgress(updated, now) >= 1) {
      updated.pendingHarvest = true;
    }
  }

  return updated;
}

/**
 * Addiere XP, propagiere Level-ups, clamp auf 0 und MAX_LEVEL.
 */
export function applyXp(plant: Plant, xpDelta: number, now = Date.now()): Plant {
  let level = plant.level;
  let xp = plant.xp + xpDelta;
  let totalXp = Math.max(0, plant.totalXp + Math.max(0, xpDelta));

  // Level-up
  while (level < MAX_LEVEL && xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level += 1;
  }
  // Level-down (bei Vernachlaessigung)
  while (level > 1 && xp < 0) {
    level -= 1;
    xp += xpToNextLevel(level);
  }
  if (xp < 0) xp = 0;
  if (level >= MAX_LEVEL) {
    level = MAX_LEVEL;
    xp = 0;
  }

  return { ...plant, level, xp, totalXp, lastTickAt: now };
}

/**
 * Wassergiessen: Hydration auf 100, Cooldown reset, +5 XP, +1 careScore.
 */
export function waterPlant(plant: Plant, now = Date.now()): { plant: Plant; success: boolean } {
  if (!canBeWatered(plant, now)) {
    return { plant, success: false };
  }
  const updated = applyXp(plant, WATER_XP_REWARD, now);
  // Care-Bonus bei Pflege wenn Pflanze noch saftig oder gut: kein Tropfen verschwendet, Streak.
  const wasWell = plant.hydration >= 50;
  const careGain = wasWell ? 2 : 1;
  return {
    plant: {
      ...updated,
      hydration: HYDRATION_MAX,
      lastWateredAt: now,
      careScore: updated.careScore + careGain,
      consecutiveDryHours: 0
    },
    success: true
  };
}

/**
 * Ernte einer Blooming-Pflanze. Setzt pendingHarvest=false, reset bloom-Cycle.
 * Gibt {plant, output} zurueck. Wenn nicht ready, output={coins:0, ...}.
 */
export function harvestPlant(plant: Plant, now = Date.now()): { plant: Plant; output: HarvestOutput } {
  if (!isHarvestReady(plant, now)) {
    return { plant, output: { coins: 0, pollenChance: false } };
  }
  const output = rollHarvest(plant);
  const tier = plant.qualityTier ?? 'common';
  const tierIndex = ['common', 'fine', 'quality', 'premium', 'pristine'].indexOf(tier);
  const careGain = 3 + tierIndex; // hoehere Tiers = mehr Care-Akku pro Bloom
  return {
    plant: {
      ...plant,
      pendingHarvest: false,
      lastBloomedAt: now,
      careScore: plant.careScore + careGain
    },
    output
  };
}

/**
 * Defaults fuer neue Plant-Felder (genutzt bei Migration und neuer Plant-Erstellung).
 */
export function defaultGrowthFields(): Pick<
  Plant,
  | 'hydration'
  | 'careScore'
  | 'generation'
  | 'pendingHarvest'
  | 'consecutiveDryHours'
  | 'highestStageReached'
  | 'activeBoosters'
> {
  return {
    hydration: HYDRATION_MAX,
    careScore: 0,
    generation: 0,
    pendingHarvest: false,
    consecutiveDryHours: 0,
    highestStageReached: 0,
    activeBoosters: []
  };
}
