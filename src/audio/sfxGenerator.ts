/**
 * Procedurale SFX-Engine via Web Audio API.
 * Erzeugt 8-bit-style Sounds zur Runtime ohne Audio-Files.
 * Inspired by jsfxr-Approach.
 */

let _ctx: AudioContext | null = null;

function ctx(): AudioContext {
  if (!_ctx) {
    const w = window as unknown as { AudioContext: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const AudioCtor = w.AudioContext || w.webkitAudioContext;
    _ctx = new AudioCtor();
  }
  return _ctx as AudioContext;
}

let _masterVolume = 0.4;
// S-POLISH-B2-R14: Separate SFX + Music-Lautstärke
let _sfxVolume = 1.0;   // 0..1, relativ zu _masterVolume
let _musicVolume = 1.0; // 0..1, relativ zu _masterVolume

export function setMasterVolume(v: number): void {
  _masterVolume = Math.max(0, Math.min(1, v));
}
export function getMasterVolume(): number {
  return _masterVolume;
}
export function setSfxVolume(v: number): void {
  _sfxVolume = Math.max(0, Math.min(1, v));
}
export function getSfxVolume(): number {
  return _sfxVolume;
}
export function setMusicVolume(v: number): void {
  _musicVolume = Math.max(0, Math.min(1, v));
  // Aktuell laufende BGM-Nodes live anpassen
  for (const n of _bgmNodes) {
    n.gain.gain.value = (n as { _baseVol?: number })._baseVol! * _masterVolume * _musicVolume;
  }
}
export function getMusicVolume(): number {
  return _musicVolume;
}

interface BlipOptions {
  freq: number;       // Hz
  freqEnd?: number;   // Sweep-Ende
  duration: number;   // Sekunden
  volume?: number;    // 0-1
  type?: OscillatorType;
}

function blip({ freq, freqEnd, duration, volume = 0.5, type = 'square' }: BlipOptions): void {
  try {
    const c = ctx();
    if (c.state === 'suspended') c.resume();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    if (freqEnd !== undefined) {
      osc.frequency.linearRampToValueAtTime(freqEnd, c.currentTime + duration);
    }
    gain.gain.setValueAtTime(volume * _masterVolume * _sfxVolume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + duration);
  } catch (e) {
    console.warn('[sfx] failed', e);
  }
}

export const sfx = {
  footstep(): void {
    blip({ freq: 180, freqEnd: 90, duration: 0.06, volume: 0.18, type: 'triangle' });
  },
  dialogOpen(): void {
    blip({ freq: 440, freqEnd: 880, duration: 0.12, volume: 0.3 });
  },
  dialogAdvance(): void {
    blip({ freq: 600, duration: 0.05, volume: 0.25 });
  },
  door(): void {
    blip({ freq: 220, freqEnd: 80, duration: 0.4, volume: 0.45, type: 'sine' });
    setTimeout(() => blip({ freq: 110, duration: 0.2, volume: 0.3, type: 'sine' }), 100);
  },
  bump(): void {
    blip({ freq: 80, duration: 0.08, volume: 0.3, type: 'sawtooth' });
  },
  pickup(): void {
    blip({ freq: 660, freqEnd: 990, duration: 0.1, volume: 0.4 });
    setTimeout(() => blip({ freq: 880, freqEnd: 1320, duration: 0.08, volume: 0.3 }), 80);
  },
  click(): void {
    blip({ freq: 800, duration: 0.04, volume: 0.18, type: 'square' });
  },
  /** S-POLISH Run9: Harvest-Sound - layered rustling (noise via sawtooth) + ding */
  harvest(): void {
    // Rustling: low sawtooth sweep
    blip({ freq: 120, freqEnd: 60, duration: 0.18, volume: 0.22, type: 'sawtooth' });
    // Ding: bright ping nach 100ms
    setTimeout(() => blip({ freq: 1320, freqEnd: 880, duration: 0.14, volume: 0.28, type: 'sine' }), 100);
    // Echo-Ding
    setTimeout(() => blip({ freq: 1100, freqEnd: 660, duration: 0.1, volume: 0.15, type: 'sine' }), 220);
  },
  /** S-POLISH Run9: Battle-Hit mit Pitch-Variation je Damage-Tier */
  battleHit(dmg: number): void {
    // Leicht: 80-120 DMG -> tiefer Punch
    // Mittel: 121-250 -> mittlerer Krach
    // Schwer: 251+ -> hoher Smash
    if (dmg >= 251) {
      blip({ freq: 160, freqEnd: 50, duration: 0.18, volume: 0.45, type: 'sawtooth' });
      setTimeout(() => blip({ freq: 400, freqEnd: 200, duration: 0.1, volume: 0.3, type: 'square' }), 60);
    } else if (dmg >= 121) {
      blip({ freq: 110, freqEnd: 55, duration: 0.14, volume: 0.38, type: 'square' });
    } else {
      blip({ freq: 80, duration: 0.1, volume: 0.28, type: 'sawtooth' });
    }
  },
  /** S-POLISH-B2-R6: Achievement-Jingle - aufsteigende Tonfolge */
  achievementJingle(): void {
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6 (Major-Akkord aufsteigend)
    notes.forEach((freq, i) => {
      setTimeout(() => {
        blip({ freq, freqEnd: freq * 1.05, duration: 0.18, volume: 0.35, type: 'sine' });
      }, i * 120);
    });
    // Finaler Glocken-Ton
    setTimeout(() => blip({ freq: 1568, freqEnd: 1568, duration: 0.4, volume: 0.25, type: 'sine' }), 480);
  },
  /** S-POLISH-B2-R18: Harvest-SFX — fröhlicher aufsteigender Zwei-Ton */
  harvest(): void {
    blip({ freq: 523, freqEnd: 659, duration: 0.12, volume: 0.4, type: 'sine' });
    setTimeout(() => blip({ freq: 784, freqEnd: 1046, duration: 0.15, volume: 0.35, type: 'sine' }), 100);
  }
};

/**
 * Simpler Ambient-Drone als Background-Music-Stand-In.
 * Loopt unendlich, kann gestoppt werden.
 */
let _bgmNodes: { osc: OscillatorNode; gain: GainNode; lfo: OscillatorNode; lfoGain: GainNode }[] = [];
export function startAmbientBGM(): void {
  if (_bgmNodes.length > 0) return;
  try {
    const c = ctx();
    if (c.state === 'suspended') c.resume();
    // Two-tone Drone fuer cozy-Vibe
    const tones = [
      { freq: 110, vol: 0.04, lfoFreq: 0.13, lfoDepth: 1.2 },
      { freq: 165, vol: 0.03, lfoFreq: 0.17, lfoDepth: 0.8 },
      { freq: 220, vol: 0.025, lfoFreq: 0.09, lfoDepth: 2 }
    ];
    for (const t of tones) {
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = t.freq;
      const gain = c.createGain();
      gain.gain.value = t.vol * _masterVolume * _musicVolume;
      osc.connect(gain);
      gain.connect(c.destination);
      // LFO auf Frequenz fuer leichtes Wabern
      const lfo = c.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = t.lfoFreq;
      const lfoGain = c.createGain();
      lfoGain.gain.value = t.lfoDepth;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      osc.start();
      lfo.start();
      const node = { osc, gain, lfo, lfoGain, _baseVol: t.vol };
      _bgmNodes.push(node as typeof node & { osc: OscillatorNode; gain: GainNode; lfo: OscillatorNode; lfoGain: GainNode });
    }
  } catch (e) {
    console.warn('[bgm] failed', e);
  }
}

export function stopAmbientBGM(): void {
  for (const n of _bgmNodes) {
    try {
      n.osc.stop();
      n.lfo.stop();
    } catch {}
  }
  _bgmNodes = [];
}

// ---- S-POLISH-B2-R14: Biome-Ambience ----
// Biom-spezifische Ton-Signatur via procedurale Töne
type Biome = 'wurzelheim' | 'verdanto' | 'kaktoria' | 'frostkamm' | 'salzbucht' | 'mordwald' | 'magmabluete';

let _currentBiome: Biome | null = null;

const BIOME_TONES: Record<Biome, { freq: number; vol: number; type: OscillatorType; lfoFreq: number }[]> = {
  wurzelheim: [
    { freq: 130, vol: 0.025, type: 'sine', lfoFreq: 0.08 },
    { freq: 196, vol: 0.018, type: 'sine', lfoFreq: 0.12 }
  ],
  verdanto: [
    { freq: 174, vol: 0.022, type: 'sine', lfoFreq: 0.15 },
    { freq: 220, vol: 0.016, type: 'sine', lfoFreq: 0.10 }
  ],
  kaktoria: [
    { freq: 220, vol: 0.020, type: 'sawtooth', lfoFreq: 0.06 },
    { freq: 330, vol: 0.012, type: 'sine', lfoFreq: 0.20 }
  ],
  frostkamm: [
    { freq: 196, vol: 0.018, type: 'sine', lfoFreq: 0.05 },
    { freq: 294, vol: 0.012, type: 'sine', lfoFreq: 0.07 }
  ],
  salzbucht: [
    { freq: 147, vol: 0.025, type: 'sine', lfoFreq: 0.18 },
    { freq: 220, vol: 0.020, type: 'sine', lfoFreq: 0.25 }
  ],
  mordwald: [
    { freq: 110, vol: 0.030, type: 'sine', lfoFreq: 0.04 },
    { freq: 165, vol: 0.018, type: 'triangle', lfoFreq: 0.06 }
  ],
  magmabluete: [
    { freq: 98, vol: 0.028, type: 'sawtooth', lfoFreq: 0.08 },
    { freq: 147, vol: 0.022, type: 'sine', lfoFreq: 0.11 }
  ]
};

let _biomeNodes: { osc: OscillatorNode; gain: GainNode; lfo: OscillatorNode; lfoGain: GainNode }[] = [];

/** Wechselt Biom-Ambience mit sanftem Crossfade (500ms). */
export function setBiomeAmbience(biome: Biome | null): void {
  if (_currentBiome === biome) return;
  _currentBiome = biome;
  // Stop alte Biome-Nodes
  for (const n of _biomeNodes) {
    try { n.osc.stop(); n.lfo.stop(); } catch {}
  }
  _biomeNodes = [];
  if (!biome) return;
  const tones = BIOME_TONES[biome];
  if (!tones) return;
  try {
    const c = ctx();
    if (c.state === 'suspended') c.resume();
    for (const t of tones) {
      const osc = c.createOscillator();
      osc.type = t.type;
      osc.frequency.value = t.freq;
      const gain = c.createGain();
      gain.gain.setValueAtTime(0, c.currentTime);
      // Fade in
      gain.gain.linearRampToValueAtTime(t.vol * _masterVolume * _musicVolume, c.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(c.destination);
      const lfo = c.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = t.lfoFreq;
      const lfoGain = c.createGain();
      lfoGain.gain.value = 1.5;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      osc.start();
      lfo.start();
      _biomeNodes.push({ osc, gain, lfo, lfoGain });
    }
  } catch {
    // Audio nicht verfügbar
  }
}

export function stopBiomeAmbience(): void {
  _currentBiome = null;
  for (const n of _biomeNodes) {
    try { n.osc.stop(); n.lfo.stop(); } catch {}
  }
  _biomeNodes = [];
}

// Volume-Persist-Keys fuer SFX + Music
const SFX_VOL_KEY = 'pi_sfx_volume';
const MUSIC_VOL_KEY = 'pi_music_volume';
export function getPersistedSfxVolume(): number {
  try {
    const raw = localStorage.getItem(SFX_VOL_KEY);
    return raw === null ? 1.0 : Math.max(0, Math.min(1, parseFloat(raw) || 1.0));
  } catch { return 1.0; }
}
export function setPersistedSfxVolume(v: number): void {
  try { localStorage.setItem(SFX_VOL_KEY, String(v)); } catch {}
}
export function getPersistedMusicVolume(): number {
  try {
    const raw = localStorage.getItem(MUSIC_VOL_KEY);
    return raw === null ? 1.0 : Math.max(0, Math.min(1, parseFloat(raw) || 1.0));
  } catch { return 1.0; }
}
export function setPersistedMusicVolume(v: number): void {
  try { localStorage.setItem(MUSIC_VOL_KEY, String(v)); } catch {}
}

// ============================================================
// feat(s-polish-start-19): Volume-Persist + Entry-Stinger + BGM-Crossfade
// ============================================================

const VOLUME_STORAGE_KEY = 'pi_bgm_volume';

/** Persistierten Volume-Wert aus localStorage lesen (Default: 0.7). */
export function getPersistedVolume(): number {
  try {
    const raw = localStorage.getItem(VOLUME_STORAGE_KEY);
    if (raw === null) return 0.7;
    const parsed = parseFloat(raw);
    return isNaN(parsed) ? 0.7 : Math.max(0, Math.min(1, parsed));
  } catch {
    return 0.7;
  }
}

/** Aktuellen Volume-Wert in localStorage schreiben. */
export function setPersistedVolume(v: number): void {
  try {
    localStorage.setItem(VOLUME_STORAGE_KEY, String(Math.max(0, Math.min(1, v))));
  } catch {
    // Private-Browsing oder Storage-Quota: silent fail
  }
}

/** Flag damit Stinger nur beim ersten Page-Load gespielt wird. */
let _stingerPlayed = false;

/**
 * Synthetischer Entry-Stinger: 4 Toene aufsteigend C4-E4-G4-C5 (je 200ms, sine-wave).
 * Spielt nur einmal pro Page-Session (wird durch _stingerPlayed geblockt).
 */
export function synthEntryStinger(): void {
  if (_stingerPlayed) return;
  _stingerPlayed = true;
  // C4=261.63Hz  E4=329.63Hz  G4=392.00Hz  C5=523.25Hz
  const notes = [261.63, 329.63, 392.0, 523.25];
  notes.forEach((freq, i) => {
    setTimeout(() => {
      blip({ freq, duration: 0.18, volume: 0.32, type: 'sine' });
    }, i * 200);
  });
}

/**
 * BGM sanft ausfaden (Standard 500ms) und danach stoppen.
 * Gibt ein Promise zurueck das nach dem Fade-out resolved.
 */
export function fadeOutBGM(durationMs = 500): Promise<void> {
  return new Promise((resolve) => {
    if (_bgmNodes.length === 0) {
      resolve();
      return;
    }
    try {
      const c = ctx();
      const endTime = c.currentTime + durationMs / 1000;
      for (const n of _bgmNodes) {
        n.gain.gain.cancelScheduledValues(c.currentTime);
        n.gain.gain.setValueAtTime(Math.max(0.0001, n.gain.gain.value), c.currentTime);
        n.gain.gain.linearRampToValueAtTime(0.0001, endTime);
      }
    } catch (e) {
      console.warn('[bgm] fadeOut failed', e);
    }
    setTimeout(() => {
      stopAmbientBGM();
      resolve();
    }, durationMs + 40);
  });
}

/**
 * BGM starten mit sanftem Einfaden (Standard 500ms).
 * Startet nur wenn aktuell kein BGM laeuft.
 */
export function startAmbientBGMFadeIn(durationMs = 500): void {
  if (_bgmNodes.length > 0) return;
  startAmbientBGM();
  try {
    const c = ctx();
    const endTime = c.currentTime + durationMs / 1000;
    for (const n of _bgmNodes) {
      const target = n.gain.gain.value;
      n.gain.gain.setValueAtTime(0.0001, c.currentTime);
      n.gain.gain.linearRampToValueAtTime(target, endTime);
    }
  } catch (e) {
    console.warn('[bgm] fadeIn failed', e);
  }
}
