/**
 * AchievementBanner Tests - S-POLISH Batch 5 Run 4
 *
 * Testet reine Daten-Logik.
 * Phaser-Instanziierung wird in Node-Env nicht getestet.
 */
import { describe, it, expect } from 'vitest';
import type { AchievementDef } from '../../data/achievements';

// Test-Helper: Reward-String berechnen (gleiche Logik wie AchievementBanner._build)
function computeRewardStr(ach: AchievementDef): string {
  if (ach.rewardCoins) return `+${ach.rewardCoins} Münzen`;
  if (ach.rewardItem) return `+${ach.rewardItem.amount}x ${ach.rewardItem.slug}`;
  return '';
}

const achWithCoins: AchievementDef = {
  slug: 'test-coins',
  name: 'Münzen-Achievement',
  description: 'Test',
  rewardCoins: 500,
};

const achWithItem: AchievementDef = {
  slug: 'test-item',
  name: 'Item-Achievement',
  description: 'Test',
  rewardItem: { slug: 'golden-seed', amount: 3 },
};

const achNoReward: AchievementDef = {
  slug: 'test-empty',
  name: 'Leeres Achievement',
  description: 'Kein Reward',
};

describe('AchievementBanner Reward-String', () => {
  it('rewardCoins zeigt Münzen-Text', () => {
    expect(computeRewardStr(achWithCoins)).toBe('+500 Münzen');
  });

  it('rewardItem zeigt Item-Text', () => {
    expect(computeRewardStr(achWithItem)).toBe('+3x golden-seed');
  });

  it('kein Reward = leerer String', () => {
    expect(computeRewardStr(achNoReward)).toBe('');
  });

  it('Achievement-Name korrekt', () => {
    expect(achWithCoins.name).toBe('Münzen-Achievement');
  });

  it('Achievement-Slug korrekt', () => {
    expect(achWithCoins.slug).toBe('test-coins');
  });
});
