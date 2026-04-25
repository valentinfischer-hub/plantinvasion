// Kaktoria Map - Aride Wueste, drittes Biom
// Tile-Indices wie wurzelheim plus:
// 16 = Sand (begehbar, ground)
// 17 = Sandstein (collide)
// 18 = Wuesten-Kaktus (collide)
// 19 = Trockenblume (Deko)

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
      row.push(16);   // default sand
    }
    t.push(row);
  }
  return t;
}

const tiles = genTiles();

// Map-Border mit Sandstein
for (let x = 0; x < W; x++) {
  tiles[0][x] = 17;
  tiles[H - 1][x] = 17;
}
for (let y = 0; y < H; y++) {
  tiles[y][0] = 17;
  tiles[y][W - 1] = 17;
}

// Map-Edge-Osten: zurueck zu Verdanto (V0.5 trigger)
tiles[10][W - 1] = 11;
tiles[11][W - 1] = 11;

// Map-Edge-Norden: zu Frostkamm (V0.5)
tiles[0][14] = 11;
tiles[0][15] = 11;

// Hauptpfad horizontal Mitte
for (let x = 1; x <= W - 2; x++) {
  if (tiles[10][x] !== 17) tiles[10][x] = 1;
  if (tiles[11][x] !== 17) tiles[11][x] = 1;
}

// Vertikaler Pfad Norden
for (let y = 1; y < 11; y++) {
  if (tiles[y][14] !== 17) tiles[y][14] = 1;
  if (tiles[y][15] !== 17) tiles[y][15] = 1;
}

// Wuesten-Kakteen verstreut
const cactusPositions: Array<[number, number]> = [
  [3, 3], [5, 5], [8, 7], [12, 4], [4, 14], [7, 16], [10, 14],
  [22, 3], [25, 6], [21, 14], [26, 16], [27, 8], [20, 5]
];
for (const [x, y] of cactusPositions) tiles[y][x] = 18;

// Hohes Gras (Wueste) Cluster fuer Encounter
for (let y = 13; y <= 16; y++) {
  for (let x = 17; x <= 22; x++) tiles[y][x] = 2;
}
for (let y = 4; y <= 7; y++) {
  for (let x = 4; x <= 9; x++) tiles[y][x] = 2;
}
for (let y = 13; y <= 16; y++) {
  for (let x = 4; x <= 8; x++) tiles[y][x] = 2;
}

// Trockenblumen-Deko
const flowerPositions: Array<[number, number]> = [
  [4, 9], [12, 12], [22, 8], [27, 14]
];
for (const [x, y] of flowerPositions) tiles[y][x] = 19;

// Sandsteinblock-Cluster
for (let y = 6; y <= 7; y++) {
  for (let x = 18; x <= 20; x++) tiles[y][x] = 17;
}

const kaktoriaNpcs: NPCSpawn[] = [
  {
    id: 'durst-kaktus-meister',
    name: 'Durst (Kaktus-Meister)',
    tileX: 14,
    tileY: 12,
    facing: 'down',
    color: 0x6abf3a,
    dialog: [
      'Durst: Eine Botanikerin in der Wueste? Selten.',
      'Durst: Hier wachsen die seltensten Kaktusarten von Botanopia.',
      'Durst: Sammle Saguaro-Samen wenn du dich traust. Vorsicht vor den Stacheln.'
    ]
  }
];


// Forage-Tiles V0.2 (Berry-Bush 50, Wildplant 51)
if (tiles[3]?.[5] !== undefined) tiles[3][5] = 51;
if (tiles[6]?.[23] !== undefined) tiles[6][23] = 50;
if (tiles[14]?.[3] !== undefined) tiles[14][3] = 51;
if (tiles[15]?.[22] !== undefined) tiles[15][22] = 50;

const kaktoria: MapDef = {
  width: W,
  height: H,
  tiles,
  playerSpawn: { tileX: W - 2, tileY: 10 },     // Osten, kommt von Verdanto
  doorToGarden: { tileX: -1, tileY: -1 },
  npcs: kaktoriaNpcs
};

export default kaktoria;
