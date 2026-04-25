import type { PlantFamily } from './encounters';

/**
 * Boss-Definitionen fuer Story-Encounters V1.
 * Bosses haben fixed Stats, eigene Move-Sets, eigene Sprites und triggern Quest-Completion.
 */

export interface BossDef {
  id: string;
  name: string;
  family: PlantFamily;
  level: number;
  hpMultiplier: number;          // bonus HP gegenueber Wild-Stats
  atkBias: number;
  defBias: number;
  spdBias: number;
  moveSlugs: string[];
  spriteKey: string;
  spriteColor: number;
  introText: string[];
  defeatText: string[];
  rewardCoins: number;
  rewardItems: Record<string, number>;
  questFlagOnDefeat: string;
  zone: string;
}

export const BOSSES: BossDef[] = [
  {
    id: 'captain-schimmelpilz',
    name: 'Hauptmann Schimmelpilz',
    family: 'Droseraceae',
    level: 8,
    hpMultiplier: 1.5,
    atkBias: 10,
    defBias: 5,
    spdBias: 0,
    moveSlugs: ['snap-trap', 'sticky-syrup', 'mustard-burn', 'tackle'],
    spriteKey: 'tile_tropical',
    spriteColor: 0x6e3a3a,
    introText: [
      'Hauptmann Schimmelpilz: So so, eine kleine Botanikerin.',
      'Hauptmann Schimmelpilz: Verodyne hat dieses Lager besetzt. Du bist hier nicht erwuenscht.',
      'Hauptmann Schimmelpilz: Dann lerne sie kennen, die wahre Macht der Mutationen!'
    ],
    defeatText: [
      'Hauptmann Schimmelpilz: Unmoeglich... eine Anfaengerin...',
      'Hauptmann Schimmelpilz: (laesst Verodyne-Akte fallen und flieht)'
    ],
    rewardCoins: 250,
    rewardItems: { 'verodyne-document': 1, 'atk-boost': 1 },
    questFlagOnDefeat: 'defeated_captain_schimmelpilz',
    zone: 'verdanto'
  },
  {
    id: 'mangrove-tyrann',
    name: 'Mangroven-Tyrann',
    family: 'Bromeliaceae',
    level: 22,
    hpMultiplier: 1.8,
    atkBias: 25,
    defBias: 30,
    spdBias: -5,
    moveSlugs: ['root-snare', 'water-cup', 'air-roots', 'thick-leaf'],
    spriteKey: 'tile_tree',
    spriteColor: 0x4a3a28,
    introText: [
      'Mangroven-Tyrann: HRRROOOAAR!',
      'Mangroven-Tyrann: (uralte Wurzeln stuermen aus dem Salzwasser)'
    ],
    defeatText: [
      'Mangroven-Tyrann: (sinkt zurueck ins Wasser)',
      'Finn (per Funk): Du hast ihn besiegt! Die Schiff-Akten sind frei!'
    ],
    rewardCoins: 500,
    rewardItems: { 'great-lure': 5, 'atk-boost': 2 },
    questFlagOnDefeat: 'defeated_mangrove',
    zone: 'salzbucht'
  },
  {
    id: 'pitcher-of-death',
    name: 'Pitcher des Todes',
    family: 'Droseraceae',
    level: 28,
    hpMultiplier: 2.0,
    atkBias: 40,
    defBias: 15,
    spdBias: 5,
    moveSlugs: ['snap-trap', 'digestion', 'sticky-syrup', 'toxic-vine'],
    spriteKey: 'tile_tropical',
    spriteColor: 0x8b3a6b,
    introText: [
      'Pitcher des Todes: Schluuuuuurf...',
      'Morag (per Funk): Vorsicht, sein Verdauungssaft ist toedlich!'
    ],
    defeatText: [
      'Pitcher des Todes: ...zerfaellt zu Naehrstoffen.',
      'Morag: Du bist eine wahre Botanikerin. Hier, das Sumpf-Symbol fuer den Eden-Schluessel.'
    ],
    rewardCoins: 800,
    rewardItems: { 'great-lure': 7, 'cure-spray': 3 },
    questFlagOnDefeat: 'defeated_pitcher',
    zone: 'mordwald'
  },
  {
    id: 'magmus-rex',
    name: 'Magmus Rex',
    family: 'Mythical',
    level: 38,
    hpMultiplier: 2.5,
    atkBias: 60,
    defBias: 40,
    spdBias: 10,
    moveSlugs: ['dragon-bloom', 'sun-blaze', 'thick-leaf', 'sun-beam'],
    spriteKey: 'tile_cactus',
    spriteColor: 0xff5c1c,
    introText: [
      'Magmus Rex: GRRRROOOOAARR!',
      'Pyra (per Funk): Er ist Verodynes ultimatives Pflanzenexperiment.',
      'Magmus Rex: ICH BIN DAS FEUER. ICH BIN DER ZORN.'
    ],
    defeatText: [
      'Magmus Rex: ...wird zu Asche.',
      'Pyra: Aus seiner Asche wird ein Phoenix wachsen. Das ist die Natur.'
    ],
    rewardCoins: 1500,
    rewardItems: { 'sun-amulet': 1, 'great-lure': 10, 'atk-boost': 5 },
    questFlagOnDefeat: 'defeated_magmus_rex',
    zone: 'magmabluete'
  },
  {
    id: 'frostmother-glaziella',
    name: 'Frostmutter Glaziella',
    family: 'Crassulaceae',
    level: 45,
    hpMultiplier: 2.2,
    atkBias: 50,
    defBias: 60,
    spdBias: -10,
    moveSlugs: ['frost-rest', 'thick-leaf', 'sap-strike', 'leaf-shield'],
    spriteKey: 'tile_pine',
    spriteColor: 0xc8d8e8,
    introText: [
      'Frostmutter Glaziella: Hueh hueh hueh...',
      'Frostmutter Glaziella: Du wagst es, mein Eis-Reich zu betreten?',
      'Frostmutter Glaziella: Du wirst hier erstarren wie Tilda damals!'
    ],
    defeatText: [
      'Frostmutter Glaziella: Tilda... lebt also noch? Verraeterische Pflanze!',
      '(zerschmilzt zu einem Eiskristall)'
    ],
    rewardCoins: 2000,
    rewardItems: { 'great-lure': 15, 'cure-spray': 5 },
    questFlagOnDefeat: 'defeated_glaziella',
    zone: 'glaciara'
  },
  {
    id: 'verodynicus-final',
    name: 'CEO Verodynicus',
    family: 'Mythical',
    level: 60,
    hpMultiplier: 3.5,
    atkBias: 100,
    defBias: 80,
    spdBias: 30,
    moveSlugs: ['dragon-bloom', 'star-pollen', 'toxic-vine', 'sun-blaze'],
    spriteKey: 'tile_door',
    spriteColor: 0x4a2828,
    introText: [
      'Verodynicus: Endlich. Die Erbin von Tilda.',
      'Verodynicus: Tilda hat es nicht verstanden. Mutation ist Fortschritt.',
      'Verodynicus: Ich werde dich in das System integrieren!'
    ],
    defeatText: [
      'Verodynicus: ...ich... wollte... nur die Welt veraendern...',
      'Tilda: Caspar, dein Forschungsfeuer hat dich blind gemacht.',
      'Tilda: Komm Botaniker-Enkel-in. Lass uns Botanopia heilen.'
    ],
    rewardCoins: 10000,
    rewardItems: { 'sun-amulet': 3, 'eden-key': 1 },
    questFlagOnDefeat: 'defeated_verodynicus',
    zone: 'edenlost'
  }
];

export function getBoss(id: string): BossDef | undefined {
  return BOSSES.find((b) => b.id === id);
}

export function getBossesForZone(zone: string): BossDef[] {
  return BOSSES.filter((b) => b.zone === zone);
}
