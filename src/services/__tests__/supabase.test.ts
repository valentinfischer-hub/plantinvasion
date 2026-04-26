import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isSupabaseEnabled,
  readSupabaseConfig,
  getSupabase,
  _resetSupabaseCacheForTest
} from '../supabase';

/**
 * Tests fuer Lazy-Init des Supabase-Clients hinter dem MP_ENABLED-Flag.
 *
 * Hinweis: `MP_ENABLED` wird zur Build-Zeit aus import.meta.env gelesen.
 * In der Test-Umgebung (Vitest, Node) ist import.meta.env ein lebendiger
 * Record und kann via `vi.stubEnv` gestubbed werden, ABER `MP_ENABLED` selbst
 * wurde bereits beim Modul-Import fest-gebacken. Diese Tests fokussieren
 * daher auf das beobachtbare Verhalten BEI dem aktuellen Build-Time-Wert
 * (MP_ENABLED=false in Default-Test-Env) plus die `readSupabaseConfig`-API
 * die jederzeit dynamisch liest.
 */
describe('services/supabase', () => {
  beforeEach(() => {
    _resetSupabaseCacheForTest();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    _resetSupabaseCacheForTest();
  });

  describe('readSupabaseConfig', () => {
    it('liefert null wenn VITE_SUPABASE_URL fehlt', () => {
      vi.stubEnv('VITE_SUPABASE_URL', '');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'some-key');
      expect(readSupabaseConfig()).toBeNull();
    });

    it('liefert null wenn VITE_SUPABASE_ANON_KEY fehlt', () => {
      vi.stubEnv('VITE_SUPABASE_URL', 'https://x.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
      expect(readSupabaseConfig()).toBeNull();
    });

    it('liefert SupabaseConfig wenn beide Keys gesetzt sind', () => {
      vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'eyJhbG.fake.key');
      const cfg = readSupabaseConfig();
      expect(cfg).toEqual({
        url: 'https://example.supabase.co',
        anonKey: 'eyJhbG.fake.key'
      });
    });

    it('liefert null wenn beide Keys leer sind', () => {
      vi.stubEnv('VITE_SUPABASE_URL', '');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
      expect(readSupabaseConfig()).toBeNull();
    });
  });

  describe('isSupabaseEnabled', () => {
    it('gibt false zurueck wenn MP_ENABLED=false (Default-Test-Env)', () => {
      // MP_ENABLED ist Build-Time-baked. In der Test-Env ist VITE_MP_ENABLED nicht gesetzt
      // -> Default false -> isSupabaseEnabled() = false unabhaengig von Keys.
      vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'eyJhbG.fake.key');
      expect(isSupabaseEnabled()).toBe(false);
    });
  });

  describe('getSupabase', () => {
    it('wirft wenn MP_ENABLED=false (Sicherheits-Throw, Pfad sollte nie erreicht werden)', async () => {
      await expect(getSupabase()).rejects.toThrow(/MP_ENABLED is false/);
    });

    it('wirft Diagnose-Error mit klarem Hinweis auf .env.local', async () => {
      // Dies ist der Pfad fuer `MP_ENABLED=false` -> immer throw.
      // Validiert dass Fehlernachricht stabil bleibt fuer Doku/Logs.
      try {
        await getSupabase();
        throw new Error('expected throw');
      } catch (e) {
        expect((e as Error).message).toContain('MP_ENABLED');
        expect((e as Error).message).toContain('getSupabase()');
      }
    });
  });

  describe('Cache-Reset Helper (Test-API)', () => {
    it('_resetSupabaseCacheForTest setzt Cache zurueck ohne Side-Effects', () => {
      expect(() => _resetSupabaseCacheForTest()).not.toThrow();
      // Mehrfacher Call ist idempotent
      _resetSupabaseCacheForTest();
      _resetSupabaseCacheForTest();
    });
  });

  describe('Bundle-Sicherheit (Tree-Shaking)', () => {
    it('Modul exportiert keinen Top-Level-Side-Effect (kein Init bei Import)', () => {
      // Wenn beim Import bereits ein Supabase-Client erzeugt wuerde,
      // wuerde `_resetSupabaseCacheForTest` nichts beobachtbar zuruecksetzen.
      // Da `getSupabase()` mit MP_ENABLED=false sofort wirft, wissen wir dass
      // beim Import-Zeitpunkt KEIN Client angelegt wurde.
      _resetSupabaseCacheForTest();
      expect(isSupabaseEnabled()).toBe(false);
    });
  });
});
