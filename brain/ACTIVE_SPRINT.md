# Active Sprint

**Sprint:** S-POLISH (verlängert D-042)
**Start:** 2026-04-27
**Verlängertes Ende:** 2026-05-17 23:59
**Begründung Verlängerung:** FTUE-Schritte 1–5 auf Score 2/5. Quality-Gates (Critic ≥ 4.3, Stardew-Audit, Sentry zero P0) noch nicht bestätigt. D-042.

## Sprint-DoD-Checkliste — aktuelle Öffnungen

### FTUE-Implementierung (Phase A) — NEU 2026-05-13
- [ ] FTUEState-Interface in src/types/ftue.ts
- [ ] Save-Migration: bestehende Saves → FTUE-Flags = true
- [ ] FTUEManager-Singleton (getState, markStepComplete, isComplete, reset)
- [ ] Vitest: 4 Tests grün
- [ ] Spec: brain/sprints/s-polish/ftue_phase_a.md (FERTIG, assigniert Tech-Code)

### FTUE-Implementierung (Phase B — Tilda-Dialog)
- [ ] Dialog-Anzeige 1500ms nach OverworldScene ready
- [ ] Typewriter 40ms/Zeichen, Skip-Logik
- [ ] PostHog Events pi_ftue_step1_*
- [ ] Narrative-Sound Dialog-Content eingebunden (brain/narrative/dialogs/tilda.md bereit)
- [ ] Wartet auf: Phase A abgeschlossen

### Iter30-UI-Bugs (B-006 bis B-010)
- [ ] B-008: I-Hotkey → InventoryScene (P1)
- [ ] B-009: Q-Hotkey → QuestLog statt Nebel (P1)
- [ ] B-006: Coin-HUD Flackern-Fix (P2)
- [ ] B-007: Kreuzungs-Modal X-Button (P2)
- [ ] B-010: Intro-Dialog introShown-Flag (P2)
- Handoff: 2026-05-11_run2_art-ui_to_tech-code_iter30_bugs.md

### Title-Screen-Logo + Loading-Indicator
- [ ] Title-Text Outline + Schatten + Entrance-Sequenz (FI Score 3→4)
- [ ] Loading-Indicator Puls-Tween + Dots (FI Score 3→4)
- Handoff: 2026-05-11_art-ui_to_tech-code_title_loading.md

### Heimatdorf-BGM Placeholder
- [ ] Tone.js-Synth warmerer Cozy-Loop in titleBgm.ts-Stil
- [ ] FI-Score Heimatdorf-BGM 1→3
- Assigniert: Narrative-Sound (D-044)

### Sentry P0/P1 Zero
- [ ] Sentry-Dashboard auf offene P0/P1 prüfen (QA-Critic oder Tech-Code)
- Stand: unbekannt

### Stardew-Vergleichs-Audit
- [ ] GardenScene vs. Stardew
- [ ] BattleScene vs. Stardew/Pokémon
- [ ] OverworldScene vs. Stardew
- [ ] MenuScene vs. Stardew
- Stand: noch keine Scores dokumentiert

### Sprint-Postmortem
- [ ] brain/postmortems/S-POLISH.md schreiben (erst nach Sprint-Ende)

## Quality-Gates Stand 2026-05-13

| Gate | Status | Notiz |
|---|---|---|
| TS-strict grün | ✅ | letzter Build 2026-05-11 |
| Vitest grün | ✅ | 833+ Tests, Disk-Full-Caveat in Sandbox |
| ESLint zero | ✅ | 0 Violations seit 2026-04-29 |
| Bundle < 5MB | ✅ | ~1.7MB |
| 60fps stable | ✅ | FI-Score 5 |
| Sentry zero P0/P1 | ❓ | ungeprüft |
| Game-Critic ≥ 4.3★ | ❓ | kein Run seit 2026-04-30 |
| Stardew-Audit alle 4 Scenes | ❌ | offen |
| FI-Gesamtscore ≥ 4.0 | ❌ | FTUE 2/5, Heimatdorf-BGM 1/5 |

## FI-Score Übersicht 2026-05-13

| Item | Score | Trend |
|---|---|---|
| Favicon + Tab-Title | 5 | ✅ |
| Boot-Time | 5 | ✅ |
| 60-FPS | 5 | ✅ |
| MenuScene-Layout | 4 | ↑ |
| New-Game-Button | 4 | ↑ |
| Title-BGM | 4 | ↑ |
| Erster Bestäubungs-SFX | 4 | ↑ |
| Hybrid-Reveal-Stinger | 4 | ↑ |
| Erste 5 SFX | 4 | ↑ |
| Loading-Indicator | 3 | → |
| Title-Screen-Logo | 3 | → |
| FTUE Schritt 1–5 | 2 | ⚠️ kritisch |
| Tilda-Dialog | 2 | ⚠️ |
| Tilda-Sprite-Idle | 2 | ⚠️ |
| Bestäubungs-Animation | 2 | ⚠️ |
| Heimatdorf-BGM | 1 | 🔴 |

## Naechster Schritt nach S-POLISH

S-7.5 First-Time-User-Experience plus Anfang-Polish (Start 2026-05-18)

**Stand 2026-05-13 (Producer-Release Run V2):** Sprint verlängert, FTUE Phase A Spec delegiert, 3 Entscheidungen gefasst (D-042/D-043/D-044).
