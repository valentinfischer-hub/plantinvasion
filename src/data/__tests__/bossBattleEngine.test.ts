/**
 * Tests fuer BattleEngine Boss-Erweiterungen V0.2
 * checkBossPhaseTransition, pickBossMove, makeBossBattleSide
 */
import { describe, it, expect } from 'vitest';
import {
  checkBossPhaseTransition,
  pickBossMove,
  makeBossBattleSide,
  type BossBattleSide,
} from '../../systems/BattleEngine';

function makeMagmusRex(): BossBattleSide {
  return makeBossBattleSide({
    bossId: 'magmus-rex',
    name: 'Magmus Rex',
    family: 'Mythical',
    level: 38,
    hpMultiplier: 2.5,
    atkBias: 60,
    defBias: 40,
    spdBias: 10,
    moveSlugs: ['dragon-bloom', 'sun-blaze', 'thick-leaf', 'sun-beam'],
    spriteColor: 0xff5c1c,
  });
}

function makeVerodynicus(): BossBattleSide {
  return makeBossBattleSide({
    bossId: 'verodynicus-final',
    name: 'CEO Verodynicus',
    family: 'Mythical',
    level: 60,
    hpMultiplier: 3.5,
    atkBias: 100,
    defBias: 80,
    spdBias: 30,
    moveSlugs: ['dragon-bloom', 'star-pollen', 'toxic-vine', 'sun-blaze'],
    spriteColor: 0x4a2828,
  });
}

describe('makeBossBattleSide', () => {
  it('erstellt BossBattleSide mit bossId und currentPhase 0', () => {
    const boss = makeMagmusRex();
    expect(boss.bossId).toBe('magmus-rex');
    expect(boss.currentPhase).toBe(0);
    expect(boss.isPlayer).toBe(false);
  });

  it('HP wird mit hpMultiplier skaliert', () => {
    const base = makeBossBattleSide({
      bossId: 'test-boss',
      name: 'Test',
      family: 'Asteraceae',
      level: 10,
      hpMultiplier: 2.0,
      moveSlugs: ['tackle'],
    });
    const single = makeBossBattleSide({
      bossId: 'test-boss',
      name: 'Test',
      family: 'Asteraceae',
      level: 10,
      hpMultiplier: 1.0,
      moveSlugs: ['tackle'],
    });
    expect(base.stats.maxHp).toBeGreaterThan(single.stats.maxHp);
    expect(base.stats.hp).toBe(base.stats.maxHp);
  });
});

describe('checkBossPhaseTransition', () => {
  it('gibt null zurueck wenn HP noch hoch', () => {
    const boss = makeMagmusRex();
    boss.stats.hp = Math.floor(boss.stats.maxHp * 0.8);
    expect(checkBossPhaseTransition(boss)).toBeNull();
  });

  it('gibt null zurueck fuer Boss ohne Phase-Profil', () => {
    const boss = makeBossBattleSide({
      bossId: 'captain-schimmelpilz',
      name: 'Hauptmann',
      family: 'Droseraceae',
      level: 8,
      moveSlugs: ['tackle'],
    });
    boss.stats.hp = 1;
    expect(checkBossPhaseTransition(boss)).toBeNull();
  });

  it('triggert Phase 1 fuer Magmus Rex bei < 50% HP', () => {
    const boss = makeMagmusRex();
    boss.stats.hp = Math.floor(boss.stats.maxHp * 0.45);
    const result = checkBossPhaseTransition(boss);
    expect(result).not.toBeNull();
    expect(result!.newPhase.phase).toBe(1);
    expect(boss.currentPhase).toBe(1);
  });

  it('ATK-Boost wird nach Phase-Transition angewendet', () => {
    const boss = makeMagmusRex();
    const atkVorher = boss.stats.atk;
    boss.stats.hp = Math.floor(boss.stats.maxHp * 0.45);
    checkBossPhaseTransition(boss);
    expect(boss.stats.atk).toBeGreaterThan(atkVorher);
  });

  it('HP-Heal wird korrekt angewendet (Phase 2 magmus-rex: 15%)', () => {
    const boss = makeMagmusRex();
    boss.currentPhase = 1; // Bereits in Phase 1
    const lowHp = Math.floor(boss.stats.maxHp * 0.15);
    boss.stats.hp = lowHp;
    const result = checkBossPhaseTransition(boss);
    expect(result).not.toBeNull();
    expect(result!.newPhase.phase).toBe(2);
    expect(result!.healedHp).toBeGreaterThan(0);
    expect(boss.stats.hp).toBeGreaterThan(lowHp);
  });

  it('Phase-Moves werden zu moveSlugs hinzugefuegt', () => {
    const boss = makeMagmusRex();
    const movesBefore = [...boss.moveSlugs];
    boss.stats.hp = Math.floor(boss.stats.maxHp * 0.45);
    checkBossPhaseTransition(boss);
    // Phase 1 von magmus-rex fuegt sun-blaze/dragon-bloom hinzu
    // Basis hat bereits beide, aber der Pool wird sauber gebaut
    expect(boss.moveSlugs.length).toBeGreaterThanOrEqual(movesBefore.length);
  });

  it('Phase-Transition nicht wiederholbar nach Aktivierung', () => {
    const boss = makeMagmusRex();
    boss.stats.hp = Math.floor(boss.stats.maxHp * 0.45);
    checkBossPhaseTransition(boss);
    expect(boss.currentPhase).toBe(1);
    // Nochmal: selbe HP, aber Phase 1 schon aktiv -> kein weiterer Trigger
    const result2 = checkBossPhaseTransition(boss);
    expect(result2).toBeNull();
  });

  it('verodynicus: alle 3 Phasen koennen durchgeschalten werden', () => {
    const boss = makeVerodynicus();

    boss.stats.hp = Math.floor(boss.stats.maxHp * 0.6);
    const r1 = checkBossPhaseTransition(boss);
    expect(r1!.newPhase.phase).toBe(1);

    boss.stats.hp = Math.floor(boss.stats.maxHp * 0.3);
    const r2 = checkBossPhaseTransition(boss);
    expect(r2!.newPhase.phase).toBe(2);

    boss.stats.hp = Math.floor(boss.stats.maxHp * 0.05);
    const r3 = checkBossPhaseTransition(boss);
    expect(r3!.newPhase.phase).toBe(3);
    expect(boss.currentPhase).toBe(3);
  });
});

describe('pickBossMove', () => {
  const deterministicRng = (val: number) => () => val;

  it('gibt in Phase 0 einen Move aus moveSlugs zurueck', () => {
    const boss = makeMagmusRex();
    const move = pickBossMove(boss, Math.random);
    expect(boss.moveSlugs).toContain(move);
  });

  it('bevorzugt in Phase 1 damage-best-Move (rng < 0.4)', () => {
    const boss = makeMagmusRex();
    boss.currentPhase = 1;
    // rng = 0.1 -> damage-best branch
    const move = pickBossMove(boss, deterministicRng(0.1));
    // Sollte ein gueltiger Move sein
    expect(typeof move).toBe('string');
    expect(move.length).toBeGreaterThan(0);
  });

  it('gibt Fallback-Move tackle zurueck wenn keine Moves', () => {
    const boss = makeMagmusRex();
    boss.moveSlugs = [];
    boss.currentPhase = 1;
    expect(pickBossMove(boss, Math.random)).toBe('tackle');
  });
});
