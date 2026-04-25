import Phaser from 'phaser';

/**
 * Generiert procedurale 16x16 Pixel-Art-Tiles fuer Wurzelheim.
 * Texture-Keys: tile-0 bis tile-12 (siehe wurzelheim.ts fuer Mapping).
 */

const T = 16;

function pix(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number) {
  g.fillStyle(color, 1);
  g.fillRect(x, y, 1, 1);
}
function rect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, color: number) {
  g.fillStyle(color, 1);
  g.fillRect(x, y, w, h);
}

function drawGrass(g: Phaser.GameObjects.Graphics) {
  rect(g, 0, 0, T, T, 0x6abf3a);
  // grass-blade-Pattern - deterministisch gestreut
  const dots = [[2,3],[7,2],[12,4],[5,7],[10,8],[3,11],[14,12],[8,13]];
  for (const [x,y] of dots) {
    pix(g, x, y, 0x4a8228);
    pix(g, x+1, y-1, 0x82d44e);
  }
}

function drawPath(g: Phaser.GameObjects.Graphics) {
  rect(g, 0, 0, T, T, 0xb8945c);
  // Stein-Sprenkel
  const stones = [[1,2],[5,3],[10,5],[13,8],[3,10],[7,12],[11,14]];
  for (const [x,y] of stones) {
    pix(g, x, y, 0x8a6e3a);
    pix(g, x+1, y, 0xd4a878);
  }
}

function drawTallGrass(g: Phaser.GameObjects.Graphics) {
  rect(g, 0, 0, T, T, 0x4a8228);
  // hohe Halme
  for (let x = 1; x < T; x += 3) {
    rect(g, x, 4, 1, 9, 0x6abf3a);
    rect(g, x, 4, 1, 2, 0x82d44e);
  }
}

function drawWater(g: Phaser.GameObjects.Graphics) {
  rect(g, 0, 0, T, T, 0x4a78c8);
  // Wellen-Pattern
  for (let y = 2; y < T; y += 4) {
    rect(g, 1, y, 4, 1, 0x82a8e3);
    rect(g, 9, y+2, 5, 1, 0x82a8e3);
  }
}

function drawTree(g: Phaser.GameObjects.Graphics) {
  rect(g, 0, 0, T, T, 0x6abf3a);  // Gras-Hintergrund
  // Stamm
  rect(g, 7, 11, 2, 5, 0x553e2d);
  // Krone
  rect(g, 4, 2, 8, 9, 0x2d5a1f);
  rect(g, 3, 4, 1, 5, 0x2d5a1f);
  rect(g, 12, 4, 1, 5, 0x2d5a1f);
  // Highlights
  rect(g, 5, 3, 2, 2, 0x4a8228);
  rect(g, 9, 7, 2, 2, 0x4a8228);
}

function drawWall(g: Phaser.GameObjects.Graphics) {
  rect(g, 0, 0, T, T, 0x8a6e4a);
  // Holzbretter horizontal
  rect(g, 0, 4, T, 1, 0x553e2d);
  rect(g, 0, 9, T, 1, 0x553e2d);
  rect(g, 0, 14, T, 1, 0x553e2d);
  // Vertikale Naehte
  rect(g, 4, 0, 1, 4, 0x6e5a3a);
  rect(g, 11, 0, 1, 4, 0x6e5a3a);
  rect(g, 7, 5, 1, 4, 0x6e5a3a);
  rect(g, 12, 10, 1, 4, 0x6e5a3a);
}

function drawRoof(g: Phaser.GameObjects.Graphics) {
  rect(g, 0, 0, T, T, 0x8b3a2a);
  // Schindeln
  for (let y = 0; y < T; y += 4) {
    for (let x = (y % 8 === 0 ? 0 : 2); x < T; x += 4) {
      rect(g, x, y, 3, 3, 0x6e2a1e);
      rect(g, x, y, 3, 1, 0xc9583c);
    }
  }
}

function drawGardenDoor(g: Phaser.GameObjects.Graphics) {
  rect(g, 0, 0, T, T, 0x553e2d);  // Tuer-Holz
  // Tuer-Frame
  rect(g, 0, 0, T, 2, 0xd6a45c);
  rect(g, 0, 0, 2, T, 0xd6a45c);
  rect(g, T-2, 0, 2, T, 0xd6a45c);
  // Tuerklinke
  rect(g, 11, 8, 2, 2, 0xe3c44a);
  // Innenleben angedeutet
  rect(g, 4, 4, 8, 10, 0x6abf3a);
  rect(g, 5, 5, 6, 8, 0x82d44e);
}

function drawBuildingDoor(g: Phaser.GameObjects.Graphics) {
  rect(g, 0, 0, T, T, 0x8a6e4a);   // Wandfarbe
  // Tuer
  rect(g, 4, 2, 8, 14, 0x4a3522);
  // Tuer-Outline
  rect(g, 4, 2, 1, 14, 0x2d1f12);
  rect(g, 11, 2, 1, 14, 0x2d1f12);
  rect(g, 4, 2, 8, 1, 0x2d1f12);
  // Tuerklinke
  rect(g, 9, 9, 1, 1, 0xe3c44a);
}

function drawMarketStand(g: Phaser.GameObjects.Graphics) {
  rect(g, 0, 0, T, T, 0x6abf3a);  // Gras-Hintergrund
  // Tisch
  rect(g, 1, 8, 14, 6, 0xc94a4a);
  rect(g, 1, 8, 14, 2, 0xff7e7e);
  // Tisch-Beine
  rect(g, 2, 14, 1, 2, 0x553e2d);
  rect(g, 13, 14, 1, 2, 0x553e2d);
  // Waren auf Tisch
  rect(g, 4, 5, 2, 3, 0xfcd95c);   // Sonnenblumen-Samen
  rect(g, 8, 5, 2, 3, 0xff5c5c);   // Tomaten
  rect(g, 12, 5, 1, 3, 0xb87838);
  // Schirm
  rect(g, 0, 0, T, 2, 0x4a78c8);
  rect(g, 7, 1, 2, 8, 0x553e2d);
}

