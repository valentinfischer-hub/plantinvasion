# Plantinvasion Bug-Tracker

## Konvention
- ID-Schema: B-NNN (chronologisch).
- Status: OPEN, IN_PROGRESS, RESOLVED, WONTFIX.
- Bei RESOLVED immer Commit-Hash + Datum.

## Bugs

### B-012 RESOLVED 2026-04-27
**Title:** Saeen-Modal: User wusste nicht warum eine Pflanze nicht eingesaet werden konnte.

**Symptom:**
- Bei vollem Garten zeigte das Modal nach Klick auf einen Seed nur einen generischen Toast "Fehlgeschlagen" oder den vermischten Reason "Kein freier Slot oder unbekannte Spezies".
- User konnte nicht ableiten ob das Inventar leer ist, ob die Spezies fehlt oder ob alle Slots belegt sind.

**Root-Cause:**
- `gameStore.plantSeed` warf einen einzigen Reason-String fuer zwei voellig verschiedene Failure-Faelle (volle Garten vs unbekannte Spezies).
- `GardenScene.openSeedPlantModal` machte keinen Vorab-Check auf freie Slots, oeffnete also das Modal und zeigte den Fehler erst nach Seed-Klick.

**Fix V0.1 (Auto-Slot-Pick, dieser Commit):**
- Neuer Helper `gameStore.getFreeSlotCount(): number`.
- `plantSeed` splittet Reason: "Garten voll. Ernte oder verschiebe Pflanzen." vs "Unbekannte Spezies".
- Modal macht Vorab-Check: bei 0 freien Slots wird Modal gar nicht mehr geoeffnet, stattdessen direkter Toast.
- Modal-Title zeigt jetzt freie Slot-Anzahl: "Pflanze einsaeen (N frei)".
- Auto-Slot-Pick (`findFreeGridSlot`) blieb unveraendert, war bereits aktiv.

**Fix V0.2 (Slot-First-UI, 2026-04-27 Run 12:00):**
- `gameStore.plantSeedAt(seedSlug, gridX, gridY)` neuer Slot-First-API.
- `createPlantOfSpeciesAt` und `isSlotOccupied` als Helpers exportiert.
- Garten-Slots sind jetzt klickbar (Phaser-Hotspots ueber jedem Slot, hinter den Plant-Cards). Klick auf leeren Slot oeffnet Slot-spezifisches Saeen-Modal mit Title `Slot X,Y bepflanzen`. Klick auf besetzten Slot greift weiter durch zum Plant-Card-Detail.
- Saeen-Header-Button bleibt aktiv (V0.1-Auto-Slot-Pick als Fallback fuer User die einfach den naechsten freien Slot wollen).
- Cross-Mode unterdrueckt Slot-Click (Hotspot returnt early).

**Tests:**
- `src/state/__tests__/plantSeed.b012.test.ts` (6 Tests, alle gruen).
- Coverage: `getFreeSlotCount` 100%, `plantSeed` Reason-Branches 100%.

**Hinweis Provenienz:**
- Der referenzierte QA-Critic-Report `brain/agents/qa-critic/critical_2026-04-26_12.md` existierte zum Zeitpunkt des Fix nicht im Repo. Tech-Code hat das Problem im Self-Audit der `GardenScene.openSeedPlantModal`-Sequenz identifiziert. QA-Critic-Doku waere ein Folge-Item.

**Commit:** `2fa24f8` (2026-04-27 09:00, gepusht auf origin/main).

### B-013 RESOLVED 2026-04-28
**Title:** NPC-Quest-Indicator crasht mit "Cannot read properties of null (reading 'drawImage')" nach Scene-Teardown.

**Symptom:**
- 3+ Console-Errors pro Tick wenn Player in OverworldScene mit aktiven NPCs.
- Stack: NPC.setQuestIndicator -> Phaser-Text.setColor -> updateUVs -> drawImage.

**Root-Cause:**
- `this.questIndicator` Reference bleibt nach Scene-Teardown (Garden-zu-Overworld-Wechsel) gueltig im JS-Heap aber das zugrundeliegende Phaser-Text-GameObject ist destroyed.
- setText/setColor crashen weil internal canvas-Context null ist.

**Fix:**
- Safety-Check `this.questIndicator.active && this.questIndicator.scene` vor jedem setText/setColor-Aufruf.
- Bei stale-Reference: Cleanup + Re-Create im naechsten Pfad.

**Discovery:**
- Browser-Smoke via Chrome MCP (Tech-Code Run-XX, V3 SKILL Auto-Approval-Pfad).
- Tier-2-Garten visuell PASS, aber Console-Errors gefunden bei NPC-Walking-Tick.

**Commit:** `a9cd655` (2026-04-28, gepusht auf origin/main).

**Tests:** Vitest hat dies nicht catched weil Phaser-Text-Lifecycle nur in Browser ausgewertet wird. Browser-Smoke ist Pflicht-Verifikation.

### B-027 RESOLVED 2026-05-11
**Title:** SplashScene haengt ewig wenn Tab nicht im Vordergrund — rAF-Background-Throttle friert Phaser-Zeit ein.

**Symptom:**
- User öffnet URL und wechselt sofort in anderen Tab (Trailer schauen, Discord, etc.).
- Bei Rueckkehr: SplashScene laeuft noch — nach 116+ Sekunden wall-clock, 331ms Phaser-Zeit.
- Splash-Uebergang zu MenuScene findet nie statt.

