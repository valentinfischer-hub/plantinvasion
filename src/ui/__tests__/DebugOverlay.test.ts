/**
 * DebugOverlay Tests - S-POLISH Batch 5 Run 2
 *
 * Tests laufen in Node-Env (kein jsdom verfügbar).
 * DOM-Tests nur via vi.stubGlobal.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { isDebugMode, destroyDebugOverlay } from '../DebugOverlay';

// URLSearchParams stubben
vi.stubGlobal('URLSearchParams', class {
  private map: Map<string, string>;
  constructor(search: string) {
    this.map = new Map();
    search.replace(/^\?/, '').split('&').forEach(part => {
      const [k, v] = part.split('=');
      if (k) this.map.set(k, v ?? '');
    });
  }
  get(key: string): string | null { return this.map.get(key) ?? null; }
});

vi.stubGlobal('window', {
  location: { search: '', pathname: '/' },
});

// DOM stubs
vi.stubGlobal('document', {
  createElement: vi.fn(() => ({
    style: { cssText: '' },
    setAttribute: vi.fn(),
    appendChild: vi.fn(),
    remove: vi.fn(),
    innerHTML: '',
    id: '',
  })),
  body: { appendChild: vi.fn() },
  addEventListener: vi.fn(),
  getElementById: vi.fn(() => null),
});

vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
vi.stubGlobal('cancelAnimationFrame', vi.fn());
vi.stubGlobal('performance', { now: vi.fn(() => Date.now()) });
vi.stubGlobal('localStorage', {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
});

describe('isDebugMode', () => {
  afterEach(() => {
    destroyDebugOverlay();
  });

  it('false wenn window.location.search leer ist', () => {
    expect(isDebugMode()).toBe(false);
  });

  it('true wenn search "?debug=1" enthält', () => {
    (window as { location: { search: string; pathname: string } }).location.search = '?debug=1';
    expect(isDebugMode()).toBe(true);
    (window as { location: { search: string; pathname: string } }).location.search = '';
  });
});

describe('destroyDebugOverlay', () => {
  it('wirft keine Exception ohne vorheriges init', () => {
    expect(() => destroyDebugOverlay()).not.toThrow();
  });

  it('idempotent - zweimal aufrufbar', () => {
    expect(() => {
      destroyDebugOverlay();
      destroyDebugOverlay();
    }).not.toThrow();
  });
});
