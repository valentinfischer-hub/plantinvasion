/**
 * Score-System [b4-run10/15]
 * Tracking, Multiplikator, Highscore-Liste (Top-5), Daily-Challenge
 */

export interface ScoreEvent {
  type: 'harvest' | 'crossing' | 'mutation' | 'battle_win' | 'forage' | 'daily_bonus';
  basePoints: number;
}

const SCORE_BASE: Record<ScoreEvent['type'], number> = {
  harvest: 10,
  crossing: 25,
  mutation: 100,
  battle_win: 30,
  forage: 5,
  daily_bonus: 200,
};

const MAX_HIGHSCORES = 5;
const MAX_MULTIPLIER = 3.0;

export interface ScoreState {
  playerScore: number;
  scoreMultiplier: number;
  highscores: number[];
  lastDailyChallengeSeed?: number;
}

export function createScoreState(): ScoreState {
  return {
    playerScore: 0,
    scoreMultiplier: 1.0,
    highscores: [],
  };
}

/** Berechnet Punkte fuer ein Event (Basis * Multiplikator, floor) */
export function calcPoints(event: ScoreEvent, multiplier: number): number {
  const base = SCORE_BASE[event.type] ?? event.basePoints;
  return Math.floor(base * Math.max(1.0, Math.min(MAX_MULTIPLIER, multiplier)));
}

/** Erhoeht den Multiplikator (max 3.0, in 0.1-Schritten) */
export function increaseMultiplier(current: number, steps = 1): number {
  return Math.min(MAX_MULTIPLIER, parseFloat((current + steps * 0.1).toFixed(1)));
}

/** Setzt Multiplikator auf 1.0 zurueck (bei Fehler/Tag-Wechsel) */
export function resetMultiplier(): number {
  return 1.0;
}

/** Fuegt einen Score zur Highscore-Liste hinzu, sortiert absteigend, max 5 */
export function updateHighscores(list: number[], newScore: number): number[] {
  const updated = [...list, newScore].sort((a, b) => b - a).slice(0, MAX_HIGHSCORES);
  return updated;
}

/** Generiert eine deterministische Daily-Challenge basierend auf dem Day-Index */
export interface DailyChallenge {
  seed: number;
  day: number;
  goal: string;
  targetType: ScoreEvent['type'];
  targetCount: number;
  bonusPoints: number;
}

const CHALLENGE_GOALS: Array<{ goal: string; targetType: ScoreEvent['type']; countFactor: number }> = [
  { goal: 'Ernte {n} Pflanzen', targetType: 'harvest', countFactor: 3 },
  { goal: 'Führe {n} Kreuzungen durch', targetType: 'crossing', countFactor: 2 },
  { goal: 'Gewinne {n} Kämpfe', targetType: 'battle_win', countFactor: 2 },
  { goal: 'Forrage {n} Mal', targetType: 'forage', countFactor: 5 },
  { goal: 'Erzeuge {n} Mutationen', targetType: 'mutation', countFactor: 1 },
];

export function getDailyChallenge(dayNumber: number): DailyChallenge {
  // Pseudo-deterministisch: dayNumber mod Anzahl Goals
  const idx = ((dayNumber % CHALLENGE_GOALS.length) + CHALLENGE_GOALS.length) % CHALLENGE_GOALS.length;
  const template = CHALLENGE_GOALS[idx];
  const targetCount = 1 + (dayNumber % 3); // 1, 2, oder 3
  const goal = template.goal.replace('{n}', String(targetCount));
  return {
    seed: dayNumber,
    day: dayNumber,
    goal,
    targetType: template.targetType,
    targetCount,
    bonusPoints: 200 + dayNumber * 10,
  };
}

/** Addiert Punkte auf den aktuellen Score */
export function addScore(current: number, points: number): number {
  return current + Math.max(0, points);
}
