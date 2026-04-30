/**
 * Tile-Animation System [b4-run11/15]
 * Wasser-Tiles 3-Frame-Alpha-Cycle, Gras-Wehen, Portal-Aura
 * Läuft als Phaser-Scene-Plugin-Muster (update()-basiert)
 */

export const TILE_SIZE = 32;

export interface TileAnimTarget {
  type: 'water' | 'grass' | 'portal';
  x: number;      // pixel-X (Tile-Center)
  y: number;      // pixel-Y (Tile-Center)
  phase: number;  // 0..2PI, individuell verschoben für natuerliche Wellen
}

/**
 * Berechnet den alpha-Wert fuer Wasser-Tiles (3-Frame-Cycle, 60fps-freundlich)
 * Frame 0: base 0.85, Frame 1: 0.95, Frame 2: 1.0 (dann zurueck)
 */
export function calcWaterAlpha(phase: number): number {
  // Sinuswelle im Bereich 0.82..1.0
  return 0.91 + 0.09 * Math.sin(phase);
}

/**
 * Gras-Wehen: leichte seitliche Verschiebung (0..+/-1.5px)
 */
export function calcGrassOffset(phase: number): number {
  return 1.5 * Math.sin(phase * 0.7);
}

/**
 * Portal-Aura: Alpha-Puls 0.4..0.85 + Scale 0.9..1.1
 */
export function calcPortalAura(phase: number): { alpha: number; scale: number } {
  return {
    alpha: 0.625 + 0.225 * Math.sin(phase),
    scale: 1.0 + 0.1 * Math.sin(phase * 1.3),
  };
}

/**
 * Phase fuer naechsten Frame berechnen (dt in Sekunden)
 */
export function advancePhase(phase: number, dt: number, speed = 2.0): number {
  return (phase + dt * speed) % (Math.PI * 2);
}

/**
 * Seed fuer zufaelligen Startphase pro Tile (damit nicht alle synchron)
 */
export function tilePhase(tileX: number, tileY: number): number {
  return ((tileX * 7 + tileY * 13) % 628) / 100; // 0..6.28
}

/**
 * Bestimmt ob ein Tile-Code ein Wasser-Tile ist
 */
export function isWaterTileCode(tileCode: number): boolean {
  return tileCode === 3 || tileCode === 26; // water + saltwater
}

/**
 * Bestimmt ob ein Tile-Code ein Gras-Tile ist (Basis-Gras)
 */
export function isGrassTileCode(tileCode: number): boolean {
  return tileCode === 0 || tileCode === 6; // grass + tall-grass
}

/**
 * TileAnim-State fuer eine komplette Karte
 * Beinhaltet alle animierten Tiles mit ihrer aktuellen Phase
 */
export interface TileAnimState {
  waterTiles: TileAnimTarget[];
  portalTiles: TileAnimTarget[];
  grassTiles: TileAnimTarget[];
}

export function buildTileAnimState(
  tiles: number[][],
  portalPositions: Array<{ tileX: number; tileY: number }>
): TileAnimState {
  const waterTiles: TileAnimTarget[] = [];
  const grassTiles: TileAnimTarget[] = [];
  const portalTiles: TileAnimTarget[] = portalPositions.map((p) => ({
    type: 'portal' as const,
    x: p.tileX * TILE_SIZE + TILE_SIZE / 2,
    y: p.tileY * TILE_SIZE + TILE_SIZE / 2,
    phase: tilePhase(p.tileX, p.tileY),
  }));

  for (let ty = 0; ty < tiles.length; ty++) {
    for (let tx = 0; tx < tiles[ty].length; tx++) {
      const code = tiles[ty][tx];
      if (isWaterTileCode(code)) {
        waterTiles.push({
          type: 'water',
          x: tx * TILE_SIZE + TILE_SIZE / 2,
          y: ty * TILE_SIZE + TILE_SIZE / 2,
          phase: tilePhase(tx, ty),
        });
      } else if (isGrassTileCode(code)) {
        // Nur jedes 3. Gras-Tile bekommt Wehen (Performance)
        if ((tx + ty) % 3 === 0) {
          grassTiles.push({
            type: 'grass',
            x: tx * TILE_SIZE + TILE_SIZE / 2,
            y: ty * TILE_SIZE + TILE_SIZE / 2,
            phase: tilePhase(tx, ty),
          });
        }
      }
    }
  }

  return { waterTiles, portalTiles, grassTiles };
}

/** Update alle Phasen (aufrufbar in scene.update()) */
export function updateTileAnimState(state: TileAnimState, dt: number): void {
  for (const t of state.waterTiles) {
    t.phase = advancePhase(t.phase, dt, 1.8);
  }
  for (const t of state.portalTiles) {
    t.phase = advancePhase(t.phase, dt, 2.4);
  }
  for (const t of state.grassTiles) {
    t.phase = advancePhase(t.phase, dt, 0.9);
  }
}
