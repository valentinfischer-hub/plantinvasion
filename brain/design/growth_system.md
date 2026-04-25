# Growth System V0.2 (Aufwachsystem)

Spec der Pflanzen-Wachstums-Mechanik fuer Plantinvasion. Loest die V0.1-Implementation in `src/data/leveling.ts` ab, behaelt aber die Stage-Schwellen kompatibel.

## Design-Ziele

1. **Cozy-Loop**: Kurze taegliche Pflege fuehrt zu sichtbarem Fortschritt. Nichts darf "verloren" gehen wenn man 1-2 Tage nicht spielt, aber kontinuierliche Pflege wird belohnt.
2. **Skill-Expression**: Erfahrene Spieler koennen durch optimales Biom-Match plus Pflege-Streak eine Pflanze im selben Zeitraum zu hoeherer Qualitaet bringen als Casuals.
3. **Sammler-Tiefe**: Quality-Tier macht jede Pflanze "einzigartig" und gibt Pokedex-Sammler-Zielen Granularitaet (Common-Sunflower vs. Pristine-Sunflower).
4. **Wirtschafts-Loop**: Blooming-Pflanzen produzieren regelmaessig Output, der gegen Coins oder Items getauscht werden kann.
5. **Hybriden-Reward**: Kreuzungen sollen sich lohnen ueber den Stat-Roll hinaus, daher Hybrid-Vigor-Bonus auf Wachstum.

## Stage-System (kompatibel mit V0.1)

| Stage | Name      | Level-Trigger | Sprite-File    | Bedeutung |
|-------|-----------|---------------|----------------|-----------|
| 0     | Seed      | 1             | 00_seed.png    | Soeben gepflanzt, kein Battle-Einsatz moeglich |
| 1     | Sprout    | 5             | 01_sprout.png  | Erste Battle-Eignung, niedriges Stat-Cap |
| 2     | Juvenile  | 15            | 02_juvenile.png| Volle Stats, kann Items lernen |
| 3     | Adult     | 30            | 03_adult.png   | Kreuzungsreif, max. Battle-Power |
| 4     | Blooming  | 45            | 04_blooming.png| Produziert Output (Samen, Coins) |

Schwellen unveraendert um Save-Compat zu wahren.

## XP-Gain Formel V0.2

Passiver XP-Gain pro Sekunde wird durch Multiplikatoren skaliert:

```
xpPerSec = BASE_XP_PER_SEC
         * stageMultiplier(stage)
         * hydrationMultiplier(hydration)
         * biomeMatchMultiplier(species, currentBiome)
         * hybridVigorMultiplier(plant)
         * timeOfDayMultiplier(hour)
```

### BASE_XP_PER_SEC = 2.0
Bleibt wie V0.1.

### stageMultiplier
- Seed (0):     1.5x  (anfangs schnell, "Aufwachen")
- Sprout (1):   1.2x
- Juvenile (2): 1.0x
- Adult (3):    0.8x
- Blooming (4): 0.5x  (Endgame, langsam)

Das gibt Anfangs-Boost und sanftes Tail-Off ohne harte Caps.

### hydrationMultiplier
Pflanze hat einen Hydration-Wert 0-100. Sinkt linear pro Sekunde. Wassergiessen fuellt sofort auf 100.

```
hydration -= DEHYDRATION_PER_SEC * dtSec
DEHYDRATION_PER_SEC = 100 / (12 * 3600)  // 12 Stunden bis voll trocken
```

| Hydration | Status        | xp-Multiplier | Visual         |
|-----------|---------------|---------------|----------------|
| 80-100    | Saftig        | 1.25x         | blauer Tropfen |
| 50-80     | Gut           | 1.0x          | kein Icon      |
| 25-50     | Durstig       | 0.6x          | gelber Tropfen |
| 5-25      | Trocken       | 0.2x          | oranges !      |
| 0-5       | Vertrocknet   | -0.1x (Stage-Down-Risk) | rotes !! |

