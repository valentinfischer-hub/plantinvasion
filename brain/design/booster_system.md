# Booster-System V0.1 (Wachstums-Optionen)

Ergaenzung zum Growth-System V0.2. Boosters sind Items die Spieler aktiv auf eine Pflanze anwenden um sie zu staerken oder zu beschleunigen. Damit gibt es Skill-Expression beim Item-Management neben der reinen Pflege.

## Design-Ziele
1. **Aktive Pflege belohnen**: Spieler die Items strategisch einsetzen erreichen Pristine-Tier schneller
2. **Wirtschafts-Loop**: Boosters kosten Coins oder werden gefarmt -> Coin-Sink, der den Bloom-Loop ausgleicht
3. **Build-Variety**: verschiedene Booster-Strategien fuer Speedrun (XP-Boost) vs. Quality (Care-Boost) vs. Genetik (Hybrid-Booster)

## Booster-Typen (5 Klassen, je 1-3 Tiers)

### 1. Vulkan-Asche (XP-Booster)
- Effekt: 1.5x XP-Multiplier fuer 1 Stunde Real-Time
- Stack: 1 (kein Stack, neuer Apply ueberschreibt Restzeit)
- Source: Magmabluete-Encounter-Drop, Cinder-NPC kauft/verkauft
- Cost: 50 Coins

### 2. Sumpf-Pollen (Care-Boost)
- Effekt: +50 careScore one-shot bei Anwendung
- Source: Mordwald-Encounter-Drop, Madame Drosera Tausch
- Cost: 75 Coins
- Risiko: Wenn Pflanze schon Adult mit Tier-Snapshot, wirkt es nichts

### 3. Pristine-Pollen (Tier-Upgrade-Chance)
- Effekt: 25% Chance den qualityTier eine Stufe zu heben (one-shot Use)
- Pre-Adult: setzt aktuellen Tier-Pfad einen Schritt nach oben (verlangt mind. Care 30)
- Post-Adult: re-rolled Tier mit +1 Stufe Chance
- Source: Pristine-Tier-Pflanze beim Bloom-Cycle (5% Drop)
- Cost: 200 Coins (selten am Markt)

### 4. Sun-Lamp (Tag-Modus-Persistent)
- Effekt: ignoriert timeOfDay-Multiplier (immer 1.0x) fuer 8 Stunden
- Source: Markt-Spezial, einmal pro Save kaufbar fuer 500 Coins
- Stackbar mit anderen Boostern

### 5. Sprinkler (Auto-Wasser)
- Effekt: Hydration bleibt 24h auf 80%+ ohne manuelles Giessen
- Source: Markt-Tausch fuer 300 Coins plus 1 Karnivoren-Saft
- Stackbar (verlaengert Effekt)
- Care-Score: Sprinkler gibt halbe Care-Bonus wie manuelles Giessen (Spieler soll trotzdem manuell pflegen fuer Tier-Push)

### 6. Hybrid-Booster (Crossing-Tool)
- Effekt: naechste Crossing-Mutation-Chance verdoppelt von 5% auf 10%
- Source: Boss-Drops oder Endgame-Loot
- Cost: nur via Quest erhaeltlich
- Apply: einmal-Use, wirkt auf das nachfolgende Crossing

### 7. Pflanz-Erde-Tiers (Slot-Boost, nicht Pflanze)
Slot-basierte Erweiterung: jeder Garden-Slot hat eine Soil-Tier. Default ist 'normal'. Spieler kann Soil aufruesten:

| Soil-Tier | Effekt | Cost (per slot) |
|-----------|--------|-----------------|
| Normal | 1.0x XP | 0 |
| Bronze | 1.1x XP | 100 Coins |
| Silver | 1.2x XP, +0.05 Mutation-Chance | 300 Coins |
| Gold | 1.3x XP, +0.10 Mutation-Chance, hydration-decay -20% | 800 Coins |

Soil-Tier ist permanent fuer den Slot (nicht uebertragbar). Anreiz: Spieler upgraded Slots schrittweise mit zunehmendem Reichtum.

## Datenmodell

### Plant-Erweiterung
```ts
interface ActiveBooster {
  type: 'xp' | 'sun-lamp' | 'sprinkler';  // nur duration-basierte Booster
  startedAt: number;       // ms
  durationMs: number;
  multiplier?: number;     // bei xp-Booster
}

// In Plant:
activeBoosters: ActiveBooster[];
```

One-shot-Booster (Sumpf-Pollen, Pristine-Pollen, Hybrid-Booster) modifizieren die Pflanze direkt und tauchen nicht in activeBoosters auf.

### Soil-Tier (in GardenSlot)
Garden hat aktuell keinen GardenSlot-Type. Wir erweitern den State:
```ts
interface GardenSlot {
  x: number;
  y: number;
  soilTier: 'normal' | 'bronze' | 'silver' | 'gold';
}
```
GameState bekommt `gardenSlots: GardenSlot[]`. Default: alle 12 Slots tier 'normal'.

## Tick-Anwendung

In `tickPlant()`:
```
let boosterMult = 1.0;
let timeOfDayLocked = false;
for booster in plant.activeBoosters:
  if booster.expired: continue (wird in cleanup entfernt)
  if booster.type === 'xp': boosterMult *= booster.multiplier
  if booster.type === 'sun-lamp': timeOfDayLocked = true
  if booster.type === 'sprinkler': hydration = max(hydration, 80)

if timeOfDayLocked: tod = 1.0
xpPerSec *= boosterMult
```

Soil-Tier-Bonus wird ueber den Slot ermittelt (gardenSlots-Lookup) und als Faktor draufmultipliziert.

## UI-Konzept (GardenScene Detail-Panel)

```
[Sprite]  Sunflower
          Helianthus annuus
Stage: Adult, Level 32, Tier Quality

Hydration: 78% (gut)
XP/s: 4.20

Active Boosters:
  - Vulkan-Asche: 42 min restant
  - Sun-Lamp: 6h 12min restant

Slot Soil: Silver (1.2x)

[Giessen] [Booster anwenden] [Ernten] [Soil upgraden]
```

Booster-Apply-Button oeffnet Sub-Modal mit verfuegbaren Boostern aus Inventar.

## Daily-Login-Reward (NEU)

Jeden Tag (Real-Time-Tag, Local-Storage-Track) gibt's eine zufaellige Belohnung:
- 50% Chance: 50-150 Coins
- 30% Chance: 1 zufaelliger Seed-Item
- 15% Chance: 1 Booster (Vulkan-Asche oder Sumpf-Pollen)
- 5% Chance: 1 Pristine-Pollen

Track via `state.lastDailyLoginAt`. Beim Login pruefen ob >= 24h vergangen.

## Save-Schema-Aenderungen v6 -> v7

Plant-Erweiterung:
- `activeBoosters: ActiveBooster[]` default `[]`

GameState-Erweiterung:
- `gardenSlots: GardenSlot[]` default Array of 12 normal-tiers
- `lastDailyLoginAt: number` default 0

Migration: empty arrays/0 als Backfill, kein Datenverlust.

## Verweise
- Implementation-Pfade:
  - `src/data/items.ts` - neue Item-Definitionen
  - `src/data/leveling.ts` - applyBooster, tickBooster
  - `src/data/boosters.ts` - NEW: Booster-Engine isoliert
  - `src/state/storage.ts` - Migration v6 -> v7
  - `src/scenes/GardenScene.ts` - UI-Anpassungen
  - `src/scenes/MarketScene.ts` - Shop-Integration
