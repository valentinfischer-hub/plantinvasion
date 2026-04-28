# Browser-Smoke Run-Report 2026-04-28

**Ausgefuehrt von:** Tech-Code (V3 SKILL Auto-Approval-Pfad)
**Browser:** Chrome MCP (Browser 1, macOS)
**URL:** https://plantinvasion.netlify.app
**Commit zur Smoke-Zeit:** be23e93 (vor B-013-Fix). HEAD nach Fix: a9cd655.

## Tier-1 Game-Start FTUE
- **Status:** PASS
- MenuScene rendert in <5s mit Title "Plantinvasion", Atlas-Hintergrund (Tile-Pattern), Spezies-Showcase (6 Pflanzen), 4 Buttons (Weiterspielen, Neues Spiel, Einstellungen, Hilfe & Hotkeys).
- Loading-Indikator nicht mehr sichtbar (Lade abgeschlossen).
- Kein Console-Error in Boot-Sequenz.

## Tier-1 -> Tier-2 Uebergang via "Neues Spiel"
- **Status:** PASS
- OverworldScene Wurzelheim laedt mit Tutorial-Dialog "Willkommen in Wurzelheim".
- NPCs sichtbar (mehrere mit roten Shirts, Plant-Hats), Quest-Indikatoren (!).
- FARM(G)-Hint oben rechts.
- Atlas-Tiles renderen korrekt (Path, Wasser, Buildings).

## Tier-2 Garten via G-Key
- **Status:** PASS-VISUELL plus FAIL-CONSOLE
- GardenScene rendert mit:
  - Header "Plantinvasion · 1/12 · Coins 100"
  - 12 Slots in 4x3-Grid mit Boden-Variation (Atlas-Tiles)
  - Sunflower-Starterpflanze L1 Seed in Slot (0,0)
  - Buttons: Welt(W) plus Kreuzen plus Saeen
- **Console-Errors gefunden (B-013):** 3x "Cannot read properties of null (reading 'drawImage')" in NPC.setQuestIndicator.
  - Nicht UI-blockierend (Plant-Card und Buttons funktionieren)
  - Aber Hard-Gate-Verletzung gegen Console-Zero-Tolerance
  - Sofort gefixt: Commit a9cd655 mit safety-Check + Re-Deploy nach Netlify-CI-Run.

## Tier-3 UI/UX Konsistenz
- **Status:** PASS visuell aus Screenshots
- Toast-Stil identisch ueber MenuScene und GardenScene-Header.
- Modal-Stil (Tutorial-Box) identisch zu Plant-Detail-Stil.
- Button-Padding und Font konsistent.

## Tier-4 NPC-Walking V0.1
- **Status:** TEILWEISE PASS
- NPCs sichtbar in Overworld plus reagieren auf Player-Naehe (Quest-Indikator-Pulsieren).
- Eigentliche Walking-Bewegung nicht eindeutig im 5s-Window beobachtet (Smoke war kurz).
- Browser-Smoke laenger noetig (5+ Min) fuer Walking-Verifikation.

## Tier-4 Story-Akt-1 V0.1
- **Status:** NICHT GESMOKED
- Erfordert Plant-Wachstum bis Adult-Stage. Smoke-Zeit zu kurz fuer End-to-End.

## Bugs-Found
- **B-013 RESOLVED:** NPC-Quest-Indicator crasht nach Scene-Teardown. Doku in brain/qa/bugs.md.

## Tier-Status nach Smoke
- Tier 1 Game-Start: GRUEN-VERIFIZIERT (vorher GELB)
- Tier 2 Garten: GRUEN-VERIFIZIERT (vorher GRUEN)
- Tier 3 UI/UX: GRUEN-VERIFIZIERT-VISUELL (vorher GRUEN-V0.6)
- Tier 4 NPC-Walking: TEILWEISE-VERIFIZIERT (Bewegung im Detail-Smoke noetig)
- Tier 4 Story-Akt-1: NICHT-VERIFIZIERT (End-to-End-Smoke noetig)

## Naechste Pflicht-Smokes
- **NPC-Walking 5-Min-Beobachtung** mit GIF-Aufnahme.
- **Story-Akt-1 End-to-End** mit DEBUG_OVERLAY-Time-Skip.
- **Re-Smoke nach B-013-Fix-Deploy** sobald Netlify-CI gruen.
