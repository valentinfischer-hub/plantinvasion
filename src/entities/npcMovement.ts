import { mulberry32 } from '../data/genetics';
import type { Dir } from './PlayerController';

/**
 * Tier-4 Sprint-S-09 NPC-Walking V0.1.
 *
 * Pure-Function Movement-Tick fuer Vitest-Tests. Deterministisch via NPC-ID-Hash
 * plus current game-time. NPCs bewegen sich alle 5 Sekunden ein Tile in zufaellige
 * 4er-Richtung, bleiben in spawnArea-Radius (10x10 um spawnTileX/Y) und respektieren
 * walls-Set.
 */

export interface NpcMovementState {
  id: string;
  tileX: number;
  tileY: number;
  spawnTileX: number;
  spawnTileY: number;
  spawnRadius: number;       // Default 10
  facing: Dir;
  lastMoveAt: number;        // ms (game-time)
}

export const NPC_MOVE_INTERVAL_MS = 5000;
export const NPC_DEFAULT_SPAWN_RADIUS = 10;

const DIRS: Array<{ dir: Dir; dx: number; dy: number }> = [
  { dir: 'up',    dx: 0,  dy: -1 },
  { dir: 'down',  dx: 0,  dy: 1 },
  { dir: 'left',  dx: -1, dy: 0 },
  { dir: 'right', dx: 1,  dy: 0 }
];

/** String-Hash fuer NPC-ID damit jeder NPC einen eigenen Seed hat. */
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h << 5) - h + id.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) || 1;
}

/**
 * Berechnet den naechsten NPC-State.
 *  - Wenn weniger als NPC_MOVE_INTERVAL_MS seit lastMoveAt vergangen sind: keine Bewegung.
 *  - Sonst: waehle deterministisch eine Richtung. Wenn Ziel ausserhalb spawnArea oder in walls: keine Bewegung, lastMoveAt wird trotzdem inkrementiert (damit naechster Versuch nicht sofort wieder).
 *  - Bewegung ist genau 1 Tile.
 *
 * @param state Current NPC-State.
 * @param now Current game-time in ms.
 * @param walls Set von "x,y" Strings die als Walls gelten.
 * @param dialogActive Wenn true, NPC bleibt stehen.
 */
export function npcMovementTick(
  state: NpcMovementState,
  now: number,
  walls: ReadonlySet<string>,
  dialogActive = false
): NpcMovementState {
  if (dialogActive) return state;
  const elapsed = now - state.lastMoveAt;
  if (elapsed < NPC_MOVE_INTERVAL_MS) return state;

  // Seed: NPC-ID-Hash plus tick-Index. Damit jeder Tick eine andere Richtung waehlt.
  const tickIndex = Math.floor(now / NPC_MOVE_INTERVAL_MS);
  const seed = hashId(state.id) ^ (tickIndex * 31);
  const rng = mulberry32(seed);
  const dirIdx = Math.floor(rng() * 4);
  const { dir, dx, dy } = DIRS[dirIdx];

  const targetX = state.tileX + dx;
  const targetY = state.tileY + dy;

  // Spawn-Area-Check
  const inRadiusX = Math.abs(targetX - state.spawnTileX) <= state.spawnRadius;
  const inRadiusY = Math.abs(targetY - state.spawnTileY) <= state.spawnRadius;
  if (!inRadiusX || !inRadiusY) {
    return { ...state, facing: dir, lastMoveAt: now };
  }

  // Wall-Check
  if (walls.has(`${targetX},${targetY}`)) {
    return { ...state, facing: dir, lastMoveAt: now };
  }

  return { ...state, tileX: targetX, tileY: targetY, facing: dir, lastMoveAt: now };
}

/**
 * Initial-State-Helper. tileX/Y plus spawnTileX/Y identisch, lastMoveAt=0.
 */
export function makeNpcMovementState(
  id: string,
  tileX: number,
  tileY: number,
  facing: Dir = 'down',
  spawnRadius = NPC_DEFAULT_SPAWN_RADIUS
): NpcMovementState {
  return {
    id,
    tileX,
    tileY,
    spawnTileX: tileX,
    spawnTileY: tileY,
    spawnRadius,
    facing,
    lastMoveAt: 0
  };
}
