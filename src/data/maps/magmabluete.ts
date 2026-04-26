// Magmabluete Map - Vulkan-Pyrophyt, siebtes Biom
// Tile-Indices wie wurzelheim plus:
// 40 = Asche-Boden (begehbar, dunkelgrau)
// 41 = Lava (Damage-Tile, begehbar mit HP-Drain)
// 42 = Basalt-Felsen (collide)
// 43 = Verkohlter Stumpf (collide)
// 44 = Pyrophyt-Hochgras (Encounter, begehbar)
// 45 = Schwefel-Quelle (Heal-Tile, begehbar)

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
      row.push(40); // Asche-Boden default
    }
    t.push(row);
  }
  return t;
}

const tiles = genTiles();

// Map-Border mit Basalt-Felsen
for (let x = 0; x < W; x++) {
  tiles[0][x] = 42;
  tiles[H - 1][x] = 42;
}
for (let y = 0; y < H; y++) {
  tiles[y][0] = 42;
  tiles[y][W - 1] = 42;
}

// Map-Edge-Sueden: zurueck zu Mordwald (oder Wurzelheim)
tiles[H - 1][14] = 11;
tiles[H - 1][15] = 11;

// Hauptpfad nord-sued
for (let y = 1; y <= H - 2; y++) {
  if (tiles[y][14] !== 42) tiles[y][14] = 1;
  if (tiles[y][15] !== 42) tiles[y][15] = 1;
}

// Lava-Adern (Damage-Tiles)
const lavaVeins: Array<[number, number]> = [
  [4, 5], [5, 5], [6, 5], [7, 5],
  [22, 5], [23, 5], [24, 5],
  [9, 12], [10, 12], [11, 12],
  [19, 14], [20, 14], [21, 14], [22, 14]
];
for (const [x, y] of lavaVeins) {
  if (tiles[y]?.[x] === 40) tiles[y][x] = 41;
}

// Basalt-Felsen-Cluster (collide)
const basalt: Array<[number, number]> = [
  [4, 3], [5, 3], [6, 7], [25, 8],
  [3, 11], [10, 8], [22, 11], [25, 13]
];
for (const [x, y] of basalt) tiles[y][x] = 42;

// Verkohlte Stumpfe (Deko, collide)
const stumps: Array<[number, number]> = [
  [8, 4], [21, 4], [4, 16], [11, 17], [22, 16]
];
for (const [x, y] of stumps) tiles[y][x] = 43;

// Pyrophyt-Hochgras Cluster (Encounter)
for (let y = 6; y <= 8; y++) {
  for (let x = 4; x <= 9; x++) {
    if (tiles[y][x] === 40) tiles[y][x] = 44;
  }
}
for (let y = 9; y <= 11; y++) {
  for (let x = 18; x <= 23; x++) {
    if (tiles[y][x] === 40) tiles[y][x] = 44;
  }
}
for (let y = 15; y <= 17; y++) {
  for (let x = 4; x <= 8; x++) {
    if (tiles[y][x] === 40) tiles[y][x] = 44;
  }
}

// Schwefel-Quelle (Heal-Tile) - kleine Sub-Region
for (let y = 9; y <= 10; y++) {
  for (let x = 13; x <= 16; x++) {
    if (tiles[y][x] === 40 || tiles[y][x] === 1) tiles[y][x] = 45;
  }
}

const magmabluteNpcs: NPCSpawn[] = [
  {
    id: 'ignis-vulkan-schmied',
    name: 'Ignis (Vulkan-Schmied)',
    tileX: 14,
    tileY: 6,
    facing: 'down',
    color: 0xff8c42,
    dialog: [
      'Ignis: Hitze ist meine Spezialitaet. Bring mir Magma-Splitter und ich verstaerke deine Items.',
      'Ignis: Vorsicht, die Lava-Adern sind nicht nur Show.',
      'Ignis: Tief im Krater wartet das Magmaherz. Aber dafuer brauchst du alle Pyrophyt-Pflanzen.'
    ]
  },
  {
    id: 'cinder-asche-sammlerin',
    name: 'Cinder (Asche-Sammlerin)',
    tileX: 18,
    tileY: 12,
    facing: 'left',
    color: 0xa8a8b8,
    dialog: [
      'Cinder: Vulkan-Asche ist der beste Duenger. Verkauf mir was du findest.',
      'Cinder: Eine Prise auf eine Pflanze und sie waechst fuer eine Stunde 1.5x schneller.'
    ]
  },
    {
      id: 'feyra-glutsammlerin',
      name: 'Feyra',
      tileX: 11,
      tileY: 8,
      facing: 'down',
      color: 0xff5c1a,
      dialog: [
        'Feyra: Ich ziehe Glut-Splitter aus der Lava, sicher mit Aloe-Salbe.',
        'Feyra: Bring mir 3 Vulkan-Asche, ich verstaerke deine Pyrophyt-Pflanzen.'
      ]
    },
    {
      id: 'lex-vulkanforscher',
      name: 'Lex',
      tileX: 21,
      tileY: 11,
      facing: 'left',
      color: 0xa84a3a,
      dialog: [
        'Lex: Aktive Phasen sind kurz. Wenn du Eruption siehst, hau ab.',
        'Lex: Die Phoenix-Brand-Same ist ein Mythos - oder ist sie es?'
      ]
    }
];


// Forage-Tiles V0.2 (Berry-Bush 50, Wildplant 51)
if (tiles[3]?.[5] !== undefined) tiles[3][5] = 50;
if (tiles[5]?.[24] !== undefined) tiles[5][24] = 51;
if (tiles[15]?.[3] !== undefined) tiles[15][3] = 51;
if (tiles[15]?.[23] !== undefined) tiles[15][23] = 50;

// Lore-Sign V0.6 (Tile 10)
if (tiles[5]?.[7] !== undefined) tiles[5][7] = 10;
if (tiles[12]?.[22] !== undefined) tiles[12][22] = 10;

const magmabluete: MapDef = {
  width: W,
  height: H,
  tiles,
  playerSpawn: { tileX: 14, tileY: H - 2 },
  doorToGarden: { tileX: -1, tileY: -1 },
  npcs: magmabluteNpcs
};

export default magmabluete;
