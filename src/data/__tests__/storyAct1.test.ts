import { describe, it, expect } from 'vitest';
import { evaluateAct1Progress, autoSetAct1Flags, ACT1_QUEST_FLAGS } from '../storyAct1';
import type { Plant } from '../../types/plant';

function makePlant(slug: string, level: number, watered = false): Plant {
  return {
    id: `${slug}-${level}`,
    speciesSlug: slug,
    stats: { atk: 10, def: 10, spd: 10 },
    geneSeed: 1, isMutation: false, level, xp: 0, totalXp: 0,
    bornAt: 1000,
    lastWateredAt: watered ? 2000 : 1000,
    lastTickAt: 1000,
    hydration: 80, careScore: 0, generation: 0, pendingHarvest: false,
    consecutiveDryHours: 0, highestStageReached: 0, activeBoosters: [],
    gridX: 0, gridY: 0
  };
}

describe('evaluateAct1Progress', () => {
  it('pending wenn keine Sunflower', () => {
    expect(evaluateAct1Progress({}, [])).toBe('pending');
    expect(evaluateAct1Progress({}, [makePlant('mint', 50)])).toBe('pending');
  });

  it('in_progress wenn Sunflower vorhanden aber kein Adult', () => {
    const r = evaluateAct1Progress({}, [makePlant('sunflower', 1)]);
    expect(r).toBe('in_progress');
  });

  it('in_progress wenn Sunflower Adult aber Flags fehlen', () => {
    const r = evaluateAct1Progress({}, [makePlant('sunflower', 50)]);
    expect(r).toBe('in_progress');
  });

  it('completed wenn Sunflower Adult plus alle Flags true', () => {
    const flags = {
      [ACT1_QUEST_FLAGS.SEED_PLANTED]: true,
      [ACT1_QUEST_FLAGS.FIRST_WATER]: true,
      [ACT1_QUEST_FLAGS.REACHED_ADULT]: true
    };
    const r = evaluateAct1Progress(flags, [makePlant('sunflower', 50)]);
    expect(r).toBe('completed');
  });

  it('Determinismus: same Input -> same Output', () => {
    const flags = { [ACT1_QUEST_FLAGS.SEED_PLANTED]: true };
    const plants = [makePlant('sunflower', 1)];
    expect(evaluateAct1Progress(flags, plants)).toBe(evaluateAct1Progress(flags, plants));
  });
});

describe('autoSetAct1Flags', () => {
  it('SEED_PLANTED true wenn Sunflower vorhanden', () => {
    const r = autoSetAct1Flags({}, [makePlant('sunflower', 1)]);
    expect(r[ACT1_QUEST_FLAGS.SEED_PLANTED]).toBe(true);
  });

  it('FIRST_WATER true wenn lastWateredAt > bornAt', () => {
    const r = autoSetAct1Flags({}, [makePlant('sunflower', 1, true)]);
    expect(r[ACT1_QUEST_FLAGS.FIRST_WATER]).toBe(true);
  });

  it('REACHED_ADULT true wenn Sunflower Stage >= 3 (Level >= 30)', () => {
    const r = autoSetAct1Flags({}, [makePlant('sunflower', 50, true)]);
    expect(r[ACT1_QUEST_FLAGS.REACHED_ADULT]).toBe(true);
  });

  it('immutable: liefert neues Object', () => {
    const orig = {};
    const r = autoSetAct1Flags(orig, [makePlant('sunflower', 1)]);
    expect(r).not.toBe(orig);
    expect(orig).toEqual({});
  });

  it('preserved bestehende flags', () => {
    const orig = { other_flag: true };
    const r = autoSetAct1Flags(orig, [makePlant('sunflower', 1)]);
    expect(r.other_flag).toBe(true);
  });

  it('keine Sunflower -> keine Flags gesetzt', () => {
    const r = autoSetAct1Flags({}, [makePlant('mint', 50, true)]);
    expect(r[ACT1_QUEST_FLAGS.SEED_PLANTED]).toBeUndefined();
  });
});

describe('ACT1_QUEST_FLAGS Konstanten', () => {
  it('alle 3 Flags definiert', () => {
    expect(ACT1_QUEST_FLAGS.SEED_PLANTED).toBe('quest_seed_planted');
    expect(ACT1_QUEST_FLAGS.FIRST_WATER).toBe('quest_first_water');
    expect(ACT1_QUEST_FLAGS.REACHED_ADULT).toBe('quest_reached_adult');
  });
});
