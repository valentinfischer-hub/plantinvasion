import { describe, test, expect } from 'vitest';
/**
 * i18n VollstÃ¤ndigkeits-Tests [b4-run13/15]
 * PrÃ¼ft dass DE und EN dieselben Keys haben und keine leeren Werte
 */
import deUi from '../de/ui.json';
import enUi from '../en/ui.json';
import deCommon from '../de/common.json';
import enCommon from '../en/common.json';

describe('i18n VollstÃ¤ndigkeit: ui.json', () => {
  const deKeys = Object.keys(deUi).sort();
  const enKeys = Object.keys(enUi).sort();

  test('DE und EN haben dieselbe Anzahl Keys', () => {
    expect(deKeys.length).toBe(enKeys.length);
  });

  test('Alle DE Keys existieren in EN', () => {
    for (const key of deKeys) {
      expect(enKeys).toContain(key);
    }
  });

  test('Alle EN Keys existieren in DE', () => {
    for (const key of enKeys) {
      expect(deKeys).toContain(key);
    }
  });

  test('Kein leerer DE-Wert', () => {
    for (const [k, v] of Object.entries(deUi)) {
      expect(v.trim().length, `DE key "${k}" ist leer`).toBeGreaterThan(0);
    }
  });

  test('Kein leerer EN-Wert', () => {
    for (const [k, v] of Object.entries(enUi)) {
      expect(v.trim().length, `EN key "${k}" ist leer`).toBeGreaterThan(0);
    }
  });
});

describe('i18n VollstÃ¤ndigkeit: common.json', () => {
  const deKeys = Object.keys(deCommon).sort();
  const enKeys = Object.keys(enCommon).sort();

  test('DE und EN common haben dieselben Keys', () => {
    expect(deKeys).toEqual(enKeys);
  });

  test('Kein leerer common-Wert in DE', () => {
    for (const [k, v] of Object.entries(deCommon)) {
      expect(v.trim().length, `DE common "${k}" leer`).toBeGreaterThan(0);
    }
  });
});

describe('i18n Neue Keys vorhanden', () => {
  test('PokedexScene Keys vorhanden (DE)', () => {
    expect(deUi).toHaveProperty('pokedex.title');
    expect(deUi).toHaveProperty('pokedex.filterAll');
    expect(deUi).toHaveProperty('pokedex.filterCaptured');
    expect(deUi).toHaveProperty('pokedex.sortFamily');
  });

  test('InventoryScene Keys vorhanden (DE)', () => {
    expect(deUi).toHaveProperty('inventory.title');
    expect(deUi).toHaveProperty('inventory.empty');
  });

  test('HelpScene Keys vorhanden (DE)', () => {
    expect(deUi).toHaveProperty('help.tabControls');
    expect(deUi).toHaveProperty('help.tabGarden');
    expect(deUi).toHaveProperty('help.tabBreeding');
    expect(deUi).toHaveProperty('help.tabBattle');
  });

  test('SettingsScene Credits Keys vorhanden (DE)', () => {
    expect(deUi).toHaveProperty('settings.credits');
    expect(deUi).toHaveProperty('settings.creditsTitle');
  });

  test('Score-System Keys vorhanden (DE)', () => {
    expect(deUi).toHaveProperty('score.highscores');
    expect(deUi).toHaveProperty('score.dailyChallenge');
    expect(deUi).toHaveProperty('score.points');
  });

  test('Mindestens 100 i18n-Keys vorhanden (ui.json)', () => {
    expect(Object.keys(deUi).length).toBeGreaterThanOrEqual(100);
  });
});
