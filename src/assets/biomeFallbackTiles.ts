import Phaser from 'phaser';

/**
 * Procedural Pixel-Art-Tiles fuer Biome ohne PNG-Sprites (Mordwald, Magmabluete).
 * Generiert bei Boot zur Laufzeit, kein PNG-Asset noetig.
 *
 * Falls spaeter PixelLab-PNGs verfuegbar sind, wird der Loader die Texture
 * vor dem proceduralen Fallback registrieren und der Drawer-Aufruf wird
 * uebersprungen (siehe ensureFallbackTexture).
 */

const T = 16;

function rect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, color: number) {
  g.fillStyle(color, 1);
  g.fillRect(x, y, w, h);
}
function pix(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number) {
  g.fillStyle(color, 1);
  g.fillRect(x, y, 1, 1);
}

// =========================================================
// Mordwald (Sumpf)
// =========================================================

function drawSwampFloor(g: Phaser.GameObjects.Graphics) {
  rect(g, 0, 0, T, T, 0x3d4a2a);
  // dunkle Erdpunkte
  const spots = [[2, 3], [7, 5], [11, 2], [4, 9], [13, 12], [9, 14]];
  for (const [x, y] of spots) {
    pix(g, x, y, 0x2a3520);
    pix(g, x + 1, y, 0x4d5a3a);
  }
  // gelegentliche Moosflecken
  pix(g, 5, 11, 0x5d7a4a);
  pix(g, 12, 6, 0x5d7a4a);
}

function drawSwampWater(g: Phaser.GameObjects.Graphics) {
  rect(g, 0, 0, T, T, 0x3a4828);
  // Wellen und Bubbles
  for (let y = 2; y < T; y += 5) {
    rect(g, 1, y, 4, 1, 0x5a6838);
    rect(g, 9, y + 2, 5, 1, 0x4a5828);
  }
  // Bubbles
  pix(g, 5, 4, 0x8a9858);
  pix(g, 11, 9, 0x8a9858);
  pix(g, 3, 13, 0x8a9858);
}

function drawSwampOak(g: Phaser.GameObjects.Graphics) {
  rect(g, 0, 0, T, T, 0x3d4a2a); // sumpfboden-Hintergrund
  // Stamm dick und dunkel
  rect(g, 6, 9, 4, 7, 0x2a1a14);
  rect(g, 7, 9, 2, 7, 0x4d2e1d);
  // Krone
  rect(g, 3, 2, 10, 8, 0x2d4022);
  rect(g, 4, 1, 8, 2, 0x3d5530);
  // Spanish Moss-Strange
  rect(g, 5, 9, 1, 3, 0x6d8a4a);
  rect(g, 10, 9, 1, 3, 0x6d8a4a);
}

function drawSpanishMoss(g: Phaser.GameObjects.Graphics) {
  rect(g, 0, 0, T, T, 0x3d4a2a);
  // Moss-Strange haengen
  for (let x = 2; x < T; x += 3) {
    rect(g, x, 1, 1, 8, 0x6d8a4a);
    rect(g, x, 1, 1, 4, 0x8aaa5a);
  }
  // Kleine Pilze am Boden
  pix(g, 4, 13, 0xc88a5a);
  pix(g, 11, 14, 0xc88a5a);
}

function drawCarnivoreGrass(g: Phaser.GameObjects.Graphics) {
  rect(g, 0, 0, T, T, 0x2d4022);
  // Hohe dunkle Halme mit roter Spitze (karnivoren-Andeutung)
  for (let x = 1; x < T; x += 3) {
    rect(g, x, 5, 1, 9, 0x4a6b28);
    pix(g, x, 4, 0xc94d6e); // rote Knospe
  }
  // Funkende Punkte (Tau)
  pix(g, 6, 8, 0xfff7d4);
  pix(g, 12, 11, 0xfff7d4);
}

// =========================================================
// Magmabluete (Vulkan)
// =========================================================

function drawAsh(g: Phaser.GameObjects.Graphics) {
  rect(g, 0, 0, T, T, 0x3a3540);
  // Asche-Sprenkel
  const flecken = [[2, 4], [8, 2], [12, 6], [5, 9], [13, 11], [3, 13]];
  for (const [x, y] of flecken) {
    pix(g, x, y, 0x2a2530);
    pix(g, x + 1, y, 0x5a5560);
  }
  // glimmende Adern (sehr subtil)
  pix(g, 7, 7, 0xc8543a);
  pix(g, 10, 13, 0xc8543a);
}

