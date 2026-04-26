import type { Plant } from '../types/plant';

/**
 * Plant-Role V0.1
 *
 * Inspiration: Pflanzen-RPG-Doc - DPS, Tank, Support, Control.
 * Role wird aus Stats abgeleitet (kein eigenes Save-Field).
 */

export type PlantRole = 'DPS' | 'Tank' | 'Support' | 'Control';

export interface RoleInfo {
  role: PlantRole;
  hint: string;
  color: number;
}

export function plantRole(plant: Plant): RoleInfo {
  const { atk, def, spd } = plant.stats;
  const max = Math.max(atk, def, spd);
  const avg = (atk + def + spd) / 3;
  // Wenn balanced (max nahe avg), Control
  if (max - avg < 8) {
    return { role: 'Control', hint: 'Allrounder, vielseitig', color: 0xb86ee3 };
  }
  if (atk === max) {
    return { role: 'DPS', hint: 'Hoher Schaden', color: 0xff5c5c };
  }
  if (def === max) {
    return { role: 'Tank', hint: 'Robust, haelt aus', color: 0x5b8de8 };
  }
  // spd dominant
  return { role: 'Support', hint: 'Schnell, Hit-and-Run', color: 0x9be36e };
}
