/**
 * AssetValidator Tests - S-POLISH Batch 5 Run 13
 *
 * Testet assetReportSummary() und ASSET_SPEC-Konstanten (keine Phaser noetig).
 */
import { describe, it, expect, vi } from 'vitest';
import { assetReportSummary, BATTLE_REQUIRED_ASSETS, OVERWORLD_REQUIRED_ASSETS } from '../assetValidator';
import type { ValidationResult } from '../assetValidator';

vi.mock('phaser', () => ({}));
vi.mock('../errorHandler', () => ({
  fireAppError: vi.fn(),
  assetLoadError: vi.fn((_key: string, _err: Error) => ({ type: 'assetLoad', key: _key })),
}));

describe('assetReportSummary', () => {
  it('alle geladen: zeigt OK', () => {
    const result: ValidationResult = { missing: [], loaded: ['a', 'b', 'c'], criticalMissing: false };
    expect(assetReportSummary(result)).toBe('Assets: 3/3 OK');
  });

  it('teilweise fehlend: zeigt Anzahl und Namen', () => {
    const result: ValidationResult = { missing: ['tile_snow'], loaded: ['tile_grass'], criticalMissing: false };
    expect(assetReportSummary(result)).toBe('Assets: 1/2 OK, Fehlt: tile_snow');
  });

  it('mehrere fehlend: komma-getrennt', () => {
    const result: ValidationResult = {
      missing: ['tile_snow', 'tile_salt'],
      loaded: ['tile_grass'],
      criticalMissing: false
    };
    expect(assetReportSummary(result)).toContain('tile_snow, tile_salt');
  });

  it('vollstaendig fehlend: 0/n', () => {
    const result: ValidationResult = { missing: ['a', 'b'], loaded: [], criticalMissing: true };
    expect(assetReportSummary(result)).toBe('Assets: 0/2 OK, Fehlt: a, b');
  });
});

describe('BATTLE_REQUIRED_ASSETS Spezifikation', () => {
  it('enthaelt tile_grass', () => {
    const keys = BATTLE_REQUIRED_ASSETS.map(a => a.key);
    expect(keys).toContain('tile_grass');
  });

  it('alle Eintraege haben key und type', () => {
    for (const spec of BATTLE_REQUIRED_ASSETS) {
      expect(typeof spec.key).toBe('string');
      expect(spec.type).toBeTruthy();
    }
  });

  it('hat mindestens 5 Assets', () => {
    expect(BATTLE_REQUIRED_ASSETS.length).toBeGreaterThanOrEqual(5);
  });
});

describe('OVERWORLD_REQUIRED_ASSETS Spezifikation', () => {
  it('enthaelt player (kritisch)', () => {
    const playerSpec = OVERWORLD_REQUIRED_ASSETS.find(a => a.key === 'player');
    expect(playerSpec).toBeDefined();
    expect(playerSpec?.critical).toBe(true);
  });
});
