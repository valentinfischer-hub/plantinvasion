/**
 * B4-R8: NPC-Dialog-History und Memory-System.
 * Dialog-History: letzte 5 Dialoge pro NPC persistent im SaveFile.
 * NPC-Memory: Flag-basierte Dialog-Varianten (2-3 pro NPC).
 * NPC-Schedule: Tageszeit-basierte Wander-Ziel-Tiles.
 */

export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';

export interface NpcScheduleEntry {
  time: TimeOfDay;
  tileX: number;
  tileY: number;
}

/** NPC-Schedule: Position je Tageszeit */
export const NPC_SCHEDULES: Record<string, NpcScheduleEntry[]> = {
  iris: [
    { time: 'morning', tileX: 14, tileY: 12 },
    { time: 'day',     tileX: 12, tileY: 8  },
    { time: 'evening', tileX: 16, tileY: 14 },
    { time: 'night',   tileX: 14, tileY: 16 },
  ],
  tilda: [
    { time: 'morning', tileX: 8,  tileY: 10 },
    { time: 'day',     tileX: 14, tileY: 6  },
    { time: 'evening', tileX: 10, tileY: 14 },
    { time: 'night',   tileX: 8,  tileY: 16 },
  ],
  old_herbalist: [
    { time: 'morning', tileX: 6,  tileY: 6  },
    { time: 'day',     tileX: 18, tileY: 12 },
    { time: 'evening', tileX: 12, tileY: 16 },
    { time: 'night',   tileX: 6,  tileY: 8  },
  ],
  market_npc: [
    { time: 'morning', tileX: 20, tileY: 8  },
    { time: 'day',     tileX: 20, tileY: 8  }, // bleibt am Markt
    { time: 'evening', tileX: 20, tileY: 10 },
    { time: 'night',   tileX: 20, tileY: 12 },
  ],
};

/** Gibt das Wander-Ziel fuer einen NPC zur aktuellen Tageszeit zurueck. */
export function getNpcScheduleTarget(npcId: string, timeOfDay: TimeOfDay): { tileX: number; tileY: number } | undefined {
  const schedule = NPC_SCHEDULES[npcId];
  if (!schedule) return undefined;
  const entry = schedule.find((s) => s.time === timeOfDay);
  return entry ? { tileX: entry.tileX, tileY: entry.tileY } : undefined;
}

/** NPC-Memory: Flag-basierte Dialog-Varianten */
export interface NpcMemoryLine {
  condition: (flags: Record<string, boolean>) => boolean;
  line: string;
}

export const NPC_MEMORY_DIALOGS: Record<string, NpcMemoryLine[]> = {
  iris: [
    {
      condition: (f) => f['quest_1_completed'] === true,
      line: 'Du hast mir letzte Woche wirklich geholfen! Die Pflanzen bluehen praechtiger denn je.'
    },
    {
      condition: (f) => (f['crossings'] as unknown as number) >= 3,
      line: 'Ich hoere, du experimentierst viel mit Kreuzungen. Beeindruckend!'
    },
    {
      condition: () => true, // Fallback
      line: 'Schoen, dich wieder zu sehen! Wie laeuft es im Garten?'
    }
  ],
  tilda: [
    {
      condition: (f) => f['met_verodynicus'] === true,
      line: 'Du hast Verodynicus getroffen? Sei bitte vorsichtig. Er ist nicht das, was er scheint.'
    },
    {
      condition: (f) => f['quest_3_started'] === true,
      line: 'Ich weiss, was du vorhast. Bring mir das Kristall-Samen-Fragment aus dem Frostkamm.'
    },
    {
      condition: () => true,
      line: 'Hallo! Hast du heute neue Pflanzen entdeckt?'
    }
  ],
};

/** Gibt den passenden Memory-Dialog fuer einen NPC basierend auf Story-Flags zurueck. */
export function getNpcMemoryDialog(npcId: string, storyFlags: Record<string, boolean>): string | undefined {
  const lines = NPC_MEMORY_DIALOGS[npcId];
  if (!lines) return undefined;
  const matched = lines.find((l) => l.condition(storyFlags));
  return matched?.line;
}

// =========================================================
// Dialog-History (wird im SaveFile gespeichert)
// =========================================================

/** Maximal 5 Dialoge pro NPC in der History */
const MAX_DIALOG_HISTORY = 5;

export function addToDialogHistory(
  history: Record<string, string[]>,
  npcId: string,
  line: string
): Record<string, string[]> {
  const updated = { ...history };
  if (!updated[npcId]) updated[npcId] = [];
  // Prepend + trim
  updated[npcId] = [line, ...updated[npcId]].slice(0, MAX_DIALOG_HISTORY);
  return updated;
}

export function getDialogHistory(history: Record<string, string[]>, npcId: string): string[] {
  return history[npcId] ?? [];
}
