# Handoff: Polish-Run-09b abgeschlossen

**Von:** Control-Center (scheduled task)  
**Datum:** 2026-04-28  
**Commit:** d88063ac  

## Was wurde gemacht

Hover-States plus Pixel-Snap auf alle Scenes ausser MenuScene (die bereits live war):

- **GardenScene**: Slot-Hotspot Outline-Glow (lineStyle 3 + 0x9be36e), Plant-Card Scale 1.0->1.04 auf pointerover
- **BattleScene**: Move-Buttons Hover-Scale 1.04 + Stroke 3px, Fluechten/Fangen 1.06
- **InventoryScene**: Back-Button Stroke-Glow, Item-Rows Background-Highlight #1a3525
- **MarketScene**: Row bg Border-Glow, makeButton Hover-Scale 1.04
- **PokedexScene**: Back-Button Glow, Tab-Buttons Hover-Stroke
- **Pixel-Snap**: Math.round() auf onUpdate fuer pollen-particles, stage-up-burst, damage/heal-floater

## Hinweise

- playParentDrift war im Remote bereits entfernt (refactor s-polish-08) - kein Conflict
- Disk-Space-Problem auf CI-Sandbox umgangen via GitHub-API-Push
- 5 Dateien geaendert, 64 Insertions

## Status

Bereit fuer naechsten Sprint.
