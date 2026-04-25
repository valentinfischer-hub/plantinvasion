// Mordwald Map - Karnivoren-Sumpf, sechstes Biom
// Tile-Indices wie wurzelheim plus:
// 30 = Sumpf-Boden (begehbar, dunkel)
// 31 = Sumpfwasser (collide, truebes Olivgruen)
// 32 = Sumpfeiche (collide)
// 33 = Spanish Moss (Deko, begehbar)
// 34 = Karnivoren-Hochgras (Encounter, begehbar)

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
      row.push(30); // Sumpf-Boden default
    }
    t.push(row);
  }
  return t;
}

const tiles = genTiles();

// Map-Border mit Sumpfeichen
for (let x = 0; x < W; x++) {
  tiles[0][x] = 32;
  tiles[H - 1][x] = 32;
}
for (let y = 0; y < H; y++) {
  tiles[y][0] = 32;
  tiles[y][W - 1] = 32;
}

// Map-Edge-Sueden: zurueck zu Salzbucht (oder Verdanto)
tiles[H - 1][14] = 11;
tiles[H - 1][15] = 11;

// Hauptpfad nord-sued (etwas verschlungen, sumpf-typisch)
const path: Array<[number, number]> = [];
for (let y = 1; y <= H - 2; y++) {
  const offset = Math.floor(Math.sin(y * 0.4) * 1.5);
  path.push([14 + offset, y]);
  path.push([15 + offset, y]);
}
for (const [x, y] of path) {
  if (tiles[y]?.[x] === 30) tiles[y][x] = 1;
}

// Sumpfwasser-Patches (collide)
const waterPatches: Array<[number, number, number, number]> = [
  [3, 3, 4, 3],   // x, y, w, h
  [22, 4, 5, 3],
  [4, 12, 4, 4],
  [21, 13, 5, 3]
];
for (const [px, py, pw, ph] of waterPatches) {
  for (let dy = 0; dy < ph; dy++) {
    for (let dx = 0; dx < pw; dx++) {
      const x = px + dx;
      const y = py + dy;
      if (tiles[y]?.[x] === 30) tiles[y][x] = 31;
    }
  }
}

// Sumpfeichen verstreut
const eichen: Array<[number, number]> = [
  [9, 4], [11, 6], [18, 5], [20, 8],
  [3, 9], [25, 10], [10, 14], [19, 16]
];
for (const [x, y] of eichen) tiles[y][x] = 32;

// Spanish Moss Deko
const moss: Array<[number, number]> = [
  [10, 5], [12, 5], [19, 6], [21, 9],
  [4, 10], [26, 11], [11, 15], [20, 17]
];
for (const [x, y] of moss) {
  if (tiles[y]?.[x] === 30) tiles[y][x] = 33;
}

// Karnivoren-Hochgras Cluster (Encounter)
for (let y = 5; y <= 7; y++) {
  for (let x = 5; x <= 8; x++) {
    if (tiles[y][x] === 30) tiles[y][x] = 34;
  }
}
for (let y = 11; y <= 14; y++) {
  for (let x = 8; x <= 12; x++) {
    if (tiles[y][x] === 30) tiles[y][x] = 34;
  }
}
for (let y = 5; y <= 8; y++) {
  for (let x = 18; x <= 22; x++) {
    if (tiles[y][x] === 30) tiles[y][x] = 34;
  }
}

const mordwaldNpcs: NPCSpawn[] = [
  {
    id: 'madame-drosera',
    name: 'Madame Drosera',
    tileX: 14,
    tileY: 8,
    facing: 'down',
    color: 0x6b3a8a,
    dialog: [
      'Madame Drosera: Im Sumpf wachsen die hungrigsten Pflanzen.',
      'Madame Drosera: Bring mir 5 Bladderwort-Haeute, ich gebe dir Sumpf-Pollen.',
      'Madame Drosera: Pass auf den Mond auf, bei Vollmond wacht der Wurzel-Lord.'
    ]
  }
];

const mordwald: MapDef = {
  width: W,
  height: H,
  tiles,
  playerSpawn: { tileX: 14, tileY: H - 2 },
  doorToGarden: { tileX: -1, tileY: -1 },
  npcs: mordwaldNpcs
};

export default mordwald;
