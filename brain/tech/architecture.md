# Plantinvasion Architektur (V1.3, Stand 2026-04-29)

Single-Source-of-Truth fuer Code-Layout, Modul-Grenzen, Daten-Fluss und Engine-Choices. Bei jeder strukturellen Aenderung erweitern.

## Stack

- **Engine:** Phaser 3.90 (Web-First, Capacitor-Port spaeter, D-010)
- **Sprache:** TypeScript 5.6, strict, ohne `any`
- **Build:** Vite 5 (esbuild + rollup)
- **Test:** Vitest 2 (node-environment, V8-Coverage), Ziel 90 Prozent fuer Genetik
- **Hosting:** Netlify (Preview + Prod), Codemagic (CI fuer Mobile-Port)
- **Backend (geplant):** Supabase (Postgres + Auth + Realtime), Multiplayer hinter Feature-Flag
- **Persistenz lokal:** LocalStorage Key `plantinvasion_save_v1` mit `version`-Field intern (siehe `save_system.md`)

## Modul-Layout

```
src/
  main.ts                   Phaser-Game-Bootstrap, registriert alle Scenes
  types/plant.ts            Plant, PlantGenome, GardenSlotMeta, GrowthStage, QualityTier
  state/
    storage.ts              load, save, migrate, resetGame, GameState-Schema
    gameState.ts            GameStore singleton (get/save/notify/tick)
  data/                     Reine Daten + Genetik-Logik (kein Phaser-Coupling)
    genetics.ts             mulberry32, clampStat, rollStarterStats, crossStats
    breedingV2.ts           defaultGenome, crossGenomes, canCross, inheritQualityTier
    leveling.ts             XP, Stages, Hydration, Tier, Multiplikatoren
    boosters.ts             Booster-Items, Soil-Tier-Effekte
    species.ts              Plant-Species-Katalog
    moves.ts, encounters.ts, foraging.ts, quests.ts, achievements.ts ...
  ui/
    Toast.ts                Tier-3 zentraler Toast-Helper (5 ToastTypes, konsistenter Style)
    uiTheme.ts              Tier-3 Theme-Konstanten (Modal/Toast/Tile-Colors, FONT_FAMILY) plus drawModalBox-Helper
    PauseOverlay.ts, MiniMap.ts, DialogBox.ts, TimeOverlay.ts, ...
    __tests__/              Vitest fuer Toast.ts (16 Tests), uiTheme.ts (14 Tests)
    maps/<biome>.ts         Tile-Daten, Encounter-Tabellen pro Zone
    __tests__/              Vitest-Suiten (genetics, breedingV2)
  systems/
    BattleEngine.ts         Auto-Battle-Loop, Item-Use, Damage-Formeln
  scenes/
    BootScene, MenuScene, OverworldScene, GardenScene, BattleScene, ...
  ui/
    PauseOverlay, DialogBox, MiniMap, TutorialOverlay, TouchControls, ...
  entities/
    PlayerController, NPC
  audio/sfxGenerator.ts     Synth-SFX (kein File-Asset)
  i18n/
    index.ts                t(key, vars?) Funktion, Locale-Detection, Fallback-Chain DE->key
    de/common.json          DE Gemeinsame Keys
    de/ui.json              DE UI-Keys (73 Keys, inkl. garden.* Phase 2)
    de/plants.json          DE Pflanzen-Namen
    de/quests.json          DE Quest-Texte
    en/common.json          EN Gemeinsame Keys
    en/ui.json              EN UI-Keys (73 Keys)
    en/plants.json          EN Pflanzen-Namen
    en/quests.json          EN Quest-Texte
  assets/                   Sprites + Procedural-Generators
  utils/
    constants.ts            TILE_SIZE, GRID_COLS, etc.
    featureFlags.ts         MP_ENABLED, DEBUG_OVERLAY (build-time-baked Vite-Env)
    gameTime.ts             now() Wrapper mit injizierbarem Provider (Test-friendly)
    __tests__/              featureFlags.test.ts, gameTime.test.ts
  vite-env.d.ts             ImportMetaEnv-Typing fuer alle VITE_*-Vars
```

## Daten-Fluss

