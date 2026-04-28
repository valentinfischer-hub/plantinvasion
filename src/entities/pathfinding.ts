/**
 * Tier-4 Sprint-S-10 Item-1: A*-Pathfinding fuer NPC-Walking V0.2.
 *
 * Pure-Function. Manhattan-Distance-Heuristik. Deterministisch via Tile-Reihenfolge
 * im Open-Set (sortiert nach (fScore, x, y)).
 */

export interface Tile {
  x: number;
  y: number;
}

interface Node {
  tile: Tile;
  gScore: number;
  fScore: number;
  parent?: Node;
}

function manhattan(a: Tile, b: Tile): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function tileKey(t: Tile): string {
  return `${t.x},${t.y}`;
}

function neighbors(t: Tile): Tile[] {
  return [
    { x: t.x, y: t.y - 1 },
    { x: t.x, y: t.y + 1 },
    { x: t.x - 1, y: t.y },
    { x: t.x + 1, y: t.y }
  ];
}

/**
 * Findet kuerzesten Pfad von start zu target via A*.
 *
 * @param start Tile - Startposition.
 * @param target Tile - Zielposition.
 * @param walls Set<string> - "x,y" der Wall-Tiles.
 * @param maxSteps number - Cap fuer Performance (default 100).
 * @returns Tile[] inkl. start und target, oder null wenn kein Pfad.
 */
export function findPath(
  start: Tile,
  target: Tile,
  walls: ReadonlySet<string>,
  maxSteps = 100
): Tile[] | null {
  if (start.x === target.x && start.y === target.y) return [start];
  if (walls.has(tileKey(target))) return null;

  const startNode: Node = { tile: start, gScore: 0, fScore: manhattan(start, target) };
  const open: Node[] = [startNode];
  const closed = new Set<string>();
  const bestG = new Map<string, number>([[tileKey(start), 0]]);

  let steps = 0;
  while (open.length > 0 && steps < maxSteps) {
    steps++;
    // Determinismus: sortiert nach fScore plus dann x plus y
    open.sort((a, b) => {
      if (a.fScore !== b.fScore) return a.fScore - b.fScore;
      if (a.tile.x !== b.tile.x) return a.tile.x - b.tile.x;
      return a.tile.y - b.tile.y;
    });
    const current = open.shift()!;
    const currentKey = tileKey(current.tile);
    if (closed.has(currentKey)) continue;
    closed.add(currentKey);

    if (current.tile.x === target.x && current.tile.y === target.y) {
      return reconstructPath(current);
    }

    for (const n of neighbors(current.tile)) {
      const nKey = tileKey(n);
      if (closed.has(nKey) || walls.has(nKey)) continue;
      const tentativeG = current.gScore + 1;
      const existingG = bestG.get(nKey);
      if (existingG !== undefined && tentativeG >= existingG) continue;
      bestG.set(nKey, tentativeG);
      open.push({
        tile: n,
        gScore: tentativeG,
        fScore: tentativeG + manhattan(n, target),
        parent: current
      });
    }
  }

  return null;
}

function reconstructPath(end: Node): Tile[] {
  const path: Tile[] = [];
  let cur: Node | undefined = end;
  while (cur) {
    path.unshift(cur.tile);
    cur = cur.parent;
  }
  return path;
}

/**
 * Helper fuer NPC.step: gibt naechsten Tile-Step Richtung target oder null wenn keiner.
 */
export function nextStepTowards(
  from: Tile,
  target: Tile,
  walls: ReadonlySet<string>,
  maxSteps = 50
): Tile | null {
  const path = findPath(from, target, walls, maxSteps);
  if (!path || path.length < 2) return null;
  return path[1];
}
