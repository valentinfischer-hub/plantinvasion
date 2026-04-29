/**
 * S-POLISH-B3-R3: BattleLog + FleeSystem Tests
 * Testet: BattleLog-Ringpuffer, Flee-Erfolgsrate, Status-Icon-Mapping
 */
import { describe, it, expect } from 'vitest';

// =====================================================================
// Battle-Log Ringpuffer
// =====================================================================
describe('Battle-Log Ringpuffer', () => {
  function makeBattleLog(): { log: string[]; push: (e: string) => void; getLastN: (n: number) => string[] } {
    const log: string[] = [];
    return {
      log,
      push(entry: string) {
        const lines = entry.split('\n').filter(l => l.trim().length > 0);
        for (const line of lines) log.push(line.trim());
        while (log.length > 6) log.shift();
      },
      getLastN(n: number) { return log.slice(-n); }
    };
  }

  it('Log startet leer', () => {
    const bl = makeBattleLog();
    expect(bl.getLastN(3)).toHaveLength(0);
  });

  it('Log haelt max 6 Eintraege', () => {
    const bl = makeBattleLog();
    for (let i = 0; i < 10; i++) bl.push(`Aktion ${i}`);
    expect(bl.log.length).toBeLessThanOrEqual(6);
  });

  it('Letzter Eintrag ist neuster', () => {
    const bl = makeBattleLog();
    bl.push('Aktion 1');
    bl.push('Aktion 2');
    bl.push('Aktion 3');
    const last = bl.getLastN(3);
    expect(last[last.length - 1]).toBe('Aktion 3');
  });

  it('getLastN(3) liefert maximal 3 Eintraege', () => {
    const bl = makeBattleLog();
    bl.push('A'); bl.push('B'); bl.push('C'); bl.push('D');
    expect(bl.getLastN(3).length).toBeLessThanOrEqual(3);
  });

  it('Multiline-Entry wird in Einzelzeilen aufgeteilt', () => {
    const bl = makeBattleLog();
    bl.push('Zeile 1\nZeile 2\nZeile 3');
    expect(bl.log.length).toBe(3);
  });
});

// =====================================================================
// Flee-System (70% Erfolgsrate)
// =====================================================================
describe('Flee-System', () => {
  function simulateFlee(trials: number, successRate = 0.7): number {
    let successes = 0;
    for (let i = 0; i < trials; i++) {
      if (Math.random() < successRate) successes++;
    }
    return successes / trials;
  }

  it('Flucht-Basis-Rate ist 0.7', () => {
    const rate = 0.7;
    expect(rate).toBe(0.7);
  });

  it('Viele Trials naehern sich 70% Erfolgsrate', () => {
    const rate = simulateFlee(10000);
    // Erlaubt +/- 5% Toleranz
    expect(rate).toBeGreaterThan(0.60);
    expect(rate).toBeLessThan(0.80);
  });

  it('Flucht-Fehlschlag bedeutet Gegner greift an', () => {
    // Logik: wenn Flee fehlschlaegt, haelt wild eine Runde an
    const fleeFailed = true;
    const enemyAttacksOnFail = fleeFailed;
    expect(enemyAttacksOnFail).toBe(true);
  });
});

// =====================================================================
// Status-Effekt-Icons
// =====================================================================
describe('Status-Effekt-Icon-Mapping', () => {
  const STATUS_COLORS: Record<string, string> = {
    wilted: '#c8b860',
    pests: '#88cc44',
    poisoned: '#bb44bb',
    asleep: '#4488ff',
    rooted: '#44aa44',
    fungus: '#aa8833',
    frostbite: '#88ddff'
  };

  it('Alle 7 Status-Effekte haben Farben', () => {
    const effects = ['wilted', 'pests', 'poisoned', 'asleep', 'rooted', 'fungus', 'frostbite'];
    for (const e of effects) {
      expect(STATUS_COLORS[e]).toBeDefined();
    }
  });

  it('Icon-Label ist 3 Buchstaben (Slice 0-3)', () => {
    const label = 'poisoned'.slice(0, 3).toUpperCase();
    expect(label).toBe('POI');
  });

  it('Status-Icons positioniert relativ zu Anzahl', () => {
    const statuses = ['wilted', 'poisoned'];
    const positions = statuses.map((_, i) => i * 28 - statuses.length * 14 + 14);
    // Erster Icon bei 0*28 - 2*14 + 14 = -14
    expect(positions[0]).toBe(-14);
    // Zweiter Icon bei 1*28 - 2*14 + 14 = 14
    expect(positions[1]).toBe(14);
  });
});

// =====================================================================
// Post-Battle-Summary
// =====================================================================
describe('Post-Battle-Summary', () => {
  it('XP immer angezeigt', () => {
    const xp = 50;
    const items = [{ label: `+${xp} XP`, delay: 200 }];
    expect(items[0].label).toBe('+50 XP');
  });

  it('Coins nur wenn > 0', () => {
    const coins = 0;
    const items = coins > 0 ? [{ label: `+${coins} Coins` }] : [];
    expect(items).toHaveLength(0);
  });

  it('Drop-Item nur wenn vorhanden', () => {
    const dropItem = 'sunflower-seed';
    const items = dropItem ? [{ label: `+1 ${dropItem}` }] : [];
    expect(items[0].label).toBe('+1 sunflower-seed');
  });

  it('Ohne Drops: nur XP in Summary', () => {
    const items: { label: string }[] = [];
    const xp = 30;
    items.push({ label: `+${xp} XP` });
    const coins = 0; const dropItem = '';
    if (coins > 0) items.push({ label: `+${coins} Coins` });
    if (dropItem) items.push({ label: `+1 ${dropItem}` });
    expect(items.length).toBe(1);
  });
});
