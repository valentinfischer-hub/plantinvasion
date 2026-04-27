/**
 * Gen-Slot-System V0.1
 *
 * Inspiration: pflanzen_rpg_design.docx (User-Upload 2026-04-25).
 * 6 Gen-Slots pro Pflanze. Vererbung 70% Eltern / 20% Variation / 10% Mutation.
 *
 * Allele sind String-Tokens. Manche sind dominant, manche rezessiv. Crossing
 * bevorzugt dominante Allele wenn beide Eltern eines tragen.
 */

export type GeneSlot = 'attack' | 'growth' | 'resistance' | 'utility' | 'mutation' | 'form';

export interface AlleleDef {
  slug: string;
  slot: GeneSlot;
  dominant: boolean;
  /** Anzeige-Name */
  label: string;
  /** Effect-Bonus beim Tick (XP-Mult, Stat-Bonus etc.) */
  xpBonus?: number;
  defBonus?: number;
  atkBonus?: number;
  spdBonus?: number;
  /** Beschreibung fuer UI */
  description: string;
}

export const ALLELES: AlleleDef[] = [
  // Attack
  { slug: 'attack-sharp', slot: 'attack', dominant: true, label: 'Stachel-Angriff', atkBonus: 5, description: 'Scharfe Spitzen verstaerken Angriff' },
  { slug: 'attack-poison', slot: 'attack', dominant: false, label: 'Gift-Druese', atkBonus: 3, description: 'Versteckte Gift-Reserve' },
  { slug: 'attack-spore', slot: 'attack', dominant: false, label: 'Spore-Wurf', atkBonus: 2, spdBonus: 2, description: 'Sporen treffen schnell' },
  // Growth
  { slug: 'growth-fast', slot: 'growth', dominant: true, label: 'Schnellwuechsig', xpBonus: 0.10, description: '+10% XP-Wachstum' },
  { slug: 'growth-deep-root', slot: 'growth', dominant: false, label: 'Tiefwurzler', xpBonus: 0.05, defBonus: 3, description: '+5% XP, +3 DEF' },
  { slug: 'growth-photo', slot: 'growth', dominant: true, label: 'Photosynthese', xpBonus: 0.08, description: '+8% bei Tag' },
  // Resistance
  { slug: 'resist-frost', slot: 'resistance', dominant: false, label: 'Frostresistent', defBonus: 5, description: 'Immun gegen Eis-Schaden' },
  { slug: 'resist-drought', slot: 'resistance', dominant: true, label: 'Trockenresistent', defBonus: 3, description: 'Hydration-Decay -25%' },
  { slug: 'resist-toxic', slot: 'resistance', dominant: false, label: 'Toxin-Schutz', defBonus: 4, description: 'Immun gegen Status-Effekte' },
  // Utility
  { slug: 'util-bloom', slot: 'utility', dominant: true, label: 'Vielblueher', description: 'Bloom-Cycle 30% schneller' },
  { slug: 'util-trade', slot: 'utility', dominant: false, label: 'Wertvoll', description: 'Verkaufspreis +50%' },
  { slug: 'util-lure', slot: 'utility', dominant: false, label: 'Lockstoff', description: 'Battle-Drops +10%' },
  // Mutation (latent, nur bei Mutation aktiv)
  { slug: 'mut-stat', slot: 'mutation', dominant: false, label: 'Stat-Mutation', description: '+15% random Stat' },
  { slug: 'mut-skill', slot: 'mutation', dominant: false, label: 'Skill-Mutation', description: 'Bonus-Move im Battle' },
  { slug: 'mut-form', slot: 'mutation', dominant: false, label: 'Form-Mutation', description: 'Visueller Glow' },
  { slug: 'mut-legendary', slot: 'mutation', dominant: false, label: 'Legendary', description: '+20% all Stats, leuchtet' },
  // Form
  { slug: 'form-compact', slot: 'form', dominant: true, label: 'Kompakt', defBonus: 4, description: 'Kleine Form, mehr DEF' },
  { slug: 'form-tall', slot: 'form', dominant: false, label: 'Hochwuechsig', atkBonus: 4, description: 'Hohe Form, mehr ATK' },
  { slug: 'form-spread', slot: 'form', dominant: false, label: 'Ausgebreitet', spdBonus: 4, description: 'Breite Form, mehr SPD' }
];

