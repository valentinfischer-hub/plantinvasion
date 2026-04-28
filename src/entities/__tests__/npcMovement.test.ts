import { describe, it, expect } from 'vitest';
import {
  npcMovementTick,
  makeNpcMovementState,
  NPC_MOVE_INTERVAL_MS,
  type NpcMovementState
} from '../npcMovement';

const NO_WALLS: ReadonlySet<string> = new Set();

describe('NPC-Movement V0.1: Determinismus', () => {
  it('same id + same now -> same result', () => {
    const a = makeNpcMovementState('npc_anya', 5, 5);
    const b = makeNpcMovementState('npc_anya', 5, 5);
    const r1 = npcMovementTick(a, NPC_MOVE_INTERVAL_MS + 100, NO_WALLS);
    const r2 = npcMovementTick(b, NPC_MOVE_INTERVAL_MS + 100, NO_WALLS);
    expect(r1.tileX).toBe(r2.tileX);
    expect(r1.tileY).toBe(r2.tileY);
    expect(r1.facing).toBe(r2.facing);
  });

  it('different IDs koennen verschiedene Richtungen waehlen', () => {
    const directions = new Set<string>();
    for (const id of ['npc_anya', 'npc_milo', 'npc_zara', 'npc_uli']) {
      const s = makeNpcMovementState(id, 50, 50);
      const r = npcMovementTick(s, NPC_MOVE_INTERVAL_MS + 100, NO_WALLS);
      directions.add(`${r.tileX - s.tileX},${r.tileY - s.tileY}`);
    }
    expect(directions.size).toBeGreaterThan(1);
  });
});

describe('NPC-Movement V0.1: Bewegungs-Schritt', () => {
  it('bewegt genau 1 Tile pro Tick', () => {
    const s = makeNpcMovementState('npc_test', 10, 10);
    const r = npcMovementTick(s, NPC_MOVE_INTERVAL_MS + 100, NO_WALLS);
    const dx = Math.abs(r.tileX - s.tileX);
    const dy = Math.abs(r.tileY - s.tileY);
    expect(dx + dy).toBeLessThanOrEqual(1);
  });

  it('lastMoveAt wird nach Bewegung auf now gesetzt', () => {
    const s = makeNpcMovementState('npc_test', 10, 10);
    const now = NPC_MOVE_INTERVAL_MS + 500;
    const r = npcMovementTick(s, now, NO_WALLS);
    expect(r.lastMoveAt).toBe(now);
  });
});

describe('NPC-Movement V0.1: Idle-Phase', () => {
  it('keine Bewegung wenn weniger als NPC_MOVE_INTERVAL_MS vergangen', () => {
    const s = makeNpcMovementState('npc_test', 10, 10);
    const r = npcMovementTick(s, NPC_MOVE_INTERVAL_MS - 100, NO_WALLS);
    expect(r.tileX).toBe(s.tileX);
    expect(r.tileY).toBe(s.tileY);
    expect(r.lastMoveAt).toBe(s.lastMoveAt);
  });

  it('Bewegung erst nach Intervall', () => {
    const s = makeNpcMovementState('npc_test', 10, 10);
    const r = npcMovementTick(s, NPC_MOVE_INTERVAL_MS, NO_WALLS);
    // Bewegung ODER Stay (wenn Direction in Wall/Spawn-Edge), aber lastMoveAt wird gesetzt.
    expect(r.lastMoveAt).toBe(NPC_MOVE_INTERVAL_MS);
  });
});

describe('NPC-Movement V0.1: Wall-Block', () => {
  it('NPC bleibt stehen wenn Ziel-Tile in walls-Set', () => {
    // Walls in alle 4 Richtungen blockieren
    const walls = new Set(['10,9', '10,11', '9,10', '11,10']);
    const s = makeNpcMovementState('npc_test', 10, 10);
    const r = npcMovementTick(s, NPC_MOVE_INTERVAL_MS + 100, walls);
    expect(r.tileX).toBe(10);
    expect(r.tileY).toBe(10);
    // lastMoveAt wird trotzdem inkrementiert (sonst spamt der Versuch jeden Tick)
    expect(r.lastMoveAt).toBe(NPC_MOVE_INTERVAL_MS + 100);
  });
});

describe('NPC-Movement V0.1: Spawn-Area', () => {
  it('NPC verlaesst Spawn-Area-Radius nicht', () => {
    // Position genau am Rand: spawnTileX=50, tileX=60 (radius 10)
    const s: NpcMovementState = {
      id: 'edge',
      tileX: 60,
      tileY: 50,
      spawnTileX: 50,
      spawnTileY: 50,
      spawnRadius: 10,
      facing: 'right',
      lastMoveAt: 0
    };
    // Wir testen mit verschiedenen now-Werten dass NPC bei Versuch nach +x zu gehen geblockt wird
    let foundOutOfBounds = false;
    for (let tick = 1; tick <= 50; tick++) {
      const r = npcMovementTick(s, NPC_MOVE_INTERVAL_MS * tick + 100, NO_WALLS);
      if (Math.abs(r.tileX - 50) > 10 || Math.abs(r.tileY - 50) > 10) {
        foundOutOfBounds = true;
        break;
      }
    }
    expect(foundOutOfBounds).toBe(false);
  });
});

describe('NPC-Movement V0.1: Dialog-Block', () => {
  it('keine Bewegung wenn dialogActive=true', () => {
    const s = makeNpcMovementState('npc_test', 10, 10);
    const r = npcMovementTick(s, NPC_MOVE_INTERVAL_MS + 100, NO_WALLS, true);
    expect(r).toBe(s);
  });
});

