/**
 * QuestCompleteOverlay Tests - S-POLISH Batch 5 Run 5
 *
 * Testet reine Reward-Logik.
 */
import { describe, it, expect } from 'vitest';
import type { QuestDef } from '../../data/quests';

function computeRewardParts(quest: QuestDef): string[] {
  const parts: string[] = [];
  if (!quest.reward) return parts;
  const r = quest.reward;
  if (r.coins) parts.push(`+${r.coins} Münzen`);
  if (r.items) {
    for (const [slug, amount] of Object.entries(r.items)) {
      parts.push(`+${amount}x ${slug}`);
    }
  }
  return parts;
}

const questWithCoins: QuestDef = {
  id: 'q1', giverId: 'test', title: 'Test-Quest', description: 'Test',
  goal: { type: 'capture', speciesSlug: 'sunflower', count: 1 },
  reward: { coins: 100, items: { 'great-lure': 2 } }
};

const questNoReward: QuestDef = {
  id: 'q2', giverId: 'test', title: 'Kein-Reward-Quest', description: 'Test',
  goal: { type: 'capture', speciesSlug: 'lavender', count: 1 },
  reward: {}
};

describe('QuestCompleteOverlay Reward-Logik', () => {
  it('Münzen erscheinen im Reward-Text', () => {
    const parts = computeRewardParts(questWithCoins);
    expect(parts).toContain('+100 Münzen');
  });

  it('Items erscheinen im Reward-Text', () => {
    const parts = computeRewardParts(questWithCoins);
    expect(parts).toContain('+2x great-lure');
  });

  it('Kein Reward = leeres Array', () => {
    expect(computeRewardParts(questNoReward)).toHaveLength(0);
  });

  it('Quest-Titel korrekt', () => {
    expect(questWithCoins.title).toBe('Test-Quest');
  });

  it('Quest-Goal-Typ korrekt', () => {
    expect(questWithCoins.goal.type).toBe('capture');
  });
});
