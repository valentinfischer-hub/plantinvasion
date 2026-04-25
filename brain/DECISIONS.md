# Plantinvasion Decisions Log

Append-only Log strategischer Entscheidungen. Jeder Eintrag hat Datum, Entscheidung, Begruendung, ggf. spaetere Revision.

---

## 2026-04-25 (Session: Vision-Pivot zu Indie-Game)

### D-001 Plattform-Strategie: Web-First, dann Steam, dann Mobile
**Entscheidung**: MVP wird als Browser-Spiel auf itch.io plus Netlify-Preview gelauncht. Phase 2 ist Steam-Release (PC). Phase 3 ist Mobile-Port via Capacitor.

**Begruendung**: Stardew-Valley-Tiefe mit 100h Content passt nicht zu Mobile-2-5min-Sessions, also Pivot weg von Casual-Mobile. Web-First erlaubt schnelle Iteration ohne Account-Setup-Friktion. Itch.io plus Steam ist der bewaehrte Indie-Pfad. Mobile spaeter als Port mit angepasster Steuerung.

**Konsequenz**: Capacitor-Schritt verschoben in Phase 3. Pixel-Art-Aufloesung 16x16 Tiles bleibt, aber UI-Layout primaer fuer Maus/Tastatur, spaeter Touch-Adaption.

### D-002 Kern-Genre: Cozy Farming-RPG mit Auto-Pflanzen-Kampf
**Entscheidung**: Stardew-Valley-Style Exploration plus Pokemon-Rot-Tile-Movement plus Auto-Battle mit aktivem Item-Einsatz. Kein voller Pokemon-Style-Move-Selection.

**Begruendung**: Auto-Battle reduziert Cognitive-Load fuer Cozy-Spieler-Typ und ist einfacher zu balancieren. Aktiver Item-Einsatz waehrend Pause-Slow-Mo gibt Skill-Expression ohne UI-Overload.

### D-003 Multiplayer: NPC-Trade only in V1, asynchroner Spieler-Trade in V2
**Entscheidung**: V1 hat keinen Spieler-zu-Spieler-Tausch. NPC-Trade-Boards, Markt, Auktionshaus, Schwarzmarkt, wandernde Haendler decken das ab.

**Begruendung**: Multiplayer-Backend ist 3-fach Backend-Aufwand und Anti-Cheat-Komplexitaet. Single-Player erst, Multiplayer als V2-Feature falls Community-Demand da ist.

### D-004 Monetarisierung: Premium-Modell mit Free Demo
**Entscheidung**: Steam-Release zu 14.99 USD, Free Demo auf itch.io (Tutorial-Region plus erstes Biom). Kein F2P, keine Ads, kein Energy-Timer. Keine Pay-to-Win-Mechaniken. Spaeter optional kostenpflichtige DLC-Regionen oder Cosmetic-Skins.

**Begruendung**: Cozy-Pflanzen-Sammler-Spielergefuehl wird durch F2P-Mechaniken sabotiert. Premium passt zu Zielgruppe und vereinfacht Balance. Mobile-Port spaeter ggf. als 4.99 USD Premium oder F2P-mit-Premium-Currency.

### D-005 MVP-Scope: Heimatdorf plus 1 Biom plus Basis-Loop
**Entscheidung**: Erste spielbare Version (V0.5) hat Heimatdorf Wurzelheim, Tropischen Regenwald Verdanto, ca. 20 Pflanzen, ca. 5 NPCs, Basis-Kampf, Basis-Kreuzung, Basis-Markt. Alle anderen Biome folgen iterativ.

**Begruendung**: Vertical-Slice-Approach. Zuerst eine Region perfekt, dann Content-Multiplier durch Biom-Replikation.

### D-006 Story: Light-Plot, Sammler-Gefuehl primaer
**Entscheidung**: Rahmen-Story "Wandernder Botaniker dokumentiert verlorene Pflanzenwelt nach Konzern-Vergiftung" als Hintergrund. Keine Cutscenes, kein heavy Dialogue. Story-Beats nur in Form von Tagebuch-Eintraegen und kurzen NPC-Quests.

