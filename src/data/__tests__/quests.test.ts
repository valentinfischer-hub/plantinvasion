import { describe, it, expect } from 'vitest';
import { QUESTS, getQuestsByGiver, getQuest } from '../quests';

describe('QUESTS Datenstruktur', () => {
  it('hat mindestens 5 Quests', () => {
    expect(QUESTS.length).toBeGreaterThanOrEqual(5);
  });

  it('jede Quest hat id, giverId, title, description, goal, reward', () => {
    for (const q of QUESTS) {
      expect(q.id).toBeTruthy();
      expect(q.giverId).toBeTruthy();
      expect(q.title).toBeTruthy();
      expect(q.description).toBeTruthy();
      expect(q.goal).toBeDefined();
      expect(q.reward).toBeDefined();
    }
  });

  it('keine duplizierten quest-IDs', () => {
    const ids = QUESTS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('storyAct (wenn gesetzt) ist 1-7', () => {
    for (const q of QUESTS) {
      if (q.storyAct !== undefined) {
        expect(q.storyAct).toBeGreaterThanOrEqual(1);
        expect(q.storyAct).toBeLessThanOrEqual(7);
      }
    }
  });

  it('reward.coins (wenn gesetzt) ist positiv', () => {
    for (const q of QUESTS) {
      if (q.reward.coins !== undefined) {
        expect(q.reward.coins).toBeGreaterThan(0);
      }
    }
  });

  it('goal-types sind valide', () => {
    const validTypes = new Set(['capture', 'discover', 'have-item', 'have-plant', 'talk-to', 'reach-zone', 'defeat-boss']);
    for (const q of QUESTS) {
      expect(validTypes.has(q.goal.type)).toBe(true);
    }
  });
});

describe('getQuestsByGiver', () => {
  it('liefert alle Quests von einem giver', () => {
    const lyraQuests = getQuestsByGiver('lyra');
    expect(lyraQuests.length).toBeGreaterThan(0);
    for (const q of lyraQuests) {
      expect(q.giverId).toBe('lyra');
    }
  });

  it('liefert leeres Array bei unbekanntem giver', () => {
    expect(getQuestsByGiver('not-a-real-npc')).toEqual([]);
  });
});

describe('getQuest', () => {
  it('liefert Quest bei bekannter ID', () => {
    const first = QUESTS[0];
    expect(getQuest(first.id)).toEqual(first);
  });

  it('liefert undefined bei unbekannter ID', () => {
    expect(getQuest('not-a-real-quest')).toBeUndefined();
  });
});
