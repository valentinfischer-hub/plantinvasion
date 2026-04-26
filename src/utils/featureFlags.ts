/**
 * Feature-Flags fuer Plantinvasion.
 *
 * Quelle: Vite-Env-Vars (`import.meta.env`). Werte werden zur Build-Zeit eingeschnitzt
 * und sind danach im produzierten Bundle string-baked, also weder zur Laufzeit
 * veraenderbar noch in localStorage gespiegelt. Das ist Absicht: Flags wie
 * MP_ENABLED steuern Code-Pfade die wir explizit gegen Server-State validieren
 * muessen, sie sollen nicht durch DevTools manipulierbar sein.
 *
 * Konvention:
 *  - Alle Flags `MP_*` betreffen Multiplayer und sind Default false.
 *  - Alle Flags `DEBUG_*` betreffen Dev-Tools und sind Default false.
 *  - Truthy-Werte: 'true', '1', 'yes' (case-insensitive). Alles andere ist false.
 *
 * Nutzung:
 *   import { MP_ENABLED } from '@/utils/featureFlags';
 *   if (MP_ENABLED) { initSupabase(); }
 *
 * .env.example dokumentiert alle unterstuetzten Flags.
 */

function readBoolEnv(key: string, fallback = false): boolean {
  // import.meta.env wird von Vite zur Build-Zeit ersetzt. In Vitest/Node-Env
  // existiert es zwar, kann aber undefined enthalten -> Fallback.
  // Wir lesen ueber `Record<string, unknown>` weil Vite die Typen pro Projekt generiert.
  const env: Record<string, unknown> =
    typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env as Record<string, unknown>)
      : {};
  const raw = env[key];
  if (raw === undefined || raw === null) return fallback;
  const str = String(raw).trim().toLowerCase();
  return str === 'true' || str === '1' || str === 'yes';
}

/**
 * Multiplayer-Master-Flag. Ist false -> kein Supabase-Init, keine Realtime-Kanaele,
 * keine Trade-UI. Wird ab Sprint S-11 produktiv.
 */
export const MP_ENABLED: boolean = readBoolEnv('VITE_MP_ENABLED', false);

/**
 * Debug-Overlay (FPS-Counter, Hitboxes, RNG-Trace). Default false.
 */
export const DEBUG_OVERLAY: boolean = readBoolEnv('VITE_DEBUG_OVERLAY', false);

/**
 * Test-Helper: erlaubt Override per Vitest. NICHT im Production-Code aufrufen.
 * Liefert eine frische Lesung der Env-Vars, hilfreich fuer Tests die mit
 * vi.stubEnv arbeiten.
 *
 * @internal
 */
export function readFeatureFlagsForTest(): { mpEnabled: boolean; debugOverlay: boolean } {
  return {
    mpEnabled: readBoolEnv('VITE_MP_ENABLED', false),
    debugOverlay: readBoolEnv('VITE_DEBUG_OVERLAY', false)
  };
}
