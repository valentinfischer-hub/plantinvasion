/**
 * Plant-Typdefinitionen fuer Plantinvasion V0.3
 */

export type StatTriple = {
  atk: number;
  def: number;
  spd: number;
};

export type GrowthStage = 0 | 1 | 2 | 3 | 4;
export const GROWTH_STAGE_NAMES = ['Seed', 'Sprout', 'Juvenile', 'Adult', 'Blooming'] as const;

export type Rarity = 1 | 2 | 3 | 4 | 5;

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
  lastWateredAt: number;  // ms timestamp
  lastTickAt: number;     // ms timestamp fuer XP-Akkumulation
  // UI
  gridX: number;
  gridY: number;
}