Loest die binaere isNeglected-Check ab, kontinuierliche Skala statt Schwelle.

### biomeMatchMultiplier
Jede Spezies hat ein bevorzugtes Biom. Im richtigen Biom gibt's einen Bonus, im falschen Biom (z.B. Kaktus im Sumpf) eine Strafe.

| Species          | Preferred Biome | Wrong Biome    |
|------------------|-----------------|----------------|
| sunflower        | wurzelheim, verdanto | -            |
| spike-cactus     | kaktoria        | mordwald (-30%) |
| venus-flytrap    | mordwald        | kaktoria (-30%)|
| lavender         | wurzelheim      | salzbucht      |
| tomato-plant     | wurzelheim, verdanto | -          |

- Im **preferred** Biom: 1.4x
- In **neutralem** Biom (Garden Wurzelheim als Default): 1.0x
- Im **wrong** Biom: 0.7x

Im Garden in Wurzelheim ist alles neutral, im Outdoor-Plot von z.B. Kaktoria gibt's Boni. (Outdoor-Pflanzbeete sind S-09 Feature, V0.2 nutzt nur Wurzelheim-Garden = neutral.)

### hybridVigorMultiplier
Kreuzungen erste Generation: 1.25x. Mutationen zusaetzlich +0.15x. Folgegenerationen: 1.1x. Reine Wild-Captures: 1.0x.

```
if isMutation:    1.40x
elif F1 hybrid:   1.25x
elif F2+ hybrid:  1.10x
else:             1.0x
```

### timeOfDayMultiplier
Game-Tag (in V0.5 spaeter, aktuell Real-Time):
- 06:00 - 18:00: 1.0x (Tag)
- 18:00 - 22:00: 0.7x (Daemmerung)
- 22:00 - 06:00: 0.4x (Nacht, Photosynthese ruht)

Ausnahmen: Mondblueher-Spezies (S-09+) drehen die Kurve um.

## Quality-Tier-System (NEU)

Beim Erreichen von Adult (Stage 3, Level 30) kriegt jede Pflanze einen permanenten Quality-Tier zugewiesen, basierend auf der Pflege waehrend des Wachsens.

### Care-Score-Berechnung
Waehrend der Pflanze wird ein careScore akkumuliert:

```
careScore +=
   waterEvents * 1.0          // jede manuelle Bewaesserung
 + perfectWaterStreak * 2.0   // wenn Hydration nie unter 50% fiel
 + biomeMatchTime * 0.001     // Sekunden im preferred Biom
 - dryEvents * 5.0            // jede Phase Hydration < 5%
```

### Tier-Grenzen (Snapshot bei Adult-Stage)
| Tier      | careScore | Farbe       | Multiplikatoren beim Verkauf |
|-----------|-----------|-------------|------------------------------|
| Common    | < 30      | weiss       | 1.0x Coins                   |
| Fine      | 30-79     | gruen       | 1.4x                         |
| Quality   | 80-149    | blau        | 1.8x                         |
| Premium   | 150-249   | violett     | 2.5x                         |
| Pristine  | 250+      | gold        | 4.0x                         |

Tier ist nach Adult fix, kann nicht mehr verbessert werden. Gibt Anreiz fuer Pflege bis Stage 3.

## Harvest-Loop (Blooming, NEU)

Sobald eine Pflanze Blooming (Level 45) erreicht, produziert sie alle 30 Min einen "Bloom-Cycle":

```
bloomOutput = 1 Samen der gleichen Spezies (50% Chance)
            + (1 + tier) Coins
            + 0.5% Mutation-Sample (eigene neue Mutation)
```

Spieler muss aktiv ernten via Detail-Panel "Ernten" Button. Nicht geerntet = 1 Output-Cap, dann pausiert die Produktion bis zur Ernte (Slot-Lock-Mechanik wie Stardew).

Nach Ernte kehrt die Pflanze auf Adult-Stage zurueck (Level fix, Stage Visual zurueck), waechst dann wieder zu Blooming. Re-Bloom dauert 1 Stunde Real-Time.

