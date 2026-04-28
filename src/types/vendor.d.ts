/**
 * Vendor-Typ-Deklarationen fuer Module ohne vollstaendige TS-Types.
 *
 * @sentry/browser und posthog-js haben zwar eigene Types, aber in bestimmten
 * Build-Szenarien (skipLibCheck: false) koennen sie Fehler erzeugen.
 * Diese Datei stellt globale Window-Erweiterungen sicher.
 */

import type posthog from 'posthog-js';

declare global {
  interface Window {
    /** PostHog Analytics - via main.ts initialisiert */
    __posthog?: typeof posthog;
    /** Sentry Error-Reporting - via main.ts initialisiert */
    __sentry?: {
      captureException: (error: unknown, context?: Record<string, unknown>) => void;
    };
  }
}

export {};
