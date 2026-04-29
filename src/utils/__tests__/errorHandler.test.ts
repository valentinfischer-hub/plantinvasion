/**
 * errorHandler Tests - S-POLISH Batch 5 Run 7
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Sentry
vi.mock('@sentry/browser', () => ({
  captureMessage: vi.fn(),
}));

import {
  onAppError, fireAppError,
  networkError, assetLoadError, supabaseError, saveError,
  withSupabaseGraceful
} from '../errorHandler';

describe('errorHandler Factory-Funktionen', () => {
  it('networkError hat korrekten Code', () => {
    const err = networkError('Timeout');
    expect(err.code).toBe('NETWORK_ERROR');
    expect(err.severity).toBe('warning');
    expect(err.message).toContain('Timeout');
  });

  it('networkError mit retryFn', () => {
    const retry = vi.fn();
    const err = networkError('Fail', retry);
    expect(err.retryFn).toBe(retry);
  });

  it('assetLoadError hat assetKey im Context', () => {
    const err = assetLoadError('player-sprite', '/assets/player.png');
    expect(err.code).toBe('ASSET_LOAD_ERROR');
    expect(err.context?.assetKey).toBe('player-sprite');
  });

  it('supabaseError ist info-level', () => {
    const err = supabaseError('ECONNREFUSED');
    expect(err.severity).toBe('info');
    expect(err.code).toBe('SUPABASE_ERROR');
  });

  it('saveError ist error-level', () => {
    const err = saveError('QuotaExceeded');
    expect(err.severity).toBe('error');
    expect(err.code).toBe('SAVE_ERROR');
  });
});

describe('onAppError + fireAppError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registrierter Handler wird aufgerufen', () => {
    const handler = vi.fn();
    const unsubscribe = onAppError(handler);
    fireAppError(networkError('Test'));
    expect(handler).toHaveBeenCalledOnce();
    unsubscribe();
  });

  it('unsubscribe entfernt den Handler', () => {
    const handler = vi.fn();
    const unsubscribe = onAppError(handler);
    unsubscribe();
    fireAppError(networkError('Test'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('mehrere Handler werden alle aufgerufen', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    const u1 = onAppError(h1);
    const u2 = onAppError(h2);
    fireAppError(assetLoadError('x'));
    expect(h1).toHaveBeenCalledOnce();
    expect(h2).toHaveBeenCalledOnce();
    u1(); u2();
  });
});

describe('withSupabaseGraceful', () => {
  it('gibt Ergebnis zurueck bei Erfolg', async () => {
    const result = await withSupabaseGraceful(() => Promise.resolve(42), 0);
    expect(result).toBe(42);
  });

  it('gibt Fallback zurueck bei Fehler', async () => {
    const result = await withSupabaseGraceful(
      () => Promise.reject(new Error('Connection failed')),
      'fallback'
    );
    expect(result).toBe('fallback');
  });

  it('feuert supabaseError bei Fehler', async () => {
    const handler = vi.fn();
    const unsubscribe = onAppError(handler);
    await withSupabaseGraceful(
      () => Promise.reject(new Error('ECONNREFUSED')),
      null
    );
    expect(handler).toHaveBeenCalled();
    expect(handler.mock.calls[0]?.[0]?.code).toBe('SUPABASE_ERROR');
    unsubscribe();
  });
});