```
User-Input                                  RNG-Seed (deterministisch)
   |                                              |
   v                                              v
Scene.input -> GameStore.action -> data/* (pure) -> mutate GameState
                                                        |
                                                        v
                                                 storage.save()
                                                        |
                                                        v
                                          GameStore.notify -> Scene.render
```

**Wichtig:** Alle Genetik-Berechnungen (crossGenomes, defaultGenome, calcHiddenPower) sind reine Funktionen mit explicit-Seed. Damit reproduzierbar, server-validierbar (Phase 2 Multiplayer), Trade-Code-faehig.

## Heilige Code-Pfade (kein Refactoring ohne 100 Prozent Test-Coverage davor)

1. **Bestaeubungs-Sequenz:** `GardenScene.onCrossClick -> canCross -> crossGenomes -> setCrossCooldown`
2. **Genom-Mix:** `breedingV2.crossGenomes` (Mendel-Allele + EV + Egg-Moves + Traits + Hidden-Power)
3. **Hybrid-Reveal:** `data/hybridRecipes.ts` matchen + `GardenScene.revealHybrid`
4. **Save-Migration:** `state/storage.ts` -> `migrate(parsed)` Schritt-fuer-Schritt

## Save-System

Save-Schema-Version: **v10** (Stand 2026-04-25, Crossing V2 mit Genome-Field).
Migrationen v1 bis v10 in `state/storage.ts::migrate`. Details siehe `brain/tech/save_system.md`.

## Performance-Budget

| Metrik | Budget | Aktuell (2026-04-26) | Status |
|---|---|---|---|
| JS-Bundle (minified, total) | < 5 MB | 1.72 MB (App 242 KB + Phaser 1.48 MB) | OK |
| JS-Bundle (gzip, total) | < 1 MB | ~2 KB (Netlify Gzip-Cache) | OK |
| Bundle-Splitting | Phaser separat | aktiv via manualChunks | OK |
| FPS (locked) | 60 | 60 (Phaser default) | OK |
| Coverage Genetik | 90 Prozent | 100 Prozent breedingV2, 100 Prozent Lines genetics, 91.7 Prozent leveling | OK |
| Coverage Save-System | 85 Prozent | 98.5 Prozent storage.ts | OK |
| Coverage gameTime | 100 Prozent | 100 Prozent | OK |
| TypeScript any-Anzahl | 0 (in neuem Code) | 0 | OK |
| ESLint-Warnings | reduzierend | **0** | OK |

## Multiplayer-Foundation (Sprint S-11+)

- **Backend:** Supabase. Migrationen in `supabase/migrations/`.
- **Feature-Flag:** alle Multiplayer-Code-Pfade hinter `MP_ENABLED` aus `src/utils/featureFlags.ts` (liest `VITE_MP_ENABLED`). Default false. Build-time-baked, nicht via DevTools manipulierbar.
- **Trade-Codes:** Genome ist deterministisch via Allele + Seed. Trade-Code = Base64(JSON(genome)). Server verifiziert Allele im 0-31 Range, EV im erlaubten Range, Hidden-Power-Konsistenz.
- **Anti-Cheat:** Server-seitiger `crossGenomes`-Replay mit gleichem Seed. Bei Mismatch -> reject.

## Coding-Standards

1. **Keine `any`:** TS-strict ist hard requirement. Bei Phaser-API-Edge-Cases lieber `Phaser.GameObjects.GameObject` als `any`.
2. **Console-Zero-Tolerance:** kein `console.log` im Production-Pfad. Debug-Logs hinter `if (DEBUG)`.
3. **Reine Funktionen in `data/`:** kein Phaser-Coupling, keine Side-Effects ausser RNG-State.
4. **Save-Schema-Bump:** bei jeder Plant- oder GameState-Aenderung Version + Migration + Test.
5. **Heilige-Pfad-Regel:** Refactoring nur mit 100 Prozent Test-Coverage vorher.
6. **Conventional Commits:** `feat:`, `fix:`, `refactor:`, `test:`, `chore:`, optional Sprint-Tag.

## Library-Choices (Stand 2026-04-26)

