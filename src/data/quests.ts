/**
 * Quest-Katalog V0.1 fuer Plantinvasion.
 * Quests werden von NPCs gegeben und im gameStore.questState getracked.
 */

export type QuestStatus = 'pending' | 'active' | 'completed';

export type QuestGoal =
  | { type: 'capture'; speciesSlug: string; count: number }
  | { type: 'discover'; speciesSlug: string; count: number }
  | { type: 'have-item'; itemSlug: string; count: number }
  | { type: 'have-plant'; speciesSlug: string; count: number }
  | { type: 'talk-to'; npcId: string }
  | { type: 'reach-zone'; zone: string }
  | { type: 'defeat-boss'; bossId: string };

export interface QuestReward {
  coins?: number;
  items?: Record<string, number>;
}

export interface QuestDef {
  id: string;
  giverId: string;
  title: string;
  description: string;
  goal: QuestGoal;
  reward: QuestReward;
  storyAct?: number;            // 1-7 fuer Hauptstory, undefined = Side-Quest
  requiredFlag?: string;        // erscheint nur wenn dieser story-flag gesetzt ist
  setsFlag?: string;             // bei Completion wird dieser Flag gesetzt
  advancesAct?: number;          // bei Completion wird Akt advanced
  diaryEntry?: number;           // gibt einen Tagebuch-Eintrag bei Completion
}

