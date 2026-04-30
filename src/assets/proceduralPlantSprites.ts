import Phaser from 'phaser';
import { getAllSpeciesSlugs } from '../data/species';
import type { GrowthStage } from '../types/plant';

/**
 * Procedural Plant-Stage-Renderer (V0.6, 50+ Spezies).
 *
 * Erstellt 32x32 Pixel-Art-Sprites fuer alle 5 Wachstumsstufen einer Spezies,
 * basierend auf einem Family-Archetype und einem Color-Schema pro Spezies.
 */

const T = 32;

interface PlantPalette {
  leaf: number;
  leafDark: number;
  bloom: number;
  stem: number;
  /** Optional: Variations-Hint fuer Stage-Drawer (cactus, fern, vine, etc.). */
  archetype?: 'flower' | 'cactus' | 'fern' | 'tree' | 'sukkulent' | 'carnivore' | 'aquatic';
}

const PALETTE_BY_SLUG: Record<string, PlantPalette> = {
  // V0.1
  'sunflower':      { leaf: 0x6abf3a, leafDark: 0x4a8228, bloom: 0xffd166, stem: 0x4a6b28, archetype: 'flower' },
  'spike-cactus':   { leaf: 0x4a8228, leafDark: 0x2d4f15, bloom: 0xffd166, stem: 0x4a6b28, archetype: 'cactus' },
  'venus-flytrap':  { leaf: 0x6abf3a, leafDark: 0x2d4022, bloom: 0xc94d6e, stem: 0x553e2d, archetype: 'carnivore' },
  'lavender':       { leaf: 0x6abf3a, leafDark: 0x4a8228, bloom: 0xb86ee3, stem: 0x4a6b28, archetype: 'flower' },
  'tomato-plant':   { leaf: 0x4a8228, leafDark: 0x2d4022, bloom: 0xff5c5c, stem: 0x553e2d, archetype: 'flower' },
  // V0.5 Standard
  'rose':           { leaf: 0x4a8228, leafDark: 0x2d4f15, bloom: 0xc94d6e, stem: 0x6a4828, archetype: 'flower' },
  'aloe-vera':      { leaf: 0x6abf3a, leafDark: 0x4a8228, bloom: 0xffd166, stem: 0x4a6b28, archetype: 'sukkulent' },
  'orchid':         { leaf: 0x4a6b28, leafDark: 0x2d4022, bloom: 0xb86ee3, stem: 0x553e2d, archetype: 'flower' },
  'fern':           { leaf: 0x4a8228, leafDark: 0x2d4022, bloom: 0x6abf3a, stem: 0x553e2d, archetype: 'fern' },
  'mint':           { leaf: 0x82d44e, leafDark: 0x4a8228, bloom: 0xc8e8a8, stem: 0x553e2d, archetype: 'fern' },
  'iris':           { leaf: 0x4a6b3a, leafDark: 0x2d4022, bloom: 0x5b8de8, stem: 0x553e2d, archetype: 'flower' },
  'snapdragon':     { leaf: 0x4a8228, leafDark: 0x2d4022, bloom: 0xff8c42, stem: 0x553e2d, archetype: 'flower' },
  'water-lily':     { leaf: 0x6abf3a, leafDark: 0x3a6b22, bloom: 0xfff0f5, stem: 0x4a6828, archetype: 'aquatic' },
  'daffodil':       { leaf: 0x4a8228, leafDark: 0x2d4022, bloom: 0xffd166, stem: 0x553e2d, archetype: 'flower' },
  'echinacea':      { leaf: 0x6abf3a, leafDark: 0x3a5028, bloom: 0xb86ee3, stem: 0x6a4828, archetype: 'flower' },
  // Verdanto
  'monstera':       { leaf: 0x3d6a28, leafDark: 0x2a4d18, bloom: 0xfff7d4, stem: 0x4a3520, archetype: 'tree' },
  'bird-of-paradise':{leaf: 0x4a6b28, leafDark: 0x2d4022, bloom: 0xff8c42, stem: 0x6a5028, archetype: 'flower' },
  'philodendron':   { leaf: 0x4a8228, leafDark: 0x3a5028, bloom: 0xffd166, stem: 0x553e2d, archetype: 'fern' },
  'heliconia':      { leaf: 0x6abf3a, leafDark: 0x4a8228, bloom: 0xff5c5c, stem: 0x553e2d, archetype: 'flower' },
  'bromeliad':      { leaf: 0x6abf3a, leafDark: 0x4a8228, bloom: 0xff7eb8, stem: 0x553e2d, archetype: 'flower' },
  // Kaktoria
  'saguaro':        { leaf: 0x4a8228, leafDark: 0x2d4f15, bloom: 0xfff7d4, stem: 0x4a6b28, archetype: 'cactus' },
  'barrel-cactus':  { leaf: 0x6abf3a, leafDark: 0x4a8228, bloom: 0xc94d6e, stem: 0x4a6b28, archetype: 'cactus' },
  'desert-rose':    { leaf: 0x6a8a48, leafDark: 0x4a6828, bloom: 0xff5c5c, stem: 0x6a4828, archetype: 'sukkulent' },
  'joshua-tree':    { leaf: 0x4a6b28, leafDark: 0x2d4022, bloom: 0xfff7d4, stem: 0x553e2d, archetype: 'tree' },
  'agave':          { leaf: 0x82a868, leafDark: 0x4a6828, bloom: 0xffd166, stem: 0x4a6b28, archetype: 'sukkulent' },
  // Frostkamm
  'edelweiss':      { leaf: 0x6a8a68, leafDark: 0x4a6848, bloom: 0xfff0f5, stem: 0x4a6828, archetype: 'flower' },
  'snowdrop':       { leaf: 0x4a8228, leafDark: 0x2d4022, bloom: 0xfff0f5, stem: 0x4a6828, archetype: 'flower' },
  'alpine-gentian': { leaf: 0x4a6b28, leafDark: 0x2d4022, bloom: 0x5b8de8, stem: 0x553e2d, archetype: 'flower' },
  'crocus':         { leaf: 0x4a8228, leafDark: 0x2d4022, bloom: 0xb86ee3, stem: 0x553e2d, archetype: 'flower' },
  'mountain-pine':  { leaf: 0x3d5028, leafDark: 0x2a3a18, bloom: 0x6a5028, stem: 0x4a3520, archetype: 'tree' },
  // Salzbucht
  'sea-thrift':     { leaf: 0x6abf3a, leafDark: 0x4a8228, bloom: 0xff7eb8, stem: 0x553e2d, archetype: 'flower' },
  'sea-holly':      { leaf: 0x6a8a68, leafDark: 0x4a6848, bloom: 0x5b8de8, stem: 0x4a6828, archetype: 'flower' },
  'mangrove':       { leaf: 0x3d5028, leafDark: 0x2a3a18, bloom: 0xfff7d4, stem: 0x4a3520, archetype: 'tree' },
  'sea-grape':      { leaf: 0x4a8228, leafDark: 0x2d4022, bloom: 0xb86ee3, stem: 0x6a4828, archetype: 'tree' },
  'beach-aster':    { leaf: 0x6abf3a, leafDark: 0x4a8228, bloom: 0xfff0f5, stem: 0x553e2d, archetype: 'flower' },
  // Mordwald
  'sundew':         { leaf: 0x4a6b28, leafDark: 0x2d4022, bloom: 0xc94d6e, stem: 0x553e2d, archetype: 'carnivore' },
  'pitcher-plant':  { leaf: 0x6abf3a, leafDark: 0x4a6b28, bloom: 0x8b3a6b, stem: 0x4a3520, archetype: 'carnivore' },
  'cobra-lily':     { leaf: 0x4a8228, leafDark: 0x2d4022, bloom: 0xc8a528, stem: 0x553e2d, archetype: 'carnivore' },
  'bladderwort':    { leaf: 0x6abf3a, leafDark: 0x4a8228, bloom: 0x9bc4e3, stem: 0x4a6828, archetype: 'aquatic' },
  'corpse-flower':  { leaf: 0x6a1a1a, leafDark: 0x3a0a0a, bloom: 0xc94d6e, stem: 0x553e2d, archetype: 'carnivore' },
  // Magmabluete
  'fire-lily':      { leaf: 0x4a8228, leafDark: 0x2d4022, bloom: 0xff5c5c, stem: 0x553e2d, archetype: 'flower' },
  'banksia':        { leaf: 0x6abf3a, leafDark: 0x4a6b28, bloom: 0xffa840, stem: 0x4a3520, archetype: 'tree' },
  'serotinous-pine':{ leaf: 0x3d5028, leafDark: 0x2a3a18, bloom: 0x6a4828, stem: 0x4a3520, archetype: 'tree' },
  'protea':         { leaf: 0x4a6b28, leafDark: 0x2d4022, bloom: 0xff7eb8, stem: 0x553e2d, archetype: 'flower' },
  'eucalyptus':     { leaf: 0x6a8a48, leafDark: 0x4a6b28, bloom: 0xfff7d4, stem: 0x553e2d, archetype: 'tree' },
  // Wurzelheim Garden
  'tulip':          { leaf: 0x6abf3a, leafDark: 0x4a8228, bloom: 0xff5c5c, stem: 0x553e2d, archetype: 'flower' },
  'peony':          { leaf: 0x4a8228, leafDark: 0x2d4022, bloom: 0xff7eb8, stem: 0x553e2d, archetype: 'flower' },
  'hydrangea':      { leaf: 0x6abf3a, leafDark: 0x4a8228, bloom: 0x5b8de8, stem: 0x4a6828, archetype: 'flower' },
  'sage':           { leaf: 0x82a868, leafDark: 0x4a8228, bloom: 0xb86ee3, stem: 0x553e2d, archetype: 'fern' },
  'thyme':          { leaf: 0x82a868, leafDark: 0x4a8228, bloom: 0xfff0f5, stem: 0x553e2d, archetype: 'fern' },
  // V0.6.5 Hybrid-Spezies (visuell gemischte Paletten zwischen Eltern)
  'sun-rose':         { leaf: 0x5aa030, leafDark: 0x3d6818, bloom: 0xffa840, stem: 0x553e2d, archetype: 'flower' },     // Sunflower x Rose
  'fang-orchid':      { leaf: 0x5aa030, leafDark: 0x2d4022, bloom: 0xa84d8e, stem: 0x553e2d, archetype: 'carnivore' }, // Venus x Orchid
  'mint-lavender':    { leaf: 0x82d44e, leafDark: 0x4a8228, bloom: 0xc8a8e8, stem: 0x4a6b28, archetype: 'fern' },      // Lavender x Mint
  'spike-aloe':       { leaf: 0x6abf3a, leafDark: 0x4a8228, bloom: 0xffd166, stem: 0x4a6b28, archetype: 'cactus' },    // Cactus x Aloe
  'water-iris':       { leaf: 0x6abf3a, leafDark: 0x3a6b22, bloom: 0x6b9de8, stem: 0x4a6828, archetype: 'aquatic' },   // Lily x Iris
  'fire-tomato':      { leaf: 0x4a8228, leafDark: 0x2d4022, bloom: 0xff7e3a, stem: 0x553e2d, archetype: 'flower' },    // Tomato x Snapdragon
  'sun-pitcher':      { leaf: 0x5aa030, leafDark: 0x3d5028, bloom: 0xa64a7e, stem: 0x4a3520, archetype: 'carnivore' }, // Sundew x Pitcher
  'flame-banksia':    { leaf: 0x6abf3a, leafDark: 0x4a6b28, bloom: 0xff7e3a, stem: 0x4a3520, archetype: 'tree' },      // Fire-Lily x Banksia
  'frost-edelweiss':  { leaf: 0x7a9a78, leafDark: 0x4a6848, bloom: 0xe8f0fa, stem: 0x4a6828, archetype: 'flower' },    // Edelweiss x Snowdrop
  'rose-saguaro':     { leaf: 0x4a8228, leafDark: 0x2d4f15, bloom: 0xff5c5c, stem: 0x4a6b28, archetype: 'cactus' },    // Saguaro x Desert-Rose
  // Default-Fallback
  'default':          { leaf: 0x6abf3a, leafDark: 0x4a8228, bloom: 0xff7eb8, stem: 0x553e2d, archetype: 'flower' }
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
// Stage-Drawer (kombiniert Stage + Palette + Archetype)
// =========================================================

function drawSeed(g: Phaser.GameObjects.Graphics, p: PlantPalette) {
  rect(g, 8, 22, 16, 7, 0x553e2d);
  rect(g, 9, 21, 14, 1, 0x6a4828);
  rect(g, 14, 19, 4, 4, p.leafDark);
  pix(g, 15, 19, p.leaf);
  pix(g, 16, 19, p.leaf);
}

function drawSprout(g: Phaser.GameObjects.Graphics, p: PlantPalette) {
  rect(g, 6, 22, 20, 7, 0x553e2d);
  rect(g, 15, 14, 2, 8, p.stem);
  rect(g, 12, 12, 4, 3, p.leaf);
  rect(g, 16, 12, 4, 3, p.leaf);
  rect(g, 13, 11, 2, 1, p.leafDark);
  rect(g, 17, 11, 2, 1, p.leafDark);
}

function drawJuvenile(g: Phaser.GameObjects.Graphics, p: PlantPalette) {
  rect(g, 4, 24, 24, 5, 0x553e2d);
  if (p.archetype === 'cactus') {
    // Vertikaler Block mit Stacheln
    rect(g, 12, 10, 8, 14, p.leaf);
    rect(g, 12, 10, 8, 2, p.leafDark);
    for (let y = 12; y < 24; y += 3) {
      pix(g, 11, y, 0xffffff);
      pix(g, 20, y, 0xffffff);
    }
  } else if (p.archetype === 'tree') {
    // Stamm + Krone
    rect(g, 14, 14, 4, 10, p.stem);
    rect(g, 8, 8, 16, 8, p.leaf);
    rect(g, 8, 7, 16, 1, p.leafDark);
  } else {
    rect(g, 15, 10, 2, 14, p.stem);
    rect(g, 8, 14, 7, 3, p.leaf);
    rect(g, 17, 14, 7, 3, p.leaf);
    rect(g, 10, 18, 5, 3, p.leaf);
    rect(g, 17, 18, 5, 3, p.leaf);
    rect(g, 9, 13, 5, 1, p.leafDark);
    rect(g, 18, 13, 5, 1, p.leafDark);
  }
}

function drawAdult(g: Phaser.GameObjects.Graphics, p: PlantPalette) {
  rect(g, 3, 25, 26, 4, 0x553e2d);
  if (p.archetype === 'cactus') {
    rect(g, 11, 6, 10, 19, p.leaf);
    rect(g, 11, 6, 10, 2, p.leafDark);
    for (let y = 8; y < 25; y += 3) {
      pix(g, 10, y, 0xffffff);
      pix(g, 21, y, 0xffffff);
    }
    pix(g, 16, 4, p.bloom);
    pix(g, 15, 4, p.bloom);
  } else if (p.archetype === 'tree') {
    rect(g, 14, 12, 4, 13, p.stem);
    rect(g, 5, 4, 22, 10, p.leaf);
    rect(g, 5, 3, 22, 1, p.leafDark);
    rect(g, 7, 5, 18, 1, p.leafDark);
    pix(g, 10, 8, p.bloom);
    pix(g, 22, 9, p.bloom);
  } else {
    // B4-R6: Verbesserter Adult mit mehr Blatt-Detail
    rect(g, 15, 8, 2, 17, p.stem);
    pix(g, 14, 10, p.leafDark); // Stiel-Schattierung
    pix(g, 14, 15, p.leafDark);
    pix(g, 14, 20, p.leafDark);
    rect(g, 6, 12, 8, 4, p.leaf);
    rect(g, 18, 12, 8, 4, p.leaf);
    rect(g, 8, 17, 6, 4, p.leaf);
    rect(g, 18, 17, 6, 4, p.leaf);
    rect(g, 10, 22, 12, 3, p.leaf);
    rect(g, 6, 11, 8, 1, p.leafDark);
    rect(g, 18, 11, 8, 1, p.leafDark);
    rect(g, 8, 16, 6, 1, p.leafDark);
    rect(g, 18, 16, 6, 1, p.leafDark);
    pix(g, 8, 14, p.leafDark); // Blatt-Vene
    pix(g, 23, 14, p.leafDark);
    pix(g, 10, 19, p.leafDark);
    pix(g, 21, 19, p.leafDark);
    // Knospe
    rect(g, 13, 5, 6, 4, p.bloom);
    pix(g, 15, 4, p.bloom);
    pix(g, 16, 4, p.bloom);
    pix(g, 14, 8, 0xfff7d4);
    pix(g, 17, 8, 0xfff7d4);
  }
}

function drawBlooming(g: Phaser.GameObjects.Graphics, p: PlantPalette) {
  rect(g, 3, 25, 26, 4, 0x553e2d);
  if (p.archetype === 'cactus') {
    rect(g, 11, 8, 10, 17, p.leaf);
    rect(g, 11, 8, 10, 2, p.leafDark);
    for (let y = 10; y < 25; y += 3) {
      pix(g, 10, y, 0xffffff);
      pix(g, 21, y, 0xffffff);
    }
    rect(g, 12, 3, 8, 5, p.bloom);
    rect(g, 14, 1, 4, 4, p.bloom);
  } else if (p.archetype === 'tree') {
    rect(g, 14, 12, 4, 13, p.stem);
    rect(g, 4, 2, 24, 12, p.leaf);
    rect(g, 4, 1, 24, 1, p.leafDark);
    rect(g, 6, 3, 20, 1, p.leafDark);
    pix(g, 7, 6, p.bloom);
    pix(g, 11, 5, p.bloom);
    pix(g, 16, 7, p.bloom);
    pix(g, 22, 6, p.bloom);
    pix(g, 25, 9, p.bloom);
  } else if (p.archetype === 'aquatic') {
    // Wasser-Pad statt Erde
    rect(g, 2, 22, 28, 7, 0x4a78c8);
    rect(g, 4, 18, 24, 6, p.leaf);
    rect(g, 4, 17, 24, 1, p.leafDark);
    rect(g, 12, 8, 8, 8, p.bloom);
    rect(g, 14, 5, 4, 5, p.bloom);
    pix(g, 15, 7, 0xfff7d4);
    pix(g, 16, 7, 0xfff7d4);
  } else if (p.archetype === 'carnivore') {
    rect(g, 15, 12, 2, 13, p.stem);
    rect(g, 8, 14, 6, 4, p.leaf);
    rect(g, 18, 14, 6, 4, p.leaf);
    rect(g, 10, 4, 12, 8, p.bloom);
    rect(g, 12, 2, 8, 4, p.bloom);
    pix(g, 13, 6, 0xfff7d4);
    pix(g, 18, 6, 0xfff7d4);
    pix(g, 15, 8, 0x000000);
    pix(g, 16, 8, 0x000000);
  } else {
    // B4-R6: Verbessertes Flower-Blooming mit mehr Detail
    rect(g, 15, 8, 2, 17, p.stem);
    // Stiel-Schattierung
    pix(g, 14, 10, p.leafDark);
    pix(g, 14, 14, p.leafDark);
    pix(g, 14, 18, p.leafDark);
    // Blaetter mit Schattierung
    rect(g, 6, 16, 8, 3, p.leaf);
    rect(g, 18, 16, 8, 3, p.leaf);
    rect(g, 8, 21, 6, 3, p.leaf);
    rect(g, 18, 21, 6, 3, p.leaf);
    rect(g, 6, 15, 8, 1, p.leafDark);
    rect(g, 18, 15, 8, 1, p.leafDark);
    pix(g, 8, 20, p.leafDark); // Blatt-Venen
    pix(g, 23, 20, p.leafDark);
    // Bluete: Bluetenblätter
    rect(g, 11, 4, 10, 6, p.bloom);
    rect(g, 9, 6, 14, 4, p.bloom);
    rect(g, 13, 2, 6, 4, p.bloom);
    // Blueten-Schattierung (dunklere Kanten)
    const bloomDark = (p.bloom & 0xfefefe) >> 1; // halbe Helligkeit
    pix(g, 11, 4, bloomDark);
    pix(g, 20, 4, bloomDark);
    pix(g, 9, 8, bloomDark);
    pix(g, 22, 8, bloomDark);
    // Zentrum mit Glanz-Punkten
    pix(g, 15, 5, 0xfff7d4);
    pix(g, 16, 5, 0xfff7d4);
    pix(g, 14, 6, 0xfff7d4);
    pix(g, 17, 6, 0xfff7d4);
    pix(g, 15, 7, 0xfffabb);
    pix(g, 16, 7, 0xfffabb);
    // Bluetenblatt-Details
    pix(g, 12, 3, p.bloom);
    pix(g, 19, 3, p.bloom);
    pix(g, 10, 6, p.bloom);
    pix(g, 21, 6, p.bloom);
  }
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
  if (scene.textures.exists(key)) return;
  const palette = getPalette(slug);
  const g = scene.add.graphics({ x: 0, y: 0 });
  g.setVisible(false);
  STAGE_DRAWERS[stage](g, palette);
  g.generateTexture(key, T, T);
  g.destroy();
}

export function generateSpeciesStages(scene: Phaser.Scene, slug: string): void {
  for (let s = 0; s < 5; s++) {
    generatePlantStageTexture(scene, slug, s as GrowthStage);
  }
}

export function generateAllPlantStages(scene: Phaser.Scene): void {
  // Iteriere ueber ALLE Spezies aus species.ts plus ueber Encounter-only Slugs
  const slugs = new Set<string>([
    ...getAllSpeciesSlugs(),
    ...Object.keys(PALETTE_BY_SLUG).filter((s) => s !== 'default')
  ]);
  for (const slug of slugs) {
    generateSpeciesStages(scene, slug);
  }
}

export function listProceduralPlantSlugs(): string[] {
  return Object.keys(PALETTE_BY_SLUG).filter((s) => s !== 'default');
}
