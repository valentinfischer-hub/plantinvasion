import { FALLBACK_TILE_KEYS } from './biomeFallbackTiles';

/**
 * Mapping von Tile-Index zu Sprite-Texture-Key fuer das Stardew-Style-Tileset.
 * Die echten 32x32 PNGs liegen unter public/assets/generated/.
 *
 * Phaser laedt sie in MenuScene, OverworldScene rendert Image-Sprites
 * mit setDisplaySize(TILE_SIZE) damit unser 16-Tile-Logic-System unveraendert bleibt.
 */

export const TILE_SPRITE_KEYS: Record<number, string> = {
  0: 'tile_grass',
  1: 'tile_path',
  2: 'tile_tallgrass',
  3: 'tile_water',
  4: 'tile_tree',
  5: 'tile_wall',
  6: 'tile_roof',
  7: 'tile_gardendoor',
  8: 'tile_door',
  9: 'tile_market',
  10: 'tile_sign',
  11: 'tile_mapedge',
  12: 'tile_flowerbed',
  // Verdanto
  13: 'tile_bromeliad',
  14: 'tile_vines',
  15: 'tile_tropical',
  // Kaktoria
  16: 'tile_sand',
  17: 'tile_sandstone',
  18: 'tile_cactus',
  19: 'tile_desertflower',
  // Frostkamm
  20: 'tile_stone',
  21: 'tile_snow',
  22: 'tile_ice',
  23: 'tile_pine',
  24: 'tile_crystal',
  // Salzbucht
  25: 'tile_beachsand',
  26: 'tile_saltwater',
  27: 'tile_seashell',
  28: 'tile_driftwood',
  // Mordwald (Biom 6)
  30: 'tile_swampfloor',
  31: 'tile_swampwater',
  32: 'tile_swampoak',
  33: 'tile_spanishmoss',
  34: 'tile_carnivoregrass',
  // Magmabluete (Biom 7)
  40: 'tile_ash',
  41: 'tile_lava',
  42: 'tile_basalt',
  43: 'tile_charredstump',
  44: 'tile_pyrophytgrass',
  45: 'tile_sulfurspring',
  // Forage-Tiles (V0.2 Foraging)
  50: 'tile_berrybush',
  51: 'tile_wildplant',
  // Glaciara (Biom 8)
  60: 'tile_iceground',
  61: 'tile_icecrack',
  62: 'tile_icecrystal',
  63: 'tile_glaciaragrass',
  64: 'tile_mythicalgate'
};

export const PLAYER_SPRITE_KEYS = {
  down: 'player_down',
  up: 'player_up',
  left: 'player_left',
  right: 'player_right'
};

export const NPC_SPRITE_KEYS: Record<string, string> = {
  anya: 'npc_anya',
  bjoern: 'npc_bjoern',
  clara: 'npc_clara',
  lyra: 'npc_lyra',
  'durst-kaktus-meister': 'npc_durst',
  'eira-bergfuehrerin': 'npc_eira',
  'finn-fischer': 'npc_finn',
  'iris-salbeyen': 'npc_clara',
  'tilda-grandma': 'npc_clara',
  'morag-sumpfklang': 'npc_lyra',
  'pyra-glutblute': 'npc_durst'
};

export function getAllSpriteFiles(): { key: string; file: string }[] {
  const result: { key: string; file: string }[] = [];
  for (const k of Object.values(TILE_SPRITE_KEYS)) {
    if (FALLBACK_TILE_KEYS.includes(k)) continue; // procedural-only, no PNG
    result.push({ key: k, file: `assets/generated/${k}.png` });
  }
  for (const k of Object.values(PLAYER_SPRITE_KEYS)) {
    result.push({ key: k, file: `assets/generated/${k}.png` });
  }
  for (const k of Object.values(NPC_SPRITE_KEYS)) {
    result.push({ key: k, file: `assets/generated/${k}.png` });
  }
  return result;
}
