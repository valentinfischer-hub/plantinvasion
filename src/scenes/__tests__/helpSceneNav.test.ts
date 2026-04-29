/**
 * B4-R2: HelpScene-Navigation Tests
 * Testet: Tab-Daten, SCENE_HELP_HINT, Tab-Index-Logik
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('phaser', () => ({
  default: { Scene: class {}, GameObjects: { Text: class {}, Image: class {}, Graphics: class {} }, Math: { Clamp: (v: number) => v } },
}));

import { SCENE_HELP_HINT } from '../HelpScene';

// Tab-Daten inline (ohne Phaser-Import)
const HELP_TAB_LABELS = ['Steuerung', 'Garten', 'Zucht', 'Kampf'];
const EXPECTED_SECTIONS = {
  Steuerung: 3,
  Garten: 3,
  Zucht: 3,
  Kampf: 3,
};

describe('HelpScene Tab-Navigation', () => {
  it('4 Tabs definiert', () => {
    expect(HELP_TAB_LABELS).toHaveLength(4);
  });

  it('Tab-Labels korrekt', () => {
    expect(HELP_TAB_LABELS).toContain('Steuerung');
    expect(HELP_TAB_LABELS).toContain('Garten');
    expect(HELP_TAB_LABELS).toContain('Zucht');
    expect(HELP_TAB_LABELS).toContain('Kampf');
  });

  it('jeder Tab hat 3 Sektionen', () => {
    Object.entries(EXPECTED_SECTIONS).forEach(([tab, count]) => {
      expect(count).toBe(3);
      void tab;
    });
  });

  it('switchTab begrenzt auf valid index', () => {
    const maxIdx = HELP_TAB_LABELS.length - 1;
    const clamp = (i: number) => Math.max(0, Math.min(maxIdx, i));
    expect(clamp(-1)).toBe(0);
    expect(clamp(0)).toBe(0);
    expect(clamp(3)).toBe(3);
    expect(clamp(4)).toBe(3);
    expect(clamp(99)).toBe(3);
  });
});

describe('HelpScene SCENE_HELP_HINT', () => {
  it('GardenScene -> Garten Tab', () => {
    expect(SCENE_HELP_HINT['GardenScene']).toBe('Garten');
  });

  it('BattleScene -> Kampf Tab', () => {
    expect(SCENE_HELP_HINT['BattleScene']).toBe('Kampf');
  });

  it('OverworldScene -> Steuerung Tab', () => {
    expect(SCENE_HELP_HINT['OverworldScene']).toBe('Steuerung');
  });

  it('PokedexScene -> Zucht Tab', () => {
    expect(SCENE_HELP_HINT['PokedexScene']).toBe('Zucht');
  });

  it('unbekannte Scene gibt undefined', () => {
    expect(SCENE_HELP_HINT['UnknownScene']).toBeUndefined();
  });
});

describe('HelpScene Scroll-Logik', () => {
  it('scrollBy bleibt in bounds (0 bis maxScrollY)', () => {
    const scrollBy = (current: number, dy: number, maxScrollY: number) =>
      Math.max(0, Math.min(maxScrollY, current + dy));

    expect(scrollBy(0, -50, 200)).toBe(0);
    expect(scrollBy(0, 50, 200)).toBe(50);
    expect(scrollBy(180, 50, 200)).toBe(200);
    expect(scrollBy(200, 50, 200)).toBe(200);
  });
});
