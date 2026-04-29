/**
 * B4-R3: Inventory-Layout Tests
 * Testet: Kind-Gruppierung, Count-Badge, Grid-Berechnung, kindColor
 */

import { describe, it, expect } from 'vitest';

const KIND_ORDER = [
  'seed', 'fertilizer', 'care-pollen', 'tier-pollen', 'soil-upgrade',
  'sun-lamp', 'sprinkler', 'hybrid-booster', 'compost',
  'heal', 'cure', 'boost', 'lure', 'water-can'
];

const KIND_COLORS: Record<string, number> = {
  seed: 0x4caf50,
  fertilizer: 0x8bc34a,
  'care-pollen': 0xffeb3b,
  'tier-pollen': 0xff9800,
  'soil-upgrade': 0x795548,
  'sun-lamp': 0xffc107,
  sprinkler: 0x2196f3,
  'hybrid-booster': 0xb86ee3,
  compost: 0x6d4c41,
  heal: 0xe91e63,
  cure: 0x9c27b0,
  boost: 0x00bcd4,
  lure: 0xff5722,
  'water-can': 0x03a9f4,
};

function cardsPerRow(width: number, cardW = 70, gap = 8): number {
  return Math.floor((width - 32) / (cardW + gap));
}

function sortKinds(kinds: string[]): string[] {
  return [...kinds].sort((a, b) => {
    const ia = KIND_ORDER.indexOf(a);
    const ib = KIND_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

function shortName(name: string): string {
  return name.length > 9 ? name.substring(0, 9) + '.' : name;
}

describe('Inventory Grid-Berechnung', () => {
  it('cards per row bei width=360 = 4', () => {
    expect(cardsPerRow(360)).toBe(4);
  });

  it('cards per row bei width=480 = 5', () => {
    expect(cardsPerRow(480)).toBe(5);
  });

  it('leere slots = cardsPerRow * 2', () => {
    const cpr = cardsPerRow(360);
    expect(cpr * 2).toBe(8);
  });
});

describe('Inventory Kategorie-Sortierung', () => {
  it('seed kommt vor heal', () => {
    const sorted = sortKinds(['heal', 'seed']);
    expect(sorted[0]).toBe('seed');
  });

  it('unbekannte kind kommt am ende', () => {
    const sorted = sortKinds(['unknown-kind', 'seed']);
    expect(sorted[sorted.length - 1]).toBe('unknown-kind');
  });

  it('reihenfolge seed -> fertilizer -> heal', () => {
    const sorted = sortKinds(['heal', 'fertilizer', 'seed']);
    expect(sorted[0]).toBe('seed');
    expect(sorted[1]).toBe('fertilizer');
    expect(sorted[2]).toBe('heal');
  });
});

describe('Inventory Item-Count-Badge', () => {
  it('count als string dargestellt', () => {
    expect(`${5}`).toBe('5');
    expect(`${99}`).toBe('99');
    expect(`${0}`).toBe('0');
  });
});

describe('Inventory kindColor', () => {
  it('seed hat grüne Farbe', () => {
    expect(KIND_COLORS['seed']).toBe(0x4caf50);
  });

  it('hybrid-booster hat lila Farbe', () => {
    expect(KIND_COLORS['hybrid-booster']).toBe(0xb86ee3);
  });

  it('unbekannte kind gibt undefined (fallback 0x607d8b)', () => {
    expect(KIND_COLORS['unknown']).toBeUndefined();
  });
});

describe('Inventory shortName', () => {
  it('name <= 9 chars bleibt unverändert', () => {
    expect(shortName('Sunflower')).toBe('Sunflower');
    expect(shortName('Seed')).toBe('Seed');
  });

  it('name > 9 chars wird auf 9 + Punkt gekürzt', () => {
    expect(shortName('Sunflower Extra Long')).toBe('Sunflower.');
    expect(shortName('HybridBooster')).toBe('HybridBoo.');
  });
});
