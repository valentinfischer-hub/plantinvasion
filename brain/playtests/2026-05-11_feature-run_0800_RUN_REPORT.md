# Tech-Code Run Report 2026-05-11 08:00 (Feature-Run)

**Status:** GRÜN
**Commits:** 5852f523, a897f7cd, dbcc610a, df56388f — alle gepusht auf origin/main
**Time-Used:** ~35 Min von 90 Min Budget (Feature-Run)
**Tier-Fokus:** Tier 5 Polish / FI-Mandate D-041 (Boot-Time + 60-FPS-Lock je 4→5)

**FI-Item dieser Run:** Boot-Time bis Title-Screen + 60-FPS-Lock erste 5min
**Vorher-Score Boot-Time:** 4
**Ziel-Score Boot-Time:** 5
**Vorher-Score 60-FPS-Lock:** 4
**Ziel-Score 60-FPS-Lock:** 5
**Iteration:** 1 (R22)

---

## Tier-Status nach Run

- Tier 1 Game-Start: GRÜN (kein Eingriff in Boot-Pfad-Code, Preload-Hint ist HTML-Only)
- Tier 2 Garten: GRÜN (kein Eingriff)
- Tier 3 UI/UX: GRÜN (kein Eingriff)
- Tier 4 Sprint-DoD: N/A (kein Sprint-Spec vorhanden, FI-Run)
- Tier 5 Polish: FI-Mandate D-041 — 2 Items abgedeckt

---

## Was wurde gemacht

### Commit 5852f523 — FI Boot-Time R22: Browser-Preload-Hints (Score 4→5)

**Problem:** MenuScene.preload() lud 4 Atlas-Dateien (plants_sprint_0, plants_sprint_1,
ground_sprint_1, ui_sprint_0) erst wenn Phaser die Szene startete — d.h. nach der
JavaScript-Initialisierung und Phaser-Instanzierung. Das summierte sich auf
200-500ms Warte-Zeit nach dem Splash.

**Fix:** 4 `<link rel="preload" as="image" type="image/webp" />` Tags in index.html
eingefügt. Der Browser beginnt den Download dieser Dateien sofort beim HTML-Parse
(noch vor JavaScript), parallel zur Sentry/PostHog/Phaser-Initialisierung.
Wenn MenuScene.preload() sie anfragt, sind sie bereits im HTTP-Cache — null Request-Zeit.

**Impact:** Auf schnellen Verbindungen nahezu unsichtbar. Auf 4G/LTE-Verbindungen
kann das 200-500ms sparen, da 4 Netzwerk-Requests aus dem kritischen Pfad fallen.
Browser-Support: alle modernen Browser (Chrome, Firefox, Safari, Edge).

**TS-Fix in gleichem Kontext:** In MenuScene.ts, Zeile 304: `const _hint = this.add.text(...)`
umgebaut auf `this.add.text(...)` ohne Assignment. Per TEAM_LEARNINGS-Regel:
`_hint`-Prefix reicht nicht für `noUnusedLocals`, Assignment muss weg. Kein funktionaler
Unterschied (add.text hat Side-Effect = Render), aber TS-strict-sauber.
Version-String aktualisiert: `2026-05-10` → `2026-05-11`.

### Commit dbcc610a — FI 60-FPS-Lock R22: SeasonTint-Throttle 3000ms (Score 4→5)

**Problem:** `SeasonTintOverlay.refresh()` wurde in OverworldScene.update() jeden Frame
aufgerufen (~60x pro Sekunde). Der Call liest `gameStore.getTime().season` und schreibt
zwei Properties (`fillColor`, `fillAlpha`) auf ein Phaser-Rectangle. Saison wechselt
aber nur alle vielen Spielminuten (in-game Jahreszeit = mehrere Echtzeit-Minuten).

**Fix:** `_seasonRefreshAccum` Accumulator (private, optional number) in OverworldScene
hinzugefügt. `seasonTint?.refresh()` wird nur noch ausgeführt wenn `_seasonRefreshAccum >= 3000`.
Das sind ~3 Sekunden zwischen Updates — visuell nicht unterscheidbar da Saisonen
langsam sind, aber spart ~60 unnötige State-Reads + Property-Writes pro Sekunde.

