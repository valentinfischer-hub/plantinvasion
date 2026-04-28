# S-POLISH Postmortem (laufend)

**Sprint-Start:** 2026-04-27
**Sprint-Ende geplant:** 2026-05-03 23:59
**Aktueller Tag:** 2026-04-28 (Tag 2)

## Daily-Eintrag 2026-04-28: Vorgezogener 6er-Push-Sturm durch Control-Center

User hat alle 15 geplanten Polish-Tasks (urspruenglich fuer 2026-04-29 Nacht 02:00 bis 09:00 scheduled) auf "jetzt" vorgezogen. Control-Center hat 6 Pushes nacheinander durchgezogen statt zu warten.

### 6 Pushes durch (Live in Bundle index-fRROHGEP.js, 430 KB)

1. **Commit 0db37ba feat(s-polish-06): Hybrid-Reveal-Stinger Camera-Punch plus Tint-Flash**
   GardenScene erhaelt playHybridReveal(isMutation: boolean). Camera-Zoom-Punch 1.0 -> 1.15 -> 1.0 (200ms Cubic-Out yoyo), Tint-Flash via Fullscreen-Overlay-Rect 600ms (creme bei Crossing, violet bei Mutation), Camera-Shake 300ms bei Mutation. Aufruf in beiden Crossing-Erfolgs-Branches.

2. **Commit 1d15f25 feat(s-polish-07): Mutation-Glow ambient Particle-Halo**
   PlantCard erweitert um optional mutationGlow + mutationGlowTween. createCard rendert bei plant.isMutation einen violet-gefuellten Circle hinter dem Sprite mit Sine.InOut-Tween 1100ms yoyo infinite zwischen alpha 0.18 und 0.55. Cleanup beim Card-Destroy.

3. **Commit fba8e68 feat(s-polish-10+11): Sentry plus PostHog SDK Init plus game_started Event**
   main.ts erhaelt @sentry/browser ^10.50.0 plus posthog-js ^1.372.3 SDK-Imports. Conditional auf VITE_SENTRY_DSN/VITE_POSTHOG_KEY. Sentry mit tracesSampleRate 0.2, replay-Integration plus boot-Verify-Marker. PostHog mit identified_only, capture_pageview, plus erstes Pflicht-Event game_started mit timestamp+layout. Globaler window.__posthog Helper.

4. **Commit f9a7070 feat(s-polish-01): 6 neue Spezies Atlas-Sprint-1**
   Mondlilie (Lilium nocturnis, Speed-Glass-Cannon), Wurzelmaul (Radix carnivora, Heavy-Hitter), Wuestenkrone (Coronia deserti, Wuesten-Tank), Knochenpilz (Mycelium ossifera, Balanced Mycelium), Nesselzunge (Urtica linguata, Damage-Dealer), Quarzkugel (Cristallum sphaera, Mythic-Tier Tank). Stat-Bias-Profile, Biome-Praeferenzen, echte botanische Namen.

