import { describe, it, expect, beforeEach } from 'vitest';

// Teste NPC-Relation-Logik isoliert (ohne gameStore/Phaser)

describe('NPC-Hearts-System Logik', () => {
  // Simuliere die Hearts-Logik
  const MAX_HEARTS = 10;
  
  function addHearts(current: number, amount: number): number {
    return Math.min(MAX_HEARTS, current + amount);
  }
  
  function heartsDisplay(count: number): string {
    const filled = '♥'.repeat(count);
    const empty = '♡'.repeat(MAX_HEARTS - count);
    return filled + empty;
  }

  it('addHearts erhöht den Wert', () => {
    expect(addHearts(0, 1)).toBe(1);
    expect(addHearts(5, 2)).toBe(7);
  });

  it('addHearts geht nicht über MAX_HEARTS', () => {
    expect(addHearts(9, 5)).toBe(MAX_HEARTS);
    expect(addHearts(10, 1)).toBe(MAX_HEARTS);
  });

  it('heartsDisplay zeigt korrekte Anzahl gefüllter Herzen', () => {
    const display = heartsDisplay(3);
    expect(display.split('♥').length - 1).toBe(3);
    expect(display.split('♡').length - 1).toBe(7);
  });

  it('heartsDisplay bei 0 Hearts zeigt nur leere Herzen', () => {
    const display = heartsDisplay(0);
    expect(display.includes('♥')).toBe(false);
    expect(display.split('♡').length - 1).toBe(MAX_HEARTS);
  });

  it('heartsDisplay bei MAX_HEARTS zeigt nur gefüllte Herzen', () => {
    const display = heartsDisplay(MAX_HEARTS);
    expect(display.includes('♡')).toBe(false);
  });

  it('Weekly-Gift-Key ist eindeutig pro NPC+Woche', () => {
    const year = 1, day = 7;
    const npcId = 'anya';
    const weekNum = Math.floor(day / 7);
    const key = `npc_gift_week_${npcId}_${year}_${weekNum}`;
    expect(key).toBe('npc_gift_week_anya_1_1');
    
    // Andere Woche
    const key2 = `npc_gift_week_anya_1_${Math.floor(14 / 7)}`;
    expect(key2).not.toBe(key);
  });

  it('npc_hearts_key-Format ist korrekt', () => {
    const npcId = 'bjoern';
    const key = `npc_hearts_${npcId}`;
    expect(key).toBe('npc_hearts_bjoern');
  });
});
