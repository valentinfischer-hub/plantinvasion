/**
 * Plant-Typdefinitionen fuer Plantinvasion V0.5 (Growth-System V0.2 + Booster-System V0.1)
 */

export type StatTriple = {
  atk: number;
  def: number;
  spd: number;
};

export type GrowthStage = 0 | 1 | 2 | 3 | 4;
export const GROWTH_STAGE_NAMES = ['Seed', 'Sprout', 'Juvenile', 'Adult', 'Blooming'] as const;

export type Rarity = 1 | 2 | 3 | 4 | 5;

export type QualityTier = 'common' | 'fine' | 'quality' | 'premium' | 'pristine';
export const QUALITY_TIERS: readonly QualityTier[] = ['common', 'fine', 'quality', 'premium', 'pristine'] as const;

export type SoilTier = 'normal' | 'bronze' | 'silver' | 'gold';
export const SOIL_TIERS: readonly SoilTier[] = ['normal', 'bronze', 'silver', 'gold'] as const;

export type BoosterType = 'xp' | 'sun-lamp' | 'sprinkler';

export interface ActiveBooster {
  type: BoosterType;
  startedAt: number;       // ms
  durationMs: number;
  multiplier?: number;     // bei xp-Boostern
  /** Optional: Item-Slug der den Booster ausgeloest hat. */
  fromItem?: string;
}

export interface PlantSpecies {
  slug: string;
  scientificName: string;
  commonName: string;
  rarity: Rarity;
  isStarter: boolean;
  atkBias: number;
  defBias: number;
  spdBias: number;
  description: string;
  spriteSeedPrefix: string;
  /** Bevorzugte Biome (Wachstums-Boost). */
  preferredBiomes?: string[];
  /** Falsche Biome (Wachstums-Penalty). */
  wrongBiomes?: string[];
}

/**
 * Individuelle Pflanze im Spielinventar.
 */
export interface Plant {
  id: string;
  speciesSlug: string;
  stats: StatTriple;
  geneSeed: number;
  parentAId?: string;
  parentBId?: string;
  isMutation: boolean;
  nickname?: string;

  // Wachstum + XP
  level: number;
  xp: number;
  totalXp: number;

  // Lifecycle
  bornAt: number;
  lastWateredAt: number;
  lastTickAt: number;

  // Growth-V0.2: Hydration und Care
  hydration: number;
  careScore: number;
  qualityTier?: QualityTier;
  generation: number;
  lastBloomedAt?: number;
  pendingHarvest: boolean;
  consecutiveDryHours: number;
  highestStageReached: GrowthStage;

  // Booster-V0.1
  activeBoosters: ActiveBooster[];

  // Bonsai-Mode V0.1: Wenn true, ist Stage-Up auf Blooming blockiert,
  // dafuer bekommt die Pflanze im Battle einen Stat-Bonus
  bonsaiMode?: boolean;

  // UI
  gridX: number;
  gridY: number;
}

export interface GardenSlotMeta {
  x: number;
  y: number;
  soilTier: SoilTier;
}
