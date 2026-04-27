**Item:** Story-Akt-1 V0.1 ("Wurzelheim erwacht")
**Tier:** 4 (Sprint-S-09 DoD)
**Estimate:** L (60-90 Min, Folge-Run noetig)
**Pre-Conditions:**
- gameStore.story-State ist verfuegbar (steht in fc26ed2: flags/currentAct/metNpcs/diaryEntries).
- DialogBox + NPC-Interaction funktionieren.
- Quest-System V0.1 vorhanden (src/data/quests.ts).

**Acceptance:**
1. **Akt-Trigger:** Beim ersten New-Game-Start steht der Spieler in Wurzelheim, Tutorial-Step 0 aktiv.
2. **NPC-Begegnung:** Anya (Tutorial-NPC) gibt Akt-1-Quest "Wurzelheim erwacht": eine Sunflower einsaeen, waessern, bis Stage 3 wachsen lassen.
3. **Story-Flags:** quest_seed_planted, quest_first_water, quest_reached_adult werden gesetzt.
4. **Akt-Abschluss:** Sobald alle 3 Flags true plus Sunflower in Adult-Stage, advanceAct(1) wird aufgerufen.
5. **Diary-Eintrag:** collectDiaryEntry(1) "Mein erster Tag in Wurzelheim" wird automatisch hinzugefuegt.
6. **Achievement:** "Erster-Spross" wird unlocked.
7. **Akt-2-Trigger:** OverworldScene fragt currentAct ab und enabled neue Zone-Door (Verdanto wird zugaenglich).

**Tests:**
- Vitest in `src/data/__tests__/storyAct1.test.ts`:
  - Pure-Function `evaluateAct1Progress(flags, plants)` returnt 'pending' | 'in_progress' | 'completed'.
  - Determinismus: same Input -> same Output.
  - Edge: kein Plant -> 'pending'. 1 Sunflower seed -> 'in_progress'. 1 Sunflower Adult -> 'completed'.
  - Flag-Sets-Logik: setFlag/hasFlag funktioniert wie erwartet (Integration mit gameStore).

**Files:**
- `src/data/storyAct1.ts` neu (pure functions: evaluateAct1Progress, ACT1_QUEST_FLAGS).
- `src/data/__tests__/storyAct1.test.ts` neu.
- `src/scenes/OverworldScene.ts` checkt nach Tick `gameStore.getCurrentAct()` und triggert Akt-Uebergang.
- `src/data/quests.ts` neue Quest-Definition Q1 "wurzelheim-erwacht".

**V0.2 Folge-Run (separater Spec):**
- Akt-2 "Verdanto-Bromelien".
- Cutscene-System fuer Akt-Uebergaenge.
- Mehrere NPC-Dialog-Branches abhaengig von currentAct.

**Provenienz:**
Tech-Code-Self-Spec 2026-04-27, Auto-Approval. Producer kann Acceptance-Criteria adjusten oder erweitern bevor Implementation startet.
