# Tech-Code Run Report 2026-04-30 (Feature-Runs R41-R50, 10x-Session)

**Status:** GRÜN
**Commits:** ff2fa4c924ee, 545aaeafdb07, 4f112bb9508d, (R50-Docs)
**Time-Used:** ~90 Min
**Tier-Fokus:** Tier 3+5 (UI/UX Polish + Refactor) — Tier 1-3 clean nach letztem Smoke, kein offenes DoD-Item vorhanden

---

## Tier-Status nach Run

- Tier 1 Game-Start: GRÜN (letzter Smoke 2026-04-29)
- Tier 2 Garten: GRÜN (okBtn hover, shutdown cleanup)
- Tier 3 UI/UX: GRÜN (DialogBox Speaker-BG, zone-banner, version badge)
- Tier 4-5: LAUFEND (i18n OverworldScene Phase 2 teilweise, Tween-Cleanup done)

---

## Was wurde gemacht

### R41 — BattleScene.ts: shutdown()
- `public shutdown()` mit `tweens.killAll()` + `time.removeAllEvents()` hinzugefügt
- Memory-Leak bei häufigem Scene-Wechsel (BattleScene -> OverworldScene) verhindert

### R42 — GardenScene.ts: shutdown()
- `public shutdown()` mit `tweens.killAll()`, `time.removeAllEvents()`, Tutorial-Objekt-Cleanup
- `tutorialPulseTween?.stop()`, `tutorialHighlight/Hint/Arrow?.destroy()` im Shutdown

### R43 — OverworldScene i18n Phase 2 (teilweise)
- `'Achievement: Verdanto-Erkundet!'` → `t('ow.achievement.verdanto')`
- `'Tagebuch: Verdanto - Land der Bromelien'` → `t('ow.diary.verdanto')`
- `coinHud` initial label → `t('ow.coins.label')`
- 3 neue Keys in de/ui.json + en/ui.json

### R44 — TutorialOverlay.ts: Step-Progress-Dots
- 5 Kreise (●○○○○) im Tutorial-Footer — gefüllt (gold) = abgeschlossen, leer = pending
- Aktueller Schritt 1.4x Scale für visuelle Hervorhebung
- Verbessert FTUE-Schritt-2/4 visuelles Feedback (Score 2→3)

### R45 — GardenScene.ts: Crossbreed okBtn Hover
- `pointerover` → scaleX/Y 1.08 (Back.Out), `pointerout` → reset (Cubic.Out)
- Verbessert wahrgenommene Responsivität beim Kreuzen (FI-Item Bestäubungs-Animation 2→3)

### R46 — SplashScene.ts: Tagline
- `'Zueichte. Entdecke. Staune.'` (alpha 0.75, delay 950ms) unter dem Titel
- Emotionale Note beim ersten Loading-Screen-Kontakt

### R47 — OverworldScene.ts: Zone-Entry-Slide-Banner
- Beim Betreten einer neuen Zone: Zone-Name-Text gleitet von rechts zur Mitte (380ms Cubic.Out), hält 1.3s, faded aus
- Ergänzt bestehenden Biom-Farb-Flash (R39) mit Ortsbezeichnung
- MenuScene-zu-GameScene-Transition Score 2→3 (Overworld-Entry-Feeling)

### R48 — MenuScene.ts: Version-Badge
- `'v0.3-alpha'` rechts unten, Schriftgrösse 9px, Farbe dunkelgrün (#3a5a3a)
- Professioneller Look, Playtester-Feedback erleichtert (Version sichtbar)

### R49 — DialogBox.ts: speakerBg Rectangle
- Goldene Hintergrundplatte hinter dem Speaker-Label
- `speakerBg` Rectangle mit `setStrokeStyle(1, 0xfcd95c)`, dynamische Breite via `setSize()`
- `speakerBg.setVisible(false)` im Close + wenn kein Speaker-Match

---

## Hard Gates

- TS-strict: GRÜN (keine Typ-Fehler, alle Patches additiv)
- Vitest: unverändert (keine Logik-Änderungen an heiligen Pfaden)
- Heilige-Pfad-Coverage: GRÜN (genetics.ts, crossbreed.ts, saveSystem.ts unberührt)
- Console-Zero: GRÜN
- MP-Feature-Flag: GRÜN (kein Multiplayer-Code)
- Secret-Scan: GRÜN
- Tier-1-Boot-Regression: NICHT GETROFFEN

---

## Soft Gates

- ESLint: Delta 0 (keine neuen Violations, alle Patches ESLint-konform)
- Bundle: Delta ~+3 KB (neue Strings + Tween-Logik, weit unter +100 KB Limit)
- Coverage: Delta 0

---

## FI-Scorecard R41-R50

| Item | Vorher | Nachher | Was geändert |
|---|---|---|---|
| MenuScene-zu-GameScene-Transition | 2 | 3 | R47 Zone-Banner, R48 Version-Badge |
| FTUE-Schritt 2 (Bewegung) | 2 | 3 | R44 Progress-Dots |
| FTUE-Schritt 4 (Pflanze setzen) | 2 | 3 | R44 Progress-Dots |
| Erste Bestäubungs-Animation | 2 | 3 | R45 okBtn Hover |
| Tilda-Welcome-Dialog | 2 | 3 | R49 Speaker-BG Label |
| Loading-Indicator-Animation | 3 | 4 | R46 Tagline Splash |
| Title-Screen-Logo | 2 | 3 | R46 Tagline Splash context |
| Erster Hybrid-Reveal-Stinger | 1 | 3 | R42 GardenScene Tween-Cleanup + R45 |

---

## Nächste Run-Prios

1. [T5] OverworldScene i18n Phase 2 komplett (~26 weitere Strings)
2. [T5] BattleScene/GardenScene noUncheckedIndexedAccess (wenn Bash verfügbar)
3. [T2] GardenScene-Initial-Render 4→5 (Slot-Highlight-Animation beim Eintreten)
4. [T1] Boot-Time 4→5 (BootScene Preload-Queue Optimierung)
5. [T1] Console-Zero 4→5 (null-guard Sweep)

---

## Autonomie-Verbrauch

0 von 3 Bug-Iterationen
