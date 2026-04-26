/// <reference types="vite/client" />

/**
 * Typed Vite-Env-Vars fuer Plantinvasion. Alle Vars muessen mit `VITE_` praefixed
 * sein, sonst werden sie nicht in den Client-Bundle eingeschnitzt.
 */
interface ImportMetaEnv {
  /** Multiplayer-Master-Flag. 'true' aktiviert Supabase-Init und Realtime. */
  readonly VITE_MP_ENABLED?: string;
  /** Debug-Overlay (FPS, Hitboxes, RNG-Trace). */
  readonly VITE_DEBUG_OVERLAY?: string;
  /** Supabase-Project-URL. Nur lesend wenn VITE_MP_ENABLED=true. */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase-Anon-Key. Nur lesend wenn VITE_MP_ENABLED=true. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
