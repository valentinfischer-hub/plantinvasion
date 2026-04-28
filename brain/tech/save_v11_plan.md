# Save-Schema V11 Migrationsplan

**Status:** PROPOSED, noch nicht aktiv. SAVE_SCHEMA_VERSION bleibt aktuell 10.

## Auslöser fuer V11-Bump
V11 wird benoetigt sobald eines der folgenden Features in einer Save-Datei landet:

1. **NPC-Walking-Persistenz:** NPCs sollen ihre lastMoveAt + tileX/Y persistieren ueber Save-Reload (aktuell V0.1: NPCs starten bei jedem Reload neu).
2. **Story-Akt-1 Auto-Flags:** ACT1_QUEST_FLAGS in story.flags persistent. Aktuell pure-function, keine State-Dependency.
3. **Achievement-Counter-Erweiterung:** Tracking von "geweckte NPCs", "abgeschlossene Akte".

## Migration v10 -> v11

```ts
if (parsed.version === 10) {
  parsed.version = 11;
  // Default: leeres npcMovementStates dict
  if (!parsed.npcMovementStates) parsed.npcMovementStates = {};
  // Default: story.flags-Pre-Set (Edge: alte Saves haben kein story-Object)
  if (!parsed.story) parsed.story = { flags: {}, currentAct: 0, metNpcs: [], diaryEntries: [] };
  // achievementCounters um neue Felder erweitern (immutable spread)
  parsed.achievementCounters = {
    crossings: 0, mutations: 0, visitedZones: [],
    awakenedNpcs: 0, completedActs: 0,
    ...parsed.achievementCounters
  };
  debugLog('[storage] migrated save v10 -> v11 (npc-movement plus story-akt-tracking)');
  return migrate(parsed);
}
```

## GameState-Type-Erweiterung

```ts
export interface GameState {
  // ... bestehende Felder
  // V11
  npcMovementStates?: Record<string, NpcMovementState>;
  // achievementCounters bereits in V10 erweiterbar via require, kein Type-Change
}
```

## Test-Pflicht

- 1 Vitest fuer v10 -> v11 Roundtrip mit npcMovementStates Default leer.
- 1 Vitest fuer v10 -> v11 Roundtrip mit existing story-Object preserved.
- 1 Vitest fuer achievementCounters Backfill (alte Saves bekommen awakenedNpcs/completedActs).

## Trigger-Punkt im Code

V11-Bump kommt erst sobald **eines** dieser Features eine PR auf main pusht:
- src/scenes/OverworldScene.ts speichert npcMovementStates beim Tick.
- src/data/storyAct1.ts ruft gameStore.setFlag bei Auto-Set.
- src/state/gameState.ts addiert awakenedNpcs/completedActs Counter.

Bis dahin bleibt V10 stabil.

**Provenienz:** Tech-Code-Self-Plan 2026-04-27 als Vorbereitung. Producer kann adjusten.
