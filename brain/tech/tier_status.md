# Plantinvasion Tier-Status (V2 SKILL)

Laufende Tier-Bewertung pro Run. Wird im 20:00-QA-Run via Browser-Smoke aktualisiert. Code-Audit im Tier-Check der ersten Run-Phase ist Pflicht.

## Tier 1 - Game-Start plus FTUE
- **Status:** GELB (Code-Audit 2026-04-27)
- **Letztes Smoke:** noch keine via Chrome-MCP
- **Letztes Issue:** BootScene war toter Code (nicht im main.ts scene-Array), enthielt `console.log` und duplizierte Atlas-Loads die schon in MenuScene laufen. Im Run 2026-04-27 entfernt. MenuScene.preload hatte keinen Loading-Indikator.
- **Pflicht-Pruefkriterium:** frischer Browser plus leerer LocalStorage = spielbarer Garten in unter 8 Sekunden ohne Console-Error.
- **Naechster Step:** Browser-Smoke via Chrome MCP im 20:00-QA-Run.

## Tier 2 - Garten-Experience
- **Status:** GELB (B-012 V0.2 Slot-First-UI seit 2026-04-27 12:00 live, visuell unverifiziert)
- **Letztes Smoke:** noch keine
- **Pflicht-Pruefkriterium:** Saeen plus Wasser plus Kreuzen plus Harvest klickbar plus visuell sauber. Plant-Cards in unter 100 ms reagibel. Slot-Hotspots reagieren auf Klick.
- **Naechster Step:** Browser-Smoke im 20:00-QA-Run mit Saeen-Slot-First-Test.

## Tier 3 - UI/UX uebergreifend
- **Status:** GELB (kein Konsistenz-Audit gemacht)
- **Letztes Smoke:** noch keine
- **Pflicht-Pruefkriterium:** Toast plus Modal plus Header konsistent ueber Garden, Overworld, Battle, Inventory, Pokedex, Market, QuestLog, Diary, Settings, Help.
- **Naechster Step:** Audit Pass alle Scene-UI-Elemente vergleichen.

## Tier 4 - Sprint-DoD-Items
- **Status:** PENDING
- **Aktueller Sprint:** S-09 Story-Akt-1 plus NPC-Walking. Saison-Tile-Variationen sind faktisch via Atlas-Pack-Commits 59d1d9a/a5eb995 erledigt aber GardenScene rendert noch nicht die Atlas-Frames.
- **Offene DoD-Specs:** brain/sprints/S-09/ existiert noch nicht, Producer muss Specs liefern.

## Tier 5 - Polish plus Refactor
- **Status:** GRUEN (laufend)
- **Coverage:** breedingV2/genetics/leveling/storage/gameTime alle Lines 100 Prozent. ESLint 0 errors plus 76 warnings.

## Tier 6 - Multiplayer-Foundation
- **Status:** READY (deaktiviert via MP_ENABLED Feature-Flag)
- **Aktivierung:** ab Sprint S-11.
