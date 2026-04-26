import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  gameStore,
  GRID_CAPACITY,
  GRID_COLUMNS,
  GRID_ROWS,
  createPlantOfSpecies,
  createPlantOfSpeciesAt,
  isSlotOccupied
} from '../gameState';

/**
 * B-012 V0.2: Slot-First-UI Regression-Tests.
 *
 * Vorher (V0.1): plantSeed waehlte automatisch den ersten freien Slot. User konnte
 * nicht entscheiden wo die Pflanze landet.
 *
 * Fix V0.2: gameStore.plantSeedAt(seedSlug, gridX, gridY) erlaubt explizite Slot-Wahl.
 * UI macht Slot-First: User klickt zuerst leeren Slot, dann erscheint Seed-Picker.
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

describe('B-012 V0.2: isSlotOccupied Helper', () => {
  it('liefert true fuer den Slot der Starter-Pflanze', () => {
    const starter = gameStore.get().plants[0];
    expect(isSlotOccupied(gameStore.get().plants, starter.gridX, starter.gridY)).toBe(true);
  });

  it('liefert false fuer einen leeren Slot', () => {
    const starter = gameStore.get().plants[0];
    // Suche einen Slot der NICHT der Starter-Slot ist.
    let freeX = 0, freeY = 0;
    outer: for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLUMNS; x++) {
        if (x === starter.gridX && y === starter.gridY) continue;
        freeX = x; freeY = y;
        break outer;
      }
    }
    expect(isSlotOccupied(gameStore.get().plants, freeX, freeY)).toBe(false);
  });
});

describe('B-012 V0.2: createPlantOfSpeciesAt Helper', () => {
  it('legt Pflanze in den uebergebenen Slot', () => {
    const plants = gameStore.get().plants.slice();
    // Finde freien Slot.
    const target = { x: GRID_COLUMNS - 1, y: GRID_ROWS - 1 };
    if (isSlotOccupied(plants, target.x, target.y)) {
      target.x = 0; target.y = 0;
    }
    const plant = createPlantOfSpeciesAt('sunflower', plants, target.x, target.y);
    expect(plant).not.toBeNull();
    expect(plant!.gridX).toBe(target.x);
    expect(plant!.gridY).toBe(target.y);
  });

  it('liefert null bei besetztem Slot', () => {
    const starter = gameStore.get().plants[0];
    const plant = createPlantOfSpeciesAt('sunflower', gameStore.get().plants, starter.gridX, starter.gridY);
    expect(plant).toBeNull();
  });

  it('liefert null bei out-of-bounds-Koordinaten', () => {
    expect(createPlantOfSpeciesAt('sunflower', [], -1, 0)).toBeNull();
    expect(createPlantOfSpeciesAt('sunflower', [], 0, -1)).toBeNull();
    expect(createPlantOfSpeciesAt('sunflower', [], GRID_COLUMNS, 0)).toBeNull();
    expect(createPlantOfSpeciesAt('sunflower', [], 0, GRID_ROWS)).toBeNull();
  });

  it('liefert null bei unbekannter Spezies', () => {
    expect(createPlantOfSpeciesAt('not-a-species', [], 0, 0)).toBeNull();
  });
});

describe('B-012 V0.2: gameStore.plantSeedAt', () => {
  it('saet in expliziten Slot ein und konsumiert Seed', () => {
    gameStore.addItem('seed-sunflower', 1);
    const before = gameStore.get().plants.length;
    // Finde freien Slot.
    const occupied = new Set(gameStore.get().plants.map((p) => `${p.gridX},${p.gridY}`));
    let target = { x: 0, y: 0 };
    outer: for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLUMNS; x++) {
        if (!occupied.has(`${x},${y}`)) { target = { x, y }; break outer; }
      }
    }
    const result = gameStore.plantSeedAt('seed-sunflower', target.x, target.y);
    expect(result.ok).toBe(true);
    expect(result.plant?.gridX).toBe(target.x);
    expect(result.plant?.gridY).toBe(target.y);
    expect(gameStore.get().plants.length).toBe(before + 1);
  });

  it('liefert "Slot belegt..." wenn der Slot besetzt ist', () => {
    gameStore.addItem('seed-sunflower', 1);
    const starter = gameStore.get().plants[0];
    const result = gameStore.plantSeedAt('seed-sunflower', starter.gridX, starter.gridY);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('Slot belegt. Waehle einen leeren Slot.');
  });

  it('liefert "Slot ausserhalb des Gartens" bei out-of-bounds', () => {
    gameStore.addItem('seed-sunflower', 1);
    const result = gameStore.plantSeedAt('seed-sunflower', GRID_COLUMNS + 5, 0);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('Slot ausserhalb des Gartens');
  });

  it('liefert "Kein Seed-Item" bei nicht-Seed-Slug', () => {
    const result = gameStore.plantSeedAt('compost-tea', 0, 0);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('Kein Seed-Item');
  });

  it('liefert "Seed nicht im Inventar" wenn Seed fehlt', () => {
    // 'seed-fern' hat newGame in Inventar (1x), also vorher leeren.
    const inv = gameStore.getInventory();
    const fernCount = inv['seed-fern'] ?? 0;
    if (fernCount > 0) {
      // Konsumiere via plantSeedAt in einen freien Slot.
      const occupied = new Set(gameStore.get().plants.map((p) => `${p.gridX},${p.gridY}`));
      outer: for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLUMNS; x++) {
          if (!occupied.has(`${x},${y}`)) {
            gameStore.plantSeedAt('seed-fern', x, y);
            break outer;
          }
        }
      }
    }
    const result = gameStore.plantSeedAt('seed-fern', 0, 1);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('Seed nicht im Inventar');
  });

  it('V0.1 plantSeed (Auto-Slot-Pick) bleibt funktional - Backward-Compat', () => {
    gameStore.addItem('seed-sunflower', 1);
    const before = gameStore.get().plants.length;
    const result = gameStore.plantSeed('seed-sunflower');
    expect(result.ok).toBe(true);
    expect(gameStore.get().plants.length).toBe(before + 1);
  });
});

describe('B-012 V0.2: GRID_CAPACITY-Konsistenz', () => {
  it('GRID_CAPACITY entspricht GRID_COLUMNS * GRID_ROWS', () => {
    expect(GRID_CAPACITY).toBe(GRID_COLUMNS * GRID_ROWS);
  });

  it('createPlantOfSpecies fuellt bis GRID_CAPACITY und liefert dann null', () => {
    while (gameStore.get().plants.length < GRID_CAPACITY) {
      const plant = createPlantOfSpecies('sunflower', gameStore.get().plants);
      if (!plant) break;
      gameStore.get().plants.push(plant);
    }
    expect(gameStore.get().plants.length).toBe(GRID_CAPACITY);
    expect(createPlantOfSpecies('sunflower', gameStore.get().plants)).toBeNull();
  });
});
