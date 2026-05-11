# PixelLab Prompt-Bibliothek — Plantinvasion

**Version:** 1.0 (Art-UI R2, 2026-05-11)
**Owner:** Art-UI Agent
**API-Key:** In .env.local als PIXELLAB_API_KEY
**Balance:** $0.00 (Stand 2026-05-11 — Aufladung nötig vor nächstem Asset-Run)

**Style-Basis für alle Prompts:**
- Pixel Art, 32x32px (NPC/Tiles), 64x64px (Highlights)
- Top-down oblique view (RPG-Vogelperspektive)
- Stardew Valley Farbton: warm, gesättigt, cozy
- Transparenter Hintergrund (no_background: true)
- Outline: schwarz, Shading: medium

---

## NPC-Sprites (32x32px)

### npc_tilda — Tilda Wurzelreich (Grossmutter-Botanikerin)

**Verwendung:** `NPC_SPRITE_KEYS['tilda-grandma']` → aktuell `npc_clara` Platzhalter
**Priorität:** HOCH (FI-Score Tilda-Sprite-Idle 2→4)

```json
{
  "description": "elderly female botanist grandmother, 70 years old, silver-gray hair in a bun secured with a wooden hairpin, warm brown eyes, deep green hooded travelling cloak with botanical embroidery at the hem, leather seed pouch on her belt, gentle smile, short stature, slight hunch from decades of fieldwork, holding a dried sunflower stem as a walking staff, pixel art, 32x32, top-down oblique RPG view, transparent background, Stardew Valley art style, cozy warm palette, visible detail despite small size",
  "image_size": {"width": 32, "height": 32},
  "outline": "black",
  "shading": "medium",
  "detail": "high",
  "view": "top-down oblique",
  "direction": "south",
  "no_background": true
}
```

**Farb-Referenz:**
- Mantel: #3a5a2a (dunkel botanisch grün)
- Haare: #c8c8c8 (silber-grau)
- Haut: #c4956a (warm, mediterran)
- Samen-Beutel: #8a6e4a (Earth Brown)

**Varianten zu generieren:**
1. `npc_tilda_south.png` — Blick nach Süden (Standard-Idle)
2. `npc_tilda_north.png` — Blick nach Norden (beim Weggehen)
3. `npc_tilda_portrait.png` — 64x64, Nahaufnahme für Dialog-Portraits (direction: front)

---

### npc_iris — Iris Salbeyen (Wandernde Forscherin)

**Verwendung:** `NPC_SPRITE_KEYS['iris']` (noch nicht in Registry)
**Priorität:** MITTEL (Akt 2+ Story)

```json
{
  "description": "old wandering female botanist researcher, 65 years old, long flowing gray hair loose over shoulders, round wire-rimmed glasses, simple gray-green traveling robe, gnarled oak wood staff taller than herself, leather satchel overflowing with seed packets and pressed flowers, calm serene expression, barefoot despite long travels, pixel art, 32x32, top-down oblique RPG view, transparent background, Stardew Valley style, cozy palette",
  "image_size": {"width": 32, "height": 32},
  "outline": "black",
  "shading": "medium",
  "detail": "high",
  "view": "top-down oblique",
  "direction": "south",
  "no_background": true
}
```

---

## Pflanzen-Sprites (64x64px, Battle + Pokedex)

### Helianthus annua — Sonnenblume (Stufe 1-3)

**Naming-Convention:** `assets/sprites/plants/sunflower/helianthus_annua_stage1.webp`

```json
{
  "description": "pixel art sunflower plant, stage 1 seedling, small green sprout with two cotyledon leaves, single thin stem, cozy RPG style, 64x64, transparent background, viewed from slight angle as if looking down at a garden bed, warm saturated colors, Stardew Valley inspired",
  "image_size": {"width": 64, "height": 64},
  "outline": "black",
  "shading": "medium",
  "view": "side oblique",
  "no_background": true
}
```

