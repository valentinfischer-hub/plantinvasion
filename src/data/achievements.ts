/**
 * Achievement-System V0.1 (10 Achievements aus brain/design/endgame.md).
 *
 * Achievements werden serverless geprueft via gameStore.checkAchievements.
 * Trigger: nach jeder relevanten Action (harvest, capture, cross, defeat-Boss).
 */

export interface AchievementDef {
  slug: string;
  name: string;
  description: string;
  /** Reward beim Unlock. */
  rewardCoins?: number;
  rewardItem?: { slug: string; amount: number };
  /** Cosmetic-Flag fuer spaetere UI-Anzeige. */
  cosmetic?: string;
  /** B7-R4: Schwierigkeits-Tier für Icon im Achievement-Toast. */
  tier?: 'bronze' | 'silver' | 'gold';
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    slug: 'first-bloom',
    name: 'Erste Bluete',
    tier: 'bronze' as const,
    description: 'Bringe deine erste Pflanze zur Blooming-Stage.',
    rewardCoins: 500
  },
  {
    slug: 'pristine-grower',
    name: 'Pristine-Pflueger',
    tier: 'silver' as const,
    description: 'Erreiche Pristine-Tier auf einer Pflanze.',
    rewardItem: { slug: 'pristine-pollen', amount: 1 },
    cosmetic: 'border-pristine'
  },
  {
    slug: 'hybrid-architect',
    name: 'Hybrid-Architekt',
    description: 'Erfolgreiche 10 Crossings durchgefuehrt.',
    rewardCoins: 200,
    rewardItem: { slug: 'hybrid-booster', amount: 1 }
  },
  {
    slug: 'mutation-storm',
    name: 'Wirbelsturm',
    description: '10 Mutationen erzeugt.',
    rewardCoins: 300,
    cosmetic: 'glow-mutation'
  },
  {
    slug: 'cactus-bundle',
    name: 'Kaktus-Buende',
    description: '5 Pristine-Kakteen gleichzeitig im Garten.',
    rewardItem: { slug: 'soil-gold', amount: 1 }
  },
  {
    slug: 'swamp-veteran',
    name: 'Sumpf-Veteran',
    description: 'Mordwald-Boss besiegt.',
    rewardItem: { slug: 'swamp-pollen', amount: 5 }
  },
  {
    slug: 'volcano-tamer',
    name: 'Vulkan-Bezwinger',
    description: 'Magmabluete-Boss besiegt.',
    rewardItem: { slug: 'volcano-ash', amount: 5 }
  },
  {
    slug: 'world-traveler',
    name: 'Welten-Reisender',
    description: 'Alle 7 Biome besucht.',
    rewardCoins: 1000
  },
  {
    slug: 'collector',
    name: 'Sammler',
    description: '30 verschiedene Spezies entdeckt.',
    rewardCoins: 500,
    cosmetic: 'bonus-slot'
  },
  {
    slug: 'completion',
    name: 'Vollendung',
    description: '60 Spezies entdeckt plus 5 Hybrid-Recipes erfolgreich.',
    rewardCoins: 5000,
    cosmetic: 'statue-heimatdorf'
  },
  // S-10 Story-Akt-2
  {
    slug: 'verdanto_erkundet',
    name: 'Verdanto-Erkundet',
    description: 'Du hast Verdanto zum ersten Mal erkundet.',
    rewardCoins: 100,
  }
];

export function getAchievement(slug: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.slug === slug);
}
