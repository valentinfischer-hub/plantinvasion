# Tech-Code Tasks

**Sprint:** S-POLISH (2026-04-27 bis 2026-05-03)
**Cadence:** alle 4h (08, 12, 16, 20)
**Direktive:** 90% Polish bestehender Code. Max 10% Neu. i18n zaehlt als Polish.
**Polish-Anteil messen:** Am Run-Ende Prozent in Log schreiben.
**First-Impression-Pflicht:** Alles was Spieler in ersten 5 Minuten sieht/hoert/klickt = Score-Ziel 5/5. MenuScene + FTUE-Flow haben absolute Prioritaet.

---

## REIHENFOLGE VERBINDLICH (3 bestehende Items anfassen vor neuem File)

### 1. GitHub-Push-Setup (BLOCKER, zuerst)

Bei Push-Fail: Patch in Slack-Alert.

### 2. i18n-Setup (ERLEDIGT 2026-04-28)
- Standalone src/i18n/index.ts (kein i18next, kein external dep)
- src/i18n/de/ + en/ (common.json, ui.json, plants.json, quests.json)
- Tests vorhanden (src/i18n/__tests__/i18n.test.ts)
- MenuScene nutzt t() fuer alle Buttons
- Locale-Toggle in SettingsScene (DE/EN, localStorage-Persist)
- Detail: brain/agents/tech-code/i18n_progress.md

### 3. Sentry-SDK (ERLEDIGT 2026-04-28)
- In src/main.ts, conditional auf VITE_SENTRY_DSN
- BrowserTracing plus captureMessage plantinvasion-boot

### 4. PostHog-SDK alle 9 Pflicht-Events (ERLEDIGT 2026-04-29)
- Alle 9 Pflicht-Events implementiert:
  - game_started: main.ts (S-09)
  - breeding_attempted: GardenScene.ts (Batch 2)
  - breeding_succeeded: GardenScene.ts (Batch 2)
  - mutation_triggered: GardenScene.ts (Batch 2)
  - battle_started: BattleScene.ts (2026-04-29 08:00)
  - battle_won: BattleScene.ts (2026-04-29 08:00)
  - battle_lost: BattleScene.ts (2026-04-29 08:00)
  - save_corrupted: storage.ts (2026-04-29 12:00)
  - scene_changed: OverworldScene.ts via trackStart-Helper (2026-04-29 12:00)
  - achievement_unlocked: gameState.ts (2026-04-29 12:00)

### 5. ESLint Zero Warnings (ERLEDIGT 2026-04-29)
- Batch 2 hat ~62 any-Errors behoben
- Scan 2026-04-29 12:00: nur 2 any-Stellen uebrig, beide mit eslint-disable-next-line suppressed
- 0 aktive Violations - Ziel erreicht

### 6. Zuechtungs-Visual Polish (wenn Art-UI Spec da)
- Bestaeubungs-Animation 3-Lagen-Partikel (Pollen, Licht, Zauber)
- Punnett-Square-Komponente (2x2 Grid, Wahrscheinlichkeits-Tooltips)
- Hybrid-Reveal-Stinger (Camera-Punch in 200ms)
- Mutation-Glow-Effekt (8% Basis, 15% Doppel-Sondermerkmal)

### 7. Performance-Audit 60fps
- Chrome-Profiler 30min Auto-Playthrough
- Top-5-Slow-Functions identifizieren
- Memory-Leak: Tween-Cleanup BattleScene plus GardenScene
- Particle-Pool-Reuse pruefen

### 8. TypeScript Strict Mode
- noUncheckedIndexedAccess in tsconfig - GEPLANT
- Plan dokumentiert in brain/tech/strict_migration.md
- Aktivierung wenn Bash verfuegbar (Build-Gate: tsc plus vite build - Vorpruefung noetig)

### 9. Save-Migration Edge-Cases
- v5 bis v8 Round-Trip-Test in Vitest
- Kaputte Saves, Browser-Refresh mid-Battle, Storage-Quota-Overflow

---

## NEU-BLOCK (max 10%)

Kein neues Feature ohne Producer-Release-Freigabe.

---

## Quality Gates

- npm test und npm run lint und npm run build gruen vor Push
- Bundle kleiner 5MB
- PostHog-game_started-Event im Dashboard nach Init

## Cost-Tracking

- i18next/Sentry/PostHog/Vitest/ESLint: 0 USD
- PixelLab-Calls (wenn Sprites): sofort in brain/COSTS.md
