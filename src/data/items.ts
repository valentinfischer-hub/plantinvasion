/**
 * Item-Katalog V0.5 fuer Plantinvasion.
 * Items koennen im Markt gekauft, im Battle eingesetzt oder von NPCs erhalten werden.
 *
 * V0.5 ergaenzt: Booster-Items, Pollen, Sprinkler, Sun-Lamp, Soil-Upgrades, Seed-Items.
 */

import { getSpecies, getAllSpeciesSlugs } from './species';

export type ItemKind =
  | 'lure'
  | 'heal'
  | 'boost'
  | 'cure'
  | 'compost'
  | 'water-can'
  | 'fertilizer'        // NEU: XP-Booster
  | 'care-pollen'       // NEU: Care-Score-Booster
  | 'tier-pollen'       // NEU: Tier-Upgrade-Chance
  | 'sun-lamp'          // NEU: Tageszeit-Lock
  | 'sprinkler'         // NEU: Auto-Wasser
  | 'hybrid-booster'    // NEU: Mutation-Chance-Boost
  | 'soil-upgrade'      // NEU: Slot-Soil-Upgrade
  | 'seed';             // NEU: Pflanzbarer Samen

export interface ItemDef {
  slug: string;
  kind: ItemKind;
  name: string;
  description: string;
  buyPrice: number;
  sellPrice: number;
  /** Bei Booster-Items: Dauer in ms. 0 = one-shot. */
  durationMs?: number;
  /** Bei xp-Booster der Multiplikator. */
  multiplier?: number;
}

const STATIC_ITEMS: ItemDef[] = [
  // ============ V0.1 Items ============
  {
    slug: 'basic-lure',
    kind: 'lure',
    name: 'Einfacher Lockstoff',
    description: 'Erhoeht Capture-Rate im Battle.',
    buyPrice: 50,
    sellPrice: 12
  },
  {
    slug: 'great-lure',
    kind: 'lure',
    name: 'Starker Lockstoff',
    description: '2x Capture-Rate-Bonus.',
    buyPrice: 200,
    sellPrice: 50
  },
  {
    slug: 'heal-tonic',
    kind: 'heal',
    name: 'Heil-Tonikum',
    description: 'Stellt 50 HP einer Pflanze wieder her.',
    buyPrice: 80,
    sellPrice: 20
  },
  {
    slug: 'atk-boost',
    kind: 'boost',
    name: 'Angriffs-Boost',
    description: '+20% ATK fuer 3 Runden.',
    buyPrice: 120,
    sellPrice: 30
  },
  {
    slug: 'cure-spray',
    kind: 'cure',
    name: 'Heil-Spray',
    description: 'Entfernt Status-Effekte.',
    buyPrice: 100,
    sellPrice: 25
  },
  {
    slug: 'compost-bag',
    kind: 'compost',
    name: 'Kompost-Sack',
    description: 'Beschleunigt Wachstum im Garten.',
    buyPrice: 60,
    sellPrice: 15
  },
  // ============ V0.5 Booster-Items ============
  {
    slug: 'volcano-ash',
    kind: 'fertilizer',
    name: 'Vulkan-Asche',
    description: '1.5x XP-Multiplier fuer 1 Stunde.',
    buyPrice: 80,
    sellPrice: 20,
    durationMs: 60 * 60 * 1000,
    multiplier: 1.5
  },
  {
    slug: 'compost-tea',
    kind: 'fertilizer',
    name: 'Kompost-Tee',
    description: '1.25x XP-Multiplier fuer 30 Minuten. Anfaenger-Booster.',
    buyPrice: 30,
    sellPrice: 8,
    durationMs: 30 * 60 * 1000,
    multiplier: 1.25
  },
  {
    slug: 'super-fertilizer',
    kind: 'fertilizer',
    name: 'Premium-Duenger',
    description: '2.0x XP-Multiplier fuer 90 Minuten. Selten.',
    buyPrice: 250,
    sellPrice: 60,
    durationMs: 90 * 60 * 1000,
    multiplier: 2.0
  },
  {
    slug: 'swamp-pollen',
    kind: 'care-pollen',
    name: 'Sumpf-Pollen',
    description: '+50 Care-Score sofort. Zaehlt fuer Tier-Snapshot vor Adult.',
    buyPrice: 90,
    sellPrice: 22
  },
  {
    slug: 'pristine-pollen',
    kind: 'tier-pollen',
    name: 'Pristine-Pollen',
    description: '25% Chance: Quality-Tier um eine Stufe heben.',
    buyPrice: 250,
    sellPrice: 60
  },
  {
    slug: 'sun-lamp',
    kind: 'sun-lamp',
    name: 'Sonnenlampe',
    description: 'Ignoriert Tag-Nacht-Penalty fuer 8 Stunden.',
    buyPrice: 500,
    sellPrice: 100,
    durationMs: 8 * 60 * 60 * 1000
  },
  {
    slug: 'sprinkler',
    kind: 'sprinkler',
    name: 'Sprinkler',
    description: 'Haelt Hydration bei mind. 80% fuer 24 Stunden.',
    buyPrice: 350,
    sellPrice: 80,
    durationMs: 24 * 60 * 60 * 1000
  },
  {
    slug: 'hybrid-booster',
    kind: 'hybrid-booster',
    name: 'Hybrid-Verstaerker',
    description: 'Naechstes Crossing: Mutation-Chance verdoppelt (5% -> 10%).',
    buyPrice: 600,
    sellPrice: 150
  },
  {
    slug: 'soil-bronze',
    kind: 'soil-upgrade',
    name: 'Bronze-Erde',
    description: 'Permanente Slot-Aufruestung: 1.1x XP. Apply-Once-Per-Slot.',
    buyPrice: 100,
    sellPrice: 25
  },
  {
    slug: 'soil-silver',
    kind: 'soil-upgrade',
    name: 'Silber-Erde',
    description: 'Permanent: 1.2x XP, +5% Mutation-Chance. Apply-Once-Per-Slot.',
    buyPrice: 300,
    sellPrice: 75
  },
  {
    slug: 'soil-gold',
    kind: 'soil-upgrade',
    name: 'Gold-Erde',
    description: 'Permanent: 1.3x XP, +10% Mutation, -20% Hydration-Decay. Apply-Once-Per-Slot.',
    buyPrice: 800,
    sellPrice: 200
  }
];

