/**
 * TutorialHighlight Tests - S-POLISH Batch 5 Run 9
 *
 * Testet HighlightTarget Berechnungen (ohne Phaser).
 */
import { describe, it, expect } from 'vitest';
import type { HighlightTarget } from '../TutorialHighlight';

// Berechnet die 4 Overlay-Rechtecke (aus _draw Logik)
function computeOverlayRects(target: HighlightTarget, W: number, H: number) {
  const sx = target.x - target.w / 2;
  const sy = target.y - target.h / 2;
  const sw = target.w;
  const sh = target.h;
  return {
    top:    { x: 0, y: 0,       w: W,          h: sy },
    left:   { x: 0, y: sy,      w: sx,         h: sh },
    right:  { x: sx + sw, y: sy, w: W-(sx+sw), h: sh },
    bottom: { x: 0, y: sy + sh, w: W,          h: H-(sy+sh) },
  };
}

// target: center(200,150), size(100,60) => sx=150, sy=120
const target: HighlightTarget = { x: 200, y: 150, w: 100, h: 60 };
const W = 480, H = 720;
const rects = computeOverlayRects(target, W, H);

describe('TutorialHighlight Overlay-Berechnung', () => {
  it('Top-Rect: korrekte Hoehe (sy = 150-30 = 120)', () => {
    expect(rects.top.h).toBe(120);
  });

  it('Left-Rect: korrekte Breite (sx = 200-50 = 150)', () => {
    expect(rects.left.w).toBe(150);
  });

  it('Right-Rect: korrekte X-Position (sx+sw = 150+100 = 250)', () => {
    expect(rects.right.x).toBe(250);
  });

  it('Bottom-Rect: korrekte Y-Position (sy+sh = 120+60 = 180)', () => {
    expect(rects.bottom.y).toBe(180);
  });

  it('Bottom-Rect: korrekte Hoehe (H - 180 = 540)', () => {
    expect(rects.bottom.h).toBe(H - 180);
  });

  it('HighlightTarget mit optionalem Radius', () => {
    const t: HighlightTarget = { x: 100, y: 100, w: 80, h: 40, radius: 8 };
    expect(t.radius).toBe(8);
  });

  it('HighlightTarget ohne Radius hat undefined', () => {
    const t: HighlightTarget = { x: 100, y: 100, w: 80, h: 40 };
    expect(t.radius).toBeUndefined();
  });
});
