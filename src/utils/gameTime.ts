/**
 * Game-Time-Provider.
 *
 * Wrapper um `Date.now()` mit injizierbarem Provider. Damit lassen sich
 * Time-abhaengige Pfade (Hydration-Decay, Stage-Trigger, Bloom-Cycle, Cooldowns)
 * deterministisch testen ohne Vitest-Fake-Timers global zu aktivieren.
 *
 * Entwurfs-Regeln:
 *  - Production-Default ist `Date.now()`. Kein Drift, kein Pause-State.
 *  - `setNowProvider(fn)` setzt einen Provider. Tests rufen das in beforeEach.
 *  - `resetNowProvider()` stellt den Default wieder her. Pflicht in afterEach.
 *  - Heilige Code-Pfade (leveling.ts, breedingV2.ts, storage.ts) duerfen erst
 *    auf gameTime.now() umgeschrieben werden wenn dieser Wrapper 100 Prozent
 *    Test-Coverage hat. Vorher additiv parallel halten.
 *
 * Nutzung:
 *   import { now } from '@/utils/gameTime';
 *   const ms = now();
 *
 *   // im Test:
 *   beforeEach(() => setNowProvider(() => 1_700_000_000_000));
 *   afterEach(() => resetNowProvider());
 */

type NowProvider = () => number;

const DEFAULT_PROVIDER: NowProvider = () => Date.now();

let currentProvider: NowProvider = DEFAULT_PROVIDER;

/**
 * Liefert den aktuellen Game-Time-Tick in Millisekunden seit Unix-Epoch.
 * Bei Default-Provider identisch mit `Date.now()`.
 */
export function now(): number {
  return currentProvider();
}

/**
 * Ueberschreibt den Time-Provider. Nur in Tests aufrufen.
 *
 * @param provider Funktion die einen Millisekunden-Wert liefert.
 * @internal
 */
export function setNowProvider(provider: NowProvider): void {
  currentProvider = provider;
}

/**
 * Stellt den Default-Provider (`Date.now()`) wieder her.
 * Pflicht-Aufruf in `afterEach`, sonst leaken Test-States.
 *
 * @internal
 */
export function resetNowProvider(): void {
  currentProvider = DEFAULT_PROVIDER;
}

/**
 * Test-Helper: friert die Zeit auf einen Wert ein. Aequivalent zu
 * `setNowProvider(() => fixedMs)`.
 *
 * @internal
 */
export function freezeTime(fixedMs: number): void {
  setNowProvider(() => fixedMs);
}

/**
 * Test-Helper: simuliert einen monotonen Counter, der bei jedem Aufruf
 * um `stepMs` weitergeht. Nuetzlich fuer Tick-basierte Tests.
 *
 * @internal
 */
export function advanceTimeFrom(startMs: number, stepMs = 1): NowProvider {
  let current = startMs;
  const provider: NowProvider = () => {
    const value = current;
    current += stepMs;
    return value;
  };
  setNowProvider(provider);
  return provider;
}