export interface GeneSet {
  attack?: string;
  growth?: string;
  resistance?: string;
  utility?: string;
  mutation?: string;
  form?: string;
}

export function getAllele(slug: string): AlleleDef | undefined {
  return ALLELES.find((a) => a.slug === slug);
}

export function allelesForSlot(slot: GeneSlot): AlleleDef[] {
  return ALLELES.filter((a) => a.slot === slot);
}

/** Roll random allele fuer einen Slot. */
export function rollAllele(slot: GeneSlot, includeMutation = false): string {
  const pool = allelesForSlot(slot);
  // Mutation-Slot bleibt meistens leer (nur bei mutation-Roll gefuellt)
  if (slot === 'mutation' && !includeMutation) return '';
  // Dominante haeufiger als rezessiv: 60/40
  const isDominant = Math.random() < 0.6;
  const filtered = pool.filter((a) => a.dominant === isDominant);
  const useFiltered = filtered.length > 0 ? filtered : pool;
  return useFiltered[Math.floor(Math.random() * useFiltered.length)].slug;
}

/** Roll initiale Genes fuer eine neue Plant. */
export function rollInitialGenes(): GeneSet {
  return {
    attack: rollAllele('attack'),
    growth: rollAllele('growth'),
    resistance: rollAllele('resistance'),
    utility: rollAllele('utility'),
    mutation: '', // leer bei Standard-Pflanzen
    form: rollAllele('form')
  };
}

/**
 * Crossing-Vererbung: 70% Eltern (per Slot 50/50 zwischen A und B mit Dominanz-Bias),
 * 20% Variation (random aus Pool), 10% Mutation (random plus Mutation-Slot setzen).
 */
export function inheritGenes(parentA: GeneSet, parentB: GeneSet, isMutation: boolean): GeneSet {
  const child: GeneSet = {};
  const slots: GeneSlot[] = ['attack', 'growth', 'resistance', 'utility', 'mutation', 'form'];
  for (const slot of slots) {
    const roll = Math.random();
    if (roll < 0.70) {
      // 70% Eltern: bevorzuge Dominante wenn beide besetzt
      const alleleA = parentA[slot];
      const alleleB = parentB[slot];
      const defA = alleleA ? getAllele(alleleA) : undefined;
      const defB = alleleB ? getAllele(alleleB) : undefined;
      let chosen: string | undefined;
      if (defA && defB && defA.dominant && !defB.dominant) chosen = alleleA;
      else if (defA && defB && defB.dominant && !defA.dominant) chosen = alleleB;
      else chosen = Math.random() < 0.5 ? alleleA : alleleB;
      child[slot] = chosen ?? rollAllele(slot);
    } else if (roll < 0.90) {
      // 20% Variation: random allele aus Pool
      child[slot] = rollAllele(slot, slot === 'mutation' && isMutation);
    } else {
      // 10% Mutation-Bias: roll random, bei Mutation-Slot auch mutation-allele moeglich
      if (slot === 'mutation' && isMutation) {
        child[slot] = rollAllele('mutation', true);
      } else {
        child[slot] = rollAllele(slot);
      }
    }
  }
  // Wenn isMutation: setze auf jeden Fall ein mutation-Allele
  if (isMutation && !child.mutation) {
    child.mutation = rollAllele('mutation', true);
  }
  return child;
}

/** Berechnet Gene-bedingte Stat-Boni. */
export function geneStatBonus(genes: GeneSet | undefined): { atk: number; def: number; spd: number } {
  const bonus = { atk: 0, def: 0, spd: 0 };
  if (!genes) return bonus;
  for (const slug of Object.values(genes)) {
    if (!slug) continue;
    const def = getAllele(slug);
    if (!def) continue;
    bonus.atk += def.atkBonus ?? 0;
    bonus.def += def.defBonus ?? 0;
    bonus.spd += def.spdBonus ?? 0;
  }
  return bonus;
}

/** Berechnet Gene-bedingten XP-Bonus (Wert > 0, wird zu 1 + bonus multipliziert). */
export function geneXpBonus(genes: GeneSet | undefined): number {
  if (!genes) return 0;
  let bonus = 0;
  for (const slug of Object.values(genes)) {
    if (!slug) continue;
    const def = getAllele(slug);
    if (!def) continue;
    bonus += def.xpBonus ?? 0;
  }
  return bonus;
}
