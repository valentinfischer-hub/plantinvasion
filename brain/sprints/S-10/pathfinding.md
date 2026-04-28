**Item:** NPC-Walking V0.2 Pathfinding (Sprint-S-10 Item-1)
**Tier:** 4
**Estimate:** M (30-60 Min)
**Pre-Conditions:**
- npcMovement.ts V0.1 exists (Sprint-S-09).
- NPC.step() Hook bestehend.

**Acceptance:**
1. A*-Pathfinding pure-function in src/entities/pathfinding.ts.
2. `findPath(start, target, walls, maxSteps): Tile[]` liefert Tile-Liste oder null wenn kein Pfad.
3. Manhattan-Distance als Heuristik.
4. maxSteps default 100 (Performance-Cap).
5. NPC.step nutzt Pfad-Targets statt Random-Direction wenn Pfad verfuegbar.
6. Determinismus via Tile-Reihenfolge im Open-Set (sortiert).
7. Performance: 60fps lock auch bei 10 NPCs mit Pfad-Berechnung pro 5s.

**Tests:**
- Vitest in `src/entities/__tests__/pathfinding.test.ts`:
  - findPath direkter Nachbar -> 1-Step-Pfad.
  - findPath mit Wall-Mauer -> findet Umweg.
  - findPath unerreichbar -> null.
  - findPath > maxSteps -> null.
  - Determinismus: same Input -> same Pfad.
  - Edge: start === target -> leerer Pfad.

**Files:**
- `src/entities/pathfinding.ts` neu.
- `src/entities/__tests__/pathfinding.test.ts` neu.
- `src/entities/npcMovement.ts` erweitern: optional `targetTile`-Property in NpcMovementState plus Pfad-Following.
- `src/scenes/OverworldScene.ts` walls-Set aus this.map.tiles ableiten (Tile-Type 3,4,5,6 = blocked).

**Provenienz:**
Tech-Code-Self-Spec 2026-04-28. 12h-Self-Approval-Window startet jetzt. Producer kann adjusten oder veto'n.
