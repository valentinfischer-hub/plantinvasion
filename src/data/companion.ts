import type { Plant } from '../types/plant';
import { getSpecies } from './species';

/**
 * Companion-Planting V0.1
 *
 * Bestimmte Spezies-Paare geben sich gegenseitig Wachstums-Bonus
 * wenn sie auf direkt benachbarten Slots stehen (4-Connected).
 *
 * Inspiration: Stardew Valley Beepocalypse, real-world companion planting
 * (Tomate + Basilikum, Bohnen + Mais, Lavendel + Rose etc.)
 */

export interface CompanionPair {
  /** Slug-Liste die im Pair sein muss (Reihenfolge egal). */
  slugs: [string, string];
  /** XP-Multiplier-Bonus auf BEIDE Pflanzen wenn benachbart. */
  bonus: number;
  /** Zusaetzlicher Hint fuer UI. */
  hint: string;
}

export const COMPANION_PAIRS: CompanionPair[] = [
  // Heilende Kombinationen
  { slugs: ['tomato-plant', 'lavender'], bonus: 0.15, hint: 'Lavendel-Duft schreckt Schaedlinge von Tomate ab' },
  { slugs: ['rose', 'sage'], bonus: 0.10, hint: 'Salbei verbessert Rosen-Aroma' },
  // Karnivoren-Pair
  { slugs: ['venus-flytrap', 'sundew'], bonus: 0.20, hint: 'Karnivoren teilen Beute und Hormone' },
  // Sukkulenten-Pair
  { slugs: ['aloe-vera', 'spike-cactus'], bonus: 0.15, hint: 'Sukkulenten teilen Wasser-Reserven' },
  // Familie-uebergreifend
  { slugs: ['sunflower', 'mint'], bonus: 0.10, hint: 'Sonnenblume schaffts Schatten fuer Minze' },
  { slugs: ['fern', 'orchid'], bonus: 0.15, hint: 'Farn haelt Boden feucht fuer Orchidee' },
  { slugs: ['water-lily', 'iris'], bonus: 0.20, hint: 'Wasserpflanzen stabilisieren sich' },
  { slugs: ['fire-lily', 'banksia'], bonus: 0.15, hint: 'Pyrophyten teilen Asche-Naehrstoffe' },
  { slugs: ['edelweiss', 'snowdrop'], bonus: 0.10, hint: 'Alpen-Pflanzen nutzen gleichen Frost-Trigger' },
  { slugs: ['sea-thrift', 'mangrove'], bonus: 0.15, hint: 'Salztolerante teilen Mineralien' }
];

const NEIGHBOR_OFFSETS: Array<[number, number]> = [
  [-1, 0], [1, 0], [0, -1], [0, 1]
];

/**
 * Berechnet Companion-Planting-Bonus fuer eine Pflanze.
 * Nimmt das maximale Pair (kein Stack mehrerer Pairs).
 */
export function companionBonus(plant: Plant, allPlants: Plant[]): { bonus: number; hint?: string } {
  let best = 0;
  let bestHint: string | undefined;
  for (const [dx, dy] of NEIGHBOR_OFFSETS) {
    const nx = plant.gridX + dx;
    const ny = plant.gridY + dy;
    const neighbor = allPlants.find((p) => p.gridX === nx && p.gridY === ny);
    if (!neighbor) continue;
    const pair = COMPANION_PAIRS.find((p) => {
      const [a, b] = p.slugs;
      return (a === plant.speciesSlug && b === neighbor.speciesSlug) ||
             (b === plant.speciesSlug && a === neighbor.speciesSlug);
    });
    if (pair && pair.bonus > best) {
      best = pair.bonus;
      bestHint = pair.hint;
    }
  }
  return { bonus: best, hint: bestHint };
}

/**
 * Liste aller moeglichen Companions einer Spezies (fuer UI-Hint).
 */
export function getCompanionsFor(slug: string): Array<{ partner: string; bonus: number; hint: string }> {
  const result: Array<{ partner: string; bonus: number; hint: string }> = [];
  for (const pair of COMPANION_PAIRS) {
    const [a, b] = pair.slugs;
    if (a === slug) result.push({ partner: b, bonus: pair.bonus, hint: pair.hint });
    else if (b === slug) result.push({ partner: a, bonus: pair.bonus, hint: pair.hint });
  }
  return result;
}

void getSpecies;
