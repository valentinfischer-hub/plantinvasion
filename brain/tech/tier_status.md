# Tier-Status (S-POLISH b5)

**Letzter Smoke:** 2026-04-29 QA-Run (Run 14/20 + Run 20/20 pending)

---

## Tier 1: Game-Start / Boot
**Status:** GRÜN
**Smoke-Datum:** 2026-04-29 (Run 14/20)
**Ergebnis:**
- Boot-Zeit: 3.6s (Ziel unter 8s) — PASS
- MenuScene aktiv nach Load — PASS
- Canvas: 720x540 — PASS
- Console-Errors: 0 — PASS
- v0.3-alpha Badge im MenuScene sichtbar

---

## Tier 2: Garten-Experience
**Status:** GRÜN
**Smoke-Datum:** 2026-04-29 (Run 14/20)
**Ergebnis:**
- GardenScene startet ohne Console-Errors — PASS
- Plant-Cards reagieren auf Klick — PASS
- Detail-Panel öffnet korrekt (Sunflower L22, Stage/XP/Hydration/ATK/DEF/SPD, Genes) — PASS
- selectedSlug Gold-Border auf angeklickter Karte — PASS
- Toast "Keine Samen im Inventar" korrekt (kein Umlaut-Fehler) — PASS
- shutdown() Memory-Cleanup: DONE
- okBtn Hover-Feedback: DONE

---

## Tier 3: UI/UX übergreifend
**Status:** GRÜN
**Smoke-Datum:** 2026-04-29 (Run 14/20)
**Ergebnis:**
- Overworld mit NPCs, Schnee-Partikel, Zone-Labels — PASS
- NPC-Wander aktiv — PASS
- FARM (G) Button korrekt — PASS
- HelpScene Umlauts: alle korrekt in Source (einsäen Fix in Run 14) — PASS
- Netlify Deploy-Lag: kein Code-Bug

---

## Tier 4: Sprint-DoD-Items
**Status:** GRÜN
- i18n Phase 2 GardenScene + BattleScene: KOMPLETT
- i18n Phase 2 OverworldScene: TEILWEISE (3 Keys, ~26 noch offen — kein Alpha-Blocker)

---

## Tier 5: Polish / Refactor
**Status:** ABGESCHLOSSEN (b5 Session)

### ESLint void-Hack Sweep (Runs 12-18, 2026-04-29)

| Scene | Fixes |
|---|---|
| QuestLogScene.ts | 3 void-Hacks entfernt |
| GardenScene.ts | 1 void-Hack entfernt |
| OverworldScene.ts | 3 void-Hacks + 2 dead imports entfernt |
| SplashScene.ts | 1 void-Hack entfernt |
| BattleScene.ts | 5 void-Hacks entfernt (incl. uiCam class-property → local) |
| SettingsScene.ts | 7 void-Hacks entfernt |
| MenuScene.ts | 2 void-Hack-Zeilen entfernt |
| **Total** | **22 void-Hacks beseitigt** |
| Alle anderen Scenes | CLEAN (DiaryScene, InventoryScene, PokedexScene, MarketScene, ShopScene, CharacterCreationScene, HelpScene, QuestLogScene) |

ESLint-Warnings: 0. Alle Scenes geprüft und bereinigt.

---

## Bundle-Status
**Letzter Audit:** 2026-04-29
- Decoded: ~2.2 MB — PASS
- Transfer: ~2 KB — PASS
- ESLint-Warnings: 0
- Vitest: 268+ Tests grün (alle Refactorings sind logic-free)
