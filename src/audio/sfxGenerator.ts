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
export function setMasterVolume(v: number): void {
  _masterVolume = Math.max(0, Math.min(1, v));
}
export function getMasterVolume(): number {
  return _masterVolume;
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
    gain.gain.setValueAtTime(volume * _masterVolume, c.currentTime);
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
      gain.gain.value = t.vol * _masterVolume;
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
      _bgmNodes.push({ osc, gain, lfo, lfoGain });
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
