# QA-Critic Browser-Smoke-Plan (Tier 1-2-3 Verifikation)

**Status:** PROPOSED. Wird im 20:00-QA-Run via Chrome-MCP ausgefuehrt.

## Voraussetzungen
- Chrome MCP Extension installiert plus aktiviert.
- Build deployed auf Netlify-Preview.
- localStorage frisch (Tier 1 First-Time-User-Experience-Test).

## Test-Sequenz

### Tier-1 Game-Start (max 8 Sekunden)
1. Frischer Browser plus leerer LocalStorage.
2. Open https://plantinvasion.netlify.app
3. **PASS:** MenuScene erscheint mit "Plantinvasion"-Title plus Loading-Indikator "lade Assets X%".
4. **PASS:** Spielbarer Garten in unter 8 Sekunden ohne Console-Error.
5. Screenshot: brain/playtests/smoke_<date>_tier1_boot.png

### Tier-2 Garten-Experience
1. Klick "Saeen"-Button im Header.
2. **PASS:** Modal mit Title "Pflanze einsaeen (N frei)" plus Seed-Liste.
3. Klick einen Seed.
4. **PASS:** Toast "X eingesaeet" mit gruener Farbe.
5. Klick auf einen leeren Slot direkt (Slot-First-UI V0.2).
6. **PASS:** Modal mit Title "Slot X,Y bepflanzen" plus Seed-Liste.
7. Klick eine Plant-Card.
8. **PASS:** Detail-Panel oeffnet sich in unter 100 ms.
9. Klick "Wasser"-Button im Plant-Detail.
10. **PASS:** Hydration-Bar geht auf 100%, Toast "Bewaessert".
11. Screenshots: brain/playtests/smoke_<date>_tier2_garten.png

### Tier-3 UI/UX-Konsistenz
1. Vergleiche Toast in GardenScene mit Toast in OverworldScene-Zone-Wechsel.
2. **PASS:** Identische Background-Farbe (#1a1f1a), Padding (10x6), FontSize (14px).
3. Oeffne Pause-Overlay (ESC).
4. **PASS:** Background gleicher Stil wie Modale (Theme-Konstanten konsistent).
5. Oeffne PauseScene-Settings.
6. **PASS:** Buttons konsistent zu MenuScene-Buttons.

### Tier-4 NPC-Walking V0.1 (5 Min Beobachtung)
1. Gehe in OverworldScene Wurzelheim.
2. Stehe still und beobachte 3 NPCs ueber 1-2 Min.
3. **PASS:** NPCs bewegen sich alle 5 Sekunden ein Tile in zufaellige Richtung.
4. **PASS:** NPCs verlassen Spawn-Area-Radius nicht.
5. **PASS:** Bei Player-Dialog stoppen alle NPCs.
6. **PASS:** 60fps locked (FPS-Counter via DEBUG_OVERLAY=true).
7. Screenshot-GIF: brain/playtests/smoke_<date>_tier4_npc_walking.gif

### Tier-4 Story-Akt-1 V0.1 End-to-End
1. Frischer Garten mit Sunflower-Seed im Inventar.
2. Saee Sunflower ein.
3. Waessere die Pflanze.
4. Beschleunige Wachstum (DEBUG_OVERLAY=true plus Time-Skip).
5. Sobald Sunflower in Adult-Stage:
6. **PASS:** Toast "Tagebuch: Mein erster Tag in Wurzelheim" erscheint.
7. **PASS:** Diary-Entry 1 ist im DiaryScene sichtbar.
8. **PASS:** gameStore.getCurrentAct() === 1.

## Bei Fail
1. Screenshot speichern.
2. Console-Error in brain/qa/bugs.md als neuen B-NNN dokumentieren.
3. Tech-Code via `brain/agents/tech-code/STATE.md` informieren.

## Output
- 5 Screenshots in brain/playtests/smoke_<date>_*.png/gif
- brain/playtests/<date>_browser_smoke_RUN_REPORT.md mit PASS/FAIL pro Tier
