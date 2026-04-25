// Wurzelheim Map-Daten - programmatisch generiert
// Tile-Indices:
// 0  = Gras (begehbar)
// 1  = Weg (begehbar)
// 2  = Hohes Gras (begehbar, Encounter-Tile spaeter)
// 3  = Wasser (collide)
// 4  = Baum (collide)
// 5  = Building-Wand (collide)
// 6  = Building-Dach (collide)
// 7  = Tuer-Garten (door, fuehrt zu GreenhouseScene)
// 8  = Tuer-Building-Allgemein (collide V0.2)
// 9  = Marktstand (interact)
// 10 = Schild (interact)
// 11 = Map-Edge nach Sueden (transition Verdanto, V0.3)
// 12 = Blumenbeet (Deko, begehbar)

import {
  WURZELHEIM_WIDTH_TILES,
  WURZELHEIM_HEIGHT_TILES
} from '../../utils/constants';

export interface NPCSpawn {
  id: string;
  name: string;
  tileX: number;
  tileY: number;
  facing: 'up' | 'down' | 'left' | 'right';
  dialog: string[];
  color: number;     // Placeholder bis Sprite da ist
}

export interface MapDef {
  width: number;
  height: number;
  tiles: number[][];          // [y][x]
  playerSpawn: { tileX: number; tileY: number };
  npcs: NPCSpawn[];
  doorToGarden: { tileX: number; tileY: number };
}

const W = WURZELHEIM_WIDTH_TILES;
const H = WURZELHEIM_HEIGHT_TILES;

// Generate base layer with gras
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

// Map-Border mit Baeumen (collide)
for (let x = 0; x < W; x++) {
  tiles[0][x] = 4;
  tiles[H - 1][x] = 4;
}
for (let y = 0; y < H; y++) {
  tiles[y][0] = 4;
  tiles[y][W - 1] = 4;
}

// Sueden-Edge: Map-Transition nach Verdanto (Tile 11) als Loch im Baumring
tiles[H - 1][15] = 11;
tiles[H - 1][16] = 11;

// Fluss / Wasser horizontal in der Mitte
for (let x = 8; x <= 22; x++) {
  tiles[8][x] = 3;
  tiles[9][x] = 3;
}
// Bruecke (Weg-Tiles ueber Wasser) bei x=14,15
tiles[8][14] = 1;
tiles[8][15] = 1;
tiles[9][14] = 1;
tiles[9][15] = 1;

// Hauptweg vertikal
for (let y = 1; y <= H - 2; y++) {
  if (tiles[y][14] !== 3 && tiles[y][14] !== 4) tiles[y][14] = 1;
  if (tiles[y][15] !== 3 && tiles[y][15] !== 4) tiles[y][15] = 1;
}

// Player Building (Spielerhaus) bei (5,3) bis (8,5), Tuer bei (6,6)
for (let y = 3; y <= 5; y++) {
  for (let x = 5; x <= 8; x++) {
    tiles[y][x] = (y === 3) ? 6 : 5;
  }
}
tiles[6][6] = 7;     // Tuer zum Garten
tiles[6][7] = 5;

// Markthalle (Building 2) bei (20, 3) bis (23, 5)
for (let y = 3; y <= 5; y++) {
  for (let x = 20; x <= 23; x++) {
    tiles[y][x] = (y === 3) ? 6 : 5;
  }
}
tiles[6][20] = 8;
tiles[6][21] = 8;

// Botanik-Akademie bei (5, 12) bis (8, 14)
for (let y = 12; y <= 14; y++) {
  for (let x = 5; x <= 8; x++) {
    tiles[y][x] = (y === 12) ? 6 : 5;
  }
}
tiles[15][6] = 8;

// NPC-Wohnhaus bei (20, 12) bis (23, 14)
for (let y = 12; y <= 14; y++) {
  for (let x = 20; x <= 23; x++) {
    tiles[y][x] = (y === 12) ? 6 : 5;
  }
}
tiles[15][21] = 8;

// Marktstaende (interact) entlang Hauptplatz-Linie y=11
for (const x of [10, 12, 17, 19]) {
  tiles[11][x] = 9;
}

// Hohes Gras am suedwestlichen Rand
for (let y = 17; y <= 18; y++) {
  for (let x = 1; x <= 4; x++) {
    tiles[y][x] = 2;
  }
}

// Blumenbeete als Deko
tiles[2][10] = 12;
tiles[2][11] = 12;
tiles[2][18] = 12;
tiles[2][19] = 12;
tiles[16][10] = 12;
tiles[16][19] = 12;

// Schild bei Player-Haus (Tile 10)
tiles[7][6] = 10;

const wurzelheim: MapDef = {
  width: W,
  height: H,
  tiles,
  playerSpawn: { tileX: 14, tileY: 17 },     // suedlich auf dem Weg, mit Blick nach oben
  doorToGarden: { tileX: 6, tileY: 6 },
  npcs: [
    {
      id: 'anya',
      name: 'Anya',
      tileX: 11,
      tileY: 11,
      facing: 'down',
      color: 0xff7e7e,
      dialog: [
        'Anya: Willkommen in Wurzelheim, Botanikerin.',
        'Anya: Das Tagebuch deiner Grossmutter wartet im Hauseingang.',
        'Anya: Bring mir spaeter eine Sonnenblume, ich tausche sie gegen ein Geschenk.',
        'Anya: Druecke M wenn du mit mir handeln willst.'
      ]
    },
    {
      id: 'bjoern',
      name: 'Bjoern',
      tileX: 5,
      tileY: 11,
      facing: 'right',
      color: 0x7eb8ff,
      dialog: [
        'Bjoern: Ich habe schon viele Saemereien gesehen.',
        'Bjoern: Deine Familie hatte einen besonderen Daumen fuer Hybriden.',
        'Bjoern: Halt die Augen offen am Waldrand, dort wachsen seltsame Dinge.'
      ]
    },
    {
      id: 'clara',
      name: 'Clara',
      tileX: 18,
      tileY: 11,
      facing: 'left',
      color: 0xfff07e,
      dialog: [
        'Clara: Bist du bereit, das System zu lernen?',
        'Clara: Pflanzen kreuzt man nicht einfach so.',
        'Clara: Komm in die Akademie wenn du den ersten Pokedex-Eintrag hast.'
      ]
    }
  ]
};

export default wurzelheim;
