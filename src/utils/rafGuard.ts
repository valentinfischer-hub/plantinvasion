/**
 * rafGuard - RAF-Guard fuer Singleton-Update-Loops.
 *
 * Verhindert doppelte requestAnimationFrame-Registrierungen,
 * z.B. wenn eine Scene mehrfach created() wird.
 *
 * Usage:
 *   const guard = rafGuard('myLoop');
 *   function myLoop() {
 *     if (!guard.isActive()) return;
 *     // ... update logic ...
 *     requestAnimationFrame(myLoop);
 *   }
 *   guard.start();
 *   requestAnimationFrame(myLoop);
 *   // Cleanup:
 *   guard.stop();
 *
 * S-POLISH Batch 5 Run 6
 */

const _active = new Map<string, boolean>();
const _rafIds = new Map<string, number>();

export function rafGuard(id: string) {
  return {
    /** Startet den Guard. Gibt false zurueck wenn bereits aktiv. */
    start(): boolean {
      if (_active.get(id)) return false;
      _active.set(id, true);
      return true;
    },

    /** Stoppt den Guard und cancelt den laufenden RAF. */
    stop(): void {
      _active.set(id, false);
      const rafId = _rafIds.get(id);
      if (rafId !== undefined) {
        cancelAnimationFrame(rafId);
        _rafIds.delete(id);
      }
    },

    /** Ist der Guard aktiv? */
    isActive(): boolean {
      return _active.get(id) === true;
    },

    /** Registriert eine RAF-ID (fuer spaeteres Cancel). */
    setRafId(rafId: number): void {
      _rafIds.set(id, rafId);
    },

    /** Gibt aktuelle RAF-ID zurueck. */
    getRafId(): number | undefined {
      return _rafIds.get(id);
    }
  };
}

/** Reset aller Guards (fuer Tests). */
export function _resetAllRafGuards(): void {
  _active.clear();
  _rafIds.clear();
}
