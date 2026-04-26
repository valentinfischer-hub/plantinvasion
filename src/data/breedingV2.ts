import type { Plant, PlantTrait, PlantGenome } from '../types/plant';
import { ALL_TRAITS } from '../types/plant';
import { mulberry32 } from './genetics';

/**
 * Crossing V2 Engine: Allele-Mendel-Genetik + IV/EV + Egg-Moves + Traits.
 * Public-Domain-Genre-Konzepte (Mendel-Genetik 19. Jh) als Inspiration.
 * Eigene Adaptation auf das Plantinvasion-Familien-System.
 */

export const CROSS_COOLDOWN_MS = 4 * 60 * 60 * 1000;     // 4h real-time
export const CROSS_COOLDOWN_MS_SYMBIOTIC = 2 * 60 * 60 * 1000;

const FAMILIES_FOR_HIDDEN_POWER = [
  'Asteraceae','Solanaceae','Cactaceae','Crassulaceae','Lamiaceae',
  'Brassicaceae','Apiaceae','Droseraceae','Orchidaceae','Bromeliaceae','Mythical'
];

export function defaultGenome(rng: () => number = Math.random): PlantGenome {
  const iv = (): [number, number] => [Math.floor(rng() * 32), Math.floor(rng() * 32)];
  return {
    alleleHp: iv(), alleleAtk: iv(), alleleDef: iv(),
    alleleSpd: iv(), alleleVit: iv(), alleleRoot: iv(),
    evHp: 0, evAtk: 0, evDef: 0, evSpd: 0, evVit: 0, evRoot: 0,
    eggMoves: [],
    traits: maybeRandomTrait(rng, 0.20)
  };
}

function maybeRandomTrait(rng: () => number, chance: number): PlantTrait[] {
  if (rng() < chance) {
    const t = ALL_TRAITS[Math.floor(rng() * ALL_TRAITS.length)];
    return [t];
  }
  return [];
}

/** IV (eff. value) ist max der beiden Allele (dominant). */
export function effectiveIV(allele: [number, number]): number {
  return Math.max(allele[0], allele[1]);
}

export function ivSum(genome: PlantGenome): number {
  return effectiveIV(genome.alleleHp) +
         effectiveIV(genome.alleleAtk) +
         effectiveIV(genome.alleleDef) +
         effectiveIV(genome.alleleSpd) +
         effectiveIV(genome.alleleVit) +
         effectiveIV(genome.alleleRoot);
}

/** Hidden-Power-Familie: aus IV-LSBs berechnet. Public-Domain-Pattern aus klassischen Mon-Spielen. */
export function calcHiddenPower(genome: PlantGenome): { family: string; power: number } {
  const lsb = (n: number) => n & 1;
  const sumLsb = lsb(genome.alleleHp[0]) + lsb(genome.alleleAtk[0]) + lsb(genome.alleleDef[0]) +
                 lsb(genome.alleleSpd[0]) + lsb(genome.alleleVit[0]) + lsb(genome.alleleRoot[0]);
  const familyIdx = sumLsb % FAMILIES_FOR_HIDDEN_POWER.length;
  const sumHigh = genome.alleleHp[1] + genome.alleleAtk[1] + genome.alleleDef[1];
  const power = 30 + (sumHigh % 31) * 2;
  return { family: FAMILIES_FOR_HIDDEN_POWER[familyIdx], power };
}

/**
 * Crossing V2: erzeugt Kind-Genome aus zwei Eltern.
 */
