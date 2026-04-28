import Phaser from 'phaser';

/**
 * Generiert procedurale 16x16 Pixel-Art-Sprites zur Runtime.
 * Verwendet Phaser-Graphics um Texturen zu zeichnen, dann generateTexture
 * um sie in den Phaser-Texture-Manager zu schreiben.
 *
 * S-POLISH Run-1: Verbessert auf 8 Walk-Frames, smoother Easing,
 * besser Pixel-Art-Qualitaet (Arm-Swing, Bein-Alternation, Head-Bob).
 */

interface PlayerSpriteOptions {
  bodyColor: number;
  headColor: number;
  outlineColor: number;
  shoeColor: number;
  hairColor?: number;
}

const TILE = 16;

/**
 * Sine-Easing Approximation fuer 0..1 -> 0..1 (smooth Bogen).
 * Ersetzt lineares Walking durch organischeres Gefuehl.
 */
function sineEase(t: number): number {
  return (1 - Math.cos(t * Math.PI)) / 2;
}

/**
 * Zeichnet einen 16x16 Character-Sprite mit 8-Frame-Walking-Cycle.
 *
 * Frame-Cycle (0-7):
 *  0 = Idle (neutral)
 *  1 = Walk-Step-A1 (linkes Bein vor)
 *  2 = Walk-Step-A2 (linkes Bein voll vorne, Bob-Peak)
 *  3 = Walk-Step-A3 (linkes Bein zurueck, Bob-sinkt)
 *  4 = Walk-MidStep (neutral, beide Beine gleich)
 *  5 = Walk-Step-B1 (rechtes Bein vor)
 *  6 = Walk-Step-B2 (rechtes Bein voll vorne, Bob-Peak)
 *  7 = Walk-Step-B3 (rechtes Bein zurueck, Bob-sinkt)
 *
 * dir: Blickrichtung
 */
function drawCharacter(
  g: Phaser.GameObjects.Graphics,
  dir: 'down' | 'up' | 'left' | 'right',
  frame: number,
  opts: PlayerSpriteOptions
): void {
  const { bodyColor, headColor, outlineColor, shoeColor, hairColor } = opts;
  const hair = hairColor ?? 0x3a2d1c;

  const px = (x: number, y: number, color: number) => {
    g.fillStyle(color, 1);
    g.fillRect(x, y, 1, 1);
  };

  const block = (x: number, y: number, w: number, h: number, fill: number) => {
    g.fillStyle(fill, 1);
    g.fillRect(x, y, w, h);
  };

  // --- Leg-Offset-Berechnung (8-Frame-Cycle) ---
  // t = 0..1 innerhalb des halben Zyklus (Sine-Eased)
  let leftLegOffset = 0;   // positiv = tiefer
  let rightLegOffset = 0;
  let bodyBob = 0;          // vertikaler Body-Bob in Pixel (0..-1)
  let armSwingLeft = 0;     // Arm-Y-Offset links
  let armSwingRight = 0;    // Arm-Y-Offset rechts

  if (frame === 0) {
    // Idle: neutral
    leftLegOffset = 0; rightLegOffset = 0; bodyBob = 0;
  } else if (frame === 1) {
    // A1: linkes Bein beginnt nach vorne
    const t = sineEase(0.33);
    leftLegOffset = -Math.round(t * 2);
    rightLegOffset = Math.round(t * 1);
    bodyBob = -1;
    armSwingLeft = 1; armSwingRight = -1;
  } else if (frame === 2) {
    // A2: linkes Bein voll vorne (Peak), rechtes Bein hinten
    leftLegOffset = -2;
    rightLegOffset = 2;
    bodyBob = -1;
    armSwingLeft = 2; armSwingRight = -2;
  } else if (frame === 3) {
    // A3: linkes Bein kehrt zurueck, Bob sinkt
    const t = sineEase(0.67);
    leftLegOffset = -Math.round(t * 1);
    rightLegOffset = Math.round(t * 1);
    bodyBob = 0;
    armSwingLeft = 1; armSwingRight = -1;
  } else if (frame === 4) {
    // MidStep: neutral, beide Beine gleich, kurzer Bob
    leftLegOffset = 0; rightLegOffset = 0; bodyBob = 0;
  } else if (frame === 5) {
    // B1: rechtes Bein beginnt nach vorne
    const t = sineEase(0.33);
    rightLegOffset = -Math.round(t * 2);
    leftLegOffset = Math.round(t * 1);
    bodyBob = -1;
    armSwingRight = 1; armSwingLeft = -1;
  } else if (frame === 6) {
    // B2: rechtes Bein voll vorne (Peak)
    rightLegOffset = -2;
    leftLegOffset = 2;
    bodyBob = -1;
    armSwingRight = 2; armSwingLeft = -2;
  } else if (frame === 7) {
    // B3: rechtes Bein kehrt zurueck
    const t = sineEase(0.67);
    rightLegOffset = -Math.round(t * 1);
    leftLegOffset = Math.round(t * 1);
    bodyBob = 0;
    armSwingRight = 1; armSwingLeft = -1;
  }

  const bodyTopY = 7 + bodyBob;

  // --- Kopf ---
  // Outline
  block(5, 1 + bodyBob, 6, 1, outlineColor);  // oben
  block(4, 2 + bodyBob, 1, 4, outlineColor);  // links
  block(11, 2 + bodyBob, 1, 4, outlineColor); // rechts
  block(5, 6 + bodyBob, 6, 1, outlineColor);  // kinn

  // Haar
  block(5, 2 + bodyBob, 6, 2, hair);

  // Haut Gesicht
  block(5, 4 + bodyBob, 6, 2, headColor);

  // Augen (direction-abhaengig)
  if (dir === 'down') {
    px(6, 5 + bodyBob, outlineColor);
    px(9, 5 + bodyBob, outlineColor);
    // Mund-Pixel bei Walk-Frames (happy bob)
    if (frame % 2 === 0) px(7, 5 + bodyBob, headColor);
  } else if (dir === 'up') {
    block(5, 4 + bodyBob, 6, 2, hair); // Hinterkopf
    // Rand-Highlights
    px(5, 3 + bodyBob, hair);
    px(10, 3 + bodyBob, hair);
  } else if (dir === 'left') {
    px(6, 5 + bodyBob, outlineColor);
    // Nase-Andeutung
    px(5, 5 + bodyBob, headColor);
  } else { // right
    px(9, 5 + bodyBob, outlineColor);
    px(10, 5 + bodyBob, headColor);
  }

  // --- Body / Shirt ---
  block(5, bodyTopY, 6, 3, outlineColor);  // Outline als Shirt-Schatten
  block(5, bodyTopY, 6, 3, bodyColor);
  // Shirt-Detail: Kragen
  block(7, bodyTopY, 2, 1, outlineColor);
  // Belt
  block(5, bodyTopY + 3, 6, 1, outlineColor);

  // --- Arme ---
  if (dir === 'left' || dir === 'right') {
    const armX = dir === 'left' ? 4 : 11;
    const swingVal = dir === 'left' ? armSwingLeft : armSwingRight;
    const armY = bodyTopY + Math.max(-1, Math.min(1, swingVal));
    block(armX, armY, 1, 3, headColor);
    // Handschuh / Hand-Detail
    px(armX, armY + 3, outlineColor);
  } else {
    // Beide Arme sichtbar: swing gegenlaeufig
    const ly = bodyTopY + Math.max(-1, Math.min(1, armSwingLeft));
    const ry = bodyTopY + Math.max(-1, Math.min(1, armSwingRight));
    block(4, ly, 1, 3, headColor);
    px(4, ly + 3, outlineColor);
    block(11, ry, 1, 3, headColor);
    px(11, ry + 3, outlineColor);
  }

  // --- Beine ---
  const leftLegBaseY = bodyTopY + 3;
  const rightLegBaseY = bodyTopY + 3;
  const llY = leftLegBaseY + leftLegOffset;
  const rlY = rightLegBaseY + rightLegOffset;

  block(5, llY, 2, Math.max(1, 15 - llY), bodyColor);
  block(9, rlY, 2, Math.max(1, 15 - rlY), bodyColor);

  // Schuh-Detail: dunklerer Schatten
  const shoeHighlight = Math.min(shoeColor + 0x111111, 0xffffff);
  block(5, 14, 2, 2, shoeColor);
  block(9, 14, 2, 2, shoeColor);
  px(5, 14, shoeHighlight);
  px(9, 14, shoeHighlight);

  // Bein-Outline
  px(5, llY, outlineColor);
  px(10, rlY, outlineColor);
}

