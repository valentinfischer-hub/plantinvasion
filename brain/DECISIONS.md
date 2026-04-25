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

### D-019 Growth-System V0.2 (Aufwachsystem-Rework, 2026-04-25)
**Entscheidung**: Sprint 0 plus Sprint 1 Code (Greenhouse-Grid, 5 Starter-Pflanzen, XP-Curve, Save-System) bleibt erhalten. Wird in S-03 zu Sub-Scene "GardenScene" innerhalb des Heimatdorfs Wurzelheim. Tile-Movement und Worldmap werden drumherum gebaut, nicht statt dessen.

**Begruendung**: Existing Code laeuft live auf plantinvasion.netlify.app, hat funktionierende Mechaniken die wir brauchen (Wachstum, XP, Stats, Save). Wegwerfen waere Verlust an Working-Code. Pivot bedeutet Erweiterung nach aussen, nicht Reset nach innen. Existing 5 Pflanzen werden Tutorial-Pflanzen, restliche 195 kommen iterativ.

**Konsequenz**: GreenhouseScene.ts wird zu GardenScene.ts umbenannt in S-03. Worldmap-Tile-Map enthaelt eine Tile die als Eingang zum Garten triggert.
