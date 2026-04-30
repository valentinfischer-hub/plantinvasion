/**
 * SoundManager - Singleton-Fassade über sfxGenerator.
 *
 * Zentralisiert Mute-Zustand, Volume-Persist und Biom-BGM.
 * Alle Scenes nutzen SoundManager statt sfxGenerator direkt.
 * sfxGenerator bleibt als Low-Level-Engine erhalten.
 *
 * S-POLISH Batch 5 Run 1
 */

import {
  setMasterVolume, getMasterVolume,
  setSfxVolume,    getSfxVolume,
  setMusicVolume,  getMusicVolume,
  getPersistedVolume,  setPersistedVolume,
  getPersistedSfxVolume,   setPersistedSfxVolume,
  getPersistedMusicVolume, setPersistedMusicVolume,
  startAmbientBGM, stopAmbientBGM,
  startAmbientBGMFadeIn, fadeOutBGM,
  setBiomeAmbience, stopBiomeAmbience,
  synthEntryStinger,
  sfx,
} from './sfxGenerator';
type Biome = 'wurzelheim' | 'verdanto' | 'kaktoria' | 'frostkamm' | 'salzbucht' | 'mordwald' | 'magmabluete';

// ---- Mute-State ----
const MUTE_KEY = 'pi_muted';

function _loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}
function _saveMuted(v: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, v ? '1' : '0');
  } catch { /* ignore */ }
}

// ---- Singleton ----
class SoundManagerClass {
  private _muted = false;

  constructor() {
    this._muted = _loadMuted();
    // Volumes aus localStorage laden
    const master = getPersistedVolume();
    const sfxVol = getPersistedSfxVolume();
    const musicVol = getPersistedMusicVolume();
    setMasterVolume(this._muted ? 0 : master);
    setSfxVolume(sfxVol);
    setMusicVolume(musicVol);
  }

  // ---- Mute ----
  get muted(): boolean { return this._muted; }

  toggleMute(): void {
    this._muted = !this._muted;
    _saveMuted(this._muted);
    setMasterVolume(this._muted ? 0 : getPersistedVolume());
  }

  setMute(v: boolean): void {
    this._muted = v;
    _saveMuted(v);
    setMasterVolume(v ? 0 : getPersistedVolume());
  }

  // ---- Volume (delegieren + persist) ----
  getMasterVolume(): number { return getMasterVolume(); }
  setMasterVolume(v: number): void {
    setPersistedVolume(v);
    if (!this._muted) setMasterVolume(v);
  }

  getSfxVolume(): number { return getSfxVolume(); }
  setSfxVolume(v: number): void {
    setPersistedSfxVolume(v);
    setSfxVolume(v);
  }

  getMusicVolume(): number { return getMusicVolume(); }
  setMusicVolume(v: number): void {
    setPersistedMusicVolume(v);
    setMusicVolume(v);
  }

  // ---- BGM ----
  startBGM(): void { if (!this._muted) startAmbientBGM(); }
  startBGMFadeIn(ms = 500): void { if (!this._muted) startAmbientBGMFadeIn(ms); }
  stopBGM(): void { stopAmbientBGM(); }
  async fadeOutBGM(ms = 500): Promise<void> { return fadeOutBGM(ms); }

  // ---- Biom-Ambience ----
  setBiome(biome: Biome | null): void { if (!this._muted) setBiomeAmbience(biome); }
  stopBiome(): void { stopBiomeAmbience(); }

  // ---- Entry-Stinger ----
  playEntryStinger(): void { if (!this._muted) synthEntryStinger(); }

  // ---- SFX-Proxy ----
  readonly sfx = sfx;
}

/** Singleton-Export */
export const SoundManager = new SoundManagerClass();