function drawSign(g: Phaser.GameObjects.Graphics) {
  rect(g, 0, 0, T, T, 0x6abf3a);  // Gras-Hintergrund
  // Schild-Pol
  rect(g, 7, 8, 2, 8, 0x553e2d);
  // Schild-Brett
  rect(g, 2, 2, 12, 7, 0xe3c44a);
  rect(g, 2, 2, 12, 1, 0xb89438);
  rect(g, 2, 8, 12, 1, 0xb89438);
  // Text-Andeutung
  rect(g, 4, 4, 8, 1, 0x553e2d);
  rect(g, 4, 6, 6, 1, 0x553e2d);
}

function drawMapEdge(g: Phaser.GameObjects.Graphics) {
  // Hellgrün als Hint dass es weitergeht
  rect(g, 0, 0, T, T, 0x9be36e);
  // Pfeil-Andeutung nach unten
  rect(g, 6, 4, 4, 4, 0x4a8228);
  rect(g, 5, 8, 6, 1, 0x4a8228);
  rect(g, 6, 9, 4, 1, 0x4a8228);
  rect(g, 7, 10, 2, 1, 0x4a8228);
}

function drawFlowerBed(g: Phaser.GameObjects.Graphics) {
  rect(g, 0, 0, T, T, 0x4a8228);
  // Blumen-Cluster
  const flowers = [[3,3,0xff7eb8],[8,4,0xfcd95c],[12,3,0xff7eb8],[2,9,0xfcd95c],[7,10,0xff7eb8],[12,11,0xfcd95c],[5,13,0xff7eb8]];
  for (const [x,y,c] of flowers) {
    pix(g, x, y, c);
    pix(g, x+1, y, c);
    pix(g, x, y+1, c);
    pix(g, x+1, y+1, c);
    pix(g, x, y-1, 0x82d44e);
  }
}



function drawBromelien(g: Phaser.GameObjects.Graphics) {
  rect(g, 0, 0, T, T, 0x4a8228);
  // Bromelien-Cluster - radialer Stamm mit Blueten
  rect(g, 6, 6, 4, 4, 0xff7eb8);    // Bluete
  rect(g, 5, 5, 1, 6, 0x82d44e);    // Blatt links
  rect(g, 10, 5, 1, 6, 0x82d44e);   // Blatt rechts
  rect(g, 7, 4, 2, 1, 0xff7eb8);    // Bluete oben
  rect(g, 7, 11, 2, 1, 0x82d44e);   // Stamm unten
  // kleine zusaetzliche Bluete
  pix(g, 3, 12, 0xfcd95c);
  pix(g, 12, 12, 0xff5c5c);
}

function drawLianen(g: Phaser.GameObjects.Graphics) {
  rect(g, 0, 0, T, T, 0x4a8228);
  // Vertikale Lianen
  rect(g, 3, 0, 1, T, 0x553e2d);
  rect(g, 7, 0, 1, T, 0x6e5a3a);
  rect(g, 11, 0, 1, T, 0x553e2d);
  // Blaetter an Lianen
  rect(g, 4, 4, 2, 1, 0x82d44e);
  rect(g, 8, 8, 2, 1, 0x82d44e);
  rect(g, 12, 12, 2, 1, 0x82d44e);
  rect(g, 4, 14, 2, 1, 0x82d44e);
}

function drawTropicalBloom(g: Phaser.GameObjects.Graphics) {
  rect(g, 0, 0, T, T, 0x4a8228);
  // Grosse tropische Bluete
  rect(g, 6, 4, 4, 4, 0xff5c5c);
  rect(g, 5, 5, 6, 2, 0xff7e7e);
  rect(g, 7, 3, 2, 1, 0xff5c5c);
  rect(g, 7, 8, 2, 1, 0xff5c5c);
  // Stiel und Blaetter
  rect(g, 7, 9, 2, 6, 0x82d44e);
  rect(g, 5, 11, 2, 1, 0x6abf3a);
  rect(g, 9, 13, 2, 1, 0x6abf3a);
}

const DRAWERS: Array<(g: Phaser.GameObjects.Graphics) => void> = [
  drawGrass,           // 0
  drawPath,            // 1
  drawTallGrass,       // 2
  drawWater,           // 3
  drawTree,            // 4
  drawWall,            // 5
  drawRoof,            // 6
  drawGardenDoor,      // 7
  drawBuildingDoor,    // 8
  drawMarketStand,     // 9
  drawSign,            // 10
  drawMapEdge,         // 11
  drawFlowerBed,       // 12
  drawBromelien,       // 13
  drawLianen,          // 14
  drawTropicalBloom    // 15
];

export function generateTilesetTextures(scene: Phaser.Scene, baseKey: string = 'tile'): void {
  for (let i = 0; i < DRAWERS.length; i++) {
    const key = `${baseKey}-${i}`;
    if (scene.textures.exists(key)) {
      scene.textures.remove(key);
    }
    const g = scene.add.graphics({ x: 0, y: 0 });
    g.setVisible(false);
    DRAWERS[i](g);
    g.generateTexture(key, T, T);
    g.destroy();
  }
}

export function getTileTextureKey(tileIndex: number, baseKey: string = 'tile'): string {
  return `${baseKey}-${tileIndex}`;
}
