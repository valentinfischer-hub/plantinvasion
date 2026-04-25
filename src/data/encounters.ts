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


export const VERDANTO_TALLGRASS: EncounterDef[] = [
  {
    slug: 'air-plant',
    scientificName: 'Tillandsia recurvata',
    commonName: 'Luftpflanze',
    family: 'Bromeliaceae',
    weight: 25,
    minLevel: 4, maxLevel: 8,
    baseColor: 0x9bc4e3
  },
  {
    slug: 'rainforest-fern',
    scientificName: 'Asplenium nidus',
    commonName: 'Nestfarn',
    family: 'Bromeliaceae',
    weight: 25,
    minLevel: 3, maxLevel: 6,
    baseColor: 0x4a8228
  },
  {
    slug: 'heliconia',
    scientificName: 'Heliconia bihai',
    commonName: 'Hummerklaue',
    family: 'Bromeliaceae',
    weight: 20,
    minLevel: 4, maxLevel: 8,
    baseColor: 0xff5c5c
  },
  {
    slug: 'tropical-pitcher',
    scientificName: 'Nepenthes alata',
    commonName: 'Tropische Kannenpflanze',
    family: 'Droseraceae',
    weight: 15,
    minLevel: 5, maxLevel: 8,
    baseColor: 0x8b3a6b
  },
  {
    slug: 'moonflower',
    scientificName: 'Ipomoea alba',
    commonName: 'Mondblume',
    family: 'Solanaceae',
    weight: 10,
    minLevel: 5, maxLevel: 8,
    baseColor: 0xfff7d4
  },
  {
    slug: 'strangler-fig',
    scientificName: 'Ficus aurea',
    commonName: 'Wuergefeige',
    family: 'Bromeliaceae',
    weight: 5,
    minLevel: 6, maxLevel: 9,
    baseColor: 0x553e2d
  }
];

export const VERDANTO_BROMELIEN: EncounterDef[] = [
  {
    slug: 'bromeliad',
    scientificName: 'Aechmea fasciata',
    commonName: 'Bromelie',
    family: 'Bromeliaceae',
    weight: 50,
    minLevel: 4, maxLevel: 8,
    baseColor: 0xff7eb8
  },
  {
    slug: 'vanilla-orchid',
    scientificName: 'Vanilla planifolia',
    commonName: 'Vanille-Orchidee',
    family: 'Orchidaceae',
    weight: 30,
    minLevel: 5, maxLevel: 9,
    baseColor: 0xfcd95c
  },
  {
    slug: 'air-plant',
    scientificName: 'Tillandsia recurvata',
    commonName: 'Luftpflanze',
    family: 'Bromeliaceae',
    weight: 20,
    minLevel: 4, maxLevel: 8,
    baseColor: 0x9bc4e3
  }
];


export const KAKTORIA_TALLGRASS: EncounterDef[] = [
  {
    slug: 'saguaro',
    scientificName: 'Carnegiea gigantea',
    commonName: 'Saguaro',
    family: 'Cactaceae',
    weight: 25,
    minLevel: 8, maxLevel: 14,
    baseColor: 0x4a8228
  },
  {
    slug: 'barrel-cactus',
    scientificName: 'Ferocactus wislizeni',
    commonName: 'Fasskaktus',
    family: 'Cactaceae',
    weight: 30,
    minLevel: 7, maxLevel: 12,
    baseColor: 0x6abf3a
  },
  {
    slug: 'desert-rose',
    scientificName: 'Adenium obesum',
    commonName: 'Wuestenrose',
    family: 'Crassulaceae',
    weight: 20,
    minLevel: 8, maxLevel: 14,
    baseColor: 0xff7eb8
  },
  {
    slug: 'joshua-tree',
    scientificName: 'Yucca brevifolia',
    commonName: 'Joshua-Baum',
    family: 'Crassulaceae',
    weight: 15,
    minLevel: 9, maxLevel: 16,
    baseColor: 0x4a6b28
  },
  {
    slug: 'tumbleweed',
    scientificName: 'Salsola tragus',
    commonName: 'Steppenlaeufer',
    family: 'Asteraceae',
    weight: 10,
    minLevel: 6, maxLevel: 10,
    baseColor: 0xb87838
  }
];


export const FROSTKAMM_TALLGRASS: EncounterDef[] = [
  {
    slug: 'edelweiss',
    scientificName: 'Leontopodium nivale',
    commonName: 'Edelweiss',
    family: 'Asteraceae',
    weight: 15,
    minLevel: 14, maxLevel: 22,
    baseColor: 0xffffff
  },
  {
    slug: 'snowdrop',
    scientificName: 'Galanthus nivalis',
    commonName: 'Schneegloeckchen',
    family: 'Crassulaceae',
    weight: 25,
    minLevel: 12, maxLevel: 18,
    baseColor: 0xe8eef5
  },
  {
    slug: 'alpine-gentian',
    scientificName: 'Gentiana acaulis',
    commonName: 'Stengelloser Enzian',
    family: 'Brassicaceae',
    weight: 20,
    minLevel: 14, maxLevel: 22,
    baseColor: 0x4a78c8
  },
  {
    slug: 'crocus',
    scientificName: 'Crocus sativus',
    commonName: 'Safran-Krokus',
    family: 'Lamiaceae',
    weight: 25,
    minLevel: 12, maxLevel: 18,
    baseColor: 0x8a4ec8
  },
  {
    slug: 'bergkiefer',
    scientificName: 'Pinus mugo',
    commonName: 'Bergkiefer',
    family: 'Crassulaceae',
    weight: 15,
    minLevel: 16, maxLevel: 24,
    baseColor: 0x4a6b28
  }
];


