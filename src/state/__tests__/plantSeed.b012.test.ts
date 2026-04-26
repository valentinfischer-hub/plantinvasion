import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { gameStore, GRID_CAPACITY, createPlantOfSpecies } from '../gameState';

/**
 * B-012 Regression-Test: Saeen-Modal-Fix.
 *
 * Vorher: plantSeed lieferte bei vollem Garten den vermischten Reason
 * "Kein freier Slot oder unbekannte Spezies". User wusste nicht warum es nicht klappt.
 *
 * Fix: getFreeSlotCount()-Helper + separater Reason "Garten voll. Ernte oder verschiebe Pflanzen."
 * UI macht zusaetzlich Vorab-Check und oeffnet Modal gar nicht erst bei 0 freien Slots.
 */

class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string): string | null { return this.store[key] ?? null; }
  setItem(key: string, value: string): void { this.store[key] = value; }
  removeItem(key: string): void { delete this.store[key]; }
  clear(): void { this.store = {}; }
  get length(): number { return Object.keys(this.store).length; }
  key(idx: number): string | null { return Object.keys(this.store)[idx] ?? null; }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', new LocalStorageMock());
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  gameStore.resetToNewGame();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('B-012: getFreeSlotCount Helper', () => {
  it('liefert GRID_CAPACITY bei leerem Garten minus Starter-Pflanze', () => {
    // newGame() erstellt eine Starter-Pflanze (sunflower).
    expect(gameStore.getFreeSlotCount()).toBe(GRID_CAPACITY - 1);
  });

  it('liefert 0 wenn alle Slots belegt sind', () => {
    // Fuelle bis zur Kapazitaet.
    while (gameStore.getFreeSlotCount() > 0) {
      const plant = createPlantOfSpecies('sunflower', gameStore.get().plants);
      if (!plant) break;
      gameStore.get().plants.push(plant);
    }
    expect(gameStore.getFreeSlotCount()).toBe(0);
  });
});

describe('B-012: plantSeed Reason ist jetzt eindeutig', () => {
  it('liefert "Garten voll. Ernte oder verschiebe Pflanzen." wenn alle Slots belegt sind', () => {
    // Inventar mit Seed bestuecken.
    gameStore.addItem('seed-sunflower', 1);

    // Garten fuellen.
    while (gameStore.getFreeSlotCount() > 0) {
      const plant = createPlantOfSpecies('sunflower', gameStore.get().plants);
      if (!plant) break;
      gameStore.get().plants.push(plant);
    }
    expect(gameStore.getFreeSlotCount()).toBe(0);

    const result = gameStore.plantSeed('seed-sunflower');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('Garten voll. Ernte oder verschiebe Pflanzen.');
  });

  it('liefert "Seed nicht im Inventar" wenn Seed fehlt (kein Garten-voll-Stub-Reason)', () => {
    // Frischer Garten, aber kein Seed im Inventar.
    const result = gameStore.plantSeed('seed-fern');
    // newGame inventar enthaelt seed-fern: 1, also vorher konsumieren.
    if (result.ok) {
      const second = gameStore.plantSeed('seed-fern');
      expect(second.ok).toBe(false);
      expect(second.reason).toBe('Seed nicht im Inventar');
    } else {
      expect(result.reason).toBe('Seed nicht im Inventar');
    }
  });

  it('liefert "Kein Seed-Item" bei nicht-Seed-Slug', () => {
    const result = gameStore.plantSeed('compost-tea');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('Kein Seed-Item');
  });

  it('plantSeed erfolgreich bei freiem Slot und vorhandenem Seed', () => {
    gameStore.addItem('seed-sunflower', 1);
    const before = gameStore.get().plants.length;
    const result = gameStore.plantSeed('seed-sunflower');
    expect(result.ok).toBe(true);
    expect(result.plant).toBeDefined();
    expect(gameStore.get().plants.length).toBe(before + 1);
  });
});
