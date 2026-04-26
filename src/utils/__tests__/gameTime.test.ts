/**
 * Vitest-Suite fuer gameTime-Wrapper.
 *
 * Coverage-Ziel: 100 Prozent Lines/Branch. Der Wrapper soll bevor er von
 * leveling.ts/storage.ts uebernommen wird, lueckenlos getestet sein - sonst
 * fuehrt das Refactoring der heiligen Code-Pfade Risiko ein.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  now,
  setNowProvider,
  resetNowProvider,
  freezeTime,
  advanceTimeFrom
} from '../gameTime';

afterEach(() => {
  resetNowProvider();
  vi.restoreAllMocks();
});

describe('gameTime.now', () => {
  it('liefert per default Date.now()', () => {
    const before = Date.now();
    const value = now();
    const after = Date.now();
    expect(value).toBeGreaterThanOrEqual(before);
    expect(value).toBeLessThanOrEqual(after);
  });

  it('benutzt den injizierten Provider', () => {
    setNowProvider(() => 42);
    expect(now()).toBe(42);
  });

  it('aktualisiert sich bei Provider-Wechsel', () => {
    setNowProvider(() => 100);
    expect(now()).toBe(100);
    setNowProvider(() => 200);
    expect(now()).toBe(200);
  });
});

describe('gameTime.resetNowProvider', () => {
  it('stellt den Default-Provider wieder her', () => {
    setNowProvider(() => 999);
    expect(now()).toBe(999);
    resetNowProvider();
    const value = now();
    expect(value).toBeGreaterThan(1_700_000_000_000);
  });

  it('ist idempotent', () => {
    resetNowProvider();
    resetNowProvider();
    const value = now();
    expect(typeof value).toBe('number');
  });
});

describe('gameTime.freezeTime', () => {
  it('friert die Zeit auf einen Wert ein', () => {
    freezeTime(1_700_000_000_000);
    expect(now()).toBe(1_700_000_000_000);
    expect(now()).toBe(1_700_000_000_000);
    expect(now()).toBe(1_700_000_000_000);
  });

  it('kann mit 0 als Wert eingefroren werden', () => {
    freezeTime(0);
    expect(now()).toBe(0);
  });
});

describe('gameTime.advanceTimeFrom', () => {
  it('startet beim angegebenen Wert', () => {
    advanceTimeFrom(500);
    expect(now()).toBe(500);
  });

  it('schreitet um stepMs voran (default 1)', () => {
    advanceTimeFrom(0);
    expect(now()).toBe(0);
    expect(now()).toBe(1);
    expect(now()).toBe(2);
  });

  it('akzeptiert benutzerdefiniertes Step-Increment', () => {
    advanceTimeFrom(100, 50);
    expect(now()).toBe(100);
    expect(now()).toBe(150);
    expect(now()).toBe(200);
  });

  it('liefert den Provider zurueck (fuer Inspektion)', () => {
    const provider = advanceTimeFrom(10, 5);
    expect(typeof provider).toBe('function');
    // Manueller Aufruf erhoeht den internen Counter weiter
    expect(provider()).toBe(10);
    expect(provider()).toBe(15);
    // now() teilt jetzt den selben Counter
    expect(now()).toBe(20);
  });
});

describe('gameTime - Heilige-Pfad-Vorbereitung', () => {
  it('kann leveling-aehnlichen Tick simulieren', () => {
    // Simuliere 60-Sekunden-Tick fuer Hydration-Decay
    const HOUR_MS = 60 * 60 * 1000;
    advanceTimeFrom(0, HOUR_MS);
    const t0 = now();
    const t1 = now();
    expect(t1 - t0).toBe(HOUR_MS);
  });
});
