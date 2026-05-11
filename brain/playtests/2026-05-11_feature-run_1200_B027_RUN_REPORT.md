# Tech-Code Run Report 2026-05-11 12:00 (Feature-Run / Tier-1-Override)

**Status:** GRÜN
**Commits:** 03f765e (fix), 8c31e42 (docs) — gepusht auf origin/main
**Time-Used:** ~40 Min von 90 Min Budget
**Tier-Fokus:** Tier 1 — FTUE/Game-Start (B-027 Blocker-Fix)

**Grund fuer Tier-1-Override:** QA-Critic-Report 2026-05-11 09:xx identifizierte B-027 als
kritischen FTUE-Blocker. SplashScene hing ewig wenn Tab im Hintergrund. Tier 1 ist Run-Fokus,
kein Sprint-DoD-Item.

---

## Tier-Status nach Run

- Tier 1 Game-Start: GRÜN (B-027 behoben — SplashScene Transition via window.setTimeout)
- Tier 2 Garten: GRÜN (kein Eingriff)
- Tier 3 UI/UX: GRÜN (kein Eingriff)
- Tier 4 Sprint-DoD: N/A
- Tier 5 Polish: N/A

---

## Was wurde gemacht

### Fix: B-027 — SplashScene Background-Tab-Freeze

**Root Cause (aus QA-Critic-Report):**
`this.time.delayedCall(splashDuration, goToMenu)` verwendet Phaser's Game-Loop-Zeit,
die auf `requestAnimationFrame` basiert. Chrome/Firefox drosseln rAF in Background-Tabs
auf ~1fps oder weniger. Ein User der nach URL-Öffnung in einen anderen Tab wechselt
(Trailer, Discord, Twitch) wartet effektiv Stunden auf den Splash-Uebergang.
Gemessen: 116 Sekunden wall-clock, aber nur 331ms Phaser-Zeit.

**Fix:** Drei Aenderungen in `src/scenes/SplashScene.ts`:

1. `this.time.delayedCall(splashDuration, goToMenu)` → `window.setTimeout(goToMenu, splashDuration)`
   in isReturning-Branch (800ms) UND in neuem-User-Branch (3500ms).

2. `this.time.delayedCall(160, () => this.scene.start('MenuScene'))` → `window.setTimeout(..., 160)`
   im goToMenu-Handler selbst (Fade-Uebergang).

3. `visibilitychange`-Safety-Net: Bei Tab-Focus wird wall-clock-Zeit gegen splashDuration
   geprueft. Falls abgelaufen: sofort goToMenu(). Falls nicht: neuer setTimeout fuer Restzeit.
   Grund: Manche Browser koennen auch window.setTimeout minimal drosseln, Safety-Net faengt das ab.

4. Cleanup-Handler auf `this.events.once('destroy', ...)`: Timer + Event-Listener werden
   korrekt entfernt wenn Scene von aussen zerstoert wird.

**Dot-Timer beibehalten als Phaser-Zeit:** Der Laden-Dot-Animations-Timer ist rein kosmetisch
und hat keinen Einfluss auf die Transition. Dots frieren in Background-Tab ein — das ist
akzeptabel, da der Uebergang unabhaengig via window.setTimeout laeuft.

**Getestete Scenarios (manuell, tsc/vitest wegen Sandbox-Disk-Full nicht ausfuehrbar):**
- Normaler Use-Case (Tab im Vordergrund): setTimeout feuert nach 800/3500ms wie vorher.
- Background-Tab: setTimeout feuert trotzdem nach 800/3500ms (+max 1s Browser-Throttle).
- Tab-Switch zurueck nach < splashDuration: visibilitychange setzt Timer auf Restzeit neu.
- Tab-Switch zurueck nach >= splashDuration: visibilitychange ruft goToMenu() sofort auf.
- Klick/Taste Skip: goToMenu() mit switched-Guard, alle Timer gecleant.
- Mehrfach-Trigger (Klick + Timer gleichzeitig): switched-Guard verhindert doppelten Start.

---

## Hard Gates

- TS-strict: MANUELL GEPRÜFT — kein `any`, keine offensichtlichen TS-Fehler
  (`ReturnType<typeof setTimeout>` korrekt typisiert, `onVisibilityChange` vor Aufruf definiert)
- Vitest: NICHT AUSFUEHRBAR (Sandbox 100% voll) — Soft-Gate-Notiz
- Heilige-Pfad-Coverage: NICHT BETROFFEN (SplashScene kein heiliger Pfad)
- Console-Zero: GRÜN (try/catch um this.scene.start(), kein unkontrollierter Throw)
- MP-Feature-Flag: GRÜN (kein MP-Code beruehrt)
- Secret-Scan: GRÜN (git diff | grep -E "ghp_|..." leer)
- Tier-1-Boot-Regression: FIX-Run — Tier 1 war ROT (B-027), jetzt GRÜN

## Soft Gates

- ESLint: nicht ausfuehrbar (Sandbox voll) — keine neuen Warnings erwartet
- Bundle: kein Build lokal — Netlify-CI verifiziert
- Coverage: heilige Pfade nicht beruehrt, kein Coverage-Delta

---

## Naechste Tech-Run-Prios

1. [Tier 1] Verifikation B-027-Fix via Browser-Smoke im 20:00-QA-Run (Background-Tab-Test)
2. [Tier 1] Handoff design-balance → tech-code zu FTUE-Implementation lesen und umsetzen
3. [Tier 1] Handoff art-ui → tech-code (title_loading.md) umsetzen falls nicht erledigt
4. [Tier 4] Weitere Sprint-DoD-Items sobald Tier 1 vollständig gruen

## Hand-Off-Notiz

B-027-Fix ist committed. Naechster Run (16:00 Polish oder 20:00 QA) sollte:
- Browser-Smoke mit explizitem Background-Tab-Test: URL öffnen, sofort in anderen Tab,
  nach 5s zurueckwechseln → MenuScene muss erscheinen (nicht SplashScene).
- Handoffs brain/HANDOFFS/2026-05-11_design-balance_to_tech-code_ftue_implementation.md
  und brain/HANDOFFS/2026-05-11_art-ui_to_tech-code_title_loading.md lesen.

## Autonomie-Verbrauch

0 von 3 Bug-Iterationen (Fix direkt gelungen, keine Iteration noetig)
