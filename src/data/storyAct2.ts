/**
 * Tier-4 Sprint-S-10 Story-Akt-2 V0.1 ("Verdanto erkundet")
 *
 * Pure-Function-Evaluator. OverworldScene ruft evaluateAct2Progress()
 * im Tick-Hook und triggert advanceAct(2) wenn Status 'completed'.
 */

export const ACT2_FLAGS = {
  VERDANTO_EXPLORED: 'verdanto_explored',
  BROMELIEN_COLLECTED: 'bromelien_collected_3', // boolean: >= 3 Bromeliad-Samen im Inventar
  VERDANTO_ERKUNDET: 'verdanto_erkundet',        // Achievement-Flag
} as const;

export const BROMELIAD_SEED_SLUG = 'seed-bromelia' as const;
export const BROMELIAD_REQUIRED_COUNT = 3 as const;

export type Act2Status = 'pending' | 'in_progress' | 'completed';

/**
 * Bewertet Akt-2-Fortschritt aus Story-Flags.
 * - 'pending': Verdanto noch nicht besucht.
 * - 'in_progress': Verdanto besucht aber < 3 Bromeliad-Samen gesammelt.
 * - 'completed': Verdanto erkundet UND >= 3 Bromeliad-Samen im Inventar.
 */
export function evaluateAct2Progress(
  flags: Record<string, boolean>
): Act2Status {
  const verdantoExplored = flags[ACT2_FLAGS.VERDANTO_EXPLORED] === true;
  const bromelienCollected = flags[ACT2_FLAGS.BROMELIEN_COLLECTED] === true;

  if (!verdantoExplored) return 'pending';
  if (!bromelienCollected) return 'in_progress';
  return 'completed';
}

/**
 * Auto-Set für ACT2 Flags basierend auf visitedZones + Inventar.
 * Liefert ein neues Flags-Object (immutable).
 *
 * @param flags       Aktuelle Story-Flags aus gameStore.
 * @param visitedZones Liste der besuchten Zonen (aus achievementCounters).
 * @param inventory   Aktuelles Inventar (slug -> count) aus gameStore.
 */
export function autoSetAct2Flags(
  flags: Record<string, boolean>,
  visitedZones: string[],
  inventory: Record<string, number>
): Record<string, boolean> {
  const updated = { ...flags };

  // Verdanto-Besuch-Check
  if (visitedZones.includes('verdanto')) {
    updated[ACT2_FLAGS.VERDANTO_EXPLORED] = true;

    // Achievement-Flag: wird nur einmal gesetzt
    if (!updated[ACT2_FLAGS.VERDANTO_ERKUNDET]) {
      updated[ACT2_FLAGS.VERDANTO_ERKUNDET] = true;
    }
  }

  // Bromeliad-Samen-Count
  const bromelienCount = inventory[BROMELIAD_SEED_SLUG] ?? 0;
  if (bromelienCount >= BROMELIAD_REQUIRED_COUNT) {
    updated[ACT2_FLAGS.BROMELIEN_COLLECTED] = true;
  }

  return updated;
}
