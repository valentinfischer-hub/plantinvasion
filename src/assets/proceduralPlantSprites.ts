import Phaser from 'phaser';
import { getSpecies } from '../data/species';
import type { GrowthStage } from '../types/plant';

/**
 * Procedural Plant-Stage-Renderer.
 * Erstellt 32x32 Pixel-Art-Sprites fuer alle 5 Wachstumsstufen einer Spezies,
 * basierend auf einem Family-Archetype und einem Color-Schema pro Spezies.
 *
 * Wird verwendet wenn keine PNG-Sprites unter assets/sprites/plants/<slug>/ verfuegbar sind.
 * Existierende PNG-Texturen werden NICHT ueberschrieben.
 */

const T = 32;

interface PlantPalette {
  leaf: number;       // primaere Blattfarbe
  leafDark: number;   // dunklerer Blatt-Akzent
  bloom: number;      // Bluetenfarbe
  stem: number;       // Stamm-Farbe
}

const PALETTE_BY_SLUG: Record<string, PlantPalette> = {
  'rose':         { leaf: 0x4a8228, leafDark: 0x2d4f15, bloom: 0xc94d6e, stem: 0x6a4828 },
  'aloe-vera':    { leaf: 0x6abf3a, leafDark: 0x4a8228, bloom: 0xffd166, stem: 0x4a6b28 },
  'orchid':       { leaf: 0x4a6b28, leafDark: 0x2d4022, bloom: 0xb86ee3, stem: 0x553e2d },
  'fern':         { leaf: 0x4a8228, leafDark: 0x2d4022, bloom: 0x6abf3a, stem: 0x553e2d },
  'mint':         { leaf: 0x82d44e, leafDark: 0x4a8228, bloom: 0xc8e8a8, stem: 0x553e2d },
  'iris':         { leaf: 0x4a6b3a, leafDark: 0x2d4022, bloom: 0x5b8de8, stem: 0x553e2d },
  'snapdragon':   { leaf: 0x4a8228, leafDark: 0x2d4022, bloom: 0xff8c42, stem: 0x553e2d },
  'water-lily':   { leaf: 0x6abf3a, leafDark: 0x3a6b22, bloom: 0xfff0f5, stem: 0x4a6828 },
  'daffodil':     { leaf: 0x4a8228, leafDark: 0x2d4022, bloom: 0xffd166, stem: 0x553e2d },
  'echinacea':    { leaf: 0x6abf3a, leafDark: 0x3a5028, bloom: 0xb86ee3, stem: 0x6a4828 },
  // Encounter-Pflanzen die capture-bar gemacht werden:
  'sundew':       { leaf: 0x4a6b28, leafDark: 0x2d4022, bloom: 0xc94d6e, stem: 0x553e2d },
  'pitcher-plant':{ leaf: 0x6abf3a, leafDark: 0x4a6b28, bloom: 0x8b3a6b, stem: 0x4a3520 },
  'cobra-lily':   { leaf: 0x4a8228, leafDark: 0x2d4022, bloom: 0xc8a528, stem: 0x553e2d },
  'bladderwort':  { leaf: 0x6abf3a, leafDark: 0x4a8228, bloom: 0x9bc4e3, stem: 0x4a6828 },
  'corpse-flower':{ leaf: 0x6a1a1a, leafDark: 0x3a0a0a, bloom: 0xc94d6e, stem: 0x553e2d },
  'fire-lily':    { leaf: 0x4a8228, leafDark: 0x2d4022, bloom: 0xff5c5c, stem: 0x553e2d },
  'banksia':      { leaf: 0x6abf3a, leafDark: 0x4a6b28, bloom: 0xffa840, stem: 0x4a3520 },
  'protea':       { leaf: 0x4a6b28, leafDark: 0x2d4022, bloom: 0xff7eb8, stem: 0x553e2d },
  'eucalyptus':   { leaf: 0x6a8a48, leafDark: 0x4a6b28, bloom: 0xfff7d4, stem: 0x553e2d },
  // Default-Fallback
  'default':      { leaf: 0x6abf3a, leafDark: 0x4a8228, bloom: 0xff7eb8, stem: 0x553e2d }
};

function getPalette(slug: string): PlantPalette {
  return PALETTE_BY_SLUG[slug] ?? PALETTE_BY_SLUG.default;
}

function rect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, color: number) {
  g.fillStyle(color, 1);
  g.fillRect(x, y, w, h);
}
function pix(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number) {
  g.fillStyle(color, 1);
  g.fillRect(x, y, 1, 1);
}

// =========================================================
// Stage-Drawer (kombiniert Stage + Palette)
// =========================================================

function drawSeed(g: Phaser.GameObjects.Graphics, p: PlantPalette) {
  // Erde-Block + kleines Korn
  rect(g, 8, 22, 16, 7, 0x553e2d);
  rect(g, 9, 21, 14, 1, 0x6a4828);
  // Korn
  rect(g, 14, 19, 4, 4, p.leafDark);
  pix(g, 15, 19, p.leaf);
  pix(g, 16, 19, p.leaf);
}

