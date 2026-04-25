/**
 * Foraging-System V0.1
 *
 * - Forage-Tiles (z.B. Bushes mit Tile-Index 50/51) haben einen Region-Loot-Pool und einen Cooldown
 * - Hidden-Item-Spots sind versteckte Tile-Positionen pro Biom mit one-shot-Loot
 * - Battle-Drops nach gewonnener Wild-Battle (25% Chance)
 */

export const FORAGE_TILE_BUSH = 50;
export const FORAGE_TILE_WILDPLANT = 51;
export const FORAGE_COOLDOWN_MS = 60 * 60 * 1000; // 1 Stunde

export interface ForagePool {
  seedSlugs: string[];
  itemSlugs?: string[];
}

export const FORAGE_POOLS: Record<string, ForagePool> = {
  wurzelheim: {
    seedSlugs: ['seed-sunflower', 'seed-daffodil', 'seed-mint', 'seed-tulip', 'seed-fern'],
    itemSlugs: ['compost-tea']
  },
  verdanto: {
    seedSlugs: ['seed-orchid', 'seed-fern', 'seed-heliconia', 'seed-monstera', 'seed-philodendron'],
    itemSlugs: ['compost-tea']
  },
  kaktoria: {
    seedSlugs: ['seed-spike-cactus', 'seed-aloe-vera', 'seed-saguaro', 'seed-barrel-cactus', 'seed-agave'],
    itemSlugs: ['compost-tea']
  },
  frostkamm: {
    seedSlugs: ['seed-edelweiss', 'seed-snowdrop', 'seed-alpine-gentian', 'seed-crocus', 'seed-mountain-pine'],
    itemSlugs: ['compost-tea']
  },
  salzbucht: {
    seedSlugs: ['seed-sea-thrift', 'seed-sea-holly', 'seed-mangrove', 'seed-sea-grape', 'seed-beach-aster'],
    itemSlugs: ['compost-tea']
  },
  mordwald: {
    seedSlugs: ['seed-sundew', 'seed-pitcher-plant', 'seed-cobra-lily', 'seed-bladderwort', 'seed-water-lily'],
    itemSlugs: ['swamp-pollen']
  },
  magmabluete: {
    seedSlugs: ['seed-fire-lily', 'seed-banksia', 'seed-protea', 'seed-serotinous-pine', 'seed-eucalyptus'],
    itemSlugs: ['volcano-ash']
  }
};

export function rollForagePool(zone: string): { itemSlug: string; toastLabel: string } {
  const pool = FORAGE_POOLS[zone] ?? FORAGE_POOLS.wurzelheim;
  // 80% Seed, 20% Booster
  const useBooster = Math.random() < 0.20 && (pool.itemSlugs?.length ?? 0) > 0;
  if (useBooster && pool.itemSlugs) {
    const slug = pool.itemSlugs[Math.floor(Math.random() * pool.itemSlugs.length)];
    return { itemSlug: slug, toastLabel: `+1 ${slug}` };
  }
  const slug = pool.seedSlugs[Math.floor(Math.random() * pool.seedSlugs.length)];
  return { itemSlug: slug, toastLabel: `+1 ${slug.replace('seed-', '')} Samen` };
}

export function isForageTile(tileIndex: number): boolean {
  return tileIndex === FORAGE_TILE_BUSH || tileIndex === FORAGE_TILE_WILDPLANT;
}

// =========================================================
// Hidden-Item-Spots
// =========================================================

export interface HiddenSpot {
  zone: string;
  tileX: number;
  tileY: number;
}

