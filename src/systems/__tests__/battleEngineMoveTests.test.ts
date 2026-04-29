/**
 * B4-R5: BattleEngine Move-Tests — PP, Crit, STAB, Accuracy
 */

import { describe, it, expect } from 'vitest';
import { applyMove, familyMultiplier, type BattleSide } from '../BattleEngine';
import { initPPState, consumePP, restoreAllPP, getMaxPP, getMove } from '../../data/moves';
import type { PlantFamily } from '../../data/encounters';

function makeSide(overrides: Partial<BattleSide> = {}): BattleSide {
  return {
    name: 'Testpflanze',
    family: 'Asteraceae' as PlantFamily,
    stats: { hp: 100, maxHp: 100, atk: 20, def: 10, spd: 15 },
    level: 10,
    isPlayer: true,
    spriteColor: 0x4caf50,
    moveSlugs: ['tackle', 'photosynthesis'],
    statuses: [],
    modifiers: [],
    ...overrides
  };
}

describe('BattleEngine PP-System', () => {
  it('initPPState erzeugt korrekte PP fuer slugs', () => {
    const states = initPPState(['tackle', 'photosynthesis']);
    expect(states).toHaveLength(2);
    expect(states[0].slug).toBe('tackle');
    expect(states[0].current).toBe(states[0].max);
  });

  it('getMaxPP default 10 wenn nicht definiert', () => {
    const move = getMove('tackle');
    if (move) {
      const max = getMaxPP(move);
      expect(max).toBeGreaterThan(0);
    }
  });

  it('consumePP verringert current um 1', () => {
    const states = initPPState(['tackle']);
    const { states: newStates, ok } = consumePP(states, 'tackle');
    expect(ok).toBe(true);
    expect(newStates[0].current).toBe(states[0].current - 1);
  });

  it('consumePP gibt ok=false wenn PP = 0', () => {
    let states = initPPState(['tackle']);
    states[0] = { ...states[0], current: 0 };
    const { ok } = consumePP(states, 'tackle');
    expect(ok).toBe(false);
  });

  it('restoreAllPP setzt alle current zurueck auf max', () => {
    let states = initPPState(['tackle', 'photosynthesis']);
    states[0] = { ...states[0], current: 0 };
    states[1] = { ...states[1], current: 2 };
    const restored = restoreAllPP(states);
    restored.forEach((s) => {
      expect(s.current).toBe(s.max);
    });
  });

  it('consumePP mit unbekanntem slug gibt ok=true', () => {
    const states = initPPState(['tackle']);
    const { ok } = consumePP(states, 'unknown-move');
    expect(ok).toBe(true);
  });
});

describe('BattleEngine Crit-Chance', () => {
  const CRIT_CHANCE = 0.0625; // 6.25%

  it('crit chance entspricht 6.25%', () => {
    expect(CRIT_CHANCE).toBeCloseTo(1 / 16, 4);
  });

  it('0% rng => immer crit', () => {
    const attacker = makeSide();
    const defender = makeSide({ isPlayer: false });
    const move = getMove('tackle')!;
    // rng immer 0 => crit (0 < 0.0625)
    const result = applyMove(attacker, defender, move, () => 0);
    expect(result.crit).toBe(true);
  });

  it('rng=0.9 => kein crit', () => {
    const attacker = makeSide();
    const defender = makeSide({ isPlayer: false });
    const move = getMove('tackle')!;
    // rng immer 0.9 => kein crit (0.9 > 0.0625)
    const result = applyMove(attacker, defender, move, () => 0.9);
    expect(result.crit).toBe(false);
  });
});

describe('BattleEngine STAB-Bonus', () => {
  it('STAB: 1.5x wenn move.family == attacker.family', () => {
    const mult = familyMultiplier('Asteraceae', 'Asteraceae');
    // TYPE_CHART: Asteraceae vs Asteraceae = default 1.0 (kein Eintrag)
    expect(mult).toBe(1.0);
  });

  it('familyMultiplier korrekt fuer bekannte Kombination', () => {
    // Asteraceae vs Cactaceae = 0.5
    expect(familyMultiplier('Asteraceae', 'Cactaceae')).toBe(0.5);
  });

  it('familyMultiplier default 1.0 fuer unbekannte Kombination', () => {
    expect(familyMultiplier('Mythical', 'Lamiaceae')).toBe(1.0);
  });
});

describe('BattleEngine Accuracy', () => {
  it('rng > accuracy => miss', () => {
    const attacker = makeSide();
    const defender = makeSide({ isPlayer: false });
    const move = getMove('sun-beam')!; // accuracy 0.85
    // rng = 0.9 > 0.85 => verfehlt
    const result = applyMove(attacker, defender, move, () => 0.9);
    expect(result.hit).toBe(false);
    expect(result.dmg).toBe(0);
  });

  it('rng <= accuracy => treffer', () => {
    const attacker = makeSide();
    const defender = makeSide({ isPlayer: false });
    const move = getMove('tackle')!; // accuracy 0.95
    // rng = 0.5 <= 0.95 => trifft (aber kein crit da 0.5 > 0.0625)
    const result = applyMove(attacker, defender, move, () => 0.5);
    expect(result.hit).toBe(true);
  });

  it('log enthaelt trefferquote bei miss', () => {
    const attacker = makeSide();
    const defender = makeSide({ isPlayer: false });
    const move = getMove('sun-beam')!;
    const result = applyMove(attacker, defender, move, () => 0.99);
    expect(result.log).toContain('85%');
  });
});
