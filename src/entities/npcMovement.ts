import { mulberry32 } from '../data/genetics';
import type { Dir } from './PlayerController';
import { nextStepTowards } from './pathfinding';

/**
 * Tier-4 Sprint-S-09/S-10 NPC-Walking V0.1/V0.2.
 *
 * V0.1: Pure-Function Random-Direction. Deterministisch via NPC-ID-Hash + game-time.
 * V0.2: Optionales targetTile -> nutzt A*-Pathfinding (nextStepTowards) statt Random.
 *
 * NPCs bewegen sich alle 5 Sekunden ein Tile. Bleiben in spawnArea-Radius (10x10 um
 * spawnTileX/Y) und respektieren walls-Set.
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
  /** V0.2: Optionales Pathfinding-Ziel. Wenn gesetzt, nutzt npcMovementTick A*. */
  targetTile?: { x: number; y: number };
}

export const NPC_MOVE_INTERVAL_MS = 5000;
export const NPC_DEFAULT_SPAWN_RADIUS = 10;

/** Tile-IDs die als geblockt gelten fuer Pathfinding + Wall-Check. */
export const WALL_TILE_IDS = new Set([3, 4, 5, 6, 8]);

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

/** Leitet Dir aus Tile-Delta ab. Fallback 'down' wenn kein Schritt. */
function deltaToDir(dx: number, dy: number): Dir {
  if (dy < 0) return 'up';
  if (dy > 0) return 'down';
  if (dx < 0) return 'left';
  if (dx > 0) return 'right';
  return 'down';
}

/**
 * Berechnet den naechsten NPC-State.
 *
 * V0.1 (kein targetTile): waehle deterministisch zufaellige Richtung.
 * V0.2 (targetTile gesetzt): nutze A*-Pathfinding (nextStepTowards) zum Ziel.
 *
 * - Wenn weniger als NPC_MOVE_INTERVAL_MS seit lastMoveAt vergangen sind: keine Bewegung.
 * - Ziel ausserhalb spawnArea oder in walls: keine Bewegung, lastMoveAt trotzdem gesetzt.
 * - dialogActive: NPC bleibt stehen.
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

  let targetX: number;
  let targetY: number;
  let dir: Dir;

  if (state.targetTile) {
    // V0.2: Pathfinding-Modus
    const next = nextStepTowards(
      { x: state.tileX, y: state.tileY },
      { x: state.targetTile.x, y: state.targetTile.y },
      walls
    );
    if (!next) {
      // Kein Pfad -> lastMoveAt setzen, kein Schritt
      return { ...state, lastMoveAt: now };
    }
    if (next.x === state.tileX && next.y === state.tileY) {
      // Bereits am Ziel
      return { ...state, lastMoveAt: now };
    }
    targetX = next.x;
    targetY = next.y;
    dir = deltaToDir(targetX - state.tileX, targetY - state.tileY);
  } else {
    // V0.1: Random-Direction
    const tickIndex = Math.floor(now / NPC_MOVE_INTERVAL_MS);
    const seed = hashId(state.id) ^ (tickIndex * 31);
    const rng = mulberry32(seed);
    const dirIdx = Math.floor(rng() * 4);
    const chosen = DIRS[dirIdx];
    dir = chosen.dir;
    targetX = state.tileX + chosen.dx;
    targetY = state.tileY + chosen.dy;
  }

  // Spawn-Area-Check (gilt fuer beide Modi)
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

/**
 * V0.2 Helper: setzt targetTile auf NpcMovementState (immutable).
 * Wenn tile null/undefined, wird targetTile gecleart (zurueck zu Random-Modus).
 */
export function setNpcTarget(
  state: NpcMovementState,
  tile: { x: number; y: number } | null
): NpcMovementState {
  if (!tile) {
    const { targetTile: _, ...rest } = state;
    return rest;
  }
  return { ...state, targetTile: { x: tile.x, y: tile.y } };
}

/**
 * Erstellt aus einem 2D-Tile-Array (tiles[y][x]) ein walls-Set fuer Pathfinding.
 * WALL_TILE_IDS bestimmt welche Tile-Typen geblockt sind.
 *
 * @param tiles 2D-Array [y][x] mit Tile-Typ-Nummern.
 * @returns ReadonlySet<string> mit "x,y" Keys.
 */
export function buildWallsSet(tiles: readonly (readonly number[])[]): ReadonlySet<string> {
  const walls = new Set<string>();
  for (let y = 0; y < tiles.length; y++) {
    const row = tiles[y];
    for (let x = 0; x < row.length; x++) {
      if (WALL_TILE_IDS.has(row[x])) {
        walls.add(`${x},${y}`);
      }
    }
  }
  return walls;
}
