// Verdanto Map - Tropischer Regenwald, erstes Biom
// Tile-Indices wie in wurzelheim.ts plus:
// 13 = Bromelien (begehbar, Encounter +5%)
// 14 = Lianen (collide V0.5)
// 15 = Tropische Bluete (Deko)

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
      row.push(0);
    }
    t.push(row);
  }
  return t;
}

const tiles = genTiles();

// Map-Border mit dichten Baeumen
for (let x = 0; x < W; x++) {
  tiles[0][x] = 4;
  tiles[H - 1][x] = 4;
}
for (let y = 0; y < H; y++) {
  tiles[y][0] = 4;
  tiles[y][W - 1] = 4;
}

// Norden: Map-Edge zurueck zu Wurzelheim (Tile 11 hellgruen mit Pfeil)
tiles[0][14] = 11;
tiles[0][15] = 11;

// Hauptpfad nord-sued
for (let y = 1; y <= H - 2; y++) {
  if (tiles[y][14] !== 4) tiles[y][14] = 1;
  if (tiles[y][15] !== 4) tiles[y][15] = 1;
}

// Hohes-Gras Cluster - mehrere Bereiche
for (let y = 2; y <= 5; y++) {
  for (let x = 3; x <= 8; x++) tiles[y][x] = 2;
  for (let x = 21; x <= 26; x++) tiles[y][x] = 2;
}
for (let y = 11; y <= 14; y++) {
  for (let x = 4; x <= 9; x++) tiles[y][x] = 2;
  for (let x = 20; x <= 25; x++) tiles[y][x] = 2;
}

// Bromelien-Tiles mit hoeherer Encounter-Rate verstreut
const bromPositions: Array<[number, number]> = [
  [2, 2], [5, 4], [9, 3], [12, 5],
  [22, 3], [25, 5], [3, 13], [8, 12],
  [22, 13], [27, 14], [11, 17], [21, 17]
];
for (const [x, y] of bromPositions) tiles[y][x] = 13;

// Liane-Cluster (collide V0.5)
const lianenPositions: Array<[number, number]> = [
  [10, 7], [11, 7], [12, 7],
  [18, 7], [19, 7], [20, 7],
  [10, 9], [11, 9], [18, 9], [19, 9]
];
for (const [x, y] of lianenPositions) tiles[y][x] = 14;

// Fluss horizontal Mitte
for (let x = 1; x < W - 1; x++) {
  tiles[8][x] = 3;
}
// Bruecke an x=14, x=15
tiles[8][14] = 1;
tiles[8][15] = 1;

// Tropische Bluete-Deko
tiles[6][22] = 15;
tiles[12][7] = 15;
tiles[16][3] = 15;
tiles[16][26] = 15;

// Map-Edge Sueden zum Salzbucht (V0.5)
tiles[H - 1][14] = 11;
tiles[H - 1][15] = 11;

const verdantoNpcs: NPCSpawn[] = [
  {
    id: 'lyra',
    name: 'Lyra',
    tileX: 14,
    tileY: 10,
    facing: 'down',
    color: 0xff5c5c,
    dialog: [
      'Lyra: Du bist also die Botaniker-in von Wurzelheim?',
      'Lyra: Hier in Verdanto leben die letzten unmutierten Bromelien.',
      'Lyra: Sammle 3 Bromeliad-Samen fuer mich, dann erzaehle ich dir mehr ueber die Verodyne-Geschichte.'
    ]
  },
  {
    id: 'theo-trader',
    name: 'Theo (Tausch-Haendler)',
    tileX: 18,
    tileY: 14,
    facing: 'left',
    color: 0xfcd95c,
    dialog: [
      'Theo: Willkommen am Tauschplatz, Botanikerin.',
      'Theo: Ich tausche Items gegen Items, kein Gold!'
    ]
  },
  {
    id: 'mosa-bromelien-zuechter',
    name: 'Mosa',
    tileX: 9,
    tileY: 8,
    facing: 'down',
    color: 0xfcd95c,
    dialog: [
      'Mosa: Ich zuechte Bromelien seit 30 Jahren.',
      'Mosa: Tausch mir 5 Air-Plant-Samen, ich gebe dir eine Vanille-Orchidee.'
    ]
  },
  {
    id: 'aris-froschfreund',
    name: 'Aris (Frosch-Freund)',
    tileX: 21,
    tileY: 10,
    facing: 'left',
    color: 0x4a8298,
    dialog: [
      'Aris: Diese Sumpf-Froesche springen vor jedem Encounter.',
      'Aris: Hoer aufs Quaken, dann weisst du wo wilde Pflanzen sind.'
    ]
  }
];


// Forage-Tiles V0.2 (Berry-Bush 50, Wildplant 51)
if (tiles[3]?.[5]) tiles[3][5] = 50;
if (tiles[5]?.[24] !== undefined) tiles[5][24] = 50;
if (tiles[12]?.[3] !== undefined) tiles[12][3] = 51;
if (tiles[15]?.[24] !== undefined) tiles[15][24] = 51;

// Lore-Sign V0.6 (Tile 10)
if (tiles[9]?.[7] !== undefined) tiles[9][7] = 10;
if (tiles[12]?.[20] !== undefined) tiles[12][20] = 10;

const verdanto: MapDef = {
  width: W,
  height: H,
  tiles,
  playerSpawn: { tileX: 14, tileY: 1 },     // Norden, kommt von Wurzelheim
  doorToGarden: { tileX: -1, tileY: -1 },    // Kein Garten direkt in Verdanto
  npcs: verdantoNpcs
};

export default verdanto;
