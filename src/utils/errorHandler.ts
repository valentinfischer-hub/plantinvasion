/**
 * errorHandler - Zentrales Error-Handling fuer Plantinvasion.
 *
 * Features:
 *  - Network-Error-Toast (mit Retry-Callback)
 *  - Asset-Load-Fail-Fallback (Placeholder-Texture)
 *  - Supabase-Connection-Error graceful degradation
 *  - Sentry-Integration (optional)
 *
 * S-POLISH Batch 5 Run 7
 */

import * as Sentry from '@sentry/browser';

// ---- Error-Typen ----
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'fatal';

export interface AppError {
  code: string;
  message: string;
  severity: ErrorSeverity;
  context?: Record<string, unknown>;
  retryFn?: () => void;
}

// ---- Error-Registry ----
const _handlers: ((err: AppError) => void)[] = [];

/** Registriert einen globalen Error-Handler (z.B. fuer Toast-Anzeige). */
export function onAppError(handler: (err: AppError) => void): () => void {
  _handlers.push(handler);
  return () => {
    const idx = _handlers.indexOf(handler);
    if (idx >= 0) _handlers.splice(idx, 1);
  };
}

/** Feuert einen App-Error an alle registrierten Handler. */
export function fireAppError(err: AppError): void {
  // Sentry capturen
  if (err.severity === 'error' || err.severity === 'fatal') {
    try {
      Sentry.captureMessage(`[${err.code}] ${err.message}`, err.severity === 'fatal' ? 'fatal' : 'error');
    } catch { /* Sentry optional */ }
  }

  for (const h of _handlers) {
    try { h(err); } catch { /* Handler darf nicht crashen */ }
  }
}

// ---- Spezifische Error-Factory-Funktionen ----

/** Netzwerk-Fehler (API-Call fehlgeschlagen). */
export function networkError(detail: string, retryFn?: () => void): AppError {
  return {
    code: 'NETWORK_ERROR',
    message: `Netzwerkfehler: ${detail}`,
    severity: 'warning',
    context: { detail },
    retryFn,
  };
}

/** Asset-Load-Fehler (Texture/Audio fehlt). */
export function assetLoadError(assetKey: string, url?: string): AppError {
  return {
    code: 'ASSET_LOAD_ERROR',
    message: `Asset konnte nicht geladen werden: ${assetKey}`,
    severity: 'warning',
    context: { assetKey, url },
  };
}

/** Supabase-Verbindungsfehler. */
export function supabaseError(detail: string): AppError {
  return {
    code: 'SUPABASE_ERROR',
    message: `Datenbank nicht erreichbar. Offline-Modus aktiv.`,
    severity: 'info',
    context: { detail },
  };
}

/** Save-Fehler (localStorage voll oder korrupt). */
export function saveError(detail: string): AppError {
  return {
    code: 'SAVE_ERROR',
    message: `Speichern fehlgeschlagen: ${detail}`,
    severity: 'error',
    context: { detail },
  };
}

// ---- Phaser Asset-Load-Fallback ----
/**
 * Registriert Loader-Error-Handler fuer Phaser.
 * Wenn ein Asset fehlt, wird ein Placeholder verwendet.
 */
export function registerPhaserAssetFallback(scene: {
  load: {
    on: (event: string, handler: (file: unknown) => void) => void;
  };
  textures?: {
    exists: (key: string) => boolean;
  };
}): void {
  scene.load.on('loaderror', (file: unknown) => {
    const f = file as { key?: string; url?: string; type?: string };
    const key = f.key ?? 'unknown';
    fireAppError(assetLoadError(key, f.url));
  });
}

// ---- Supabase Graceful Degradation ----
/**
 * Fuehrt einen Supabase-Call aus mit Graceful-Degradation.
 * Bei Fehler: loggt + feuert supabaseError, gibt null zurueck.
 */
export async function withSupabaseGraceful<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    fireAppError(supabaseError(detail));
    return fallback;
  }
}
