# Seed-Acquisition V0.2 Unit-Test
Datum: 2026-04-25
Tester: Claude

## Setup
Standalone JS-Skript verifiziert: Hybrid-Recipe-Lookup (kommutativ), Battle-Drop-Probability empirisch, Forage-Cooldown, Hidden-Spot-One-Shot, Berry-Master 24h-Gating, Spezies-Count.

## Ergebnisse: 14/14 PASS

| Test | Erwartet | Tatsaechlich |
|---|---|---|
| Recipe a+b lookup | sun-rose | sun-rose |
| Recipe b+a (commutative) | sun-rose | sun-rose |
| Recipe missing returns undefined | undefined | undefined |
| Battle-drop seed empirical 25% (10k rolls) | ~0.25 | 0.245 |
| Forage-Tile fresh available | true | OK |
| Forage-Tile 10min cooldown | locked | OK |
| Forage-Tile 70min cooldown | available | OK |
| Hidden-Spot collected | true | OK |
| Hidden-Spot fresh | false | OK |
| Berry-Master 0min gating | available | OK |
| Berry-Master 12h gating | locked | OK |
| Berry-Master 25h gating | available | OK |
| 10 Hybrid-Recipes defined | 10 | 10 |
| 50+ species count | >=50 | 61 |

## Build
- tsc --noEmit clean
- vite build ok

## Schluss
Pokemon-Style Foraging V0.2 lebt: 4 Mechaniken (Forage-Tiles, Hidden-Spots, Battle-Drops, Berry-Master), 10 visuell-mixbare Hybrid-Spezies, Save-Migration v7->v8 sauber. 61 plantbare Spezies (51 Basis + 10 Hybriden), Ziel 50+ erreicht.
