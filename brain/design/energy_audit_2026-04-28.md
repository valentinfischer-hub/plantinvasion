# Energy-Economy Audit 2026-04-28

## Ist-Zustand vor Run 1
- Kein Energy-System vorhanden
- Spieler konnte unbegrenzt Aktionen ausführen
- Kein Stardew-artiges Tages-Rhythmus-Gefühl

## Stardew Valley Referenz
- Max Stamina: 270 (Early Game ~100)
- Säen: -2 Stamina
- Giessen: -2 Stamina
- Ernten: -1 Stamina
- Ergebnis: ~30-45 Aktionen pro Tag möglich

## Plantinvasion Implementierung (Run 1)

### Kosten-Tabelle
| Aktion    | Kosten | Rationale                                |
|-----------|--------|------------------------------------------|
| Säen      | -1 E   | Günstigste Routine-Aktion                |
| Giessen   | -2 E   | Tägliche Pflege, mittlere Kosten         |
| Kreuzen   | -8 E   | Aufwändigste Aktion, soll selten sein    |
| Ernten    | -1 E   | Belohnung, soll sich nicht teuer anfühlen|
| Foraging  | -4 E   | Erkundung kostet mehr als Gartenpflege  |
| Booster   | -3 E   | Spezialaktion                            |

### Tageslimit-Simulation
- Max Energy: 100
- Säen + Giessen abwechselnd: ~33 Runden (bis nichts mehr geht)
- Nur Säen: 100 Aktionen (zu viel)
- Mix (12 Säen + 8 Giessen + 2 Kreuzen): 12+16+16 = 44 Energy, 56 Rest für Harvest/Foraging
- Realistischer Spieler-Tag: ~20-25 bedeutsame Aktionen

### Soll-Zustand
- Spieler fühlt: "Ich muss priorisieren"
- 3-5 Kreuzungen pro Tag maximal (8E x 5 = 40E)
- ~15-20 Giessaktionen pro Tag (2E x 20 = 40E)
- Rest für Ernten/Foraging

### Balancing-Notiz (für späteres Feinjustieren)
- Wenn Spieler klagen "zu wenig Energy": ENERGY_MAX auf 120 erhöhen
- Wenn zu viel: cross auf 10E, forage auf 5E
- Energy-Items (Kaffee, Energieriegel) als Shop-Items sinnvoll für S-SHOP Sprint

## Technische Umsetzung
- `src/systems/EnergySystem.ts`: Pure functions, keine Phaser-Abhängigkeiten
- `GameState.energy?: number` (optional für Backward-Compat)
- Default bei Migration: 100 (volles Energie)
- `gameStore.getEnergy()`, `gameStore.regenEnergyForNewDay()`
- Tests: 20+ Tests in EnergySystem.test.ts

## Status
- [x] EnergySystem.ts implementiert
- [x] GameState.energy Feld hinzugefügt
- [x] plantSeed/plantSeedAt Energy-Check
- [x] crossPlants Energy-Check (8E - teuerste Aktion)
- [x] harvestPlant Energy-Spend (1E)
- [x] Tests grün
- [ ] UI-Anzeige (folgt in Run 14 Sound/UI Polish)
- [ ] regenEnergyForNewDay() in Time-System verknüpfen
