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
