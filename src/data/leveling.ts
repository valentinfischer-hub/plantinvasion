import type { GrowthStage, Plant } from '../types/plant';

/**
 * Leveling-System V0.3
 * Stage-Trigger: 1/5/15/30/45 (Seed/Sprout/Juvenile/Adult/Blooming)
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
// Wasser-Mechanik
// =========================================================
export const WATER_COOLDOWN_MS = 15 * 60 * 1000;       // 15 Min
export const WATER_XP_REWARD = 5;
export const NEGLECT_THRESHOLD_MS = 8 * 60 * 60 * 1000; // 8 Stunden ohne Wasser = Vernachlaessigung
export const NEGLECT_XP_PENALTY_PER_HOUR = 10;

export function msSinceWatered(plant: Plant, now = Date.now()): number {
  return now - plant.lastWateredAt;
}

export function canBeWatered(plant: Plant, now = Date.now()): boolean {
  return msSinceWatered(plant, now) >= WATER_COOLDOWN_MS;
}

export function waterCooldownRemaining(plant: Plant, now = Date.now()): number {
  return Math.max(0, WATER_COOLDOWN_MS - msSinceWatered(plant, now));
}

export function isNeglected(plant: Plant, now = Date.now()): boolean {
  return msSinceWatered(plant, now) >= NEGLECT_THRESHOLD_MS;
}

// =========================================================
// XP-Gain pro Tick
// =========================================================
export const PASSIVE_XP_PER_SECOND = 2;

/**
 * Wendet vergangene Zeit auf eine Pflanze an: passive XP, Vernachlaessigung.
 * Gibt mutierte Pflanze zurueck (immutable update).
 */
export function tickPlant(plant: Plant, now = Date.now()): Plant {
  const dtMs = now - plant.lastTickAt;
  if (dtMs <= 0 || plant.level >= MAX_LEVEL) {
    return { ...plant, lastTickAt: now };
  }
  const dtSec = dtMs / 1000;
  let xpDelta = 0;

  if (isNeglected(plant, now)) {
    // Vernachlaessigt: -10 XP/h, abzueglich der Stunden seit Vernachlaessigung
    
    const lostXpThisTick = (NEGLECT_XP_PENALTY_PER_HOUR * (dtSec / 3600));
    xpDelta = -lostXpThisTick;
  } else {
    // Passiver Wachstums-XP-Gain
    xpDelta = PASSIVE_XP_PER_SECOND * dtSec;
  }

  return applyXp(plant, xpDelta, now);
}

/**
 * Addiere XP, propagiere Level-ups, clamp auf 0 und MAX_LEVEL.
 */
export function applyXp(plant: Plant, xpDelta: number, now = Date.now()): Plant {
  let level = plant.level;
  let xp = plant.xp + xpDelta;
  let totalXp = Math.max(0, plant.totalXp + xpDelta);

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
 * Wassergiessen: Wenn moeglich, gib XP und setze lastWateredAt zurueck.
 * Gibt {plant, success} zurueck. success=false wenn Cooldown noch laeuft.
 */
export function waterPlant(plant: Plant, now = Date.now()): { plant: Plant; success: boolean } {
  if (!canBeWatered(plant, now)) {
    return { plant, success: false };
  }
  const updated = applyXp(plant, WATER_XP_REWARD, now);
  return {
    plant: { ...updated, lastWateredAt: now },
    success: true
  };
}
