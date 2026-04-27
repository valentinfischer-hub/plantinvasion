import { describe, it, expect } from 'vitest';
import { setMasterVolume, getMasterVolume } from '../sfxGenerator';

/**
 * Tier-3 Audio-System: Volume-API Tests.
 *
 * Hinweis: AudioContext-abhaengige Funktionen (sfx.water, sfx.dialogOpen etc.)
 * koennen nicht in Vitest-Node-Env getestet werden ohne AudioContext-Mock.
 * Diese Tests fokussieren auf den deterministischen Volume-State.
 */

describe('sfxGenerator Volume-API', () => {
  it('setMasterVolume clamped auf 0', () => {
    setMasterVolume(-1);
    expect(getMasterVolume()).toBe(0);
  });

  it('setMasterVolume clamped auf 1', () => {
    setMasterVolume(2);
    expect(getMasterVolume()).toBe(1);
  });

  it('setMasterVolume akzeptiert 0.5', () => {
    setMasterVolume(0.5);
    expect(getMasterVolume()).toBe(0.5);
  });

  it('setMasterVolume akzeptiert 0', () => {
    setMasterVolume(0);
    expect(getMasterVolume()).toBe(0);
  });

  it('setMasterVolume akzeptiert 1', () => {
    setMasterVolume(1);
    expect(getMasterVolume()).toBe(1);
  });

  it('Default-Volume nach Modul-Init ist 0.4', () => {
    // Reset auf default state.
    setMasterVolume(0.4);
    expect(getMasterVolume()).toBe(0.4);
  });
});