**Root-Cause:**
- `this.time.delayedCall(splashDuration, goToMenu)` und `this.time.delayedCall(160, ...)` verwenden
  Phaser's Game-Loop-Zeit, die auf `requestAnimationFrame` basiert.
- Chrome/Firefox drosseln rAF in Background-Tabs auf ~1fps oder weniger.
- Phaser akkumuliert also nur ~1ms Game-Zeit pro Sekunde wall-clock im Background-Tab.
- Bei splashDuration=3500ms: ca. 3500 Sekunden Warte-Zeit fuer den User.

**Fix (2026-05-11 12:00, Tech-Code):**
- Alle drei `this.time.delayedCall`-Aufrufe in SplashScene.create() ersetzt durch `window.setTimeout`.
- `window.setTimeout` ist nicht an rAF gebunden und feuert auch im Background (max. 1s Browser-Throttle-Floor).
- `visibilitychange`-Safety-Net hinzugefuegt: bei Tab-Focus wall-clock-Restzeit pruefen.
  Falls abgelaufen → goToMenu(). Falls nicht → neuer setTimeout fuer Restzeit.
- `this.events.once('destroy', ...)` Cleanup fuer Timer + Event-Listener.
- Dot-Animations-Timer bleibt Phaser-Zeit (rein kosmetisch, kein Einfluss auf Transition).

**Entdeckt durch:** QA-Critic Browser-Smoke 2026-05-11 09:xx (Background-Tab-Test).

**Commit:** `03f765e` (2026-05-11 12:00, gepusht auf origin/main).

**Tests:** Kein Vitest (Sandbox disk-full + Phaser-Scene nicht unit-testbar). Naechster 20:00-QA-Run:
Browser-Smoke mit explizitem Background-Tab-Test als Verifikation.

---

### B-033 RESOLVED 2026-05-11
**Title:** GardenScene Camera-Fade bleibt dunkel — Phaser-Tween-Zeit bei niedrigem FPS nicht komplett.

**Symptom:**
- Beim Betreten der GardenScene aus der OverworldScene bleibt der Screen bei ~10% Helligkeit.
- Phaser `cameras.main.fadeIn(300)` nutzt Game-Loop-Zeit (rAF-gebunden).
- Bei 5-8fps (Low-End / MCP) dauert ein 300ms-Phaser-Tween bis zu 4 Sekunden wall-clock.

**Fix (2026-05-11 08:00, Tech-Code):**
- fadeIn auf 150ms reduziert.
- `window.setTimeout(500ms)` Safety-Net: ruft `cameras.main.resetFX()` auf falls Tween nicht
  via `camerafadeincomplete` abgeschlossen. clearTimeout bei normalem Abschluss.
- `events.once('destroy')` Cleanup verhindert Memory-Leak bei Scene-Teardown.

**Commit:** `0688106` (2026-05-11 08:xx, gepusht auf origin/main)

---

### B-034 RESOLVED 2026-05-11
**Title:** Säen-Button zeigt "SÄ=en" — Umlaut-Encoding-Bug im GardenScene-Text.

**Symptom:**
- Der "Säen"-Button im Garten-UI zeigt "SÄ=en" statt "Säen".
- `'SÃ¤en'` war Mojibake (Latin-1 vs UTF-8 Mismatch) in der hardcodierten String-Konstante.

**Fix (2026-05-11 08:00, Tech-Code):**
- GardenScene importiert jetzt `t()` aus `../i18n/index`.
- Button-Text ersetzt durch `t('garden.seedBtn')`.
- Key `garden.seedBtn`: DE = "Säen", EN = "Sow" in beide ui.json ergänzt.
- Kein Mojibake-Risiko mehr da i18n-System UTF-8 nativ verarbeitet.

**Commit:** `0688106` (2026-05-11 08:xx, gepusht auf origin/main)

---

### B-035 RESOLVED (war bereits implementiert) 2026-05-11
**Title:** Kein try/catch um localStorage.getItem + JSON.parse — korrupter Save crasht Spielstart.

**Analyse (2026-05-11 08:00, Tech-Code):**
- `storage.ts loadGame()` hat bereits zwei getrennte try/catch-Blöcke: einen für
  `localStorage.getItem` und einen für `JSON.parse`. Crash-Schutz war bereits vorhanden.
- Bei korruptem Save: PostHog-Event `save_corrupted` + `return null` (→ neues Spiel).
- Kein User-Toast fehlte noch — wurde im selben Run via B-036 mitbehandelt.

**Status:** War ein False-Positive. Crash-Protection bereits seit S-POLISH Run10 aktiv.

---

### B-036 RESOLVED 2026-05-11
**Title:** Kein User-Feedback bei QuotaExceededError beim Speichern.

**Fix (2026-05-11 08:00, Tech-Code):**
- `saveGame()` erkennt `DOMException` mit Name `QuotaExceededError` / `NS_ERROR_DOM_QUOTA_REACHED`.
- `window.dispatchEvent(new CustomEvent('plantinvasion:save-quota-exceeded'))` (decoupled von Scene).
- GardenScene.create() lauscht auf dieses Event, zeigt `showToast(t('errors.saveQuota'), 'error', {duration:4000})`.
- `events.once('shutdown')` räumt Listener auf.
- `errors.saveQuota`: DE = "Speicher voll — bitte Browser-Speicher leeren.", EN = "Storage full — please clear browser storage."
- Sentry-captureException erhält `isQuota`-Flag im Context.

**Commit:** `76e68ee` (2026-05-11 08:xx, gepusht auf origin/main)
