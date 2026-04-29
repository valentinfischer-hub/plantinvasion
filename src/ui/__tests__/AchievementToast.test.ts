/**
 * AchievementToast Unit-Tests
 * B6-R2 | S-POLISH
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { showAchievementToast, type AchievementRank } from '../AchievementToast';

// Phaser-Mock
const mockTween = { targets: null };
const mockContainer = {
  setScrollFactor: vi.fn().mockReturnThis(),
  setDepth: vi.fn().mockReturnThis(),
  setScale: vi.fn().mockReturnThis(),
  add: vi.fn(),
  destroy: vi.fn(),
};
const mockGraphics = {
  fillStyle: vi.fn().mockReturnThis(),
  fillRoundedRect: vi.fn().mockReturnThis(),
  lineStyle: vi.fn().mockReturnThis(),
  strokeRoundedRect: vi.fn().mockReturnThis(),
};
const mockText = {
  setOrigin: vi.fn().mockReturnThis(),
};

const mockScene = {
  scale: { width: 800 },
  cameras: { main: { zoom: 1 } },
  add: {
    container: vi.fn(() => mockContainer),
    graphics: vi.fn(() => mockGraphics),
    text: vi.fn(() => mockText),
  },
  tweens: {
    add: vi.fn(() => mockTween),
  },
} as unknown as import('phaser').Scene;

beforeEach(() => {
  vi.clearAllMocks();
  (mockScene.add.container as ReturnType<typeof vi.fn>).mockReturnValue(mockContainer);
  (mockContainer.setScrollFactor as ReturnType<typeof vi.fn>).mockReturnValue(mockContainer);
  (mockContainer.setDepth as ReturnType<typeof vi.fn>).mockReturnValue(mockContainer);
  (mockContainer.setScale as ReturnType<typeof vi.fn>).mockReturnValue(mockContainer);
});

describe('showAchievementToast', () => {
  it('erstellt einen Container bei Gold-Rank', () => {
    showAchievementToast(mockScene, { name: 'Erster Bloom', rank: 'gold' });
    expect(mockScene.add.container).toHaveBeenCalledOnce();
  });

  it('rendert Bronze-Rank als Standard', () => {
    showAchievementToast(mockScene, { name: 'Test' });
    expect(mockScene.add.container).toHaveBeenCalledOnce();
  });

  it('fügt Slide-In und Dismiss-Tween hinzu', () => {
    showAchievementToast(mockScene, { name: 'Tween-Test', rank: 'silver', dismissMs: 3000 });
    expect(mockScene.tweens.add).toHaveBeenCalledTimes(2);
  });

  it('rendert Beschreibung wenn angegeben', () => {
    showAchievementToast(mockScene, { name: 'Mit Desc', description: 'Erster Schritt' });
    // 4 Texte: label, name, desc + icon
    expect(mockScene.add.text).toHaveBeenCalledTimes(4);
  });

  it('rendert ohne Beschreibung nur 3 Texte', () => {
    showAchievementToast(mockScene, { name: 'Ohne Desc' });
    expect(mockScene.add.text).toHaveBeenCalledTimes(3);
  });

  const ranks: AchievementRank[] = ['bronze', 'silver', 'gold'];
  ranks.forEach((rank) => {
    it(`unterstützt Rank "${rank}"`, () => {
      expect(() =>
        showAchievementToast(mockScene, { name: 'Rank-Test', rank })
      ).not.toThrow();
    });
  });
});
