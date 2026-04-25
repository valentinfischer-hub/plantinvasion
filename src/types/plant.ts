/**
 * Plant-Typdefinitionen fuer Plantinvasion V0.4 (Growth-System V0.2)
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
  /** Bevorzugte Biome (Wachstums-Boost). Default: ['wurzelheim'] (neutraler Garden). */
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
  level: number;          // 1-100
  xp: number;             // XP innerhalb des aktuellen Levels
  totalXp: number;        // Gesamt-XP fuer Statistik

  // Lifecycle
  bornAt: number;         // ms timestamp
  lastWateredAt: number;  // ms timestamp letzte Bewaesserung
  lastTickAt: number;     // ms timestamp fuer XP-Akkumulation

  // Growth-V0.2: Hydration und Care
  hydration: number;             // 0-100, sinkt mit Zeit
  careScore: number;             // 0+, akkumuliert ueber Pflege-Aktionen
  qualityTier?: QualityTier;     // gesetzt sobald Adult-Stage erreicht
  generation: number;            // 0 = Wild/Starter, 1 = F1-Hybrid, 2+ = F2+
  lastBloomedAt?: number;        // ms timestamp letztes Bloom-Cycle-Reset
  pendingHarvest: boolean;       // true wenn Bloom-Output bereit zum Ernten
  consecutiveDryHours: number;   // Tracking fuer Stage-Down-Risk
  highestStageReached: GrowthStage; // fuer Stage-Up-Animation und Tier-Snapshot

  // UI
  gridX: number;
  gridY: number;
}
