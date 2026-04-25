# Endgame V0.1

## Konzept
Nach 8 Biomen (Wurzelheim, Verdanto, Kaktoria, Frostkamm, Salzbucht, Mordwald, Magmabluete, Glaciara) und ca. 60-80h Spielzeit erreicht der Spieler das Endgame. Hier eskaliert die Geschichte: Verodyne, der Konzern der die Pflanzenwelt vergiftet hat, wird zum finalen Antagonisten. Dazu gibt es eine versteckte 9. Region "Eden Lost", die nur ueber Mythical-Pflanzen erschlossen werden kann.

## Endgame-Loop (Spielziel nach Story-Abschluss)
1. **Pokedex-Vervollstaendigung**: alle 200 Spezies plus 30 Mythical-Forms entdecken
2. **Pristine-Tier-Sammlung**: jede Spezies einmal als Pristine-Tier zuechten
3. **Verodyne-Boss-Wiederholung**: jeden Monat respawnt Verodyne mit hoeheren Stats und einzigartigen Drops
4. **Eden-Lost-Erkundung**: 5 Mythical-Encounter, Achievements, Hidden-Lore

## Mythical-Pflanzen (15 Spezies, V0.1)

Mythical sind nicht ueber normales Encounter findbar. Sie spawnen nur durch Bedingungen die Endgame-Engagement belohnen.

| Slug | Common | Trigger | Stat-Bias | Visual-Hinweis |
|------|--------|---------|-----------|----------------|
| moonflower | Mondblume | Crossing Lavender + Lily bei Vollmond, Tier Premium+ | atk +30 / def +10 / spd +20 | Glow-bei-Nacht |
| sunpetal | Sonnenblatt | Sunflower Pristine bei Sommer-Mittag in Magmabluete | atk +20 / def +20 / spd +20 | gold-Pulse |
| ghost-orchid | Geister-Orchidee | Mordwald Quest "Verschollener Botaniker" | atk +25 / def +5 / spd +30 | semi-transparent |
| obsidian-rose | Obsidian-Rose | Magmabluete Phoenix-Brand-Same anbauen, Pristine | atk +35 / def +25 / spd +0 | schwarz-Glanz |
| frost-bloom | Frost-Bluete | Frostkamm Glaciara-Boss-Drop, anpflanzen, 7 Tage perfekte Pflege | atk +5 / def +35 / spd +20 | Eis-Aura |
| crystal-cactus | Kristall-Kaktus | Cactus Pristine in Kaktoria 30 Tage in Folge gepflegt | atk +10 / def +40 / spd -10 | facetiert |
| time-tree | Zeit-Baum | Cross 5 verschiedene Hybriden-Generationen ineinander | atk +20 / def +30 / spd +25 | dunkler Stamm + helles Laub |
| salt-lily | Salz-Lilie | Salzbucht Mutation gefunden bei Sturm-Wetter | atk +15 / def +20 / spd +15 | weiss-blaeulich |
| nebula-fern | Nebel-Farn | Eden-Lost Region | atk +25 / def +15 / spd +30 | Sterngewebe |
| chrono-rose | Chrono-Rose | Eden-Lost Region | atk +20 / def +20 / spd +30 | wechselt Farbe je Tageszeit |
| void-pitcher | Void-Krug | Eden-Lost Region | atk +35 / def +20 / spd +10 | Anti-Light |
| eternal-bonsai | Ewige-Bonsai | 100h Spielzeit erreicht | atk +25 / def +25 / spd +25 | klein, alt, weise |
| singularity-bloom | Singularitaets-Bluete | Verodyne-Boss 5x besiegt | atk +40 / def +25 / spd +15 | schwarzes Loch |
| genesis-seed | Genesis-Same | Story-Abschluss | atk +30 / def +30 / spd +30 | Welten-Baum |
| invasion-pollen | Invasions-Pollen | Pristine-Sammlung 200 Spezies komplett | atk +50 / def +50 / spd +50 | leuchtet golden |

Mythical-Pflanzen haben **kein Quality-Tier** (sind immer effectively Pristine plus 1, kosmetisch "Mythical" gefaerbt).

## Verodyne-Boss-Design

### Lore
Verodyne ist der CEO eines Bio-Tech-Konzerns der jahrzehntelang Pestizide entwickelt hat die Pflanzenwelt zerstoeren. Er hat sich selbst mit Pflanzen-DNA modifiziert und ist jetzt halb Mensch, halb invasive Pflanzen-Hybride. Boss-Battle ist die finale Konfrontation.

