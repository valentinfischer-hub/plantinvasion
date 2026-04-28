# Sprint-S-10 Plan-Vorschlag

**Status:** PROPOSED. Wartet auf Producer-Review (12h-Self-Approval-Window aktiv ab 2026-04-28 05:35).
**Vorgaenger-Sprint:** S-09 (Story-Akt-1 V0.1, NPC-Walking V0.1, Saison-Tile-Variationen ABGESCHLOSSEN).
**Geplantes Start:** 2026-05-05
**Geplantes Ende:** 2026-05-12

## Sprint-Ziel
Aufbau auf S-09: NPC-Walking-V0.2 mit Pathfinding + 4-Frame-Walking-Animation aus PixelLab. Story-Akt-2 "Verdanto-Bromelien" mit Cutscene-System. Boss-Battles V0.2.

## DoD-Items

### Item-1: NPC-Walking V0.2 Pathfinding (M, 30-60 Min)
- A*-Pathfinding pure-function in src/entities/pathfinding.ts.
- NPC-Walking nutzt Pfad-Targets statt Random-Direction.
- Walls-Set aus Tilemap-Wall-Tiles (3=Wasser, 4=Baum, 5=Wand).
- Kollisionsausweich-Logik wenn Player im Tile.
- Tests: 15+ Vitest fuer Pfad-Determinismus + Edge-Cases.

### Item-2: PixelLab Walking-Sprites (L, 60-90 Min)
- 4-Frame-Walking-Animation pro NPC und Player (idle/up/down/left/right).
- PixelLab-API-Calls: 6 NPCs * 5 Animationen * 4 Frames = 120 Sprites.
- BootScene/MenuScene preload Atlases.
- NPC.ts step() updated Sprite-Frame basierend auf facing.
- Pre-Condition: PIXELLAB_API_KEY in .env.local. Aktuell NICHT vorhanden -> Producer muss Key bereitstellen.

### Item-3: Story-Akt-2 V0.1 "Verdanto-Bromelien" (L)
- Quest-Setup: 3 Bromelien einsammeln in Verdanto.
- Cutscene-System V0.1: Cutscene-Trigger bei Akt-Uebergang.
- evaluateAct2Progress + autoSetAct2Flags pure-function.
- Diary-Entry 2 + Achievement "Verdanto-Erkundet" unlock.

### Item-4: Boss-Battle V0.2 (M)
- Boss-Battle-Trigger bei Quest-Completion fuer Akt-Bosses.
- Boss-Stats erhoeht (vs Wild-Encounters), spezielle Moves.
- Reward: Boss-Drop-Item + Coin-Bonus.

### Item-5: Save-Schema V11-Bump (S)
- Wenn Item-1 oder Item-3 NPC-Movement-State persistieren -> V10 -> V11.
- Plan steht in brain/tech/save_v11_plan.md.
- 3 Vitest-Migrations-Tests Pflicht.

## Ressourcen-Bedarf
- **PixelLab-Credits:** ~120 Sprites * X Credits = Producer-Decision.
- **Producer-Time:** Spec-Review + Cutscene-Storyboard fuer Akt-2.

## Tier-Mapping
- Item-1, Item-2, Item-3, Item-4 sind alle Tier-4 (Sprint-DoD).
- Item-5 ist Tier-5 (Polish/Save-System).

## Risiken
- **PixelLab-Cost:** unbekannt ohne Trial-Run. Producer-Decision noetig.
- **Cutscene-System:** neuer Sub-System, kann groesser werden als estimate. Time-Box-Regel beachten.

## Self-Approval-Window
Wenn dieser Plan 2026-05-04 ohne Producer-Veto-Commit auf der File ist, gilt er als approved (V3 SKILL Sprint-DoD-Spec-Self-Approval-Regel). Tech-Code startet dann automatisch mit Item-1 (Pathfinding, lowest risk).

## Provenienz
Tech-Code-Self-Plan 2026-04-28 (V3 SKILL Auto-Pfad-4 "Sprint-Closure-bereit -> Sprint-S+1-Spec-Vorschlag schreiben").
