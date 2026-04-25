# Booster-System V0.1 Unit-Test
Datum: 2026-04-25
Tester: Claude (autonomer Self-Test)

## Setup
Standalone JS-Skript (`/tmp/test_booster.mjs`) das die Multiplier-Stack-Formel reimplementiert und gegen die TS-Implementation kreuzvalidiert. tsc und vite-Build zusaetzlich gruen.

## Ergebnisse: 14 von 14 Tests bestanden

| Szenario | Erwartet | Tatsaechlich |
|---|---|---|
| no booster, stage 0, h=100, normal-soil | 3.75 | 3.75 |
| bronze-soil | 4.125 | 4.125 |
| gold + sun-lamp + 1.5x XP-Booster (Stage 2 Tag-Penalty 0.4 ignoriert) | 4.875 | 4.875 |
| premium-fertilizer 2.0x | 4.80 | 4.80 |
| sprinkler haelt h=20 -> 80 | 3.75 | 3.75 |
| sun-lamp at night (tod=0.4 ignoriert) | 3.75 | 3.75 |
| F1 hybrid stack (Premium-Duenger + Gold-Soil + Sun-Lamp + Hybrid-Vigor) | 12.19 | 12.19 |
| Soil-Tier-Multipliers normal/bronze/silver/gold | 1.0/1.1/1.2/1.3 | OK |
| Booster-Expiry (60min Lifetime) | true/false | OK |
| Tier-Pollen empirical 25% (10k Rolls) | ~0.25 | 0.252 |

## Build
- tsc clean
- vite build ok (1567 kB)

## Bekannte Schwaechen / Followups
- Markt-Shop-UI (MarketScene erweitert) verschoben auf S-09. Daten-Layer (gameStore.getMarketShopRoster, buyShopItem) ist bereits da.
- Daily-Login-Reward-Modal nicht UI-implementiert (gameStore.claimDailyLogin existiert).
- Hybrid-Booster-Item ist im Inventar verfuegbar aber wirkt nicht auf crossPlants-Mutation-Roll. Hook fehlt noch.

## Visual-Tests Pending
Nicht durchgefuehrt: Browser-Smoke-Test der Garden-Scene (Saeen-Modal, Booster-Apply-Modal, Soil-Upgrade-Button, neue 10 Plant-Sprites).

## Schluss
Multiplier-Stack ist mathematisch verifiziert. F1-Hybrid mit allen Boostern erreicht 12.2 XP/s vs. 3.75 Standard - das ist 3.25x Beschleunigung wenn Spieler optimal stacked. Balance fuehlt sich richtig (nicht zu OP, klare Skill-Expression).
