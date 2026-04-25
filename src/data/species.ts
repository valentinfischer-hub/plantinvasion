import type { PlantSpecies } from '../types/plant';
import { HYBRID_SPECIES } from './hybridRecipes';

/**
 * Alle plantbaren Pflanzen-Spezies (V0.6 = 60+ Spezies).
 *
 * V0.1: 5 Starter
 * V0.5: +10 Standard-Pflanzen mit Procedural-Sprites
 * V0.6: +35 thematische Pflanzen pro Biom
 * V0.6.5: +10 Hybrid-Spezies (kreuzbar via HYBRID_RECIPES)
 *
 * Alle mit echten botanischen Namen (D-008), Hybriden mit Hybrid-Suffix-Botanik.
 */
const BASE_SPECIES: PlantSpecies[] = [
  // ============ V0.1 Starter (5) ============
  {
    slug: 'sunflower', scientificName: 'Helianthus annuus', commonName: 'Sunflower',
    rarity: 2, isStarter: true, atkBias: 5, defBias: 5, spdBias: 5,
    description: 'Klassische Sonnenblume mit grossem gelbem Bluetenkopf. Allrounder.',
    spriteSeedPrefix: 'sunflower', preferredBiomes: ['wurzelheim', 'verdanto'], wrongBiomes: ['frostkamm']
  },
  {
    slug: 'spike-cactus', scientificName: 'Echinocactus grusonii', commonName: 'Spike Cactus',
    rarity: 3, isStarter: true, atkBias: -5, defBias: 25, spdBias: -10,
    description: 'Stachelkugel-Kaktus. Defensiv-Spezialist.',
    spriteSeedPrefix: 'spike_cactus', preferredBiomes: ['kaktoria'], wrongBiomes: ['mordwald', 'verdanto']
  },
  {
    slug: 'venus-flytrap', scientificName: 'Dionaea muscipula', commonName: 'Venus Flytrap',
    rarity: 4, isStarter: true, atkBias: 20, defBias: -10, spdBias: 5,
    description: 'Karnivore mit Schnappfallen. Glass-Cannon hoher ATK.',
    spriteSeedPrefix: 'venus_flytrap', preferredBiomes: ['mordwald', 'verdanto'], wrongBiomes: ['kaktoria', 'salzbucht']
  },
  {
    slug: 'lavender', scientificName: 'Lavandula angustifolia', commonName: 'Lavender',
    rarity: 2, isStarter: true, atkBias: -10, defBias: -5, spdBias: 20,
    description: 'Heilkraut mit Speed-Bias. Hit-and-Run.',
    spriteSeedPrefix: 'lavender', preferredBiomes: ['wurzelheim', 'kaktoria'], wrongBiomes: ['salzbucht']
  },
  {
    slug: 'tomato-plant', scientificName: 'Solanum lycopersicum', commonName: 'Tomato Plant',
    rarity: 2, isStarter: true, atkBias: 0, defBias: 15, spdBias: 0,
    description: 'Robuste Nutzpflanze mit Frucht-Output. Support.',
    spriteSeedPrefix: 'tomato_plant', preferredBiomes: ['wurzelheim', 'verdanto'], wrongBiomes: ['frostkamm']
  },

  // ============ V0.5 Standard (10) ============
  { slug: 'rose', scientificName: 'Rosa gallica', commonName: 'Rose',
    rarity: 3, isStarter: false, atkBias: 15, defBias: 5, spdBias: 10,
    description: 'Klassische Rose mit Dornen.', spriteSeedPrefix: 'rose',
    preferredBiomes: ['wurzelheim'], wrongBiomes: ['salzbucht', 'magmabluete'] },
  { slug: 'aloe-vera', scientificName: 'Aloe barbadensis', commonName: 'Aloe Vera',
    rarity: 3, isStarter: false, atkBias: -5, defBias: 20, spdBias: 5,
    description: 'Sukkulente mit Heil-Eigenschaften.', spriteSeedPrefix: 'aloe_vera',
    preferredBiomes: ['kaktoria', 'magmabluete'], wrongBiomes: ['frostkamm', 'mordwald'] },
  { slug: 'orchid', scientificName: 'Phalaenopsis amabilis', commonName: 'Orchid',
    rarity: 4, isStarter: false, atkBias: 5, defBias: 10, spdBias: 25,
    description: 'Eleganz-Orchidee mit Speed-Bias.', spriteSeedPrefix: 'orchid',
    preferredBiomes: ['verdanto', 'mordwald'], wrongBiomes: ['kaktoria', 'frostkamm'] },
  { slug: 'fern', scientificName: 'Pteridium aquilinum', commonName: 'Fern',
    rarity: 2, isStarter: false, atkBias: 0, defBias: 10, spdBias: 5,
    description: 'Anspruchsloser Farn. Anfaenger-Plant.', spriteSeedPrefix: 'fern',
    preferredBiomes: ['wurzelheim', 'verdanto', 'mordwald'], wrongBiomes: ['kaktoria', 'frostkamm'] },
  { slug: 'mint', scientificName: 'Mentha piperita', commonName: 'Mint',
    rarity: 2, isStarter: false, atkBias: 0, defBias: 0, spdBias: 25,
    description: 'Pfefferminz-Speed-Spezialist.', spriteSeedPrefix: 'mint',
    preferredBiomes: ['wurzelheim'], wrongBiomes: ['salzbucht', 'kaktoria'] },
  { slug: 'iris', scientificName: 'Iris germanica', commonName: 'Iris',
    rarity: 3, isStarter: false, atkBias: 10, defBias: 5, spdBias: 20,
    description: 'Schwertlilie. ATK-SPD-Hybrid.', spriteSeedPrefix: 'iris',
    preferredBiomes: ['wurzelheim', 'frostkamm'], wrongBiomes: ['salzbucht'] },
  { slug: 'snapdragon', scientificName: 'Antirrhinum majus', commonName: 'Snapdragon',
    rarity: 3, isStarter: false, atkBias: 25, defBias: -5, spdBias: 0,
    description: 'Loewenmaeulchen, hoher ATK.', spriteSeedPrefix: 'snapdragon',
    preferredBiomes: ['wurzelheim', 'kaktoria'], wrongBiomes: ['mordwald'] },
  { slug: 'water-lily', scientificName: 'Nymphaea alba', commonName: 'Water Lily',
    rarity: 3, isStarter: false, atkBias: 5, defBias: 25, spdBias: -10,
    description: 'Seerose mit hohem DEF.', spriteSeedPrefix: 'water_lily',
    preferredBiomes: ['mordwald', 'verdanto'], wrongBiomes: ['kaktoria', 'magmabluete'] },
  { slug: 'daffodil', scientificName: 'Narcissus poeticus', commonName: 'Daffodil',
    rarity: 2, isStarter: false, atkBias: 5, defBias: 5, spdBias: 15,
    description: 'Narzisse, anfaenger-freundlich.', spriteSeedPrefix: 'daffodil',
    preferredBiomes: ['wurzelheim'], wrongBiomes: ['salzbucht'] },
  { slug: 'echinacea', scientificName: 'Echinacea purpurea', commonName: 'Coneflower',
    rarity: 3, isStarter: false, atkBias: 10, defBias: 10, spdBias: 10,
    description: 'Sonnenhut. Robuster Allrounder.', spriteSeedPrefix: 'echinacea',
    preferredBiomes: ['wurzelheim', 'kaktoria'], wrongBiomes: ['mordwald'] },

  // ============ V0.6 Verdanto-Tropical (5) ============
  { slug: 'monstera', scientificName: 'Monstera deliciosa', commonName: 'Monstera',
    rarity: 3, isStarter: false, atkBias: 5, defBias: 15, spdBias: 5,
    description: 'Fensterblatt mit imposanten Blaettern.', spriteSeedPrefix: 'monstera',
    preferredBiomes: ['verdanto'], wrongBiomes: ['frostkamm', 'kaktoria'] },
  { slug: 'bird-of-paradise', scientificName: 'Strelitzia reginae', commonName: 'Bird of Paradise',
    rarity: 4, isStarter: false, atkBias: 20, defBias: 5, spdBias: 15,
    description: 'Strelitzie mit kranen-aehnlicher Bluete.', spriteSeedPrefix: 'bird_of_paradise',
    preferredBiomes: ['verdanto'], wrongBiomes: ['frostkamm'] },
  { slug: 'philodendron', scientificName: 'Philodendron hederaceum', commonName: 'Philodendron',
    rarity: 2, isStarter: false, atkBias: 0, defBias: 15, spdBias: 5,
    description: 'Kletternder Aroid mit weichen Blaettern.', spriteSeedPrefix: 'philodendron',
    preferredBiomes: ['verdanto', 'mordwald'], wrongBiomes: ['kaktoria'] },
  { slug: 'heliconia', scientificName: 'Heliconia bihai', commonName: 'Heliconia',
    rarity: 3, isStarter: false, atkBias: 15, defBias: 10, spdBias: 5,
    description: 'Hummerklauen-Form, leuchtend rot.', spriteSeedPrefix: 'heliconia',
    preferredBiomes: ['verdanto'], wrongBiomes: ['frostkamm', 'salzbucht'] },
  { slug: 'bromeliad', scientificName: 'Aechmea fasciata', commonName: 'Bromeliad',
    rarity: 3, isStarter: false, atkBias: 10, defBias: 15, spdBias: 10,
    description: 'Bromelie mit Wasserbecken-Mitte.', spriteSeedPrefix: 'bromeliad',
    preferredBiomes: ['verdanto'], wrongBiomes: ['kaktoria', 'frostkamm'] },

  // ============ V0.6 Kaktoria-Arid (5) ============
  { slug: 'saguaro', scientificName: 'Carnegiea gigantea', commonName: 'Saguaro',
    rarity: 4, isStarter: false, atkBias: 10, defBias: 30, spdBias: -15,
    description: 'Riesenkaktus. Tank.', spriteSeedPrefix: 'saguaro',
    preferredBiomes: ['kaktoria'], wrongBiomes: ['mordwald', 'frostkamm'] },
  { slug: 'barrel-cactus', scientificName: 'Ferocactus wislizeni', commonName: 'Barrel Cactus',
    rarity: 3, isStarter: false, atkBias: 0, defBias: 25, spdBias: -5,
    description: 'Fasskaktus. Defensiv.', spriteSeedPrefix: 'barrel_cactus',
    preferredBiomes: ['kaktoria'], wrongBiomes: ['verdanto'] },
  { slug: 'desert-rose', scientificName: 'Adenium obesum', commonName: 'Desert Rose',
    rarity: 4, isStarter: false, atkBias: 20, defBias: 5, spdBias: 10,
    description: 'Wuestenrose mit dickem Stamm.', spriteSeedPrefix: 'desert_rose',
    preferredBiomes: ['kaktoria', 'magmabluete'], wrongBiomes: ['frostkamm'] },
  { slug: 'joshua-tree', scientificName: 'Yucca brevifolia', commonName: 'Joshua Tree',
    rarity: 4, isStarter: false, atkBias: 15, defBias: 20, spdBias: 0,
    description: 'Yucca der Mojave-Wueste.', spriteSeedPrefix: 'joshua_tree',
    preferredBiomes: ['kaktoria'], wrongBiomes: ['verdanto', 'mordwald'] },
  { slug: 'agave', scientificName: 'Agave americana', commonName: 'Agave',
    rarity: 3, isStarter: false, atkBias: 15, defBias: 20, spdBias: -5,
    description: 'Sukkulente mit langen Blaettern.', spriteSeedPrefix: 'agave',
    preferredBiomes: ['kaktoria', 'magmabluete'], wrongBiomes: ['frostkamm'] },

  // ============ V0.6 Frostkamm-Alpine (5) ============
  { slug: 'edelweiss', scientificName: 'Leontopodium nivale', commonName: 'Edelweiss',
    rarity: 4, isStarter: false, atkBias: 10, defBias: 20, spdBias: 10,
    description: 'Alpenblume mit silbrigen Blaettern.', spriteSeedPrefix: 'edelweiss',
    preferredBiomes: ['frostkamm'], wrongBiomes: ['kaktoria', 'magmabluete'] },
  { slug: 'snowdrop', scientificName: 'Galanthus nivalis', commonName: 'Snowdrop',
    rarity: 3, isStarter: false, atkBias: 5, defBias: 15, spdBias: 15,
    description: 'Schneegloeckchen.', spriteSeedPrefix: 'snowdrop',
    preferredBiomes: ['frostkamm'], wrongBiomes: ['salzbucht'] },
  { slug: 'alpine-gentian', scientificName: 'Gentiana acaulis', commonName: 'Alpine Gentian',
    rarity: 3, isStarter: false, atkBias: 10, defBias: 10, spdBias: 15,
    description: 'Stengelloser Enzian, tiefblau.', spriteSeedPrefix: 'alpine_gentian',
    preferredBiomes: ['frostkamm'], wrongBiomes: ['kaktoria'] },
  { slug: 'crocus', scientificName: 'Crocus sativus', commonName: 'Crocus',
    rarity: 2, isStarter: false, atkBias: 5, defBias: 5, spdBias: 20,
    description: 'Krokus mit Safran-Faeden.', spriteSeedPrefix: 'crocus',
    preferredBiomes: ['frostkamm', 'wurzelheim'], wrongBiomes: ['salzbucht'] },
  { slug: 'mountain-pine', scientificName: 'Pinus mugo', commonName: 'Mountain Pine',
    rarity: 3, isStarter: false, atkBias: 5, defBias: 25, spdBias: -10,
    description: 'Bergkiefer, robust gegen Winter.', spriteSeedPrefix: 'mountain_pine',
    preferredBiomes: ['frostkamm', 'magmabluete'], wrongBiomes: ['mordwald'] },

  // ============ V0.6 Salzbucht-Coastal (5) ============
  { slug: 'sea-thrift', scientificName: 'Armeria maritima', commonName: 'Sea Thrift',
    rarity: 3, isStarter: false, atkBias: 10, defBias: 15, spdBias: 10,
    description: 'Strand-Grasnelke, salztolerant.', spriteSeedPrefix: 'sea_thrift',
    preferredBiomes: ['salzbucht'], wrongBiomes: ['frostkamm'] },
  { slug: 'sea-holly', scientificName: 'Eryngium maritimum', commonName: 'Sea Holly',
    rarity: 3, isStarter: false, atkBias: 15, defBias: 20, spdBias: 0,
    description: 'Strand-Mannstreu mit stacheligen Blaettern.', spriteSeedPrefix: 'sea_holly',
    preferredBiomes: ['salzbucht'], wrongBiomes: ['mordwald'] },
  { slug: 'mangrove', scientificName: 'Rhizophora mangle', commonName: 'Mangrove',
    rarity: 4, isStarter: false, atkBias: 10, defBias: 30, spdBias: -10,
    description: 'Mangrove mit Stelzwurzeln.', spriteSeedPrefix: 'mangrove',
    preferredBiomes: ['salzbucht'], wrongBiomes: ['frostkamm', 'kaktoria'] },
  { slug: 'sea-grape', scientificName: 'Coccoloba uvifera', commonName: 'Sea Grape',
    rarity: 3, isStarter: false, atkBias: 10, defBias: 15, spdBias: 10,
    description: 'Meertraube mit ledrigen Blaettern.', spriteSeedPrefix: 'sea_grape',
    preferredBiomes: ['salzbucht', 'verdanto'], wrongBiomes: ['frostkamm'] },
  { slug: 'beach-aster', scientificName: 'Symphyotrichum tenuifolium', commonName: 'Beach Aster',
    rarity: 2, isStarter: false, atkBias: 5, defBias: 10, spdBias: 15,
    description: 'Strand-Aster mit weissen Bluten.', spriteSeedPrefix: 'beach_aster',
    preferredBiomes: ['salzbucht'], wrongBiomes: ['kaktoria'] },

  // ============ V0.6 Mordwald-Carnivore (5) ============
  { slug: 'sundew', scientificName: 'Drosera capensis', commonName: 'Sundew',
    rarity: 3, isStarter: false, atkBias: 20, defBias: 0, spdBias: 10,
    description: 'Sonnentau mit klebrigen Tropfen.', spriteSeedPrefix: 'sundew',
    preferredBiomes: ['mordwald', 'verdanto'], wrongBiomes: ['kaktoria', 'frostkamm'] },
  { slug: 'pitcher-plant', scientificName: 'Nepenthes attenboroughii', commonName: 'Pitcher Plant',
    rarity: 4, isStarter: false, atkBias: 10, defBias: 25, spdBias: -10,
    description: 'Kannenpflanze mit Tier-Falle.', spriteSeedPrefix: 'pitcher_plant',
    preferredBiomes: ['mordwald'], wrongBiomes: ['kaktoria'] },
  { slug: 'cobra-lily', scientificName: 'Darlingtonia californica', commonName: 'Cobra Lily',
    rarity: 4, isStarter: false, atkBias: 20, defBias: 10, spdBias: -5,
    description: 'Kobra-Lilie, kobra-formige Blaetter.', spriteSeedPrefix: 'cobra_lily',
    preferredBiomes: ['mordwald'], wrongBiomes: ['salzbucht'] },
  { slug: 'bladderwort', scientificName: 'Utricularia vulgaris', commonName: 'Bladderwort',
    rarity: 2, isStarter: false, atkBias: 5, defBias: -10, spdBias: 25,
    description: 'Wasserschlauch mit Saugfallen.', spriteSeedPrefix: 'bladderwort',
    preferredBiomes: ['mordwald', 'verdanto'], wrongBiomes: ['frostkamm'] },
  { slug: 'corpse-flower', scientificName: 'Amorphophallus titanum', commonName: 'Corpse Flower',
    rarity: 5, isStarter: false, atkBias: 25, defBias: 15, spdBias: -20,
    description: 'Titanenwurz, riesige stinkende Bluete.', spriteSeedPrefix: 'corpse_flower',
    preferredBiomes: ['mordwald', 'verdanto'], wrongBiomes: ['frostkamm', 'kaktoria'] },

  // ============ V0.6 Magmabluete-Pyrophyt (5) ============
  { slug: 'fire-lily', scientificName: 'Cyrtanthus ventricosus', commonName: 'Fire Lily',
    rarity: 3, isStarter: false, atkBias: 20, defBias: -10, spdBias: 5,
    description: 'Feuerlilie, blueht nach Feuer.', spriteSeedPrefix: 'fire_lily',
    preferredBiomes: ['magmabluete'], wrongBiomes: ['frostkamm', 'salzbucht'] },
  { slug: 'banksia', scientificName: 'Banksia attenuata', commonName: 'Banksia',
    rarity: 3, isStarter: false, atkBias: 5, defBias: 20, spdBias: -10,
    description: 'Banksie, feuerresistent.', spriteSeedPrefix: 'banksia',
    preferredBiomes: ['magmabluete', 'kaktoria'], wrongBiomes: ['mordwald'] },
  { slug: 'serotinous-pine', scientificName: 'Pinus contorta', commonName: 'Lodgepole Pine',
    rarity: 4, isStarter: false, atkBias: 10, defBias: 25, spdBias: -10,
    description: 'Drehkiefer, oeffnet Zapfen bei Hitze.', spriteSeedPrefix: 'serotinous_pine',
    preferredBiomes: ['magmabluete', 'frostkamm'], wrongBiomes: ['mordwald'] },
  { slug: 'protea', scientificName: 'Protea cynaroides', commonName: 'King Protea',
    rarity: 4, isStarter: false, atkBias: 15, defBias: 10, spdBias: 0,
    description: 'Koenigsprotea, suedafrikanische Bluete.', spriteSeedPrefix: 'protea',
    preferredBiomes: ['magmabluete', 'kaktoria'], wrongBiomes: ['frostkamm'] },
  { slug: 'eucalyptus', scientificName: 'Eucalyptus regnans', commonName: 'Mountain Ash',
    rarity: 5, isStarter: false, atkBias: 25, defBias: 5, spdBias: 0,
    description: 'Riesen-Eukalyptus, australisch.', spriteSeedPrefix: 'eucalyptus',
    preferredBiomes: ['magmabluete'], wrongBiomes: ['salzbucht'] },

  // ============ V0.6 Wurzelheim-Garden (5) ============
  { slug: 'tulip', scientificName: 'Tulipa gesneriana', commonName: 'Tulip',
    rarity: 2, isStarter: false, atkBias: 5, defBias: 5, spdBias: 10,
    description: 'Klassische Garten-Tulpe.', spriteSeedPrefix: 'tulip',
    preferredBiomes: ['wurzelheim'], wrongBiomes: ['salzbucht'] },
  { slug: 'peony', scientificName: 'Paeonia lactiflora', commonName: 'Peony',
    rarity: 3, isStarter: false, atkBias: 15, defBias: 10, spdBias: 5,
    description: 'Pfingstrose, ueppige Bluete.', spriteSeedPrefix: 'peony',
    preferredBiomes: ['wurzelheim'], wrongBiomes: ['kaktoria', 'salzbucht'] },
  { slug: 'hydrangea', scientificName: 'Hydrangea macrophylla', commonName: 'Hydrangea',
    rarity: 3, isStarter: false, atkBias: 10, defBias: 15, spdBias: 5,
    description: 'Hortensie mit pH-abhaengiger Farbe.', spriteSeedPrefix: 'hydrangea',
    preferredBiomes: ['wurzelheim', 'verdanto'], wrongBiomes: ['kaktoria'] },
  { slug: 'sage', scientificName: 'Salvia officinalis', commonName: 'Sage',
    rarity: 2, isStarter: false, atkBias: 5, defBias: 10, spdBias: 15,
    description: 'Salbei, aromatisches Heilkraut.', spriteSeedPrefix: 'sage',
    preferredBiomes: ['wurzelheim', 'kaktoria'], wrongBiomes: ['mordwald'] },
  { slug: 'thyme', scientificName: 'Thymus vulgaris', commonName: 'Thyme',
    rarity: 2, isStarter: false, atkBias: 5, defBias: 5, spdBias: 20,
    description: 'Thymian, kleines Speed-Kraut.', spriteSeedPrefix: 'thyme',
    preferredBiomes: ['wurzelheim', 'kaktoria'], wrongBiomes: ['mordwald'] }
];

/** Vereinte Spezies-Liste (Basis + 10 Hybrid-Recipes). */
export const STARTER_SPECIES: PlantSpecies[] = [...BASE_SPECIES, ...HYBRID_SPECIES];

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

/** Anzahl Spezies. */
export function getSpeciesCount(): number {
  return STARTER_SPECIES.length;
}

/** Spezies pro Biom (preferred). */
export function getSpeciesByBiome(biome: string): PlantSpecies[] {
  return STARTER_SPECIES.filter((s) => s.preferredBiomes?.includes(biome));
}
