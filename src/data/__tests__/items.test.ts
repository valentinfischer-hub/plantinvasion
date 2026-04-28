import { describe, it, expect } from 'vitest';
import {
  ITEMS, getItem, isSeedItem, speciesSlugFromSeed, STARTER_INVENTORY
} from '../items';

describe('ITEMS Datenstruktur', () => {
  it('hat mindestens 5 Items', () => {
    expect(ITEMS.length).toBeGreaterThanOrEqual(5);
  });

  it('jedes Item hat slug, name, kind, description', () => {
    for (const it of ITEMS) {
      expect(it.slug).toBeTruthy();
      expect(it.name).toBeTruthy();
      expect(it.kind).toBeTruthy();
      expect(it.description).toBeTruthy();
    }
  });

  it('keine duplizierten slugs', () => {
    const slugs = ITEMS.map((it) => it.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('getItem', () => {
  it('liefert Item bei bekanntem slug', () => {
    const first = ITEMS[0];
    expect(getItem(first.slug)).toEqual(first);
  });
  it('liefert undefined bei unbekanntem slug', () => {
    expect(getItem('not-a-real-item')).toBeUndefined();
  });
});

describe('isSeedItem', () => {
  it('true fuer "seed-..."', () => {
    expect(isSeedItem('seed-sunflower')).toBe(true);
    expect(isSeedItem('seed-mint')).toBe(true);
  });
  it('false fuer non-seed', () => {
    expect(isSeedItem('compost-tea')).toBe(false);
    expect(isSeedItem('heal-tonic')).toBe(false);
    expect(isSeedItem('seedling')).toBe(false);
  });
});

describe('speciesSlugFromSeed', () => {
  it('extracts species from seed-slug', () => {
    expect(speciesSlugFromSeed('seed-sunflower')).toBe('sunflower');
    expect(speciesSlugFromSeed('seed-mint')).toBe('mint');
  });
  it('liefert undefined fuer non-seed', () => {
    expect(speciesSlugFromSeed('compost-tea')).toBeUndefined();
  });
});

describe('STARTER_INVENTORY', () => {
  it('enthaelt mindestens 3 Items', () => {
    expect(Object.keys(STARTER_INVENTORY).length).toBeGreaterThanOrEqual(3);
  });
  it('alle counts sind positive Integers', () => {
    for (const count of Object.values(STARTER_INVENTORY)) {
      expect(count).toBeGreaterThan(0);
      expect(Number.isInteger(count)).toBe(true);
    }
  });
});