export const QUESTS: QuestDef[] = [
  {
    id: 'lyra-bromelien-1',
    giverId: 'lyra',
    title: 'Lyras Bromelien',
    description: 'Bring Lyra 3 Bromeliad-Samen aus dem tropischen Regenwald.',
    goal: { type: 'capture', speciesSlug: 'bromeliad', count: 3 },
    reward: { coins: 100, items: { 'great-lure': 1 } }
  },
  {
    id: 'anya-sunflower-1',
    giverId: 'anya',
    title: 'Anyas Sonnenblume',
    description: 'Anya moechte eine Sonnenblume von dir kaufen.',
    goal: { type: 'have-plant', speciesSlug: 'sunflower', count: 1 },
    reward: { coins: 50, items: { 'heal-tonic': 2 } }
  },
  {
    id: 'durst-saguaro-1',
    giverId: 'durst-kaktus-meister',
    title: 'Durst Saguaro-Tausch',
    description: 'Bring Durst einen Saguaro-Kaktus aus Kaktoria.',
    goal: { type: 'capture', speciesSlug: 'saguaro', count: 1 },
    reward: { coins: 200, items: { 'great-lure': 2 } }
  }
  ,
  // === AKT 1: ERBE UND AUFRUF (Wurzelheim) ===
  {
    id: 'act1-grandma-diary',
    giverId: 'self',
    title: 'Tildas Tagebuch',
    description: 'Untersuche das alte Tagebuch deiner Grossmutter im Spielerhaus.',
    goal: { type: 'talk-to', npcId: 'iris-salbeyen' },
    reward: { coins: 50 },
    storyAct: 1,
    setsFlag: 'read_grandma_diary',
    diaryEntry: 1
  },
  {
    id: 'act1-meet-iris',
    giverId: 'iris-salbeyen',
    title: 'Begegnung mit Iris',
    description: 'Iris Salbeyen, die wandernde Forscherin, taucht am Dorfteich auf. Sprich mit ihr.',
    goal: { type: 'talk-to', npcId: 'iris-salbeyen' },
    reward: { items: { 'heal-tonic': 3 } },
    storyAct: 1,
    requiredFlag: 'read_grandma_diary',
    setsFlag: 'met_iris',
    advancesAct: 2,
    diaryEntry: 2
  },
  {
    id: 'act1-bjoern-lore',
    giverId: 'bjoern',
    title: 'Bjoerns Beobachtung',
    description: 'Bjoern hat etwas ueber Verodyne zu erzaehlen. Hoere ihm zu.',
    goal: { type: 'talk-to', npcId: 'bjoern' },
    reward: { coins: 30 },
    storyAct: 1,
    setsFlag: 'bjoern_verodyne_warning',
    diaryEntry: 3
  },
  // === AKT 2: VERDANTO ===
  {
    id: 'act2-reach-verdanto',
    giverId: 'iris-salbeyen',
    title: 'Aufbruch nach Verdanto',
    description: 'Iris empfiehlt dir den Tropischen Regenwald als ersten Reisepunkt.',
    goal: { type: 'reach-zone', zone: 'verdanto' },
    reward: { items: { 'basic-lure': 2 } },
    storyAct: 2,
    requiredFlag: 'met_iris',
    setsFlag: 'reached_verdanto',
    diaryEntry: 4
  },
  {
    id: 'act2-lyra-meet',
    giverId: 'lyra',
    title: 'Lyras Forschung',
    description: 'Triff Lyra, die Forscherin von Verdanto.',
    goal: { type: 'talk-to', npcId: 'lyra' },
    reward: { coins: 80 },
    storyAct: 2,
    requiredFlag: 'reached_verdanto',
    setsFlag: 'met_lyra'
  },
  {
    id: 'act2-bromelien',
    giverId: 'lyra',
    title: 'Bromelien fuer Lyra',
    description: 'Sammle 3 Bromeliad-Pflanzen aus Verdanto fuer Lyras Forschung.',
    goal: { type: 'capture', speciesSlug: 'bromeliad', count: 3 },
    reward: { coins: 150, items: { 'great-lure': 2 } },
    storyAct: 2,
    requiredFlag: 'met_lyra',
    setsFlag: 'helped_lyra',
    diaryEntry: 5
  },
  {
    id: 'act2-verodyne-camp',
    giverId: 'lyra',
    title: 'Verodyne-Lager',
    description: 'Lyra hat ein verstecktes Verodyne-Lager im Wald entdeckt. Untersuche es.',
    goal: { type: 'defeat-boss', bossId: 'captain-schimmelpilz' },
    reward: { coins: 250, items: { 'atk-boost': 1 } },
    storyAct: 2,
    requiredFlag: 'helped_lyra',
    setsFlag: 'defeated_captain_schimmelpilz',
    advancesAct: 3,
    diaryEntry: 6
  },
  // === AKT 3: KAKTORIA ===
  {
    id: 'act3-reach-kaktoria',
    giverId: 'lyra',
    title: 'Spuren nach Kaktoria',
    description: 'Verodynes Spuren fuehren in die Wueste. Reise nach Kaktoria.',
    goal: { type: 'reach-zone', zone: 'kaktoria' },
    reward: { items: { 'heal-tonic': 2 } },
    storyAct: 3,
    requiredFlag: 'defeated_captain_schimmelpilz',
    setsFlag: 'reached_kaktoria'
  },
  {
    id: 'act3-durst-meet',
    giverId: 'durst-kaktus-meister',
    title: 'Durst der Kaktus-Meister',
    description: 'Triff Durst und gewinne sein Vertrauen.',
    goal: { type: 'capture', speciesSlug: 'saguaro', count: 1 },
    reward: { coins: 200, items: { 'great-lure': 2 } },
    storyAct: 3,
    requiredFlag: 'reached_kaktoria',
    setsFlag: 'met_durst'
  },
  {
    id: 'act3-tilda-cave',
    giverId: 'durst-kaktus-meister',
    title: 'Tildas Hoehle',
    description: 'Durst zeigt dir eine geheime Hoehle, wo deine Grossmutter Pflanzen versteckt hat.',
    goal: { type: 'discover', speciesSlug: 'desert-rose', count: 1 },
    reward: { items: { 'heal-tonic': 5 } },
    storyAct: 3,
    requiredFlag: 'met_durst',
    setsFlag: 'found_tilda_cave',
    advancesAct: 4,
    diaryEntry: 12
  },
  // === AKT 4: FROSTKAMM ===
  {
    id: 'act4-reach-frostkamm',
    giverId: 'durst-kaktus-meister',
    title: 'Berge ruft',
    description: 'Reise nach Norden in das Hochgebirge Frostkamm.',
    goal: { type: 'reach-zone', zone: 'frostkamm' },
    reward: { items: { 'heal-tonic': 3 } },
    storyAct: 4,
    requiredFlag: 'found_tilda_cave',
    setsFlag: 'reached_frostkamm'
  },
  {
    id: 'act4-eira-meet',
    giverId: 'eira-bergfuehrerin',
    title: 'Eira die Bergfuehrerin',
    description: 'Eira kennt geheime Pfade durch den Frost. Sprich mit ihr.',
    goal: { type: 'capture', speciesSlug: 'edelweiss', count: 1 },
    reward: { coins: 300, items: { 'great-lure': 3 } },
    storyAct: 4,
    requiredFlag: 'reached_frostkamm',
    setsFlag: 'met_eira'
  },
  {
    id: 'act4-tilda-glove',
    giverId: 'eira-bergfuehrerin',
    title: 'Tildas Handschuh',
    description: 'Iris erscheint in den Bergen und zeigt dir einen Handschuh deiner Grossmutter. Sie lebt vielleicht noch.',
    goal: { type: 'talk-to', npcId: 'iris-salbeyen' },
    reward: { items: { 'great-lure': 5 } },
    storyAct: 4,
    requiredFlag: 'met_eira',
    setsFlag: 'tilda_lives_hint',
    advancesAct: 5,
    diaryEntry: 18
  },
  // === AKT 5: SALZBUCHT plus MORDWALD ===
  {
    id: 'act5-reach-salzbucht',
    giverId: 'iris-salbeyen',
    title: 'Zur Kueste',
    description: 'Reise zur Salzbucht. Iris vermutet einen Verodyne-Hafen.',
    goal: { type: 'reach-zone', zone: 'salzbucht' },
    reward: { items: { 'heal-tonic': 5 } },
    storyAct: 5,
    requiredFlag: 'tilda_lives_hint',
    setsFlag: 'reached_salzbucht'
  },
  {
    id: 'act5-finn-ship',
    giverId: 'finn-fischer',
    title: 'Verodyne-Schiff',
    description: 'Finn hat ein Verodyne-Schiff gesehen. Hilft dir es zu untersuchen.',
    goal: { type: 'defeat-boss', bossId: 'mangrove-tyrann' },
    reward: { coins: 500, items: { 'atk-boost': 2 } },
    storyAct: 5,
    requiredFlag: 'reached_salzbucht',
    setsFlag: 'defeated_mangrove'
  },
  {
    id: 'act5-mordwald-morag',
    giverId: 'morag-sumpfklang',
    title: 'Morag die Sumpf-Schamanin',
    description: 'In Mordwald lebt Morag, eine Schamanin die mit Pflanzen redet. Suche sie auf.',
    goal: { type: 'reach-zone', zone: 'mordwald' },
    reward: { items: { 'cure-spray': 3 } },
    storyAct: 5,
    requiredFlag: 'defeated_mangrove',
    setsFlag: 'met_morag'
  },
  {
    id: 'act5-pitcher-boss',
    giverId: 'morag-sumpfklang',
    title: 'Der Pitcher-Tyrann',
    description: 'Im Sumpf-Zentrum wartet eine mutierte Karnivor-Pflanze. Bezwinge sie.',
    goal: { type: 'defeat-boss', bossId: 'pitcher-of-death' },
    reward: { coins: 600, items: { 'great-lure': 5 } },
    storyAct: 5,
    requiredFlag: 'met_morag',
    setsFlag: 'defeated_pitcher',
    advancesAct: 6,
    diaryEntry: 25
  },
  // === AKT 6: MAGMABLUETE ===
  {
    id: 'act6-reach-magmabluete',
    giverId: 'morag-sumpfklang',
    title: 'Vulkan ruft',
    description: 'Magmabluete ist Verodynes Hauptquartier. Reise dorthin.',
    goal: { type: 'reach-zone', zone: 'magmabluete' },
    reward: { items: { 'heal-tonic': 8 } },
    storyAct: 6,
    requiredFlag: 'defeated_pitcher',
    setsFlag: 'reached_magmabluete'
  },
  {
    id: 'act6-pyra-meet',
    giverId: 'pyra-glutblute',
    title: 'Pyra Glutbluete',
    description: 'Pyra kennt sich mit Pyrophyt-Pflanzen aus. Sie kann dich auf den Vulkan-Boss vorbereiten.',
    goal: { type: 'capture', speciesSlug: 'firebloom', count: 2 },
    reward: { coins: 800, items: { 'great-lure': 5 } },
    storyAct: 6,
    requiredFlag: 'reached_magmabluete',
    setsFlag: 'met_pyra'
  },
  {
    id: 'act6-magmus-rex',
    giverId: 'pyra-glutblute',
    title: 'Magmus Rex',
    description: 'Im Lava-Krater wartet Magmus Rex, ein mutiertes Vulkan-Pflanzenmonster. Bezwinge ihn.',
    goal: { type: 'defeat-boss', bossId: 'magmus-rex' },
    reward: { coins: 1200, items: { 'atk-boost': 3 } },
    storyAct: 6,
    requiredFlag: 'met_pyra',
    setsFlag: 'defeated_magmus_rex',
    advancesAct: 7,
    diaryEntry: 32
  },
  // === AKT 7: GLACIARA plus EDEN LOST ===
  {
    id: 'act7-reach-glaciara',
    giverId: 'iris-salbeyen',
    title: 'Glaciara: das Endgame',
    description: 'Iris fuehrt dich zu den Eisfeldern Glaciara. Eden Lost wartet.',
    goal: { type: 'reach-zone', zone: 'glaciara' },
    reward: { items: { 'heal-tonic': 10 } },
    storyAct: 7,
    requiredFlag: 'defeated_magmus_rex',
    setsFlag: 'reached_glaciara'
  },
  {
    id: 'act7-eden-key',
    giverId: 'iris-salbeyen',
    title: 'Eden-Schluessel',
    description: 'Sammle Symbole von allen 7 Verbuendeten um den verbotenen Garten zu oeffnen.',
    goal: { type: 'have-item', itemSlug: 'eden-key', count: 1 },
    reward: { items: { 'cure-spray': 5 } },
    storyAct: 7,
    requiredFlag: 'reached_glaciara',
    setsFlag: 'has_eden_key'
  },
  {
    id: 'act7-tilda-found',
    giverId: 'iris-salbeyen',
    title: 'Tilda gefunden',
    description: 'In Eden Lost wartet deine Grossmutter. Sie ist alt aber lebt.',
    goal: { type: 'reach-zone', zone: 'edenlost' },
    reward: { coins: 2000 },
    storyAct: 7,
    requiredFlag: 'has_eden_key',
    setsFlag: 'tilda_reunion',
    diaryEntry: 50
  },
  {
    id: 'act7-final-boss',
    giverId: 'tilda-grandma',
    title: 'Verodynicus stuerzen',
    description: 'Caspar Verodynicus wartet in Eden Lost. Bezwinge ihn in seinen 3 Phasen.',
    goal: { type: 'defeat-boss', bossId: 'verodynicus-final' },
    reward: { coins: 5000, items: { 'sun-amulet': 1 } },
    storyAct: 7,
    requiredFlag: 'tilda_reunion',
    setsFlag: 'defeated_verodynicus',
    diaryEntry: 100
  }
];

export function getQuestsByGiver(giverId: string): QuestDef[] {
  return QUESTS.filter((q) => q.giverId === giverId);
}

export function getQuest(id: string): QuestDef | undefined {
  return QUESTS.find((q) => q.id === id);
}