function drawLava(g: Phaser.GameObjects.Graphics) {
  // Basis: dunkles Magma-Rot
  rect(g, 0, 0, T, T, 0x6a1810);
  // Helles Magma-Adern
  for (let y = 0; y < T; y += 3) {
    rect(g, 1, y + 1, T - 2, 1, 0xc8543a);
  }
  // Bright spots
  rect(g, 4, 5, 2, 2, 0xffa840);
  rect(g, 10, 9, 2, 2, 0xffa840);
  // Yellow hottest
  pix(g, 5, 5, 0xffd166);
  pix(g, 11, 9, 0xffd166);
}

function drawBasalt(g: Phaser.GameObjects.Graphics) {
  rect(g, 0, 0, T, T, 0x2a252a);
  // Saulen-Hexagonal-Andeutung
  rect(g, 2, 2, 5, 12, 0x3a353a);
  rect(g, 9, 2, 5, 12, 0x3a353a);
  // Glut-Risse
  rect(g, 7, 4, 1, 2, 0xc8543a);
  rect(g, 7, 10, 1, 2, 0xc8543a);
  // Hoehlung
  pix(g, 4, 7, 0x1a151a);
  pix(g, 11, 11, 0x1a151a);
}

function drawCharredStump(g: Phaser.GameObjects.Graphics) {
  rect(g, 0, 0, T, T, 0x3a3540);
  // Stumpf
  rect(g, 4, 8, 8, 6, 0x1a1414);
  rect(g, 5, 9, 6, 4, 0x2d1818);
  // Glut-Punkt im Inneren
  pix(g, 7, 11, 0xff5c1a);
  pix(g, 8, 11, 0xffa840);
  // Risse
  rect(g, 4, 7, 1, 1, 0x4a3525);
  rect(g, 11, 7, 1, 1, 0x4a3525);
}

function drawPyrophytGrass(g: Phaser.GameObjects.Graphics) {
  rect(g, 0, 0, T, T, 0x4a3520);
  // Halme rot-orange
  for (let x = 1; x < T; x += 3) {
    rect(g, x, 5, 1, 9, 0xc8543a);
    pix(g, x, 4, 0xffd166);
  }
  // Asche-Flecken
  pix(g, 6, 12, 0x6a5560);
  pix(g, 12, 13, 0x6a5560);
}

function drawSulfurSpring(g: Phaser.GameObjects.Graphics) {
  // Schwefel-Quelle: gelbliches Wasser
  rect(g, 0, 0, T, T, 0xc8a528);
  // Wellen
  for (let y = 2; y < T; y += 4) {
    rect(g, 1, y, 5, 1, 0xffd166);
    rect(g, 9, y + 2, 5, 1, 0xe8c548);
  }
  // Dampf-Punkte
  pix(g, 5, 4, 0xfff7d4);
  pix(g, 11, 9, 0xfff7d4);
  pix(g, 3, 13, 0xfff7d4);
}

// =========================================================
// Public API
// =========================================================

const FALLBACK_DRAWERS: Record<string, (g: Phaser.GameObjects.Graphics) => void> = {
  // Mordwald
  tile_swampfloor: drawSwampFloor,
  tile_swampwater: drawSwampWater,
  tile_swampoak: drawSwampOak,
  tile_spanishmoss: drawSpanishMoss,
  tile_carnivoregrass: drawCarnivoreGrass,
  // Magmabluete
  tile_ash: drawAsh,
  tile_lava: drawLava,
  tile_basalt: drawBasalt,
  tile_charredstump: drawCharredStump,
  tile_pyrophytgrass: drawPyrophytGrass,
  tile_sulfurspring: drawSulfurSpring
};

/**
 * Generiert procedurale Texturen fuer Sprite-Keys die kein PNG haben.
 * Existierende Texturen (z.B. aus PNG-Load) werden NICHT ueberschrieben.
 */
export function generateBiomeFallbackTiles(scene: Phaser.Scene): void {
  for (const [key, drawer] of Object.entries(FALLBACK_DRAWERS)) {
    if (scene.textures.exists(key)) continue;
    const g = scene.add.graphics({ x: 0, y: 0 });
    g.setVisible(false);
    drawer(g);
    g.generateTexture(key, T, T);
    g.destroy();
  }
}

export const FALLBACK_TILE_KEYS = Object.keys(FALLBACK_DRAWERS);
