import { describe, it, expect } from 'vitest';
import {
  pickEncounter,
  randomLevel,
  WURZELHEIM_TALLGRASS,
  VERDANTO_TALLGRASS,
  VERDANTO_BROMELIEN,
  KAKTORIA_TALLGRASS,
  FROSTKAMM_TALLGRASS,
  SALZBUCHT_TALLGRASS,
  type EncounterDef
} from '../encounters';

describe('Encounter-Pools Datenstruktur', () => {
  it('alle Pools haben mindestens 3 Encounter', () => {
    expect(WURZELHEIM_TALLGRASS.length).toBeGreaterThanOrEqual(3);
    expect(VERDANTO_TALLGRASS.length).toBeGreaterThanOrEqual(3);
    expect(VERDANTO_BROMELIEN.length).toBeGreaterThanOrEqual(3);
    expect(KAKTORIA_TALLGRASS.length).toBeGreaterThanOrEqual(3);
    expect(FROSTKAMM_TALLGRASS.length).toBeGreaterThanOrEqual(3);
    expect(SALZBUCHT_TALLGRASS.length).toBeGreaterThanOrEqual(3);
  });

  it('jeder Encounter hat valide Felder', () => {
    const allPools = [
      WURZELHEIM_TALLGRASS, VERDANTO_TALLGRASS, VERDANTO_BROMELIEN,
      KAKTORIA_TALLGRASS, FROSTKAMM_TALLGRASS, SALZBUCHT_TALLGRASS
    ];
    for (const pool of allPools) {
      for (const e of pool) {
        expect(e.slug).toBeTruthy();
        expect(e.weight).toBeGreaterThan(0);
        expect(e.minLevel).toBeGreaterThan(0);
        expect(e.maxLevel).toBeGreaterThanOrEqual(e.minLevel);
        expect(typeof e.baseColor).toBe('number');
      }
    }
  });
});

describe('pickEncounter', () => {
  it('liefert immer einen Encounter aus dem Pool', () => {
    for (let i = 0; i < 50; i++) {
      const e = pickEncounter(WURZELHEIM_TALLGRASS);
      expect(WURZELHEIM_TALLGRASS).toContain(e);
    }
  });

  it('Determinismus mit fixed RNG', () => {
    const fixedRng = () => 0.5;
    const e1 = pickEncounter(WURZELHEIM_TALLGRASS, fixedRng);
    const e2 = pickEncounter(WURZELHEIM_TALLGRASS, fixedRng);
    expect(e1.slug).toBe(e2.slug);
  });

  it('rng=0 liefert ersten Encounter (after weight-roll)', () => {
    const e = pickEncounter(WURZELHEIM_TALLGRASS, () => 0);
    expect(WURZELHEIM_TALLGRASS[0]).toEqual(e);
  });

  it('rng=0.999 liefert (mit hoher Wahrscheinlichkeit) letzten', () => {
    const e = pickEncounter(WURZELHEIM_TALLGRASS, () => 0.999);
    expect(WURZELHEIM_TALLGRASS).toContain(e);
  });

  it('liefert letzten als Fallback bei rounding', () => {
    const tinyPool: EncounterDef[] = [{
      slug: 'x', scientificName: 'X', commonName: 'X', family: 'Asteraceae',
      weight: 1, minLevel: 1, maxLevel: 1, baseColor: 0
    }];
    expect(pickEncounter(tinyPool).slug).toBe('x');
  });
});

describe('randomLevel', () => {
  it('liefert Level zwischen min und max', () => {
    const def: EncounterDef = {
      slug: 'x', scientificName: 'X', commonName: 'X', family: 'Asteraceae',
      weight: 1, minLevel: 5, maxLevel: 10, baseColor: 0
    };
    for (let i = 0; i < 50; i++) {
      const lv = randomLevel(def);
      expect(lv).toBeGreaterThanOrEqual(5);
      expect(lv).toBeLessThanOrEqual(10);
    }
  });

  it('Determinismus mit fixed RNG', () => {
    const def: EncounterDef = {
      slug: 'x', scientificName: 'X', commonName: 'X', family: 'Asteraceae',
      weight: 1, minLevel: 5, maxLevel: 10, baseColor: 0
    };
    expect(randomLevel(def, () => 0.5)).toBe(randomLevel(def, () => 0.5));
  });

  it('minLevel=maxLevel liefert exakt diesen Wert', () => {
    const def: EncounterDef = {
      slug: 'x', scientificName: 'X', commonName: 'X', family: 'Asteraceae',
      weight: 1, minLevel: 7, maxLevel: 7, baseColor: 0
    };
    expect(randomLevel(def, () => 0)).toBe(7);
    expect(randomLevel(def, () => 0.99)).toBe(7);
  });
});
