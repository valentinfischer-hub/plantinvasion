import { defineConfig } from 'vitest/config';

/**
 * Vitest-Konfiguration fuer Plantinvasion.
 * Genetik-Coverage-Ziel: 90 Prozent fuer src/data/genetics.ts und src/data/breedingV2.ts.
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
        'src/data/leveling.ts'
      ],
      thresholds: {
        'src/data/genetics.ts': { lines: 90, statements: 90, functions: 90, branches: 80 },
        'src/data/breedingV2.ts': { lines: 90, statements: 90, functions: 90, branches: 80 }
      }
    }
  }
});
