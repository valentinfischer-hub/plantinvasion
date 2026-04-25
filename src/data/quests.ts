/**
 * Quest-Katalog V0.1 fuer Plantinvasion.
 * Quests werden von NPCs gegeben und im gameStore.questState getracked.
 */

export type QuestStatus = 'pending' | 'active' | 'completed';

export type QuestGoal =
  | { type: 'capture'; speciesSlug: string; count: number }
  | { type: 'discover'; speciesSlug: string; count: number }
  | { type: 'have-item'; itemSlug: string; count: number }
  | { type: 'have-plant'; speciesSlug: string; count: number };

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
];

export function getQuestsByGiver(giverId: string): QuestDef[] {
  return QUESTS.filter((q) => q.giverId === giverId);
}

export function getQuest(id: string): QuestDef | undefined {
  return QUESTS.find((q) => q.id === id);
}
