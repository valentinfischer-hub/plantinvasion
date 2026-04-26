# Bundle-Splitting + Feature-Flags + gameTime-Wrapper (Tech-Run 16:00)

**Datum:** 2026-04-26 16:00 (dritte autonome Tech-Code-Iteration)
**Branch:** main

## Diff-Beschreibung
Phaser via `manualChunks` in eigenen Bundle-Chunk ausgelagert (App-Code 242 KB, Phaser-Chunk 1.48 MB CDN-cacheable). Neue Module `src/utils/featureFlags.ts` (build-time `MP_ENABLED`/`DEBUG_OVERLAY`), `src/utils/gameTime.ts` (injizierbarer `now()`-Provider mit 100 Prozent Coverage) und `src/vite-env.d.ts` (typed `ImportMetaEnv`). storage.ts in Coverage-Threshold (85 Prozent, erreicht 98.5).

## Ergebnis
- Tests: 221 von 221 gruen ueber 6 Suiten (vorher 200/4)
- Coverage: storage.ts 98.5 Prozent (neu im Threshold), gameTime.ts 100 Prozent, featureFlags.ts 94.4 Prozent
- TypeScript-Strict: gruen, kein `any` in neuem Code
- Build: 1.72 MB minified total (Splitting aktiv), 0.41 MB gzip
- ESLint: 0 errors, 82 warnings (Bestand unveraendert)
- Save-Schema-Version unveraendert: v10

## Neue Files
- `src/utils/featureFlags.ts` (52 LoC inkl. Doc)
- `src/utils/gameTime.ts` (76 LoC inkl. Doc)
- `src/utils/__tests__/featureFlags.test.ts` (9 Tests)
- `src/utils/__tests__/gameTime.test.ts` (12 Tests)
- `src/vite-env.d.ts` (ImportMetaEnv-Typing)
- `.env.example` (Build-Time-Flag-Doku)

## Geaenderte Files
- `vite.config.ts`: manualChunks fuer Phaser, chunkSizeWarningLimit 1500
- `vitest.config.ts`: storage.ts (85 Prozent) und gameTime.ts (100 Prozent) in Coverage-Thresholds
- `brain/tech/architecture.md`: V0.8 mit Modul-Layout-Update, Performance-Tabelle, neuer Library-Choices, Aenderungs-Log
- `brain/agents/tech-code/STATE.md`: Run-16:00-Eintrag

## Naechste Tech-Run-Prios
1. leveling.ts auf gameTime.now() migrieren (heiliger Pfad - mit voller Coverage gegenchecken)
2. ESLint-Bestand abbauen (82 Warnings)
3. NPC-Walking-Cycles und Saison-Tile-Variationen (Sprint-S-09 DoD)
4. Hybrid-Reveal-Tests (heiliger Pfad ohne Tests)
5. Supabase-Client lazy hinter MP_ENABLED instantiieren
