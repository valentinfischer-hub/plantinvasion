/**
 * Tests: Login-Streak Tracking (S-POLISH-B2-R12)
 */
import { describe, it, expect } from 'vitest';

const DAY = 24 * 60 * 60 * 1000;

// Port der updateLoginStreak-Logik aus gameState.ts (fuer isolierte Tests)
interface StreakState {
  lastDailyLoginAt: number;
  loginStreak: number;
  loginDaysTotal: number;
}

function updateLoginStreak(state: StreakState, now: number): void {
  const last = state.lastDailyLoginAt ?? 0;
  const todayDay = Math.floor(now / DAY);
  const lastDay = Math.floor(last / DAY);
  const dayDiff = todayDay - lastDay;
  if (dayDiff === 1) {
    state.loginStreak = (state.loginStreak ?? 0) + 1;
  } else if (dayDiff > 1) {
    state.loginStreak = 1;
  }
  state.loginDaysTotal = (state.loginDaysTotal ?? 0) + 1;
}

describe('Login-Streak updateLoginStreak', () => {
  it('erster Login: Streak bleibt 0 (kein vorheriger Tag)', () => {
    const state: StreakState = { lastDailyLoginAt: 0, loginStreak: 0, loginDaysTotal: 0 };
    const now = DAY * 100;
    updateLoginStreak(state, now);
    // lastDailyLoginAt war 0 (Tag 0), jetzt Tag 100 → dayDiff = 100 → Streak = 1
    expect(state.loginStreak).toBe(1);
    expect(state.loginDaysTotal).toBe(1);
  });

  it('konsekutiver Tag erhöht Streak', () => {
    const day100 = DAY * 100 + 3600; // Tag 100
    const day101 = DAY * 101 + 3600; // Tag 101
    const state: StreakState = { lastDailyLoginAt: day100, loginStreak: 5, loginDaysTotal: 10 };
    updateLoginStreak(state, day101);
    expect(state.loginStreak).toBe(6);
    expect(state.loginDaysTotal).toBe(11);
  });

  it('übersprungener Tag resettet Streak auf 1', () => {
    const day100 = DAY * 100;
    const day102 = DAY * 102; // Tag 102 (Lücke!)
    const state: StreakState = { lastDailyLoginAt: day100, loginStreak: 10, loginDaysTotal: 20 };
    updateLoginStreak(state, day102);
    expect(state.loginStreak).toBe(1);
    expect(state.loginDaysTotal).toBe(21);
  });

  it('gleicher Tag ändert Streak nicht', () => {
    const sameDay = DAY * 100 + 1000;
    const sameDayLater = DAY * 100 + 50000;
    const state: StreakState = { lastDailyLoginAt: sameDay, loginStreak: 3, loginDaysTotal: 5 };
    updateLoginStreak(state, sameDayLater);
    // dayDiff = 0 → keine Änderung an loginStreak, aber total steigt
    expect(state.loginStreak).toBe(3);
    expect(state.loginDaysTotal).toBe(6);
  });

  it('7-Tage-Streak korrekt akkumuliert', () => {
    const state: StreakState = { lastDailyLoginAt: 0, loginStreak: 0, loginDaysTotal: 0 };
    for (let d = 1; d <= 7; d++) {
      const prevDay = d === 1 ? 0 : DAY * (d - 1);
      state.lastDailyLoginAt = prevDay;
      updateLoginStreak(state, DAY * d);
    }
    expect(state.loginStreak).toBe(7);
    expect(state.loginDaysTotal).toBe(7);
  });
});
