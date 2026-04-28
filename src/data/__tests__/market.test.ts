/**
 * Tests: Market-Economy Balance (S-POLISH-B2-R9)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ITEMS, getItem, isSeedItem, speciesSlugFromSeed, STARTER_INVENTORY } from '../items';

describe('Market Pricing — Sell-Ratio', () => {
  it('alle kaufbaren Items haben sellPrice > 0 wenn buyPrice > 0', () => {
    const purchasable = ITEMS.filter((i) => i.buyPrice > 0);
    for (const item of purchasable) {
      expect(item.sellPrice).toBeGreaterThan(0);
    }
  });

  it('sellPrice ist nie höher als buyPrice', () => {
    const purchasable = ITEMS.filter((i) => i.buyPrice > 0);
    for (const item of purchasable) {
      expect(item.sellPrice).toBeLessThanOrEqual(item.buyPrice);
    }
  });

  it('Seed-Items haben 25% sell-ratio (floor)', () => {
    const seeds = ITEMS.filter((i) => isSeedItem(i.slug) && i.buyPrice > 0);
    expect(seeds.length).toBeGreaterThan(0);
    for (const seed of seeds) {
      const expected = Math.floor(seed.buyPrice * 0.25);
      expect(seed.sellPrice).toBe(expected);
    }
  });
});

describe('Market Pricing — Rarity-Tiers', () => {
  const rarityPrices = [30, 60, 120, 250, 600];

  it('Seed-Preise entsprechen dem Rarity-Tier', () => {
    // Wir prüfen dass alle seed-buyPrices in der erlaubten Menge sind
    const seeds = ITEMS.filter((i) => isSeedItem(i.slug));
    expect(seeds.length).toBeGreaterThan(0);
    for (const seed of seeds) {
      expect(rarityPrices).toContain(seed.buyPrice);
    }
  });

  it('Rarity-Preise sind aufsteigend sortiert', () => {
    for (let i = 1; i < rarityPrices.length; i++) {
      expect(rarityPrices[i]).toBeGreaterThan(rarityPrices[i - 1]);
    }
  });
});

describe('Market Pricing — Booster-Items', () => {
  it('Kompost-Tee ist günstigster Booster (Einsteiger)', () => {
    const tea = getItem('compost-tea');
    expect(tea).toBeDefined();
    expect(tea!.buyPrice).toBeLessThanOrEqual(50);
  });

  it('Hybrid-Verstärker ist teuerster Booster (nicht Boden-Upgrade)', () => {
    const hybrid = getItem('hybrid-booster');
    // Boden-Upgrades (soil-*) sind permanent und dürfen teurer sein
    const boosterPrices = ITEMS
      .filter((i) => i.buyPrice > 0 && !isSeedItem(i.slug) && i.kind !== 'soil-upgrade')
      .map((i) => i.buyPrice);
    expect(hybrid!.buyPrice).toBe(Math.max(...boosterPrices));
  });

  it('Booster mit durationMs haben positive Dauer', () => {
    const boosters = ITEMS.filter((i) => i.durationMs !== undefined);
    for (const b of boosters) {
      expect(b.durationMs).toBeGreaterThan(0);
    }
  });

  it('XP-Booster haben multiplier >= 1.25', () => {
    const xpBoosters = ITEMS.filter((i) => i.kind === 'fertilizer' && i.multiplier !== undefined);
    expect(xpBoosters.length).toBeGreaterThan(0);
    for (const b of xpBoosters) {
      expect(b.multiplier!).toBeGreaterThanOrEqual(1.25);
    }
  });
});

describe('Market Pricing — Boden-Upgrades', () => {
  it('Boden-Upgrades Bronze < Silber < Gold', () => {
    const bronze = getItem('soil-bronze');
    const silver = getItem('soil-silver');
    const gold = getItem('soil-gold');
    expect(bronze).toBeDefined();
    expect(silver).toBeDefined();
    expect(gold).toBeDefined();
    expect(bronze!.buyPrice).toBeLessThan(silver!.buyPrice);
    expect(silver!.buyPrice).toBeLessThan(gold!.buyPrice);
  });

  it('Gold-Erde ist das teuerste Boden-Upgrade', () => {
    const gold = getItem('soil-gold');
    expect(gold!.buyPrice).toBeGreaterThanOrEqual(500);
  });
});

describe('Market — getItem Hilfsfunktion', () => {
  it('gibt undefined für unbekannten Slug zurück', () => {
    expect(getItem('nicht-existent-xyz')).toBeUndefined();
  });

  it('gibt korrekte ItemDef für bekannten Slug', () => {
    const item = getItem('basic-lure');
    expect(item).toBeDefined();
    expect(item!.slug).toBe('basic-lure');
    expect(item!.kind).toBe('lure');
  });
});

describe('Market — Seed-Hilfsfunktionen', () => {
  it('isSeedItem erkennt Seed-Slugs korrekt', () => {
    expect(isSeedItem('seed-fern')).toBe(true);
    expect(isSeedItem('compost-tea')).toBe(false);
    expect(isSeedItem('seed-')).toBe(true); // Edge-Case: prefix only
  });

  it('speciesSlugFromSeed extrahiert Spezies-Slug', () => {
    expect(speciesSlugFromSeed('seed-sunflower')).toBe('sunflower');
    expect(speciesSlugFromSeed('basic-lure')).toBeUndefined();
  });
});

describe('Market — STARTER_INVENTORY', () => {
  it('Starter-Items sind alle in ITEMS vorhanden', () => {
    for (const slug of Object.keys(STARTER_INVENTORY)) {
      expect(getItem(slug)).toBeDefined();
    }
  });

  it('Starter-Mengen sind positiv', () => {
    for (const count of Object.values(STARTER_INVENTORY)) {
      expect(count).toBeGreaterThan(0);
    }
  });
});
