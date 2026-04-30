# Tool Learnings — PixelLab API (B4-R6, 2026-04-29)

## PixelLab API Status

**Endpoint:** https://api.pixellab.ai/v1  
**Authentifizierung:** Bearer Token  
**Balance (geprüft 2026-04-29):** 0.00 USD — kein Guthaben verfügbar

## Verfügbare Endpoints (aus OpenAPI-Docs)

| Endpoint | Beschreibung |
|---|---|
| POST /generate-image-pixflux | Text-zu-Pixel-Art (Standardmodell) |
| POST /generate-image-bitforge | Style-Transfer mit Referenzbildern |
| POST /animate-with-skeleton | 4-Frame-Animation via Skeleton-Poses |
| POST /animate-with-text | Animation aus Text-Beschreibung |
| POST /rotate | Objekt/Charakter rotieren |
| POST /inpaint | Pixel-Art bearbeiten/editieren |
| GET /balance | Kontostand abfragen |

## Typische Kosten (aus API-Docs)

- generate-image-pixflux 128x128: ca. 0.005-0.01 USD
- generate-image-bitforge (mit Referenz): ca. 0.01-0.02 USD
- Animation 4-Frame: ca. 0.02-0.05 USD

## Minimales Request-Beispiel (pixflux)

```bash
curl -X POST https://api.pixellab.ai/v1/generate-image-pixflux \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "pixel art sunflower plant sprite, 32x32, top-down view, game asset",
    "image_size": {"width": 32, "height": 32}
  }'
```

## Alternativer Ansatz (B4-R6 implementiert)

Da kein PixelLab-Guthaben vorhanden, wurden die prozeduralen Sprites verbessert:

1. **drawBlooming Flower** — mehr Blüten-Detail, Schattierung, Glanz-Punkte
2. **drawAdult Default** — Stiel-Schattierung, Blatt-Venen, Knospe statt nur Pixel

## Empfehlung für nächste PixelLab-Session

1. Guthaben aufladen (min. 2 USD)
2. Test-Sprite: Sunflower 32x32 generieren
3. Style-Reference: bestehende procedural-Sprites als Basis für Bitforge
4. Falls gut: alle Encounter-Pflanzen (25+) generieren lassen
5. Sprites in public/assets/sprites/plants/{slug}/ speichern
