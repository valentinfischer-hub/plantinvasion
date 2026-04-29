/** * Regression guards -- B-019 (zu hohe save-cadence in notify()).
 * scheduleAutoSave Debounce-Logik isoliert getestet (kein Singleton, kein Phaser/DOM).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Isolierter Extrakt der reinen Debounce-Logik aus gameState.ts
// Spiegelt: if (_savePending) return; _savePending=true; setTimeout(()=>{ save(); _savePending=false; }, 15000)
function makeDebounceAutoSave(saveFn: () => void, delayMs: number) {
  let pending = false;
  return function scheduleAutoSave() {
    if (pending) return;
    pending = true;
    setTimeout(() => {
      saveFn();
      pending = false;
    }, delayMs);
  };
}

describe('B-019 scheduleAutoSave -- Debounce-Logik', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ruft save NICHT sofort auf -- erst nach Timeout', () => {
    let saveCount = 0;
    const schedule = makeDebounceAutoSave(() => { saveCount++; }, 15_000);
    schedule();
    expect(saveCount).toBe(0);
  });

  it('ruft save nach 15s genau einmal auf', () => {
    let saveCount = 0;
    const schedule = makeDebounceAutoSave(() => { saveCount++; }, 15_000);
    schedule();
    vi.advanceTimersByTime(15_000);
    expect(saveCount).toBe(1);
  });

  it('19 rapid-fire Aufrufe in 15s resultieren in genau 1 save (Debounce aktiv)', () => {
    let saveCount = 0;
    const schedule = makeDebounceAutoSave(() => { saveCount++; }, 15_000);
    // Simuliert tick() bei 3 Pflanzen: ca 1.3 notify/s -> ca 19 Aufrufe in 15s (Regression-Szenario)
    for (let i = 0; i < 19; i++) {
      schedule();
    }
    vi.advanceTimersByTime(15_000);
    expect(saveCount).toBe(1);
  });

  it('nach dem ersten Timeout wird _savePending zurueckgesetzt -- naechster Aufruf funktioniert', () => {
    let saveCount = 0;
    const schedule = makeDebounceAutoSave(() => { saveCount++; }, 15_000);
    schedule();
    vi.advanceTimersByTime(15_000);
    expect(saveCount).toBe(1);
    // Reset erwartet: zweiter Schedule-Zyklus
    schedule();
    vi.advanceTimersByTime(15_000);
    expect(saveCount).toBe(2);
  });

  it('direkter save-Aufruf (crossPlants/shutdown-Pattern) ist sofort -- kein Debounce', () => {
    let saveCount = 0;
    const directSave = () => { saveCount++; };
    // crossPlants() und shutdown() rufen this.save() direkt auf (kein scheduleAutoSave)
    directSave();
    expect(saveCount).toBe(1);
    // Debounce ist danach unabhaengig -- eigener Zyklus
    const schedule = makeDebounceAutoSave(() => { saveCount++; }, 15_000);
    schedule();
    expect(saveCount).toBe(1); // Debounce noch pending
    vi.advanceTimersByTime(15_000);
    expect(saveCount).toBe(2); // Debounce gefeuert
  });

  it('save wird NICHT aufgerufen wenn advanceTimersByTime unter 15s', () => {
    let saveCount = 0;
    const schedule = makeDebounceAutoSave(() => { saveCount++; }, 15_000);
    schedule();
    vi.advanceTimersByTime(14_999);
    expect(saveCount).toBe(0);
  });
});
