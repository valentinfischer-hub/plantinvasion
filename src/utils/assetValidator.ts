/**
 * AssetValidator - Pruefdienst fuer Phaser-Texturen und Audio-Keys.
 *
 * Warnt in der Konsole (und via fireAppError) wenn erwartete Assets fehlen.
 * Kann nach scene.create() aufgerufen werden.
 *
 * Usage:
 *   import { validateSceneAssets } from '../utils/assetValidator';
 *   // In Scene.create():
 *   validateSceneAssets(this, BATTLE_REQUIRED_ASSETS);
 *
 * S-POLISH Batch 5 Run 13
 */
import Phaser from 'phaser';
import { fireAppError, assetLoadError } from './errorHandler';

// ─── Asset-Definitionen ───────────────────────────────────────────────────

export interface AssetSpec {
  key: string;
  type: 'image' | 'audio' | 'atlas' | 'tilemapTiledJSON';
  /** Wenn true: Fehlen dieses Assets unterbricht das Spiel. Default: false. */
  critical?: boolean;
}

/** Bekannte Asset-Sets pro Scene. */
export const BATTLE_REQUIRED_ASSETS: AssetSpec[] = [
  { key: 'tile_grass', type: 'image' },
  { key: 'tile_tropical', type: 'image' },
  { key: 'tile_cactus', type: 'image' },
  { key: 'tile_flowerbed', type: 'image' },
  { key: 'tile_bromeliad', type: 'image' },
  { key: 'tile_snow', type: 'image' },
  { key: 'tile_salt', type: 'image' },
];

export const OVERWORLD_REQUIRED_ASSETS: AssetSpec[] = [
  { key: 'player', type: 'image', critical: true },
  { key: 'tile_grass', type: 'image' },
];

// ─── Validation ───────────────────────────────────────────────────────────

export interface ValidationResult {
  missing: string[];
  loaded: string[];
  criticalMissing: boolean;
}

/**
 * Prueft ob alle gewuenschten Assets in der Phaser-TextureManager vorhanden sind.
 * Logt Warnungen fuer fehlende Assets und feuert fireAppError fuer kritische.
 */
export function validateSceneAssets(
  scene: Phaser.Scene,
  specs: AssetSpec[],
  options: { silent?: boolean } = {}
): ValidationResult {
  const missing: string[] = [];
  const loaded: string[] = [];
  let criticalMissing = false;

  for (const spec of specs) {
    let exists = false;

    switch (spec.type) {
      case 'image':
      case 'atlas':
        exists = scene.textures.exists(spec.key);
        break;
      case 'audio':
        exists = scene.cache.audio.exists(spec.key);
        break;
      case 'tilemapTiledJSON':
        exists = scene.cache.tilemap.exists(spec.key);
        break;
    }

    if (exists) {
      loaded.push(spec.key);
    } else {
      missing.push(spec.key);
      if (spec.critical) criticalMissing = true;

      if (!options.silent) {
        const msg = `[AssetValidator] Fehlendes Asset: "${spec.key}" (${spec.type})${spec.critical ? ' [KRITISCH]' : ''}`;
        console.warn(msg);

        if (spec.critical) {
          fireAppError(assetLoadError(spec.key, 'Asset not loaded'));
        }
      }
    }
  }

  return { missing, loaded, criticalMissing };
}

/**
 * Gibt ein Asset-Report-Objekt als String zurueck (fuer Debug-Overlay).
 */
export function assetReportSummary(result: ValidationResult): string {
  const total = result.missing.length + result.loaded.length;
  if (result.missing.length === 0) return `Assets: ${total}/${total} OK`;
  return `Assets: ${result.loaded.length}/${total} OK, Fehlt: ${result.missing.join(', ')}`;
}