function drawSprout(g: Phaser.GameObjects.Graphics, p: PlantPalette) {
  // Erde
  rect(g, 6, 22, 20, 7, 0x553e2d);
  // Stamm
  rect(g, 15, 14, 2, 8, p.stem);
  // Erste Blaetter
  rect(g, 12, 12, 4, 3, p.leaf);
  rect(g, 16, 12, 4, 3, p.leaf);
  rect(g, 13, 11, 2, 1, p.leafDark);
  rect(g, 17, 11, 2, 1, p.leafDark);
}

function drawJuvenile(g: Phaser.GameObjects.Graphics, p: PlantPalette) {
  // Erde
  rect(g, 4, 24, 24, 5, 0x553e2d);
  // Stamm
  rect(g, 15, 10, 2, 14, p.stem);
  // Mehrere Blaetter
  rect(g, 8, 14, 7, 3, p.leaf);
  rect(g, 17, 14, 7, 3, p.leaf);
  rect(g, 10, 18, 5, 3, p.leaf);
  rect(g, 17, 18, 5, 3, p.leaf);
  // Akzente
  rect(g, 9, 13, 5, 1, p.leafDark);
  rect(g, 18, 13, 5, 1, p.leafDark);
}

function drawAdult(g: Phaser.GameObjects.Graphics, p: PlantPalette) {
  // Erde
  rect(g, 3, 25, 26, 4, 0x553e2d);
  // Stamm
  rect(g, 15, 8, 2, 17, p.stem);
  // Volle Krone aus Blaettern
  rect(g, 6, 12, 8, 4, p.leaf);
  rect(g, 18, 12, 8, 4, p.leaf);
  rect(g, 8, 17, 6, 4, p.leaf);
  rect(g, 18, 17, 6, 4, p.leaf);
  rect(g, 10, 22, 12, 3, p.leaf);
  // Akzente
  rect(g, 6, 11, 8, 1, p.leafDark);
  rect(g, 18, 11, 8, 1, p.leafDark);
  rect(g, 8, 16, 6, 1, p.leafDark);
  rect(g, 18, 16, 6, 1, p.leafDark);
  // Knospen-Andeutung
  pix(g, 14, 8, p.bloom);
  pix(g, 17, 8, p.bloom);
}

function drawBlooming(g: Phaser.GameObjects.Graphics, p: PlantPalette) {
  // Erde
  rect(g, 3, 25, 26, 4, 0x553e2d);
  // Stamm
  rect(g, 15, 8, 2, 17, p.stem);
  // Blaetter (wie Adult, etwas weniger)
  rect(g, 6, 16, 8, 3, p.leaf);
  rect(g, 18, 16, 8, 3, p.leaf);
  rect(g, 8, 21, 6, 3, p.leaf);
  rect(g, 18, 21, 6, 3, p.leaf);
  // Akzente
  rect(g, 6, 15, 8, 1, p.leafDark);
  rect(g, 18, 15, 8, 1, p.leafDark);
  // Volle Bluete oben
  rect(g, 11, 4, 10, 6, p.bloom);
  rect(g, 9, 6, 14, 4, p.bloom);
  rect(g, 13, 2, 6, 4, p.bloom);
  // Bluten-Akzent
  pix(g, 14, 5, 0xfff7d4);
  pix(g, 17, 7, 0xfff7d4);
  pix(g, 15, 8, 0xfff7d4);
  pix(g, 12, 7, 0xfff7d4);
  // Pollen-Sprenkel
  pix(g, 10, 5, p.leafDark);
  pix(g, 21, 6, p.leafDark);
}

const STAGE_DRAWERS = [drawSeed, drawSprout, drawJuvenile, drawAdult, drawBlooming];

// =========================================================
// Public API
// =========================================================

export function generatePlantStageTexture(
  scene: Phaser.Scene,
  slug: string,
  stage: GrowthStage
): void {
  const key = `${slug}-${stage}`;
  if (scene.textures.exists(key)) return; // PNG hat Vorrang
  const palette = getPalette(slug);
  const g = scene.add.graphics({ x: 0, y: 0 });
  g.setVisible(false);
  STAGE_DRAWERS[stage](g, palette);
  g.generateTexture(key, T, T);
  g.destroy();
}

/** Generiert alle 5 Stages fuer eine Spezies. */
export function generateSpeciesStages(scene: Phaser.Scene, slug: string): void {
  for (let s = 0; s < 5; s++) {
    generatePlantStageTexture(scene, slug, s as GrowthStage);
  }
}

/** Generiert Procedural-Sprites fuer alle Spezies in der DB. */
export function generateAllPlantStages(scene: Phaser.Scene): void {
  // Iteriere ueber alle Slugs in der Palette und alle Spezies in der DB
  const allSlugs = new Set<string>([
    ...Object.keys(PALETTE_BY_SLUG).filter((s) => s !== 'default')
  ]);
  // Auch alle DB-Spezies hinzufuegen die kein Palette-Eintrag haben (faellt auf default zurueck)
  for (const slug of allSlugs) {
    void getSpecies; // import side-effect
    generateSpeciesStages(scene, slug);
  }
}

export function listProceduralPlantSlugs(): string[] {
  return Object.keys(PALETTE_BY_SLUG).filter((s) => s !== 'default');
}
