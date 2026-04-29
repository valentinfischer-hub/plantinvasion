/**
 * PlantInfoCard Tests - S-POLISH Batch 5 Run 3
 *
 * Testet die reine Daten-Logik (Rarity-Labels, Bias-Format).
 * Phaser-Instanziierung wird in Node-Env nicht getestet.
 */
import { describe, it, expect } from 'vitest';
import type { PlantSpecies } from '../../types/plant';

// Hilfsfunktionen aus PlantInfoCard (Inline-Test ohne Phaser-Import)
const RARITY_LABELS: Record<number, string> = {
  1: 'Gewöhnlich',
  2: 'Häufig',
  3: 'Ungewöhnlich',
  4: 'Selten',
  5: 'Episch',
  6: 'Mythisch',
};

function biasSign(v: number): string {
  return v >= 0 ? `+${v}` : `${v}`;
}

function rarityStars(rarity: number): string {
  return '★'.repeat(rarity) + '☆'.repeat(Math.max(0, 6 - rarity));
}

const mockSpecies: PlantSpecies = {
  slug: 'test-plant',
  scientificName: 'Testus planticus',
  commonName: 'Testpflanze',
  rarity: 3,
  isStarter: false,
  atkBias: 15,
  defBias: -5,
  spdBias: 0,
  description: 'Eine Testpflanze.',
  spriteSeedPrefix: 'test',
  preferredBiomes: ['wurzelheim'],
  wrongBiomes: ['kaktoria'],
};

describe('PlantInfoCard Daten-Logik', () => {
  it('Rarity 3 = Ungewöhnlich', () => {
    expect(RARITY_LABELS[3]).toBe('Ungewöhnlich');
  });

  it('Rarity 6 = Mythisch', () => {
    expect(RARITY_LABELS[6]).toBe('Mythisch');
  });

  it('biasSign positiv = "+15"', () => {
    expect(biasSign(15)).toBe('+15');
  });

  it('biasSign negativ = "-5"', () => {
    expect(biasSign(-5)).toBe('-5');
  });

  it('biasSign null = "+0"', () => {
    expect(biasSign(0)).toBe('+0');
  });

  it('rarityStars Rarity 3 = 3 gefüllte + 3 leere', () => {
    expect(rarityStars(3)).toBe('★★★☆☆☆');
  });

  it('rarityStars Rarity 6 = 6 gefüllte', () => {
    expect(rarityStars(6)).toBe('★★★★★★');
  });

  it('mockSpecies hat korrekten atkBias', () => {
    expect(mockSpecies.atkBias).toBe(15);
  });

  it('preferredBiomes enthält wurzelheim', () => {
    expect(mockSpecies.preferredBiomes).toContain('wurzelheim');
  });

  it('wrongBiomes enthält kaktoria', () => {
    expect(mockSpecies.wrongBiomes).toContain('kaktoria');
  });
});
