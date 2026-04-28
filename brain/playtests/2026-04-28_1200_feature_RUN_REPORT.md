# Feature-Run-Report 2026-04-28 12:00

**Agent:** Tech-Code-Agent (claude-sonnet-4-6)
**Run-Typ:** 12:00 Feature-Run (Tier 4, S-10 Self-Approval-Window)
**Basis-HEAD:** e3155d0
**Start:** ~11:20 UTC
**Ende:** ~11:45 UTC

---

## Status vor dem Run

| Gate | Status |
|---|---|
| Vitest | 613/613 gruen, 36 Suiten |
| TS-strict | gruen |
| ESLint | 0/0 |
| Tier 1-3 | GRUEN-VERIFIZIERT |
| Tier 4 | npcMovement V0.2 + pathfinding live |

---

## Task A: NPC-Wander-Ziele in OverworldScene.ts — DONE

**Was implementiert wurde:**

1. Import von `setNpcTarget` aus `npcMovement.ts` und `mulberry32` aus `data/genetics.ts` in `OverworldScene.ts`.

2. Modul-Konstante `WANDER_INTERVAL_MS = 30_000` (30 Sekunden pro Wander-Tick).

3. Funktion `pickWanderTarget(npcId, spawnTileX, spawnTileY, spawnRadius, walls, now)`:
   - Deterministischer Seed: NPC-ID-Hash XOR (wanderTick * 1_099_511_629).
   - wanderTick = `Math.floor(now / WANDER_INTERVAL_MS)` -> neues Ziel alle 30s.
   - Wählt zufälligen Tile innerhalb `spawnRadius` (Diameter: 2*radius+1).
   - Bis 20 Versuche, überspringt walls-Tiles.
   - Gibt `{ x, y } | null` zurück.

4. `update()`-Loop erweitert:
   - Wenn `npc.movementState` gesetzt und kein `targetTile` ODER NPC hat Ziel erreicht (`tileX === targetTile.x && tileY === targetTile.y`) -> `pickWanderTarget` aufrufen.
   - `npc.movementState = setNpcTarget(ms, target)` setzt neues Ziel (null clearst auf Random-Fallback).
   - Danach `npc.step(now, npcWalls, dialogActive)` wie bisher.

**Datei:** `src/scenes/OverworldScene.ts`

**NPC.ts-Internals-Analyse:**
- `NPC.movementState` ist public optional `NpcMovementState | undefined` (kein getter/setter).
- Direct assignment funktioniert korrekt.
- `npc.initMovement()` wird in `create()` bereits für alle NPCs aufgerufen.
- spawnTileX/Y/Radius kommen aus dem `NpcMovementState` (gesetzt in `makeNpcMovementState` = initiale tileX/Y).

---

## Task B: Story-Akt-2 Spec — DONE

**Datei:** `brain/sprints/S-10/story-akt-2.md`

Vollständige DoD-Spec mit:
- 6 Acceptance-Criteria
- Vitest-Plan (7 neue Tests, Ziel >=620 gesamt)
- Datei-Liste (5 Dateien)
- Risiko-Notizen (diary-system, visitedZones)

---

## Quality Gates nach dem Run

| Gate | Status |
|---|---|
| TS-strict (`tsc --noEmit`) | gruen (0 Fehler) |
| Vitest | 613/613 gruen, 36 Suiten |
| ESLint (`eslint src/scenes/OverworldScene.ts`) | 0 Fehler/Warnings |
| Secret-Scan (ghp_/sk_/sb_publishable_) | SAUBER |

---

## Commit

```
feat(s-10): NPC-Wander-Ziele in OverworldScene + pickWanderTarget
```

**Geaenderte Dateien:**
- `src/scenes/OverworldScene.ts` — pickWanderTarget + Wander-Integration in update()
- `brain/sprints/S-10/story-akt-2.md` — Neue DoD-Spec
- `brain/playtests/2026-04-28_1200_feature_RUN_REPORT.md` — Dieser Report

---

## Hand-Off Notizen

- **S-10 Item-1 NPC-Walking V0.2:** VOLLSTÄNDIG. NPCs laufen jetzt mit Pathfinding zu deterministisch gewählten Wander-Zielen statt Random-Direction.
- **S-10 Item-3 Story-Akt-2:** Spec fertig. Nächster Run kann `storyAct2.ts` implementieren.
- **S-10 Item-2 PixelLab:** Noch offen, PIXELLAB_API_KEY fehlt (Producer-Decision).
- **Nächster geplanter Run:** 16:00 Feature-Run.

---

*Tech-Code-Agent, 2026-04-28 12:00-Run, S-10 Self-Approval-Window (gültig bis ~17:35)*
