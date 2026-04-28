# Plantinvasion Brain Index

Das Brain ist die persistente Wissensbasis von Claude fuer Plantinvasion. Bei jeder neuen Session wird zuerst dieses File gelesen, dann die referenzierten Files je nach aktueller Aufgabe.

## Struktur

```
brain/
├── INDEX.md                    (dieses File, Einstiegspunkt)
├── DECISIONS.md                (Strategische Entscheidungen, append-only)
├── ACTIVE_SPRINT.md            (Aktueller Sprint, naechster Schritt)
├── COSTS.md                    (API-Kosten-Tracker)
├── research/                   (Externes Wissen aus Deep-Research)
│   ├── pokemon_red_mechanics.md
│   ├── stardew_valley_mechanics.md
│   └── indie_game_dev_playbook.md
├── design/                     (Game-Design-Dokumente)
│   ├── GDD.md                  (Game Design Document, kanonisch)
│   ├── growth_system.md       (Aufwachsystem V0.2: Hydration, Quality-Tier, Bloom)
│   ├── booster_system.md      (Booster-Items V0.1, Soil-Tiers)
│   ├── seed_acquisition.md     (Seed-Items, Daily-Login, Markt-Roster)
│   ├── biome_mordwald.md       (Karnivoren-Sumpf-Biom V0.1)
│   ├── biome_magmabluete.md    (Vulkan-Pyrophyt-Biom V0.1)
│   ├── endgame.md              (Endgame V0.1, Mythical, Verodyne, Eden Lost)
│   ├── pokedex.md              (Pflanzen-Datenbank)
│   ├── worldmap.md             (Regionen, Encounter-Tabellen)
│   ├── battle_system.md        (Kampfregeln und Formeln)
│   ├── crossing_system.md      (Genetik-Regeln)
│   ├── items.md                (Item-Katalog)
│   └── progression.md          (Balance, XP-Kurven, 100h-Plan)
├── tech/                       (Technische Notizen)
│   ├── architecture.md         (Phaser-Scenes, Code-Layout)
│   ├── save_system.md          (Save-Struktur, Versioning)
│   ├── save_v11_plan.md        (PROPOSED V11-Bump fuer NPC-State-Persistence)
│   ├── tier_status.md          (Tier 1-6 Status, V2-SKILL)
│   └── tool_learnings.md       (Was funktioniert wie mit MCPs)
├── sprints/                    (Aktive DoD-Specs)
│   └── S-09/                   (npc-walking.md, story-akt-1.md)
├── qa/
│   └── bugs.md                 (Bug-Tracker, B-012 RESOLVED)
├── agents/
│   ├── tech-code/              (Tech-Code STATE.md)
│   └── qa-critic/              (browser_smoke_plan.md)
├── playtests/                  (Test-Ergebnisse, Feedback, Bugs)
└── postmortems/                (Sprint-Rueckblicke)
```

## Lesereihenfolge bei Session-Start

1. INDEX.md (immer)
2. DECISIONS.md (immer, gesamten History scannen)
3. ACTIVE_SPRINT.md (immer, aktueller Fokus)
4. design/GDD.md (bei Game-Design-Aufgaben)
5. tech/architecture.md (bei Code-Aufgaben)
6. research/* (bei Mechanik-Definition oder Inspiration noetig)

## Update-Regeln

- **DECISIONS.md**: append-only mit Datum. Nie ueberschreiben, nur neue Entscheidungen anhaengen plus alte bei Bedarf als "superseded am YYYY-MM-DD" markieren.
- **ACTIVE_SPRINT.md**: ueberschreibbar bei jedem Sprint-Wechsel
- **GDD.md**: lebendiges Dokument, Versionsnummer im Header (V0.1, V0.2, etc.)
- **research/**: Read-only nachdem geschrieben, neue Erkenntnisse in design/ einarbeiten
- **playtests/**: append, ein File pro Test-Session

## Memory vs. Brain

- **Memory** (im Cowork-Memory-System): kompakte langlebige Facts, User-Preferences, kritische Decisions
- **Brain** (dieser Folder): umfangreiches Working-Knowledge, GDD, Research, alles was fuer Game-Dev relevant ist

Memory verweist auf Brain-Files, Brain ist die Tiefe.
