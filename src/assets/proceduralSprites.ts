import Phaser from 'phaser';

/**
 * Generiert procedurale 16x16 Pixel-Art-Sprites zur Runtime.
 * Verwendet Phaser-Graphics um Texturen zu zeichnen, dann generateTexture
 * um sie in den Phaser-Texture-Manager zu schreiben.
 *
 * Ersatz fuer echte PixelLab-Sprites bis das Budget verfuegbar ist.
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
 * Zeichnet einen 16x16 Character-Sprite in einer Phaser-Graphics.
 * Layout (16x16):
 *  - Kopf: rows 1-5, cols 5-10 (mit Outline)
 *  - Body/Torso: rows 6-11, cols 5-10
 *  - Beine: rows 12-15, cols 5-10
 *  - Arme an den Seiten
 *
 * dir: Blickrichtung
 * frame: 0=Idle, 1=Walk-Step-A, 2=Walk-Step-B
 */
function drawCharacter(
  g: Phaser.GameObjects.Graphics,
  dir: 'down' | 'up' | 'left' | 'right',
  frame: number,
  opts: PlayerSpriteOptions
): void {
  const { bodyColor, headColor, outlineColor, shoeColor, hairColor } = opts;
  const hair = hairColor ?? 0x3a2d1c;

  // Rendering-Stil: matt, wenige Farben, Pokemon-Rot-Vibe
  const px = (x: number, y: number, color: number) => {
    g.fillStyle(color, 1);
    g.fillRect(x, y, 1, 1);
  };

  // Outline-Helper: zeichnet block mit outline drumherum
  const block = (x: number, y: number, w: number, h: number, fill: number) => {
    g.fillStyle(fill, 1);
    g.fillRect(x, y, w, h);
  };

  // Walking-Offset fuer Beine
  let leftLegY = 12;
  let rightLegY = 12;
  if (frame === 1) { leftLegY = 13; }
  if (frame === 2) { rightLegY = 13; }

  // Outline (head)
  block(5, 1, 6, 1, outlineColor);   // top
  block(4, 2, 1, 4, outlineColor);   // left
  block(11, 2, 1, 4, outlineColor);  // right
  block(5, 6, 6, 1, outlineColor);   // chin

  // Hair (top of head)
  block(5, 2, 6, 2, hair);

  // Skin (face)
  block(5, 4, 6, 2, headColor);

  // Eyes (frame-abhaengig idle hat klare Augen)
  if (dir === 'down') {
    px(6, 5, outlineColor);
    px(9, 5, outlineColor);
  } else if (dir === 'up') {
    // Hinterkopf, keine Augen, mehr Haar
    block(5, 4, 6, 2, hair);
  } else if (dir === 'left') {
    px(6, 5, outlineColor);
  } else {
    px(9, 5, outlineColor);
  }

  // Body / Shirt
  block(5, 7, 6, 4, outlineColor);   // outline
  block(5, 7, 6, 4, bodyColor);
  // Shirt-Belt
  block(5, 10, 6, 1, outlineColor);

  // Arme (vereinfacht, am Rand des Bodies)
  if (dir === 'left' || dir === 'right') {
    // Side-View Arms - swing differenz zw. Frames
    const armX = dir === 'left' ? 4 : 11;
    const armY = frame === 1 ? 8 : (frame === 2 ? 7 : 7);
    block(armX, armY, 1, 3, headColor);
  } else {
    // Front-View beide Arme sichtbar
    block(4, 7, 1, 3, headColor);
    block(11, 7, 1, 3, headColor);
  }

  // Beine
  block(5, leftLegY, 2, Math.max(1, 16 - leftLegY), bodyColor);
  block(9, rightLegY, 2, Math.max(1, 16 - rightLegY), bodyColor);
  // Schuhe
  block(5, 14, 2, 2, shoeColor);
  block(9, 14, 2, 2, shoeColor);

  // Outline der Beine
  block(5, leftLegY, 1, 1, outlineColor);
  block(10, rightLegY, 1, 1, outlineColor);
}

export interface CharacterAtlasEntry {
  textureKey: string;
  framesByDir: Record<'down' | 'up' | 'left' | 'right', { idle: string; walkA: string; walkB: string }>;
}

/**
 * Erzeugt einen vollstaendigen Player-Atlas mit allen Frames.
 * Nutzt scene.textures.generate(), um die Sprites in den Texture-Manager zu schreiben.
 *
 * Returns: TextureKey, dass dann in Sprites verwendet werden kann.
 */
export function generatePlayerAtlas(
  scene: Phaser.Scene,
  baseKey: string,
  opts: PlayerSpriteOptions
): CharacterAtlasEntry {
  const dirs: Array<'down' | 'up' | 'left' | 'right'> = ['down', 'up', 'left', 'right'];
  const frames: Array<{ kind: 'idle' | 'walkA' | 'walkB'; n: number }> = [
    { kind: 'idle', n: 0 },
    { kind: 'walkA', n: 1 },
    { kind: 'walkB', n: 2 }
  ];

  const framesByDir: CharacterAtlasEntry['framesByDir'] = {
    down: { idle: '', walkA: '', walkB: '' },
    up: { idle: '', walkA: '', walkB: '' },
    left: { idle: '', walkA: '', walkB: '' },
    right: { idle: '', walkA: '', walkB: '' }
  };

  for (const dir of dirs) {
    for (const fr of frames) {
      const key = `${baseKey}-${dir}-${fr.kind}`;
      if (scene.textures.exists(key)) {
        scene.textures.remove(key);
      }
      const g = scene.add.graphics({ x: 0, y: 0 });
      g.setVisible(false);
      drawCharacter(g, dir, fr.n, opts);
      g.generateTexture(key, TILE, TILE);
      g.destroy();
      framesByDir[dir][fr.kind] = key;
    }
  }

  return { textureKey: baseKey, framesByDir };
}

/**
 * NPC-Variante: gleicher Generator aber mit anderen Farben.
 */
export function generateNPCAtlas(
  scene: Phaser.Scene,
  npcId: string,
  opts: PlayerSpriteOptions
): CharacterAtlasEntry {
  return generatePlayerAtlas(scene, `npc-${npcId}`, opts);
}
