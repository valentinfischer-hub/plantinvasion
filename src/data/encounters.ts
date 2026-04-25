/**
 * Wild-Encounter-Pool fuer Wurzelheim.
 * Niedrige Stat-Pflanzen fuer Tutorial-Region.
 */

export interface EncounterDef {
  slug: string;
  scientificName: string;
  commonName: string;
  family: PlantFamily;
  weight: number;            // RNG-Gewicht
  minLevel: number;
  maxLevel: number;
  baseColor: number;         // Body-Color fuer procedural Sprite
}

export type PlantFamily =
  | 'Asteraceae'
  | 'Solanaceae'
  | 'Cactaceae'
  | 'Crassulaceae'
  | 'Lamiaceae'
  | 'Brassicaceae'
  | 'Apiaceae'
  | 'Droseraceae'
  | 'Orchidaceae'
  | 'Bromeliaceae'
  | 'Mythical';

export const WURZELHEIM_TALLGRASS: EncounterDef[] = [
  {
    slug: 'common-daisy',
    scientificName: 'Bellis perennis',
    commonName: 'Gänseblümchen',
    family: 'Asteraceae',
    weight: 30,
    minLevel: 1, maxLevel: 3,
    baseColor: 0xfff7d4
  },
  {
    slug: 'dandelion',
    scientificName: 'Taraxacum officinale',
    commonName: 'Löwenzahn',
    family: 'Asteraceae',
    weight: 25,
    minLevel: 1, maxLevel: 3,
    baseColor: 0xffd13a
  },
  {
    slug: 'white-clover',
    scientificName: 'Trifolium repens',
    commonName: 'Weissklee',
    family: 'Brassicaceae',
    weight: 20,
    minLevel: 1, maxLevel: 3,
    baseColor: 0xc8e896
  },
  {
    slug: 'ribwort-plantain',
    scientificName: 'Plantago lanceolata',
    commonName: 'Spitzwegerich',
    family: 'Apiaceae',
    weight: 15,
    minLevel: 2, maxLevel: 4,
    baseColor: 0x7e9b3a
  },
  {
    slug: 'common-yarrow',
    scientificName: 'Achillea millefolium',
    commonName: 'Schafgarbe',
    family: 'Asteraceae',
    weight: 10,
    minLevel: 2, maxLevel: 4,
    baseColor: 0xf0e0c8
  }
];

export function pickEncounter(pool: EncounterDef[], rng: () => number = Math.random): EncounterDef {
  const total = pool.reduce((sum, e) => sum + e.weight, 0);
  let r = rng() * total;
  for (const e of pool) {
    r -= e.weight;
    if (r <= 0) return e;
  }
  return pool[pool.length - 1];
}

export function randomLevel(def: EncounterDef, rng: () => number = Math.random): number {
  return Math.floor(def.minLevel + rng() * (def.maxLevel - def.minLevel + 1));
}
