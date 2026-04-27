**Item:** NPC-Walking-Cycles V0.1
**Tier:** 4 (Sprint-S-09 DoD)
**Estimate:** M (30-60 Min)
**Pre-Conditions:**
- NPCs sind in OverworldScene gerendert (steht in 0fe11ad).
- NPCData hat tileX, tileY, facing.
- gameTime-Provider verfuegbar.

**Acceptance:**
1. NPCs bewegen sich autonom: alle 5 Sekunden Game-Time genau 1 Tile in zufaellige 4er-Richtung.
2. Bewegung ist deterministisch via Seed (NPC-ID-Hash) plus gameTime, sodass Replay reproduzierbar ist.
3. Kein Pathfinding, keine Kollisionsausweich-Logik (V0.1).
4. NPCs verlassen ihren spawnArea (10x10-Tile-Radius um Spawn-Position) NICHT.
5. NPCs gehen NICHT durch Walls (Tile-Type-Check via OverworldScene-Tilemap).
6. Bei Player-Interaction (Dialog offen) bleibt NPC stehen.
7. 60fps locked.

**Tests:**
- Vitest in `src/entities/__tests__/NPC.movement.test.ts`:
  - `npcMovementTick(npc, now, walls)` ist pure function.
  - Same seed + same now -> same result (Determinismus).
  - Bewegungs-Schritt ist genau 1 Tile.
  - Wall-Block: wenn Ziel-Tile in walls-Set, NPC bleibt stehen.
  - Spawn-Area-Block: NPC waehlt nur Richtung wenn Ziel im 10x10-Radius.
  - Idle-Phase: zwischen 2 Bewegungen 5s Game-Time Pause.

**Files:**
- `src/entities/NPC.ts` neue `step(now)`-Methode plus `spawnArea`-Property.
- `src/entities/npcMovement.ts` neu (pure function fuer Vitest).
- `src/entities/__tests__/NPC.movement.test.ts` neu.
- `src/scenes/OverworldScene.ts` ruft `npc.step(now)` im Tick-Hook (alle 1s reicht, NPC entscheidet selbst ob 5s vergangen sind).

**V0.2 Folge-Run (separater Spec spaeter):**
- Pathfinding zu Quest-Targets.
- 4-Frame-Walking-Animation aus PixelLab-Sprites (S-10).
- Kollisionsausweich-Logik wenn Player im Tile.

**Provenienz:**
Tech-Code-Self-Spec 2026-04-27 weil brain/sprints/S-09/ leer war und NPC-Walking als Tier-4-DoD-Item geplant ist. Producer kann die Spec adjusten oder erweitern. Auto-Approval (autonomy_permissions).