### Battle-Setup (V0.1)
- Trigger: Story-Quest 9 abschliessen plus alle 8 Biom-Bosse besiegen plus 5 Pristine-Pflanzen im Garden
- Setting: zerstoerter Verodyne-Konzern-HQ mit invasiven Wurzeln durch die Architektur
- Battle-Format: 6vs6 Multi-Phase-Battle, einzige Stelle wo Spieler 6 Slots nutzt (nicht 3 wie sonst)

### Phasen
1. **Phase 1: Konzern-Verodyne (Level 60)**
   - 4 Slots, Stat-Pattern wie Glass-Cannon
   - Item-Use: Wurzelfessel auf Spieler, Spd 0
   - HP: 3000

2. **Phase 2: Hybrid-Verodyne (Level 70)**
   - 5 Slots, Pflanzen-Mensch-Hybrid mit Karnivoren-Eigenschaften
   - Item-Use: Photosynthese-Heal (heilt sich selbst alle 3 Runden)
   - HP: 4500

3. **Phase 3: Eden-Verodyne (Level 80)**
   - 6 Slots, voll mutiert
   - Item-Use: Saatregen (alle Slots gleichzeitig 100 Damage)
   - HP: 6000
   - Visual: Spieler kaempft umringt von Mythical-Aura

### Drops
- Garantiert: 1 "Verodyne-Krone" (Achievement-Trophaee)
- Garantiert: 1 zufaellige Mythical-Pflanze aus dem Pool
- Random: 5% "Singularitaets-Bluete" (siehe oben)
- Bei Pristine-Strategy-Win (kein KO der eigenen Pflanzen): exklusives Achievement "Botaniker-Master"

### Wiederholung
Verodyne respawnt jeden Monat (Real-Time, 30 Tage). Beim 5. Sieg: "Singularity-Bloom" garantiert.

## Eden-Lost (Hidden Region)

### Konzept
Versteckte 9. Region. Erreichbar erst nach Verodyne-Boss-Sieg plus 3 Mythical-Pflanzen im Pokedex. Visualisiert als "Realm Outside Time". Tile-Aesthetik: schwebende Inseln im violetten Nebel, Sternen-Hintergrund, friedliche Atmosphaere.

### Inhalt
- 5 exklusive Mythical-Spawns (siehe Tabelle)
- 1 NPC "Hueter des Eden": gibt finale Quests
- Mini-Boss "Schatten-Verodyne": echo des Bosses, wiederholbar fuer Drops
- Achievement-Wall: physische Trophaeen-Display fuer 100% Erfolge

### Mechanik-Hinweise
- Time flows differently: Hydration-Decay 50% slower
- Bloom-Cycle 50% schneller (Endgame-Wirtschafts-Hub)
- Keine Battles ausser Mini-Boss

## Achievement-System V0.1

| Achievement | Trigger | Reward |
|-------------|---------|--------|
| Erste Bluete | Erste Pflanze Stage Blooming | +500 Coins |
| Pristine-Pflueger | Erste Pristine-Pflanze | Cosmetic Plant-Border in Garden |
| Hybrid-Architekt | 10 erfolgreiche Crossings | Crossing-Cost -25% |
| Wirbelsturm | 10 Mutationen | Cosmetic Mutation-Glow |
| Kaktus-Buende | 5 Pristine Cacti | Special Sprite-Frame |
| Sumpf-Veteran | Mordwald Boss besiegt | Madame Drosera bietet Premium-Trades |
| Vulkan-Bezwinger | Magmabluete Boss besiegt | Asche-Duenger 50% Discount |
| Welten-Reisender | Alle 8 Biome besucht | Karten-Schnellreise unlock |
| Sammler | 100 Spezies entdeckt | Bonus Garden-Slot |
| Vollendung | 200 Spezies entdeckt + 30 Mythical | Statue im Heimatdorf |

Achievements werden in `state.achievements` gespeichert (Array of slugs) und im Pokedex-Tab angezeigt.

## Save-Schema-Aenderung fuer Endgame
v6 -> v7 wird hinzufuegen:
- `achievements: string[]`
- `mythicalUnlocks: string[]`
- `verodyneDefeated: number` (Anzahl Defeats)
- `edenAccess: boolean`

Migration: alle Felder default auf empty/false/0.

## Out-of-Scope V0.1 (geplant V0.2)
- Procedural Quest-Generator fuer Endlos-Loop
- New-Game-Plus mit globalen Stat-Boosts
- Online-Leaderboard fuer schnellste Pristine-Sammlungen
- Saisonale Events mit zeitlich begrenzten Mythical-Encounter

## Verweise
- Battle-System Erweiterung: `brain/design/battle_system.md` -> Multi-Phase-Boss-Section
- Save-Schema-Update: `brain/tech/save_system.md` v6 -> v7 (geplant Phase 9)
- Boss-Implementation: `src/scenes/BossBattleScene.ts` (Phase 9)
