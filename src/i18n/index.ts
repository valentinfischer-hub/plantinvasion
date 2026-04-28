/**
 * i18n Modul fuer Plantinvasion (V1.0, 2026-04-28).
 * Lightweight standalone ohne externe Dependencies.
 * Unterstuetzt DE und EN, Locale-Detection via Browser + localStorage-Override.
 * Kein React-Import, kompatibel mit Phaser 3 Scene-Context.
 */

import deCommon from './de/common.json';
import deUi from './de/ui.json';
import dePlants from './de/plants.json';
import deQuests from './de/quests.json';

import enCommon from './en/common.json';
import enUi from './en/ui.json';
import enPlants from './en/plants.json';
import enQuests from './en/quests.json';

export type Locale = 'de' | 'en';

type TranslationMap = Record<string, string>;

const translations: Record<Locale, TranslationMap> = {
  de: { ...deCommon, ...deUi, ...dePlants, ...deQuests },
  en: { ...enCommon, ...enUi, ...enPlants, ...enQuests },
};

/** Aktuelle Locale. Initialwert wird via detectLocale() gesetzt. */
let currentLocale: Locale = 'de';

/**
 * Erkennt Locale-Praeferenz:
 * 1. localStorage Override via 'plantinvasion_locale'
 * 2. Browser navigator.language
 * 3. Fallback: 'de'
 */
export function detectLocale(): Locale {
  // localStorage Override (User-Einstellung in SettingsScene)
  const stored = typeof localStorage !== 'undefined'
    ? localStorage.getItem('plantinvasion_locale')
    : null;
  if (stored === 'de' || stored === 'en') {
    return stored;
  }

  // Browser-Locale
  if (typeof navigator !== 'undefined' && navigator.language) {
    const lang = navigator.language.toLowerCase().slice(0, 2);
    if (lang === 'en') return 'en';
    if (lang === 'de') return 'de';
  }

  // Fallback
  return 'de';
}

/** Initialisiert das i18n-System und setzt die Locale. */
export function initI18n(overrideLocale?: Locale): void {
  currentLocale = overrideLocale ?? detectLocale();
}

/** Gibt die aktuelle Locale zurueck. */
export function getLocale(): Locale {
  return currentLocale;
}

/** Setzt die Locale und speichert sie in localStorage. */
export function setLocale(locale: Locale): void {
  currentLocale = locale;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('plantinvasion_locale', locale);
  }
}

/**
 * Uebersetzt einen Key in die aktuelle Locale.
 * Unterstuetzt Template-Variablen via {{variable}}-Syntax.
 * Fallback-Kette: currentLocale -> 'de' -> Key selbst.
 *
 * @example
 * t('menu.continue')          // 'Weiterspielen' (de) oder 'Continue' (en)
 * t('settings.layout', { layout: 'desktop' }) // 'Layout: desktop'
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  const map = translations[currentLocale];
  let result = map[key] ?? translations['de'][key] ?? key;

  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      result = result.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
    }
  }

  return result;
}

// Initialisierung beim Modul-Import (kein IIFE-Problem in Vitest)
initI18n();
