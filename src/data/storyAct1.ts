import type { Plant } from '../types/plant';
import { stageOf } from './leveling';

/**
 * Tier-4 Sprint-S-09 Story-Akt-1 V0.1 ("Wurzelheim erwacht")
 *
 * Pure-Function-Evaluator. UI/OverworldScene ruft evaluateAct1Progress()
 * im Tick-Hook und triggert advanceAct(1) wenn Status 'completed'.
 */

export const ACT1_QUEST_FLAGS = {
  SEED_PLANTED: 'quest_seed_planted',
  FIRST_WATER: 'quest_first_water',
  REACHED_ADULT: 'quest_reached_adult'
} as const;

export type Act1Status = 'pending' | 'in_progress' | 'completed';

/**
 * Bewertet Akt-1-Fortschritt aus Story-Flags plus Plant-Liste.
 * - 'pending': keine Sunflower in Plants.
 * - 'in_progress': Sunflower vorhanden aber noch nicht in Adult-Stage.
 * - 'completed': Sunflower in Adult-Stage (Stage >= 3) plus alle 3 Flags true.
 */
export function evaluateAct1Progress(
  flags: Record<string, boolean>,
  plants: Plant[]
): Act1Status {
  const sunflowers = plants.filter((p) => p.speciesSlug === 'sunflower');
  if (sunflowers.length === 0) return 'pending';

  const hasAdult = sunflowers.some((p) => stageOf(p) >= 3);
  const allFlagsSet =
    flags[ACT1_QUEST_FLAGS.SEED_PLANTED] === true &&
    flags[ACT1_QUEST_FLAGS.FIRST_WATER] === true &&
    flags[ACT1_QUEST_FLAGS.REACHED_ADULT] === true;

  if (hasAdult && allFlagsSet) return 'completed';
  return 'in_progress';
}

/**
 * Auto-Set fuer ACT1 Flags basierend auf Plant-State.
 * Liefert ein neues Flags-Object (immutable).
 */
export function autoSetAct1Flags(
  flags: Record<string, boolean>,
  plants: Plant[]
): Record<string, boolean> {
  const updated = { ...flags };
  const sunflowers = plants.filter((p) => p.speciesSlug === 'sunflower');
  if (sunflowers.length > 0) {
    updated[ACT1_QUEST_FLAGS.SEED_PLANTED] = true;
  }
  if (sunflowers.some((p) => p.lastWateredAt > p.bornAt)) {
    updated[ACT1_QUEST_FLAGS.FIRST_WATER] = true;
  }
  if (sunflowers.some((p) => stageOf(p) >= 3)) {
    updated[ACT1_QUEST_FLAGS.REACHED_ADULT] = true;
  }
  return updated;
}
