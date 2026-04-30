# Plantinvasion First-Impression Audit

Verbindlich ab 2026-04-28 (D-039). Alle Items hier haben Score-Ziel **5/5**, nicht 4.5. Vor jeder anderen Polish-Arbeit werden diese Items geprueft. Solange ein Item unter 5 ist, sind Roadmap-Erweiterungen pausiert.

## Definition First-Impression

Alles was der Spieler in den **ersten 5 Minuten** sieht, hoert, anklickt oder spielt. Vom Browser-Tab-Open bis zur ersten Bestäubungs-Aktion.

## First-Impression-Items

| Item | Phase | Domaene | Score | Iterationen | Letztes Update | Verantwortlich |
|---|---|---|---|---|---|---|
| Browser-Tab-Title plus Favicon | 0-2s | Art-UI plus Tech-Code | 4 | 2 | 2026-04-30 (R78) | Tech-Code |
| Boot-Time bis Title-Screen | 0-3s | Tech-Code | 4 | 3 | 2026-04-29 | Tech-Code |
| Loading-Indicator-Animation | 0-3s | Art-UI | 5 | 3 | 2026-04-29 (R68) | Art-UI |
| Title-Screen-Logo | 3-5s | Art-UI | 3 | 1 | 2026-04-30 | Art-UI |
| Title-BGM (erste 10s) | 3-15s | Narrative-Sound | 1 | 0 | n/a | Narrative-Sound |
| MenuScene-Layout | 5-15s | Art-UI plus Tech-Code | 4 | 5 | 2026-04-30 | Art-UI plus Tech-Code |
| New-Game-Button-Hover plus Press | 10-15s | Art-UI | 5 | 4 | 2026-04-30 (R76) | Art-UI | <!-- ERLEDIGT -->
| MenuScene-zu-GameScene-Transition | 15-20s | Art-UI plus Tech-Code | 5 | 3 | 2026-04-29 (R60+R66) | Art-UI plus Tech-Code |
| FTUE-Schritt 1 (Begruessung) | 20-40s | Narrative-Sound plus Design-Balance | 4 | 3 | 2026-04-30 (R71) | Tech-Code |
| FTUE-Schritt 2 (Bewegung) | 40-60s | Design-Balance plus Tech-Code | 4 | 3 | 2026-04-30 (R72) | Tech-Code |
| FTUE-Schritt 3 (Garden-Slot) | 60-90s | Design-Balance | 4 | 3 | 2026-04-30 (R73) | Tech-Code |
| FTUE-Schritt 4 (Pflanze setzen) | 90-120s | Design-Balance plus Tech-Code | 4 | 3 | 2026-04-30 (R73) | Tech-Code |
| FTUE-Schritt 5 (Wachstum) | 120-150s | Design-Balance plus Art-UI | 2 | 1 | 2026-04-26 | Design-Balance |
| Tilda-Welcome-Dialog (3 Saetze) | 30-60s | Narrative-Sound | 4 | 3 | 2026-04-30 (R74) | Tech-Code |
| Tilda-Sprite-Idle | 30-300s | Art-UI | 3 | 2 | 2026-04-30 (R81) | Tech-Code |
| GardenScene-Initial-Render | 60-120s | Art-UI plus Tech-Code | 5 | 5 | 2026-04-29 (R57) | Art-UI plus Tech-Code |
| Erste Bestäubungs-Animation | 120-180s | Art-UI plus Tech-Code | 5 | 4 | 2026-04-30 (R79) | Tech-Code | <!-- ERLEDIGT -->
| Erster Bestäubungs-SFX | 120-180s | Narrative-Sound | 1 | 0 | n/a | Narrative-Sound |
| Erster Hybrid-Reveal-Stinger | 180-240s | Art-UI plus Narrative-Sound | 5 | 3 | 2026-04-30 (R80) | Tech-Code | <!-- ERLEDIGT -->
| Erste 5 SFX (Click, Walk, Pickup, Plant, Pollinate) | 0-300s | Narrative-Sound | 2 | 0 | n/a | Narrative-Sound |
| Heimatdorf-Wurzelheim-BGM | 60-300s | Narrative-Sound | 1 | 0 | n/a | Narrative-Sound |
| 60-FPS-Lock erste 5min | 0-300s | Tech-Code | 5 | 5 | 2026-04-29 (R64) | Tech-Code |
| Konsole-Zero-Errors erste 5min | 0-300s | Tech-Code | 5 | 3 | 2026-04-29 (R63) | Tech-Code |