| Lib | Version | Zweck | Kosten |
|---|---|---|---|
| phaser | 3.90 | Game-Engine | 0 |
| typescript | 5.6 | Compiler | 0 |
| vite | 5.4 | Build/Dev | 0 |
| vitest | 2.1 | Tests | 0 |
| @vitest/coverage-v8 | 2.1 | Coverage | 0 |
| eslint | 9.39 | Lint (Flat Config) | 0 |
| typescript-eslint | 8.59 | TS-Lint-Rules | 0 |

Producer-Release-Decision noetig bei: Engine-Wechsel, Backend-Wahl, Library > 100 USD/Jahr.

## Bekannte Gaps (Stand 2026-04-26)

- **ESLint-Bestand 0 Warnings.** 0 Errors. Ziel erreicht (Stand 2026-04-29).
- **i18n Phase 2 teilweise offen.** GardenScene Phase 2 done (7 Keys). BattleScene, OverworldScene Sign-Dialogs pending (EN erst Open-Beta, kein Alpha-Blocker).
- **leveling.ts nutzt noch direkte `Date.now()`-Defaults.** gameTime-Wrapper existiert seit 16:00, Migration ist Folge-Run.
- **Multiplayer-Code noch nicht aktiv.** Feature-Flag steht (`MP_ENABLED`), Supabase-Client-Init folgt.
- **Stage-Down-Catch-Up bei Tab-Inaktivitaet fehlt.** Pflanzen entgehen Stage-Down-Roll wenn Tab geschlossen.
- **Hybrid-Reveal ohne direkte Tests.** Vor Refactor abdecken.

## Aenderungs-Log

- **2026-04-26 16:00:** Bundle-Splitting via manualChunks aktiv (App 242 KB / Phaser 1.48 MB getrennt). storage.ts in Coverage-Threshold (85 Prozent, erreicht 98.5 Prozent). Neu: `src/utils/featureFlags.ts` mit `MP_ENABLED`/`DEBUG_OVERLAY` als build-time-baked Konstanten, `src/utils/gameTime.ts` mit injizierbarem Time-Provider (100 Prozent Coverage), `src/vite-env.d.ts` mit ImportMetaEnv-Typing, `.env.example` als Doku. 21 neue Tests, 221 gesamt.
- **2026-04-26 12:00:** 124 leveling.ts-Tests + 28 storage.ts-Migrationstests (200 gesamt). Bug-Fix in storage.ts::migrate: Versions-Steps von DESCENDING auf ASCENDING umgestellt, sonst discarded migrate() v6/v7/v8 Saves. Coverage von leveling.ts 91.7 Prozent.
- **2026-04-26:** Architektur-Doc V0.7 erstellt. Vitest 2 + Coverage-V8 hinzugefuegt. Test-Suite fuer genetics.ts und breedingV2.ts mit 48 Tests, 100 Prozent Coverage auf breedingV2.ts.
- **2026-04-25:** Save-V10 mit PlantGenome-Field. Crossing V2 mit Allele-Mendel-Genetik live.
- **2026-04-23 bis 2026-04-25:** Save v2 bis v10 Schritt-fuer-Schritt Migrationen.
- **2026-04-29:** Architektur-Doc V1.2. B-019 (scheduleAutoSave Debounce), B-020 (beforeunload Guard), B-023 (refreshHeader null-guard) gefixed + 11 Vitest-Regression-Tests. i18n-Modul eingefuehrt (src/i18n/, t() Funktion, DE+EN, 73 UI-Keys). GardenScene Phase-2: 7 hardcoded Strings auf t() migriert. NPC-Wander V0.2 bestaetigt live (pickWanderTarget + setNpcTarget in OverworldScene). Bundle: ~2.2 MB decoded, 730 KB Index + 1444 KB Phaser. ESLint 0 Warnings. 268+ Tests gesamt.
- **2026-04-29 b5 Polish-Session:** ESLint void-Hack Sweep abgeschlossen. 22 void-Hacks aus 8 Scenes entfernt (QuestLogScene, GardenScene, OverworldScene, SplashScene, BattleScene, SettingsScene, MenuScene). BattleScene uiCam-Property zu lokalem const konvertiert. OverworldScene 2 dead imports bereinigt. Alle Scenes geprüft — 0 verbleibende void-Hacks. Architecture.md V1.3. tier_status.md b5 aktualisiert.
