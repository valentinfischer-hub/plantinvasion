/**
 * Tests: Market Bought-Today Tracking (S-POLISH-B2-R9)
 */
import { describe, it, expect, beforeEach } from 'vitest';

// Minimal GameState stub — testet nur die Bought-Today-Logik
interface MinimalState {
  createdAt: number;
  marketBoughtToday?: Record<string, number>;
  marketBoughtTodayDay?: number;
}

// Inline port der Methoden aus gameState.ts fuer isolierte Tests
function getBoughtTodayMap(state: MinimalState, now: number): Record<string, number> {
  const dayIndex = Math.floor((now - state.createdAt) / (24 * 60 * 60 * 1000));
  if (state.marketBoughtTodayDay !== dayIndex) {
    state.marketBoughtToday = {};
    state.marketBoughtTodayDay = dayIndex;
  }
  if (!state.marketBoughtToday) state.marketBoughtToday = {};
  return state.marketBoughtToday;
}

function getMarketBoughtToday(state: MinimalState, slug: string, now: number): number {
  return getBoughtTodayMap(state, now)[slug] ?? 0;
}

function recordMarketRosterBought(state: MinimalState, slug: string, now: number): void {
  const map = getBoughtTodayMap(state, now);
  map[slug] = (map[slug] ?? 0) + 1;
}

const DAY_MS = 24 * 60 * 60 * 1000;

describe('Market Bought-Today Tracking', () => {
  let state: MinimalState;
  const t0 = 1_000_000_000_000; // fixer Startzeitpunkt

  beforeEach(() => {
    state = { createdAt: t0, marketBoughtToday: {}, marketBoughtTodayDay: -1 };
  });

  it('gibt 0 zurück wenn Item noch nicht gekauft', () => {
    expect(getMarketBoughtToday(state, 'compost-tea', t0)).toBe(0);
  });

  it('zählt einen Kauf korrekt', () => {
    recordMarketRosterBought(state, 'compost-tea', t0);
    expect(getMarketBoughtToday(state, 'compost-tea', t0)).toBe(1);
  });

  it('zählt mehrere Käufe desselben Items', () => {
    recordMarketRosterBought(state, 'compost-tea', t0);
    recordMarketRosterBought(state, 'compost-tea', t0);
    recordMarketRosterBought(state, 'compost-tea', t0);
    expect(getMarketBoughtToday(state, 'compost-tea', t0)).toBe(3);
  });

  it('trackt verschiedene Items unabhängig', () => {
    recordMarketRosterBought(state, 'compost-tea', t0);
    recordMarketRosterBought(state, 'volcano-ash', t0);
    recordMarketRosterBought(state, 'volcano-ash', t0);
    expect(getMarketBoughtToday(state, 'compost-tea', t0)).toBe(1);
    expect(getMarketBoughtToday(state, 'volcano-ash', t0)).toBe(2);
    expect(getMarketBoughtToday(state, 'sun-lamp', t0)).toBe(0);
  });

  it('Reset nach einem Tag', () => {
    recordMarketRosterBought(state, 'compost-tea', t0);
    expect(getMarketBoughtToday(state, 'compost-tea', t0)).toBe(1);
    // Nächster Tag
    const nextDay = t0 + DAY_MS + 1;
    expect(getMarketBoughtToday(state, 'compost-tea', nextDay)).toBe(0);
  });

  it('Day-Reset schreibt neues dayIndex', () => {
    const nextDay = t0 + DAY_MS + 1;
    getBoughtTodayMap(state, nextDay);
    const expectedDay = Math.floor(DAY_MS / DAY_MS); // = 1
    expect(state.marketBoughtTodayDay).toBe(expectedDay);
  });

  it('Tag 0 = createdAt selbst', () => {
    getBoughtTodayMap(state, t0);
    expect(state.marketBoughtTodayDay).toBe(0);
  });
});
