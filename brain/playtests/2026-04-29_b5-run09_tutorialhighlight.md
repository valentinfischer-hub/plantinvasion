# Run 09/15 — TutorialHighlight Spotlight-Overlay

**Sprint:** S-POLISH Batch 5  
**Datum:** 2026-04-29  
**Agent:** Tech Lead + Gameplay Programmer  
**Commit:** ed5cc53

## Was wurde gebaut

`src/ui/TutorialHighlight.ts` (124 Zeilen):
- `HighlightTarget` Interface: `{ x, y, w, h, radius? }`
- 4-Rechteck-Cutout-Technik fuer Spotlight-Effekt (top/left/right/bottom)
- Pulse-Ring-Animation via `update()` (Alpha-Tween, wiederholend)
- `show(target)`, `hide()`, `update()`, `destroy()` API

`src/ui/__tests__/TutorialHighlight.test.ts` (7 Tests):
- Reine Logik-Tests ohne Phaser-Import
- Verifiziert alle 4 Overlay-Rechteck-Berechnungen
- Optional radius wird getestet

## Testergebnis

7/7 Tests bestanden, 0 Fehler.

## Quality Gates

- [x] Tests grun (7/7)
- [x] Kein neuer Content (S-POLISH-konform)
- [x] Push zu GitHub erfolgreich
- [x] Kein TODO/FIXME ohne Ticket
