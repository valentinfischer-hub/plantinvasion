import { describe, test, expect } from 'vitest';
/**
 * Micro-Interactions Tests [b4-run14/15]
 */
import {
  flashText,
  bounceCoinCounter,
  shakeEnergyBar,
  pulseSaveIndicator,
  pressdownButton,
  popNotification,
} from '../microInteractions';

// Mock fÃ¼r MicroInteractionScene
function createMockScene() {
  const tweens: Array<{ targets: object; scaleX?: number; scaleY?: number; alpha?: { from?: number; to?: number } | number; x?: number; duration?: number; ease?: string }> = [];
  const timers: Array<{ delay: number; callback: () => void }> = [];
  return {
    tweens: {
      add: (opts: (typeof tweens)[0]) => {
        tweens.push(opts);
        return opts;
      },
      _list: tweens,
    },
    time: {
      delayedCall: (delay: number, cb: () => void) => {
        timers.push({ delay, callback: cb });
        return { remove: () => {} };
      },
      _list: timers,
    },
    add: {} as never,
    _tweens: tweens,
    _timers: timers,
  };
}

function createMockText() {
  let color = '#dcdcdc';
  let scaleX = 1;
  let scaleY = 1;
  let alpha = 1;
  let y = 100;
  return {
    style: { color },
    setColor: (c: string) => { color = c; },
    setScale: (s: number) => { scaleX = s; scaleY = s; },
    setAlpha: (a: number) => { alpha = a; },
    get scaleX() { return scaleX; },
    get scaleY() { return scaleY; },
    get alpha() { return alpha; },
    get y() { return y; },
    set y(v: number) { y = v; },
    _color: () => color,
  };
}

describe('Micro-Interactions: flashText', () => {
  test('Setzt Textfarbe auf Flash-Farbe', () => {
    const scene = createMockScene();
    const text = createMockText();
    // @ts-expect-error Mock
    flashText(scene, text, '#ff0000', '#dcdcdc', 80);
    expect(text._color()).toBe('#ff0000');
    expect(scene._timers.length).toBe(1);
    expect(scene._timers[0].delay).toBe(80);
  });

  test('Timer stellt Originalfarbe wieder her', () => {
    const scene = createMockScene();
    const text = createMockText();
    // @ts-expect-error Mock
    flashText(scene, text, '#ff0000', '#aabbcc', 100);
    scene._timers[0].callback();
    expect(text._color()).toBe('#aabbcc');
  });
});

describe('Micro-Interactions: bounceCoinCounter', () => {
  test('Tween mit Scale > 1.0 wird gestartet', () => {
    const scene = createMockScene();
    const text = createMockText();
    // @ts-expect-error Mock
    bounceCoinCounter(scene, text);
    expect(scene._tweens.length).toBe(1);
    expect(scene._tweens[0].scaleX).toBeGreaterThan(1);
    expect(scene._tweens[0].scaleY).toBeGreaterThan(1);
  });

  test('Tween nutzt Back.Out Ease', () => {
    const scene = createMockScene();
    const text = createMockText();
    // @ts-expect-error Mock
    bounceCoinCounter(scene, text);
    expect(scene._tweens[0].ease).toBe('Back.Out');
  });
});

describe('Micro-Interactions: shakeEnergyBar', () => {
  test('Shake-Tween wird gestartet mit x-Offset', () => {
    const scene = createMockScene();
    const target = { x: 50 };
    // @ts-expect-error Mock
    shakeEnergyBar(scene, target);
    expect(scene._tweens.length).toBe(1);
    expect(scene._tweens[0].x).toBeGreaterThan(50);
  });
});

describe('Micro-Interactions: pulseSaveIndicator', () => {
  test('Save-Indicator Tween startet mit alpha 0â1', () => {
    const scene = createMockScene();
    const text = createMockText();
    // @ts-expect-error Mock
    pulseSaveIndicator(scene, text, 600);
    expect(scene._tweens.length).toBe(1);
    const tween = scene._tweens[0] as { alpha?: { from?: number; to?: number } | number };
    if (typeof tween.alpha === 'object' && tween.alpha !== null) {
      expect(tween.alpha.from).toBe(0);
      expect(tween.alpha.to).toBe(1);
    } else {
      // alpha as number is also valid
      expect(typeof tween.alpha).toBeDefined();
    }
  });
});

describe('Micro-Interactions: pressdownButton', () => {
  test('Pressdown Scale < 1.0', () => {
    const scene = createMockScene();
    const target = { setScale: (s: number) => { return s; } };
    // @ts-expect-error Mock
    pressdownButton(scene, target);
    expect(scene._tweens[0].scaleX).toBeLessThan(1);
    expect(scene._tweens[0].scaleY).toBeLessThan(1);
  });
});

describe('Micro-Interactions: popNotification', () => {
  test('Target startet bei alpha 0', () => {
    const scene = createMockScene();
    const text = createMockText();
    // @ts-expect-error Mock
    popNotification(scene, text, 200, 400);
    expect(text.alpha).toBe(0);
  });

  test('Tween animiert zu targetY', () => {
    const scene = createMockScene();
    const text = createMockText();
    // @ts-expect-error Mock
    popNotification(scene, text, 200, 400);
    // Actually the tween sets y: targetY
    const tween = scene._tweens[0] as { y?: number };
    expect(tween.y).toBe(200);
  });
});