Pristine-Tier produziert ausserdem 5% Chance pro Bloom auf Pollen-Items (Crafting-Material fuer Future-Mechaniken).

## Stage-Down (Schaden bei totaler Vernachlaessigung)

Aktuell V0.1: Level kann via negative XP fallen, aber kein klares Visual.

V0.2: Wenn Hydration 24h+ am Stueck unter 5% (Vertrocknet), kann die Pflanze einen Stage zurueckfallen mit klarem Roll:
- Pro Stunde unter Schwelle: 5% Stage-Down-Roll, max. einmal pro 2h
- Stage kann nie unter 0 fallen (Seed bleibt)
- Bei Stage-Down: Plant-Visual flackert rot, Notification "Deine [Name] ist verkuemmert"
- Ueberlebenstrick: Sofortiges Wassergiessen stoppt den Decay

Schwacher Penalty-Loop, aber spuerbar genug dass aktive Spieler aufpassen.

## Save-Schema-Aenderungen (v5 -> v6)

Neue Plant-Felder mit Default-Migration:
```ts
hydration: number;          // 0-100, default 100
careScore: number;          // 0+, default 0
qualityTier?: 'common' | 'fine' | 'quality' | 'premium' | 'pristine';  // gesetzt bei Adult
generation: number;         // 0 fuer Wild-Capture/Starter, 1 fuer F1, 2 fuer F2+
lastBloomedAt?: number;     // ms timestamp letztes Bloom-Cycle-Reset
pendingHarvest: boolean;    // true wenn Bloom-Output bereit
nightTimeXpAccum: number;   // Tracking fuer time-of-day-Bonus
```

Alte Saves migrieren mit:
```
hydration = 100  (frische Frische)
careScore = 0    (kein Backfill, Spieler startet bei 0)
generation = isMutation ? 1 : (parentAId ? 1 : 0)
pendingHarvest = false
```

## UI-Hinweise (GardenScene)

- Hydration-Bar (5px hoch) unter XP-Bar, blau-gelb-rot Gradient
- Quality-Stars (1-5) im Detail-Panel als gefaerbte Punkte
- Bloom-Glow + Pulse-Tween wenn pendingHarvest=true
- Stage-Up Confetti-Burst (Phaser ParticleEmitter) wenn neues Stage erreicht
- Care-Score live im Detail-Panel sichtbar (Spieler sieht "31 / 80 zur naechsten Tier")

## Balance-Annahmen

- Casual-Spieler (1x Wassern pro Tag): Adult in ca. 5-7 Tagen, Common/Fine Tier
- Aktiv (3x Wassern pro Tag, optimaler Biom-Match): Adult in 3 Tagen, Quality bis Premium
- Hardcore (Hybriden mit Mutation, optimaler Biom): Adult in 2 Tagen, Pristine bei perfekter Pflege

Re-Bloom-Cycle 1h gibt 24 Bloom-Cycles pro Tag bei kontinuierlicher Ernte = stabiler Coin-Strom fuer Spieler die taeglich loggen.

## Out-of-Scope V0.2 (geplant V0.3+)

- Saisons (Fruehling, Sommer, Herbst, Winter) als Wachstums-Modifier
- Schaedlinge und Krankheiten
- Duenger-Items als Wachstums-Beschleuniger
- Bonsai-Mechanik (Adult-Pflanzen die nie Blooming erreichen, dafuer hoeheren Battle-Stat-Cap)
- Outdoor-Pflanzbeete in jedem Biom (S-09)
- Photosynthese-Sonnenlicht-Mechanik mit Tile-Beleuchtung

## Verweise
- Implementation: `src/data/leveling.ts`, `src/types/plant.ts`
- UI: `src/scenes/GardenScene.ts`
- Save-Migration: `src/state/storage.ts`
- Decisions: D-019 (Growth-V0.2 eingefuehrt)
