import { describe, it, expect } from 'vitest';
import {
  MODAL_BG_COLOR,
  MODAL_BG_ALPHA,
  MODAL_BORDER_COLOR,
  MODAL_BORDER_ALPHA,
  MODAL_CORNER_RADIUS,
  COLOR_SUCCESS,
  COLOR_ERROR,
  COLOR_REWARD,
  COLOR_MUTATION,
  COLOR_INFO,
  FONT_FAMILY,
  drawModalBox
} from '../uiTheme';

describe('uiTheme Konsistenz-Pflichten', () => {
  it('MODAL_BG_COLOR ist Plantinvasion-Dark', () => {
    expect(MODAL_BG_COLOR).toBe(0x1a1f1a);
  });
  it('MODAL_BG_ALPHA ist 0.96 (Modal) statt 0.95 (Overlay)', () => {
    expect(MODAL_BG_ALPHA).toBe(0.96);
  });
  it('MODAL_BORDER_COLOR ist Brand-Green', () => {
    expect(MODAL_BORDER_COLOR).toBe(0x9be36e);
  });
  it('MODAL_BORDER_ALPHA ist 0.8', () => {
    expect(MODAL_BORDER_ALPHA).toBe(0.8);
  });
  it('MODAL_CORNER_RADIUS ist 8 (matcht GardenScene-Bestand)', () => {
    expect(MODAL_CORNER_RADIUS).toBe(8);
  });
});

describe('uiTheme Color-Token-Match zu Toast.ts', () => {
  it('COLOR_SUCCESS ist gruen wie Toast success', () => {
    expect(COLOR_SUCCESS).toBe('#9be36e');
  });
  it('COLOR_ERROR ist rot wie Toast error', () => {
    expect(COLOR_ERROR).toBe('#ff7e7e');
  });
  it('COLOR_REWARD ist gold wie Toast reward', () => {
    expect(COLOR_REWARD).toBe('#fcd95c');
  });
  it('COLOR_MUTATION ist lila wie Toast mutation', () => {
    expect(COLOR_MUTATION).toBe('#b86ee3');
  });
  it('COLOR_INFO ist blau wie Toast info', () => {
    expect(COLOR_INFO).toBe('#8eaedd');
  });
});

describe('uiTheme Font-Konvention', () => {
  it('FONT_FAMILY ist monospace fuer Pixel-Look', () => {
    expect(FONT_FAMILY).toBe('monospace');
  });
});

describe('drawModalBox Helper', () => {
  it('ruft fillStyle und strokeRoundedRect mit korrekten Parametern', () => {
    const calls: Array<{ method: string; args: unknown[] }> = [];
    const fakeG = {
      fillStyle: (...args: unknown[]) => { calls.push({ method: 'fillStyle', args }); return fakeG; },
      fillRoundedRect: (...args: unknown[]) => { calls.push({ method: 'fillRoundedRect', args }); return fakeG; },
      lineStyle: (...args: unknown[]) => { calls.push({ method: 'lineStyle', args }); return fakeG; },
      strokeRoundedRect: (...args: unknown[]) => { calls.push({ method: 'strokeRoundedRect', args }); return fakeG; }
    };
    drawModalBox(fakeG as unknown as Parameters<typeof drawModalBox>[0], { width: 320, height: 240 });
    expect(calls).toHaveLength(4);
    expect(calls[0]).toEqual({ method: 'fillStyle', args: [MODAL_BG_COLOR, MODAL_BG_ALPHA] });
    expect(calls[1].method).toBe('fillRoundedRect');
    expect(calls[1].args).toEqual([-160, -120, 320, 240, MODAL_CORNER_RADIUS]);
    expect(calls[2]).toEqual({ method: 'lineStyle', args: [2, MODAL_BORDER_COLOR, MODAL_BORDER_ALPHA] });
  });

  it('akzeptiert custom borderColor (z.B. Mutations-Lila)', () => {
    let lineCall: unknown[] = [];
    const fakeG = {
      fillStyle: () => fakeG,
      fillRoundedRect: () => fakeG,
      lineStyle: (...args: unknown[]) => { lineCall = args; return fakeG; },
      strokeRoundedRect: () => fakeG
    };
    drawModalBox(fakeG as unknown as Parameters<typeof drawModalBox>[0], {
      width: 100, height: 100, borderColor: 0xb86ee3
    });
    expect(lineCall[1]).toBe(0xb86ee3);
  });
});