**Varianten:**
- `helianthus_annua_stage1.webp` — Keimling (2 Blätter)
- `helianthus_annua_stage2.webp` — Junipflanze (4-6 Blätter, erkennbare Knospe)
- `helianthus_annua_stage3.webp` — Voll erblüht (grosse Blüte, charakteristisches Profil)

---

### Hybrid-Platzhalter-Sprite

**Verwendung:** Wenn Hybrid-Spezies noch kein eigenes Asset hat
**Priorität:** NIEDRIG (Fallback)

```json
{
  "description": "pixel art fantasy hybrid plant, glowing violet aura, unusual combination of sunflower petals with cactus spines, sparkling magical particles around it, mysterious and beautiful, 64x64, transparent background, top-down oblique RPG view, Stardew Valley style, cozy palette with violet accent #b06aff",
  "image_size": {"width": 64, "height": 64},
  "outline": "black",
  "shading": "medium",
  "detail": "high",
  "view": "side oblique",
  "no_background": true
}
```

---

## Tile-Sprites (32x32px)

### tile_magma — Magmabluete Biom-Boden

```json
{
  "description": "pixel art volcanic ground tile, dark charcoal rock with glowing orange magma cracks, small ember particles implied, hot and dangerous atmosphere, 32x32, seamlessly tileable, top-down view, Stardew Valley style",
  "image_size": {"width": 32, "height": 32},
  "outline": "none",
  "shading": "high",
  "view": "top-down",
  "no_background": false
}
```

### tile_mordwald — Mordwald Biom-Boden

```json
{
  "description": "pixel art dark forest floor tile, dead black roots visible through dark earth, scattered small purple glowing mushrooms, ominous atmosphere, 32x32, seamlessly tileable, top-down view, Stardew Valley style",
  "image_size": {"width": 32, "height": 32},
  "outline": "none",
  "shading": "medium",
  "view": "top-down",
  "no_background": false
}
```

---

## Icon-Sprites (16x16px)

### Biom-Icons für Loading-Indicator

```json
// Kaktoria
{
  "description": "tiny cactus with two arms, desert pixel art icon, 16x16, green and brown, transparent background, simple silhouette"
}
// Frostkamm
{
  "description": "snowflake crystal pixel art icon, 16x16, ice blue, transparent background, simple geometric"
}
// Salzbucht
{
  "description": "wave with salt crystal pixel art icon, 16x16, ocean blue with white foam, transparent background"
}
```

---

## Generierungs-Reihenfolge (nach Priority)

| Priorität | Asset | FI-Impact | Kosten (geschätzt) |
|---|---|---|---|
| 1 | npc_tilda_south.png | Tilda-Idle 2→4 | ~$0.05 |
| 2 | npc_tilda_portrait.png | Dialog-Qualität | ~$0.05 |
| 3 | helianthus_annua_stage1-3.webp | Pflanzen-Showcase | ~$0.15 |
| 4 | hybrid_placeholder.webp | Breeding-UI | ~$0.05 |
| 5 | npc_iris.png | Story-Assets | ~$0.05 |
| 6 | tile_magma.png | S-10 Biom | ~$0.03 |
| 7 | tile_mordwald.png | S-10 Biom | ~$0.03 |

**Gesamt nächster Asset-Run:** ~$0.41 (bei PixelLab-Balance-Aufladung von min. $1.00)

---

## API-Aufruf Template

```bash
curl -X POST "https://api.pixellab.ai/v1/generate-image" \
  -H "Authorization: Bearer $PIXELLAB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '<PROMPT_JSON_OBEN>' \
  -o "public/assets/generated/<filename>.png"
```

**Hinweis:** Korrekter Endpoint wurde noch nicht verifiziert (404 bei generate-image + generate + pixelate).
Balance-Check: `GET https://api.pixellab.ai/v1/balance` → aktuell $0.00.
Vor nächstem Asset-Run: PixelLab Dashboard aufrufen, Balance aufladen, Endpoint verifizieren.