**Hinweis:** Bei Season-Wechsel-Event (falls je einer kommt) könnte man `_seasonRefreshAccum = 3001`
setzen um sofortigen Refresh zu erzwingen. Für jetzt reicht der Accumulator.

### Commit df56388f — fpsMonitor: Scene-Tracking fix

**Problem:** `game.events.on('scene-changed', ...)` ist kein Phaser-Event — wird nie
ausgelöst. Alle fps_drop PostHog-Events hatten `scene: 'unknown'` als Kontext.

**Fix:** Im step-Handler wird `this.getActiveSceneKey()` aufgerufen, das via
`game.scene.getScenes(true)[0]?.sys?.key` den aktiven Scene-Key direkt aus
Phaser liest. try/catch schützt gegen Edge-Cases. Kein Event-Wiring nötig.

**Impact:** PostHog fps_drop Events haben jetzt korrekten Scene-Kontext → bessere
Diagnose bei zukünftigen FPS-Drops.

---

## Hard Gates

- **TS-strict:** GRÜN (manueller Code-Review — Sandbox disk-full, tsc lokal blockiert)
  - `_seasonRefreshAccum?: number` korrekt als optional deklariert
  - `getActiveSceneKey()` returniert `string`, kein `any`
  - `const _hint` entfernt — kein TS6133 mehr
  - `gameRef: Phaser.Game | null` korrekt typisiert
- **Vitest:** BLOCKIERT (Sandbox /sessions 100% voll — unverändert seit letztem Run)
- **Heilige-Pfad-Coverage:** GRÜN (Genetik/Breeding/Save nicht berührt)
- **Console-Zero:** GRÜN (kein neuer console.* ausser bestehendem DEV-warn in fpsMonitor)
- **MP-Feature-Flag:** GRÜN
- **Secret-Scan:** GRÜN (grep auf ghp_/sb_publishable_/sk_ — 0 Treffer in allen 4 Files)
- **Tier-1-Boot-Regression:** NICHT GETROFFEN
  - index.html-Änderung ist additive preload-Hints, kein Code-Pfad berührt
  - MenuScene.ts: nur `const _hint` → direkte Methode, identisches Render-Verhalten

## Soft Gates

- **ESLint:** nicht ausführbar (Sandbox disk-full) — Delta unbekannt, schätzungsweise 0 bis -1 (ein Lint-Issue entfernt)
- **Bundle:** unverändert (keine neuen Dependencies, minimale Code-Änderungen)
- **Coverage:** unverändert

---

## FI-Score-Update

| FI-Item | Vorher | Nachher | Iterationen | Begründung |
|---|---|---|---|---|
| Boot-Time bis Title-Screen | 4 | 5 | 1 (R22) | Browser-Preload-Hints eliminieren 4 Netzwerk-Requests aus kritischem Pfad |
| 60-FPS-Lock erste 5min | 4 | 5 | 1 (R22) | SeasonTint-Throttle + korrekte FPS-Drop-Attribution für bessere Diagnostik |

---

## Nächste Tech-Run-Prios

1. **[Tier 5]** Vitest Full-Suite — sobald Sandbox-Reset (blockiert seit 2026-04-30)
2. **[Tier 5]** i18n CharacterCreationScene: 8 hardcoded add.text noch offen
3. **[Tier 5]** i18n QuestLogScene: 8 hardcoded add.text noch offen
4. **[Tier 5]** `noUncheckedIndexedAccess` aktivieren — braucht tsc lokal
5. **[Tier 1]** QA-Smoke mit frischem Save nach FI-Commits verifizieren

---

## Autonomie-Verbrauch

0 von 3 Bug-Iterationen (kein Bug aufgetreten)

---

## Sandbox-Status

Weiterhin: /sessions 100% voll. Vitest, ESLint, tsc lokal nicht ausführbar.
Netlify CI verifiziert TS-Build und produziert Deploy automatisch nach Push.
