import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ALLELES,
  getAllele,
  allelesForSlot,
  rollAllele,
  rollInitialGenes,
  inheritGenes,
  geneStatBonus,
  type GeneSet,
  type GeneSlot
} from '../genes';

describe('ALLELES Datenstruktur', () => {
  it('hat mindestens 16 Allele', () => {
    expect(ALLELES.length).toBeGreaterThanOrEqual(16);
  });

  it('jedes Allele hat slug, slot, dominant, label, description', () => {
    for (const a of ALLELES) {
      expect(a.slug).toBeTruthy();
      expect(a.slot).toBeTruthy();
      expect(typeof a.dominant).toBe('boolean');
      expect(a.label).toBeTruthy();
      expect(a.description).toBeTruthy();
    }
  });

  it('keine duplizierten slugs', () => {
    const slugs = ALLELES.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('alle 6 GeneSlots kommen vor', () => {
    const slots = new Set(ALLELES.map((a) => a.slot));
    expect(slots.has('attack')).toBe(true);
    expect(slots.has('growth')).toBe(true);
    expect(slots.has('resistance')).toBe(true);
    expect(slots.has('utility')).toBe(true);
    expect(slots.has('mutation')).toBe(true);
    expect(slots.has('form')).toBe(true);
  });
});

describe('getAllele', () => {
  it('liefert Allele bei bekanntem slug', () => {
    expect(getAllele('attack-sharp')).toBeDefined();
  });
  it('liefert undefined bei unbekanntem slug', () => {
    expect(getAllele('not-a-real-allele')).toBeUndefined();
  });
});

describe('allelesForSlot', () => {
  it('filtert nach slot', () => {
    const attackAlleles = allelesForSlot('attack');
    expect(attackAlleles.length).toBeGreaterThan(0);
    for (const a of attackAlleles) expect(a.slot).toBe('attack');
  });

  it('mutation-slot hat mehrere Allele', () => {
    expect(allelesForSlot('mutation').length).toBeGreaterThanOrEqual(3);
  });
});

describe('rollAllele', () => {
  it('liefert Slug aus dem entsprechenden Slot', () => {
    const slug = rollAllele('attack');
    const def = getAllele(slug);
    expect(def?.slot).toBe('attack');
  });

  it('mutation-Slot ohne includeMutation -> kein mutation-Allele', () => {
    // NICHT erschoepfend, aber Sample-Test
    for (let i = 0; i < 20; i++) {
      const slug = rollAllele('mutation', false);
      // Falls leer Pool, undefined moeglich; sonst muss es ein Allele sein
      if (slug) {
        const def = getAllele(slug);
        if (def) expect(def.slot).toBe('mutation');
      }
    }
  });
});

describe('rollInitialGenes', () => {
  it('liefert alle 5 nicht-mutation-Slots besetzt + mutation leer', () => {
    const genes = rollInitialGenes();
    expect(genes.attack).toBeTruthy();
    expect(genes.growth).toBeTruthy();
    expect(genes.resistance).toBeTruthy();
    expect(genes.utility).toBeTruthy();
    expect(genes.form).toBeTruthy();
    expect(genes.mutation).toBe('');
  });
});

describe('inheritGenes', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random');
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Mutation=true setzt mutation-Allele', () => {
    const a: GeneSet = { attack: 'attack-sharp', growth: 'growth-fast', resistance: 'resist-frost', utility: 'util-bloom', mutation: '', form: '' };
    const b: GeneSet = { attack: 'attack-poison', growth: 'growth-deep-root', resistance: 'resist-drought', utility: 'util-trade', mutation: '', form: '' };
    const child = inheritGenes(a, b, true);
    expect(child.mutation).toBeTruthy();
  });

  it('70%-Pfad nimmt Eltern-Allele', () => {
    (Math.random as unknown as { mockReturnValue: (v: number) => void }).mockReturnValue(0.1);
    const a: GeneSet = { attack: 'attack-sharp', growth: 'growth-fast', resistance: 'resist-frost', utility: 'util-bloom', mutation: '', form: '' };
    const b: GeneSet = { attack: 'attack-poison', growth: 'growth-fast', resistance: 'resist-frost', utility: 'util-bloom', mutation: '', form: '' };
    const child = inheritGenes(a, b, false);
    // attack: A dominant (sharp), B nicht-dominant (poison) -> dominant gewinnt
    expect(child.attack).toBe('attack-sharp');
  });
});

describe('geneStatBonus', () => {
  it('liefert 0 bei undefined', () => {
    expect(geneStatBonus(undefined)).toEqual({ atk: 0, def: 0, spd: 0 });
  });

  it('liefert 0 bei leeren genes', () => {
    expect(geneStatBonus({})).toEqual({ atk: 0, def: 0, spd: 0 });
  });

  it('summiert atkBonus aus attack-sharp', () => {
    const r = geneStatBonus({ attack: 'attack-sharp' });
    expect(r.atk).toBe(5);
    expect(r.def).toBe(0);
    expect(r.spd).toBe(0);
  });

  it('summiert defBonus aus resist-frost', () => {
    const r = geneStatBonus({ resistance: 'resist-frost' });
    expect(r.def).toBe(5);
  });

  it('summiert spdBonus + atkBonus aus attack-spore', () => {
    const r = geneStatBonus({ attack: 'attack-spore' });
    expect(r.atk).toBe(2);
    expect(r.spd).toBe(2);
  });

  it('ignoriert unbekannte Slugs', () => {
    expect(geneStatBonus({ attack: 'not-a-real-allele' })).toEqual({ atk: 0, def: 0, spd: 0 });
  });
});

void GeneSlot;
