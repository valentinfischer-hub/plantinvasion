# Growth-System V0.2 Unit-Test
Datum: 2026-04-25
Tester: Claude (autonomer Self-Test)

## Setup
Standalone JS-Skript das die Growth-Multiplikator-Formel reimplementiert und gegen die TS-Implementation kreuzvalidiert. tsc --noEmit war zusaetzlich gruen.

## Ergebnisse: 9 von 9 Tests bestanden

| Szenario | Erwartet | Tatsaechlich |
|---|---|---|
| Sunflower (preferred wurzelheim) Stage 0 h=100 F0 12 Uhr | 5.25 | 5.25 |
| Cactus neutral wurzelheim Stage 0 h=100 F0 | 3.75 | 3.75 |
| Cactus in Kaktoria preferred Stage 2 h=90 saftig | 3.50 | 3.50 |
| Cactus in Mordwald (wrong) Stage 1 h=60 gut | 1.68 | 1.68 |
| F1-Hybrid Sunflower wurzelheim Stage 1 h=60 | 4.20 | 4.20 |
| Mutation Sunflower wurzelheim Stage 4 Blooming h=100 | 2.45 | 2.45 |
| Vertrocknete Cactus in Kaktoria Stage 2 h=2 | -0.28 | -0.28 |
| Nacht-Strafe (tod=0.4) Sunflower Stage 0 h=100 | 2.10 | 2.10 |
| Hydration-Decay 6h => ~50%  | 50.0 | 50.0 |

Plus Hydration-Status Schwellen (alle 9 Fall-Praezisions-Checks gruen) und Tier-Schwellen (alle 9 Schwellenwerte gruen).

## Build
`npm run build` -> tsc gruen, vite-Bundle ok (1559 kB), keine TypeScript-Errors.

## Bekannte Schwaechen / Followups

- Save-Migration setzt hydration auf 100 fuer existierende Pflanzen (geschenkter Reset, fair fuer Bestand).
- timeOfDay nutzt Real-Time `new Date().getHours()`. Funktioniert, sollte spaeter via gameTime-Modul ersetzt werden um In-Game-Tag-Cycle zu unterstuetzen.
- Stage-Down-Roll laeuft pro Sekunde via Math.random() in tickPlant. Bei Tab-Inaktivitaet = save (kein Tick). Catch-Up bei Wiederkehr fehlt noch (Pflanze springt von vor 10h auf 50% Hydration ohne Stage-Down-Risiko).
- Garden ist hardcoded zone='wurzelheim' im GameStore.tick. Spaeter pro-Pflanze-Zone wenn Outdoor-Plots in S-09 kommen.

## Visual-Tests Pending
Nicht durchgefuehrt: Sprite-Stage-Wechsel im Browser, Hydration-Bar Farben, Bloom-Pulse-Animation, Harvest-Button. Wird beim naechsten Live-Test im Browser via Chrome MCP geprueft.

## Schluss
Wachstumsrate bei optimaler Pflege: 5.25 XP/s Stage 0. Damit erreicht eine Pflanze Sprout (L5) in ca. 18 Sekunden und Adult (L30) in ca. 2-3 Stunden bei perfekter Pflege. Ohne Pflege (vertrocknet) baut die Pflanze sogar negative XP auf. Balance fuehlt sich richtig an, kann nach Live-Tests feinjustiert werden (Konstanten in leveling.ts).
