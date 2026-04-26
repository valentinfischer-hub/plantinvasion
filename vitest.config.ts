import { defineConfig } from 'vitest/config';

/**
 * Vitest-Konfiguration fuer Plantinvasion.
 *
 * Coverage-Ziele:
 *  - Heilige Code-Pfade (Genetik, Save-Migration) muessen >= 90 Prozent halten.
 *  - leveling.ts ist Teil der Wachstums-Pipeline (Hydration, Stages, Tick) und
 *    bleibt bei 90 Prozent Lines.
 *  - storage.ts ist nach dem ASCENDING-Migrations-Bugfix komplett unit-getestet
 *    (28 Tests, jede Versionsstufe). Threshold 85 Prozent.
 *  - gameTime.ts ist neu und Pflicht-100 Prozent damit Refactorings auf den
 *    heiligen Pfaden risikofrei moeglich werden.
 *  - featureFlags.ts wird mit getestet, kein harter Threshold (Module-Top-Level
 *    ist build-time-baked und nicht voll mockbar).
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'src/data/genetics.ts',
        'src/data/breedingV2.ts',
        'src/data/leveling.ts',
        'src/state/storage.ts',
        'src/utils/gameTime.ts',
        'src/utils/featureFlags.ts',
        'src/services/supabase.ts'
      ],
      thresholds: {
        'src/data/genetics.ts': { lines: 90, statements: 90, functions: 90, branches: 80 },
        'src/data/breedingV2.ts': { lines: 90, statements: 90, functions: 90, branches: 80 },
        'src/data/leveling.ts': { lines: 90, statements: 90, functions: 90, branches: 90 },
        'src/state/storage.ts': { lines: 85, statements: 85, functions: 85, branches: 80 },
        'src/utils/gameTime.ts': { lines: 100, statements: 100, functions: 100, branches: 100 },
        'src/services/supabase.ts': { lines: 50, statements: 50, functions: 100, branches: 55 }
      }
    }
  }
});
