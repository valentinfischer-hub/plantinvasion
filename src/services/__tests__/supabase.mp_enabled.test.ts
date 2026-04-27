import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tier-6 Multiplayer-Pfad-Coverage: testet den MP_ENABLED=true-Branch in supabase.ts
 * via vi.mock auf featureFlags. Build-time-baked MP_ENABLED kann nicht zur Laufzeit
 * gestubbt werden, daher mocken wir das Modul vor dem Import.
 */

describe('supabase mit MP_ENABLED=true (Tier-6 Vorbereitung)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('isSupabaseEnabled liefert true wenn MP_ENABLED + Config vorhanden', async () => {
    vi.doMock('../../utils/featureFlags', () => ({ MP_ENABLED: true, DEBUG_OVERLAY: false }));
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key');
    const mod = await import('../supabase');
    mod._resetSupabaseCacheForTest();
    expect(mod.isSupabaseEnabled()).toBe(true);
    vi.doUnmock('../../utils/featureFlags');
    vi.unstubAllEnvs();
  });

  it('isSupabaseEnabled liefert false wenn MP_ENABLED aber Config fehlt', async () => {
    vi.doMock('../../utils/featureFlags', () => ({ MP_ENABLED: true, DEBUG_OVERLAY: false }));
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    const mod = await import('../supabase');
    mod._resetSupabaseCacheForTest();
    expect(mod.isSupabaseEnabled()).toBe(false);
    vi.doUnmock('../../utils/featureFlags');
    vi.unstubAllEnvs();
  });

  it('getSupabase liefert Stub-Client wenn MP_ENABLED + Config valid', async () => {
    vi.doMock('../../utils/featureFlags', () => ({ MP_ENABLED: true, DEBUG_OVERLAY: false }));
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key');
    const mod = await import('../supabase');
    mod._resetSupabaseCacheForTest();
    const client = await mod.getSupabase();
    expect(client).toBeDefined();
    // Singleton-Cache: zweiter Call gibt selbe Instanz
    const client2 = await mod.getSupabase();
    expect(client2).toBe(client);
    vi.doUnmock('../../utils/featureFlags');
    vi.unstubAllEnvs();
  });

  it('getSupabase wirft wenn MP_ENABLED=true aber Config fehlt', async () => {
    vi.doMock('../../utils/featureFlags', () => ({ MP_ENABLED: true, DEBUG_OVERLAY: false }));
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    const mod = await import('../supabase');
    mod._resetSupabaseCacheForTest();
    await expect(mod.getSupabase()).rejects.toThrow('[supabase] Konfig fehlt');
    vi.doUnmock('../../utils/featureFlags');
    vi.unstubAllEnvs();
  });
});
