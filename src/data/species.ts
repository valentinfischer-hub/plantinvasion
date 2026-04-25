import type { PlantSpecies } from '../types/plant';

/**
 * V1 Start-Pflanzen (5 Spezies).
 * Generische Game-Pflanzen die das Sprite-Modell perfekt kennt.
 * Stat-Bias laut Charakter-Rolle pro Spezies.
 */
export const STARTER_SPECIES: readonly PlantSpecies[] = [
  {
    slug: 'sunflower',
    scientificName: 'Helianthus annuus',
    commonName: 'Sunflower',
    rarity: 2,
    isStarter: true,
    atkBias: 5,
    defBias: 5,
    spdBias: 5,
    description:
      'Klassische Sonnenblume mit grossem gelbem Bluetenkopf. Allrounder mit ausgewogenen Werten.',
    spriteSeedPrefix: 'sunflower'
  },
  {
    slug: 'spike-cactus',
    scientificName: 'Echinocactus grusonii',
    commonName: 'Spike Cactus',
    rarity: 3,
    isStarter: true,
    atkBias: -5,
    defBias: 25,
    spdBias: -10,
    description:
      'Stachelkugel-Kaktus mit Defensiv-Spezialisierung. Hoher DEF, niedrige Speed.',
    spriteSeedPrefix: 'spike_cactus'
  },
  {
    slug: 'venus-flytrap',
    scientificName: 'Dionaea muscipula',
    commonName: 'Venus Flytrap',
    rarity: 4,
    isStarter: true,
    atkBias: 20,
    defBias: -10,
    spdBias: 5,
    description:
      'Karnivore Pflanze mit Schnappfallen. Glass-Cannon mit hohem ATK.',
    spriteSeedPrefix: 'venus_flytrap'
  },
  {
    slug: 'lavender',
    scientificName: 'Lavandula angustifolia',
    commonName: 'Lavender',
    rarity: 2,
    isStarter: true,
    atkBias: -10,
    defBias: -5,
    spdBias: 20,
    description:
      'Aromatische Heilpflanze mit hoher Speed. Hit-and-Run-Angreifer.',
    spriteSeedPrefix: 'lavender'
  },
  {
    slug: 'tomato-plant',
    scientificName: 'Solanum lycopersicum',
    commonName: 'Tomato Plant',
    rarity: 2,
    isStarter: true,
    atkBias: 0,
    defBias: 15,
    spdBias: 0,
    description:
      'Robuste Nutzpflanze mit roten Fruechten. Support-Pflanze, Heilung in V2.',
    spriteSeedPrefix: 'tomato_plant'
  }
] as const;

/** Lookup nach Slug. */
export function getSpecies(slug: string): PlantSpecies | undefined {
  return STARTER_SPECIES.find((s) => s.slug === slug);
}
