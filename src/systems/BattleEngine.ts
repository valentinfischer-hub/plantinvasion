import type { PlantFamily } from '../data/encounters';
import { getMove, defaultMovesForFamily, type MoveDef, type StatusEffect } from '../data/moves';

/**
 * Battle-Engine V0.2 mit Pokemon-Style Move-Selection plus Status-Effects.
 */

export interface BattleStats {
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
}

export interface ActiveStatus {
  effect: StatusEffect;
  turnsLeft: number;
}

export interface StatModifier {
  stat: 'atk' | 'def' | 'spd';
  mult: number;
  turnsLeft: number;
}

export interface BattleSide {
  name: string;
  family: PlantFamily;
  stats: BattleStats;
  level: number;
  isPlayer: boolean;
  spriteColor: number;
  moveSlugs: string[];
  statuses: ActiveStatus[];
  modifiers: StatModifier[];
  spriteKey?: string;
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

export function familyMultiplier(attacker: PlantFamily, defender: PlantFamily): number {
  return TYPE_CHART[attacker]?.[defender] ?? 1.0;
}

/** Effektive Stat unter Beruecksichtigung von Modifikatoren. */
export function effectiveStat(side: BattleSide, stat: 'atk' | 'def' | 'spd'): number {
  let base = side.stats[stat];
  for (const m of side.modifiers) {
    if (m.stat === stat) base *= m.mult;
  }
  // Status-Effekte
  if (side.statuses.some((s) => s.effect === 'wilted') && stat === 'atk') base *= 0.75;
  if (side.statuses.some((s) => s.effect === 'fungus') && stat === 'def') base *= 0.7;
  return Math.max(1, Math.floor(base));
}

export function hasStatus(side: BattleSide, effect: StatusEffect): boolean {
  return side.statuses.some((s) => s.effect === effect);
}

export interface MoveResult {
  attacker: BattleSide;
  defender: BattleSide;
  move: MoveDef;
  hit: boolean;
  dmg: number;
  effectiveness: number;
  crit: boolean;
  status?: StatusEffect;
  selfHeal?: number;
  log: string;
}

export function applyMove(attacker: BattleSide, defender: BattleSide, move: MoveDef, rng: () => number = Math.random): MoveResult {
  let log = `${attacker.name} setzt ${move.name} ein!`;

  // Schlaf: Zug verloren
  if (hasStatus(attacker, 'asleep')) {
    return {
      attacker, defender, move,
      hit: false, dmg: 0, effectiveness: 1, crit: false,
      log: `${attacker.name} schlaeft tief und kann nicht angreifen.`
    };
  }

  // Accuracy
  if (rng() > move.accuracy) {
    return {
      attacker, defender, move,
      hit: false, dmg: 0, effectiveness: 1, crit: false,
      log: `${log} Verfehlt!`
    };
  }

  // Damage
  let dmg = 0;
  let effectiveness = 1;
  let crit = false;
  if (move.power > 0) {
    const atk = effectiveStat(attacker, 'atk');
    const def = effectiveStat(defender, 'def');
    const ratio = Math.log2(1 + atk / Math.max(1, def));
    effectiveness = familyMultiplier(attacker.family, defender.family);
    crit = rng() < attacker.stats.spd / 600;
    const critMod = crit ? 1.5 : 1;
    const baseDmg = ratio * move.power * 1.2;
    const cap = Math.floor(defender.stats.maxHp * 0.55);
    dmg = Math.max(1, Math.min(cap, Math.floor(baseDmg * effectiveness * critMod)));
    defender.stats.hp = Math.max(0, defender.stats.hp - dmg);
    log += `\n${dmg} Schaden${crit ? ' (KRITISCH!)' : ''}`;
    if (effectiveness > 1) log += ' - Sehr effektiv!';
    else if (effectiveness < 1) log += ' - Wenig effektiv...';
  }

  // Self-Heal
  let selfHeal = 0;
  if (move.heal && move.heal > 0) {
    selfHeal = Math.floor(attacker.stats.maxHp * move.heal);
    attacker.stats.hp = Math.min(attacker.stats.maxHp, attacker.stats.hp + selfHeal);
    log += `\n${attacker.name} regeneriert ${selfHeal} HP.`;
  }

  // Self-Boost
  if (move.selfBoost) {
    attacker.modifiers.push({ stat: move.selfBoost.stat, mult: move.selfBoost.mult, turnsLeft: move.selfBoost.turns });
    const direction = move.selfBoost.mult > 1 ? 'steigt' : 'sinkt';
    log += `\n${move.selfBoost.stat.toUpperCase()} von ${attacker.name} ${direction}.`;
  }

  // Enemy-Debuff
  if (move.enemyDebuff) {
    defender.modifiers.push({ stat: move.enemyDebuff.stat, mult: move.enemyDebuff.mult, turnsLeft: move.enemyDebuff.turns });
    log += `\n${move.enemyDebuff.stat.toUpperCase()} von ${defender.name} sinkt.`;
  }

  // Status
  let appliedStatus: StatusEffect | undefined;
  if (move.status && rng() < move.status.chance) {
    if (!defender.statuses.some((s) => s.effect === move.status!.effect)) {
      defender.statuses.push({ effect: move.status.effect, turnsLeft: move.status.turns ?? 3 });
      appliedStatus = move.status.effect;
      log += `\n${defender.name} ist nun ${statusName(move.status.effect)}!`;
    }
  }

  return {
    attacker, defender, move,
    hit: true, dmg, effectiveness, crit,
    status: appliedStatus, selfHeal, log
  };
}

export function statusName(s: StatusEffect): string {
  switch (s) {
    case 'wilted': return 'welk';
    case 'pests': return 'von Schaedlingen befallen';
    case 'poisoned': return 'vergiftet';
    case 'asleep': return 'eingeschlafen';
    case 'rooted': return 'gefangen in Wurzeln';
    case 'fungus': return 'pilzbefallen';
    case 'frostbite': return 'erfroren';
  }
}

/**
 * Tickt Status-Effekte am Ende einer Runde (HP-Damage, Turn-Decrement, Cleanup).
 */
export function tickStatuses(side: BattleSide): string[] {
  const logs: string[] = [];
  for (const status of side.statuses) {
    if (status.effect === 'poisoned' || status.effect === 'pests') {
      const dmg = Math.floor(side.stats.maxHp * 0.08);
      side.stats.hp = Math.max(0, side.stats.hp - dmg);
      logs.push(`${side.name} verliert ${dmg} HP durch ${statusName(status.effect)}.`);
    }
    status.turnsLeft -= 1;
  }
  side.statuses = side.statuses.filter((s) => s.turnsLeft > 0);
  for (const m of side.modifiers) m.turnsLeft -= 1;
  side.modifiers = side.modifiers.filter((m) => m.turnsLeft > 0);
  return logs;
}

/**
 * Round-Auswertung: beide Sides waehlen Move, dann Initiative-Reihenfolge.
 */
export interface RoundOutcome {
  results: MoveResult[];
  tickLogs: string[];
  battleOver: boolean;
  winner?: BattleSide;
}

export function runMoveRound(
  player: BattleSide,
  wild: BattleSide,
  playerMoveSlug: string,
  wildMoveSlug: string,
  rng: () => number = Math.random
): RoundOutcome {
  const playerMove = getMove(playerMoveSlug);
  const wildMove = getMove(wildMoveSlug);
  if (!playerMove || !wildMove) {
    return { results: [], tickLogs: ['Move nicht gefunden.'], battleOver: false };
  }

  const playerPriority = playerMove.priority;
  const wildPriority = wildMove.priority;
  let playerFirst: boolean;
  if (playerPriority !== wildPriority) {
    playerFirst = playerPriority > wildPriority;
  } else {
    playerFirst = effectiveStat(player, 'spd') >= effectiveStat(wild, 'spd');
  }

  const results: MoveResult[] = [];
  const a1 = playerFirst ? player : wild;
  const d1 = playerFirst ? wild : player;
  const m1 = playerFirst ? playerMove : wildMove;
  results.push(applyMove(a1, d1, m1, rng));

  if (d1.stats.hp > 0) {
    const a2 = d1;
    const d2 = a1;
    const m2 = playerFirst ? wildMove : playerMove;
    results.push(applyMove(a2, d2, m2, rng));
  }

  const tickLogs: string[] = [];
  if (player.stats.hp > 0) tickLogs.push(...tickStatuses(player));
  if (wild.stats.hp > 0) tickLogs.push(...tickStatuses(wild));

  const battleOver = player.stats.hp <= 0 || wild.stats.hp <= 0;
  const winner = battleOver ? (player.stats.hp > 0 ? player : wild) : undefined;

  return { results, tickLogs, battleOver, winner };
}

// === Scenario / Setup ===

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

export function makeStatsForLevel(level: number, atkBias = 0, defBias = 0, spdBias = 0): BattleStats {
  const hp = 35 + level * 12;
  return {
    hp,
    maxHp: hp,
    atk: Math.max(5, 18 + level * 5 + atkBias),
    def: Math.max(5, 14 + level * 4 + defBias),
    spd: Math.max(5, 16 + level * 4 + spdBias)
  };
}

export function effectivenessLabel(eff: number): string {
  if (eff >= 1.5) return 'Sehr effektiv!';
  if (eff <= 0.5) return 'Wenig effektiv...';
  return '';
}

/** Build a BattleSide given family and level. */
export function makeBattleSide(opts: {
  name: string;
  family: PlantFamily;
  level: number;
  isPlayer: boolean;
  spriteColor?: number;
  spriteKey?: string;
  moveSlugs?: string[];
  atkBias?: number;
  defBias?: number;
  spdBias?: number;
  bonsaiMode?: boolean;
}): BattleSide {
  const moveSlugs = opts.moveSlugs ?? defaultMovesForFamily(opts.family);
  const stats = makeStatsForLevel(opts.level, opts.atkBias, opts.defBias, opts.spdBias);
  if (opts.bonsaiMode) {
    stats.maxHp = Math.floor(stats.maxHp * 1.30);
    stats.hp = stats.maxHp;
    stats.atk = Math.floor(stats.atk * 1.15);
    stats.def = Math.floor(stats.def * 1.15);
    stats.spd = Math.floor(stats.spd * 1.15);
  }
  return {
    name: opts.name,
    family: opts.family,
    level: opts.level,
    isPlayer: opts.isPlayer,
    spriteColor: opts.spriteColor ?? 0x9be36e,
    spriteKey: opts.spriteKey,
    moveSlugs: moveSlugs.slice(0, 4),
    stats,
    statuses: [],
    modifiers: []
  };
}

/**
 * Wild AI: einfacher Move-Picker.
 * - 70% random move, 20% damage-best, 10% status-move falls vorhanden
 */
export function pickWildMove(wild: BattleSide, rng: () => number = Math.random): string {
  const r = rng();
  const moves = wild.moveSlugs.map(getMove).filter(Boolean) as MoveDef[];
  if (moves.length === 0) return 'tackle';
  if (r < 0.2) {
    // damage-best
    const dmgMoves = moves.filter((m) => m.power > 0).sort((a, b) => b.power - a.power);
    if (dmgMoves[0]) return dmgMoves[0].slug;
  } else if (r < 0.3) {
    const statusMoves = moves.filter((m) => m.status);
    if (statusMoves.length > 0) return statusMoves[Math.floor(rng() * statusMoves.length)].slug;
  }
  return moves[Math.floor(rng() * moves.length)].slug;
}

// ============================================================
// Boss-Battle-Erweiterungen V0.2 (2026-04-28)
// Multi-Phase-Support + Boss-spezifischer Move-Picker
// ============================================================

import type { BossPhase } from '../data/bossPhases';
import { resolveNextPhase, cumulativePhaseBoosts, getAvailableMovesForPhase } from '../data/bossPhases';

export interface BossBattleSide extends BattleSide {
  /** Boss-ID fuer Phase-Lookup (undefined = normaler Wild-Gegner). */
  bossId?: string;
  /** Aktuell aktive Phase (0 = Start, hoher Wert = weiter Kampf). */
  currentPhase: number;
}

export interface PhaseTransitionResult {
  /** Neue Phase-Definition die aktiviert wurde. */
  newPhase: BossPhase;
  /** HP die als Heal gutgeschrieben wurden (0 wenn kein Heal). */
  healedHp: number;
  /** Neue verfuegbare Moves nach Phase-Transition. */
  newMoveSlugs: string[];
}

/**
 * Prueft nach jedem Zug ob der Boss eine neue Phase betritt.
 * Mutiert boss.currentPhase und boss.moveSlugs im Erfolgsfall.
 * Gibt PhaseTransitionResult oder null zurueck.
 */
export function checkBossPhaseTransition(
  boss: BossBattleSide
): PhaseTransitionResult | null {
  if (!boss.bossId) return null;

  const hpFraction = boss.stats.hp / boss.stats.maxHp;
  const nextPhase = resolveNextPhase(boss.bossId, hpFraction, boss.currentPhase);
  if (!nextPhase) return null;

  // Phase-Transition aktivieren
  boss.currentPhase = nextPhase.phase;

  // Stat-Boosts kumulativ berechnen und auf Basis-Stats anwenden
  const boosts = cumulativePhaseBoosts(boss.bossId, boss.currentPhase);
  boss.stats.atk = Math.floor(boss.stats.atk + boosts.atkBoost);
  boss.stats.def = Math.floor(boss.stats.def + boosts.defBoost);
  boss.stats.spd = Math.floor(boss.stats.spd + boosts.spdBoost);

  // HP-Heal wenn definiert
  const healedHp = Math.floor(boss.stats.maxHp * nextPhase.healFraction);
  if (healedHp > 0) {
    boss.stats.hp = Math.min(boss.stats.maxHp, boss.stats.hp + healedHp);
  }

  // Neue Moves
  const newMoveSlugs = getAvailableMovesForPhase(boss.moveSlugs, boss.bossId, boss.currentPhase);
  boss.moveSlugs = newMoveSlugs;

  return { newPhase: nextPhase, healedHp, newMoveSlugs };
}

/**
 * Boss-spezifischer Move-Picker.
 * In hoeherem Phase-Zustand bevorzugt der Boss staerkere / Status-Moves.
 * Phase 0: wie pickWildMove.
 * Phase 1+: 40% damage-best, 30% phase-spezifischer Move, 30% random.
 */
export function pickBossMove(
  boss: BossBattleSide,
  rng: () => number = Math.random
): string {
  const moves = boss.moveSlugs.map(getMove).filter(Boolean) as MoveDef[];
  if (moves.length === 0) return 'tackle';

  if (boss.currentPhase === 0) {
    return pickWildMove(boss, rng);
  }

  const r = rng();
  if (r < 0.4) {
    // damage-best
    const dmgMoves = moves.filter((m) => m.power > 0).sort((a, b) => b.power - a.power);
    if (dmgMoves[0]) return dmgMoves[0].slug;
  } else if (r < 0.7) {
    // letzten Phase-Move bevorzugen (hoechste Phase-Nummer)
    const phaseMoves = boss.moveSlugs.filter((s) => !defaultMovesForFamily(boss.family).includes(s));
    if (phaseMoves.length > 0) {
      return phaseMoves[Math.floor(rng() * phaseMoves.length)];
    }
  }

  return moves[Math.floor(rng() * moves.length)].slug;
}

/**
 * Erstellt eine BossBattleSide aus einem BossDef.
 * Wrapper der makeBattleSide mit Boss-spezifischen Feldern erweitert.
 */
export function makeBossBattleSide(opts: {
  bossId: string;
  name: string;
  family: PlantFamily;
  level: number;
  hpMultiplier?: number;
  atkBias?: number;
  defBias?: number;
  spdBias?: number;
  moveSlugs: string[];
  spriteColor?: number;
  spriteKey?: string;
}): BossBattleSide {
  const base = makeBattleSide({
    name: opts.name,
    family: opts.family,
    level: opts.level,
    isPlayer: false,
    spriteColor: opts.spriteColor,
    spriteKey: opts.spriteKey,
    moveSlugs: opts.moveSlugs,
    atkBias: opts.atkBias,
    defBias: opts.defBias,
    spdBias: opts.spdBias,
  });

  // HP-Multiplier fuer Bosses anwenden
  const mult = opts.hpMultiplier ?? 1.0;
  base.stats.maxHp = Math.floor(base.stats.maxHp * mult);
  base.stats.hp = base.stats.maxHp;

  return {
    ...base,
    bossId: opts.bossId,
    currentPhase: 0,
  };
}
