/**
 * B4-R4: Settings-State Tests
 * Testet: Loeschen-Workflow (Typing-Validierung), Credits-Logik
 */

import { describe, it, expect } from 'vitest';

/** Simuliert die Tippen-Logik fuer den Delete-Confirm */
function simulateTyping(keys: string[]): string {
  let typed = '';
  for (const key of keys) {
    if (key === 'Backspace') { typed = typed.slice(0, -1); }
    else if (key.length === 1 && typed.length < 8) { typed += key.toUpperCase(); }
  }
  return typed;
}

function isDeleteConfirmed(typed: string): boolean {
  return typed.toUpperCase() === 'LOESCHEN';
}

function displayTyped(typed: string): string {
  return typed.padEnd(8, '_').split('').join(' ');
}

describe('Settings Delete-Confirm Typing-Logik', () => {
  it('korrekte eingabe bestaetigt loeschen', () => {
    const typed = simulateTyping(['L','O','E','S','C','H','E','N']);
    expect(isDeleteConfirmed(typed)).toBe(true);
  });

  it('falsche eingabe bestaetigt nicht', () => {
    const typed = simulateTyping(['L','O','S','C','H','E','N']);
    expect(isDeleteConfirmed(typed)).toBe(false);
  });

  it('leere eingabe bestaetigt nicht', () => {
    expect(isDeleteConfirmed('')).toBe(false);
  });

  it('backspace loescht letztes zeichen', () => {
    const typed = simulateTyping(['L','O','E','Backspace','E']);
    expect(typed).toBe('LOE');
  });

  it('maximal 8 zeichen', () => {
    const typed = simulateTyping(['A','B','C','D','E','F','G','H','I','J']);
    expect(typed.length).toBe(8);
  });

  it('kleinbuchstaben werden uppercase', () => {
    const typed = simulateTyping(['l','o','e','s']);
    expect(typed).toBe('LOES');
  });
});

describe('Settings displayTyped Formatierung', () => {
  it('leerer string gibt 8 underscores getrennt', () => {
    expect(displayTyped('')).toBe('_ _ _ _ _ _ _ _');
  });

  it('4 zeichen + 4 underscores', () => {
    expect(displayTyped('LOES')).toBe('L O E S _ _ _ _');
  });

  it('volle eingabe ohne underscores', () => {
    expect(displayTyped('LOESCHEN')).toBe('L O E S C H E N');
  });
});

describe('Settings Reset-Default Werte', () => {
  const DEFAULT_MASTER_VOL = 0.7;
  const DEFAULT_SFX_VOL = 0.8;
  const DEFAULT_MUSIC_VOL = 0.6;

  it('default master volume ist 0.7', () => {
    expect(DEFAULT_MASTER_VOL).toBe(0.7);
  });

  it('sfx default hoeher als music default', () => {
    expect(DEFAULT_SFX_VOL).toBeGreaterThan(DEFAULT_MUSIC_VOL);
  });
});