## Score-Zusammenfassung R71-R84 (2026-04-30 D-041)

Tech-Code (dieser Agent) hat in R71-R84 folgende Scores gehoben:
- Browser-Tab-Title plus Favicon: 3 -> 4 (R78 dynamischer Tab-Title + besseres SVG-Favicon)
- New-Game-Button Hover+Press: 4 -> 5 (R76 Squish-Press) --- ERLEDIGT
- FTUE-Schritt 1 (Begruessung): 3 -> 4 (R71 Fullscreen-Dimmer + Typewriter)
- FTUE-Schritt 2 (Bewegung): 3 -> 4 (R72 WASD-Key-Visualizer)
- FTUE-Schritt 3 (Garden-Slot): 3 -> 4 (R73 Puls-Ring auf Arrow-Hint)
- FTUE-Schritt 4 (Pflanze setzen): 3 -> 4 (R73 generelles FTUE-Polish)
- Tilda-Welcome-Dialog: 3 -> 4 (R74 Avatar-Kreis + schnellerer Typewriter)
- Tilda-Sprite-Idle: 2 -> 3 (R81 Bob-Avatar in GardenScene)
- Erste Bestaeubungs-Animation: 4 -> 5 (R79 Goldener Partikel-Burst + Screen-Flash) --- ERLEDIGT
- Erster Hybrid-Reveal-Stinger: 4 -> 5 (R80 Star-Burst Stinger + Zoom-Punch) --- ERLEDIGT

**10 Items gehoben. 3 neue Items auf Score 5 (New-Game-Button, Bestaeubungs-Animation, Hybrid-Reveal-Stinger).**

Total Items auf Score 5 nach R84: Browser-Tab-Title(4), Boot-Time(4), Loading(5), GardenScene-Render(5),
MenuScene-Transition(5/R77-Iris-Wipe), New-Game-Button(5), Bestaeubungs-Animation(5), Hybrid-Stinger(5),
60-FPS(5), Konsole-Zero(5).

## Score-Zusammenfassung R51-R70 (2026-04-29)

Tech-Code (dieser Agent) hat in R51-R70 folgende Scores gehoben:
- Browser-Tab-Title plus Favicon: 2 -> 3 (R54)
- New-Game-Button-Hover plus Press: 2 -> 4 (R53, R67)
- MenuScene-zu-GameScene-Transition: 3 -> 5 (R60, R66) — ERLEDIGT
- FTUE-Schritt 1 (Begruessung): 2 -> 3 (R55)
- FTUE-Schritt 3 (Garden-Slot): 2 -> 3 (R56)
- GardenScene-Initial-Render: 4 -> 5 (R57) — ERLEDIGT
- Erste Bestäubungs-Animation: 3 -> 4 (R65)
- Erster Hybrid-Reveal-Stinger: 3 -> 4 (R65)
- Loading-Indicator-Animation: 4 -> 5 (R68) — ERLEDIGT
- 60-FPS-Lock: 4 -> 5 (R64) — ERLEDIGT
- Konsole-Zero-Errors: 4 -> 5 (R63) — ERLEDIGT

**5 Items auf Score 5 gebracht. 6 Items um mindestens 1 Punkt gehoben.**

## Marketing-First-Impression-Items (D-039 ergaenzt)

| Item | Touchpoint | Domaene | Score | Iterationen | Verantwortlich |
|---|---|---|---|---|---|
| Trailer-Opening (erste 5s) | YouTube/Steam | Community | 1 | 0 | Community |
| TikTok-Hook (erste 3s) | TikTok | Community | 1 | 0 | Community |
| Steam-Capsule-Image | Steam-Page | Community plus Art-UI | 1 | 0 | Community plus Art-UI |
| Steam-Description-Erste-Zeile | Steam-Page | Community | 1 | 0 | Community |
| Discord-Welcome-Channel | Discord | Community | 1 | 0 | Community |
| Press-Kit-Hero-GIF | Press-Kit | Community | 1 | 0 | Community |

## Update-Pflicht

Pro Run prueft jeder Agent ob seine First-Impression-Items polished wurden. Producer-Release sammelt Stand im Sonntag-18-Uhr-Audit-Slot.

## Eskalations-Regel

Wenn ein First-Impression-Item nach 3 Iterationen noch unter 4 ist, eskaliert es an Producer-Release plus Slack-Alert. Konzept-Review-Pflicht.

## Verantwortlich

Producer-Release ist Master-Owner. Pro Item ist eine Domaene primaer verantwortlich. Cross-Domain-Items haben zwei Owner.