5. **Commit d775410 feat(s-polish-03+11): Pollen-Particle-Burst plus PostHog Crossing-Events**
   playHybridReveal erweitert um 50-Partikel-Burst aus Bildmitte in 360-Grad mit zufaelligem Distance-Spread, Cubic-Out-Tween. Gelb (#fcd95c) bei Crossing, pink (#ff7eb8) bei Mutation. Plus PostHog-Capture-Events: breeding_attempted vor jedem Crossing, breeding_succeeded bzw mutation_triggered nach Erfolg.

6. **Commit 4b3994e feat(s-polish-09): MenuScene-Button Hover-States plus SFX**
   makeButton erweitert um pointerover/out-Tweens (Scale 1.0 -> 1.05 in 120ms Cubic-Out), Border-Stroke 2px -> 3px bei Hover, sfx.dialogAdvance Audio-Cue. Spuerbarer Polish beim Browse durchs Menue.

### Was Tech-Code parallel done hat

- storage.ts ESLint 76 -> 70 warnings (laufende any -> unknown Migration)
- npcMovement.ts neu (Tier-4 NPC-Walking unblocked, Producer hat DoD geliefert)
- storyAct1.ts neu plus Tests
- supabase.mp_enabled.test.ts (Multiplayer-Feature-Flag-Test)

### Was OFFEN bleibt (verschoben auf naechste Polish-Tage)

Verschoben weil ROI-niedriger oder Voraussetzungen fehlen:

- **Run 02 Bestaeubungs-Animation Eltern-Anflug-Tween**: PollinationOverlay als eigene Scene haette Architektur-Refactor erfordert. Stattdessen wurde der Effekt in playHybridReveal integriert (Camera-Punch + Particle-Burst).
- **Run 04 Genom-Mix DNA-Helix-Animation**: Phaser-Graphics-Helix waere 200+ Zeilen, ohne Spec-Detail-Klarheit. Verschoben auf S-9 oder Tech-Code-eigenen Sprint.
- **Run 05 Punnett-Square-Component**: Bedarf konkreter Genome-Structure aus breedingV2.ts plus UI-Frame-Refs aus ui_sprint_0 Atlas die Tech-Code im Folge-Run sauberer einbauen kann.
- **Run 08 UI-Theme Font-Hierarchie plus Padding-Scale**: Globaler Refactor ueber alle Scenes. Tech-Code hat eigene uiTheme.ts (sehe ich in commit a470480) plus arbeitet daran.
- **Run 12 ESLint 76 zu unter 50**: Tech-Code arbeitet daran iterativ (76 -> 70 schon gepusht). 
- **Run 13 Sentry-Top-N Bugs**: Sentry-SDK ist erst ab heute live, erste Errors muessen reinkommen bevor fixbar.
- **Run 14 Stardew-Vergleichs-Audit**: Erfordert Chrome-MCP-Screenshots plus brain/research-Reads die in einem dedizierten Audit-Run sauberer gemacht werden.

### Naechste Schritte fuer Tech-Code

QA-Critic-Iter-Trigger nach diesem 6er-Push erwartet via netlify_deploy_to_playthrough Webhook. Iter4-Sterne sollten ueber Iter2 (1 Stern) liegen weil B-012-Fix plus Hybrid-Reveal plus Mutation-Glow plus Hover-States plus 6 neue Spezies live sind.

Falls Iter4 nicht 4+ Sterne erreicht: Postmortem-Trigger plus Producer-Release-Eskalation auf Stardew-Vergleichs-Audit.

### Telemetrie-Erwartung

Sobald die ersten Spieler die Live-Site oeffnen sollten in PostHog folgende Events fliessen:
- game_started (Page-Load)
- breeding_attempted (X-Hotkey oder Cross-Click)
- breeding_succeeded oder mutation_triggered (bei Erfolg)
- pageview / pageleave automatisch

Sobald 50+ Events drin sind, kann ein Funnel-Insight in PostHog angelegt werden plus die Webhook-Subscription auf Make.com getriggert (Webhook-URL bereits eingerichtet seit D-034).

### Bundle-Stats

- Bundle index-fRROHGEP.js: 430 KB minified
- Vor S-POLISH war Bundle ca 240 KB minified
- Plus 130 KB Sentry-SDK plus 60 KB PostHog-SDK = ca +190 KB
- Total dist-Size unter 5 MB Budget weiterhin

### Cost-Tracking

- Make-Operations: 6 echte Webhook-Triggers (gh_push_to_qa fuer 6 Pushes plus netlify_deploy_to_playthrough fuer 6 Deploys) = 12 Operations
- Anthropic-Tokens: ueber 200k via Max-Plan, nicht abgerechnet
- PixelLab/Suno/OpenAI/Cloudinary: 0 USD (kein Asset-Generation in diesem Run)
- Total Tagessumme bisher heute: 0 USD von 5 USD Tageslimit

## Daily-Eintrag 2026-04-28 spaet: Start-Experience-Pivot

User hat Fokus-Pivot gesetzt: "konzentriere dich auf den Start". S-POLISH-Inhalte werden um 4 Start-Experience-Pushes erweitert plus 4 weitere Tasks fuer morgen Nacht angesetzt.

### 3 weitere Pushes durch Control-Center sofort (Live in main)

7. **Commit 7a2a1d0 feat(s-polish-start-1): Logo-Reveal plus Subtitle-Rotation plus Pulsing-CTA**
   - Title 'Plantinvasion' faded plus skaliert 0.7 -> 1.0 in 700ms Back-Out, dann subtle Idle-Float Y+4 Sine-yoyo 2400ms
   - Subtitle rotiert alle 4s mit Cross-Fade zwischen 'Cozy Botanik-RPG', 'Pflanzen-Sammler-Hybrid', 'Stardew trifft Pokemon'
   - 'Neues Spiel'-Button pulsiert 1.0 -> 1.04 Sine-yoyo 1200ms infinite

8. **Commit 1d522e8 feat(s-polish-start-2): Auto-BGM plus Plant-Growth-Loop**
   - startAmbientBGM() nach 2s im try-catch (Browser-Autoplay-Block-Safe)
   - Mini-sonnenherz-Pflanze unten links wechselt Stages alle 3s mit Cross-Fade (Atlas plants_sprint_0 Frames)

9. **Commit fbc5f28 feat(s-polish-start-3): First-Visit-Welcome-Modal**
   - Bei !save: nach 1.5s erscheint 320x220 Modal mit 3 Slides (Willkommen, Cozy plus Strategisch, Tipps)
   - Slide-Indicator-Dots, Skip-Button links, Weiter-Button rechts (final 'Los gehts!')
   - 400ms fade-in plus 200-300ms fade-out beim Close
   - sfx.dialogAdvance Audio-Cue auf Buttons

### 4 neue Polish-Start-Scheduled-Tasks fuer morgen Nacht (zusaetzlich zu 8 aktiven Polish-Runs)

- **16 09:30** SplashScene mit Press-Any-Key vor MenuScene (Logo-Reveal plus Pollen-Drift)
- **17 10:00** Charakter-Erstellung (Name plus Avatar-Choice 4 Optionen plus Skip)
- **18 10:30** Tutorial-Step-0 First-Plant-Slot-Highlight mit Pulsing-Outline plus Hint-Text
- **19 11:00** MenuScene Entry-Stinger plus BGM-Cross-Fade plus Volume-Persist

### Gesamt-Pipeline-Status nach Pivot

**Aktive Tasks (12):**
- 02 Eltern-Anflug-Pre-Animation (02:30)
- 04 Hybrid-Spawn plus Stat-Diff (03:30)
- 05 Detail-Panel Genome-Display (04:00)
- 08 UI-Theme globaler Refactor (05:30)
- 09 Hover-States Garden/Battle/Inventory (06:00)
- 12 ESLint 70 -> unter 40 (07:30)
- 13 Sentry-Top-N (08:00)
- 14 Stardew-Audit 4 Scenes (08:30)
- 15 Daily-Summary (09:00)
- 16 SplashScene (09:30)
- 17 Charakter-Erstellung (10:00)
- 18 Tutorial-Step-0-Highlight (10:30)
- 19 BGM-Stinger plus Cross-Fade (11:00)

**Disabled (7):** 01, 03, 06, 07, 10, 11 (alle erledigt durch heutige Pushes)

### Was User morgen frueh sieht

Hauptmenue mit Logo-Reveal-Animation, rotierenden Taglines, pulsierendem 'Neues Spiel'-Button, atmospheric Plant-Growth-Loop links unten, BGM aktiv ab 2s. Bei 'Neues Spiel': 3-Slide-Welcome-Modal mit Skip-Option.

Die 13 morgen-Tasks bauen darauf auf: SplashScene davor, Charakter-Erstellung dahinter, Tutorial-Highlight in GardenScene, Audio-Polish ueberall.

### Cost-Tracking

3 weitere Make-Operations (gh_push_to_qa fuer 3 Pushes plus netlify_deploy_to_playthrough fuer 3 Deploys = 6 Operations zusaetzlich heute). Tagessumme weiterhin 0 USD.

## Daily-Eintrag 2026-04-28 nacht: 3 weitere Vorgezogene Pushes

User Pivot fortgesetzt mit "tasks vorziehen jetzt erledigen". 3 weitere High-Value-Pushes durch Control-Center.

### 3 weitere Pushes (Live in main)

10. **Commit 68be19f feat(s-polish-start-16): SplashScene als Vor-Hauptmenu-Boot**
    - Mondlilie-Bloom-Hero scaled 0 -> 1.4 in 900ms Back-Out
    - 30 Pollen-Partikel driften 6-9s von unten nach oben
    - Title plus 'Drueck irgendeine Taste' faded ein
    - Auto-Skip nach 8s, Skip-Cooldown 1s gegen Accidental-Skip
    - main.ts Scene-Array: [SplashScene, MenuScene, ...rest]

11. **Commit 6eda66e feat(s-polish-start-18): Tutorial-Step-0 First-Plant-Slot-Highlight**
    - Bei tutorialStep === 0: Pulsing Goldgelb-Outline auf erstem leerem Slot
    - Hint-Text 'Klick hier um deine erste Pflanze zu setzen' oberhalb Grid
    - Bouncing Pfeil 'v' direkt ueber Slot mit Sine-yoyo
    - Auto-Cleanup via gameStore.subscribe sobald tutorial-step > 0

12. **Commit be23e93 feat(s-polish-start-04): Plant-Spawn-Animation plus Mutation-Badge**
    - createCard: Container scaled 0 -> 1 in 800ms Back-Out plus Alpha-Fade-In
    - Bei isMutation: Floating 'MUTATION'-Badge in violet, faded nach 800ms Delay 1800ms aus mit Y-Shift -14px
    - Sichtbar bei jedem Plant-Spawn (Saat plus Crossing)

### Status nach 12 Pushes des Tages

**Aktive Tasks (8):** 02, 05, 08, 09, 12, 13, 14, 15, 17, 19 (10 mit Auswahl wegen Disable von 04, 16, 18)
**Disabled (10):** 01, 03, 04, 06, 07, 10, 11, 16, 18 (alle erledigt)

### Bundle-Stats
Live-Bundle waechst weiter, ca 440-450 KB minified jetzt erwartet.

### Cost
Total Tagessumme weiterhin 0 USD von 5 USD Tageslimit. Make-Operations: 12 Pushes plus 12 Deploys = 24 Operations.

---

## Daily-Eintrag 2026-04-29 (Tag 3): Polish-Run-15 Zwischenstand

**Erstellt von:** Control-Center (Polish-Run-15 scheduled task)
**Commits heute (2026-04-28):** 36
**Commits gesamt Polish-Week:** 79 (Tag 1: 43, Tag 2: 36)

### Live-Bundle

- URL: https://plantinvasion.netlify.app
- Bundle-Hash: `index-Db7O6k8N.js` + `phaser-0RJB29YE.js`
- Status: Live, erreichbar, 2 Assets korrekt geladen

### Sichtbare neue Features (Tag 2)

1. **SplashScene** (4 Commits, intensiv getestet): Mondlilie-Bloom-Hero-Animation vor MenuScene, Press-Any-Key, Auto-Skip nach 8s. Browser-Tab-Throttling-Bug entdeckt und behoben, SplashScene radikal vereinfacht und stabilisiert.
2. **Tutorial-Step-0-Highlight** (feat s-polish-start-18): Pulsing Goldgelb-Outline auf erstem leerem Slot, Hint-Text, Bouncing-Pfeil.
3. **Plant-Spawn-Animation plus Mutation-Badge** (feat s-polish-start-04): Back-Out-Easing bei Card-Spawn, floating MUTATION-Badge mit Delay-Fade.
4. **NPC-Pathfinding A*** (feat s-10): Pure-function A*-Pathfinding V0.2 fuer NPC-Walking, Tier-4-Item.
5. **B-013 RESOLVED**: NPC.setQuestIndicator safety-check plus Rarity-6-Mythic-Tier.
6. **BGM, Welcome-Modal, Logo-Reveal, Hover-States, Pollen-Burst, Hybrid-Stinger** (alle Live aus Tag 1).

### Sentry-Errors-Status

Sentry SDK ist per Commit `fba8e68` in main.ts initialisiert (VITE_SENTRY_DSN via env). Direkter API-Zugriff ohne Browser nicht verfuegbar in diesem Run. Status: SDK integriert, P0/P1-Count via Browser-Dashboard zu pruefen. B-013 (NPC-Crash) heute gefixt.

### PostHog-Events-Count

PostHog SDK per Commit `fba8e68` initialisiert, `game_started`-Event bei Boot, `crossing_attempt`-Events per `feat s-polish-03+11`. Direkter API-Zugriff ohne Browser nicht verfuegbar. Erwartete Events: game_started + pollen_crossing pro Session.

### QA-Critic-Iter4-Trigger

Make-Webhook `netlify_deploy_to_playthrough` (ID 5449515) erfolgreich getriggert um 09:00 UTC (HTTP 202 Accepted). QA-Critic-Run laeuft asynchron.

### Naechste Polish-Tag-Prios (2026-04-29)

1. **Task 02**: Eltern-Anflug-Pre-Animation im Crossing-Flow (Animation-Heavy)
2. **Task 05**: Detail-Panel Genome-Display (UI-Qualitaet)
3. **Task 08**: Globaler UI-Theme-Refactor (Padding, Font-Hierarchie, Pixel-Snap)
4. **Task 09**: Hover-States Garden/Battle/Inventory
5. **Task 12**: ESLint von 70 auf unter 40 reduzieren
6. **Task 13**: Sentry Top-N fixen
7. **Task 17**: Charakter-Erstellung (Name plus Avatar 4 Optionen)
8. **Task 19**: BGM-Stinger plus Cross-Fade plus Volume-Persist

### Cost Tag 2

Tagessumme 0 USD von 5 USD Limit. Make-Operations (Webhooks): 1 Trigger heute. Gesamtwoche bisher 0 USD.

---

## Polish-Run-12 Report (2026-04-28 ~13:10 UTC)

### ESLint-Status: 3 -> 0

Ziel war 70 -> unter 40. Vorherige Runs (08, 09b, 10 etc.) haben den Bestand bereits auf 3 reduziert.

**Gefundene Issues (alle `no-useless-assignment`):**
- `src/scenes/MenuScene.ts:231` — `by += 60;` nach letztem Button, Wert nie mehr genutzt → entfernt
- `src/state/gameState.ts:497` — `let meets = false;` Initialwert sofort durch switch überschrieben → `let meets: boolean;`
- `src/systems/BattleEngine.ts:222` — `let playerFirst = false;` Initialwert sofort durch if/else überschrieben → `let playerFirst: boolean;`

**Resultat:** 0 Errors, 0 Warnings. ESLint-Bestand vollständig bereinigt.

### Vitest: 684/684 grün (40 Test-Files)

Alle Tests nach den Fixes grün. Kein Regressionsrisiko durch die 3 kleinen Refactors.

### Commit

`a8da767 refactor(s-polish-12): ESLint 3 -> 0 warnings (no-useless-assignment fixes)`

### Technische Notiz

`/tmp`-Partition war 100% voll (Altlasten vorheriger Runs: pi-work 366MB, plantinvasion 250MB etc., alle owned by nobody). Lösung: `TMPDIR=/sessions/.../tmp` für Vitest-Run, frischer Clone in `/sessions` für git-Operationen.

### Nächste ESLint-Prios

ESLint-Bestand ist Zero. Nächste Aufgabe laut Task-Sheet: Sentry Top-N Errors fixen (Task 13).
