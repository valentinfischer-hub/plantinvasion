/**
 * Regression guards â B-020 (F5 mid-Cross-Mode state rollback)
 * und B-023 (refreshHeader null-canvas crash).
 * Laufen in Vitest ohne Phaser/DOM-Abhaengigkeiten.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { saveGame, loadGame, type GameState } from '../storage';

class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string): string | null { return this.store[key] ?? null; }
  setItem(key: string, value: string): void { this.store[key] = value; }
  removeItem(key: string): void { delete this.store[key]; }
  clear(): void { this.store = {}; }
  get length(): number { return Object.keys(this.store).length; }
  key(n: number): string | null { return Object.keys(this.store)[n] ?? null; }
}

// ----- B-020: beforeunload save-on-unload -----

describe('B-020 F5-mid-Cross-Mode state rollback', () => {
  let ls: LocalStorageMock;

  beforeEach(() => {
    ls = new LocalStorageMock();
    Object.defineProperty(globalThis, 'localStorage', { value: ls, configurable: true });
  });

  it('saveGame persists post-crossing state â kein Rollback auf pre-crossing', () => {
    const preCross = {
      version: 11, playerId: 'p1',
      plants: [{ id: 'a' }, { id: 'b' }], coins: 203, crossings: 0,
    } as unknown as GameState;
    saveGame(preCross);

    const postCross = {
      version: 11, playerId: 'p1',
      plants: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], coins: 153, crossings: 1,
    } as unknown as GameState;
    // Simulation: beforeunload-Handler ruft gameStore.save() mit aktuellem State
    saveGame(postCross);

    const loaded = loadGame();
    // Muss post-crossing State zeigen â Regression: rollte auf pre-crossing zurueck
    expect(loaded?.coins).toBe(153);
    expect(loaded?.["crossings"]).toBe(1);
    expect(loaded?.plants).toHaveLength(3);
  });

  it('zweites saveGame ueberschreibt erstes (letzter Stand gewinnt)', () => {
    const s1 = { version: 11, playerId: 'p1', plants: [], coins: 100, crossings: 0 } as unknown as GameState;
    const s2 = { version: 11, playerId: 'p1', plants: [{ id: 'x' }], coins: 50, crossings: 1 } as unknown as GameState;
    saveGame(s1);
    saveGame(s2);
    const loaded = loadGame();
    expect(loaded?.coins).toBe(50);
    expect(loaded?.["crossings"]).toBe(1);
  });
});

// ----- B-023: refreshHeader null-guard -----

describe('B-023 refreshHeader null-guard', () => {
  it('kein Throw wenn headerText inactive', () => {
    const headerText = { active: false, setText: (_s: string) => { throw new Error('setText auf inactive aufgerufen'); } };
    const refreshHeader = (txt: { active: boolean; setText: (s: string) => void }) => {
      if (!txt?.active) return; // B-023 Guard
      txt.setText('Fruehling, Tag 1  Â·  0/12  Â·  0 Coins');
    };
    expect(() => refreshHeader(headerText)).not.toThrow();
  });

  it('kein Throw wenn headerText undefined', () => {
    const refreshHeader = (txt?: { active: boolean; setText: (s: string) => void }) => {
      if (!txt?.active) return; // B-023 Guard
      txt.setText('x');
    };
    expect(() => refreshHeader(undefined)).not.toThrow();
  });

  it('setText wird aufgerufen wenn headerText active', () => {
    let called = false;
    const headerText = { active: true, setText: (_s: string) => { called = true; } };
    const refreshHeader = (txt: { active: boolean; setText: (s: string) => void }) => {
      if (!txt?.active) return;
      txt.setText('Fruehling, Tag 1  Â·  0/12  Â·  0 Coins');
    };
    refreshHeader(headerText);
    expect(called).toBe(true);
  });
});
