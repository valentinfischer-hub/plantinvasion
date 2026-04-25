# Biom: Mordwald (Karnivoren-Sumpf)

## Vibe und Konzept
Dunkler, dampfender Sumpfwald mit fleischfressenden Pflanzen. Atmosphaere zwischen Louisiana-Bayou und Tropischem-Sumpf. Wuerdiger Kontrast zum hellen Verdanto. Spieler braucht hier mentale Vorsicht: viele Pflanzen sind aggressiv, Encounter-Rate hoch.

Lore-Anker: Mordwald ist die Heimat der gefaehrlichsten karnivoren Pflanzen. Lokale NPCs erzaehlen von verschwundenen Botanikern. Fuer Verodyne-Konzern war Mordwald ein Tabu-Gebiet das jetzt durch das Gift der Konzerne unkontrolliert waechst.

## Tile-Aesthetik
- **Boden**: dunkles moorgruenes Erdreich mit braunen Patches
- **Wasser**: stehende Sumpf-Tiles (truebes Olivgruen, leicht animiert mit Bubble-Particles)
- **Baeume**: alte Suempfeichen mit haengenden Spanish Moss-Strangen
- **Atmospheric Effects**: Nebel-Overlay im Vordergrund, gelegentliche Schwarmlichter (Kobold-Lichter)
- **Tile-Palette**: 4 Boden-Tiles, 3 Wasser-Tiles, 3 Baum-Tiles, 2 Felsen-Tiles

## Encounter-Pool (5 Pflanzen)
Alle echten karnivoren Pflanzen nach D-008 Botanik-Strenge.

| Slug | Wissenschaftlich | Common | Rarity | Stat-Bias | Pref-Biom | Falsches Biom |
|------|------------------|--------|--------|-----------|-----------|---------------|
| sundew | Drosera capensis | Sundew | 3 | atk +15 / def -5 / spd +5 | mordwald, verdanto | kaktoria, frostkamm |
| pitcher-plant | Nepenthes attenboroughii | Pitcher Plant | 4 | atk +10 / def +20 / spd -15 | mordwald | kaktoria |
| cobra-lily | Darlingtonia californica | Cobra Lily | 4 | atk +20 / def +5 / spd -5 | mordwald | salzbucht |
| bladderwort | Utricularia vulgaris | Bladderwort | 2 | atk +5 / def -10 / spd +25 | mordwald, verdanto | frostkamm |
| corpse-flower | Amorphophallus titanum | Corpse Flower | 5 | atk +25 / def +15 / spd -20 | mordwald, verdanto | frostkamm, kaktoria |

Encounter-Frequenz: Hoch (12% pro Schritt). Wild-Levels: 18-32. Hoechste Rarity-Konzentration ausser Endgame.

### Spezial-Encounter
- **Corpse Flower** spawnt nur bei Nachts (timeOfDay 22-06) als seltener "Boss-Encounter" mit Level 35-45.

## NPC-Konzept
- **Madame Drosera**: alte Sumpf-Hexe, lebt in einer Baumstamm-Huette. Tausch-NPC fuer rare Karnivoren-Items. Quest: bringe ihr Haeute von 5 Bladderworts.
- **Verschollener Botaniker (versteckt)**: Quest-Trigger wenn Spieler tief in den Sumpf vordringt. Findet sein Tagebuch -> Story-Hook fuer Phase 9 Endgame.

## Saisonalitaet
- Mordwald ist immer feucht, kein klares Herbst-Aussehen
- Winter-Variante: leicht ausgedunkelte Farb-Palette plus seltener Encounter
- Pokemon-Outbreaks: bei Vollmond verdoppelt sich Corpse-Flower-Spawn-Rate

## Hitze und Hydration
Mordwald hat hohe Hydration-Gewinn-Rate fuer Pflanzen die dort leben (oder mitgenommen werden). Wenn der Spieler eine Pflanze in Mordwald-Plot pflanzt (S-09), bekommt sie +20% passive Hydration-Regeneration.

## Sub-Region: Schwefelteich
Sub-Tile-Cluster im Norden mit gelblichem Wasser. Spawn-Pool fuer eine besondere Mutation der Sundew (Sulfur-Sundew) als Easter-Egg fuer ambitionierte Spieler. Stat-Bias: atk +25 / def +0 / spd +0, Rarity 5.

## Items im Loot-Pool
- Sumpf-Pollen (Crafting-Material)
- Karnivoren-Saft (Heal-Item, +30% HP fuer eine Battle)
- Moor-Knospe (Lure-Item, +50% Encounter-Rate fuer 1 Min)
- Vergessene Notiz (Story-Trigger)

## Boss-Konzept "Wurzel-Lord Drosera Imperialis"
- Level 50 Boss im inneren Sumpf
- Rare Encounter, einmal pro Save spawnbar via Quest-Trigger
- Drop: einzigartige "Drosera-Krone" als Wishlist-Trophaee
- Battle-Mechanik: Multi-Phase mit Status-Effekten (Wurzel-Fessel = Spd auf 0)

## Tile-Render-Implementation (Tech-Hinweis)
Mordwald hat ca. 600 Tiles in der Map. Statt 600 Sprites zu rendern: einmaliges Tilemap-Render-To-Texture beim Scene-Start, dann ein einziges Image als Background. Spart 90% Render-Cost laut Performance-Risiko in S-08.

## Verweise
- Implementation: `src/data/maps/mordwald.ts` (geplant)
- Encounter-Pool: `src/data/encounters.ts` (extend)
- Tile-Drawer: pattern wie `src/assets/proceduralTileset.ts` aber mit Static-Render-Cache
