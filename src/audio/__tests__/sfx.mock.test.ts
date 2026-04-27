import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Tier-3 Audio-System: AudioContext-Mock-Tests fuer sfx-Object Funktionen.
 *
 * Mock implementiert minimal AudioContext + OscillatorNode + GainNode-Interfaces
 * damit blip()-Pfad ausgefuehrt wird ohne echte Audio-Hardware.
 */

interface MockOscillator {
  type: string;
  frequency: { setValueAtTime: ReturnType<typeof vi.fn>; linearRampToValueAtTime: ReturnType<typeof vi.fn> };
  connect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
}

interface MockGain {
  gain: { setValueAtTime: ReturnType<typeof vi.fn>; exponentialRampToValueAtTime: ReturnType<typeof vi.fn> };
  connect: ReturnType<typeof vi.fn>;
}

interface MockAudioContext {
  state: string;
  currentTime: number;
  destination: object;
  resume: ReturnType<typeof vi.fn>;
  createOscillator: () => MockOscillator;
  createGain: () => MockGain;
}

function makeMockCtx(): MockAudioContext {
  return {
    state: 'running',
    currentTime: 0,
    destination: {},
    resume: vi.fn(),
    createOscillator: () => ({
      type: 'square',
      frequency: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn()
    }),
    createGain: () => ({
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn()
    })
  };
}

describe('sfx-Funktionen mit Mock-AudioContext', () => {
  let mockCtx: MockAudioContext;

  beforeEach(() => {
    mockCtx = makeMockCtx();
    // Window-Stub fuer ctx()
    (globalThis as Record<string, unknown>).window = {
      AudioContext: vi.fn(() => mockCtx)
    };
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sfx.dialogAdvance() ruft createOscillator + createGain', async () => {
    const mod = await import('../sfxGenerator');
    expect(() => mod.sfx.dialogAdvance()).not.toThrow();
  });

  it('sfx.footstep() ruft blip-Pfad', async () => {
    const mod = await import('../sfxGenerator');
    expect(() => mod.sfx.footstep()).not.toThrow();
  });

  it('sfx.dialogOpen() throw-frei', async () => {
    const mod = await import('../sfxGenerator');
    expect(() => mod.sfx.dialogOpen()).not.toThrow();
  });

  it('sfx.pickup() throw-frei', async () => {
    const mod = await import('../sfxGenerator');
    expect(() => mod.sfx.pickup()).not.toThrow();
  });

  it('sfx.bump() throw-frei', async () => {
    const mod = await import('../sfxGenerator');
    expect(() => mod.sfx.bump()).not.toThrow();
  });

  it('Default-state \'suspended\' triggert resume', async () => {
    mockCtx.state = 'suspended';
    const mod = await import('../sfxGenerator');
    mod.sfx.dialogAdvance();
    expect(mockCtx.resume).toHaveBeenCalled();
  });
});
