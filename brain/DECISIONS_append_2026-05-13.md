# DECISIONS Append — 2026-05-13

## D-042 S-POLISH-Sprint verlängert bis 2026-05-17

**Datum:** 2026-05-13
**Entscheid:** Producer-Release
**Typ:** Sprint-Scope

**Entscheidung:** S-POLISH läuft weiter bis 2026-05-17 (war geplant bis 2026-05-03).

**Begründung:** FTUE-Schritte 1–5 stehen alle auf Score 2/5. Abschluss-Gates waren: Game-Critic-Review ≥ 4.3, Stardew-Audit alle 4 Scenes, Sentry zero P0/P1, Postmortem. Keines davon ist bestätigt grün. FTUE ist FI-Critical und blockt Closed-Alpha-Qualität direkt. Design-Balance hat FTUE-Spec (507 Zeilen) fertig, Tech-Code hat geantwortet und wartet auf Sprint-DoD-Spec. S-7.5 FTUE-Sprint beginnt erst wenn S-POLISH Quality-Gates erreicht.

**Konsequenz:** 
- S-POLISH endet 2026-05-17 23:59
- FTUE Phase A–D als Polish-Items im Sprint, kein Feature-Block
- S-7.5 (FTUE + FTUE-Polish) startet 2026-05-18
- Alle 7 Agenten erhalten aktualisierte Tasks bis EOD 2026-05-13

---

## D-043 FTUE-Sprint-DoD-Spec Phase A delegiert an Tech-Code

**Datum:** 2026-05-13
**Entscheid:** Producer-Release
**Typ:** Tech-Delegation

**Entscheidung:** brain/sprints/s-polish/ftue_phase_a.md ist die verbindliche Sprint-DoD-Spec für Tech-Code. Tech-Code startet Phase A beim nächsten Run ohne weitere Freigabe.

**Begründung:** Tech-Code hat in Response vom 2026-05-11 explizit auf diesen Spec gewartet. Kein Blockers ausser diesem Dokument. FTUEState + FTUEManager sind reine Logic-Files ohne Phaser-Dependency — kein Vitest-Disk-Full-Risk.

**Konsequenz:** Tech-Code nächster Run = Phase A sofort umsetzen. Antwort-Handoff nach Phase-A-Completion in brain/HANDOFFS/.

---

## D-044 Heimatdorf-BGM als Notfall-Placeholder via Tone.js

**Datum:** 2026-05-13
**Entscheid:** Producer-Release
**Typ:** Audio-Strategy

**Entscheidung:** Heimatdorf-BGM (FI-Score 1) bekommt Tone.js-Synth-Placeholder im nächsten Narrative-Sound-Run, unabhängig vom Suno-API-Status. Suno bleibt Primärziel für v1.0, Placeholder schiebt Score auf 3.

**Begründung:** Suno gab 503-Fehler am 2026-05-13. Spieler verbringt 80% der Zeit im Garten. Stille im Heimatdorf ist der auffälligste Audio-Gap in der Closed-Alpha. Tone.js-Placeholder ist kostengünstig, kein API-Risiko, in 1 Run umsetzbar.

**Konsequenz:** Narrative-Sound nächster Run prioritisiert Tone.js-Placeholder Heimatdorf-BGM (ähnlich titleBgm.ts aber wärmer). Score-Ziel: 1→3.

---

## D-045 CD-Pipeline-Bruch — P0 (Producer-Release Run 2026-05-13 08:00)

**Datum:** 2026-05-13
**Entscheid:** Producer-Release
**Typ:** Infrastruktur-P0

**Entscheidung:** Tech-Code hat P0-Auftrag: GitHub-Webhook-Verbindung zu Netlify reparieren. Keine anderen Tasks bis repariert (ausser Vitest-Rot-Fixes).

**Begründung:** Netlify-MCP liefert currentDeploy `69f2fbaa` vom 2026-04-30 (commit 3b5976ae, "fix garden xpBar"). Git-Log zeigt 15+ Commits seit 2026-04-30 die NICHT deployed wurden: alle FI-Arbeit (Boot-Time 4→5, 60-FPS-Lock 4→5, i18n QuestLogScene, B-033/B-034/B-036) ist für Spieler unsichtbar. Build-Log-Gap seit 2026-04-28 erklärt warum dieser Bruch unbemerkt blieb.

**Root-Cause (Hypothese):** Netlify-GitHub-Webhook expired oder API-Token nicht verlängert. Zu prüfen: Netlify Admin Site-Settings → Deploy → Build-Hooks + Repository-Verbindung.

**Impact:** 13 Tage FI-Arbeit nicht sichtbar, QA-Critic-Smoke-Tests gegen veralteten Build, FTUE-Tests auf falschem Stand.

**Konsequenz:** Tech-Code startet beim nächsten Run mit Webhook-Fix (P0 vor Phase-A-FTUE). Nach Fix: manueller Deploy-Trigger, Smoke-Test, Build-Log eintragen.

---

## D-046 Handoff-Eskalation 2026-05-11 (48h+ ohne Antwort)

**Datum:** 2026-05-13
**Entscheid:** Producer-Release
**Typ:** Eskalation

**Entscheidung:** Drei offene Handoffs vom 2026-05-11 werden via direkte Tasks in Agenten-Subfoldern eskaliert.

| Handoff | Empfänger | Aktion |
|---|---|---|
| Art-UI → Tech-Code: Title-Logo + Loading | Tech-Code | Task gesetzt, P1 nach P0-Fix |
| Design-Balance → Narrative-Sound: Tilda-Dialog | Narrative-Sound | Task gesetzt, direkte Umsetzung |
| Design-Balance → Tech-Code: FTUE-Impl. | Tech-Code | Task gesetzt, Phase A nach CD-Fix |

**Begründung:** Handoff-Regel: kein Handoff älter als 12h ohne Reaktion → direkte Task-Setzung. 48h überschritten.

---

## D-047 FI-Item Producer-Release Run 2026-05-13 08:00

**FI-Item dieser Run:** CD-Pipeline-Reparatur-Eskalation
**Vorher-Score:** alle FI-Items faktisch 0 für Spieler (Deploy stuck 2026-04-30)
**Ziel:** D-045 dokumentiert, Tech-Code-Task gesetzt, Slack-Alert gesendet
**Iteration:** #1
**Begründung:** Producer-Release owned die Build-Pipeline. Pipeline-Bruch blockiert alle 22 FI-Items faktisch für Spieler.
