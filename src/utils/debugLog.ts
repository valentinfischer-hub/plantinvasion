import { DEBUG_OVERLAY } from './featureFlags';

/**
 * Tier-2 Console-Zero-Tolerance Helper.
 *
 * Game-Code soll im Production-Build keine `console.log`-Statements mehr enthalten.
 * Statt direkt auf `console` zu schreiben, ruft jeder Hot-Path-Logger diesen Wrapper.
 * Output erfolgt nur wenn DEBUG_OVERLAY aktiv ist (Vite-Env VITE_DEBUG_OVERLAY=true).
 *
 * `console.warn` und `console.error` bleiben weiterhin direkt erlaubt: das sind
 * Pflicht-Channels fuer Migrations-Failures, Quota-Exceeded, Asset-Load-Errors.
 *
 * Beispiel:
 *   import { debugLog } from '@/utils/debugLog';
 *   debugLog('[OverworldScene] zone change', oldZone, '->', newZone);
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debugLog(...args: any[]): void {
  if (!DEBUG_OVERLAY) return;
  // eslint-disable-next-line no-console
  console.log(...args);
}
