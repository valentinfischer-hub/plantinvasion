import { describe, it, expect } from 'vitest';
import {
  defaultGenome,
  effectiveIV,
  ivSum,
  calcHiddenPower,
  crossGenomes,
  canCross,
  setCrossCooldown,
  inheritQualityTier,
  isOnCooldown,
  formatCooldown,
  CROSS_COOLDOWN_MS,
  CROSS_COOLDOWN_MS_SYMBIOTIC
} from '../breedingV2';
import { mulberry32 } from '../genetics';
import type { Plant, PlantGenome } from '../../types/plant';

function makePlant(overrides: Partial<Plant> = {}): Plant {
  const baseGenome = defaultGenome(mulberry32(1));
  return {
    id: 'p_test',
    speciesSlug: 'sunflower',
    stats: { atk: 100, def: 100, spd: 100 },
    geneSeed: 1,
    isMutation: false,
    level: 30,
    xp: 0,
    totalXp: 0,
    bornAt: 0,
    lastWateredAt: 0,
    lastTickAt: 0,
    hydration: 100,
    careScore: 0,
    generation: 0,
    pendingHarvest: false,
    consecutiveDryHours: 0,
    highestStageReached: 3,
    activeBoosters: [],
    genome: baseGenome,
    gridX: 0,
    gridY: 0,
    ...overrides
  };
}

describe('defaultGenome', () => {
  it('liefert alle Allele und EVs korrekt initialisiert', () => {
    const g = defaultGenome(mulberry32(1));
    expect(g.alleleHp).toHaveLength(2);
    expect(g.alleleAtk).toHaveLength(2);
    expect(g.alleleDef).toHaveLength(2);
    expect(g.alleleSpd).toHaveLength(2);
    expect(g.alleleVit).toHaveLength(2);
    expect(g.alleleRoot).toHaveLength(2);
    expect(g.evHp).toBe(0);
    expect(g.evAtk).toBe(0);
    expect(g.evDef).toBe(0);
    expect(g.evSpd).toBe(0);
    expect(g.evVit).toBe(0);
    expect(g.evRoot).toBe(0);
    expect(Array.isArray(g.eggMoves)).toBe(true);
    expect(Array.isArray(g.traits)).toBe(true);
  });

  it('IV-Werte liegen im Range 0-31', () => {
    for (let seed = 0; seed < 50; seed++) {
      const g = defaultGenome(mulberry32(seed));
      const all = [
        ...g.alleleHp, ...g.alleleAtk, ...g.alleleDef,
        ...g.alleleSpd, ...g.alleleVit, ...g.alleleRoot
      ];
      for (const v of all) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(31);
      }
    }
  });

  it('ist deterministisch mit gleichem Seed', () => {
    const g1 = defaultGenome(mulberry32(7));
    const g2 = defaultGenome(mulberry32(7));
    expect(g1).toEqual(g2);
  });

  it('ist serialisierbar via JSON ohne Datenverlust (Trade-Code-Faehigkeit)', () => {
    const g = defaultGenome(mulberry32(42));
    const restored = JSON.parse(JSON.stringify(g));
    expect(restored).toEqual(g);
  });
});

describe('effectiveIV und ivSum', () => {
  it('effectiveIV waehlt das groessere Allel (dominant)', () => {
    expect(effectiveIV([10, 20])).toBe(20);
    expect(effectiveIV([31, 0])).toBe(31);
    expect(effectiveIV([5, 5])).toBe(5);
  });

  it('ivSum addiert alle 6 effektiven Allele', () => {
    const g: PlantGenome = {
      alleleHp: [31, 0], alleleAtk: [31, 0], alleleDef: [31, 0],
      alleleSpd: [31, 0], alleleVit: [31, 0], alleleRoot: [31, 0],
      evHp: 0, evAtk: 0, evDef: 0, evSpd: 0, evVit: 0, evRoot: 0,
      eggMoves: [], traits: []
    };
    expect(ivSum(g)).toBe(31 * 6);
  });
});

