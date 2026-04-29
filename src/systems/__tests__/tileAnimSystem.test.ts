/**
 * Tile-Animation System Tests [b4-run11/15]
 */
import {
  calcWaterAlpha,
  calcGrassOffset,
  calcPortalAura,
  advancePhase,
  tilePhase,
  isWaterTileCode,
  isGrassTileCode,
  buildTileAnimState,
  updateTileAnimState,
} from '../tileAnimSystem';

describe('TileAnimSystem: calcWaterAlpha', () => {
  test('Alpha bleibt im Bereich 0.82..1.0', () => {
    for (let i = 0; i < 100; i++) {
      const phase = (i / 100) * Math.PI * 2;
      const alpha = calcWaterAlpha(phase);
      expect(alpha).toBeGreaterThanOrEqual(0.82);
      expect(alpha).toBeLessThanOrEqual(1.01); // float-Toleranz
    }
  });

  test('Verschiedene Phasen liefern unterschiedliche Alphas', () => {
    const a1 = calcWaterAlpha(0);
    const a2 = calcWaterAlpha(Math.PI / 2);
    expect(a1).not.toBeCloseTo(a2, 2);
  });
});

describe('TileAnimSystem: calcGrassOffset', () => {
  test('Offset im Bereich -1.5 bis +1.5', () => {
    for (let i = 0; i < 50; i++) {
      const phase = (i / 50) * Math.PI * 2;
      const offset = calcGrassOffset(phase);
      expect(offset).toBeGreaterThanOrEqual(-1.51);
      expect(offset).toBeLessThanOrEqual(1.51);
    }
  });
});

describe('TileAnimSystem: calcPortalAura', () => {
  test('Alpha im Bereich 0.4..0.85', () => {
    for (let i = 0; i < 50; i++) {
      const phase = (i / 50) * Math.PI * 2;
      const { alpha } = calcPortalAura(phase);
      expect(alpha).toBeGreaterThanOrEqual(0.39);
      expect(alpha).toBeLessThanOrEqual(0.86);
    }
  });

  test('Scale im Bereich 0.9..1.1', () => {
    for (let i = 0; i < 50; i++) {
      const phase = (i / 50) * Math.PI * 2;
      const { scale } = calcPortalAura(phase);
      expect(scale).toBeGreaterThanOrEqual(0.89);
      expect(scale).toBeLessThanOrEqual(1.11);
    }
  });
});

describe('TileAnimSystem: advancePhase', () => {
  test('Phase bewegt sich vorwaerts', () => {
    const phase = advancePhase(0, 0.016, 2.0); // 1 Frame bei 60fps
    expect(phase).toBeGreaterThan(0);
  });

  test('Phase wraps bei 2*PI', () => {
    const phase = advancePhase(6.0, 0.5, 2.0); // ueberschreitet 2*PI
    expect(phase).toBeLessThan(Math.PI * 2);
  });
});

describe('TileAnimSystem: tilePhase', () => {
  test('Unterschiedliche Tiles haben unterschiedliche Phasen', () => {
    const p1 = tilePhase(0, 0);
    const p2 = tilePhase(1, 0);
    const p3 = tilePhase(0, 1);
    expect(p1).not.toBe(p2);
    expect(p1).not.toBe(p3);
  });

  test('Phase ist deterministisch', () => {
    expect(tilePhase(5, 7)).toBe(tilePhase(5, 7));
  });

  test('Phase im Bereich 0..2PI', () => {
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        const p = tilePhase(x, y);
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(Math.PI * 2 + 0.01);
      }
    }
  });
});

describe('TileAnimSystem: Tile-Code-Checks', () => {
  test('Wasser-Codes korrekt', () => {
    expect(isWaterTileCode(3)).toBe(true);
    expect(isWaterTileCode(26)).toBe(true);
    expect(isWaterTileCode(0)).toBe(false);
    expect(isWaterTileCode(1)).toBe(false);
  });

  test('Gras-Codes korrekt', () => {
    expect(isGrassTileCode(0)).toBe(true);
    expect(isGrassTileCode(6)).toBe(true);
    expect(isGrassTileCode(3)).toBe(false);
  });
});

describe('TileAnimSystem: buildTileAnimState', () => {
  const testTiles = [
    [0, 3, 0],
    [3, 0, 3],
    [0, 3, 0],
  ];

  test('Wasser-Tiles werden erkannt', () => {
    const state = buildTileAnimState(testTiles, []);
    expect(state.waterTiles.length).toBe(4); // 4 Wasser-Tiles im 3x3
  });

  test('Portal-Positionen werden hinzugefuegt', () => {
    const state = buildTileAnimState(testTiles, [{ tileX: 1, tileY: 1 }]);
    expect(state.portalTiles.length).toBe(1);
  });

  test('updateTileAnimState aendert alle Phasen', () => {
    const state = buildTileAnimState(testTiles, [{ tileX: 0, tileY: 0 }]);
    const phaseBefore = state.waterTiles[0].phase;
    updateTileAnimState(state, 0.1);
    expect(state.waterTiles[0].phase).not.toBe(phaseBefore);
  });
});
