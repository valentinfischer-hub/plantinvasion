/**
 * Plant-Typdefinitionen fuer Plantinvasion V0.1
 * GDD-Kernregeln: Stats ATK/DEF/SPD, Range 0-300, 5 Wachstumsstufen.
 */

export type StatTriple = {
  atk: number;
  def: number;
  spd: number;
};

export type GrowthStage = 0 | 1 | 2 | 3 | 4;
// 0 = Seed
// 1 = Sprout
// 2 = Juvenile
// 3 = Adult
// 4 = Blooming

export const GROWTH_STAGE_NAMES = ['Seed', 'Sprout', 'Juvenile', 'Adult', 'Blooming'] as const;

export type Rarity = 1 | 2 | 3 | 4 | 5;

/**
 * Speziesdefinition (Master-Daten, identisch zu plant_species in Supabase).
 */
export interface PlantSpecies {
  slug: string;
  scientificName: string;
  commonName: string;
  rarity: Rarity;
  isStarter: boolean;
  /** Stat-Bias gewichtet die Random-Generation pro Spezies. */
  atkBias: number;
  defBias: number;
  spdBias: number;
  description: string;
  /** Praefix fuer PixelLab-Sprite-Generation (Konsistenz pro Spezies). */
  spriteSeedPrefix: string;
}

/**
 * Individuelle Pflanze eines Spielers.
 */
export interface Plant {
  id: string;
  ownerId: string;
  speciesSlug: string;
  stats: StatTriple;
  growthStage: GrowthStage;
  growthProgress: number;
  geneSeed: number;
  parentAId?: string;
  parentBId?: string;
  isMutation: boolean;
  nickname?: string;
}
