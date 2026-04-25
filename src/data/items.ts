/**
 * Item-Katalog V0.1 fuer Plantinvasion.
 * Items koennen im Markt gekauft, im Battle eingesetzt oder von NPCs erhalten werden.
 */

export type ItemKind = 'lure' | 'heal' | 'boost' | 'cure' | 'compost' | 'water-can';

export interface ItemDef {
  slug: string;
  kind: ItemKind;
  name: string;
  description: string;
  buyPrice: number;
  sellPrice: number;
}

export const ITEMS: ItemDef[] = [
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
  }
];

export function getItem(slug: string): ItemDef | undefined {
  return ITEMS.find((i) => i.slug === slug);
}

export const STARTER_INVENTORY: Record<string, number> = {
  'basic-lure': 3,
  'heal-tonic': 2
};
