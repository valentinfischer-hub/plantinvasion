/**
 * rafGuard Tests - S-POLISH Batch 5 Run 6
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rafGuard, _resetAllRafGuards } from '../rafGuard';

vi.stubGlobal('requestAnimationFrame', vi.fn(() => 99));
vi.stubGlobal('cancelAnimationFrame', vi.fn());

beforeEach(() => {
  _resetAllRafGuards();
  vi.clearAllMocks();
});

describe('rafGuard', () => {
  it('start() gibt true zurueck beim ersten Aufruf', () => {
    const g = rafGuard('test1');
    expect(g.start()).toBe(true);
  });

  it('start() gibt false zurueck wenn bereits aktiv', () => {
    const g = rafGuard('test2');
    g.start();
    expect(g.start()).toBe(false);
  });

  it('isActive() false vor start()', () => {
    const g = rafGuard('test3');
    expect(g.isActive()).toBe(false);
  });

  it('isActive() true nach start()', () => {
    const g = rafGuard('test4');
    g.start();
    expect(g.isActive()).toBe(true);
  });

  it('stop() setzt isActive auf false', () => {
    const g = rafGuard('test5');
    g.start();
    g.stop();
    expect(g.isActive()).toBe(false);
  });

  it('stop() ruft cancelAnimationFrame auf wenn RAF-ID gesetzt', () => {
    const g = rafGuard('test6');
    g.start();
    g.setRafId(42);
    g.stop();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(42);
  });

  it('zwei verschiedene Guards sind unabhaengig', () => {
    const a = rafGuard('guardA');
    const b = rafGuard('guardB');
    a.start();
    expect(a.isActive()).toBe(true);
    expect(b.isActive()).toBe(false);
  });
});
