# Tech-Code Tasks

**Sprint:** S-POLISH (verlängert bis 2026-05-17, D-042)
**Cadence:** alle 4h (08, 12, 16, 20)
**Direktive:** 90% Polish bestehender Code. Max 10% Neu. i18n zählt als Polish.
**Polish-Anteil messen:** Am Run-Ende Prozent in Log schreiben.
**First-Impression-Pflicht:** FTUE-Schritte 1–5 = Score-Ziel 5/5. Blocker für Closed-Alpha.

---

## REIHENFOLGE VERBINDLICH

### 0. CD-PIPELINE-FIX — P0 (ERSTE AKTION, VOR ALLEM ANDEREN)

**Decision:** D-045 (Producer-Release 2026-05-13)
**Problem:** Netlify deployed seit 2026-04-30 NICHT mehr automatisch. Aktueller Live-Deploy: commit 3b5976ae (fix xpBar), 13 Tage alt. Alle FI-Arbeit, Bug-Fixes, i18n-Arbeit seit 2026-04-30 sind für Spieler NICHT sichtbar.

**Aufgabe:**
1. Netlify Admin → Site plantinvasion → Site settings → Build & deploy → Repository: GitHub-Verbindung prüfen
2. Webhook-Status prüfen: Deploys → Deploy settings → Build hooks (expired?)
3. Falls Webhook-Problem: Webhook löschen + neu anlegen
4. Falls OAuth-Token: GitHub re-authorize
5. Nach Fix: manueller Deploy triggern
6. Netlify-CD verifizieren: Push 1 Test-Commit, Deploy-Status prüfen
7. brain/release/build_log.md aktualisieren mit aktuellem Deploy

**Keine anderen Tasks bis CD-Pipeline grün.**

### 1. FTUE Phase A — State + Persistence (SOFORT, kein Warten mehr)

**Spec:** brain/sprints/s-polish/ftue_phase_a.md (Producer-Release 2026-05-13)
**Estimate:** 0.5h

- [ ] src/types/ftue.ts — FTUEState-Interface
- [ ] src/managers/FTUEManager.ts — Singleton (getState, markStepComplete, isComplete, reset)
- [ ] src/data/storage.ts — Save-Migration: bestehende Saves → alle ftue-Flags = true
- [ ] Vitest: 4 Tests (reset, markStep, isComplete, Migration)
- [ ] Commit: `feat(ftue): Phase A — FTUEState + FTUEManager + Save-Migration`
- [ ] Antwort-Handoff: brain/HANDOFFS/YYYY-MM-DD_tech-code_ftue_phase_a_done.md

### 2. Iter30 UI-Bugs (Handoff 2026-05-11_run2_art-ui_to_tech-code_iter30_bugs.md)

**P1 sofort:**
- [ ] B-008: I-Hotkey → InventoryScene (keydown-I in OverworldScene.create())
- [ ] B-009: Q-Hotkey → QuestLogScene statt Nebel

**P2 nach P1:**
- [ ] B-006: Coin-HUD Flackern — Tween-Counter statt direktes setText
- [ ] B-007: Kreuzungs-Modal X-Button top-right
- [ ] B-010: introShown-Flag in SaveState

**Commit-Prefix:** `fix: iter30 ui-bug-sync (B-006 bis B-010)`

### 3. Title-Screen-Logo + Loading-Indicator (Handoff 2026-05-11_art-ui_to_tech-code_title_loading.md)

**FI-Score-Ziel:** Logo 3→4, Loading 3→4

- [ ] Title-Text: Outline + Schatten + Entrance-Sequenz (4 Elemente koordiniert)
- [ ] Loading-Indicator: Puls-Tween 700ms + Dots-Animation
- [ ] Transition MenuScene: alpha 0, 300ms
- [ ] Tween-Cleanup in shutdown()
- Commits: `FI: title-logo polish + loading indicator branded`

### 4. FTUE Phase B — Schritt 1 Tilda-Dialog (nach Phase A)

**Spec:** brain/design/ftue_spec.md (Design-Balance, 507 Zeilen)
**Estimate:** 1.0h

- Wartet auf: Phase A abgeschlossen
- 1500ms Delay nach OverworldScene ready
- Typewriter 40ms/Zeichen, Skip-Logik
- PostHog Events: pi_ftue_step1_dialog_started + pi_ftue_step1_dialog_completed
- Platzhalter-Dialog aus brain/narrative/dialogs/tilda.md (bereit)

### 5. FTUE Phase C+D — Schritte 2–5 (nach Phase B)

- Wartet auf: Phase B
- Details in brain/design/ftue_spec.md

### 6. i18n Phase 2 (laufend, als Polish bei jedem Run)

- [ ] GardenScene hardcoded Strings → t()-Calls
- [ ] BattleScene hardcoded Strings → t()-Calls
- [ ] OverworldScene Dialog-Trigger-Strings → t()-Calls

**Stand Phase 1:** MenuScene ✅, SettingsScene ✅, CCS ✅, QuestLogScene ✅
**Noch offen:** GardenScene, BattleScene, OverworldScene-Dialoge

### 7. Sentry P0/P1 Check

- [ ] Sentry-Dashboard öffnen, aktive P0/P1 Errors dokumentieren
- [ ] Bei P0/P1: sofort fixen, brain/qa/bugs.md aktualisieren

### 8. Performance-Audit 60fps (laufend)

- Chrome-Profiler 30min Auto-Playthrough wenn lokal möglich
- Memory-Leak: Tween-Cleanup in BattleScene + GardenScene

---

## Abgeschlossen (S-POLISH bisher)

- i18n Phase 1 ✅ (MenuScene, SettingsScene, CCS, QuestLogScene)
- Sentry-SDK ✅
- PostHog alle 9 Pflicht-Events ✅
- ESLint zero ✅
- B-027 (window.setTimeout Splash) ✅
- B-033 (GardenScene Camera-Fade) ✅
- B-034 (Säen-Button Mojibake) ✅
- B-035/B-036 (Save-Quota-Error) ✅
- Performance: NPC-NameTag-Throttle + Story-Flag-500ms-Throttle ✅
- Slot-Selection-Glow + Cross-Pollination Visual + Day-Night V2 ✅

---

## Quality Gates

- tsc --noEmit grün vor Push
- vitest run grün
- Bundle < 5MB
- Polish-Anteil ≥ 90% pro Run dokumentieren
