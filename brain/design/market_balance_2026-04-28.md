# Market Economy Balance Audit — 2026-04-28

Sprint: S-POLISH | Run: B2-R9

## Stardew Valley Referenz-Werte

| Kategorie | Stardew (früh) | Stardew (spät) | Ratio Sell/Buy |
|-----------|---------------|----------------|----------------|
| Parsnip-Samen | 20g | 20g | ~0.35 (crop sell) |
| Blueberry-Samen | 80g | 80g | ~2.3x crop-profit |
| Mineral-Dünger | 100g | — | — |
| Sprinkler | 100g (craft) | — | — |
| Iridium-Sprinkler | craft only | — | — |
| Prise-Season-Profit | ~500g/crop | ~2000g/crop | — |

## Plantinvasion Pricing Analyse

### Samen (Seed-Items) — Kauf/Verkauf

| Rarity | Kauf | Verkauf | Sell-Ratio | Stardew-Vergleich |
|--------|------|---------|------------|-------------------|
| ★1 (Common) | 30 | 8 | 25% | OK — günstig zugänglich |
| ★2 (Uncommon) | 60 | 15 | 25% | OK |
| ★3 (Rare) | 120 | 30 | 25% | OK |
| ★4 (Epic) | 250 | 63 | 25% | OK |
| ★5 (Legendary) | 600 | 150 | 25% | OK — teuer aber fair |

**Befund**: 25% Sell-Ratio ist Stardew-konform (Stardew: Seeds unverkäuflich, aber Crops 35-60% Marge).
Empfehlung: Behalten. Geen Änderungen nötig.

### Booster-Items

| Item | Kauf | Verkauf | Nutzen | Bewertung |
|------|------|---------|--------|-----------|
| Kompost-Tee | 30 | 8 | 1.25x XP 30min | ✅ Sehr fair — Einsteiger-Item |
| Vulkan-Asche | 80 | 20 | 1.5x XP 60min | ✅ Gut balanciert |
| Premium-Dünger | 250 | 60 | 2.0x XP 90min | ✅ Luxury-Item, ok |
| Sumpf-Pollen | 90 | 22 | +50 Care-Score | ✅ Nischen-Item |
| Pristine-Pollen | 250 | 60 | 25% Tier-Up | ⚠️ Preis niedrig für Permanent-Effekt |
| Sonnenlampe | 500 | 100 | Tageszeit-Lock | ✅ Gut — situational |
| Sprinkler | 350 | 80 | Hydration-Hold | ✅ Leicht günstiger als Stardew-Equivalent |
| Hybrid-Verstärker | 600 | 150 | 2x Mutation-Chance | ✅ High-Value, fair |

### Boden-Upgrades (Permanent)

| Item | Kauf | Sell | Nutzen | Bewertung |
|------|------|------|--------|-----------|
| Bronze-Erde | 100 | 25 | 1.1x XP permanent | ✅ Erreichbar früh |
| Silber-Erde | 300 | 75 | 1.2x XP +5% Mut | ✅ Mid-Game |
| Gold-Erde | 800 | 200 | 1.3x XP +10% Mut -20% Hydration-Decay | ✅ Late-Game Ziel |

**Fazit**: Gold-Erde bei 800 ist ähnlich zu Stardew's teuersten Permanent-Upgrades. Angemessen.

## Balancing-Empfehlungen (S-POLISH)

1. **Pristine-Pollen 250 → 400**: Tier-Up-Chance ist mächtig. Preis sollte höher sein.
   Status: Nicht in diesem Sprint umgesetzt (keine Balance-Änderungen in S-POLISH).
   → Backlog-Item für S-11.

2. **Tagesangebot-Rotation**: 5 Seeds + 2 Booster/Tag ist gut.
   Empfehlung: Soil-Upgrades alle 3 Tage rotieren (nicht täglich). 
   → Backlog-Item für S-11.

3. **Sell-Ratio Items 25%**: Einheitlich — könnte differenziert sein.
   → Backlog für S-11.

## S-POLISH Run 9 Implementiert

- `marketBoughtToday` + `marketBoughtTodayDay` in GameState (Tag-Reset automatisch)
- `getMarketBoughtToday(slug)` — gibt Anzahl heutiger Käufe zurück
- `recordMarketRosterBought(slug)` — tracked Kauf im Roster-Modus
- MarketScene: Roster-Items grau dargestellt wenn `boughtCount > 0`
  - Alpha 0.45, grauer Text, grüner statt gold Border
  - Knopf-Label: "Nochmal" statt "Kaufen" (Mehrfachkauf weiterhin möglich)
  - Hover-Glow deaktiviert für bereits-gekaufte Items
