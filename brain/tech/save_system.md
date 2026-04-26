# Save-System

Single-Source-of-Truth fuer das LocalStorage-Save-Schema von Plantinvasion. Bei jeder Schema-Aenderung erweitern.

## Storage-Mechanismus
- LocalStorage-Key: `plantinvasion_save_v1` (Filename hat bewusst v1, internal `version`-Field steuert)
- Format: JSON-serialized
- Migration: in `src/state/storage.ts` -> `migrate(parsed)` schrittweise pro Versions-Sprung
- Zukunft: Cloud-Sync via Supabase ab Phase 2

## Schema-History

| Version | Datum | Sprint | Aenderung | Migration |
|---------|-------|--------|-----------|-----------|
| 1 | 2026-04-22 | S-01 | Initial: GameState mit `playerId`, `plants[]`, `coins`, `gems`, `createdAt` | - |
| 2 | 2026-04-23 | S-02 | `overworld` (Tile-Pos, Facing, Zone, lastSceneVisited) | Default-Position-Setup |
| 3 | 2026-04-24 | S-04 | `pokedex` (discovered, captured) | Backfill aus existing Plants |
| 4 | 2026-04-24 | S-05 | `inventory` (Record string -> count) | Default-Items: 3 basic-lure, 2 heal-tonic |
| 5 | 2026-04-25 | S-06 | `quests` (Record string -> 'pending'\|'active'\|'completed') | Empty Default |
| 6 | 2026-04-25 | S-08 | Growth-V0.2 Plant-Felder: `hydration`, `careScore`, `qualityTier`, `generation`, `lastBloomedAt`, `pendingHarvest`, `consecutiveDryHours`, `highestStageReached` | Backfill via `defaultGrowthFields()` plus Generation-Inferenz aus parentIds |

## Migration-Regeln
1. Niemals Versions-Number erhoehen ohne Migration-Funktion
2. Migration-Funktion ist append-only (alte Pfade nicht entfernen)
3. Migration laeuft schrittweise: v1 -> v3 geht ueber v2 implizit
4. Nach Migration validate gegen aktuelles Schema, bei Mismatch console.warn
5. Unbekannte Schema-Versions werden discardet, neuer Save-State wird erstellt

## Default-Werte zum Neustart
- `coins: 100`, `gems: 0`
- 1 Sunflower-Starter im Garden Slot (0,0)
- Inventory: `basic-lure: 3, heal-tonic: 2`
- Pokedex: empty
- Quests: empty
- Overworld: Wurzelheim Tile (14, 17) facing 'up'

## Plant-Struktur (Stand Schema v6)
```ts
interface Plant {
  id: string;                       // 'p_xxxxxxxx'
  speciesSlug: string;              // 'sunflower' etc.
  stats: { atk, def, spd };
  geneSeed: number;                 // RNG-Seed fuer reproduzierbare Generation
  parentAId?: string;               // bei Crossings
  parentBId?: string;               // bei Crossings
  isMutation: boolean;              // 1.4x Growth-Vigor
  nickname?: string;
  // Wachstum + XP
  level: number;                    // 1-100
  xp: number;                       // XP innerhalb des aktuellen Levels
  totalXp: number;                  // Gesamt-XP fuer Statistik
  // Lifecycle
  bornAt: number;                   // ms timestamp
  lastWateredAt: number;            // ms timestamp letzte Bewaesserung
  lastTickAt: number;               // ms timestamp fuer XP-Akkumulation
  // Growth-V0.2 (Schema v6+)
  hydration: number;                // 0-100, sinkt mit Zeit
  careScore: number;                // 0+, akkumuliert ueber Pflege-Aktionen
  qualityTier?: QualityTier;        // gesetzt sobald Adult-Stage erreicht
  generation: number;               // 0 = Wild/Starter, 1 = F1-Hybrid, 2+ = F2+
  lastBloomedAt?: number;           // ms timestamp letztes Bloom-Cycle-Reset
  pendingHarvest: boolean;          // true wenn Bloom-Output bereit zum Ernten
  consecutiveDryHours: number;      // Tracking fuer Stage-Down-Risk
  highestStageReached: GrowthStage; // fuer Stage-Up-Animation und Tier-Snapshot
  // UI
  gridX: number;
  gridY: number;
}
```

## Verwandte Files
- `src/state/storage.ts` - load, save, migrate, resetGame
- `src/state/gameState.ts` - GameStore mit get/save/notify
- `src/types/plant.ts` - Plant-Type-Definition
- `src/data/leveling.ts` - defaultGrowthFields fuer Migration-Backfill

## Bekannte Limits
- LocalStorage-Limit ca. 5-10 MB (browser-abhaengig)
- Bei 200 Pokedex-Eintraegen plus 12 Garden-Slots plus typischen Items bleibt das Save < 50 KB
- Cloud-Sync (Supabase) ist Phase 2 wenn LocalStorage zu klein wird oder Multi-Device gewuenscht

## Schema-History Update (2026-04-26)

| Version | Datum | Sprint | Aenderung | Migration |
|---------|-------|--------|-----------|-----------|
| 7 | 2026-04-25 | S-08 | Booster + Soil + Daily-Login + Market-Roster | gardenSlots default, lastDailyLoginAt 0 |
| 8 | 2026-04-25 | S-08 | Foraging V0.2 + Achievements V0.1 | forageTilesCooldown {}, achievements [] |
| 9 | 2026-04-25 | S-08 | Time-System (minute/day/season/year) | start at 06:00 spring day1 |
| 10 | 2026-04-25 | S-09 | Crossing V2 PlantGenome (Allele/EV/Egg-Moves/Traits) | Random-IV-Backfill 0..31 pro Allele |

## Migrations-Kette: ASCENDING Order ist load-bearing

**Bug-Fix 2026-04-26:** Vor diesem Commit waren die v6/v7/v8/v9-Steps in DESCENDING Order ohne Recursion. Ein Save mit `version: 6` wurde nur einmal gebumpt (auf 7), dann lief er an SAVE_SCHEMA_VERSION (10) vorbei und kam in den `console.warn('unknown save-version')` Fallback. Folge: jeder Spieler mit einem v6/v7/v8 Save haette beim Update auf v10 seinen kompletten Stand verloren.

Fix: Schritte sind jetzt ASCENDING geordnet. v6 -> v7 -> v8 -> v9 -> v10 lassen den Wert sequentiell durchlaufen, jedes if-Statement greift den just gebumpten Wert auf. Die rekursiven Steps (v1, v2, v3, v4, v5) funktionieren weiterhin via `return migrate(parsed)`.

**Test-Coverage:** `src/state/__tests__/storage.test.ts` deckt jeden Versions-Sprung v1 bis v10 ab plus saveGame/loadGame Round-Trip plus resetGame. 28 Tests gruen.

## Test-Coverage (Stand 2026-04-26)
Migrate-Funktion ist jetzt direkt unit-getestet. Jeder Versions-Sprung von v1 bis v10 hat eigene Tests, plus Round-Trip plus Edge-Cases (kaputtes JSON, unbekannte Version, leerer Storage).
