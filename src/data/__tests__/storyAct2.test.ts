import { describe, it, expect } from 'vitest';
import {
  evaluateAct2Progress,
  autoSetAct2Flags,
  ACT2_FLAGS,
  BROMELIAD_SEED_SLUG,
  BROMELIAD_REQUIRED_COUNT,
} from '../storyAct2';

describe('evaluateAct2Progress', () => {
  it('gibt pending zurück wenn keine Flags gesetzt', () => {
    expect(evaluateAct2Progress({})).toBe('pending');
  });

  it('gibt pending wenn verdanto_explored nicht gesetzt', () => {
    expect(evaluateAct2Progress({ [ACT2_FLAGS.BROMELIEN_COLLECTED]: true })).toBe('pending');
  });

  it('gibt in_progress wenn verdanto_explored gesetzt aber kein Bromelien-Flag', () => {
    expect(evaluateAct2Progress({ [ACT2_FLAGS.VERDANTO_EXPLORED]: true })).toBe('in_progress');
  });

  it('gibt completed wenn beide Bedingungen erfüllt', () => {
    expect(
      evaluateAct2Progress({
        [ACT2_FLAGS.VERDANTO_EXPLORED]: true,
        [ACT2_FLAGS.BROMELIEN_COLLECTED]: true,
      })
    ).toBe('completed');
  });

  it('ignoriert irrelevante Flags', () => {
    expect(evaluateAct2Progress({ some_other_flag: true })).toBe('pending');
  });
});

describe('autoSetAct2Flags', () => {
  it('setzt verdanto_explored wenn verdanto in visitedZones', () => {
    const result = autoSetAct2Flags({}, ['verdanto'], {});
    expect(result[ACT2_FLAGS.VERDANTO_EXPLORED]).toBe(true);
  });

  it('setzt verdanto_erkundet bei erstem Verdanto-Besuch', () => {
    const result = autoSetAct2Flags({}, ['verdanto'], {});
    expect(result[ACT2_FLAGS.VERDANTO_ERKUNDET]).toBe(true);
  });

  it('setzt verdanto_explored nicht wenn verdanto nicht in visitedZones', () => {
    const result = autoSetAct2Flags({}, ['wurzelheim', 'kaktoria'], {});
    expect(result[ACT2_FLAGS.VERDANTO_EXPLORED]).toBeUndefined();
  });

  it(`setzt bromelien_collected_3 wenn >= ${BROMELIAD_REQUIRED_COUNT} Samen im Inventar`, () => {
    const result = autoSetAct2Flags({}, [], { [BROMELIAD_SEED_SLUG]: 3 });
    expect(result[ACT2_FLAGS.BROMELIEN_COLLECTED]).toBe(true);
  });

  it('setzt bromelien_collected_3 nicht bei < 3 Samen', () => {
    const result = autoSetAct2Flags({}, [], { [BROMELIAD_SEED_SLUG]: 2 });
    expect(result[ACT2_FLAGS.BROMELIEN_COLLECTED]).toBeUndefined();
  });

  it('gibt unverändertes Objekt zurück wenn keine Änderung (referentielle Stabilität)', () => {
    const flags = { some_flag: true };
    const result = autoSetAct2Flags(flags, ['wurzelheim'], {});
    // Keine Änderung ausser some_flag – neues Objekt aber gleiche Keys
    expect(result.some_flag).toBe(true);
    expect(result).not.toBe(flags); // immer neues Objekt (immutable Pattern)
  });

  it('überschreibt verdanto_erkundet-Flag nicht wenn bereits gesetzt', () => {
    const flags = { [ACT2_FLAGS.VERDANTO_ERKUNDET]: true };
    const result = autoSetAct2Flags(flags, ['verdanto'], {});
    expect(result[ACT2_FLAGS.VERDANTO_ERKUNDET]).toBe(true);
  });

  it('setzt beide Flags korrekt bei erfüllten Bedingungen', () => {
    const result = autoSetAct2Flags({}, ['verdanto', 'wurzelheim'], { [BROMELIAD_SEED_SLUG]: 5 });
    expect(result[ACT2_FLAGS.VERDANTO_EXPLORED]).toBe(true);
    expect(result[ACT2_FLAGS.BROMELIEN_COLLECTED]).toBe(true);
    expect(result[ACT2_FLAGS.VERDANTO_ERKUNDET]).toBe(true);
  });
});
