/**
 * SoundManager Tests - S-POLISH Batch 5 Run 1
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  setSfxVolume as mockSetSfxVolume,
  setPersistedSfxVolume as mockSetPersistedSfxVolume,
} from '../sfxGenerator';

// Mock sfxGenerator before importing SoundManager
vi.mock('../sfxGenerator', () => ({
  setMasterVolume: vi.fn(),
  getMasterVolume: vi.fn(() => 0.4),
  setSfxVolume: vi.fn(),
  getSfxVolume: vi.fn(() => 1.0),
  setMusicVolume: vi.fn(),
  getMusicVolume: vi.fn(() => 1.0),
  getPersistedVolume: vi.fn(() => 0.4),
  setPersistedVolume: vi.fn(),
  getPersistedSfxVolume: vi.fn(() => 1.0),
  setPersistedSfxVolume: vi.fn(),
  getPersistedMusicVolume: vi.fn(() => 1.0),
  setPersistedMusicVolume: vi.fn(),
  startAmbientBGM: vi.fn(),
  stopAmbientBGM: vi.fn(),
  startAmbientBGMFadeIn: vi.fn(),
  fadeOutBGM: vi.fn(() => Promise.resolve()),
  setBiomeAmbience: vi.fn(),
  stopBiomeAmbience: vi.fn(),
  synthEntryStinger: vi.fn(),
  sfx: { click: vi.fn(), error: vi.fn() },
}));

// Mock localStorage
const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
});

describe('SoundManager Singleton', () => {
  beforeEach(() => {
    Object.keys(store).forEach(k => delete store[k]);
    vi.resetModules();
  });

  it('ist nicht stumm beim Start (kein Key in localStorage)', async () => {
    vi.resetModules();
    const mod = await import('../SoundManager');
    expect(mod.SoundManager.muted).toBe(false);
  });

  it('toggleMute setzt muted auf true', async () => {
    vi.resetModules();
    const mod = await import('../SoundManager');
    const m = mod.SoundManager;
    m.setMute(false);
    m.toggleMute();
    expect(m.muted).toBe(true);
  });

  it('toggleMute zweimal = zurück auf false', async () => {
    vi.resetModules();
    const mod = await import('../SoundManager');
    const m = mod.SoundManager;
    m.setMute(false);
    m.toggleMute();
    m.toggleMute();
    expect(m.muted).toBe(false);
  });

  it('setMute(true) setzt muted', async () => {
    vi.resetModules();
    const mod = await import('../SoundManager');
    const m = mod.SoundManager;
    m.setMute(true);
    expect(m.muted).toBe(true);
  });

  it('sfx-Proxy vorhanden', async () => {
    vi.resetModules();
    const mod = await import('../SoundManager');
    expect(mod.SoundManager.sfx).toBeDefined();
    expect(typeof mod.SoundManager.sfx).toBe('object');
  });

  it('setSfxVolume delegiert an sfxGenerator', async () => {
    vi.resetModules();
    const mod = await import('../SoundManager');
    mod.SoundManager.setSfxVolume(0.5);
    expect(mockSetSfxVolume).toHaveBeenCalledWith(0.5);
    expect(mockSetPersistedSfxVolume).toHaveBeenCalledWith(0.5);
  });

  it('stopBGM aufrufbar wenn muted', async () => {
    vi.resetModules();
    const mod = await import('../SoundManager');
    const m = mod.SoundManager;
    m.setMute(true);
    expect(() => m.stopBGM()).not.toThrow();
  });

  it('stopBiome immer aufrufbar', async () => {
    vi.resetModules();
    const mod = await import('../SoundManager');
    expect(() => mod.SoundManager.stopBiome()).not.toThrow();
  });
});
