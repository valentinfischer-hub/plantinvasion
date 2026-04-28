# Plantinvasion Tier-Status (V2 SKILL)

## Tier 1 - Game-Start plus FTUE
- **Status:** GRUEN-VERIFIZIERT
- **Letztes Smoke:** 2026-04-28 (Browser-Smoke via Chrome MCP)
- **Pruefkriterium:** spielbarer Garten in unter 8 Sekunden ohne Console-Error -> ERFUELLT.

## Tier 2 - Garten-Experience
- **Status:** GRUEN-VERIFIZIERT (visuell + funktional)
- **Letztes Smoke:** 2026-04-28

## Tier 3 - UI/UX uebergreifend
- **Status:** GRUEN-VERIFIZIERT-VISUELL
- **Letztes Smoke:** 2026-04-28

## Tier 4 - Sprint-DoD-Items
- **Status:** GRUEN-V0.2-PATHFINDING-LIVE
- **2026-04-28 08:00-Run:** npcMovement V0.2 integriert. targetTile-Property + nextStepTowards() + buildWallsSet() live.
- **OverworldScene:** walls-Set aus echten MapDef.tiles (Tile 3,4,5,6,8 = geblockt).
- **V0.2 Pathfinding:** fertig fuer OverworldScene-targetTile-Zuweisung (NPC-Wander-Ziele).
- **Story-Akt-1 V0.1:** live.
- **Offen Tier-4:** NPC-targetTile in OverworldScene setzen (Wander-Logik), GardenScene Atlas-Frames.

## Tier 5 - Polish
- **Status:** GRUEN-MAXIMAL (613/613 Tests, ESLint 0/0, Coverage all-files >99%)

## Tier 6 - Multiplayer
- **Status:** READY plus 97% Coverage hinter MP_ENABLED
