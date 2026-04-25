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
11. **DONE 2026-04-25**: Seed-Acquisition V0.2 (Pokemon-Style) + 35+ neue Spezies + 10 Hybrid-Recipes (D-024). Forage-Tiles (50/51), Hidden-Spots (35 verteilt auf 7 Biome, one-shot), Battle-Drops (25% Seed), Berry-Master Bertram (Daily-Free). 51 Basis-Spezies + 10 kreuzbare Hybriden = 61 Total. Save-Migration v7->v8. 14/14 Tests PASS.
12. **DONE 2026-04-25**: Achievements V0.1 + Forage-Tiles in allen 7 Biomen + Daily-Login-Toast (D-025). 10 Achievements (first-bloom, pristine-grower, hybrid-architect, mutation-storm, cactus-bundle, swamp-veteran, volcano-tamer, world-traveler, collector, completion). Counter-Tracking fuer Crossings/Mutations/Visited-Zones. Forage-Tiles Wurzelheim-only -> alle 7 Biome (4 pro Biom). Daily-Login-Toast unten-mittig statt Modal.
13. **DONE 2026-04-25**: Achievement-Unlock-Toast in OverworldScene + MarketScene Tagesangebot-Mode. Toast oben-mittig mit goldenem Bg + violetter Outline + SFX bei Achievement-Unlock. MarketScene neuer Mode 'Tagesangebot' (Default beim Open) mit 5 Daily-Seeds + 2 Boostern + 3 Soil-Upgrades; Toggle zu 'Kaufen alle' oder 'Verkaufen' wie bisher.
14. **DONE 2026-04-25**: Glaciara-Biom V0.1 (Biom 8) + PokedexScene-Achievement-Tab. Glaciara-Map mit Eis-Tiles 60-64 prozedural (drawIceGround, drawIceCrack, drawIceCrystal, drawGlaciaraGrass, drawMythicalGate). 6 neue Encounter-Pflanzen (Arctic-Poppy, Glacier-Buttercup, Silver-Fir, Ice-Bellflower, Frost-Moss, Permafrost-Lichen, Levels 30-50). Edge: Frostkamm Norden -> Glaciara Sueden. Glaciara Norden = Eden-Lost-Tor (V1.0). PokedexScene: Tab-Switch zwischen Spezies und Achievements, Achievements-Tab zeigt 10 Achievements mit Status, Reward, Beschreibung.
14. **DONE 2026-04-25**: Live-Browser-Test V0.7 mit Chrome MCP. Bugs B-001 (Dialog unsichtbar wegen Camera-Zoom), B-002 (Daily-Login-Toast unsichtbar), B-003 (Versionslabel veraltet) gefunden und gefixt. Re-deploy auf Netlify erfolgreich. Bug-Report in brain/playtests/2026-04-25_live_test_v07.md inkl. Cosmetic-Bugs B-004/B-005 und Major-Design-Issues D-001/D-002/D-003 fuer S-09/S-10. Commit 9555066 auf main.

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
