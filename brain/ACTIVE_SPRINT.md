# Active Sprint

**Sprint**: S-08 Endgame-Spec plus Mordwald plus Magmabluete plus Polish
**Start**: 2026-04-26 (geplant)
**Geplantes Ende**: 2026-05-04
**Ziel**: Endgame-Spec, 2 weitere Biome (Mordwald + Magmabluete), Crossing-UI-Polish, Theo-Tausch.

## Vorgaengiger Sprint S-07
**Status**: ABGESCHLOSSEN am 2026-04-25.
Postmortem: `brain/postmortems/S-07_frostkamm_salzbucht_battle_anim.md`

## Definition of Done S-08
1. design/endgame.md mit Mythical-Pflanzen plus Verodyne-Boss-Design
2. Mordwald-Biom (Karnivoren-Sumpf) mit eigenen Tiles plus Encounter-Pool
3. Magmabluete-Biom (Vulkan) mit Lava-Tiles plus Hitze-Damage-Effekt-Concept
4. Crossing-UI-Polish: 2-Slot-Select mit Highlight-Frame
5. Theo-Tausch-Modus in Verdanto NPC (Item-fuer-Item statt Coin)
6. Performance-Pass: Map-Tile-Render-Cache statt sprite-pro-Tile
7. Devlog #3 schreiben
8. **DONE 2026-04-25**: Growth-System V0.2 (Aufwachsystem-Rework). Hydration-Skala, Multiplikatoren, Quality-Tier, Bloom-Cycle. Spec, Code, Tests, Save-Migration v5->v6. Siehe D-019.
9. **DONE 2026-04-25**: Mordwald-Biom (Karnivoren-Sumpf) plus Magmabluete-Biom (Vulkan-Pyrophyt). Beide mit Spec, Map-File, 6er Encounter-Pool, prozeduralem Tile-Set, Map-Edge-Transitions, NPC. Endgame-Spec V0.1 inkl. 15 Mythical-Pflanzen, Verodyne-Boss-Konzept, Eden-Lost-Region.
10. **DONE 2026-04-25**: Booster-System V0.1 + Seed-Acquisition + 10 neue Spezies (D-021). 9 Booster-Items, Soil-Tiers (normal/bronze/silver/gold), Daily-Login-Reward, Markt-Daily-Roster, Procedural-Plant-Sprite-Generator fuer 10 neue Spezies (Rose, Aloe Vera, Orchid, Fern, Mint, Iris, Snapdragon, Water Lily, Daffodil, Coneflower). Save-Migration v6->v7. 14 von 14 Tests PASS.

## Tasks
### Spec-Phase
- [ ] design/endgame.md V0.1
- [ ] design/biome_mordwald.md V0.1
- [ ] design/biome_magmabluete.md V0.1

### Code-Phase
- [ ] mordwald.ts plus Sumpf-Tile-Drawer
- [ ] magmabluete.ts plus Lava-Tile-Drawer
- [ ] Encounter-Pools fuer Mordwald (Karnivoren) und Magmabluete (Asche-Pflanzen)
- [ ] Crossing-UI-Mode in GardenScene mit Slot-Selection
- [ ] Theo-NPC in Verdanto plus Trade-Modus (TradeScene oder MarketScene-Variant)
- [ ] Performance: Tile-Render-Caching (Static-Background-Image statt 600 Sprites)

### QA und Release
- [ ] Self-Test-Loop
- [ ] Devlog #3 mit S-07 plus S-08 Highlights
- [ ] Slack

## Naechster Sprint S-09 (Plan)
- Glaciara plus Eden Lost (Endgame-Biome 7+8)
- Verodyne-Boss-Battle V0.1
- Achievements-System

## Risiken
- Performance bei 600 Tile-Sprites pro Map und Animations-Tweens. Mitigation: ein einzelnes Tilemap-Image generieren statt 600 individuelle Sprites.

## Tracking
- Slack-DM: D0ATT08EPU2
- Devlog-Cadence: ab S-08 wochentlich
