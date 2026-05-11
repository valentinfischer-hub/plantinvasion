# Tier-Status (S-POLISH)

**Letzter Smoke:** 2026-04-30 QA-Run5 (5x-Session Browser-Smoke)
**Letzter Feature-Run:** 2026-05-11 (R22) — Boot-Time + 60-FPS-Lock FI-Updates
**Letzter Polish-Run:** 2026-05-11 16:00 — FI Art-UI R2 Title-Logo (Score 3→4) + FTUE Handoff-Response

---

## Tier 1: Game-Start / Boot
**Status:** GRÜN
**Smoke-Datum:** 2026-04-30 08:00
**Ergebnis:**
- MenuScene unter 5s geladen — PASS
- Alle 4 Menu-Buttons sichtbar — PASS
- Version-Badge v0.9-alpha | 2026-04-30 — PASS
- Console-Errors: 0 — PASS
- Netlify Deploy: READY (aad60ac7, 20s Build) — PASS
- Reload-Test: 0 Console-Errors — PASS
- P0 TS-Build-Fehler: BEHOBEN (Nested-JSON, Mojibake, TS6133, TS2307)
- PostHog in Prod: NICHT geladen (Netlify VITE_POSTHOG_KEY fehlt — Setup-Gap)
- Sentry in Prod: NICHT geladen (Netlify VITE_SENTRY_DSN fehlt — Setup-Gap)

**Offenes:** Netlify-Env-Vars für VITE_POSTHOG_KEY und VITE_SENTRY_DSN manuell im Dashboard setzen

---

## Tier 2: Garten-Experience
**Status:** GRÜN
**Smoke-Datum:** 2026-04-30 08:00 (QA-Run7/10 — manuelle Browser-Verifikation)
**Ergebnis:**
- GardenScene via G-Taste öffnet korrekt — PASS
- 12-Slot-Grid rendert (3x4) — PASS
- Pflanzenkarte: "Sunflower / Helianthus annuus", Stage/Level/XP/ATK/DEF/SPD/Gene — PASS
- Giessen/Booster/Soil-upgraden-Buttons vorhanden — PASS
- OverworldScene: Regen-Wettereffekt, NPCs wanern, Quest-Marker — PASS
- Console-Errors: 0 — PASS

**Soft-Issue S1:** Plant-Label trailing ":" ("L1 · Keimling :") — Low, kein Blocker
**Offenes:** Pflanzenstatus bei leerem Inventar (Säen-Modal nicht testbar ohne Seeds)

---

## Tier 3: UI/UX übergreifend
**Status:** GRÜN (S1 behoben in Run 9)
**Smoke-Datum:** 2026-04-30 QA-Run9
**Ergebnis:**
- HelpScene 4 Tabs (Steuerung/Garten/Zucht/Kampf): alle korrekt mit echten Umlauten — PASS
- "Zurück (Esc)" Button konsistent — PASS
- MenuScene-Buttons (4x) konsistent Farben + Padding — PASS
- GardenScene Header: vollständig und konsistent — PASS
- Plant-Card Modal: korrekte Button-Farben — PASS
- Plant-Card S1 Phantom-Colon: GEFIXT (Commit 3b5976ae) — xpBar fillRoundedRect near-zero Guard

**Soft-Issue S3: BEHOBEN (2026-05-10)** — Zone-Toast nutzt jetzt `t('overworld.zone.<zone>')` mit ZONE_LABELS-Fallback. 8 Keys in DE+EN ui.json ergänzt. Commits e05a4ecc, 62f5c7e0, ef056f53.

---

## Tier 4: Sprint-DoD-Items
**Status:** GRÜN
- S-POLISH PostHog 9/9: ✅ KOMPLETT
- S-POLISH ESLint: ✅ 0 Violations
- i18n Phase 1: ✅ KOMPLETT
- i18n Phase 2 alle Scenes: ✅ KOMPLETT (GardenScene/BattleScene/SettingsScene/MenuScene)

---

## Tier 5: Polish / Refactor
**Status:** LAUFEND
- noUncheckedIndexedAccess: pending (Bash-Sandbox disk-full, tsc nicht ausfuehrbar)
- Mojibake-Audit DE+EN JSON: KOMPLETT (Run 13-15, 172 Keys, 0 verbleibend)
- Mojibake-Audit TS-Scenes + UI: KOMPLETT (Run 17, 9 Dateien, 0 verbleibend)
- Architektur-Doku: AKTUELL (Run 16, 65 Source-Files dokumentiert)
- i18n Phase 2 MarketScene: KOMPLETT (Run 2, 11 Keys)
- i18n Phase 2 HelpScene UI: KOMPLETT (Run 3, 2 Keys, Data defer Open-Beta)
- i18n Phase 2 DiaryScene UI: KOMPLETT (Run 4, 3 Keys, Data defer Open-Beta)
- i18n Phase 2 InventoryScene UI: KOMPLETT (Run 4, 2 Keys)
- i18n Phase 2 CharacterCreationScene: ✅ KOMPLETT (Run 12:00 2026-05-11, 7 Keys in DE+EN, ccs.* vollständig)
- FI Art-UI R2 Title-Logo MenuScene: ✅ KOMPLETT (Run 16:00 2026-05-11, Score 3→4, Pixel-Art Styling + 4-Element-Entrance + Leaf-Deko + Pollen-Burst + Idle-Glow)
- i18n Phase 2 QuestLogScene: ✅ KOMPLETT (Run 12:00 2026-05-11, 10 Keys in DE+EN, ql.* vollständig)
- i18n Phase 2 OverworldScene Zonen-Keys: OFFEN (ow.zone.* Raw-Keys sichtbar)
- i18n Phase 2 OverworldScene Sign-Dialogs: Deferred Open-Beta
- TutorialOverlay i18n-Migration: pending, braucht Feature-Run-Spec

---

## Bundle-Status
**Letzter Audit:** 2026-04-30 QA-Run5 (via Netlify Deploy main@3d513b9, aktuell identisch)
- game-data: 45.80 kB raw / 12.99 kB gzip
- battle: 46.40 kB raw / 15.47 kB gzip
- ui: 83.77 kB raw / 25.69 kB gzip
- index: 616.57 kB raw / 197.22 kB gzip
- phaser: 1,478.62 kB raw / 339.72 kB gzip
- **Total gzip: ~591 kB** (unter Budget) — PASS
- 377 Modules, Build-Zeit 11.9s, Deploy-Zeit 21s
- Netlify Secrets-Scan: PASS (436 Files, 0 Secrets)
