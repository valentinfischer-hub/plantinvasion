# Pflanzen-RPG-Design-Doc (User-Upload, 2026-04-25)

User-Inspirations-Dokument, abgespeichert als Brain-Research. Quelle: pflanzen_rpg_design.docx. Vergleich mit aktuellem Plantinvasion-Stand und abgeleitete Tasks.

## Quell-Inhalt (Original)

### 1. CORE LOOP
Explore -> Samen finden -> Zuechten -> Optimieren -> Kaempfen -> Ressourcen -> bessere Zucht

### 2. GENETIK-SYSTEM
Jede Pflanze besitzt:
- Basiswerte: HP, Angriff, Wachstum, Energie
- 6 Gen-Slots:
  1. Angriffstyp
  2. Wachstum
  3. Resistenz
  4. Utility
  5. Mutation
  6. Form
Vererbung:
- 70% Eltern
- 20% Variation
- 10% Mutation
Zusatz:
- Dominante / rezessive Gene
- Hidden Traits

### 3. ZUCHT-PIPELINE
- Auswahl von 2 Pflanzen
- Kreuzung -> Samen
- Wachstum beeinflusst durch Wasser, Licht, Boden, Klima

### 4. LEVEL & EVOLUTION SYSTEM
- Level 1-5: Basisphase
- Level 5: erster Skill, erste Spezialisierung
- Level 15: Passive Faehigkeit
- Level 30: Hybrid Builds
- Level 45: Ultimate Faehigkeit, seltene Mutation aktiv

### 5. KAMPFSYSTEM
Rollen: DPS, Tank, Support, Control
Mechanik: Grid-basiert, 1 aktiver Skill, 1 passiver Skill, 1 Ultimate

### 6. MUTATION SYSTEM
Arten: Stat / Skill / Form / Legendary
Trigger: RNG / Umwelt / Events

### 7. BIOME
Wueste, Sumpf, Eis - Stat-Boosts und Skill-Veraenderungen

### 8. META SYSTEM
Zuchtlinien, seltene Kombinationen, Ressourcenoekonomie

### 9. RISIKO
Tod, negative Mutationen, Pflegefehler

### 10. DETAIL: GEN EXPRESSION
Gene werden durch Umwelt aktiviert/deaktiviert
- Viel Wasser -> Growth Gene aktiv
- Trockenheit -> Resistenz Gene aktiv

### 11. DETAIL: HYBRIDISIERUNG
Ab Level 30:
- Kombination von 2 Pflanzenarten
- Neue Skills entstehen
- Visuelle Transformation

## Gap-Analyse (Was da, was fehlt)

| Bereich | Aktueller Stand | Gap zur Spec |
|---|---|---|
| Core-Loop | komplett (Explore-Samen-Zuechten-Battle-Coins) | erfuellt |
| Stats | atk/def/spd | Spec will HP/Angriff/Wachstum/Energie - HP haben wir in Battle, Wachstum=XP, Energie fehlt als Plant-Stat |
| Gen-Slots | implizit via geneSeed-RNG | 6 explizite Slots fehlen komplett |
| Vererbung 70/20/10 | crossStats nutzt 50/50 plus Mutation-Roll | nicht 70/20/10-konform |
| Dominante/rezessive Gene | nicht vorhanden | komplett fehlend |
| Hidden Traits | nicht vorhanden | komplett fehlend |
| Wachstum durch Umwelt | Hydration plus Biom-Match plus Soil plus Sun-Lamp plus Sprinkler | erfuellt - wir haben sogar mehr |
| Level-Schwellen 5/15/30/45 | exakt diese | erfuellt |
| Skills/Ultimate | Battle-Moves V2 (4 pro Pflanze) | Ultimate-Slot fehlt explizit, aber implementiert via einzelne Move-Slots |
| Battle-Rollen DPS/Tank/Support/Control | implizit via stats | nicht angezeigt im UI |
| Mutation-Arten Stat/Skill/Form/Legendary | nur Stat-Mutation | 3 weitere Arten fehlen |
| Trigger RNG/Umwelt/Events | nur RNG plus Soil/Recipe/Hybrid-Booster | Event-Trigger fehlt, Umwelt teilweise |
| Biome-Stat-Boosts | preferredBiomes/wrongBiomes | erfuellt |
| Tod der Pflanze | nicht vorhanden, nur Stage-Down | komplett fehlend |
| Negative Mutationen | nicht vorhanden | komplett fehlend |
| Pflegefehler-Risiko | Stage-Down nach 24h vertrocknet | erfuellt |
| Gen-Expression Wasser/Trockenheit | nur passiver Mult-Effekt | nicht als "Gen-Aktivierung" angezeigt |
| Hybridisierung Level 30+ | crossPlants ab Level 5+ moeglich | bestaetigte Schwelle weicht ab |
| Visuelle Transformation Hybrid | Hybrid-Sprites mit gemischter Palette | erfuellt |

## Abgeleitete Aktionen (V0.6.7+)

### Sofort umsetzbar
1. **Gen-Slots V0.1**: 6 String-Allel-Slots auf Plant-Type. Crossing-Logik erweitert um Vererbung 70/20/10. Default-Genes bei neuen Pflanzen.
2. **Plant-Role-Tag**: Aus Stats berechnen (atk-dominant=DPS, def-dominant=Tank, spd-dominant=Support, balanced=Control). Anzeige im Detail-Panel.
3. **Mutation-Arten**: Bei Mutation roll-of-4 (Stat/Skill/Form/Legendary). Stat = aktuell. Skill = Battle-Move-Pool-Bonus. Form = visueller Sprite-Tint. Legendary = alle drei plus +20% all stats.
4. **Gen-Expression-Hint**: Hydration > 80 = "Growth-Gene aktiv" Anzeige, < 25 = "Resistenz-Gene aktiv" Anzeige.

### Mittel-fristig (S-09+)
5. **Hidden Traits**: 1 zufaelliges Trait pro Pflanze, bleibt versteckt bis Lvl 30 Adult, dann sichtbar (z.B. "Mond-Bluete: +50% bei Nacht")
6. **Tod-Mechanik V0.2**: Optional-Toggle "Hardcore-Mode" - Pflanze stirbt nach 7 Tagen vertrocknet
7. **Negative Mutationen**: 5% Roll bei Crossing fuer Negativ-Mutation (-stats, schlechterer Tier)
8. **Battle-Rollen-Spezifische Skills**: Tank-Pflanzen kriegen Defense-Buff-Move, DPS bekommen Critical-Strike

### Langfristig (Phase V1+)
9. **Echte Energie-Stat**: Plant.energy 0-100, sinkt bei Battle, regen mit Items
10. **Event-Trigger fuer Mutation**: Saison-Events, Mond-Phasen, Vulkan-Eruption als Mutation-Auslöser
11. **Skill-Trees pro Stage-Up**: Lvl 5/15/30/45 = waehlbarer Skill-Pfad

## Verweise
- Original: assets/uploads/pflanzen_rpg_design.docx (User-Upload 2026-04-25)
- Implementation-Pfade: src/types/plant.ts (genes), src/data/genetics.ts (Vererbung), src/state/gameState.ts (crossPlants)
- Decisions zu erstellen: D-026 Gen-Slots-System
