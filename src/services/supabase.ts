/**
 * Supabase-Client-Lazy-Init hinter `MP_ENABLED`-Feature-Flag.
 *
 * Designziele:
 *  - Wenn `MP_ENABLED=false` (Default): kein Client wird angelegt, kein Netzwerk-Call,
 *    kein Bundle-Code aus `@supabase/supabase-js` wird importiert (Tree-Shaking).
 *  - Wenn `MP_ENABLED=true`: Lazy-Init beim ersten `getSupabase()`-Aufruf. Erfordert
 *    gesetzte `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY`. Fehlt eines davon,
 *    wirft die Funktion mit klarem Fehler.
 *
 * Hinweis: der echte Client wird per dynamischem `import('@supabase/supabase-js')`
 * geladen, damit der Bundle-Splitter den Multiplayer-Code in einen separaten Chunk
 * zieht. Dependency ist nicht in `package.json` gepinnt bis Sprint S-11 startet.
 *
 * Nutzung:
 *   import { getSupabase, isSupabaseEnabled } from '@/services/supabase';
 *   if (isSupabaseEnabled()) {
 *     const sb = await getSupabase();
 *     await sb.from('plants').insert(...);
 *   }
 */

import { MP_ENABLED } from '../utils/featureFlags';

/** Konfig die zur Build-Zeit gelesen wird. Werte sind dann statisch im Bundle. */
export interface SupabaseConfig {
  readonly url: string;
  readonly anonKey: string;
}

/**
 * Minimal-Subset der `@supabase/supabase-js`-API die wir aktuell nutzen.
 * Wird erweitert sobald Sprint S-11 die Realtime-Channels einfuehrt.
 */
export interface SupabaseClientLike {
  /** Marker damit der Test sicher gehen kann dass Lazy-Init lief. */
  readonly __initialized: true;
  /** Konfig die zur Init-Zeit verwendet wurde. */
  readonly config: SupabaseConfig;
}

/**
 * Liefert true wenn der Multiplayer-Code-Pfad aktiv ist UND beide Supabase-Keys
 * gesetzt sind. Erst dann darf `getSupabase()` aufgerufen werden.
 */
export function isSupabaseEnabled(): boolean {
  if (!MP_ENABLED) return false;
  const cfg = readSupabaseConfig();
  return cfg !== null;
}

/**
 * Liest die Supabase-Konfig aus den Vite-Env-Vars.
 * Liefert null wenn URL oder Key fehlen.
 *
 * @internal exportiert nur fuer Tests.
 */
export function readSupabaseConfig(): SupabaseConfig | null {
  const env: Record<string, unknown> =
    typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env as Record<string, unknown>)
      : {};
  const url = typeof env['VITE_SUPABASE_URL'] === 'string' ? env['VITE_SUPABASE_URL'] : '';
  const anonKey = typeof env['VITE_SUPABASE_ANON_KEY'] === 'string' ? env['VITE_SUPABASE_ANON_KEY'] : '';
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/** Singleton-Cache. `null` bis `getSupabase()` zum ersten Mal erfolgreich lief. */
let cachedClient: SupabaseClientLike | null = null;

/**
 * Lazy-Init des Supabase-Clients. Wirft wenn:
 *  - `MP_ENABLED=false` (Pfad sollte nie erreicht werden, daher Throw als Diagnose)
 *  - Keys fehlen
 *
 * Bei aktiviertem Flag wird beim ersten Aufruf der echte Client erzeugt und gecached.
 * Subsequente Aufrufe geben den Cache zurueck.
 *
 * Aktuell ist die Implementation ein Platzhalter (Stub-Client). Sprint S-11 ersetzt
 * das durch echten `createClient(url, key)` aus `@supabase/supabase-js`.
 */
export async function getSupabase(): Promise<SupabaseClientLike> {
  if (!MP_ENABLED) {
    throw new Error('[supabase] MP_ENABLED is false. getSupabase() must not be called.');
  }
  if (cachedClient) return cachedClient;

  const cfg = readSupabaseConfig();
  if (!cfg) {
    throw new Error(
      '[supabase] Konfig fehlt. Setze VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY in .env.local.'
    );
  }

  // Stub-Client. Sprint S-11 ersetzt durch:
  //   const { createClient } = await import('@supabase/supabase-js');
  //   cachedClient = createClient(cfg.url, cfg.anonKey) as unknown as SupabaseClientLike;
  cachedClient = {
    __initialized: true,
    config: cfg
  };
  return cachedClient;
}

/**
 * Test-Helper: setzt den Cache zurueck. Nur in Tests aufrufen.
 *
 * @internal
 */
export function _resetSupabaseCacheForTest(): void {
  cachedClient = null;
}