**Begruendung**: Volle RPG-Story ist 50h zusaetzliche Schreibarbeit. Stardew zeigt: Vibe und Atmosphaere schlagen Plot. Pokedex-Sammler-Loop ist der Haupt-Hook.

### D-007 Slack-Updates: ungefiltert
**Entscheidung**: Build-Status, Bug-Fixes, Sprint-Milestones gehen direkt nach Slack ohne Draft-Schritt.

**Begruendung**: Geschwindigkeit. Valentin kann immer reagieren wenn etwas falsch geht. Format kurz halten (max. 3 Saetze pro Update).

### D-008 Botanik-Strenge: Plausibel-aber-Spiel
**Entscheidung**: Echte botanische Namen fuer Basis-Arten (V0.1 Regel beibehalten), aber Hybriden duerfen biologisch unmoegliche Kombinationen haben (Kakteen-Orchidee-Hybrid ok). Visualisierung muss erkennbar an Realwelt orientiert sein.

**Begruendung**: Pflanzen-Enthusiasten lieben echte Namen, aber Spiel-Spass schlaegt Realismus bei Kreuzungen. Mythische Endgame-Pflanzen sind explizit fantastisch.

### D-009 Brain-System eingefuehrt
**Entscheidung**: /brain Folder als persistente Wissensbasis mit INDEX, DECISIONS, ACTIVE_SPRINT, COSTS plus Unterordner research/, design/, tech/, playtests/, postmortems/.

**Begruendung**: Memory-System (Cowork) ist fuer kompakte Facts. Game-Dev braucht tiefes lebendiges Dokumentations-System. Brain ist der Single-Source-of-Truth fuer Game-State.

### D-010 Engine bleibt Phaser 3 plus Vite plus TypeScript
**Entscheidung**: Kein Engine-Wechsel. Phaser ist gut fuer Browser-First, Capacitor-Port machbar, Steam via Electron oder NW.js.

**Begruendung**: Bereits installiert, Repo lebt, Switching-Costs zu hoch. Phaser kann alles was wir brauchen (Tile-Movement, Sprite-Animation, Audio, Input-Handling).

### D-022 Storyline V1: 7-Akt Hero-Journey (revidiert D-006)
**Entscheidung**: Story von "Light-Plot" auf vollwertigen 7-Akt-Hero-Journey-Plot ausgebaut. ca 20h Hauptstory plus 30h Side-Content.

**Begruendung**: User-Wunsch fuer mehr Story-Tiefe und Quest-Adventure-Gefuehl. Hero-Journey ist Public-Domain-Konzept (Joseph Campbell 1949), funktioniert universal.

**Konsequenz**: D-006 Light-Plot wird durch D-022 ersetzt. brain/design/storyline.md mit allen Akten, Charakteren (alle frei erfunden: Tilda Wurzelreich, Iris Salbeyen, Caspar Verodynicus, Magmus Rex), 24 Story-Quests, Save-V8 mit StoryState. NPC Iris in Wurzelheim implementiert. 5 Story-Items hinzugefuegt. 7 Boss-Encounter geplant: captain-schimmelpilz, mangrove-tyrann, pitcher-of-death, magmus-rex, frostmother-glaziella, verodynicus 3-Phasen-Final.

### D-023 Visuelle Inspiration: Stardew Valley plus Pokemon
**Entscheidung**: Optik orientiert sich offiziell an Stardew Valley (Farb-Palette, UI-Stil, Tile-Pattern). Battle-UI orientiert sich an Pokemon. Beides nur als Inspiration, keine Asset-Kopie.

**Begruendung**: User-Referenzen YouTube Stardew-Valley-Speedrun und Pokemon-Emerald-Speedrun. Konsistenz im Cozy-RPG-Genre wichtig fuer Wiedererkennungswert.

**Konsequenz**: brain/research/visual_inspiration_stardew.md dokumentiert Art-Direction. PixelLab-Prompts mit "stardew valley pixel art 32x32" Suffix. S-09 plant Day-Night-Cycle, Saison-System, Wetter-Effekte als naechste visuelle Erweiterungen.

