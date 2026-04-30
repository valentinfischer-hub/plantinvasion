import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { showToast, _resetActiveToastForTest, type ToastType } from '../Toast';

interface MockScene {
  scale: { width: number; height: number };
  add: { text: (x: number, y: number, t: string, s: unknown) => MockText };
  tweens: { add: (cfg: { targets: unknown; alpha: number; duration: number; delay: number; onComplete: () => void }) => void };
}

interface MockText {
  scene: MockScene;
  active: boolean;
  setOrigin: () => MockText;
  setDepth: () => MockText;
  setScrollFactor: () => MockText;
  setScale: () => MockText;
  setAlpha: () => MockText;
  setResolution: () => MockText;
  destroy: () => void;
}

function makeScene(): MockScene {
  const scene: MockScene = {
    scale: { width: 720, height: 540 },
    add: {
      text: vi.fn((x, y, t, style) => {
        void x; void y; void t; void style;
        const text: MockText = {
          scene,
          active: true,
          setOrigin: () => text,
          setDepth: () => text,
          setScrollFactor: () => text,
          setScale: () => text,
          setAlpha: () => text,
          setResolution: () => text,
          destroy: () => { text.active = false; }
        };
        return text;
      })
    },
    tweens: {
      add: vi.fn((cfg) => { cfg.onComplete?.(); })
    }
  };
  return scene;
}

beforeEach(() => { _resetActiveToastForTest(); });
afterEach(() => { vi.restoreAllMocks(); });

describe('showToast Type-Mapping', () => {
  it('success -> #9be36e', () => {
    const scene = makeScene();
    showToast(scene as unknown as Parameters<typeof showToast>[0], 'OK', 'success');
    const call = (scene.add.text as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[3]).toMatchObject({ color: '#9be36e' });
  });
  it('error -> #ff7e7e', () => {
    const scene = makeScene();
    showToast(scene as unknown as Parameters<typeof showToast>[0], 'Err', 'error');
    expect((scene.add.text as ReturnType<typeof vi.fn>).mock.calls[0][3]).toMatchObject({ color: '#ff7e7e' });
  });
  it('reward -> #fcd95c', () => {
    const scene = makeScene();
    showToast(scene as unknown as Parameters<typeof showToast>[0], 'R', 'reward');
    expect((scene.add.text as ReturnType<typeof vi.fn>).mock.calls[0][3]).toMatchObject({ color: '#fcd95c' });
  });
  it('mutation -> #b86ee3', () => {
    const scene = makeScene();
    showToast(scene as unknown as Parameters<typeof showToast>[0], 'M', 'mutation');
    expect((scene.add.text as ReturnType<typeof vi.fn>).mock.calls[0][3]).toMatchObject({ color: '#b86ee3' });
  });
  it('info -> #8eaedd', () => {
    const scene = makeScene();
    showToast(scene as unknown as Parameters<typeof showToast>[0], 'I', 'info');
    expect((scene.add.text as ReturnType<typeof vi.fn>).mock.calls[0][3]).toMatchObject({ color: '#8eaedd' });
  });
});

describe('showToast Konsistenz-Pflichten', () => {
  it('einheitlicher #1a1f1a Background', () => {
    const scene = makeScene();
    showToast(scene as unknown as Parameters<typeof showToast>[0], 'm', 'info');
    expect((scene.add.text as ReturnType<typeof vi.fn>).mock.calls[0][3].backgroundColor).toMatch(/^#1a1f1a/);
  });
  it('14px monospace', () => {
    const scene = makeScene();
    showToast(scene as unknown as Parameters<typeof showToast>[0], 'm', 'info');
    expect((scene.add.text as ReturnType<typeof vi.fn>).mock.calls[0][3]).toMatchObject({ fontFamily: 'monospace', fontSize: '14px' });
  });
  it('10x6 Padding', () => {
    const scene = makeScene();
    showToast(scene as unknown as Parameters<typeof showToast>[0], 'm', 'info');
    expect((scene.add.text as ReturnType<typeof vi.fn>).mock.calls[0][3]).toMatchObject({ padding: { x: 10, y: 6 } });
  });
});

describe('showToast Cache + Optionen', () => {
  it('Doppel-Toast destroyed alten', () => {
    const scene = makeScene();
    const first = showToast(scene as unknown as Parameters<typeof showToast>[0], 'a', 'info');
    showToast(scene as unknown as Parameters<typeof showToast>[0], 'b', 'info');
    expect((first as unknown as MockText).active).toBe(false);
  });
  it('alle 5 ToastTypes throw-frei', () => {
    const scene = makeScene();
    const types: ToastType[] = ['success', 'error', 'info', 'reward', 'mutation'];
    types.forEach((t) => {
      expect(() => showToast(scene as unknown as Parameters<typeof showToast>[0], 'x', t)).not.toThrow();
    });
  });
  it('custom duration', () => {
    const scene = makeScene();
    showToast(scene as unknown as Parameters<typeof showToast>[0], 'x', 'info', { duration: 5000 });
    // calls[0] = Entrance-Tween (200ms), calls[1] = Fade-Out-Tween (custom duration)
    expect((scene.tweens.add as ReturnType<typeof vi.fn>).mock.calls[1][0].duration).toBe(5000);
  });
  it('custom delay', () => {
    const scene = makeScene();
    showToast(scene as unknown as Parameters<typeof showToast>[0], 'x', 'info', { delay: 1500 });
    // calls[0] = Entrance-Tween, calls[1] = Fade-Out-Tween (delay = opts.delay + 200)
    expect((scene.tweens.add as ReturnType<typeof vi.fn>).mock.calls[1][0].delay).toBe(1700);
  });
});

describe('showToast V0.2 erweiterte Optionen', () => {
  it('respektiert custom fontSize', () => {
    const scene = makeScene();
    showToast(scene as unknown as Parameters<typeof showToast>[0], 'header', 'success', { fontSize: '18px' });
    expect((scene.add.text as ReturnType<typeof vi.fn>).mock.calls[0][3]).toMatchObject({ fontSize: '18px' });
  });
  it('respektiert custom padding', () => {
    const scene = makeScene();
    showToast(scene as unknown as Parameters<typeof showToast>[0], 'pad', 'info', { padding: { x: 14, y: 8 } });
    expect((scene.add.text as ReturnType<typeof vi.fn>).mock.calls[0][3]).toMatchObject({ padding: { x: 14, y: 8 } });
  });
  it('respektiert yAbsolute statt yOffset', () => {
    const scene = makeScene();
    showToast(scene as unknown as Parameters<typeof showToast>[0], 'top', 'info', { yAbsolute: 36 });
    const call = (scene.add.text as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[1]).toBe(36); // y-coord ohne zoom = 36
  });
  it('cameraZoom skaliert yAbsolute', () => {
    const scene = makeScene();
    showToast(scene as unknown as Parameters<typeof showToast>[0], 'zoom', 'info', { yAbsolute: 100, cameraZoom: 2 });
    const call = (scene.add.text as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[1]).toBe(50); // 100/2
  });
});
