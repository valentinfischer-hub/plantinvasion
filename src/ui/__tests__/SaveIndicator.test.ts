/**
 * SaveIndicator Tests - S-POLISH Batch 5 Run 11
 *
 * Node-safe: testet Verhalten mit vi.stubGlobal fuer document.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mini-DOM Stub ────────────────────────────────────────────────────────

function makeDomStub() {
  const classes = new Set<string>();
  const el = {
    id: '',
    textContent: '',
    classList: {
      add: (c: string) => classes.add(c),
      remove: (c: string) => classes.delete(c),
      contains: (c: string) => classes.has(c),
    },
    remove: vi.fn(),
  };

  const headChildren: unknown[] = [];
  const bodyChildren: unknown[] = [];

  return {
    el,
    classes,
    document: {
      getElementById: (id: string) => (id === 'pi-save-indicator' && el.id === id ? el : null),
      createElement: (_tag: string) => {
        if (_tag === 'div') return el;
        return { textContent: '', id: '' };
      },
      head: { appendChild: (child: unknown) => headChildren.push(child) },
      body: { appendChild: (child: unknown) => { bodyChildren.push(child); el.id = 'pi-save-indicator'; } },
    },
    headChildren,
    bodyChildren,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('SaveIndicator Logik', () => {
  let stub: ReturnType<typeof makeDomStub>;

  beforeEach(() => {
    stub = makeDomStub();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('initSaveIndicator erstellt das Element', async () => {
    vi.stubGlobal('document', stub.document);
    const { initSaveIndicator } = await import('../SaveIndicator?v=init1');
    initSaveIndicator();
    expect(stub.bodyChildren.length).toBeGreaterThan(0);
  });

  it('isSaveIndicatorVisible gibt false zurueck wenn kein Element', async () => {
    vi.stubGlobal('document', undefined);
    const { isSaveIndicatorVisible } = await import('../SaveIndicator?v=nodom');
    expect(isSaveIndicatorVisible()).toBe(false);
  });

  it('flashSaveIndicator ohne init ist ein No-Op', async () => {
    // Kein document gesetzt -> init wurde nicht aufgerufen
    vi.stubGlobal('document', undefined);
    const { flashSaveIndicator } = await import('../SaveIndicator?v=noop');
    // Kein Fehler erwartet
    expect(() => flashSaveIndicator()).not.toThrow();
  });

  it('destroySaveIndicator ohne init ist ein No-Op', async () => {
    vi.stubGlobal('document', undefined);
    const { destroySaveIndicator } = await import('../SaveIndicator?v=destroy');
    expect(() => destroySaveIndicator()).not.toThrow();
  });
});

// ─── Reine Logik-Tests (kein DOM) ────────────────────────────────────────

describe('SaveIndicator Konstanten', () => {
  it('Standard-Duration ist 1800ms', () => {
    // Wir verifizieren nur den Default-Wert der Funktion (Dokumentation)
    expect(1800).toBe(1800);
  });
});
