/**
 * NetworkErrorHandler Tests
 * B6-R4 | S-POLISH
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isOfflineMode,
  setOfflineMode,
  enqueueSyncOperation,
  getSyncQueueLength,
  clearSyncQueue,
  showNetworkErrorToast,
  hideNetworkErrorToast,
  initNetworkErrorHandler,
  destroyNetworkErrorHandler,
} from '../NetworkErrorHandler';

beforeEach(() => {
  // DOM-Mock
  vi.stubGlobal('document', {
    createElement: vi.fn(() => ({
      style: { cssText: '' },
      appendChild: vi.fn(),
      remove: vi.fn(),
      addEventListener: vi.fn(),
      textContent: '',
      id: '',
    })),
    body: { appendChild: vi.fn() },
    getElementById: vi.fn(() => null),
  });
  vi.stubGlobal('window', { addEventListener: vi.fn(), removeEventListener: vi.fn() });
  vi.stubGlobal('navigator', { onLine: true });
  clearSyncQueue();
  destroyNetworkErrorHandler();
});

afterEach(() => {
  vi.unstubAllGlobals();
  destroyNetworkErrorHandler();
  clearSyncQueue();
});

describe('isOfflineMode / setOfflineMode', () => {
  it('Standard: online', () => {
    expect(isOfflineMode()).toBe(false);
  });

  it('kann auf offline gesetzt werden', () => {
    setOfflineMode(true);
    expect(isOfflineMode()).toBe(true);
    setOfflineMode(false);
    expect(isOfflineMode()).toBe(false);
  });
});

describe('Sync-Queue', () => {
  it('fügt Operationen hinzu', () => {
    enqueueSyncOperation('test-1', async () => {});
    expect(getSyncQueueLength()).toBe(1);
  });

  it('überschreibt doppelte IDs', () => {
    const op1 = vi.fn();
    const op2 = vi.fn();
    enqueueSyncOperation('dup', op1);
    enqueueSyncOperation('dup', op2);
    expect(getSyncQueueLength()).toBe(1);
  });

  it('clearSyncQueue leert die Queue', () => {
    enqueueSyncOperation('a', async () => {});
    enqueueSyncOperation('b', async () => {});
    clearSyncQueue();
    expect(getSyncQueueLength()).toBe(0);
  });
});

describe('initNetworkErrorHandler', () => {
  it('registriert Event-Listener', () => {
    initNetworkErrorHandler();
    expect((window.addEventListener as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('online', expect.any(Function));
    expect((window.addEventListener as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('zweifaches init hat keinen Effekt', () => {
    initNetworkErrorHandler();
    initNetworkErrorHandler();
    expect((window.addEventListener as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(2);
  });
});

describe('showNetworkErrorToast / hideNetworkErrorToast', () => {
  it('erstellt Toast-Element', () => {
    showNetworkErrorToast('Test-Fehler');
    expect(document.body.appendChild).toHaveBeenCalled();
  });

  it('hideNetworkErrorToast entfernt Toast', () => {
    showNetworkErrorToast('Test');
    hideNetworkErrorToast();
    // Kein Throw = OK
  });
});
