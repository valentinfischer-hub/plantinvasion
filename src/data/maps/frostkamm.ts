// Frostkamm Map - Hochgebirge, viertes Biom
// Tile-Indices wie wurzelheim plus:
// 20 = Stein (collide)
// 21 = Schnee (begehbar, leicht slippery later)
// 22 = Eis (begehbar, Eis-Walk-Effekt V0.7)
// 23 = Bergfichte (collide)
// 24 = Frost-Kristall (Deko)

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
      row.push(21);
    }
    t.push(row);
  }
  return t;
}

const tiles = genTiles();

// Map-Border mit Stein
for (let x = 0; x < W; x++) {
  tiles[0][x] = 20;
  tiles[H - 1][x] = 20;
}
for (let y = 0; y < H; y++) {
  tiles[y][0] = 20;
  tiles[y][W - 1] = 20;
}

// Map-Edge-Sueden: zurueck zu Kaktoria
tiles[H - 1][14] = 11;
tiles[H - 1][15] = 11;

// Map-Edge-Norden: zu Glaciara V0.9
tiles[0][14] = 11;
tiles[0][15] = 11;

// Hauptpfad nord-sued
for (let y = 1; y <= H - 2; y++) {
  if (tiles[y][14] !== 20) tiles[y][14] = 1;
  if (tiles[y][15] !== 20) tiles[y][15] = 1;
}

// Bergfichten verstreut
const fichten: Array<[number, number]> = [
  [3, 3], [5, 4], [9, 6], [12, 8], [4, 14], [7, 16],
  [22, 3], [25, 4], [27, 6], [21, 14], [25, 16]
];
for (const [x, y] of fichten) tiles[y][x] = 23;

// Eisfeld (Tile 22) in Mitte
for (let y = 8; y <= 10; y++) {
  for (let x = 4; x <= 11; x++) tiles[y][x] = 22;
  for (let x = 18; x <= 25; x++) tiles[y][x] = 22;
}

// Hohes Gras Cluster fuer Encounter (Schnee-Hoch-Gras)
for (let y = 4; y <= 7; y++) {
  for (let x = 4; x <= 9; x++) tiles[y][x] = 2;
}
for (let y = 12; y <= 15; y++) {
  for (let x = 17; x <= 25; x++) tiles[y][x] = 2;
}
for (let y = 12; y <= 15; y++) {
  for (let x = 4; x <= 9; x++) tiles[y][x] = 2;
}

// Stein-Cluster (collide)
for (let y = 5; y <= 6; y++) {
  for (let x = 17; x <= 18; x++) tiles[y][x] = 20;
}
for (let y = 13; y <= 14; y++) {
  for (let x = 11; x <= 12; x++) tiles[y][x] = 20;
}

// Frost-Kristalle (Deko)
const crystals: Array<[number, number]> = [
  [8, 5], [22, 5], [11, 13], [19, 14], [4, 17]
];
for (const [x, y] of crystals) tiles[y][x] = 24;

const frostkammNpcs: NPCSpawn[] = [
  {
    id: 'eira-bergfuehrerin',
    name: 'Eira (Bergfuehrerin)',
    tileX: 14,
    tileY: 5,
    facing: 'down',
    color: 0xc8d8e8,
    dialog: [
      'Eira: Vorsicht in den Bergen, die Pflanzen hier sind frostresistent.',
      'Eira: Edelweiss ist hier mein Spezialgebiet. Hast du eines gesehen?',
      'Eira: Hinter den Eisfeldern wartet Glaciara, das Endgame-Biom.'
    ]
  },
    {
      id: 'selma-bergsteigerin',
      name: 'Selma',
      tileX: 12,
      tileY: 8,
      facing: 'down',
      color: 0xc8d8e8,
      dialog: [
        'Selma: Ich kletter seit Kindheit auf diese Berge.',
        'Selma: Tief im Schnee findest du Permafrost-Lichen, gibt einen Boost gegen Kaelte-Schaden.'
      ]
    },
    {
      id: 'huber-pelzhaendler',
      name: 'Huber (Pelz-Haendler)',
      tileX: 20,
      tileY: 13,
      facing: 'left',
      color: 0x8a6e3a,
      dialog: [
        'Huber: Edelweiss bringt nach Erntezeit den hoechsten Preis.',
        'Huber: Saug-Pollen halten Frostkamm-Pflanzen warm waehrend der Reise.'
      ]
    }
];


// Forage-Tiles V0.2 (Berry-Bush 50, Wildplant 51)
if (tiles[3]?.[5] !== undefined) tiles[3][5] = 51;
if (tiles[5]?.[23] !== undefined) tiles[5][23] = 51;
if (tiles[14]?.[5] !== undefined) tiles[14][5] = 50;
if (tiles[15]?.[23] !== undefined) tiles[15][23] = 50;

// Lore-Sign V0.6 (Tile 10)
if (tiles[7]?.[8] !== undefined) tiles[7][8] = 10;
if (tiles[12]?.[22] !== undefined) tiles[12][22] = 10;

const frostkamm: MapDef = {
  width: W,
  height: H,
  tiles,
  playerSpawn: { tileX: 14, tileY: H - 2 },
  doorToGarden: { tileX: -1, tileY: -1 },
  npcs: frostkammNpcs
};

export default frostkamm;