/** 5 Hidden-Spots pro Biom. Position frei waehlbar, sollten auf begehbarem Tile liegen. */
export const HIDDEN_SPOTS: HiddenSpot[] = [
  // Wurzelheim (24x18)
  { zone: 'wurzelheim', tileX: 4,  tileY: 5 },
  { zone: 'wurzelheim', tileX: 22, tileY: 8 },
  { zone: 'wurzelheim', tileX: 7,  tileY: 14 },
  { zone: 'wurzelheim', tileX: 18, tileY: 11 },
  { zone: 'wurzelheim', tileX: 12, tileY: 16 },
  // Verdanto
  { zone: 'verdanto', tileX: 5,  tileY: 4 },
  { zone: 'verdanto', tileX: 23, tileY: 9 },
  { zone: 'verdanto', tileX: 8,  tileY: 13 },
  { zone: 'verdanto', tileX: 19, tileY: 16 },
  { zone: 'verdanto', tileX: 11, tileY: 6 },
  // Kaktoria
  { zone: 'kaktoria', tileX: 6,  tileY: 5 },
  { zone: 'kaktoria', tileX: 21, tileY: 7 },
  { zone: 'kaktoria', tileX: 9,  tileY: 12 },
  { zone: 'kaktoria', tileX: 17, tileY: 14 },
  { zone: 'kaktoria', tileX: 13, tileY: 16 },
  // Frostkamm
  { zone: 'frostkamm', tileX: 5,  tileY: 6 },
  { zone: 'frostkamm', tileX: 20, tileY: 5 },
  { zone: 'frostkamm', tileX: 8,  tileY: 11 },
  { zone: 'frostkamm', tileX: 23, tileY: 14 },
  { zone: 'frostkamm', tileX: 14, tileY: 12 },
  // Salzbucht
  { zone: 'salzbucht', tileX: 7,  tileY: 4 },
  { zone: 'salzbucht', tileX: 22, tileY: 6 },
  { zone: 'salzbucht', tileX: 10, tileY: 13 },
  { zone: 'salzbucht', tileX: 18, tileY: 15 },
  { zone: 'salzbucht', tileX: 13, tileY: 9 },
  // Mordwald
  { zone: 'mordwald', tileX: 6,  tileY: 6 },
  { zone: 'mordwald', tileX: 21, tileY: 11 },
  { zone: 'mordwald', tileX: 9,  tileY: 14 },
  { zone: 'mordwald', tileX: 17, tileY: 7 },
  { zone: 'mordwald', tileX: 13, tileY: 4 },
  // Magmabluete
  { zone: 'magmabluete', tileX: 6,  tileY: 7 },
  { zone: 'magmabluete', tileX: 22, tileY: 9 },
  { zone: 'magmabluete', tileX: 9,  tileY: 13 },
  { zone: 'magmabluete', tileX: 18, tileY: 16 },
  { zone: 'magmabluete', tileX: 13, tileY: 11 }
];

export function findHiddenSpot(zone: string, tileX: number, tileY: number): HiddenSpot | undefined {
  return HIDDEN_SPOTS.find((s) => s.zone === zone && s.tileX === tileX && s.tileY === tileY);
}

export function hiddenSpotKey(spot: HiddenSpot): string {
  return `${spot.zone}:${spot.tileX}:${spot.tileY}`;
}

export function rollHiddenSpotLoot(zone: string): { itemSlug: string; coins?: number; toastLabel: string } {
  const roll = Math.random();
  if (roll < 0.60) {
    // Seed
    const pool = FORAGE_POOLS[zone] ?? FORAGE_POOLS.wurzelheim;
    const slug = pool.seedSlugs[Math.floor(Math.random() * pool.seedSlugs.length)];
    return { itemSlug: slug, toastLabel: `Hidden: +1 ${slug.replace('seed-', '')} Samen` };
  } else if (roll < 0.85) {
    // Booster
    const boosters = ['volcano-ash', 'swamp-pollen', 'compost-tea'];
    const slug = boosters[Math.floor(Math.random() * boosters.length)];
    return { itemSlug: slug, toastLabel: `Hidden: +1 ${slug}` };
  } else if (roll < 0.95) {
    const coins = 100 + Math.floor(Math.random() * 200);
    return { itemSlug: 'coins', coins, toastLabel: `Hidden: +${coins} Coins` };
  } else {
    return { itemSlug: 'pristine-pollen', toastLabel: 'Hidden: +1 Pristine-Pollen!' };
  }
}

// =========================================================
// Battle-Drops
// =========================================================

export function rollBattleDrop(speciesSlug: string): { itemSlug?: string; coins?: number } {
  const seedRoll = Math.random();
  const coinRoll = Math.random();
  const drops: { itemSlug?: string; coins?: number } = {};
  if (seedRoll < 0.25) {
    drops.itemSlug = `seed-${speciesSlug}`;
  }
  if (coinRoll < 0.10) {
    drops.coins = 1 + Math.floor(Math.random() * 3);
  }
  return drops;
}