export const SALZBUCHT_TALLGRASS: EncounterDef[] = [
  {
    slug: 'sea-thrift',
    scientificName: 'Armeria maritima',
    commonName: 'Strand-Grasnelke',
    family: 'Asteraceae',
    weight: 25,
    minLevel: 18, maxLevel: 28,
    baseColor: 0xff7eb8
  },
  {
    slug: 'sea-holly',
    scientificName: 'Eryngium maritimum',
    commonName: 'Strand-Mannstreu',
    family: 'Apiaceae',
    weight: 20,
    minLevel: 18, maxLevel: 28,
    baseColor: 0x4a8298
  },
  {
    slug: 'sea-rocket',
    scientificName: 'Cakile maritima',
    commonName: 'Meersenf',
    family: 'Brassicaceae',
    weight: 25,
    minLevel: 16, maxLevel: 24,
    baseColor: 0xc8d8e8
  },
  {
    slug: 'beach-aster',
    scientificName: 'Symphyotrichum tenuifolium',
    commonName: 'Strand-Aster',
    family: 'Asteraceae',
    weight: 15,
    minLevel: 18, maxLevel: 26,
    baseColor: 0xfff7d4
  },
  {
    slug: 'mangrove',
    scientificName: 'Rhizophora mangle',
    commonName: 'Mangrove',
    family: 'Bromeliaceae',
    weight: 10,
    minLevel: 22, maxLevel: 30,
    baseColor: 0x4a6b28
  },
  {
    slug: 'sea-grape',
    scientificName: 'Coccoloba uvifera',
    commonName: 'Meertraube',
    family: 'Solanaceae',
    weight: 5,
    minLevel: 24, maxLevel: 32,
    baseColor: 0x8a4ec8
  }
];

// Mordwald (Karnivoren-Sumpf, Biom 6)
export const MORDWALD_TALLGRASS: EncounterDef[] = [
  {
    slug: 'sundew',
    scientificName: 'Drosera capensis',
    commonName: 'Sonnentau',
    family: 'Droseraceae',
    weight: 25,
    minLevel: 18, maxLevel: 26,
    baseColor: 0xc94d6e
  },
  {
    slug: 'pitcher-plant',
    scientificName: 'Nepenthes attenboroughii',
    commonName: 'Kannenpflanze',
    family: 'Droseraceae',
    weight: 20,
    minLevel: 20, maxLevel: 28,
    baseColor: 0x8b3a6b
  },
  {
    slug: 'cobra-lily',
    scientificName: 'Darlingtonia californica',
    commonName: 'Kobra-Lilie',
    family: 'Droseraceae',
    weight: 15,
    minLevel: 22, maxLevel: 30,
    baseColor: 0x4a8228
  },
  {
    slug: 'bladderwort',
    scientificName: 'Utricularia vulgaris',
    commonName: 'Wasserschlauch',
    family: 'Droseraceae',
    weight: 25,
    minLevel: 18, maxLevel: 24,
    baseColor: 0x9bc4e3
  },
  {
    slug: 'corpse-flower',
    scientificName: 'Amorphophallus titanum',
    commonName: 'Titanenwurz',
    family: 'Droseraceae',
    weight: 10,
    minLevel: 26, maxLevel: 34,
    baseColor: 0x6b1a1a
  },
  {
    slug: 'butterwort',
    scientificName: 'Pinguicula vulgaris',
    commonName: 'Fettkraut',
    family: 'Droseraceae',
    weight: 5,
    minLevel: 22, maxLevel: 28,
    baseColor: 0xaa78c8
  }
];

// Magmabluete (Vulkan-Pyrophyt, Biom 7)
export const MAGMABLUETE_TALLGRASS: EncounterDef[] = [
  {
    slug: 'fire-lily',
    scientificName: 'Cyrtanthus ventricosus',
    commonName: 'Feuerlilie',
    family: 'Crassulaceae',
    weight: 25,
    minLevel: 24, maxLevel: 32,
    baseColor: 0xff5c5c
  },
  {
    slug: 'banksia',
    scientificName: 'Banksia attenuata',
    commonName: 'Banksie',
    family: 'Bromeliaceae',
    weight: 20,
    minLevel: 26, maxLevel: 34,
    baseColor: 0xffa840
  },
  {
    slug: 'serotinous-pine',
    scientificName: 'Pinus contorta',
    commonName: 'Drehkiefer',
    family: 'Crassulaceae',
    weight: 15,
    minLevel: 28, maxLevel: 38,
    baseColor: 0x4a5b28
  },
  {
    slug: 'protea',
    scientificName: 'Protea cynaroides',
    commonName: 'Koenigs-Protea',
    family: 'Bromeliaceae',
    weight: 20,
    minLevel: 26, maxLevel: 34,
    baseColor: 0xff7eb8
  },
  {
    slug: 'eucalyptus',
    scientificName: 'Eucalyptus regnans',
    commonName: 'Riesen-Eukalyptus',
    family: 'Bromeliaceae',
    weight: 10,
    minLevel: 30, maxLevel: 40,
    baseColor: 0x6a8a48
  },
  {
    slug: 'fynbos-erica',
    scientificName: 'Erica versicolor',
    commonName: 'Fynbos-Heide',
    family: 'Lamiaceae',
    weight: 10,
    minLevel: 24, maxLevel: 30,
    baseColor: 0xff9ad0
  }
];