### D-020 Battle-System V2: Pokemon-Style mit Move-Auswahl (revidiert D-002)
**Entscheidung**: Auto-Battle wurde abgeschafft. Stattdessen Pokemon-Style turn-based Battle mit Move-Auswahl. Jede Pflanze hat 4 Moves, 33 Attacken-Datenbank, Status-Effekte, Stat-Modifikatoren.

**Begruendung**: Auto-Battle war Cognitive-Low aber auch Spannungs-Low. User wuenscht aktive Spielentscheidungen, mehr Spass beim Kaempfen. Pokemon-Formel ist bewaehrt und passt zum Cozy-Sammler-Vibe.

**Konsequenz**: D-002 Auto-Battle wird durch D-020 ersetzt. moves.ts, BattleEngine.applyMove/runMoveRound, BattleScene mit 4 Move-Buttons. Status: welk, vergiftet, schlaf, wurzeln, pilz. Wild-AI mit 70/20/10 random/damage-best/status-Verteilung.

### D-017 Crossing V0.1 mit X-Hotkey statt UI-Mode-Toggle
**Entscheidung**: Crossing wird mit X-Hotkey getriggert, kreuzt die ersten beiden Pflanzen im State. Kein UI-Mode-Toggle in V0.1.

**Begruendung**: Schnelle MVP-Implementation ohne Mode-Switch-Komplexitaet. Reicht fuer S-06 Demo.

**Konsequenz**: UI-Polish mit 2-Slot-Select-Highlight kommt in S-08 nach Beta-Feedback.

### D-015 Damage-Formel V0.2: log-scaled mit maxHp-Cap
**Entscheidung**: Damage-Formel wurde rebalanced: ratio via log2(1 + atk/def), Cap bei 50% maxHp pro Hit.

**Begruendung**: V0.1 Damage hat L11 vs L1 in einem Schlag erledigt. Log-Scale daempft extreme Stat-Differenzen, Cap verhindert One-Shots. Battles bleiben spannender und Skill-Expression durch Items ist relevanter.

**Konsequenz**: Battle-Tests in S-05 zeigen keine One-Shots mehr. Wild-Plants koennen 2-3 Runden ueberleben.

### D-016 Crossing-System verschoben auf S-06
**Entscheidung**: Aktivierung des Crossing-Systems in S-05 wurde verschoben auf S-06.

**Begruendung**: 2-Slot-Select-UI in GardenScene plus Mode-Switch zwischen Move und Cross ist signifikanter UI-Aufwand. S-05 hatte bereits 5 grosse Features (Verdanto-Pool, Capture, Markt, Inventory, Rebalance). Kein Wert in Halb-Fertig.

**Konsequenz**: S-06 startet mit Crossing als Top-Task.

### D-013 BattleScene als eigene Scene
**Entscheidung**: BattleScene laeuft als separate Phaser-Scene, nicht als Overlay ueber OverworldScene. scene.start switcht klar.

**Begruendung**: Klare Lifecycle-Trennung, eigener update-Loop fuer Auto-Battle, einfacher zu testen. Save-Punkt vor Scene-Switch erhalten.

**Konsequenz**: Battle-Erfolg/Misserfolg muss zurueck zu OverworldScene navigieren. Player-Position muss vorher gespeichert sein. XP-Reward wird in V0.5 in gameStore propagiert.

### D-014 Damage-Formel V0.1 erlaubt One-Shots
**Entscheidung**: Aktuelle Damage-Formel laesst L11 vs L1 in einem Hit erledigen. Wird in S-05 rebalanced.

**Begruendung**: V0.1 fokussiert auf Mechanik-Funktionalitaet, nicht Balance. One-Shot-Encounters sind im Tutorial sogar erwartet (du bist groesser als die Wild-Pflanzen).

**Konsequenz**: Wild-Stats sollten in S-05 cap pro Region, oder Damage-Formel mit log oder clamp. Nicht jetzt fixen.