export interface CharacterAtlasEntry {
  textureKey: string;
  framesByDir: Record<'down' | 'up' | 'left' | 'right', {
    idle: string;
    walkA: string;
    walkB: string;
    walk: string[];  // alle 8 Frames fuer smoother Animation
  }>;
}

/**
 * Erzeugt einen vollstaendigen Player-Atlas mit 8 Walk-Frames pro Richtung.
 * Backward-kompatibel: idle, walkA, walkB bleiben als Shortcuts erhalten.
 */
export function generatePlayerAtlas(
  scene: Phaser.Scene,
  baseKey: string,
  opts: PlayerSpriteOptions
): CharacterAtlasEntry {
  const dirs: Array<'down' | 'up' | 'left' | 'right'> = ['down', 'up', 'left', 'right'];
  const FRAME_COUNT = 8;

  const framesByDir: CharacterAtlasEntry['framesByDir'] = {
    down: { idle: '', walkA: '', walkB: '', walk: [] },
    up: { idle: '', walkA: '', walkB: '', walk: [] },
    left: { idle: '', walkA: '', walkB: '', walk: [] },
    right: { idle: '', walkA: '', walkB: '', walk: [] }
  };

  for (const dir of dirs) {
    const walkFrameKeys: string[] = [];
    for (let f = 0; f < FRAME_COUNT; f++) {
      const key = `${baseKey}-${dir}-f${f}`;
      if (scene.textures.exists(key)) {
        scene.textures.remove(key);
      }
      const g = scene.add.graphics({ x: 0, y: 0 });
      g.setVisible(false);
      drawCharacter(g, dir, f, opts);
      g.generateTexture(key, TILE, TILE);
      g.destroy();
      walkFrameKeys.push(key);
    }
    framesByDir[dir] = {
      idle: walkFrameKeys[0],
      walkA: walkFrameKeys[2],   // Peak linkes Bein
      walkB: walkFrameKeys[6],   // Peak rechtes Bein
      walk: walkFrameKeys
    };
  }

  return { textureKey: baseKey, framesByDir };
}

/**
 * NPC-Variante: gleicher Generator aber mit npc-Prefix.
 */
export function generateNPCAtlas(
  scene: Phaser.Scene,
  npcId: string,
  opts: PlayerSpriteOptions
): CharacterAtlasEntry {
  return generatePlayerAtlas(scene, `npc-${npcId}`, opts);
}
