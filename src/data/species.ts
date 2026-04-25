import type { PlantSpecies } from '../types/plant';

/**
 * V1 Start-Pflanzen (5 Spezies).
 * Echte botanische Namen aus der Sammler-Community.
 * Stat-Bias laut GDD-Charakter pro Spezies.
 */
export const STARTER_SPECIES: readonly PlantSpecies[] = [
  {
    slug: 'alocasia-black-velvet-albo',
    scientificName: "Alocasia reginula 'Black Velvet' albo / pink variegata",
    commonName: 'Black Velvet Albo',
    rarity: 5,
    isStarter: true,
    atkBias: 10,
    defBias: 10,
    spdBias: 0,
    description:
      'Dunkelgruen-schwarzes Aroid mit pinker und weisser Variegation, samtige Blattoberflaeche.',
    spriteSeedPrefix: 'aroid_alocasia_blackvelvet_albo'
  },
  {
    slug: 'monstera-bulbasaur',
    scientificName: "Monstera deliciosa 'Bulbasaur'",
    commonName: 'Monstera Bulbasaur',
    rarity: 4,
    isStarter: true,
    atkBias: 5,
    defBias: 5,
    spdBias: 10,
    description:
      'Mutierte Monstera mit kompaktem, gedrungenem Wuchs, erinnert an Pokemon Bulbasaur.',
    spriteSeedPrefix: 'aroid_monstera_bulbasaur'
  },
  {
    slug: 'myrtillocactus-fukurokuryu',
    scientificName: 'Myrtillocactus geometrizans cv. Fukurokuryuzinhga',
    commonName: 'Bishops Cap (Monstrose)',
    rarity: 5,
    isStarter: true,
    atkBias: 0,
    defBias: 25,
    spdBias: -5,
    description:
      'Japanische Cultivar-Monstrose mit unregelmaessigem, knorrigem Wuchs.',
    spriteSeedPrefix: 'cactus_myrtillocactus_monstrose'
  },
  {
    slug: 'lithops',
    scientificName: 'Lithops spp.',
    commonName: 'Living Stones',
    rarity: 3,
    isStarter: true,
    atkBias: -5,
    defBias: 20,
    spdBias: -5,
    description:
      'Mesemb mit Stein-Mimikry, lebt in Suedafrikas Wuesten.',
    spriteSeedPrefix: 'mesemb_lithops'
  },
  {
    slug: 'pinguicula-seductora',
    scientificName: 'Pinguicula seductora',
    commonName: 'Mexican Butterwort',
    rarity: 4,
    isStarter: true,
    atkBias: 15,
    defBias: 0,
    spdBias: 5,
    description:
      'Karnivore mit klebrigen Blattflaechen, faengt Insekten passiv.',
    spriteSeedPrefix: 'carnivore_pinguicula_seductora'
  }
] as const;

/** Lookup nach Slug. */
export function getSpecies(slug: string): PlantSpecies | undefined {
  return STARTER_SPECIES.find((s) => s.slug === slug);
}
