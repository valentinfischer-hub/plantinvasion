/**
 * InputManager Tests - S-POLISH Batch 5 Run 14
 *
 * Testet getMovement()-Logik und INPUT_BINDINGS-Definitionen (kein Phaser).
 */
import { describe, it, expect } from 'vitest';
import { INPUT_BINDINGS } from '../inputBindings';

// ─── getMovement Logik (Inline-Reimplementierung fuer reine Tests) ────────

function getMovement(down: Set<string>): { x: number; y: number } {
  let x = 0, y = 0;
  if (down.has('MOVE_LEFT')) x -= 1;
  if (down.has('MOVE_RIGHT')) x += 1;
  if (down.has('MOVE_UP')) y -= 1;
  if (down.has('MOVE_DOWN')) y += 1;
  if (x !== 0 && y !== 0) {
    const f = 1 / Math.sqrt(2);
    x *= f; y *= f;
  }
  return { x, y };
}

describe('getMovement Logik', () => {
  it('kein Input: (0, 0)', () => {
    expect(getMovement(new Set())).toEqual({ x: 0, y: 0 });
  });

  it('nur links: (-1, 0)', () => {
    expect(getMovement(new Set(['MOVE_LEFT']))).toEqual({ x: -1, y: 0 });
  });

  it('nur rechts: (1, 0)', () => {
    expect(getMovement(new Set(['MOVE_RIGHT']))).toEqual({ x: 1, y: 0 });
  });

  it('nur hoch: (0, -1)', () => {
    expect(getMovement(new Set(['MOVE_UP']))).toEqual({ x: 0, y: -1 });
  });

  it('diagonal oben-rechts: normalisiert', () => {
    const { x, y } = getMovement(new Set(['MOVE_RIGHT', 'MOVE_UP']));
    const factor = 1 / Math.sqrt(2);
    expect(x).toBeCloseTo(factor);
    expect(y).toBeCloseTo(-factor);
  });

  it('diagonal unten-links: normalisiert', () => {
    const { x, y } = getMovement(new Set(['MOVE_LEFT', 'MOVE_DOWN']));
    const factor = 1 / Math.sqrt(2);
    expect(x).toBeCloseTo(-factor);
    expect(y).toBeCloseTo(factor);
  });

  it('links+rechts heben sich auf: x=0', () => {
    const { x } = getMovement(new Set(['MOVE_LEFT', 'MOVE_RIGHT']));
    expect(x).toBe(0);
  });
});

// ─── INPUT_BINDINGS Konstanten ────────────────────────────────────────────

describe('INPUT_BINDINGS', () => {
  it('enthaelt alle 8 Actions', () => {
    const actions = Object.keys(INPUT_BINDINGS);
    expect(actions).toContain('MOVE_UP');
    expect(actions).toContain('MOVE_DOWN');
    expect(actions).toContain('MOVE_LEFT');
    expect(actions).toContain('MOVE_RIGHT');
    expect(actions).toContain('CONFIRM');
    expect(actions).toContain('CANCEL');
    expect(actions).toContain('PAUSE');
    expect(actions).toContain('DEBUG');
    expect(actions.length).toBe(8);
  });

  it('CONFIRM enthaelt ENTER (13) und SPACE (32)', () => {
    expect(INPUT_BINDINGS.CONFIRM).toContain(13);
    expect(INPUT_BINDINGS.CONFIRM).toContain(32);
  });

  it('MOVE_UP enthaelt W (87) und UP (38)', () => {
    expect(INPUT_BINDINGS.MOVE_UP).toContain(87);
    expect(INPUT_BINDINGS.MOVE_UP).toContain(38);
  });

  it('CANCEL enthaelt ESC (27)', () => {
    expect(INPUT_BINDINGS.CANCEL).toContain(27);
  });
});
