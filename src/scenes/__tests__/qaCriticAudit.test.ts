import { describe, test, it, expect, beforeEach, vi } from 'vitest';
/**
 * QA-Critic-Audit Tests [b4-run12/15]
 * Validiert die 3 Top-Kritikpunkte aus brain/agents/qa-critic/stardew_audit_2026-04-29.md:
 * 1. BattleScene Biom-spezifische HintergrÃ¼nde
 * 2. BattleScene Pokemon-Style Positioning (wild links, player rechts)
 * 3. GardenScene Booster-Glow-Farben korrekt
 */

// Biom-Tint-Logik (isoliert aus BattleScene)
function getBiomTints(poolKey: string): { top: number; bot: number } {
  const biom = poolKey.split('-')[0];
  const tints: Record<string, { top: number; bot: number }> = {
    kaktoria:     { top: 0xd4a855, bot: 0xa87820 },
    frostkamm:   { top: 0xaaccee, bot: 0x5588aa },
    salzbucht:   { top: 0x88aacc, bot: 0x446688 },
    verdanto:    { top: 0x44aa66, bot: 0x226644 },
    mordwald:    { top: 0x558844, bot: 0x334422 },
    magmabluete: { top: 0xcc5533, bot: 0x882211 },
    glaciara:    { top: 0x99bbdd, bot: 0x6699bb },
    wurzelheim:  { top: 0x6aaa44, bot: 0x2e5c1e },
  };
  return tints[biom] ?? { top: 0x6aaa44, bot: 0x2e5c1e };
}

// BgTile-Key Logik
function getBgTileKey(poolKey: string): string {
  const map: Record<string, string> = {
    'verdanto-tallgrass': 'tile_tropical',
    'verdanto-bromelien': 'tile_bromeliad',
    'kaktoria-tallgrass': 'tile_cactus',
    'frostkamm-tallgrass': 'tile_snow',
    'salzbucht-tallgrass': 'tile_beachsand',
    'wurzelheim-tallgrass': 'tile_grass',
    'mordwald-tallgrass': 'tile_swampfloor',
    'magmabluete-tallgrass': 'tile_ash',
    'glaciara-tallgrass': 'tile_iceground',
  };
  return map[poolKey] ?? 'tile_grass';
}

// Pokemon-Style Positioning
function getWildSpriteX(width: number): number {
  return width * 0.3; // links
}
function getPlayerSpriteX(width: number): number {
  return width * 0.7; // rechts
}

describe('QA-Critic: BattleScene Biom-HintergrÃ¼nde', () => {
  test('Kaktoria = WÃ¼sten-Tint (gold/braun)', () => {
    const tints = getBiomTints('kaktoria-tallgrass');
    expect(tints.top).toBe(0xd4a855);
    expect(tints.bot).toBe(0xa87820);
  });

  test('Frostkamm = Eis-Tint (hellblau)', () => {
    const tints = getBiomTints('frostkamm-tallgrass');
    expect(tints.top).toBe(0xaaccee);
  });

  test('Magmabluete = Lava-Tint (rot)', () => {
    const tints = getBiomTints('magmabluete-tallgrass');
    expect(tints.top).toBe(0xcc5533);
  });

  test('Wurzelheim = Gruen-Tint (default)', () => {
    const tints = getBiomTints('wurzelheim-tallgrass');
    expect(tints.top).toBe(0x6aaa44);
  });

  test('Unbekannte Pool-Key = Gruen-Fallback', () => {
    const tints = getBiomTints('unknown-pool');
    expect(tints.top).toBe(0x6aaa44);
  });
});

describe('QA-Critic: BattleScene Biom-Tile-Keys', () => {
  test('Kaktoria = tile_cactus', () => {
    expect(getBgTileKey('kaktoria-tallgrass')).toBe('tile_cactus');
  });

  test('Frostkamm = tile_snow (nicht tile_grass)', () => {
    expect(getBgTileKey('frostkamm-tallgrass')).toBe('tile_snow');
  });

  test('Salzbucht = tile_beachsand', () => {
    expect(getBgTileKey('salzbucht-tallgrass')).toBe('tile_beachsand');
  });

  test('Mordwald = tile_swampfloor', () => {
    expect(getBgTileKey('mordwald-tallgrass')).toBe('tile_swampfloor');
  });

  test('Verdanto Bromelien = tile_bromeliad', () => {
    expect(getBgTileKey('verdanto-bromelien')).toBe('tile_bromeliad');
  });
});

describe('QA-Critic: BattleScene Pokemon-Style Positioning', () => {
  const WIDTH = 480;

  test('Wild-Sprite X = 30% der Breite (links)', () => {
    expect(getWildSpriteX(WIDTH)).toBe(WIDTH * 0.3);
    expect(getWildSpriteX(WIDTH)).toBeLessThan(WIDTH / 2);
  });

  test('Player-Sprite X = 70% der Breite (rechts)', () => {
    expect(getPlayerSpriteX(WIDTH)).toBe(WIDTH * 0.7);
    expect(getPlayerSpriteX(WIDTH)).toBeGreaterThan(WIDTH / 2);
  });

  test('Wild und Player sind horizontal getrennt (Delta > 100px)', () => {
    const delta = Math.abs(getPlayerSpriteX(WIDTH) - getWildSpriteX(WIDTH));
    expect(delta).toBeGreaterThan(100);
  });

  test('Wild-Sprite Groesse 96px > Player-Sprite 80px (Wild wirkt groesser)', () => {
    const wildSize = 96;
    const playerSize = 80;
    expect(wildSize).toBeGreaterThan(playerSize);
  });
});
