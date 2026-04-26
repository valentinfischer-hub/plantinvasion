/**
 * Smoke-Tests fuer Feature-Flags.
 *
 * Wir testen die "readBoolEnv"-Logik indirekt ueber die test-helper-Funktion.
 * Die Top-Level-Konstanten (MP_ENABLED, DEBUG_OVERLAY) sind zur Module-Load-Zeit
 * fixiert und koennen nicht mit vi.stubEnv im selben Test geaendert werden -
 * das ist Absicht: die Flags sollen build-time-baked sein.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFeatureFlagsForTest } from '../featureFlags';

describe('featureFlags.readFeatureFlagsForTest', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('gibt false fuer alle Flags wenn keine Env-Vars gesetzt sind', () => {
    const flags = readFeatureFlagsForTest();
    expect(flags.mpEnabled).toBe(false);
    expect(flags.debugOverlay).toBe(false);
  });

  it('akzeptiert "true" als wahr', () => {
    vi.stubEnv('VITE_MP_ENABLED', 'true');
    expect(readFeatureFlagsForTest().mpEnabled).toBe(true);
  });

  it('akzeptiert "1" als wahr', () => {
    vi.stubEnv('VITE_MP_ENABLED', '1');
    expect(readFeatureFlagsForTest().mpEnabled).toBe(true);
  });

  it('akzeptiert "yes" als wahr', () => {
    vi.stubEnv('VITE_MP_ENABLED', 'yes');
    expect(readFeatureFlagsForTest().mpEnabled).toBe(true);
  });

  it('ist case-insensitive', () => {
    vi.stubEnv('VITE_MP_ENABLED', 'TRUE');
    expect(readFeatureFlagsForTest().mpEnabled).toBe(true);
  });

  it('liest "false" als falsch', () => {
    vi.stubEnv('VITE_MP_ENABLED', 'false');
    expect(readFeatureFlagsForTest().mpEnabled).toBe(false);
  });

  it('liest unbekannte Werte als falsch', () => {
    vi.stubEnv('VITE_MP_ENABLED', 'maybe');
    expect(readFeatureFlagsForTest().mpEnabled).toBe(false);
  });

  it('trimt Whitespace', () => {
    vi.stubEnv('VITE_MP_ENABLED', '  true  ');
    expect(readFeatureFlagsForTest().mpEnabled).toBe(true);
  });

  it('liest beide Flags unabhaengig', () => {
    vi.stubEnv('VITE_MP_ENABLED', 'true');
    vi.stubEnv('VITE_DEBUG_OVERLAY', 'false');
    const flags = readFeatureFlagsForTest();
    expect(flags.mpEnabled).toBe(true);
    expect(flags.debugOverlay).toBe(false);
  });
});