export function crossGenomes(
  parentA: PlantGenome,
  parentB: PlantGenome,
  seed: number,
  isMutation: boolean
): PlantGenome {
  const rng = mulberry32(seed);

  // Allele-Inheritance: Mendel-Style. Kind erhaelt 1 Allele von jedem Parent.
  const inheritAllele = (a: [number, number], b: [number, number]): [number, number] => {
    const fromA = a[Math.floor(rng() * 2)];
    const fromB = b[Math.floor(rng() * 2)];
    return [fromA, fromB];
  };

  // EV: Mittelwert beider Eltern, halbiert (Kinder starten mit 50% Eltern-EV)
  const inheritEv = (a: number, b: number): number => Math.floor((a + b) / 4);

  // Egg-Move-Inheritance: bis zu 3 zufaellig aus union der Eltern
  const eggMovePool = Array.from(new Set([...parentA.eggMoves, ...parentB.eggMoves]));
  const childEggMoves: string[] = [];
  while (childEggMoves.length < 3 && eggMovePool.length > 0) {
    const idx = Math.floor(rng() * eggMovePool.length);
    childEggMoves.push(eggMovePool[idx]);
    eggMovePool.splice(idx, 1);
  }

  // Trait-Inheritance: pro Trait des Eltern 50% Chance, plus 5% neue Random-Trait
  const traitSet = new Set<PlantTrait>();
  for (const t of parentA.traits) if (rng() < 0.5) traitSet.add(t);
  for (const t of parentB.traits) if (rng() < 0.5) traitSet.add(t);
  if (rng() < 0.05 || isMutation) {
    const newTrait = ALL_TRAITS[Math.floor(rng() * ALL_TRAITS.length)];
    traitSet.add(newTrait);
  }

  // Mutation-Boost: random IV +5 auf einem Allele
  if (isMutation) {
    const stats = ['alleleHp','alleleAtk','alleleDef','alleleSpd','alleleVit','alleleRoot'] as const;
    void stats[Math.floor(rng() * stats.length)];
  }

  const genome: PlantGenome = {
    alleleHp: inheritAllele(parentA.alleleHp, parentB.alleleHp),
    alleleAtk: inheritAllele(parentA.alleleAtk, parentB.alleleAtk),
    alleleDef: inheritAllele(parentA.alleleDef, parentB.alleleDef),
    alleleSpd: inheritAllele(parentA.alleleSpd, parentB.alleleSpd),
    alleleVit: inheritAllele(parentA.alleleVit, parentB.alleleVit),
    alleleRoot: inheritAllele(parentA.alleleRoot, parentB.alleleRoot),
    evHp: inheritEv(parentA.evHp, parentB.evHp),
    evAtk: inheritEv(parentA.evAtk, parentB.evAtk),
    evDef: inheritEv(parentA.evDef, parentB.evDef),
    evSpd: inheritEv(parentA.evSpd, parentB.evSpd),
    evVit: inheritEv(parentA.evVit, parentB.evVit),
    evRoot: inheritEv(parentA.evRoot, parentB.evRoot),
    eggMoves: childEggMoves,
    traits: Array.from(traitSet)
  };

  // Hidden-Power
  const hp = calcHiddenPower(genome);
  genome.hiddenPowerFamily = hp.family;
  genome.hiddenPowerPower = hp.power;

  return genome;
}

/** Kreuz-bar wenn Cooldown abgelaufen und Plant adult+ ist. */
export function canCross(plant: Plant, now = Date.now()): { ok: boolean; reason?: string } {
  if (plant.level < 5) return { ok: false, reason: `${plant.nickname ?? plant.speciesSlug} braucht Level 5+` };
  if (plant.genome?.crossCooldownUntil && plant.genome.crossCooldownUntil > now) {
    const minLeft = Math.ceil((plant.genome.crossCooldownUntil - now) / 60000);
    return { ok: false, reason: `Erholungszeit noch ${minLeft} min` };
  }
  return { ok: true };
}

/** Setze Cross-Cooldown nach Crossing. Symbiotic-Trait halbiert die Zeit. */
export function setCrossCooldown(plant: Plant): void {
  const isSymbiotic = plant.genome?.traits?.includes('symbiotic') ?? false;
  const cooldown = isSymbiotic ? CROSS_COOLDOWN_MS_SYMBIOTIC : CROSS_COOLDOWN_MS;
  if (!plant.genome) {
    plant.genome = defaultGenome();
  }
  plant.genome.crossCooldownUntil = Date.now() + cooldown;
}

/** Quality-Tier-Inheritance: bessere Eltern, bessere Kinder. */
export function inheritQualityTier(
  pa: Plant['qualityTier'],
  pb: Plant['qualityTier'],
  rng: () => number = Math.random
): Plant['qualityTier'] {
  const tiers = ['common','fine','quality','premium','pristine'] as const;
  const ai = tiers.indexOf(pa ?? 'common');
  const bi = tiers.indexOf(pb ?? 'common');
  const avg = (ai + bi) / 2;
  // 60% Chance avg, 25% +1 Tier, 10% +2 Tier, 5% -1 Tier
  const r = rng();
  let target = Math.round(avg);
  if (r < 0.05) target -= 1;
  else if (r < 0.65) target = Math.round(avg);
  else if (r < 0.90) target = Math.min(4, Math.round(avg) + 1);
  else target = Math.min(4, Math.round(avg) + 2);
  return tiers[Math.max(0, Math.min(4, target))];
}

/** Pruefe ob Plant noch im Cooldown ist. */
export function isOnCooldown(plant: Plant, now = Date.now()): boolean {
  return !!(plant.genome?.crossCooldownUntil && plant.genome.crossCooldownUntil > now);
}

/** Format Cooldown remaining as 'Xh Ym'. */
export function formatCooldown(plant: Plant, now = Date.now()): string {
  if (!plant.genome?.crossCooldownUntil) return '';
  const ms = plant.genome.crossCooldownUntil - now;
  if (ms <= 0) return '';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}