### D-012 Procedural Sprites als Stop-Gap fuer fehlende PixelLab-Balance
**Entscheidung**: Solange PixelLab-Balance 0 USD ist, generieren wir 16x16 Player- und NPC-Sprites procedural via Phaser-Graphics. Das ist eine TEMPORAERE Loesung fuer S-02 V0.2 Demo. Echte Sprites kommen sobald Balance vorhanden.

**Begruendung**: Hands-Off-Modus - nicht warten auf User-Aktion (Balance-Refill ist explicit-permission-Action). Procedural-Sprites schauen besser aus als plain-Rects und das ganze Game-Feel funktioniert (Walking-Cycle, 4 Richtungen, Outline). Wenn PixelLab-Sprites kommen, wird einfach `generatePlayerAtlas` durch ein `loadPlayerAtlas` aus Image-Files ersetzt.

**Konsequenz**: src/assets/proceduralSprites.ts existiert dauerhaft als Fallback-Mechanismus. Wenn PixelLab-Sprites geladen werden, wird der generative Pfad nicht aufgerufen. Doppelte Code-Pfade aber easy umzuschalten via Boot-Flag.

### D-019 Growth-System V0.2 (Aufwachsystem-Rework, 2026-04-25)
**Entscheidung**: Linearer XP-Tick wird ersetzt durch multiplikatives Wachstum. Hydration als kontinuierliche Skala (0-100), Multiplikatoren fuer Stage, Hydration, Biom-Match, Hybrid-Vigor, Tageszeit. Quality-Tier-Snapshot bei Adult-Stage. Bloom-Cycle mit Harvest-Loop fuer Coins/Samen/Pollen.

**Begruendung**: V0.1-Wachstum war binaer und langweilig (2 XP/s konstant, Wassergiessen alle 15 Min trivialer Hotkey). V0.2 belohnt aktive Pflege mit messbar schnellerem Wachstum, gibt Sammlern Tier-Granularitaet (Common bis Pristine) und etabliert einen Wirtschafts-Loop ueber Bloom-Ernte.

**Konsequenz**: Save-Migration v5 -> v6 mit Backfill (hydration=100, careScore=0, generation aus parentIds). Plant-Type um 6 Felder erweitert. GardenScene-UI um Hydration-Bar, Quality-Stars, Bloom-Pulse, Harvest-Button. Spec in brain/design/growth_system.md, Test in brain/playtests/2026-04-25_growth_system_unit_test.md (9/9 PASS, tsc gruen).

### D-020 Procedural-Fallback-Tiles fuer neue Biome (2026-04-25)
**Entscheidung**: Mordwald (tile_swamp*) und Magmabluete (tile_ash, tile_lava etc.) bekommen ihre Tile-Sprites prozedural via Phaser.Graphics.generateTexture statt PNG-Asset. Spaetere PixelLab-PNG-Generation wird die procedural Variante automatisch ueberschreiben (ensure-only-if-missing-Pattern in `biomeFallbackTiles.ts`).

**Begruendung**: Schneller Ship ohne PixelLab-Cost-Hit. Tiles sehen 16x16 Pixel-Art-typisch aus, passen zu existierenden Stardew-Style-Sprites. Beim Pinselstrich-Upgrade in S-09 Phase 1 (Mordwald-Polish) werden die Procedural-Sprites durch PNG-Assets ersetzt, ohne Code-Aenderungen.

**Konsequenz**: 11 neue Texture-Keys (5 Mordwald, 6 Magmabluete) in `src/assets/biomeFallbackTiles.ts`. Registry-Update in `spriteRegistry.ts`. Loader skipt diese Keys beim PNG-Load (FALLBACK_TILE_KEYS-Filter).

