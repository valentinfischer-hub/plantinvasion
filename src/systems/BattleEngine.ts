import type { PlantFamily } from '../data/encounters';

/**
 * Battle-Engine V0.1 mit 1v1 Auto-Battle und Type-Chart.
 * Damage-Formel und Family-Multiplier siehe brain/design/battle_system.md.
 */

export interface BattleStats {
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
}

export interface BattleSide {
  name: string;
  family: PlantFamily;
  stats: BattleStats;
  level: number;
  isPlayer: boolean;
  spriteColor: number;
}

const TYPE_CHART: Record<PlantFamily, Partial<Record<PlantFamily, number>>> = {
  Asteraceae: { Cactaceae: 0.5, Crassulaceae: 1.5, Droseraceae: 0.5 },
  Solanaceae: { Lamiaceae: 1.5, Brassicaceae: 0.5 },
  Cactaceae: { Asteraceae: 1.5, Lamiaceae: 0.5, Droseraceae: 0.5, Orchidaceae: 1.5, Bromeliaceae: 0.5 },
  Crassulaceae: { Asteraceae: 0.5, Brassicaceae: 1.5 },
  Lamiaceae: { Solanaceae: 0.5, Cactaceae: 1.5, Apiaceae: 1.5, Droseraceae: 0.5 },
  Brassicaceae: { Solanaceae: 1.5, Crassulaceae: 0.5, Apiaceae: 1.5, Orchidaceae: 0.5 },
  Apiaceae: { Lamiaceae: 0.5, Brassicaceae: 0.5, Droseraceae: 1.5 },
  Droseraceae: { Asteraceae: 1.5, Cactaceae: 1.5, Lamiaceae: 1.5, Apiaceae: 0.5, Orchidaceae: 0.5, Bromeliaceae: 1.5 },
  Orchidaceae: { Cactaceae: 0.5, Brassicaceae: 1.5, Droseraceae: 1.5, Bromeliaceae: 1.5 },
  Bromeliaceae: { Cactaceae: 1.5, Droseraceae: 0.5, Orchidaceae: 0.5 },
  Mythical: { Mythical: 1.5 }
};

const BASE_ATTACK_POWER = 25;

export function familyMultiplier(attacker: PlantFamily, defender: PlantFamily): number {
  return TYPE_CHART[attacker]?.[defender] ?? 1.0;
}

export function calcDamage(
  attacker: BattleSide,
  defender: BattleSide,
  rng: () => number = Math.random
): { dmg: number; effectiveness: number; crit: boolean } {
  const ratio = Math.log2(1 + attacker.stats.atk / Math.max(1, defender.stats.def));
  const baseDmg = ratio * BASE_ATTACK_POWER * 4;
  const effectiveness = familyMultiplier(attacker.family, defender.family);
  const crit = rng() < attacker.stats.spd / 1000;
  const critMod = crit ? 1.5 : 1;
  const dmgRaw = baseDmg * effectiveness * critMod;
  const cap = Math.floor(defender.stats.maxHp * 0.5);
  const dmg = Math.max(1, Math.min(cap, Math.floor(dmgRaw)));
  return { dmg, effectiveness, crit };
}

export interface RoundResult {
  attackerFirst: BattleSide;
  defenderFirst: BattleSide;
  dmgFirst: number;
  effectivenessFirst: number;
  critFirst: boolean;
  dmgSecond: number;
  effectivenessSecond: number;
  critSecond: boolean;
  battleOver: boolean;
  winner?: BattleSide;
  loser?: BattleSide;
}

export function runRound(player: BattleSide, wild: BattleSide, rng: () => number = Math.random): RoundResult {
  // Initiative durch SPD
  const playerFirst = player.stats.spd >= wild.stats.spd;
  const a1 = playerFirst ? player : wild;
  const d1 = playerFirst ? wild : player;
  const r1 = calcDamage(a1, d1, rng);
  d1.stats.hp = Math.max(0, d1.stats.hp - r1.dmg);

  let dmgSecond = 0, effSecond = 0, critSecond = false;
  if (d1.stats.hp > 0) {
    const a2 = d1;
    const d2 = a1;
    const r2 = calcDamage(a2, d2, rng);
    d2.stats.hp = Math.max(0, d2.stats.hp - r2.dmg);
    dmgSecond = r2.dmg;
    effSecond = r2.effectiveness;
    critSecond = r2.crit;
  }

  const battleOver = player.stats.hp <= 0 || wild.stats.hp <= 0;
  const winner = battleOver ? (player.stats.hp > 0 ? player : wild) : undefined;
  const loser = battleOver ? (player.stats.hp > 0 ? wild : player) : undefined;

  return {
    attackerFirst: a1,
    defenderFirst: d1,
    dmgFirst: r1.dmg,
    effectivenessFirst: r1.effectiveness,
    critFirst: r1.crit,
    dmgSecond,
    effectivenessSecond: effSecond,
    critSecond,
    battleOver,
    winner,
    loser
  };
}

export function makeStatsForLevel(level: number, atkBias = 0, defBias = 0, spdBias = 0): BattleStats {
  const hp = 30 + level * 10;
  return {
    hp,
    maxHp: hp,
    atk: Math.max(5, 15 + level * 5 + atkBias),
    def: Math.max(5, 12 + level * 4 + defBias),
    spd: Math.max(5, 14 + level * 4 + spdBias)
  };
}

export function effectivenessLabel(eff: number): string {
  if (eff >= 1.5) return 'Sehr effektiv!';
  if (eff <= 0.5) return 'Wenig effektiv...';
  return '';
}


/**
 * Region-Tier limitiert max-Level fuer Wild-Encounter und damit Stats-Decke.
 */
export const REGION_TIERS: Record<string, { tier: number; maxLevel: number }> = {
  wurzelheim: { tier: 1, maxLevel: 5 },
  verdanto: { tier: 2, maxLevel: 10 },
  kaktoria: { tier: 3, maxLevel: 18 },
  frostkamm: { tier: 4, maxLevel: 28 },
  mordwald: { tier: 5, maxLevel: 38 },
  salzbucht: { tier: 5, maxLevel: 38 },
  magmabluete: { tier: 6, maxLevel: 50 },
  glaciara: { tier: 7, maxLevel: 70 },
  edenlost: { tier: 8, maxLevel: 100 }
};

export function clampLevelToRegion(level: number, zone: string): number {
  const cap = REGION_TIERS[zone]?.maxLevel ?? 100;
  return Math.min(Math.max(1, level), cap);
}
