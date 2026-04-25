import type { PlantSpecies } from '../types/plant';

/**
 * Hybrid-Recipes V0.1: 10 spezifische Crossings die eine neue Spezies erzeugen.
 *
 * Wenn beide Eltern-Spezies (in beliebiger Reihenfolge) zu einer Recipe passen,
 * bekommt das Kind die hybrid-childSlug Spezies. Andernfalls erbt das Kind die
 * Spezies des ersten Elternteils (wie V0.5).
 *
 * Visuelle Mixing: Hybrid-Pflanzen haben in proceduralPlantSprites.ts eine
 * Palette die sich zwischen beiden Eltern-Paletten interpoliert.
 */

export interface HybridRecipe {
  parents: [string, string];   // beliebige Reihenfolge
  childSlug: string;
  /** Mutation-Rate-Bonus durch dieses Recipe (default 0). */
  mutationBonus?: number;
}

export const HYBRID_RECIPES: HybridRecipe[] = [
  { parents: ['sunflower', 'rose'],          childSlug: 'sun-rose',         mutationBonus: 0.05 },
  { parents: ['venus-flytrap', 'orchid'],    childSlug: 'fang-orchid',      mutationBonus: 0.10 },
  { parents: ['lavender', 'mint'],           childSlug: 'mint-lavender' },
  { parents: ['spike-cactus', 'aloe-vera'],  childSlug: 'spike-aloe' },
  { parents: ['water-lily', 'iris'],         childSlug: 'water-iris' },
  { parents: ['tomato-plant', 'snapdragon'], childSlug: 'fire-tomato' },
  { parents: ['sundew', 'pitcher-plant'],    childSlug: 'sun-pitcher',      mutationBonus: 0.10 },
  { parents: ['fire-lily', 'banksia'],       childSlug: 'flame-banksia' },
  { parents: ['edelweiss', 'snowdrop'],      childSlug: 'frost-edelweiss' },
  { parents: ['saguaro', 'desert-rose'],     childSlug: 'rose-saguaro',     mutationBonus: 0.05 }
];

export function findRecipe(parentASlug: string, parentBSlug: string): HybridRecipe | undefined {
  return HYBRID_RECIPES.find((r) => {
    const [a, b] = r.parents;
    return (a === parentASlug && b === parentBSlug) || (a === parentBSlug && b === parentASlug);
  });
}

/**
 * Hybrid-Spezies-Definitionen. Werden in species.ts dazugemerged via
 * HYBRID_SPECIES export, so dass alle Plantbarkeit-Helpers (getSpecies,
 * getPlantableSpecies, getAllSpeciesSlugs) auch Hybriden kennen.
 */
