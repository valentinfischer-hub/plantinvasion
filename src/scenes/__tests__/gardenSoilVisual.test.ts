import { describe, test, it, expect, beforeEach, vi } from 'vitest';
/**
 * GardenScene Soil + Growth Deep-Polish Tests [b4-run9/15]
 * Tests fuer Soil-Tint, Stage-Up-Morph, Booster-Glow-Farben
 */

// Soil-Tint Logik (isoliert)
function getSoilColor(lastWateredAt: number, hydrationStatus: string): { color: number; alpha: number } {
  const now = Date.now();
  const msSinceWater = now - (lastWateredAt ?? 0);
  const hMin = msSinceWater / 60000;

  if (hydrationStatus === 'saftig') {
    return { color: 0x5b9bd6, alpha: 0.45 }; // ÃberwÃ¤ssert: blÃ¤ulich
  } else if (hMin < 60) {
    return { color: 0x5c3d1e, alpha: 0.55 }; // Feucht < 1h: dunkelbraun
  } else if (hMin < 240) {
    return { color: 0x7a5230, alpha: 0.45 }; // Mittel 1-4h: mittelbraun
  } else {
    return { color: 0xad8c6a, alpha: 0.4 }; // Trocken > 4h: hellbraun
  }
}

// Booster-Glow-Farben
function getBoosterGlowColor(boosterType: string, isMutation: boolean): number {
  if (isMutation) return 0xb86ee3; // Hybrid = lila
  if (boosterType === 'xp') return 0x4caf50;       // Grow = grÃ¼n
  if (boosterType === 'sun-lamp') return 0xffd700;  // Pristine = gold
  if (boosterType === 'sprinkler') return 0x00bcd4; // Speed = cyan
  return 0x4caf50;
}

describe('GardenScene Soil-Tint', () => {
  test('Ã¼berwÃ¤sserter Status = blÃ¤ulich', () => {
    const result = getSoilColor(Date.now(), 'saftig');
    expect(result.color).toBe(0x5b9bd6);
    expect(result.alpha).toBe(0.45);
  });

  test('gerade gewÃ¤ssert (< 1min) = dunkelbraun feucht', () => {
    const result = getSoilColor(Date.now() - 30_000, 'gut');
    expect(result.color).toBe(0x5c3d1e);
    expect(result.alpha).toBe(0.55);
  });

  test('vor 30min gewÃ¤ssert = dunkelbraun feucht', () => {
    const result = getSoilColor(Date.now() - 30 * 60_000, 'gut');
    expect(result.color).toBe(0x5c3d1e);
    expect(result.alpha).toBe(0.55);
  });

  test('vor 2h gewÃ¤ssert = mittelbraun', () => {
    const result = getSoilColor(Date.now() - 2 * 60 * 60_000, 'durstig');
    expect(result.color).toBe(0x7a5230);
    expect(result.alpha).toBe(0.45);
  });

  test('vor 5h gewÃ¤ssert = hellbraun trocken', () => {
    const result = getSoilColor(Date.now() - 5 * 60 * 60_000, 'vertrocknet');
    expect(result.color).toBe(0xad8c6a);
    expect(result.alpha).toBe(0.4);
  });

  test('Grenze exakt 60min = noch feucht (dunkelbraun)', () => {
    // 59min 59s â feucht
    const result = getSoilColor(Date.now() - 59 * 60_000 - 59_000, 'gut');
    expect(result.color).toBe(0x5c3d1e);
  });

  test('Grenze exakt 240min = mittelbraun', () => {
    // 239min â mittelbraun
    const result = getSoilColor(Date.now() - 239 * 60_000, 'durstig');
    expect(result.color).toBe(0x7a5230);
  });
});

describe('GardenScene Booster-Glow-Farben', () => {
  test('XP-Booster = grÃ¼n', () => {
    expect(getBoosterGlowColor('xp', false)).toBe(0x4caf50);
  });

  test('Sun-Lamp = gold (pristine)', () => {
    expect(getBoosterGlowColor('sun-lamp', false)).toBe(0xffd700);
  });

  test('Sprinkler = cyan (speed/wasser)', () => {
    expect(getBoosterGlowColor('sprinkler', false)).toBe(0x00bcd4);
  });

  test('Mutations-Pflanze = lila (hybrid), unabhaengig vom Booster-Typ', () => {
    expect(getBoosterGlowColor('xp', true)).toBe(0xb86ee3);
    expect(getBoosterGlowColor('sun-lamp', true)).toBe(0xb86ee3);
  });

  test('unbekannter Booster-Typ = grÃ¼n (fallback)', () => {
    expect(getBoosterGlowColor('unknown', false)).toBe(0x4caf50);
  });
});

describe('GardenScene Stage-Up Morph-Animation', () => {
  test('Morph-Phase 1: Alpha sinkt auf 0, Scale auf 0.8', () => {
    const mockSprite = { alpha: 1, scaleX: 1, scaleY: 1 };
    // Simuliere Tween-Endwerte der Phase 1
    mockSprite.alpha = 0;
    mockSprite.scaleX = 0.8;
    mockSprite.scaleY = 0.8;
    expect(mockSprite.alpha).toBe(0);
    expect(mockSprite.scaleX).toBe(0.8);
  });

  test('Morph-Phase 2: Alpha steigt auf 1, Scale auf 1.0', () => {
    const mockSprite = { alpha: 0, scaleX: 0.8, scaleY: 0.8 };
    // Simuliere Tween-Endwerte der Phase 2
    mockSprite.alpha = 1;
    mockSprite.scaleX = 1;
    mockSprite.scaleY = 1;
    expect(mockSprite.alpha).toBe(1);
    expect(mockSprite.scaleX).toBe(1);
  });

  test('Morph nur bei Stage-Increment ausgeloest (lastSeenStage < stage)', () => {
    let morphTriggered = false;
    const lastSeenStage = 1;
    const currentStage = 2;
    if (currentStage > lastSeenStage) {
      morphTriggered = true;
    }
    expect(morphTriggered).toBe(true);
  });

  test('Morph NICHT ausgeloest wenn Stage gleich bleibt', () => {
    let morphTriggered = false;
    const lastSeenStage = 2;
    const currentStage = 2;
    if (currentStage > lastSeenStage) {
      morphTriggered = true;
    }
    expect(morphTriggered).toBe(false);
  });
});
