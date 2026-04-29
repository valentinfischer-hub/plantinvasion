/**
 * AchievementToast — Slide-In Toast für Achievement-Unlocks.
 *
 * Slide von oben rechts rein (translateY -80 → 0), Auto-Dismiss nach 4s.
 * Bronze/Silber/Gold-Icon je nach Achievement-Rarity.
 *
 * B6-R2 | S-POLISH
 */
import Phaser from 'phaser';

export type AchievementRank = 'bronze' | 'silver' | 'gold';

export interface AchievementToastConfig {
  name: string;
  description?: string;
  rank?: AchievementRank;
  dismissMs?: number;
}

const RANK_COLORS: Record<AchievementRank, number> = {
  bronze: 0xcd7f32,
  silver: 0xc0c0c0,
  gold:   0xffd700,
};
const RANK_LABEL: Record<AchievementRank, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold:   '🥇',
};

const TOAST_W = 280;
const TOAST_H = 60;
const MARGIN_RIGHT = 12;
const MARGIN_TOP = 12;

/**
 * Zeigt einen Achievement-Toast oben rechts im Screen.
 * Slide-In von oben (Y: -TOAST_H - MARGIN_TOP → MARGIN_TOP + TOAST_H/2).
 * @param scene - Die aktive Phaser.Scene
 * @param config - Toast-Konfiguration
 */
export function showAchievementToast(
  scene: Phaser.Scene,
  config: AchievementToastConfig
): void {
  const { name, description, rank = 'bronze', dismissMs = 4000 } = config;
  const { width } = scene.scale;
  const cam = scene.cameras.main;
  const z = cam.zoom || 1;

  const rankColor = RANK_COLORS[rank];
  const rankIcon  = RANK_LABEL[rank];

  // Start-Position: ausserhalb des Screens oben
  const targetY = (MARGIN_TOP + TOAST_H / 2) / z;
  const startY  = (-TOAST_H - MARGIN_TOP) / z;
  const targetX = (width - TOAST_W / 2 - MARGIN_RIGHT) / z;

  const container = scene.add
    .container(targetX, startY)
    .setScrollFactor(0)
    .setDepth(2200)
    .setScale(1 / z);

  // Hintergrund
  const bg = scene.add.graphics();
  bg.fillStyle(0x1a2418, 0.96);
  bg.fillRoundedRect(-TOAST_W / 2, -TOAST_H / 2, TOAST_W, TOAST_H, 8);
  bg.lineStyle(2, rankColor, 1);
  bg.strokeRoundedRect(-TOAST_W / 2, -TOAST_H / 2, TOAST_W, TOAST_H, 8);
  // Linker farbiger Akzent-Balken
  bg.fillStyle(rankColor, 0.9);
  bg.fillRoundedRect(-TOAST_W / 2, -TOAST_H / 2, 6, TOAST_H, { tl: 8, bl: 8, tr: 0, br: 0 });
  container.add(bg);

  // Rank-Icon
  const iconText = scene.add.text(
    -TOAST_W / 2 + 20, 0, rankIcon,
    { fontFamily: 'monospace', fontSize: '20px' }
  ).setOrigin(0.5);
  container.add(iconText);

  // "Achievement freigeschaltet!" Label
  const label = scene.add.text(
    -TOAST_W / 2 + 40, -14,
    'Achievement freigeschaltet!',
    { fontFamily: 'monospace', fontSize: '9px', color: '#aaaaaa' }
  ).setOrigin(0, 0.5);
  container.add(label);

  // Achievement-Name
  const nameText = scene.add.text(
    -TOAST_W / 2 + 40, 2,
    name,
    { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' }
  ).setOrigin(0, 0.5);
  container.add(nameText);

  // Beschreibung (optional, klein)
  if (description) {
    const descText = scene.add.text(
      -TOAST_W / 2 + 40, 17,
      description,
      { fontFamily: 'monospace', fontSize: '8px', color: '#888888' }
    ).setOrigin(0, 0.5);
    container.add(descText);
  }

  // Slide-In
  scene.tweens.add({
    targets: container,
    y: targetY,
    duration: 320,
    ease: 'Cubic.Out',
  });

  // Auto-Dismiss: nach dismissMs ausblenden + wegsliden
  scene.tweens.add({
    targets: container,
    y: startY,
    alpha: 0,
    duration: 400,
    delay: dismissMs,
    ease: 'Cubic.In',
    onComplete: () => container.destroy(),
  });
}