/**
 * Seeds werden dynamisch generiert - eines pro Spezies.
 * Slug: seed-<species-slug>.
 * Preis abhaengig von Rarity.
 */
function buildSeedItems(): ItemDef[] {
  const items: ItemDef[] = [];
  for (const slug of getAllSpeciesSlugs()) {
    const species = getSpecies(slug);
    if (!species) continue;
    const buyPrice = [30, 60, 120, 250, 600][species.rarity - 1] ?? 30;
    items.push({
      slug: `seed-${slug}`,
      kind: 'seed',
      name: `${species.commonName} Samen`,
      description: `Einsaeen um eine neue ${species.commonName} im Garten zu starten.`,
      buyPrice,
      sellPrice: Math.floor(buyPrice * 0.25)
    });
  }
  return items;
}

export const ITEMS: ItemDef[] = [
  {
    slug: 'tilda-diary',
    kind: 'compost',  // generic kind, not consumable
    name: 'Tildas Tagebuch',
    description: 'Das Forschungstagebuch deiner Grossmutter. Zentrales Story-Item.',
    buyPrice: 0,
    sellPrice: 0
  },
  {
    slug: 'iris-staff',
    kind: 'boost',
    name: 'Iris-Eichenstab',
    description: 'Stab aus Eichenholz von Iris. +10% Crit-Rate im Battle.',
    buyPrice: 0,
    sellPrice: 0
  },
  {
    slug: 'sun-amulet',
    kind: 'boost',
    name: 'Tildas Sonnenamulett',
    description: 'Goldenes Amulett mit Sonnenmotiv. +20% XP nach Kaempfen.',
    buyPrice: 0,
    sellPrice: 0
  },
  {
    slug: 'eden-key',
    kind: 'compost',
    name: 'Eden-Schluessel',
    description: 'Symbol-Sammlung der 7 Verbuendeten. Oeffnet Eden Lost.',
    buyPrice: 0,
    sellPrice: 0
  },
  {
    slug: 'verodyne-document',
    kind: 'compost',
    name: 'Verodyne-Dokument',
    description: 'Beweisstueck gegen Verodyne Corporation.',
    buyPrice: 0,
    sellPrice: 0
  },
...STATIC_ITEMS, ...buildSeedItems()];

export function getItem(slug: string): ItemDef | undefined {
  return ITEMS.find((i) => i.slug === slug);
}

export function isSeedItem(slug: string): boolean {
  return slug.startsWith('seed-');
}

export function speciesSlugFromSeed(seedSlug: string): string | undefined {
  if (!seedSlug.startsWith('seed-')) return undefined;
  return seedSlug.slice(5);
}

export const STARTER_INVENTORY: Record<string, number> = {
  'basic-lure': 3,
  'heal-tonic': 2,
  'compost-tea': 2,
  'seed-fern': 1
};
