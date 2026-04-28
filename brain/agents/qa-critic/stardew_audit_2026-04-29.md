# Stardew Vergleichs-Audit – alle 4 Haupt-Scenes
**Datum**: 2026-04-28 (Polish-Run 14)
**Build**: https://plantinvasion.netlify.app
**Referenz**: brain/research/stardew_valley_mechanics.md + visual_inspiration_stardew.md

---

## Score-Tabelle

| Scene | Tile-Variation | Sprite-Detail | UI-Polish | Animation-Smoothness | Color-Palette | **Gesamt** |
|-------|:-:|:-:|:-:|:-:|:-:|:-:|
| MenuScene | 5 | 7 | 6 | 3 | 6 | **5.4** ❌ |
| GardenScene | 6 | 5 | 7 | 5 | 6 | **5.8** ❌ |
| OverworldScene | 9 | 7 | 7 | 7 | 8 | **7.6** ✅ |
| BattleScene | 2 | 3 | 6 | 5 | 4 | **4.0** ❌ |

Legende: ❌ = Score unter 6 (Quick-Win implementiert), ✅ = Score über/gleich 6

---

## MenuScene – Score 5.4

### Beobachtungen
- Hintergrund: Wiederholende Dirt-Tiles mit Grassecken – funktioniert, aber monoton
- Logo-Pflanze oben: Schönes mehrfarbiges Pixel-Art Sprite (pink/weiss/blau)
- Titel "Plantinvasion" in grünem Monospace-Font
- 4 Buttons mit farbigen Borders (grün/gelb/lila/gelb) – gut
- 6 Pflanzen-Sprites unten – alle statisch, keine Bewegung
- Keine Partikel, kein Idle-Animation, kein Feedback wenn man drüber hovert

### Action-Items (prio-sortiert)
1. **[HOCH, Quick-Win ✅]** Idle-Bob-Tween für alle 5 Pflanzen unten (up/down, 1.4s loop) → sofortiger Life-Eindruck
2. **[HOCH]** Titeltext: Schatten/Outline hinzufügen (`stroke: '#2d4a1f', strokeThickness: 4`) + leichtes Glow-Tween (alpha 0.85–1.0)
3. **[MITTEL]** Button-Hover: Scale-Tween 1.0→1.03 bei pointerover, zurück bei pointerout
4. **[MITTEL]** Hintergrund-Vignette: Dunklere Overlay-Ellipse an den Rändern für Tiefe
5. **[NIEDRIG]** Pollen-Partikel-Emitter (3-5 floating dots, alpha tween, sehr subtil)

### Quick-Win implementiert
Idle-Bob-Tween für das Logo-Plant-Objekt (stem/leaf/flower Gruppe) in MenuScene.ts.

---

## GardenScene – Score 5.8

### Beobachtungen
- Grid 3×4 mit variierter Slot-Textur (trocken/nass/moosig) – gute Basis
- Slot 1: Pot mit Sprout – niedlich, lesbar
- Slot 2: Braune T-Form (Stake) – sehr generisch, austauschbar gegen richtiges Seedling
- Leere Slots: Nur dunkle gleichförmige Rechtecke – kein visueller Charakter
- HP-Bars (grün/blau) gut, Tutorial-Tooltip mit Pfeil gut
- Fehlend: Animiertes Wasser in Nass-Slots, Bodenpartikel beim Pflanzen, verschiedene Slot-Farbтöne

### Action-Items (prio-sortiert)
1. **[HOCH, Quick-Win ✅]** Leere Slots mit subtil verschiedenen Erdтönen (nicht uniform), kleine visuelle Muster-Variation per Slot-Index
2. **[HOCH]** Stake-Sprite ersetzen durch echtes Seedling-Sprite (Stage 01_sprout)
3. **[MITTEL]** Nasse Slots: Blaue Overlay-Tile oder Wellenanimation (Tween alpha loop)
4. **[MITTEL]** Pflanz-Aktion: Kurzer Dirt-Partikel-Burst (procedurale Punkte die nach oben fliegen)
5. **[NIEDRIG]** Slot-Hover: Heller Rand wenn Maus drüber (setStrokeStyle 2px grün)

### Quick-Win implementiert
Leere Slot-Farbvariation: Even/Odd-Muster + Position-Hash für unterschiedliche Grün-Braun-Töne pro Slot.

---

## OverworldScene – Score 7.6 ✅