describe('NPC-Movement V0.1: makeNpcMovementState Defaults', () => {
  it('initial spawnTileX/Y = tileX/Y', () => {
    const s = makeNpcMovementState('a', 7, 8);
    expect(s.spawnTileX).toBe(7);
    expect(s.spawnTileY).toBe(8);
  });
  it('default spawnRadius 10', () => {
    expect(makeNpcMovementState('a', 0, 0).spawnRadius).toBe(10);
  });
  it('default facing down', () => {
    expect(makeNpcMovementState('a', 0, 0).facing).toBe('down');
  });
  it('lastMoveAt initial 0', () => {
    expect(makeNpcMovementState('a', 0, 0).lastMoveAt).toBe(0);
  });
});

// ===========================
// V0.2 Tests: Pathfinding-Modus + buildWallsSet
// ===========================
import { setNpcTarget, buildWallsSet } from '../npcMovement';

describe('NPC-Movement V0.2: Pathfinding-Modus (targetTile)', () => {
  it('mit targetTile bewegt sich NPC Richtung Ziel', () => {
    const s = makeNpcMovementState('npc_path', 0, 0, 'down', 20);
    const withTarget = setNpcTarget(s, { x: 5, y: 0 });
    const r = npcMovementTick(withTarget, NPC_MOVE_INTERVAL_MS + 100, NO_WALLS);
    // A* waehlt naechsten Schritt auf dem Pfad -> x sollte steigen
    expect(r.tileX).toBe(1);
    expect(r.tileY).toBe(0);
    expect(r.facing).toBe('right');
  });

  it('mit targetTile und Wall findet Umweg', () => {
    // Wand bei x=1 y=0 -> muss ueber y=1 gehen
    const walls = new Set(['1,0']);
    const s = setNpcTarget(makeNpcMovementState('npc_wall', 0, 0, 'down', 20), { x: 3, y: 0 });
    const r = npcMovementTick(s, NPC_MOVE_INTERVAL_MS + 100, walls);
    // Naechster Schritt muss nicht die geblockte Wall sein
    expect(r.tileX !== 1 || r.tileY !== 0).toBe(true);
    // Bewegung ist erfolgt
    expect(r.tileX !== 0 || r.tileY !== 0).toBe(true);
  });

  it('bereits am Ziel -> kein Schritt (lastMoveAt gesetzt)', () => {
    const s = setNpcTarget(makeNpcMovementState('npc_atgoal', 5, 5, 'down', 20), { x: 5, y: 5 });
    const r = npcMovementTick(s, NPC_MOVE_INTERVAL_MS + 100, NO_WALLS);
    expect(r.tileX).toBe(5);
    expect(r.tileY).toBe(5);
    expect(r.lastMoveAt).toBe(NPC_MOVE_INTERVAL_MS + 100);
  });

  it('kein erreichbarer Pfad -> kein Schritt, lastMoveAt gesetzt', () => {
    // target (5,5) komplett eingemauert (alle 4 Nachbarn geblockt) -> null von findPath
    const walls = new Set(['4,5', '6,5', '5,4', '5,6']);
    const s = setNpcTarget(makeNpcMovementState('npc_stuck', 0, 0, 'down', 30), { x: 5, y: 5 });
    const r = npcMovementTick(s, NPC_MOVE_INTERVAL_MS + 100, walls);
    expect(r.tileX).toBe(0);
    expect(r.tileY).toBe(0);
    expect(r.lastMoveAt).toBe(NPC_MOVE_INTERVAL_MS + 100);
  });
});

describe('setNpcTarget', () => {
  it('setzt targetTile auf State', () => {
    const s = makeNpcMovementState('npc_x', 0, 0);
    const r = setNpcTarget(s, { x: 5, y: 3 });
    expect(r.targetTile).toEqual({ x: 5, y: 3 });
    // Original unveraendert
    expect(s.targetTile).toBeUndefined();
  });

  it('null cleared targetTile', () => {
    const s = setNpcTarget(makeNpcMovementState('npc_x', 0, 0), { x: 5, y: 3 });
    const r = setNpcTarget(s, null);
    expect(r.targetTile).toBeUndefined();
  });
});

describe('buildWallsSet', () => {
  it('Tile-Typ 3 (Wasser) wird zu Wall', () => {
    const tiles = [[0, 3], [0, 0]];
    const walls = buildWallsSet(tiles);
    expect(walls.has('1,0')).toBe(true);
    expect(walls.has('0,0')).toBe(false);
  });

  it('Tile-Typen 4,5,6,8 werden zu Walls', () => {
    const tiles = [[4, 5], [6, 8]];
    const walls = buildWallsSet(tiles);
    expect(walls.has('0,0')).toBe(true); // 4
    expect(walls.has('1,0')).toBe(true); // 5
    expect(walls.has('0,1')).toBe(true); // 6
    expect(walls.has('1,1')).toBe(true); // 8
  });

  it('begehbare Tiles (0,1,2,7,9,12) sind nicht in walls', () => {
    const tiles = [[0, 1, 2, 7, 9, 12]];
    const walls = buildWallsSet(tiles);
    for (let x = 0; x < 6; x++) {
      expect(walls.has(`${x},0`)).toBe(false);
    }
  });

  it('leere Tilemap -> leere walls', () => {
    expect(buildWallsSet([]).size).toBe(0);
  });
});
