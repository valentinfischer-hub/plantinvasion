import { describe, it, expect } from 'vitest';

// Teste NPC-Relation-Logik isoliert (ohne gameStore/Phaser)

describe('NPC-Hearts-System Logik', () => {
  // Simuliere die Hearts-Logik
  const MAX_HEARTS = 10;
  
  function addHearts(current: number, amount: number): number {
    return Math.min(MAX_HEARTS, current + amount);
  }
  
  function heartsDisplay(count: number): string {
    const filled = 'â¥'.repeat(count);
    const empty = 'â¡'.repeat(MAX_HEARTS - count);
    return filled + empty;
  }

  it('addHearts erhÃ¶ht den Wert', () => {
    expect(addHearts(0, 1)).toBe(1);
    expect(addHearts(5, 2)).toBe(7);
  });

  it('addHearts geht nicht Ã¼ber MAX_HEARTS', () => {
    expect(addHearts(9, 5)).toBe(MAX_HEARTS);
    expect(addHearts(10, 1)).toBe(MAX_HEARTS);
  });

  it('heartsDisplay zeigt korrekte Anzahl gefÃ¼llter Herzen', () => {
    const display = heartsDisplay(3);
    expect(display.split('â¥').length - 1).toBe(3);
    expect(display.split('â¡').length - 1).toBe(7);
  });

  it('heartsDisplay bei 0 Hearts zeigt nur leere Herzen', () => {
    const display = heartsDisplay(0);
    expect(display.includes('â¥')).toBe(false);
    expect(display.split('â¡').length - 1).toBe(MAX_HEARTS);
  });

  it('heartsDisplay bei MAX_HEARTS zeigt nur gefÃ¼llte Herzen', () => {
    const display = heartsDisplay(MAX_HEARTS);
    expect(display.includes('â¡')).toBe(false);
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
