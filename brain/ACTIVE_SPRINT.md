# Active Sprint

**Sprint**: S-09 Story-Akt-1 spielbar plus NPC-Walking plus Saison-Tile-Variationen
**Start**: 2026-04-26 (geplant)
**Geplantes Ende**: 2026-05-04
**Ziel**: Story-Akt-1 voll spielbar mit Iris-Dialog-Choices und Auto-Quest-Akzept. NPC-Walking-Cycles. Saison-Tile-Variationen. Wetter als Encounter-Modifier.

## Vorgaengiger Sprint S-08
**Status**: ABGESCHLOSSEN am 2026-04-25.
Postmortem: `brain/postmortems/S-08_giant_sprint.md`
Devlog #3: `brain/devlogs/2026-04-25_devlog_03.md`

S-08 war der groesste Sprint mit 8 Biomen, Storyline V1, Day-Night, Wetter, Bossen, Tagebuch, Achievements.

## S-08-Zusatz-Iteration (2026-04-25 spaet)
Nach Sprint-Ende noch 5 weitere Patches:
- Booster-System V0.1 (D-021)
- Seed-Acquisition V0.2 mit Pokemon-Style Foraging (D-024)
- Achievements V0.1 plus Forage-Tiles biom-weit plus Daily-Login-Toast (D-025)
- Achievement-Unlock-Toast plus MarketScene-Tagesangebot-Mode
- Glaciara-Biom V0.1 plus PokedexScene-Achievement-Tab
- Farm-Button (G-Hotkey) plus 14 neue NPCs plus 14 Lore-Schilder mit Zone-Pos-Lookup

## Definition of Done S-09
1. Story-Akt-1 spielbar: Iris-NPC mit Dialog-Choices, Auto-Quest-Akzept, Quest-Completion-Check
2. NPC-Walking-Cycles: 4-Frame-Loop pro Richtung mit subtiler Idle-Animation
3. Saison-Tile-Variationen: Fruehling-Bluete, Herbst-Blaetter, Winter-Schnee-Overlay
4. Wetter als Encounter-Modifier: Regen +20% Bromelia, Schnee +20% Frostkamm-Pflanzen
5. Performance-Pass: Map-Tile-Render via Phaser-Tilemap statt Image-Sprite pro Tile
6. Theo-Tausch-Modus in Verdanto NPC (Item-fuer-Item statt Coin)
7. Crossing-UI Click-Click-Modus statt nur C-Hotkey
8. Build, Test, Push, Brain-Update, Slack, Devlog #4 (in S-10)

## Tasks
### Spec-Phase
- [ ] design/dialog_choices.md V0.1 (Choice-System Spec)
- [ ] design/seasons.md V0.1 (Tile-Variations + Encounter-Modifier)

### Code-Phase
- [ ] DialogBox V2 mit Choice-Buttons und Branch-Logic
- [ ] Iris-Dialog-Tree mit Story-Choices
- [ ] NPC-Animation-System (4-Frame-Walking pro Richtung)
- [ ] Saison-Tile-Overlay-Layer in OverworldScene
- [ ] Wetter-Encounter-Modifier in OverworldScene.encounter-trigger
- [ ] Phaser-Tilemap Migration (Performance)
- [ ] Theo-NPC mit Trade-Modus in Verdanto-Map
- [ ] GardenScene-Cross-Click-Logic auf PlantCard

### QA und Release
- [ ] Self-Test-Loop nach jedem Push
- [ ] Live-Browser-Test gegen Netlify-Deploy
- [ ] Slack-Update bei jedem Milestone

## Naechster Sprint S-10 (Plan)
- Story-Akt-2 (Verdanto Boss-Battle Captain Schimmelpilz spielbar)
- Iris-Cameos in mehreren Maps
- Day-Night-Encounter-Modifier (nokturne Pflanzen nur Nacht)
- Festival-System V0.1 (4 saisonale Events)

## Risiken
- Phaser-Tilemap-Migration kann viel umkonfigurieren. Mitigation: nur in OverworldScene, GardenScene bleibt
- NPC-Animation braucht Sprite-Multi-Frame: PixelLab generiert 32x32 Single-Frames. Animation via Single-Frame-Tween-Bounce als V0.1-Stand-In

## Tracking
- Slack-DM: D0ATT08EPU2
- Branch: direkt main fuer kleine Fixes, feature-branches fuer groessere Features
