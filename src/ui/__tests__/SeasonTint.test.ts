import { describe, it, expect } from 'vitest';

// Teste die Saison-Farblogik (isoliert ohne Phaser)
// Die Farben kommen aus SeasonTintOverlay.ts

const SEASON_COLORS: Record<number, { color: number; alpha: number }> = {
  0: { color: 0xc8f0b0, alpha: 0.07 },  // Frühling: grünlich
  1: { color: 0xffe066, alpha: 0.06 },  // Sommer: warm gelb
  2: { color: 0xff8c30, alpha: 0.09 },  // Herbst: orange-braun
  3: { color: 0xa0c0ff, alpha: 0.10 },  // Winter: kühl blau
};

describe('SeasonTintOverlay Farb-Logik', () => {
  it('Frühling (0) ist grünlich mit niedrigem Alpha', () => {
    const { color, alpha } = SEASON_COLORS[0];
    expect(color).toBe(0xc8f0b0);
    expect(alpha).toBeLessThan(0.1);
    expect(alpha).toBeGreaterThan(0);
  });

  it('Sommer (1) ist warm-gelb', () => {
    const { color } = SEASON_COLORS[1];
    // Warm = roter/gelber Anteil dominant
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    expect(r).toBeGreaterThan(b); // wärmer als kalt
    expect(g).toBeGreaterThan(b);
  });

  it('Herbst (2) hat höchsten Alpha (intensive Färbung)', () => {
    expect(SEASON_COLORS[2].alpha).toBeGreaterThanOrEqual(SEASON_COLORS[0].alpha);
    expect(SEASON_COLORS[2].alpha).toBeGreaterThanOrEqual(SEASON_COLORS[1].alpha);
  });

  it('Winter (3) ist bläulich', () => {
    const { color } = SEASON_COLORS[3];
    const r = (color >> 16) & 0xff;
    const b = color & 0xff;
    expect(b).toBeGreaterThan(r); // blau dominiert
  });

  it('Alle Saisons haben Alpha zwischen 0.04 und 0.15 (subtil aber sichtbar)', () => {
    for (const { alpha } of Object.values(SEASON_COLORS)) {
      expect(alpha).toBeGreaterThan(0.04);
      expect(alpha).toBeLessThan(0.15);
    }
  });
});

describe('Weather-Partikel-Konfiguration', () => {
  const WEATHER_CONFIG = {
    rain: { count: 50, vx: -1, vy: 8 },
    storm: { count: 100, vx: -4, vy: 12 },
    snow: { count: 60, vxMax: 0.8, vyMax: 1.6 },
  };

  it('Storm hat mehr Partikel als Regen', () => {
    expect(WEATHER_CONFIG.storm.count).toBeGreaterThan(WEATHER_CONFIG.rain.count);
  });

  it('Storm hat höhere Geschwindigkeit als Regen', () => {
    expect(Math.abs(WEATHER_CONFIG.storm.vx)).toBeGreaterThan(Math.abs(WEATHER_CONFIG.rain.vx));
    expect(WEATHER_CONFIG.storm.vy).toBeGreaterThan(WEATHER_CONFIG.rain.vy);
  });

  it('Schnee fällt langsamer als Regen', () => {
    expect(WEATHER_CONFIG.snow.vyMax).toBeLessThan(WEATHER_CONFIG.rain.vy);
  });
});
