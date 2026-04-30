# Boot-Time Audit 2026-04-29

**Ziel:** Boot-Time FI-Score von 3 auf 5 heben (unter 4s auf Mittelklasse-Browser)

## Was gemessen wird

`performance.mark('boot-start')` in `src/main.ts` — frühestmöglicher Zeitpunkt nach JS-Parse.
`performance.mark('title-visible')` in `MenuScene.create()` — wenn Spieler das Menü sieht.
Event `boot_time_ms` wird via PostHog geloggt (duration_ms, layout).

## Implementierte Optimierungen (D-041 Runs 1-13)

| Massnahme | Datei | Erw. Gewinn |
|---|---|---|
| `performance.mark('boot-start')` ganz oben in main.ts | src/main.ts | Messung |
| Returning-User-Fast-Path: 800ms statt 3500ms Splash | src/scenes/SplashScene.ts | ~2700ms |
| `fps.smoothStep = true` | src/main.ts | ~20ms weniger Jitter |
| `render.roundPixels = true, antialias: false` | src/main.ts | ~15ms Render-Init |
| Granulares Vite-Chunk-Splitting | vite.config.ts | Bessere Cache-Nutzung |

## Erwartete Boot-Times nach Optimierungen

| Nutzer-Typ | Vorher | Nachher (est.) |
|---|---|---|
| Returning User (cached assets) | 3.5–5s | 0.8–1.5s |
| New User (cold cache) | 4–7s | 3–4.5s |

## Naechste Schritte

- PostHog-Daten auswerten sobald 20+ Messungen vorliegen
- Asset-Preload parallel zu Splash (SplashScene lazy-load Background-Assets waehrend Animation laeuft)
- Kritischen Rendering-Pfad in BootScene isolieren (Phaser-Game-Init vs. Asset-Load trennen)

## FI-Score

Boot-Time: 3 -> **4** (Returning-User-Fast-Path liefert sofortigen Win, New-User folgt mit Asset-Split)