### Beobachtungen
- **Tile-Variation exzellent**: Mehrere Baum-Typen, Gras-Texturen, Schmutzpfade, Wasser/Fluss, Holzböden, Gebäude mit Dächern
- NPCs mit verschiedenen Sprites und Walking-Cycle – lebendige Welt
- Quest-Marker (!) gut sichtbar
- FARM (G) Button top-right – klar und funktional
- Minimap angedeutet (schwarzes Quadrat top-right)
- Fluss mit Wasseranimation und Lily-Pads
- Farb-Palette: Hervorragend – warme Grüns, Holzbraun, Blau-Wasser, Pink/Rot-Akzente

### Action-Items (nice-to-have, kein Quick-Win benötigt)
1. Oval-Schatten unter NPCs und Spielerfigur (gibt Boden-Anchor)
2. Tageszeit-Tint sichtbar als stärkeren Übergang (Morgen goldgelb, Nacht blau)
3. Ambient-Partikel: Blätter/Pollen die durch die Luft schweben
4. Screen-Vignette an Kamera-Rändern (dunkler Overlay)
5. NPC-Namen als kurzer Popup bei Approach (< 2 Tiles Distanz)

---

## BattleScene – Score 4.0 ❌ (Priorität #1)

### Beobachtungen
- **KRITISCH**: Flacher Olive-Grün Hintergrund – keinerlei Textur, kein Arena-Gefühl
- **KRITISCH**: BEIDE Combatanten (Wild + Player) nutzen dasselbe `tile_flowerbed` Sprite – keine optische Unterscheidung
- Horizontale Linie trennt Ober/Unterbereich – nur minimal
- HP-Bars mit Farbwechsel (grün→gelb→rot) gut implementiert
- Move-Buttons zeigen Power/Accuracy – funktional
- Damage-Floater mit Crits und Effectiveness-Label vorhanden
- Keine Entry-Animation für Sprites (kein Slide-In)
- Keine biom-spezifische Arena (Kaktoria sollte Wüste zeigen, Frostkamm Eis)

### Action-Items (prio-sortiert)
1. **[KRITISCH, Quick-Win ✅]** TileSprite-Hintergrund mit `tile_grass` statt flacher Farbe + Wild-Sprite X-Flip
2. **[KRITISCH]** Sprite-Differenzierung: Wild-Sprite grösser (96px) + oben links positioniert wie Pokemon; Player-Sprite unten rechts + kleiner (80px) – "Pokémon-Style Positioning"
3. **[HOCH]** Biom-Hintergrund: poolKey → verschiedene Tile-Textur (tile_cactus für Kaktoria, tile_tropical für Verdanto)
4. **[HOCH]** Entry-Animation: Wild-Sprite slide-in von rechts, Player von links beim create()
5. **[MITTEL]** Move-Button Type-Color: Familie → Farbe (Asteraceae=gelb, Brassicaceae=grün, Cactaceae=orange)

### Quick-Win implementiert
TileSprite-Hintergrund mit `tile_grass` Textur (top=heller, bottom=dunkler) + `setFlipX(true)` auf Wild-Sprite + Separator-Linie.

---

## Gesamt-Prioritäts-Liste (alle Scenes kombiniert)

| Prio | Scene | Item | Impact |
|------|-------|------|--------|
| 1 | BattleScene | Biom-spezifische Hintergründe (tile je poolKey) | Sehr hoch |
| 2 | BattleScene | Pokemon-Style Positioning (wild oben links, player unten rechts) | Sehr hoch |
| 3 | GardenScene | Stake-Sprite → echtes Seedling | Hoch |
| 4 | MenuScene | Titeltext Glow + Pollen-Partikel | Hoch |
| 5 | BattleScene | Entry-Slide-Animationen | Mittel |
| 6 | GardenScene | Nass-Slot Wellenanimation | Mittel |
| 7 | OverworldScene | Oval-Schatten unter NPCs | Mittel |
| 8 | MenuScene | Button-Hover Scale-Tween | Niedrig |
| 9 | OverworldScene | Ambient-Partikel (Blätter/Pollen) | Niedrig |
| 10 | GardenScene | Pflanz-Partikel-Burst | Niedrig |

---

## Quick-Wins Zusammenfassung

3 Scenes unter Score 6 → 3 Quick-Wins implementiert in Polish-Run 14:
- **MenuScene**: Idle-Bob-Tween für Logo-Plant-Gruppe
- **GardenScene**: Visuelle Slot-Variation (Farbton-Hash per Position)
- **BattleScene**: TileSprite-Hintergrund + Wild-Sprite Flip

Commit: `polish(s-polish-14): Stardew-Audit 4 Scenes + 3 Quick-Wins`
