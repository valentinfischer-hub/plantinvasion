import type { ActiveBooster, Plant, SoilTier } from '../types/plant';
import { getItem } from './items';

/**
 * Booster-Engine: aktive Booster auf Pflanzen, Soil-Tier-Multipliers, etc.
 */

export function isBoosterExpired(b: ActiveBooster, now: number): boolean {
  return now - b.startedAt >= b.durationMs;
}

export function pruneExpired(plant: Plant, now = Date.now()): Plant {
  const active = plant.activeBoosters.filter((b) => !isBoosterExpired(b, now));
  if (active.length === plant.activeBoosters.length) return plant;
  return { ...plant, activeBoosters: active };
}

export function xpBoosterMultiplier(plant: Plant, now = Date.now()): number {
  let mult = 1.0;
  for (const b of plant.activeBoosters) {
    if (isBoosterExpired(b, now)) continue;
    if (b.type === 'xp' && typeof b.multiplier === 'number') {
      mult *= b.multiplier;
    }
  }
  return mult;
}

export function hasActiveSunLamp(plant: Plant, now = Date.now()): boolean {
  return plant.activeBoosters.some((b) => b.type === 'sun-lamp' && !isBoosterExpired(b, now));
}

export function hasActiveSprinkler(plant: Plant, now = Date.now()): boolean {
  return plant.activeBoosters.some((b) => b.type === 'sprinkler' && !isBoosterExpired(b, now));
}

export function listActiveBoosters(plant: Plant, now = Date.now()): ActiveBooster[] {
  return plant.activeBoosters.filter((b) => !isBoosterExpired(b, now));
}

export function boosterRemainingMs(b: ActiveBooster, now = Date.now()): number {
  return Math.max(0, b.durationMs - (now - b.startedAt));
}

// =========================================================
// Soil-Tier
// =========================================================

export const SOIL_XP_MULTIPLIER: Record<SoilTier, number> = {
  normal: 1.0,
  bronze: 1.1,
  silver: 1.2,
  gold: 1.3
};

export const SOIL_HYDRATION_DECAY_FACTOR: Record<SoilTier, number> = {
  normal: 1.0,
  bronze: 1.0,
  silver: 1.0,
  gold: 0.8 // 20% slower
};

export const SOIL_MUTATION_BONUS: Record<SoilTier, number> = {
  normal: 0.0,
  bronze: 0.0,
  silver: 0.05,
  gold: 0.10
};

export const SOIL_COSTS: Record<SoilTier, number> = {
  normal: 0,
  bronze: 100,
  silver: 300,
  gold: 800
};

export function nextSoilTier(current: SoilTier): SoilTier | null {
  const order: SoilTier[] = ['normal', 'bronze', 'silver', 'gold'];
  const idx = order.indexOf(current);
  if (idx < 0 || idx >= order.length - 1) return null;
  return order[idx + 1];
}

// =========================================================
// Item-Anwendung
// =========================================================

export interface ApplyResult {
  plant: Plant;
  ok: boolean;
  reason?: string;
  message?: string;
}

/**
 * Wendet ein Booster-Item auf eine Pflanze an.
 * Rueckgabe: aktualisierte Pflanze und ein Resultat-Flag.
 */
export function applyItemToPlant(plant: Plant, itemSlug: string, now = Date.now()): ApplyResult {
  const item = getItem(itemSlug);
  if (!item) return { plant, ok: false, reason: 'Unbekanntes Item' };

  const updated = pruneExpired(plant, now);

  switch (item.kind) {
    case 'fertilizer': {
      // XP-Booster, ueberschreibt existing xp-Booster
      const filtered = updated.activeBoosters.filter((b) => b.type !== 'xp');
      const newBooster: ActiveBooster = {
        type: 'xp',
        startedAt: now,
        durationMs: item.durationMs ?? 30 * 60 * 1000,
        multiplier: item.multiplier ?? 1.25,
        fromItem: itemSlug
      };
      return {
        plant: { ...updated, activeBoosters: [...filtered, newBooster] },
        ok: true,
        message: `${item.name} aktiviert: ${newBooster.multiplier}x XP fuer ${Math.round(newBooster.durationMs / 60000)} min`
      };
    }
    case 'care-pollen': {
      return {
        plant: { ...updated, careScore: updated.careScore + 50 },
        ok: true,
        message: `${item.name}: +50 Care`
      };
    }
    case 'tier-pollen': {
      // 25% Chance, Tier um 1 Stufe heben (oder noch nicht zugewiesen: addiere Care zum Tier-Push)
      const order: NonNullable<Plant['qualityTier']>[] = ['common', 'fine', 'quality', 'premium', 'pristine'];
      const roll = Math.random();
      if (roll > 0.25) {
        return { plant: updated, ok: true, message: `${item.name}: kein Effekt diesmal` };
      }
      if (updated.qualityTier) {
        const idx = order.indexOf(updated.qualityTier);
        if (idx < order.length - 1) {
          return {
            plant: { ...updated, qualityTier: order[idx + 1] },
            ok: true,
            message: `${item.name}: Tier auf ${order[idx + 1]} gehoben!`
          };
        }
        return { plant: updated, ok: true, message: `${item.name}: bereits Pristine` };
      }
      // Pre-Adult: +75 careScore (massive Stufenpush)
      return {
        plant: { ...updated, careScore: updated.careScore + 75 },
        ok: true,
        message: `${item.name}: +75 Care fuer Tier-Push`
      };
    }
    case 'sun-lamp': {
      const filtered = updated.activeBoosters.filter((b) => b.type !== 'sun-lamp');
      const newBooster: ActiveBooster = {
        type: 'sun-lamp',
        startedAt: now,
        durationMs: item.durationMs ?? 8 * 60 * 60 * 1000,
        fromItem: itemSlug
      };
      return {
        plant: { ...updated, activeBoosters: [...filtered, newBooster] },
        ok: true,
        message: `${item.name}: Tag-Modus aktiv fuer ${Math.round(newBooster.durationMs / 3600000)}h`
      };
    }
    case 'sprinkler': {
      const filtered = updated.activeBoosters.filter((b) => b.type !== 'sprinkler');
      const newBooster: ActiveBooster = {
        type: 'sprinkler',
        startedAt: now,
        durationMs: item.durationMs ?? 24 * 60 * 60 * 1000,
        fromItem: itemSlug
      };
      return {
        plant: { ...updated, activeBoosters: [...filtered, newBooster], hydration: Math.max(updated.hydration, 80) },
        ok: true,
        message: `${item.name}: Auto-Wasser fuer ${Math.round(newBooster.durationMs / 3600000)}h`
      };
    }
    case 'compost': {
      // Legacy compost-bag: 1.2x for 30 min
      const filtered = updated.activeBoosters.filter((b) => b.type !== 'xp');
      const newBooster: ActiveBooster = {
        type: 'xp',
        startedAt: now,
        durationMs: 30 * 60 * 1000,
        multiplier: 1.2,
        fromItem: itemSlug
      };
      return {
        plant: { ...updated, activeBoosters: [...filtered, newBooster] },
        ok: true,
        message: `${item.name}: 1.2x XP fuer 30 min`
      };
    }
    default:
      return { plant: updated, ok: false, reason: `${item.name} kann nicht auf Pflanzen angewendet werden` };
  }
}