export const HYBRID_SPECIES: PlantSpecies[] = [
  {
    slug: 'sun-rose',
    scientificName: 'Helianthus rosa hybrida',
    commonName: 'Sun-Rose',
    rarity: 4, isStarter: false,
    atkBias: 12, defBias: 10, spdBias: 12,
    description: 'Sonnenblumen-Rosen-Hybrid mit goldener-roter Bluete.',
    spriteSeedPrefix: 'sun_rose',
    preferredBiomes: ['wurzelheim', 'verdanto'],
    wrongBiomes: ['frostkamm']
  },
  {
    slug: 'fang-orchid',
    scientificName: 'Dionaea phalaenopsis hybrida',
    commonName: 'Fang-Orchid',
    rarity: 5, isStarter: false,
    atkBias: 25, defBias: 5, spdBias: 20,
    description: 'Karnivore Orchidee mit Schnappfallen und elegant-violetten Blueten.',
    spriteSeedPrefix: 'fang_orchid',
    preferredBiomes: ['mordwald', 'verdanto'],
    wrongBiomes: ['kaktoria', 'frostkamm']
  },
  {
    slug: 'mint-lavender',
    scientificName: 'Lavandula menthae hybrida',
    commonName: 'Mint-Lavender',
    rarity: 3, isStarter: false,
    atkBias: -5, defBias: 0, spdBias: 30,
    description: 'Lavendel-Minze-Hybrid mit aromatischer violett-gruener Bluete.',
    spriteSeedPrefix: 'mint_lavender',
    preferredBiomes: ['wurzelheim', 'kaktoria'],
    wrongBiomes: ['salzbucht']
  },
  {
    slug: 'spike-aloe',
    scientificName: 'Aloe echinocacti hybrida',
    commonName: 'Spike-Aloe',
    rarity: 4, isStarter: false,
    atkBias: 5, defBias: 30, spdBias: -5,
    description: 'Aloe-Kaktus-Hybrid. Defensiv-Spezialist mit dornigem Blattwerk.',
    spriteSeedPrefix: 'spike_aloe',
    preferredBiomes: ['kaktoria', 'magmabluete'],
    wrongBiomes: ['frostkamm', 'mordwald']
  },
  {
    slug: 'water-iris',
    scientificName: 'Iris nymphaea hybrida',
    commonName: 'Water-Iris',
    rarity: 4, isStarter: false,
    atkBias: 10, defBias: 25, spdBias: 10,
    description: 'Iris-Seerosen-Hybrid mit schwimmenden blauen Blueten.',
    spriteSeedPrefix: 'water_iris',
    preferredBiomes: ['mordwald', 'verdanto'],
    wrongBiomes: ['kaktoria', 'magmabluete']
  },
  {
    slug: 'fire-tomato',
    scientificName: 'Solanum antirrhinum hybrida',
    commonName: 'Fire-Tomato',
    rarity: 4, isStarter: false,
    atkBias: 20, defBias: 10, spdBias: 5,
    description: 'Tomate-Loewenmaul-Hybrid. Fluechtige Frucht mit ATK-Bias.',
    spriteSeedPrefix: 'fire_tomato',
    preferredBiomes: ['wurzelheim', 'verdanto'],
    wrongBiomes: ['frostkamm']
  },
  {
    slug: 'sun-pitcher',
    scientificName: 'Drosera nepenthes hybrida',
    commonName: 'Sun-Pitcher',
    rarity: 5, isStarter: false,
    atkBias: 25, defBias: 20, spdBias: 0,
    description: 'Sonnentau-Kannenpflanze-Hybrid. Tropfenbedeckte Kanne, hoch gefaehrlich.',
    spriteSeedPrefix: 'sun_pitcher',
    preferredBiomes: ['mordwald', 'verdanto'],
    wrongBiomes: ['kaktoria', 'frostkamm']
  },
  {
    slug: 'flame-banksia',
    scientificName: 'Banksia cyrtanthus hybrida',
    commonName: 'Flame-Banksia',
    rarity: 4, isStarter: false,
    atkBias: 20, defBias: 20, spdBias: -5,
    description: 'Feuerlilie-Banksie-Hybrid. Langlebig in heisser Asche.',
    spriteSeedPrefix: 'flame_banksia',
    preferredBiomes: ['magmabluete', 'kaktoria'],
    wrongBiomes: ['mordwald', 'frostkamm']
  },
  {
    slug: 'frost-edelweiss',
    scientificName: 'Galanthus leontopodium hybrida',
    commonName: 'Frost-Edelweiss',
    rarity: 5, isStarter: false,
    atkBias: 10, defBias: 30, spdBias: 15,
    description: 'Edelweiss-Schneegloeckchen-Hybrid. Eis-Kristall-Bluete.',
    spriteSeedPrefix: 'frost_edelweiss',
    preferredBiomes: ['frostkamm'],
    wrongBiomes: ['kaktoria', 'magmabluete']
  },
  {
    slug: 'rose-saguaro',
    scientificName: 'Carnegiea adenium hybrida',
    commonName: 'Rose-Saguaro',
    rarity: 5, isStarter: false,
    atkBias: 25, defBias: 35, spdBias: -10,
    description: 'Saguaro-Wuestenrose-Hybrid. Riesiger Kaktus mit roter Krone.',
    spriteSeedPrefix: 'rose_saguaro',
    preferredBiomes: ['kaktoria', 'magmabluete'],
    wrongBiomes: ['frostkamm', 'mordwald']
  }
];

export function isHybridSlug(slug: string): boolean {
  return HYBRID_SPECIES.some((s) => s.slug === slug);
}