### D-022 Seed-Acquisition V0.2 plus Hybrid-Crossings plus 50+ Spezies (2026-04-25)
**Entscheidung**: Pokemon-Style Foraging-System mit 4 neuen Mechaniken: Forage-Tiles (Bushes/Wildplants mit 1h-Cooldown-Loot), Hidden-Item-Spots (5 pro Biom, one-shot pro Save), Battle-Drops (25% Seed nach Wild-Sieg), Berry-Master-NPC Bertram in Wurzelheim (Daily-Free-Seed). Zusaetzlich 10 Hybrid-Recipes: spezifische 2-Eltern-Crossings erzeugen NEUE Spezies mit gemischter visueller Palette.

**Begruendung**: User-Feedback "Pflanzensamen sollen auf verschiedene Arten gefunden werden, mindestens 50 Spezies, kreuzbare Hybriden mit Mix-Look". Pokemon-Inspiration aus YouTube-Speedrun-Video (Hoenn-Region-Beerensystem). Foraging gibt taegliche Casual-Loops, Hidden-Spots geben Erkundungs-Anreiz, Battle-Drops belohnen Battle-Spieler, Berry-Master ist Login-Hook. Hybrid-Recipes machen Crossing zum Sammler-Spiel mit klaren Zielen.

**Konsequenz**: 35+ neue Spezies in species.ts (Total 51 Basis + 10 Hybrid = 61). Save-Migration v7 -> v8 mit Foraging-State (forageTilesCooldown, collectedHiddenSpots, lastBerryMasterAt). Neue Files: src/data/foraging.ts, src/data/hybridRecipes.ts. OverworldScene-tryInteract erweitert (Forage-Detection, Hidden-Spot-Detection, Berry-Master-Spezial-Dialog). BattleScene-Win-Path mit applyBattleDrop. Procedural-Plant-Sprite-Generator mit 61 Paletten und 4 Archetypen (flower, cactus, tree, sukkulent, carnivore, aquatic, fern). 14 von 14 Bash-Tests PASS.

### D-025 Achievements V0.1 plus Forage-Tiles biom-weit plus Daily-Login-Toast (2026-04-25)
**Entscheidung**: 10 Achievements aus endgame.md werden aktiviert mit gameStore-Tracking (crossings-counter, mutations-counter, visitedZones, Pokedex-Discovery, Plant-Tier-Snapshots). Forage-Tiles (Berry-Bush 50, Wildplant 51) jetzt in allen 7 Biomen (4 pro Biom). Daily-Login-Reward zeigt sich als Toast unten-mittig in OverworldScene beim ersten Tag-Login.

**Begruendung**: Foraging-System V0.2 war bisher nur in Wurzelheim sichtbar - Spieler sah keinen Mehrwert. Achievements geben Sammler-Loop Substanz (Kaktoria-Bezwinger, Hybrid-Architekt, Welten-Reisender). Daily-Login-Toast statt Modal weil weniger UI-Interrupt - wirkt cozy statt sperrig.

**Konsequenz**: src/data/achievements.ts NEU mit 10 Defs. gameStore: checkAchievements, incrementAchievementCounter, recordZoneVisit. Crossing-Counter wird in crossPlants getriggert, Tier/Stage-Snapshots in tick(). Zone-Visit in changeZone. Save-State erweitert um achievements[] + achievementCounters{crossings, mutations, visitedZones[]}. Build clean, tsc clean, kein neuer Migration-Schritt da Schema v8 schon-richt-Felder als optional hat.

### D-024 Seed-Acquisition V0.2 (Pokemon-Style Foraging) plus 50+ Spezies plus 10 Hybrid-Recipes (2026-04-25)
**Entscheidung**: Pokemon-Style Foraging-System mit 4 neuen Mechaniken: Forage-Tiles (Bushes/Wildplants mit 1h-Cooldown-Loot), Hidden-Item-Spots (5 pro Biom, one-shot pro Save), Battle-Drops (25% Seed nach Wild-Sieg), Berry-Master-NPC Bertram in Wurzelheim (Daily-Free-Seed). Zusaetzlich 10 Hybrid-Recipes: spezifische 2-Eltern-Crossings erzeugen NEUE Spezies mit gemischter visueller Palette.

