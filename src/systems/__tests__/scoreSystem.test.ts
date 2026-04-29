import { describe, test, expect } from 'vitest';
/**
 * Score-System Tests [b4-run10/15]
 */
import {
  calcPoints,
  increaseMultiplier,
  resetMultiplier,
  updateHighscores,
  getDailyChallenge,
  addScore,
  createScoreState,
} from '../scoreSystem';

describe('Score-System: calcPoints', () => {
  test('Harvest 10 Punkte * Multiplikator 1.0', () => {
    expect(calcPoints({ type: 'harvest', basePoints: 10 }, 1.0)).toBe(10);
  });

  test('Mutation 100 * 2.0 = 200', () => {
    expect(calcPoints({ type: 'mutation', basePoints: 100 }, 2.0)).toBe(200);
  });

  test('Multiplikator wird auf MAX_MULTIPLIER (3.0) geclampt', () => {
    const points = calcPoints({ type: 'crossing', basePoints: 25 }, 99.0);
    expect(points).toBe(Math.floor(25 * 3.0)); // 75
  });

  test('Multiplikator unter 1.0 wird auf 1.0 geclampt', () => {
    expect(calcPoints({ type: 'harvest', basePoints: 10 }, 0.5)).toBe(10);
  });

  test('Daily-Bonus 200 * 1.5 = 300', () => {
    expect(calcPoints({ type: 'daily_bonus', basePoints: 200 }, 1.5)).toBe(300);
  });
});

describe('Score-System: Multiplikator', () => {
  test('ErhÃ¶hung um 1 Step = +0.1', () => {
    expect(increaseMultiplier(1.0)).toBe(1.1);
  });

  test('Mehrere Steps kumulieren', () => {
    expect(increaseMultiplier(1.0, 5)).toBe(1.5);
  });

  test('Cap bei 3.0', () => {
    expect(increaseMultiplier(2.9, 5)).toBe(3.0);
  });

  test('Reset setzt auf 1.0', () => {
    expect(resetMultiplier()).toBe(1.0);
  });
});

describe('Score-System: Highscores', () => {
  test('Neuer Score wird eingefuegt und sortiert', () => {
    const result = updateHighscores([100, 50, 200], 150);
    expect(result).toEqual([200, 150, 100, 50]);
  });

  test('Maximal 5 Eintraege', () => {
    const result = updateHighscores([500, 400, 300, 200, 100], 50);
    expect(result).toHaveLength(5);
    expect(result[result.length - 1]).toBe(100); // 50 rausfliegt
  });

  test('Neuer Highscore (top) steht an erster Stelle', () => {
    const result = updateHighscores([100, 80, 60], 999);
    expect(result[0]).toBe(999);
  });

  test('Leere Liste akzeptiert ersten Score', () => {
    const result = updateHighscores([], 42);
    expect(result).toEqual([42]);
  });
});

describe('Score-System: Daily-Challenge', () => {
  test('getDailyChallenge(0) gibt gueltiges Objekt', () => {
    const c = getDailyChallenge(0);
    expect(c.day).toBe(0);
    expect(c.targetCount).toBeGreaterThan(0);
    expect(c.bonusPoints).toBeGreaterThan(0);
    expect(c.goal).toBeTruthy();
  });

  test('Verschiedene Tage haben unterschiedliche Ziele', () => {
    const c0 = getDailyChallenge(0);
    const c1 = getDailyChallenge(1);
    // Mindestens seed oder targetType unterscheiden sich
    expect(c0.seed).not.toBe(c1.seed);
  });

  test('Deterministisch: gleicher Tag = gleiche Challenge', () => {
    const c1 = getDailyChallenge(7);
    const c2 = getDailyChallenge(7);
    expect(c1.goal).toBe(c2.goal);
    expect(c1.targetCount).toBe(c2.targetCount);
  });

  test('BonusPoints steigen mit dem Tag-Nummer', () => {
    const c1 = getDailyChallenge(1);
    const c100 = getDailyChallenge(100);
    expect(c100.bonusPoints).toBeGreaterThan(c1.bonusPoints);
  });
});

describe('Score-System: addScore + createScoreState', () => {
  test('addScore addiert korrekt', () => {
    expect(addScore(100, 50)).toBe(150);
  });

  test('addScore ignoriert negative Punkte', () => {
    expect(addScore(100, -50)).toBe(100);
  });

  test('createScoreState liefert Standardwerte', () => {
    const state = createScoreState();
    expect(state.playerScore).toBe(0);
    expect(state.scoreMultiplier).toBe(1.0);
    expect(state.highscores).toEqual([]);
  });
});
