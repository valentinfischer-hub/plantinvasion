/**
 * Tests fuer src/data/bossPhases.ts - Multi-Phase-Boss-System V0.2
 */
import { describe, it, expect } from 'vitest';
import {
  BOSS_PHASE_PROFILES,
  getBossPhaseProfile,
  resolveNextPhase,
  cumulativePhaseBoosts,
  getAvailableMovesForPhase,
} from '../bossPhases';

describe('BOSS_PHASE_PROFILES - Datenstruktur', () => {
  it('hat mindestens 3 Profile', () => {
    expect(BOSS_PHASE_PROFILES.length).toBeGreaterThanOrEqual(3);
  });

  it('jedes Profil hat eine eindeutige bossId', () => {
    const ids = BOSS_PHASE_PROFILES.map((p) => p.bossId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('jede Phase hat einen hpThreshold zwischen 0 und 1', () => {
    for (const profile of BOSS_PHASE_PROFILES) {
      for (const phase of profile.phases) {
        expect(phase.hpThreshold).toBeGreaterThan(0);
        expect(phase.hpThreshold).toBeLessThan(1);
      }
    }
  });

  it('Phasen sind in aufsteigender Reihenfolge geordnet', () => {
    for (const profile of BOSS_PHASE_PROFILES) {
      const phases = profile.phases.map((p) => p.phase);
      for (let i = 1; i < phases.length; i++) {
        expect(phases[i]).toBeGreaterThan(phases[i - 1]);
      }
    }
  });

  it('jede Phase hat phaseText (nicht leer)', () => {
    for (const profile of BOSS_PHASE_PROFILES) {
      for (const phase of profile.phases) {
        expect(phase.phaseText.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('getBossPhaseProfile', () => {
  it('liefert Profil fuer magmus-rex', () => {
    const p = getBossPhaseProfile('magmus-rex');
    expect(p).toBeDefined();
    expect(p!.bossId).toBe('magmus-rex');
    expect(p!.phases.length).toBeGreaterThanOrEqual(2);
  });

  it('liefert undefined fuer einphasige Bosses', () => {
    expect(getBossPhaseProfile('captain-schimmelpilz')).toBeUndefined();
    expect(getBossPhaseProfile('mangrove-tyrann')).toBeUndefined();
  });

  it('liefert Profil fuer verodynicus-final (3 Phasen)', () => {
    const p = getBossPhaseProfile('verodynicus-final');
    expect(p).toBeDefined();
    expect(p!.phases.length).toBe(3);
  });
});

describe('resolveNextPhase', () => {
  it('gibt null fuer einphasigen Boss', () => {
    expect(resolveNextPhase('captain-schimmelpilz', 0.1, 0)).toBeNull();
  });

  it('gibt null wenn HP noch hoch (kein Threshold ueberschritten)', () => {
    const result = resolveNextPhase('magmus-rex', 0.8, 0);
    expect(result).toBeNull();
  });

  it('triggert Phase 1 wenn HP unter 0.5', () => {
    const result = resolveNextPhase('magmus-rex', 0.45, 0);
    expect(result).not.toBeNull();
    expect(result!.phase).toBe(1);
  });

  it('triggert Phase 2 wenn HP unter 0.2', () => {
    const result = resolveNextPhase('magmus-rex', 0.15, 0);
    expect(result).not.toBeNull();
    expect(result!.phase).toBe(2);
  });

  it('triggert nicht Phase 1 wenn schon aktiv (currentPhase >= 1)', () => {
    const result = resolveNextPhase('magmus-rex', 0.45, 1);
    expect(result).toBeNull();
  });

  it('triggert Phase 2 nicht wenn bereits Phase 2 aktiv', () => {
    const result = resolveNextPhase('magmus-rex', 0.05, 2);
    expect(result).toBeNull();
  });

  it('verodynicus: 3 Phasen korrekt durchschaltbar', () => {
    // Phase 1 bei 0.66 Threshold
    const p1 = resolveNextPhase('verodynicus-final', 0.6, 0);
    expect(p1!.phase).toBe(1);
    // Phase 2 bei 0.33 Threshold
    const p2 = resolveNextPhase('verodynicus-final', 0.3, 1);
    expect(p2!.phase).toBe(2);
    // Phase 3 bei 0.1 Threshold
    const p3 = resolveNextPhase('verodynicus-final', 0.05, 2);
    expect(p3!.phase).toBe(3);
  });
});

describe('cumulativePhaseBoosts', () => {
  it('gibt 0/0/0 fuer Phase 0', () => {
    const boosts = cumulativePhaseBoosts('magmus-rex', 0);
    expect(boosts).toEqual({ atkBoost: 0, defBoost: 0, spdBoost: 0 });
  });

  it('gibt 0/0/0 fuer einphasigen Boss', () => {
    const boosts = cumulativePhaseBoosts('captain-schimmelpilz', 1);
    expect(boosts).toEqual({ atkBoost: 0, defBoost: 0, spdBoost: 0 });
  });

  it('summiert Boosts ueber Phasen', () => {
    // magmus-rex Phase 1: atk+25, def+0, spd+10
    const p1 = cumulativePhaseBoosts('magmus-rex', 1);
    expect(p1.atkBoost).toBe(25);
    expect(p1.defBoost).toBe(0);
    expect(p1.spdBoost).toBe(10);

    // magmus-rex Phase 1+2: atk+25+50=75, def+0+15=15, spd+10+0=10
    const p2 = cumulativePhaseBoosts('magmus-rex', 2);
    expect(p2.atkBoost).toBe(75);
    expect(p2.defBoost).toBe(15);
    expect(p2.spdBoost).toBe(10);
  });
});

describe('getAvailableMovesForPhase', () => {
  const baseMoves = ['tackle', 'sun-blaze'];

  it('gibt nur Basis-Moves fuer Phase 0 zurueck', () => {
    const moves = getAvailableMovesForPhase(baseMoves, 'magmus-rex', 0);
    expect(moves).toEqual(baseMoves);
  });

  it('gibt Basis-Moves fuer einphasigen Boss zurueck', () => {
    const moves = getAvailableMovesForPhase(baseMoves, 'captain-schimmelpilz', 1);
    expect(moves).toEqual(baseMoves);
  });

  it('fuegt Phase-1-Moves hinzu', () => {
    const moves = getAvailableMovesForPhase(['dragon-bloom'], 'magmus-rex', 1);
    // Phase 1 adds: sun-blaze, dragon-bloom (dragon-bloom schon drin)
    expect(moves).toContain('sun-blaze');
    expect(moves).toContain('dragon-bloom');
  });

  it('keine Duplikate in Move-Liste', () => {
    const moves = getAvailableMovesForPhase(['dragon-bloom', 'sun-blaze'], 'magmus-rex', 2);
    const unique = new Set(moves);
    expect(unique.size).toBe(moves.length);
  });
});
