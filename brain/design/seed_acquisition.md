# Seed-Acquisition-System V0.1

Wege wie der Spieler an neue Pflanzen-Samen kommt. Ergaenzt das bisherige Capture-und-Crossing-System um einen oekonomischen Pfad.

## Ueberblick: 6 Wege zu neuen Pflanzen

1. **Wild-Capture** (existing): Battle gewinnen, capturePlant fuegt zu Garden hinzu
2. **Crossing** (existing): zwei Adult-Pflanzen kreuzen, Cost 50 Coins, Mutation-Chance 5%
3. **Bloom-Cycle-Drops** (Growth-V0.2 already): 50% Chance Samen aus eigenem Bloom
4. **Markt-Shop** (NEU): Daily-Roster mit 5 zufaelligen Seeds, rotiert taeglich
5. **Quest-Rewards** (NEU): Quests koennen Seeds als Belohnung haben
6. **Daily-Login-Reward** (NEU): 30% Chance auf einen zufaelligen Seed beim taeglichen Login
7. **Wandering-Trader** (Phase 9): zufaelliger NPC der seltene Seeds verkauft

## Seeds als Items

Seeds sind Inventory-Items mit slug `seed-<species>`, z.B. `seed-sunflower`, `seed-pitcher-plant`. Der Spieler kann sie via "Pflanzen"-Action im Garden-Detail einsetzen. Effekt: Erstellt eine neue Plant Stage 0 in einem freien Slot.

Vorteile gegenueber Capture:
- Kein Battle-Risiko
- Plant kann frische Stats rollen (zur richtigen Saison/Biom-Match)
- Sammler-Komplettierung ohne Battle-Grind

## Markt-Shop-Spec

NPC: Anya (existing Wurzelheim-Markt-NPC) erweitert.

Shop-Inventar wird taeglich (24h Real-Time) rotiert:
- 5 Seeds aus dem Pool aller bisher entdeckten Spezies (capturePlant-discovered)
- 1-2 Booster-Items
- Soil-Upgrade-Verkauf permanent

Seed-Preise abhaengig von Spezies-Rarity:
| Rarity | Cost |
|--------|------|
| 1 (Common) | 30 Coins |
| 2 | 60 Coins |
| 3 | 120 Coins |
| 4 | 250 Coins |
| 5 (Mythical-Adjacent) | 600 Coins |

## Quest-Rewards (NEU)

Bestehende Quests bekommen erweiterbar Item-Rewards. Beispiele:
- "Bring Anya 3 Sundews" -> Reward: 1 Pitcher-Plant-Seed plus 100 Coins
- "Erkunde Mordwald" -> Reward: 2 Sumpf-Pollen
- "Erste Mutation" -> Reward: 1 Hybrid-Booster

## Daily-Login-Reward

Trigger: Login nach >= 24h Pause. State `lastDailyLoginAt` track. Reward via gewichtetes Roll:
- 50% Chance: 50-150 Coins
- 30% Chance: 1 zufaelliger Seed (aus discovered-Pool)
- 15% Chance: 1 Booster-Item
- 5% Chance: 1 Pristine-Pollen

UI: Bei Game-Start nach Splash-Screen kurzes "Tagesbelohnung" Modal das den Reward zeigt.

## Save-Schema-Anpassung
- `lastDailyLoginAt: number` (default 0, triggert Reward-Modal beim ersten Login)
- `marketShopRosterDay: number` (Tag-Index seit createdAt, default 0)
- `marketShopRoster: { seedSlugs: string[]; boosterSlugs: string[] }` Cache fuer den Tag

Bei Tag-Wechsel wird Roster neu generiert.

## Plant-Stage-0-Einsaeen

Im Garden-Detail-Panel oder Header gibt's einen "Pflanze einsaeen"-Button wenn:
- Mind. 1 freier Garden-Slot verfuegbar
- Mind. 1 Seed-Item im Inventar

Click oeffnet Modal mit Liste aller Seed-Items im Inventar, Auswahl plant die Pflanze in den ersten freien Slot.

Effekt:
- Neue Plant erstellt mit createPlantOfSpecies(slug) Logic
- Stats werden gerollt
- Item wird konsumiert
- Pokedex.captured-Eintrag (falls noch nicht vorhanden)

## Verweise
- `src/data/items.ts` - Seed-Item-Definitionen pro Spezies
- `src/state/gameState.ts` - plantSeedItem(slug), claimDailyReward(), getMarketShopRoster()
- `src/scenes/GardenScene.ts` - Pflanze-einsaeen-Modal
- `src/scenes/MarketScene.ts` - Shop mit Daily-Roster
