import { describe, it, expect } from 'vitest';
import { findPath, nextStepTowards, type Tile } from '../pathfinding';

const NO_WALLS: ReadonlySet<string> = new Set();

describe('findPath: Basic Pfade', () => {
  it('start == target -> 1-Tile-Pfad', () => {
    const r = findPath({ x: 5, y: 5 }, { x: 5, y: 5 }, NO_WALLS);
    expect(r).toEqual([{ x: 5, y: 5 }]);
  });

  it('direkter Nachbar -> 2-Tile-Pfad', () => {
    const r = findPath({ x: 0, y: 0 }, { x: 1, y: 0 }, NO_WALLS);
    expect(r).toHaveLength(2);
    expect(r![0]).toEqual({ x: 0, y: 0 });
    expect(r![1]).toEqual({ x: 1, y: 0 });
  });

  it('einfache Linie ohne Walls', () => {
    const r = findPath({ x: 0, y: 0 }, { x: 5, y: 0 }, NO_WALLS);
    expect(r).toHaveLength(6);
    expect(r![0]).toEqual({ x: 0, y: 0 });
    expect(r![5]).toEqual({ x: 5, y: 0 });
  });

  it('diagonale Pfad-Laenge entspricht Manhattan-Distance + 1', () => {
    const r = findPath({ x: 0, y: 0 }, { x: 3, y: 4 }, NO_WALLS);
    expect(r).toHaveLength(8);
  });
});

describe('findPath: Wall-Block', () => {
  it('Wall direkt am Ziel -> null (Ziel unerreichbar)', () => {
    const walls = new Set([`5,5`]);
    expect(findPath({ x: 0, y: 0 }, { x: 5, y: 5 }, walls)).toBeNull();
  });

  it('Wand zwischen start und target -> findet Umweg', () => {
    // Wand bei x=5, y=0..2. Pfad muss um Wand herum.
    const walls = new Set(['5,0', '5,1', '5,2']);
    const r = findPath({ x: 0, y: 0 }, { x: 10, y: 0 }, walls);
    expect(r).not.toBeNull();
    expect(r!.length).toBeGreaterThan(11); // mehr als die direkte Linie
    // Letzter Tile == target
    expect(r![r!.length - 1]).toEqual({ x: 10, y: 0 });
  });

  it('Komplette Mauer (Box rund um target) -> null', () => {
    const walls = new Set(['4,5', '6,5', '5,4', '5,6']);
    expect(findPath({ x: 0, y: 0 }, { x: 5, y: 5 }, walls)).toBeNull();
  });
});

describe('findPath: maxSteps Cap', () => {
  it('maxSteps zu klein -> null', () => {
    expect(findPath({ x: 0, y: 0 }, { x: 50, y: 50 }, NO_WALLS, 5)).toBeNull();
  });

  it('maxSteps gross genug -> findet Pfad', () => {
    const r = findPath({ x: 0, y: 0 }, { x: 5, y: 5 }, NO_WALLS, 200);
    expect(r).not.toBeNull();
    expect(r![r!.length - 1]).toEqual({ x: 5, y: 5 });
  });
});

describe('findPath: Determinismus', () => {
  it('same Input -> same Output', () => {
    const start: Tile = { x: 0, y: 0 };
    const target: Tile = { x: 4, y: 4 };
    const r1 = findPath(start, target, NO_WALLS);
    const r2 = findPath(start, target, NO_WALLS);
    expect(r1).toEqual(r2);
  });
});

describe('nextStepTowards', () => {
  it('liefert naechsten Tile auf dem Pfad', () => {
    const next = nextStepTowards({ x: 0, y: 0 }, { x: 5, y: 0 }, NO_WALLS);
    expect(next).toEqual({ x: 1, y: 0 });
  });

  it('liefert null wenn target == from', () => {
    const next = nextStepTowards({ x: 5, y: 5 }, { x: 5, y: 5 }, NO_WALLS);
    expect(next).toBeNull();
  });

  it('liefert null wenn target von Walls umgeben ist (unerreichbar)', () => {
    // target (5,5) komplett von Walls umgeben
    const walls = new Set(['4,5', '6,5', '5,4', '5,6']);
    const next = nextStepTowards({ x: 0, y: 0 }, { x: 5, y: 5 }, walls);
    expect(next).toBeNull();
  });
});
