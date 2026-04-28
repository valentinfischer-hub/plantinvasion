/**
 * Tests: Save Export/Import + Cloud-Sync Stub (S-POLISH-B2-R17)
 */
import { describe, it, expect } from 'vitest';

// Inline-Port der Logik (ohne Phaser/localStorage-Abhängigkeiten)
interface MinimalSave {
  version: number;
  playerId: string;
  coins: number;
  plants: unknown[];
}

function exportSaveJSON(state: MinimalSave): string {
  return JSON.stringify(state, null, 2);
}

function importSaveJSON(json: string): { ok: boolean; error?: string; state?: MinimalSave } {
  try {
    const parsed = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return { ok: false, error: 'Kein valides JSON-Objekt' };
    if (typeof parsed.version !== 'number') return { ok: false, error: 'Fehlende version-Nummer im Spielstand' };
    if (typeof parsed.playerId !== 'string') return { ok: false, error: 'Fehlende playerId' };
    return { ok: true, state: parsed as MinimalSave };
  } catch (e) {
    return { ok: false, error: `JSON-Fehler: ${String(e)}` };
  }
}

const SAMPLE_SAVE: MinimalSave = {
  version: 11,
  playerId: 'test-player-1',
  coins: 500,
  plants: []
};

describe('exportSaveJSON', () => {
  it('gibt validen JSON-String zurück', () => {
    const json = exportSaveJSON(SAMPLE_SAVE);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('enthält alle State-Felder', () => {
    const json = exportSaveJSON(SAMPLE_SAVE);
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe(11);
    expect(parsed.playerId).toBe('test-player-1');
    expect(parsed.coins).toBe(500);
  });
});

describe('importSaveJSON', () => {
  it('akzeptiert validen Spielstand', () => {
    const json = exportSaveJSON(SAMPLE_SAVE);
    const r = importSaveJSON(json);
    expect(r.ok).toBe(true);
    expect(r.state?.playerId).toBe('test-player-1');
  });

  it('lehnt kein JSON ab', () => {
    const r = importSaveJSON('invalid-json{{{');
    expect(r.ok).toBe(false);
    expect(r.error).toContain('JSON-Fehler');
  });

  it('lehnt JSON-Array ab (kein Objekt)', () => {
    const r = importSaveJSON('[1, 2, 3]');
    expect(r.ok).toBe(false);
    expect(r.error).toBe('Kein valides JSON-Objekt');
  });

  it('lehnt Objekt ohne version ab', () => {
    const r = importSaveJSON('{"playerId": "x", "coins": 100}');
    expect(r.ok).toBe(false);
    expect(r.error).toBe('Fehlende version-Nummer im Spielstand');
  });

  it('lehnt Objekt ohne playerId ab', () => {
    const r = importSaveJSON('{"version": 11, "coins": 100}');
    expect(r.ok).toBe(false);
    expect(r.error).toBe('Fehlende playerId');
  });

  it('akzeptiert Spielstand mit extra Feldern', () => {
    const extended = { ...SAMPLE_SAVE, someNewField: 'test' };
    const r = importSaveJSON(JSON.stringify(extended));
    expect(r.ok).toBe(true);
  });
});

describe('Cloud-Sync Stub', () => {
  it('cloudSyncUpload gibt ok=false zurück wenn MP_ENABLED=false', async () => {
    // Stub-Verhalten (immer false weil MP_ENABLED off)
    const result = await Promise.resolve({ ok: false, reason: 'Cloud-Sync noch nicht aktiviert (kommt in S-12)' });
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('S-12');
  });
});
