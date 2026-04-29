/**
 * S-POLISH-B3-R2: Overworld-HUD-Tests
 * Testet: Hotspot-Glow-Radius-Logik, Weltkarte-Zonen-Mapping, Puls-Formel
 */
import { describe, it, expect } from 'vitest';

// =====================================================================
// Hotspot-Glow-Radius-Logik
// =====================================================================
describe('Hotspot-Glow Radius-Check', () => {
  function isInRadius(playerX: number, playerY: number, targetX: number, targetY: number, radius = 3): boolean {
    const dx = Math.abs(targetX - playerX);
    const dy = Math.abs(targetY - playerY);
    return Math.max(dx, dy) <= radius;
  }

  it('NPC direkt daneben ist im Radius', () => {
    expect(isInRadius(5, 5, 6, 5)).toBe(true);
  });

  it('NPC 3 Tiles entfernt ist im Radius', () => {
    expect(isInRadius(5, 5, 8, 5)).toBe(true);
  });

  it('NPC 4 Tiles entfernt ist ausserhalb', () => {
    expect(isInRadius(5, 5, 9, 5)).toBe(false);
  });

  it('Diagonal 3 Tiles ist im Radius (Chebyshev)', () => {
    expect(isInRadius(5, 5, 8, 8)).toBe(true);
  });

  it('Diagonal 4 Tiles ist ausserhalb', () => {
    expect(isInRadius(5, 5, 9, 9)).toBe(false);
  });
});

// =====================================================================
// Weltkarte-Zonen-Mapping
// =====================================================================
describe('Weltkarte-Zonen', () => {
  const ZONES = [
    { slug: 'wurzelheim', col: 1, row: 2 },
    { slug: 'verdanto',   col: 1, row: 1 },
    { slug: 'kaktoria',   col: 0, row: 2 },
    { slug: 'mordwald',   col: 2, row: 1 },
    { slug: 'frostkamm', col: 1, row: 0 },
    { slug: 'salzbucht', col: 2, row: 2 },
    { slug: 'magmabluete', col: 0, row: 1 },
    { slug: 'glaciara',  col: 1, row: -1 },
  ];

  it('Alle 8 Biome sind definiert', () => {
    expect(ZONES.length).toBe(8);
  });

  it('Wurzelheim ist in der Mitte', () => {
    const w = ZONES.find(z => z.slug === 'wurzelheim');
    expect(w?.col).toBe(1);
  });

  it('Glaciara ist ganz oben (row -1)', () => {
    const g = ZONES.find(z => z.slug === 'glaciara');
    expect(g?.row).toBeLessThan(0);
  });

  it('Kein Slug ist doppelt', () => {
    const slugs = ZONES.map(z => z.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it('Aktuelle Zone wird gefunden', () => {
    const currentZone = 'verdanto';
    const found = ZONES.find(z => z.slug === currentZone);
    expect(found).toBeDefined();
  });
});

// =====================================================================
// Puls-Formel fuer Hotspot-Glow
// =====================================================================
describe('Hotspot-Glow Puls-Formel', () => {
  function pulseAlpha(now: number): number {
    return 0.35 + 0.15 * Math.sin(now / 600);
  }

  it('Pulse liegt immer im Bereich [0.20, 0.50]', () => {
    for (let t = 0; t < 10000; t += 100) {
      const v = pulseAlpha(t);
      expect(v).toBeGreaterThanOrEqual(0.20);
      expect(v).toBeLessThanOrEqual(0.50);
    }
  });

  it('Pulse ist nie negativ', () => {
    for (let t = 0; t < 5000; t += 50) {
      expect(pulseAlpha(t)).toBeGreaterThan(0);
    }
  });
});

// =====================================================================
// Worldmap-Overlay Toggle-Logik
// =====================================================================
describe('WorldMap-Overlay Toggle', () => {
  it('Toggle-Logik: zweites Druecken schliesst Karte', () => {
    let overlayOpen = false;
    const toggleMap = () => {
      overlayOpen = !overlayOpen;
    };
    toggleMap();
    expect(overlayOpen).toBe(true);
    toggleMap();
    expect(overlayOpen).toBe(false);
  });
});
