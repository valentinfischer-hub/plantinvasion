# Plantinvasion Tier-Status (V2 SKILL)

## Tier 1 - Game-Start plus FTUE
- **Status:** GRUEN-VERIFIZIERT
- **Letztes Smoke:** 2026-04-28 (Browser-Smoke via Chrome MCP, 20:00 QA-Run)
- **Pruefkriterium:** spielbarer Garten in unter 8 Sekunden ohne Console-Error -> ERFUELLT.

## Tier 2 - Garten-Experience
- **Status:** GRUEN-VERIFIZIERT (visuell + funktional)
- **Letztes Smoke:** 2026-04-28 (20:00 QA-Run)
- **Verifiziert:** Header 2/12, Saeen-Modal, Toast, Plant-Card-Detail (Sunflower L5)

## Tier 3 - UI/UX uebergreifend
- **Status:** GRUEN-VERIFIZIERT-VISUELL
- **Letztes Smoke:** 2026-04-28 (20:00 QA-Run)
- **Verifiziert:** konsistente Monospace-Fonts, einheitliche Button-Styles, Wetter-Toast "Nebel"

## Tier 4 - Sprint-DoD-Items
- **Status:** GRUEN-V0.2-PATHFINDING-LIVE
- **Letztes Smoke:** 2026-04-28 (20:00 QA-Run)
- **2026-04-28 08:00-Run:** npcMovement V0.2 integriert. targetTile-Property + nextStepTowards() + buildWallsSet() live.
- **OverworldScene:** walls-Set aus echten MapDef.tiles (Tile 3,4,5,6,8 = geblockt).
- **2026-04-28 12:00-Run:** pickWanderTarget() in OverworldScene integriert (30s Wander-Intervall).
- **Story-Akt-2 Spec:** brain/sprints/S-10/story-akt-2.md vorhanden.
- **Browser-Smoke 20:00:** NPCs bewegen sich sichtbar zwischen 6s-Screenshots (V0.1/V0.2 Walking live).

## Tier 5 - Polish
- **Status:** GRUEN-MAXIMAL (833/833 Tests, ESLint 0/0)
- **2026-04-28 16:00-Run:** storage.ts window-guard eingefuehrt, 833/833 Tests gruen.

## Tier 6 - Multiplayer
- **Status:** VITE_MULTIPLAYER_ENABLED=false (korrekt, Feature-Flag gesetzt)
