# Seed-Acquisition V0.2 (Pokemon-Style Foraging)

Erweitert die V0.1-Spec um klassische Pokemon-Mechaniken: Berry-Trees, Battle-Drops, Hidden-Items, Berry-Master-NPC, Wandering Trader. Inspiration: Pokemon-Emerald (Hoenn-Region) wo Beeren ueber 6+ Wege gewonnen werden.

## 8 Wege zu Pflanzen-Samen

| # | Mechanik | Frequenz | UX-Trigger |
|---|----------|----------|------------|
| 1 | Wild-Capture (existing) | per Battle | Battle gewinnen + Capture |
| 2 | Crossing (existing) | per Action | 2 Adult-Pflanzen kreuzen |
| 3 | Bloom-Cycle-Drops (existing) | 30min Cycle | Eigene Pflanze ernten |
| 4 | Markt-Daily-Roster (V0.1) | taeglich | NPC-Anya kaufen |
| 5 | Daily-Login-Reward (V0.1) | taeglich | Modal beim ersten Tag-Login |
| 6 | **Forage-Tiles** (NEU) | per Tile-Interact | Bush/Stumpf-Tile mit E-Taste |
| 7 | **Hidden-Item-Spots** (NEU) | one-shot pro Save | Versteckte Tiles, suchen mit E |
| 8 | **Battle-Drops** (NEU) | per Battle-Win | 25% Chance nach Wild-Sieg |
| 9 | **Berry-Master-NPC** (NEU) | taeglich | NPC in Wurzelheim mit Free-Seed |
| 10 | **Wandering Trader** (V0.3 geplant) | random Spawn | Random-NPC mit seltenen Seeds |

## Forage-Tiles

Pokemon hat "Berry-Trees" auf der Welt-Map (z.B. Route 119 Pecha-Tree). In Plantinvasion fuegen wir vergleichbare Tiles ein:

- **Tile-Index 50**: Berry-Bush (rendert ueber Boden, sieht wie kleiner Bush mit Beeren aus)
- **Tile-Index 51**: Wilde-Pflanze (sieht wie eine wachsende Pflanze aus, gibt Seeds spezifisch zur Region)

Verhalten:
- Tile ist persistent in Map definiert, ca. 3-5 Forage-Tiles pro Biom
- Spieler steht davor, drueckt E
- Pflanze hat Cooldown 1 Real-Time-Stunde nach Loot, dann respawn
- Drop-Pool ist Region-spezifisch:
  - Wurzelheim: common Seeds (sunflower, daffodil, mint)
  - Verdanto: tropical (orchid, fern, heliconia)
  - Mordwald: karnivoren (sundew, pitcher-plant)
  - Magmabluete: pyrophyt (fire-lily, banksia)
  - Frostkamm: alpine (edelweiss, snowdrop)
  - Salzbucht: kuesten (sea-thrift, mangrove)
  - Kaktoria: arid (saguaro, barrel-cactus)

State-Persistenz: `forageTilesCooldown: Record<string, number>` mit Key `<zone>:<x>:<y>` und Wert ms-Timestamp des letzten Loots.

## Hidden-Item-Spots

Pokemon hat versteckte Items unter Tiles ohne visuellen Hinweis (Item-Finder erforderlich). In Plantinvasion machen wir es ein bisschen leichter:

- **5 Hidden-Spots pro Biom** in der Map definiert (Tile-Type bleibt unveraendert, aber Position ist gemerkt)
- Spieler steht auf der Tile und drueckt E (oder geht herum mit aktivem "suchen"-Modus). Wenn er auf einem Hidden-Spot ist, kommt ein Toast "Du findest ein Geheimnis!" und ein Item droppt
- Persistent: einmal-Loot pro Save. State `collectedHiddenSpots: string[]` mit Key `<zone>:<x>:<y>`

Drops sind seltener und besser als Forage:
- 60% Seed (Rarity 3-4)
- 25% Booster-Item (Vulkan-Asche, Sumpf-Pollen)
- 10% Coins (100-300)
- 5% Pristine-Pollen

## Battle-Drops

Nach einem gewonnen Wild-Battle: 25% Chance dass die besiegte Pflanze einen Seed ihrer Spezies droppt. Plus 10% Chance auf 1-3 Coins. Drop-Roll wird in der Battle-Win-Logic ausgefuehrt.

State: kein extra Field, einfach reward in `state.inventory` und Toast.

## Berry-Master-NPC

Pokemon-Emerald hat einen Berry-Master der einmal pro Tag eine zufaellige Beere verschenkt. Wir bauen das in Wurzelheim:

- **NPC**: "Beerenmeister Bertram" in Wurzelheim auf existing Tile-Pos
- Daily-Reward: 1 Seed aus dem capturePlant-discovered-Pool des Spielers (oder Default-Pool)
- Trigger: Spieler talkt zu NPC, wenn `lastBerryMasterAt` >= 24h zurueck, gib Seed
- State: `lastBerryMasterAt: number`

UI: Dialog wie existing NPCs, plus Toast "+1 [seed-name]".

## Wandering Trader (V0.3 geplant, jetzt nur Stub)

NPC mit zufaelligem Spawn auf einer der existing Maps (alle 24h Real-Time wechselt Spawn-Position). Hat 3 seltene Seeds (Rarity 4-5) zu hohen Preisen.

Jetzt nicht implementiert, nur State-Field reserviert: `wanderingTraderSpawn?: { zone: string; tileX: number; tileY: number; spawnedAt: number; inventory: string[] }`.

## Save-Schema-Aenderungen v7 -> v8

Neue State-Felder:
```ts
forageTilesCooldown?: Record<string, number>;     // "zone:x:y" -> ms timestamp
collectedHiddenSpots?: string[];                  // ["zone:x:y", ...]
lastBerryMasterAt?: number;                       // ms timestamp
wanderingTraderSpawn?: WanderingTraderSpawn | null;
```

Migration: empty/null Backfill, kein Datenverlust.

## UI

- Forage-Tile: nutzt Interact-Hint wie existing NPC-Hints (E-Taste-Indicator)
- Hidden-Spot-Discovery: Konfetti-Burst-Animation plus Toast
- Berry-Master: Standard-Dialog
- Wandering Trader: V0.3 mit eigener Shop-Scene

## Verweise
- `src/data/foraging.ts` (NEU): Loot-Pools pro Zone, Forage-Cooldown-Logik
- `src/data/hiddenSpots.ts` (NEU): 5 versteckte Pos pro Biom, Drop-Tabelle
- `src/state/gameState.ts`: forageTile, claimHiddenSpot, claimBerryMaster
- `src/scenes/OverworldScene.ts`: Tile-Type 50/51 Forage-Detection in interactFront, Hidden-Spot-Detection on E-Press
- `src/systems/BattleEngine.ts`: rollBattleDrop in Win-Path
- `src/data/maps/*.ts`: Forage-Tiles + Hidden-Spots in jede Map einbauen