describe('calcHiddenPower', () => {
  it('liefert eine bekannte Familie', () => {
    const g = defaultGenome(mulberry32(99));
    const hp = calcHiddenPower(g);
    expect(typeof hp.family).toBe('string');
    expect(hp.family.length).toBeGreaterThan(0);
  });

  it('Power liegt im Range 30-90', () => {
    for (let seed = 0; seed < 30; seed++) {
      const g = defaultGenome(mulberry32(seed));
      const hp = calcHiddenPower(g);
      expect(hp.power).toBeGreaterThanOrEqual(30);
      expect(hp.power).toBeLessThanOrEqual(90);
    }
  });

  it('ist deterministisch fuer gegebenes Genom', () => {
    const g = defaultGenome(mulberry32(123));
    const a = calcHiddenPower(g);
    const b = calcHiddenPower(g);
    expect(a).toEqual(b);
  });
});

describe('crossGenomes (heiliger Code-Pfad: Genom-Mix)', () => {
  it('Kind erbt jeweils 1 Allel aus jedem Eltern', () => {
    const A: PlantGenome = {
      alleleHp: [10, 20], alleleAtk: [10, 20], alleleDef: [10, 20],
      alleleSpd: [10, 20], alleleVit: [10, 20], alleleRoot: [10, 20],
      evHp: 0, evAtk: 0, evDef: 0, evSpd: 0, evVit: 0, evRoot: 0,
      eggMoves: [], traits: []
    };
    const B: PlantGenome = {
      alleleHp: [5, 6], alleleAtk: [5, 6], alleleDef: [5, 6],
      alleleSpd: [5, 6], alleleVit: [5, 6], alleleRoot: [5, 6],
      evHp: 0, evAtk: 0, evDef: 0, evSpd: 0, evVit: 0, evRoot: 0,
      eggMoves: [], traits: []
    };
    const child = crossGenomes(A, B, 1, false);
    // Erstes Allel kommt aus A (Werte 10 oder 20), zweites aus B (5 oder 6).
    expect([10, 20]).toContain(child.alleleHp[0]);
    expect([5, 6]).toContain(child.alleleHp[1]);
    expect([10, 20]).toContain(child.alleleAtk[0]);
    expect([5, 6]).toContain(child.alleleAtk[1]);
  });

  it('EV-Inheritance halbiert den Eltern-Mittelwert', () => {
    const A = defaultGenome(mulberry32(1));
    const B = defaultGenome(mulberry32(2));
    A.evAtk = 100; B.evAtk = 200;
    const child = crossGenomes(A, B, 1, false);
    // (100+200)/4 = 75
    expect(child.evAtk).toBe(75);
  });

  it('Egg-Move-Pool ist Vereinigung der Eltern, max 3 Moves', () => {
    const A = defaultGenome(mulberry32(1));
    const B = defaultGenome(mulberry32(2));
    A.eggMoves = ['move1', 'move2'];
    B.eggMoves = ['move3', 'move4', 'move5'];
    const child = crossGenomes(A, B, 1, false);
    expect(child.eggMoves.length).toBeLessThanOrEqual(3);
    for (const m of child.eggMoves) {
      expect(['move1','move2','move3','move4','move5']).toContain(m);
    }
    // Keine Duplikate.
    expect(new Set(child.eggMoves).size).toBe(child.eggMoves.length);
  });

  it('Mutation-Flag fuegt zusaetzliches Trait hinzu', () => {
    const A = defaultGenome(mulberry32(1));
    const B = defaultGenome(mulberry32(2));
    A.traits = []; B.traits = [];
    const child = crossGenomes(A, B, 1, true);
    expect(child.traits.length).toBeGreaterThanOrEqual(1);
  });

  it('Hidden-Power wird beim Crossing gesetzt', () => {
    const A = defaultGenome(mulberry32(1));
    const B = defaultGenome(mulberry32(2));
    const child = crossGenomes(A, B, 1, false);
    expect(child.hiddenPowerFamily).toBeDefined();
    expect(child.hiddenPowerPower).toBeGreaterThanOrEqual(30);
  });

  it('ist deterministisch fuer gleichen Seed (Trade-Code-Wiederherstellbarkeit)', () => {
    const A = defaultGenome(mulberry32(11));
    const B = defaultGenome(mulberry32(22));
    const child1 = crossGenomes(A, B, 555, false);
    const child2 = crossGenomes(A, B, 555, false);
    expect(child1).toEqual(child2);
  });

  it('Kind-Genom ist serialisierbar', () => {
    const A = defaultGenome(mulberry32(1));
    const B = defaultGenome(mulberry32(2));
    const child = crossGenomes(A, B, 99, false);
    const restored = JSON.parse(JSON.stringify(child));
    expect(restored).toEqual(child);
  });
});