**Begruendung**: User-Feedback "Pflanzensamen sollen auf verschiedene Arten gefunden werden, mindestens 50 Spezies, kreuzbare Hybriden mit Mix-Look". Pokemon-Inspiration aus YouTube-Speedrun-Video (Hoenn-Region-Beerensystem). Foraging gibt taegliche Casual-Loops, Hidden-Spots geben Erkundungs-Anreiz, Battle-Drops belohnen Battle-Spieler, Berry-Master ist Login-Hook. Hybrid-Recipes machen Crossing zum Sammler-Spiel mit klaren Zielen.

**Konsequenz**: 35+ neue Spezies in species.ts (Total 51 Basis + 10 Hybrid = 61). Save-Migration v7 -> v8 mit Foraging-State (forageTilesCooldown, collectedHiddenSpots, lastBerryMasterAt). Neue Files: src/data/foraging.ts, src/data/hybridRecipes.ts. OverworldScene-tryInteract erweitert (Forage-Detection, Hidden-Spot-Detection, Berry-Master-Spezial-Dialog). BattleScene-Win-Path mit applyBattleDrop. Procedural-Plant-Sprite-Generator mit 61 Paletten und 7 Archetypen. 14 von 14 Bash-Tests PASS.

### D-021 Booster-System V0.1 plus Seed-Acquisition plus 10 neue Spezies (2026-04-25)
**Entscheidung**: Wachstums-Erweiterung um 9 Booster-Items (Vulkan-Asche, Premium-Duenger, Sumpf-Pollen, Pristine-Pollen, Sun-Lamp, Sprinkler, Hybrid-Booster, Bronze/Silver/Gold-Erde) plus Seed-Items pro Spezies plus Daily-Login-Reward plus Markt-Daily-Roster. 10 neue plantbare Spezies (Rose, Aloe Vera, Orchid, Fern, Mint, Iris, Snapdragon, Water Lily, Daffodil, Coneflower).

**Begruendung**: User-Feedback "mehr Wege Pflanzen zu bekommen, mehr Optionen zu staerken, mehr Spezies". Aktive Pflege belohnen (Booster-Stack), Sammler-Anreiz (mehr Pokedex-Eintraege), Wirtschafts-Loop (Coin-Sink fuer Booster vs. Bloom-Income). Procedural-Plant-Sprites in `proceduralPlantSprites.ts` machen die 10 neuen Spezies ohne PixelLab-Cost spielbar.

**Konsequenz**: Save-Migration v6 -> v7 mit Backfill (activeBoosters: [], gardenSlots default normal, lastDailyLoginAt: 0, marketShopRoster). Plant-Type um activeBoosters erweitert. GardenScene: Saeen-Header-Button (Hotkey S), Booster-Apply-Modal, Soil-Upgrade-Button, Active-Booster-Anzeige im Detail. 14 von 14 Unit-Tests PASS (Multiplikator-Stack, Soil-Tiers, Booster-Expiry, Tier-Pollen-Roll). Markt-Shop-UI verschoben auf naechsten Sprint.

### D-011 Existing Greenhouse-Codebase wird als Heimatgarten erhalten
**Entscheidung**: Sprint 0 plus Sprint 1 Code (Greenhouse-Grid, 5 Starter-Pflanzen, XP-Curve, Save-System) bleibt erhalten. Wird in S-03 zu Sub-Scene "GardenScene" innerhalb des Heimatdorfs Wurzelheim. Tile-Movement und Worldmap werden drumherum gebaut, nicht statt dessen.

**Begruendung**: Existing Code laeuft live auf plantinvasion.netlify.app, hat funktionierende Mechaniken die wir brauchen (Wachstum, XP, Stats, Save). Wegwerfen waere Verlust an Working-Code. Pivot bedeutet Erweiterung nach aussen, nicht Reset nach innen. Existing 5 Pflanzen werden Tutorial-Pflanzen, restliche 195 kommen iterativ.

**Konsequenz**: GreenhouseScene.ts wird zu GardenScene.ts umbenannt in S-03. Worldmap-Tile-Map enthaelt eine Tile die als Eingang zum Garten triggert.
