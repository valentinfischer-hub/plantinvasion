/**
 * DayNightCycle Tests
 * B6-R5 | S-POLISH
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DayNightCycle } from '../DayNightCycle';

describe('DayNightCycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('erstellt Instanz mit Standard-Cycle-Duration', () => {
    const cycle = new DayNightCycle();
    expect(cycle.getDayProgress()).toBeGreaterThanOrEqual(0);
    expect(cycle.getDayProgress()).toBeLessThan(1);
  });

  it('Cycle-Duration konfigurierbar', () => {
    const cycle = new DayNightCycle({ cycleDurationMs: 10000 });
    vi.advanceTimersByTime(5000);
    const progress = cycle.getDayProgress();
    expect(progress).toBeCloseTo(0.5, 1);
  });

  it('Phase "night" am Anfang', () => {
    const cycle = new DayNightCycle({ cycleDurationMs: 24000 });
    expect(cycle.getCurrentPhase()).toBe('night');
  });

  it('Phase wechselt zu "dawn" nach 25%', () => {
    const cycle = new DayNightCycle({ cycleDurationMs: 4000 });
    vi.advanceTimersByTime(1001); // > 25%
    expect(cycle.getCurrentPhase()).toBe('dawn');
  });

  it('Phase wechselt zu "day" nach 37.5%', () => {
    const cycle = new DayNightCycle({ cycleDurationMs: 8000 });
    vi.advanceTimersByTime(3001); // > 37.5%
    expect(cycle.getCurrentPhase()).toBe('day');
  });

  it('getCurrentTint gibt color + alpha zurück', () => {
    const cycle = new DayNightCycle();
    const tint = cycle.getCurrentTint();
    expect(tint).toHaveProperty('color');
    expect(tint).toHaveProperty('alpha');
    expect(tint.alpha).toBeGreaterThanOrEqual(0);
    expect(tint.alpha).toBeLessThanOrEqual(1);
  });

  it('tintStrength beeinflusst Alpha', () => {
    const cycle1 = new DayNightCycle({ tintStrength: 1.0, cycleDurationMs: 10000 });
    const cycle2 = new DayNightCycle({ tintStrength: 0.5, cycleDurationMs: 10000 });
    vi.advanceTimersByTime(1); // night-Phase
    const t1 = cycle1.getCurrentTint();
    const t2 = cycle2.getCurrentTint();
    expect(t1.alpha).toBeGreaterThan(t2.alpha);
  });

  it('setCycleDuration ändert Geschwindigkeit', () => {
    const cycle = new DayNightCycle({ cycleDurationMs: 10000 });
    cycle.setCycleDuration(20000);
    vi.advanceTimersByTime(5000);
    const p = cycle.getDayProgress();
    expect(p).toBeCloseTo(0.25, 1);
  });

  it('setTintStrength klemmt auf [0,1]', () => {
    const cycle = new DayNightCycle();
    cycle.setTintStrength(2.0);
    expect(cycle.getCurrentTint().alpha).toBeLessThanOrEqual(1);
    cycle.setTintStrength(-1.0);
    expect(cycle.getCurrentTint().alpha).toBeGreaterThanOrEqual(0);
  });
});
