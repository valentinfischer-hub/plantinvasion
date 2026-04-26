// Glaciara Map - Endgame-Eisbiom, achtes Biom
// Tile-Indices wie wurzelheim plus:
// 60 = Eis-Boden (begehbar, leicht slippery)
// 61 = Tiefer Eisriss (collide)
// 62 = Eiskristall (collide)
// 63 = Glaciara-Hochgras (Encounter, begehbar)
// 64 = Mythical-Tor (Deko, hint zu Eden Lost)

import {
  WURZELHEIM_WIDTH_TILES,
  WURZELHEIM_HEIGHT_TILES
} from '../../utils/constants';
import type { MapDef, NPCSpawn } from './wurzelheim';

const W = WURZELHEIM_WIDTH_TILES;
const H = WURZELHEIM_HEIGHT_TILES;

function genTiles(): number[][] {
  const t: number[][] = [];
  for (let y = 0; y < H; y++) {
    const row: number[] = [];
    for (let x = 0; x < W; x++) {
      row.push(60); // Eis-Boden default
    }
    t.push(row);
  }
  return t;
}

const tiles = genTiles();

// Map-Border mit Eisrissen
for (let x = 0; x < W; x++) {
  tiles[0][x] = 61;
  tiles[H - 1][x] = 61;
}
for (let y = 0; y < H; y++) {
  tiles[y][0] = 61;
  tiles[y][W - 1] = 61;
}

// Map-Edge-Sueden: zurueck zu Frostkamm
tiles[H - 1][14] = 11;
tiles[H - 1][15] = 11;

// Hauptpfad nord-sued (gerader Eis-Pfad)
for (let y = 1; y <= H - 2; y++) {
  if (tiles[y][14] !== 61) tiles[y][14] = 1;
  if (tiles[y][15] !== 61) tiles[y][15] = 1;
}

// Eiskristalle verteilt
const kristalle: Array<[number, number]> = [
  [4, 3], [9, 4], [22, 3], [25, 5],
  [3, 11], [11, 13], [20, 12], [25, 14]
];
for (const [x, y] of kristalle) tiles[y][x] = 62;

// Tiefe Eisrisse (collide)
const risse: Array<[number, number]> = [
  [6, 6], [7, 6], [21, 9], [22, 9], [10, 14]
];
for (const [x, y] of risse) tiles[y][x] = 61;

// Glaciara-Hochgras Cluster (Encounter, hohe Wild-Levels)
for (let y = 5; y <= 8; y++) {
  for (let x = 4; x <= 9; x++) {
    if (tiles[y][x] === 60) tiles[y][x] = 63;
  }
}
for (let y = 11; y <= 14; y++) {
  for (let x = 18; x <= 23; x++) {
    if (tiles[y][x] === 60) tiles[y][x] = 63;
  }
}

// Forage-Tiles V0.2 (Berry-Bush 50, Wildplant 51)
if (tiles[3]?.[5] !== undefined) tiles[3][5] = 50;
if (tiles[5]?.[24] !== undefined) tiles[5][24] = 51;
if (tiles[15]?.[3] !== undefined) tiles[15][3] = 51;
if (tiles[15]?.[23] !== undefined) tiles[15][23] = 50;

// Mythical-Tor in der Mitte (hint zu Eden Lost in V1.0)
tiles[5][14] = 64;

const glaciaraNpcs: NPCSpawn[] = [
  {
    id: 'glaziella-eishueterin',
    name: 'Glaziella (Eishueterin)',
    tileX: 14,
    tileY: 9,
    facing: 'down',
    color: 0x9bc4e3,
    dialog: [
      'Glaziella: Du bist weit gereist, Botanikerin.',
      'Glaziella: Hier wachsen Pflanzen die Eis ueberlebt haben.',
      'Glaziella: Hinter dem Mythical-Tor wartet Eden Lost - aber dafuer brauchst du noch Verodyne.'
    ]
  },
    {
      id: 'arvik-eisangler',
      name: 'Arvik (Eisangler)',
      tileX: 11,
      tileY: 8,
      facing: 'down',
      color: 0x6b9de8,
      dialog: [
        'Arvik: Permafrost-Lichen wachsen am tiefsten Eis.',
        'Arvik: Tausch mir 3 Frost-Moss, ich gebe dir eine Mountain-Pine-Saat.'
      ]
    },
    {
      id: 'saela-mythenforscherin',
      name: 'Saela',
      tileX: 20,
      tileY: 12,
      facing: 'left',
      color: 0xb86ee3,
      dialog: [
        'Saela: Ich erforsche das Mythical-Tor seit Jahren.',
        'Saela: Es oeffnet sich nur wenn du Verodyne besiegt hast.'
      ]
    }
];

// Lore-Sign V0.6 (Tile 10)
if (tiles[6]?.[8] !== undefined) tiles[6][8] = 10;
if (tiles[12]?.[22] !== undefined) tiles[12][22] = 10;

const glaciara: MapDef = {
  width: W,
  height: H,
  tiles,
  playerSpawn: { tileX: 14, tileY: H - 2 },
  doorToGarden: { tileX: -1, tileY: -1 },
  npcs: glaciaraNpcs
};

export default glaciara;
