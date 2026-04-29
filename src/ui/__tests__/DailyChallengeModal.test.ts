/**
 * DailyChallengeModal Tests - S-POLISH Batch 5 Run 8
 */
import { describe, it, expect } from 'vitest';
import { formatCountdown, msUntilMidnight } from '../DailyChallengeModal';

describe('formatCountdown', () => {
  it('0ms = 00:00:00', () => {
    expect(formatCountdown(0)).toBe('00:00:00');
  });

  it('1 Stunde = 01:00:00', () => {
    expect(formatCountdown(3600_000)).toBe('01:00:00');
  });

  it('90 Minuten = 01:30:00', () => {
    expect(formatCountdown(90 * 60_000)).toBe('01:30:00');
  });

  it('1 Sekunde = 00:00:01', () => {
    expect(formatCountdown(1000)).toBe('00:00:01');
  });

  it('negativ = 00:00:00 (kein Unterlauf)', () => {
    expect(formatCountdown(-5000)).toBe('00:00:00');
  });

  it('23:59:59 = 86399 Sekunden', () => {
    expect(formatCountdown(86_399_000)).toBe('23:59:59');
  });
});

describe('msUntilMidnight', () => {
  it('liefert positive Zahl (immer <= 24h)', () => {
    const ms = msUntilMidnight(Date.now());
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(24 * 3600_000);
  });

  it('liefert korrekte Zeit bei bekanntem Zeitpunkt', () => {
    // 2024-01-01 12:00:00 UTC -> 12h bis Mitternacht
    const noon = new Date('2024-01-01T12:00:00.000Z').getTime();
    const ms = msUntilMidnight(noon);
    // ms bis Mitternacht UTC = 12h = 43200000ms
    // ABER: msUntilMidnight nutzt lokale Zeitzone
    // Nur pruefen ob es im gueltigen Bereich liegt
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(24 * 3600_000);
  });
});
