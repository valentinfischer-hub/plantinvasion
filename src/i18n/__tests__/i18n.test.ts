/**
 * Tests fuer src/i18n/index.ts
 * Prueft Locale-Detection, Fallback-Kette, Key-Lookup und Template-Variablen.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  detectLocale,
  initI18n,
  getLocale,
  setLocale,
  t,
} from '../index';

// localStorage-Mock fuer jsdom-losen Node-Kontext
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('i18n - detectLocale', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('gibt de zurueck wenn localStorage leer und navigator.language de-CH', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { language: 'de-CH' }, writable: true, configurable: true,
    });
    const locale = detectLocale();
    expect(locale).toBe('de');
  });

  it('gibt en zurueck wenn navigator.language en-US', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { language: 'en-US' }, writable: true, configurable: true,
    });
    const locale = detectLocale();
    expect(locale).toBe('en');
  });

  it('localStorage Override hat hoechste Prioritaet', () => {
    localStorageMock.setItem('plantinvasion_locale', 'en');
    Object.defineProperty(globalThis, 'navigator', {
      value: { language: 'de-DE' }, writable: true, configurable: true,
    });
    expect(detectLocale()).toBe('en');
  });

  it('Fallback auf de wenn navigator.language unbekannte Sprache', () => {
    localStorageMock.clear();
    Object.defineProperty(globalThis, 'navigator', {
      value: { language: 'zh-TW' }, writable: true, configurable: true,
    });
    expect(detectLocale()).toBe('de');
  });
});

describe('i18n - initI18n + getLocale', () => {
  it('initI18n mit override setzt Locale direkt', () => {
    initI18n('en');
    expect(getLocale()).toBe('en');
  });

  it('initI18n ohne override nutzt detectLocale', () => {
    localStorageMock.setItem('plantinvasion_locale', 'de');
    initI18n();
    expect(getLocale()).toBe('de');
  });
});

describe('i18n - setLocale', () => {
  it('setzt Locale und speichert in localStorage', () => {
    setLocale('en');
    expect(getLocale()).toBe('en');
    expect(localStorageMock.getItem('plantinvasion_locale')).toBe('en');
  });

  it('wechselt zurueck zu de', () => {
    setLocale('de');
    expect(getLocale()).toBe('de');
  });
});

describe('i18n - t() Key-Lookup', () => {
  beforeEach(() => {
    initI18n('de');
  });

  it('uebersetzt menu.continue auf DE', () => {
    initI18n('de');
    expect(t('menu.continue')).toBe('Weiterspielen');
  });

  it('uebersetzt menu.continue auf EN', () => {
    initI18n('en');
    expect(t('menu.continue')).toBe('Continue');
  });

  it('uebersetzt menu.settings auf DE', () => {
    initI18n('de');
    expect(t('menu.settings')).toBe('Einstellungen');
  });

  it('uebersetzt menu.help auf DE', () => {
    initI18n('de');
    expect(t('menu.help')).toBe('Hilfe & Hotkeys');
  });

  it('uebersetzt menu.newGame auf DE', () => {
    initI18n('de');
    expect(t('menu.newGame')).toBe('Neues Spiel');
  });

  it('uebersetzt menu.startGame auf EN', () => {
    initI18n('en');
    expect(t('menu.startGame')).toBe('Start Game');
  });

  it('gibt Key selbst zurueck wenn nicht vorhanden', () => {
    initI18n('de');
    expect(t('UNDEFINED_KEY_XYZ')).toBe('UNDEFINED_KEY_XYZ');
  });
});

describe('i18n - t() Template-Variablen', () => {
  beforeEach(() => {
    initI18n('de');
  });

  it('ersetzt {{percent}} in loading-String', () => {
    const result = t('loading', { percent: 42 });
    expect(result).toBe('lade Assets 42%');
  });

  it('ersetzt {{layout}} in settings.layout', () => {
    initI18n('de');
    const result = t('settings.layout', { layout: 'desktop' });
    expect(result).toBe('Layout: desktop');
  });

  it('EN Template-Variable korrekt', () => {
    initI18n('en');
    const result = t('loading', { percent: 100 });
    expect(result).toBe('Loading Assets 100%');
  });

  it('keine unersetzten Platzhalter bleiben uebrig', () => {
    initI18n('de');
    const result = t('loading', { percent: 0 });
    expect(result).not.toContain('{{');
    expect(result).not.toContain('}}');
  });
});

describe('i18n - Pflanzen-Namen', () => {
  it('liefert korrekten botanischen Namen auf DE', () => {
    initI18n('de');
    expect(t('sunflower.name')).toBe('Helianthus annuus');
  });

  it('liefert korrekten botanischen Namen auf EN', () => {
    initI18n('en');
    expect(t('sunflower.name')).toBe('Helianthus annuus');
  });
});

describe('i18n - Quest-Strings', () => {
  it('Quest-Titel auf DE', () => {
    initI18n('de');
    expect(t('q001.title')).toBe('Erste Schritte');
  });

  it('Quest-Titel auf EN', () => {
    initI18n('en');
    expect(t('q001.title')).toBe('First Steps');
  });
});
