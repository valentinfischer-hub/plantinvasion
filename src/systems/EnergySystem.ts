/**
 * EnergySystem - Stardew-Inspiriertes Energy-/Stamina-System
 * 
 * Ziel: Ein Spieler-Tag sollte ~20-30 sinnvolle Aktionen ermöglichen
 * bevor Energie leer ist (analog zu Stardew Valley).
 * 
 * Max-Energy: 100
 * Regeneration: +100 durch Schlafen (endDay)
 * 
 * Kosten:
 *   Säen (plantSeed):     -1 Energy  (günstig, Routine-Aktion)
 *   Giessen (water):      -2 Energy  (mittlere Aktion)
 *   Kreuzen (cross):      -8 Energy  (aufwendig, sollte selten sein)
 *   Ernten (harvest):     -1 Energy  (günstig, Belohnung)
 *   Foraging (forage):    -4 Energy  (Erkundung)
 *   Booster anwenden:     -3 Energy  (Spezialaktion)
 */

export const ENERGY_MAX = 100;
export const ENERGY_REGEN_SLEEP = 100; // Volle Regeneration pro Tag

export const ENERGY_COST = {
  sow: 1,       // Säen
  water: 2,     // Giessen
  cross: 8,     // Kreuzen (teuerste Aktion - soll selten sein)
  harvest: 1,   // Ernten
  forage: 4,    // Foraging
  booster: 3,   // Booster anwenden
} as const;

export type EnergyAction = keyof typeof ENERGY_COST;

/**
 * Prüft ob genug Energie für eine Aktion vorhanden ist.
 */
export function canAffordEnergy(currentEnergy: number, action: EnergyAction): boolean {
  return currentEnergy >= ENERGY_COST[action];
}

/**
 * Zieht Energie für eine Aktion ab.
 * Gibt die neue Energie zurück (min 0).
 */
export function spendEnergy(currentEnergy: number, action: EnergyAction): number {
  return Math.max(0, currentEnergy - ENERGY_COST[action]);
}

/**
 * Regeneriert Energie nach einem Schlaf (Tagesende).
 * Gibt die neue Energie zurück (max ENERGY_MAX).
 */
export function regenEnergy(currentEnergy: number, amount = ENERGY_REGEN_SLEEP): number {
  return Math.min(ENERGY_MAX, currentEnergy + amount);
}

/**
 * Energie-Label für UI-Anzeige.
 */
export function energyLabel(current: number): string {
  return `${current}/${ENERGY_MAX}`;
}

/**
 * Energie-Farbe basierend auf aktuellem Stand.
 * Grün > 50%, Gelb 20-50%, Rot < 20%
 */
export function energyColor(current: number): number {
  const pct = current / ENERGY_MAX;
  if (pct > 0.5) return 0x4caf50;  // Grün
  if (pct > 0.2) return 0xffc107;  // Gelb
  return 0xf44336;                  // Rot
}
