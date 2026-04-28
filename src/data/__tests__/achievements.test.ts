import { describe, it, expect } from 'vitest';
import { ACHIEVEMENTS, getAchievement } from '../achievements';

describe('ACHIEVEMENTS Datenstruktur', () => {
  it('hat mindestens 5 Achievements', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(5);
  });

  it('jedes Achievement hat slug + name + description', () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.slug).toBeTruthy();
      expect(a.name).toBeTruthy();
      expect(a.description).toBeTruthy();
    }
  });

  it('keine duplizierten slugs', () => {
    const slugs = ACHIEVEMENTS.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('rewardCoins (wenn gesetzt) ist positiv', () => {
    for (const a of ACHIEVEMENTS) {
      if (a.rewardCoins !== undefined) {
        expect(a.rewardCoins).toBeGreaterThan(0);
      }
    }
  });

  it('rewardItem (wenn gesetzt) hat slug + amount > 0', () => {
    for (const a of ACHIEVEMENTS) {
      if (a.rewardItem) {
        expect(a.rewardItem.slug).toBeTruthy();
        expect(a.rewardItem.amount).toBeGreaterThan(0);
      }
    }
  });
});

describe('getAchievement', () => {
  it('liefert Achievement bei bekanntem slug', () => {
    const first = ACHIEVEMENTS[0];
    expect(getAchievement(first.slug)).toEqual(first);
  });

  it('liefert undefined bei unbekanntem slug', () => {
    expect(getAchievement('not-a-real-achievement')).toBeUndefined();
  });
});
