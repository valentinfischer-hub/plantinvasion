// Salzbucht Map - Meereskueste, fuenftes Biom
// Tile-Indices wie wurzelheim plus:
// 25 = Strand-Sand (begehbar)
// 26 = Salzwasser (collide)
// 27 = Muschel (Deko)
// 28 = Treibgut (collide V0.7 mit Saw-HM)

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
      row.push(25);
    }
    t.push(row);
  }
  return t;
}

const tiles = genTiles();

// Map-Border
for (let x = 0; x < W; x++) tiles[0][x] = 4;        // Norden noch Wald
for (let y = 0; y < H; y++) tiles[y][0] = 4;        // Westen Wald
for (let y = 0; y < H; y++) tiles[y][W - 1] = 4;    // Osten Wald
// Sueden ist Meer
for (let x = 0; x < W; x++) tiles[H - 1][x] = 26;

// Map-Edge-Norden: zurueck zu Verdanto
tiles[0][14] = 11;
tiles[0][15] = 11;

// Hauptpfad nord-sued
for (let y = 1; y <= H - 3; y++) {
  if (tiles[y][14] !== 4) tiles[y][14] = 1;
  if (tiles[y][15] !== 4) tiles[y][15] = 1;
}

// Salzwasser am Sueden mit Lagune
for (let y = H - 5; y <= H - 2; y++) {
  for (let x = 5; x <= W - 6; x++) {
    if (tiles[y][x] !== 4 && tiles[y][x] !== 1) tiles[y][x] = 26;
  }
}

// Strand zwischen Land und Wasser
for (let y = H - 8; y <= H - 6; y++) {
  for (let x = 1; x <= W - 2; x++) {
    if (tiles[y][x] !== 4) tiles[y][x] = 25;
  }
}

// Hohes Gras Cluster (Duenen) fuer Encounter
for (let y = 4; y <= 7; y++) {
  for (let x = 4; x <= 9; x++) tiles[y][x] = 2;
  for (let x = 21; x <= 26; x++) tiles[y][x] = 2;
}
for (let y = 9; y <= 11; y++) {
  for (let x = 4; x <= 9; x++) tiles[y][x] = 2;
  for (let x = 21; x <= 26; x++) tiles[y][x] = 2;
}

// Muscheln
const muscheln: Array<[number, number]> = [
  [3, 14], [12, 13], [22, 14], [27, 13], [8, 12]
];
for (const [x, y] of muscheln) tiles[y][x] = 27;

// Treibgut (collide V0.7)
const treibgut: Array<[number, number]> = [
  [12, 12], [18, 13]
];
for (const [x, y] of treibgut) tiles[y][x] = 28;

const salzbuchtNpcs: NPCSpawn[] = [
  {
    id: 'finn-fischer',
    name: 'Finn (Fischer)',
    tileX: 14,
    tileY: 12,
    facing: 'down',
    color: 0x4a78c8,
    dialog: [
      'Finn: Salzige Brise in der Nase, was?',
      'Finn: Hier am Strand wachsen ganz besondere Pflanzen mit Salztoleranz.',
      'Finn: Wenn du die Saege findest, kannst du Treibgut wegraeumen und neue Wege erschliessen.'
    ]
  },
    {
      id: 'linnea-muschelsucherin',
      name: 'Linnea',
      tileX: 11,
      tileY: 8,
      facing: 'down',
      color: 0xfff0f5,
      dialog: [
        'Linnea: Ich sammle hier Muscheln und Treibgut.',
        'Linnea: Manchmal sind Pflanzensamen drin - bring sie mir, ich tausch sie gegen Coins.'
      ]
    },
    {
      id: 'orin-leuchtturmwaerter',
      name: 'Orin (Leuchtturm)',
      tileX: 19,
      tileY: 12,
      facing: 'left',
      color: 0xfcd95c,
      dialog: [
        'Orin: Bei Vollmond leuchtet der Mangrove-Wald von selbst.',
        'Orin: Vorsicht: salzwasser-resistente Hybriden sind selten und kostbar.'
      ]
    }
];


// Forage-Tiles V0.2 (Berry-Bush 50, Wildplant 51)
if (tiles[3]?.[5] !== undefined) tiles[3][5] = 50;
if (tiles[6]?.[24] !== undefined) tiles[6][24] = 51;
if (tiles[14]?.[3] !== undefined) tiles[14][3] = 51;
if (tiles[15]?.[23] !== undefined) tiles[15][23] = 50;

// Lore-Sign V0.6 (Tile 10)
if (tiles[6]?.[7] !== undefined) tiles[6][7] = 10;
if (tiles[11]?.[21] !== undefined) tiles[11][21] = 10;

const salzbucht: MapDef = {
  width: W,
  height: H,
  tiles,
  playerSpawn: { tileX: 14, tileY: 1 },
  doorToGarden: { tileX: -1, tileY: -1 },
  npcs: salzbuchtNpcs
};

export default salzbucht;
