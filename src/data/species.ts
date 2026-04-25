import type { PlantSpecies } from '../types/plant';

/**
 * Alle plantbaren Pflanzen-Spezies.
 *
 * V0.1 hatte nur 5 Starter. V0.5 erweitert auf 15 (5 Starter + 10 weitere)
 * mit echten botanischen Namen (D-008). Encounter-Pool-Pflanzen aus
 * encounters.ts sind dort separat definiert; bei Capture wird via
 * createSpeciesIfMissing eine generische Spezies-Entry generiert.
 */
export const STARTER_SPECIES: PlantSpecies[] = [
  // ============ V0.1 Starter ============
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
    spriteSeedPrefix: 'sunflower',
    preferredBiomes: ['wurzelheim', 'verdanto'],
    wrongBiomes: ['frostkamm']
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
    spriteSeedPrefix: 'spike_cactus',
    preferredBiomes: ['kaktoria'],
    wrongBiomes: ['mordwald', 'verdanto']
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
    spriteSeedPrefix: 'venus_flytrap',
    preferredBiomes: ['mordwald', 'verdanto'],
    wrongBiomes: ['kaktoria', 'salzbucht']
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
    spriteSeedPrefix: 'lavender',
    preferredBiomes: ['wurzelheim', 'kaktoria'],
    wrongBiomes: ['salzbucht']
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
    spriteSeedPrefix: 'tomato_plant',
    preferredBiomes: ['wurzelheim', 'verdanto'],
    wrongBiomes: ['frostkamm']
  },
  // ============ V0.5 Erweiterung (10 neue Spezies, procedural Sprites) ============
  {
    slug: 'rose',
    scientificName: 'Rosa gallica',
    commonName: 'Rose',
    rarity: 3,
    isStarter: false,
    atkBias: 15,
    defBias: 5,
    spdBias: 10,
    description:
      'Klassische Rose mit Dornen. Solider Allrounder mit Atk-Bias und schnellen Stichen.',
    spriteSeedPrefix: 'rose',
    preferredBiomes: ['wurzelheim'],
    wrongBiomes: ['salzbucht', 'magmabluete']
  },
  {
    slug: 'aloe-vera',
    scientificName: 'Aloe barbadensis',
    commonName: 'Aloe Vera',
    rarity: 3,
    isStarter: false,
    atkBias: -5,
    defBias: 20,
    spdBias: 5,
    description:
      'Sukkulente mit Heil-Eigenschaften. Hoher Defensiv-Wert, regeneriert HP nach Battle.',
    spriteSeedPrefix: 'aloe_vera',
    preferredBiomes: ['kaktoria', 'magmabluete'],
    wrongBiomes: ['frostkamm', 'mordwald']
  },
  {
    slug: 'orchid',
    scientificName: 'Phalaenopsis amabilis',
    commonName: 'Orchid',
    rarity: 4,
    isStarter: false,
    atkBias: 5,
    defBias: 10,
    spdBias: 25,
    description:
      'Eleganz-Orchidee mit Speed-Spezialisierung. Schwer zu pflegen aber lohnend.',
    spriteSeedPrefix: 'orchid',
    preferredBiomes: ['verdanto', 'mordwald'],
    wrongBiomes: ['kaktoria', 'frostkamm']
  },
  {
    slug: 'fern',
    scientificName: 'Pteridium aquilinum',
    commonName: 'Fern',
    rarity: 2,
    isStarter: false,
    atkBias: 0,
    defBias: 10,
    spdBias: 5,
    description:
      'Anspruchsloser Farn. Starkes Tutorial-Plant fuer Anfaenger, schnelles Wachstum.',
    spriteSeedPrefix: 'fern',
    preferredBiomes: ['wurzelheim', 'verdanto', 'mordwald'],
    wrongBiomes: ['kaktoria', 'frostkamm']
  },
  {
    slug: 'mint',
    scientificName: 'Mentha piperita',
    commonName: 'Mint',
    rarity: 2,
    isStarter: false,
    atkBias: 0,
    defBias: 0,
    spdBias: 25,
    description:
      'Pfefferminz-Kraut. Speed-Spezialist. Erste-Wahl fuer Hit-and-Run-Strategien.',
    spriteSeedPrefix: 'mint',
    preferredBiomes: ['wurzelheim'],
    wrongBiomes: ['salzbucht', 'kaktoria']
  },
  {
    slug: 'iris',
    scientificName: 'Iris germanica',
    commonName: 'Iris',
    rarity: 3,
    isStarter: false,
    atkBias: 10,
    defBias: 5,
    spdBias: 20,
    description:
      'Schwertlilie. Schlanke ATK-SPD-Hybrid-Pflanze, schoenes Bluetenmuster.',
    spriteSeedPrefix: 'iris',
    preferredBiomes: ['wurzelheim', 'frostkamm'],
    wrongBiomes: ['salzbucht']
  },
  {
    slug: 'snapdragon',
    scientificName: 'Antirrhinum majus',
    commonName: 'Snapdragon',
    rarity: 3,
    isStarter: false,
    atkBias: 25,
    defBias: -5,
    spdBias: 0,
    description:
      'Loewenmaeulchen mit aggressiver Battle-Aktion. Hoher ATK, niedrige DEF.',
    spriteSeedPrefix: 'snapdragon',
    preferredBiomes: ['wurzelheim', 'kaktoria'],
    wrongBiomes: ['mordwald']
  },
  {
    slug: 'water-lily',
    scientificName: 'Nymphaea alba',
    commonName: 'Water Lily',
    rarity: 3,
    isStarter: false,
    atkBias: 5,
    defBias: 25,
    spdBias: -10,
    description:
      'Seerose. Hoher DEF und Heil-Eigenschaften. Wirtschaftlicher Bloom-Cycle.',
    spriteSeedPrefix: 'water_lily',
    preferredBiomes: ['mordwald', 'verdanto'],
    wrongBiomes: ['kaktoria', 'magmabluete']
  },
  {
    slug: 'daffodil',
    scientificName: 'Narcissus poeticus',
    commonName: 'Daffodil',
    rarity: 2,
    isStarter: false,
    atkBias: 5,
    defBias: 5,
    spdBias: 15,
    description:
      'Narzisse. Anfaenger-freundlich, schnelles Wachstum, mittlerer Battle-Wert.',
    spriteSeedPrefix: 'daffodil',
    preferredBiomes: ['wurzelheim'],
    wrongBiomes: ['salzbucht']
  },
  {
    slug: 'echinacea',
    scientificName: 'Echinacea purpurea',
    commonName: 'Coneflower',
    rarity: 3,
    isStarter: false,
    atkBias: 10,
    defBias: 10,
    spdBias: 10,
    description:
      'Sonnenhut. Robuster Allrounder, immun gegen Trockenheit (-20% Hydration-Decay als Eigenschaft).',
    spriteSeedPrefix: 'echinacea',
    preferredBiomes: ['wurzelheim', 'kaktoria'],
    wrongBiomes: ['mordwald']
  }
];

/** Lookup nach Slug. */
export function getSpecies(slug: string): PlantSpecies | undefined {
  return STARTER_SPECIES.find((s) => s.slug === slug);
}

/** Liste aller Pflanzen die der Spieler einsaeen kann. */
export function getPlantableSpecies(): PlantSpecies[] {
  return STARTER_SPECIES;
}

/** Slug-Liste. */
export function getAllSpeciesSlugs(): string[] {
  return STARTER_SPECIES.map((s) => s.slug);
}
