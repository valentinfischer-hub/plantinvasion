import { describe, it, expect } from 'vitest';
import {
  STARTER_SPECIES,
  getSpecies,
  getPlantableSpecies,
  getAllSpeciesSlugs,
  getSpeciesCount,
  getSpeciesByBiome
} from '../species';

describe('STARTER_SPECIES Datenstruktur', () => {
  it('hat mindestens 10 Spezies', () => {
    expect(STARTER_SPECIES.length).toBeGreaterThanOrEqual(10);
  });

  it('jede Spezies hat slug, scientificName, commonName, rarity, atkBias/defBias/spdBias', () => {
    for (const s of STARTER_SPECIES) {
      expect(s.slug).toBeTruthy();
      expect(s.scientificName).toBeTruthy();
      expect(s.commonName).toBeTruthy();
      expect(s.rarity).toBeTruthy();
      expect(typeof s.atkBias).toBe('number');
      expect(typeof s.defBias).toBe('number');
      expect(typeof s.spdBias).toBe('number');
    }
  });

  it('keine duplizierten slugs', () => {
    const slugs = STARTER_SPECIES.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('mindestens 1 Spezies isStarter=true', () => {
    expect(STARTER_SPECIES.some((s) => s.isStarter)).toBe(true);
  });
});

describe('getSpecies', () => {
  it('liefert Species bei bekanntem slug', () => {
    expect(getSpecies('sunflower')).toBeDefined();
  });
  it('liefert undefined bei unbekanntem slug', () => {
    expect(getSpecies('not-a-real-species')).toBeUndefined();
  });
});

describe('getPlantableSpecies', () => {
  it('liefert nur isStarter=true', () => {
    const r = getPlantableSpecies();
    expect(r.length).toBeGreaterThan(0);
    for (const s of r) expect(s.isStarter).toBe(true);
  });
});

describe('getAllSpeciesSlugs', () => {
  it('liefert alle slugs', () => {
    const slugs = getAllSpeciesSlugs();
    expect(slugs.length).toBe(STARTER_SPECIES.length);
  });
});

describe('getSpeciesCount', () => {
  it('liefert Anzahl Species', () => {
    expect(getSpeciesCount()).toBe(STARTER_SPECIES.length);
  });
});

describe('getSpeciesByBiome', () => {
  it('liefert preferred-Species fuer ein Biom', () => {
    const r = getSpeciesByBiome('wurzelheim');
    for (const s of r) {
      expect(s.preferredBiomes).toContain('wurzelheim');
    }
  });
  it('leeres Array bei unbekanntem Biom', () => {
    expect(getSpeciesByBiome('not-a-real-biome')).toEqual([]);
  });
});
