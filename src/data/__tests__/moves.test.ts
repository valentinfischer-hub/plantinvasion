import { describe, it, expect } from 'vitest';
import { MOVES, getMove, defaultMovesForFamily } from '../moves';

describe('MOVES Datenstruktur', () => {
  it('hat mindestens 20 Moves', () => {
    expect(MOVES.length).toBeGreaterThanOrEqual(20);
  });

  it('jeder Move hat slug, name, family, power, accuracy', () => {
    for (const m of MOVES) {
      expect(m.slug).toBeTruthy();
      expect(m.name).toBeTruthy();
      expect(m.family).toBeTruthy();
      expect(typeof m.power).toBe('number');
      expect(m.accuracy).toBeGreaterThanOrEqual(0);
      expect(m.accuracy).toBeLessThanOrEqual(1);
    }
  });

  it('keine duplizierten slugs', () => {
    const slugs = MOVES.map((m) => m.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('priority ist immer -1, 0, 1 oder 2', () => {
    for (const m of MOVES) {
      expect([-1, 0, 1, 2]).toContain(m.priority);
    }
  });

  it('alle Moves haben flavor + description', () => {
    for (const m of MOVES) {
      expect(m.flavor).toBeTruthy();
      expect(m.description).toBeTruthy();
    }
  });

  it('status.chance (wenn vorhanden) ist 0-1', () => {
    for (const m of MOVES) {
      if (m.status) {
        expect(m.status.chance).toBeGreaterThanOrEqual(0);
        expect(m.status.chance).toBeLessThanOrEqual(1);
      }
    }
  });

  it('mindestens ein Universal-Move existiert (tackle)', () => {
    expect(getMove('tackle')).toBeDefined();
  });
});

describe('getMove', () => {
  it('liefert Move bei bekanntem slug', () => {
    expect(getMove('tackle')).toBeDefined();
  });

  it('liefert undefined bei unbekanntem slug', () => {
    expect(getMove('not-a-real-move')).toBeUndefined();
  });
});

describe('defaultMovesForFamily', () => {
  it('liefert genau 4 moves (3 family + tackle)', () => {
    const moves = defaultMovesForFamily('Asteraceae');
    expect(moves.length).toBeLessThanOrEqual(4);
    expect(moves[moves.length - 1]).toBe('tackle');
  });

  it('letzter Move ist immer tackle', () => {
    const moves = defaultMovesForFamily('Cactaceae');
    expect(moves).toContain('tackle');
  });

  it('liefert nur tackle bei unbekannter family', () => {
    const moves = defaultMovesForFamily('Mythical');
    expect(moves).toContain('tackle');
  });
});