describe('canCross', () => {
  it('blockiert bei Level < 5', () => {
    const p = makePlant({ level: 3 });
    const r = canCross(p);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/Level 5/);
  });

  it('blockiert bei aktivem Cooldown', () => {
    const p = makePlant({ level: 30 });
    p.genome!.crossCooldownUntil = Date.now() + 60_000;
    const r = canCross(p);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/Erholungszeit/);
  });

  it('erlaubt Cross wenn Level erreicht und kein Cooldown aktiv', () => {
    const p = makePlant({ level: 30 });
    const r = canCross(p);
    expect(r.ok).toBe(true);
  });

  it('erlaubt Cross wenn Cooldown abgelaufen', () => {
    const p = makePlant({ level: 30 });
    p.genome!.crossCooldownUntil = Date.now() - 1000;
    const r = canCross(p);
    expect(r.ok).toBe(true);
  });
});

describe('setCrossCooldown', () => {
  it('setzt Standard-Cooldown von 4h', () => {
    const p = makePlant();
    const before = Date.now();
    setCrossCooldown(p);
    const cd = p.genome!.crossCooldownUntil!;
    expect(cd).toBeGreaterThanOrEqual(before + CROSS_COOLDOWN_MS - 1000);
    expect(cd).toBeLessThanOrEqual(before + CROSS_COOLDOWN_MS + 1000);
  });

  it('halbiert Cooldown bei symbiotic-Trait', () => {
    const p = makePlant();
    p.genome!.traits = ['symbiotic'];
    const before = Date.now();
    setCrossCooldown(p);
    const cd = p.genome!.crossCooldownUntil!;
    expect(cd).toBeGreaterThanOrEqual(before + CROSS_COOLDOWN_MS_SYMBIOTIC - 1000);
    expect(cd).toBeLessThanOrEqual(before + CROSS_COOLDOWN_MS_SYMBIOTIC + 1000);
  });

  it('initialisiert Genom falls fehlt', () => {
    const p = makePlant();
    p.genome = undefined;
    setCrossCooldown(p);
    expect(p.genome).toBeDefined();
    expect(p.genome!.crossCooldownUntil).toBeDefined();
  });
});

describe('inheritQualityTier', () => {
  it('zwei common-Eltern liefern wahrscheinlich common', () => {
    let common = 0;
    for (let s = 0; s < 200; s++) {
      const r = inheritQualityTier('common', 'common', mulberry32(s));
      if (r === 'common') common++;
    }
    // Mehrheit common, aber nicht 100 Prozent
    expect(common).toBeGreaterThan(100);
  });

  it('tier-Index bleibt im Range', () => {
    for (let s = 0; s < 50; s++) {
      const r = inheritQualityTier('pristine', 'pristine', mulberry32(s));
      expect(['common','fine','quality','premium','pristine']).toContain(r);
    }
  });

  it('handhabt undefined-Eltern als common', () => {
    const r = inheritQualityTier(undefined, undefined, () => 0.3);
    expect(['common','fine','quality','premium','pristine']).toContain(r);
  });
});

describe('isOnCooldown und formatCooldown', () => {
  it('isOnCooldown false bei kein Cooldown gesetzt', () => {
    const p = makePlant();
    expect(isOnCooldown(p)).toBe(false);
  });

  it('isOnCooldown true wenn cd in Zukunft', () => {
    const p = makePlant();
    p.genome!.crossCooldownUntil = Date.now() + 60_000;
    expect(isOnCooldown(p)).toBe(true);
  });

  it('formatCooldown leerer String ohne Cooldown', () => {
    const p = makePlant();
    expect(formatCooldown(p)).toBe('');
  });

  it('formatCooldown leer wenn abgelaufen', () => {
    const p = makePlant();
    p.genome!.crossCooldownUntil = Date.now() - 1000;
    expect(formatCooldown(p)).toBe('');
  });

  it('formatCooldown zeigt h und m korrekt an', () => {
    const p = makePlant();
    const now = 1_000_000_000_000;
    p.genome!.crossCooldownUntil = now + (2 * 3600 + 15 * 60) * 1000;
    expect(formatCooldown(p, now)).toBe('2h 15m');
  });
});
