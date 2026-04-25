import type { PlantFamily } from './encounters';

/**
 * Move-Datenbank V0.1 fuer Pokemon-Style Battle.
 * Jede Pflanze hat 4 Moves aus dem Pool ihrer Familie + universal moves.
 */

export type StatusEffect = 'wilted' | 'pests' | 'poisoned' | 'asleep' | 'rooted' | 'fungus' | 'frostbite';

export interface MoveDef {
  slug: string;
  name: string;
  family: PlantFamily | 'Universal';
  power: number;          // 0 = status-only move
  accuracy: number;       // 0-1
  priority: number;       // -1 langsam, 0 normal, 1 schnell
  status?: { effect: StatusEffect; chance: number; turns?: number };
  selfBoost?: { stat: 'atk' | 'def' | 'spd'; mult: number; turns: number };
  enemyDebuff?: { stat: 'atk' | 'def' | 'spd'; mult: number; turns: number };
  heal?: number;          // % maxHp heal fuer self
  flavor: string;         // Spass-Beschreibung
  description: string;    // Im Spiel angezeigt
}

export const MOVES: MoveDef[] = [
  // === UNIVERSAL ===
  {
    slug: 'tackle',
    name: 'Rammen',
    family: 'Universal',
    power: 30, accuracy: 0.95, priority: 0,
    flavor: 'Die Pflanze stuermt nach vorn und rammt den Gegner.',
    description: 'Standard-Angriff, zuverlaessig.'
  },
  {
    slug: 'photosynthesis',
    name: 'Photosynthese',
    family: 'Universal',
    power: 0, accuracy: 1.0, priority: 0,
    heal: 0.30,
    flavor: 'Sonnenstrahlen geben neue Kraft. Heilt 30% maxHP.',
    description: 'Heilt 30% maxHP. Wirkt nicht im Schatten.'
  },
  {
    slug: 'sun-beam',
    name: 'Sonnenstrahl',
    family: 'Universal',
    power: 65, accuracy: 0.85, priority: 0,
    flavor: 'Gebuendeltes Sonnenlicht trifft den Gegner mit gleissender Hitze.',
    description: 'Hoher Schaden, etwas ungenau.'
  },
  {
    slug: 'leaf-shield',
    name: 'Blattschild',
    family: 'Universal',
    power: 0, accuracy: 1.0, priority: 1,
    selfBoost: { stat: 'def', mult: 1.5, turns: 3 },
    flavor: 'Die Pflanze rollt ihre Blaetter wie einen Panzer um sich.',
    description: 'DEF +50% fuer 3 Runden.'
  },
  {
    slug: 'wither',
    name: 'Welken',
    family: 'Universal',
    power: 0, accuracy: 0.85, priority: 0,
    status: { effect: 'wilted', chance: 1.0, turns: 4 },
    enemyDebuff: { stat: 'atk', mult: 0.75, turns: 4 },
    flavor: 'Die Wurzeln zerren die Feuchtigkeit aus dem Gegner.',
    description: 'Macht Gegner welk. -25% ATK fuer 4 Runden.'
  },
  // === ASTERACEAE (Sonnenblume, Loewenzahn, Edelweiss) ===
  {
    slug: 'pollen-storm',
    name: 'Pollensturm',
    family: 'Asteraceae',
    power: 50, accuracy: 0.80, priority: 0,
    status: { effect: 'asleep', chance: 0.25, turns: 2 },
    flavor: 'Eine gelbe Wolke aus Pollen umhuellt das Schlachtfeld.',
    description: 'Mittlere Schaden, 25% Schlaf-Chance.'
  },
  {
    slug: 'sun-blaze',
    name: 'Sonnenglut',
    family: 'Asteraceae',
    power: 80, accuracy: 0.90, priority: 0,
    selfBoost: { stat: 'atk', mult: 1.2, turns: 2 },
    flavor: 'Die Bluete glueht hell wie ein Mini-Stern und peitscht den Gegner.',
    description: 'Hoher Schaden plus eigene ATK +20%.'
  },
  {
    slug: 'seed-volley',
    name: 'Samen-Salve',
    family: 'Asteraceae',
    power: 25, accuracy: 1.0, priority: 1,
    flavor: 'Hunderte Samen sausen als Hagel auf den Gegner zu.',
    description: 'Schwacher aber super-zuverlaessiger Vorgriff.'
  },
  // === SOLANACEAE (Tomate, Kartoffel, Petunie) ===
  {
    slug: 'toxic-vine',
    name: 'Giftranke',
    family: 'Solanaceae',
    power: 40, accuracy: 0.95, priority: 0,
    status: { effect: 'poisoned', chance: 0.6, turns: 5 },
    flavor: 'Eine duenne Ranke schiesst hervor, vergiftet den Gegner mit Solanin.',
    description: 'Schaden plus 60% Gift-Chance.'
  },
  {
    slug: 'red-burst',
    name: 'Rote Beere',
    family: 'Solanaceae',
    power: 70, accuracy: 0.90, priority: 0,
    flavor: 'Eine reife Beere explodiert beim Aufschlag.',
    description: 'Direkter Schaden.'
  },
  {
    slug: 'night-shade',
    name: 'Nachtschatten',
    family: 'Solanaceae',
    power: 0, accuracy: 1.0, priority: 0,
    enemyDebuff: { stat: 'spd', mult: 0.7, turns: 3 },
    flavor: 'Ein lila Schatten umhuellt den Gegner.',
    description: 'Gegner SPD -30% fuer 3 Runden.'
  },
  // === CACTACEAE (Saguaro, Echinocactus, Barrel) ===
  {
    slug: 'spike-volley',
    name: 'Stachelsalve',
    family: 'Cactaceae',
    power: 55, accuracy: 0.95, priority: 0,
    flavor: 'Ein Schauer aus Kakteen-Stacheln durchdringt die Luft.',
    description: 'Solider physischer Angriff.'
  },
  {
    slug: 'desert-wind',
    name: 'Wuestenwind',
    family: 'Cactaceae',
    power: 35, accuracy: 0.85, priority: 0,
    enemyDebuff: { stat: 'def', mult: 0.7, turns: 3 },
    flavor: 'Ein heisser, sandiger Wind kratzt am Panzer des Gegners.',
    description: 'Schaden plus Gegner DEF -30%.'
  },
  {
    slug: 'water-store',
    name: 'Wasserspeicher',
    family: 'Cactaceae',
    power: 0, accuracy: 1.0, priority: 0,
    heal: 0.40,
    selfBoost: { stat: 'def', mult: 1.3, turns: 4 },
    flavor: 'Die Pflanze zapft ihren Wasservorrat an und schwillt an.',
    description: 'Heilt 40% HP plus DEF +30%.'
  },
  // === CRASSULACEAE (Sukkulenten, Yucca, Schneegloeckchen) ===
  {
    slug: 'thick-leaf',
    name: 'Dickes Blatt',
    family: 'Crassulaceae',
    power: 0, accuracy: 1.0, priority: 0,
    selfBoost: { stat: 'def', mult: 2.0, turns: 2 },
    flavor: 'Die Blaetter werden hart wie Leder.',
    description: 'DEF verdoppelt fuer 2 Runden.'
  },
  {
    slug: 'sap-strike',
    name: 'Saft-Stoss',
    family: 'Crassulaceae',
    power: 60, accuracy: 0.90, priority: 0,
    flavor: 'Klebriger Saft schiesst aus einem Pflanzentrieb wie ein Stoss.',
    description: 'Solider Angriff.'
  },
  {
    slug: 'frost-rest',
    name: 'Frostruhe',
    family: 'Crassulaceae',
    power: 0, accuracy: 1.0, priority: 0,
    heal: 0.50,
    flavor: 'Die Pflanze zieht sich in eine Frosthuelle zurueck und sammelt Kraefte.',
    description: 'Heilt 50% HP. Aber langsam (priority -1 wuerde realistisch sein).'
  },
  // === LAMIACEAE (Lavendel, Pfefferminze, Salbei) ===
  {
    slug: 'aroma-wave',
    name: 'Aroma-Welle',
    family: 'Lamiaceae',
    power: 0, accuracy: 1.0, priority: 0,
    status: { effect: 'asleep', chance: 0.55, turns: 3 },
    flavor: 'Ein beruhigender Lavendelduft macht muede.',
    description: '55% Chance Gegner einzuschlaefern.'
  },
  {
    slug: 'mint-slash',
    name: 'Minzschnitt',
    family: 'Lamiaceae',
    power: 65, accuracy: 0.95, priority: 0,
    flavor: 'Scharfe Minzblatt-Klingen schneiden durch die Luft.',
    description: 'Schneller, scharfer Angriff.'
  },
  {
    slug: 'herbal-cure',
    name: 'Heilkraut',
    family: 'Lamiaceae',
    power: 0, accuracy: 1.0, priority: 0,
    heal: 0.25,
    flavor: 'Aetherische Oele heilen die Pflanze von innen.',
    description: 'Heilt 25% HP plus entfernt eigene Status-Effekte.'
  },
  // === BRASSICACEAE (Senf, Kohl, Gentian) ===
  {
    slug: 'mustard-burn',
    name: 'Senfbrand',
    family: 'Brassicaceae',
    power: 50, accuracy: 0.95, priority: 0,
    status: { effect: 'fungus', chance: 0.30, turns: 3 },
    flavor: 'Ein scharfer Senfgas-Stoss aetzt den Gegner.',
    description: 'Schaden plus 30% Pilz-Chance.'
  },
  {
    slug: 'cabbage-shield',
    name: 'Kohl-Schild',
    family: 'Brassicaceae',
    power: 0, accuracy: 1.0, priority: 1,
    selfBoost: { stat: 'def', mult: 1.7, turns: 3 },
    flavor: 'Die Pflanze rollt sich zu einem Kohlkopf zusammen.',
    description: 'DEF +70% fuer 3 Runden, schnell.'
  },
  // === APIACEAE (Karotte, Petersilie, Wegerich) ===
  {
    slug: 'root-snare',
    name: 'Wurzelfalle',
    family: 'Apiaceae',
    power: 30, accuracy: 0.90, priority: 0,
    status: { effect: 'rooted', chance: 0.7, turns: 3 },
    flavor: 'Wurzeln schiessen aus dem Boden und umklammern den Gegner.',
    description: 'Schaden plus 70% Wurzelfang (kein Wechsel/Run).'
  },
  {
    slug: 'celery-whip',
    name: 'Sellerie-Peitsche',
    family: 'Apiaceae',
    power: 60, accuracy: 0.85, priority: 0,
    flavor: 'Sellerie-Stengel peitscht durch die Luft.',
    description: 'Schneller Knick-Angriff.'
  },
  // === DROSERACEAE (Venus, Sundew, Pitcher) ===
  {
    slug: 'snap-trap',
    name: 'Schnappfalle',
    family: 'Droseraceae',
    power: 75, accuracy: 0.85, priority: 0,
    flavor: 'Die Pflanze schnappt mit Klauenfingern zu.',
    description: 'Hoher Schaden, etwas ungenau.'
  },
  {
    slug: 'sticky-syrup',
    name: 'Klebriger Sirup',
    family: 'Droseraceae',
    power: 0, accuracy: 0.95, priority: 0,
    enemyDebuff: { stat: 'spd', mult: 0.5, turns: 3 },
    flavor: 'Ein Tropfen klebriger Sirup haftet am Gegner.',
    description: 'Gegner SPD halbiert fuer 3 Runden.'
  },
  {
    slug: 'digestion',
    name: 'Verdauung',
    family: 'Droseraceae',
    power: 50, accuracy: 0.90, priority: 0,
    heal: 0.20,
    flavor: 'Die Pflanze saugt Naehrstoffe aus dem Gegner.',
    description: 'Schaden plus 20% Heal von ihrem maxHP.'
  },
  // === ORCHIDACEAE (Vanille, Phalaenopsis) ===
  {
    slug: 'fragrance-charm',
    name: 'Duftzauber',
    family: 'Orchidaceae',
    power: 0, accuracy: 0.85, priority: 0,
    enemyDebuff: { stat: 'atk', mult: 0.6, turns: 3 },
    flavor: 'Ein berauschender Duft vernebelt den Gegner.',
    description: 'Gegner ATK -40% fuer 3 Runden.'
  },
  {
    slug: 'petal-dance',
    name: 'Bluetentanz',
    family: 'Orchidaceae',
    power: 70, accuracy: 0.90, priority: 0,
    selfBoost: { stat: 'spd', mult: 1.3, turns: 3 },
    flavor: 'Die Pflanze dreht sich tanzend und schleudert ihre Blueten.',
    description: 'Schaden plus eigene SPD +30%.'
  },
  // === BROMELIACEAE (Tillandsia, Aechmea) ===
  {
    slug: 'air-roots',
    name: 'Luftwurzeln',
    family: 'Bromeliaceae',
    power: 40, accuracy: 0.95, priority: 0,
    heal: 0.15,
    flavor: 'Wurzeln greifen in die Luft, saugen Feuchtigkeit aus dem Gegner.',
    description: 'Schaden plus 15% Heal.'
  },
  {
    slug: 'water-cup',
    name: 'Wasserkelch',
    family: 'Bromeliaceae',
    power: 55, accuracy: 0.90, priority: 0,
    flavor: 'Die Pflanze schuettet einen Schwall sauren Wassers aus.',
    description: 'Solider Wasser-Angriff.'
  },
  // === MYTHICAL (Endgame) ===
  {
    slug: 'dragon-bloom',
    name: 'Drachenbluete',
    family: 'Mythical',
    power: 100, accuracy: 0.85, priority: 0,
    selfBoost: { stat: 'atk', mult: 1.5, turns: 2 },
    flavor: 'Eine mythische Bluete oeffnet sich und brennt einen Drachen-Atem.',
    description: 'Massive Schaden plus ATK +50%.'
  },
  {
    slug: 'star-pollen',
    name: 'Sternenpollen',
    family: 'Mythical',
    power: 75, accuracy: 0.95, priority: 0,
    status: { effect: 'asleep', chance: 0.4, turns: 3 },
    flavor: 'Glitzernder Pollen aus einer anderen Welt.',
    description: 'Schaden plus 40% Schlaf.'
  }
];

export function getMove(slug: string): MoveDef | undefined {
  return MOVES.find((m) => m.slug === slug);
}

/**
 * Default-Move-Set fuer eine Pflanze einer Familie.
 * Liefert 4 Moves: 1 universal + 3 family-specific (oder fewer).
 */
export function defaultMovesForFamily(family: PlantFamily): string[] {
  const familyMoves = MOVES.filter((m) => m.family === family).map((m) => m.slug);
  const selected = familyMoves.slice(0, 3);
  selected.push('tackle');     // immer als 4. Slot
  return selected;
}
