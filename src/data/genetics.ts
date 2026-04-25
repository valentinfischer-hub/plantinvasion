import type { PlantSpecies, StatTriple } from '../types/plant';

/**
 * GDD-Konstanten V0.1
 */
export const STAT_MIN = 0;
export const STAT_MAX = 300;
export const STARTER_STAT_BASE_MIN = 50;
export const STARTER_STAT_BASE_MAX = 150;
export const MUTATION_CHANCE_BASE = 0.08;

/**
 * Mulberry32 PRNG (deterministisch ueber Seed).
 * Liefert reproduzierbare Random-Sequenzen, wichtig fuer Genetik-Reproduzierbarkeit.
 */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Clamp auf den globalen Stat-Range. */
export function clampStat(v: number): number {
  return Math.max(STAT_MIN, Math.min(STAT_MAX, Math.round(v)));
}

/**
 * Generiere Start-Stats fuer eine neue Pflanze einer Spezies.
 * Bias der Spezies wird auf den Basis-Roll addiert.
 */
export function rollStarterStats(species: PlantSpecies, seed: number): StatTriple {
  const rand = mulberry32(seed);
  const range = STARTER_STAT_BASE_MAX - STARTER_STAT_BASE_MIN;
  const baseAtk = STARTER_STAT_BASE_MIN + Math.floor(rand() * range);
  const baseDef = STARTER_STAT_BASE_MIN + Math.floor(rand() * range);
  const baseSpd = STARTER_STAT_BASE_MIN + Math.floor(rand() * range);
  return {
    atk: clampStat(baseAtk + species.atkBias),
    def: clampStat(baseDef + species.defBias),
    spd: clampStat(baseSpd + species.spdBias)
  };
}

/**
 * Wuerfle ob eine Kreuzung mutiert (8 Prozent Basis-Chance).
 * @returns Mutation-Roll (0..1) und ob mutiert.
 */
export function rollMutation(seed: number, chance = MUTATION_CHANCE_BASE): {
  roll: number;
  isMutation: boolean;
} {
  const rand = mulberry32(seed);
  const roll = rand();
  return { roll, isMutation: roll < chance };
}

/**
 * Kreuzung von zwei Eltern: Stats sind Mittel aus beiden Eltern plus minus 10%.
 * Bei Mutation: zusaetzlicher Boost von plus 20-50% auf einem zufaelligen Stat.
 */
export function crossStats(
  parentA: StatTriple,
  parentB: StatTriple,
  seed: number,
  isMutation: boolean
): StatTriple {
  const rand = mulberry32(seed);
  const variance = 0.1;
  const mid = (a: number, b: number) => (a + b) / 2;
  const wobble = (v: number) => v * (1 + (rand() * 2 - 1) * variance);

  let atk = wobble(mid(parentA.atk, parentB.atk));
  let def = wobble(mid(parentA.def, parentB.def));
  let spd = wobble(mid(parentA.spd, parentB.spd));

  if (isMutation) {
    const boostStat = Math.floor(rand() * 3);
    const boostMul = 1.2 + rand() * 0.3;
    if (boostStat === 0) atk *= boostMul;
    else if (boostStat === 1) def *= boostMul;
    else spd *= boostMul;
  }

  return {
    atk: clampStat(atk),
    def: clampStat(def),
    spd: clampStat(spd)
  };
}
