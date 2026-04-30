/**
 * Supabase-Client-Lazy-Init hinter `MP_ENABLED`-Feature-Flag.
 *
 * B7-R9: Graceful Degradation bei Supabase-Timeout:
 * - `SUPABASE_TIMEOUT_MS`: maximale Wartezeit vor Offline-Fallback
 * - `isOfflineMode()`: gibt true zurück wenn letzte Request fehlschlug
 * - `withRetry(fn, n)`: ruft fn bis zu n-mal auf mit exponential backoff
 * - `onNetworkError`: callback-hook für Retry-Toast in UI
 */

import { MP_ENABLED } from '../utils/featureFlags';

export const SUPABASE_TIMEOUT_MS = 5000;

export interface SupabaseConfig {
  readonly url: string;
  readonly anonKey: string;
}

export interface SupabaseClientLike {
  readonly __initialized: true;
  readonly config: SupabaseConfig;
}

// ---- Offline-Mode-State ----
let _offlineMode = false;
let _offlineSince: number | null = null;

/** Gibt true zurück wenn die letzte Supabase-Request fehlschlug oder timed out. */
export function isOfflineMode(): boolean {
  return _offlineMode;
}

/** Setzt Offline-Mode. Ruft alle registrierten onNetworkError-Listener auf. */
export function setOfflineMode(v: boolean, reason?: string): void {
  if (_offlineMode === v) return;
  _offlineMode = v;
  if (v) {
    _offlineSince = Date.now();
    _errorListeners.forEach(cb => cb(reason ?? 'Verbindung verloren'));
  } else {
    _offlineSince = null;
    _recoveryListeners.forEach(cb => cb());
  }
}

/** Wie lange ist Offline-Mode schon aktiv (ms). 0 wenn nicht offline. */
export function offlineDuration(): number {
  if (!_offlineMode || _offlineSince === null) return 0;
  return Date.now() - _offlineSince;
}

// ---- Event-Listener ----
type ErrorCb = (reason: string) => void;
type RecoveryCb = () => void;
const _errorListeners = new Set<ErrorCb>();
const _recoveryListeners = new Set<RecoveryCb>();

/** Registriert einen Callback der bei Netzwerkfehler aufgerufen wird (z.B. für Retry-Toast). */
export function onNetworkError(cb: ErrorCb): () => void {
  _errorListeners.add(cb);
  return () => _errorListeners.delete(cb);
}

/** Registriert einen Callback der bei Verbindungswiederherstellung aufgerufen wird. */
export function onNetworkRecovery(cb: RecoveryCb): () => void {
  _recoveryListeners.add(cb);
  return () => _recoveryListeners.delete(cb);
}

// ---- Retry-Helper ----
/**
 * Ruft eine async-Funktion bis zu maxAttempts-mal auf.
 * Exponential backoff: 500ms → 1000ms → 2000ms...
 * Setzt Offline-Mode bei dauerhaftem Fehler.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  label = 'request'
): Promise<T | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), SUPABASE_TIMEOUT_MS)
        )
      ]);
      // Erfolg: Offline-Mode zurücksetzen falls aktiv
      if (_offlineMode) setOfflineMode(false);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt < maxAttempts) {
        const backoff = 500 * Math.pow(2, attempt - 1);
        await new Promise(r => setTimeout(r, backoff));
      } else {
        setOfflineMode(true, `${label}: ${msg}`);
        return null;
      }
    }
  }
  return null;
}

// ---- Supabase-Client ----
export function isSupabaseEnabled(): boolean {
  if (!MP_ENABLED) return false;
  return readSupabaseConfig() !== null;
}

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

let cachedClient: SupabaseClientLike | null = null;

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
  cachedClient = {
    __initialized: true,
    config: cfg
  };
  return cachedClient;
}

export function _resetSupabaseCacheForTest(): void {
  cachedClient = null;
  _offlineMode = false;
  _offlineSince = null;
  _errorListeners.clear();
  _recoveryListeners.clear();
}
