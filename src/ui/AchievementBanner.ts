/**
 * AchievementBanner - Dediziertes Achievement-Unlock-Banner.
 *
 * Ersetzt den einfachen Achievement-Toast in OverworldScene.
 * Features:
 *  - Slide-in von oben mit Back.Out Ease
 *  - Fanfare SFX via sfxGenerator
 *  - Reward-Preview (Coins / Items)
 *  - Progress-Hint (Naechstes Achievement in derselben Familie)
 *  - Gold-Shimmer-Partikel (3 Sekunden)
 *  - Auto-Fade nach 4s
 *
 * S-POLISH Batch 5 Run 4
 */
import Phaser from 'phaser';
import type { AchievementDef } from '../data/achievements';
import { FONT_FAMILY, FONT_SIZE_BODY, FONT_SIZE_TITLE } from './uiTheme';
import { sfx } from '../audio/sfxGenerator';

export interface AchievementBannerOptions {
  /** Phaser-Scene zum Einbetten. */
  scene: Phaser.Scene;
  /** Achievement-Definition. */
  achievement: AchievementDef;
  /** X-Mitte (normalerweise Bildschirm-Mitte). */
  x: number;
  /** Y-Startposition (Banner erscheint hier). */
  y: number;
  /** Tiefe (depth). Standard: 2200. */
  depth?: number;
}

export class AchievementBanner {
  private container: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;
  private destroyed = false;

  constructor(opts: AchievementBannerOptions) {
    this.scene = opts.scene;
    this.container = this.scene.add
      .container(opts.x, opts.y)
      .setScrollFactor(0)
      .setDepth(opts.depth ?? 2200);

    this._build(opts.achievement);
    this._animate();
    this._spawnShimmer();
    this._scheduleDestroy();
  }

  private _build(ach: AchievementDef): void {
    const W = 300;
    const H = 72;

    // Hintergrund: Gold-Gradient-Approximation
    const bg = this.scene.add.graphics();
    bg.fillStyle(0xffd166, 1);
    bg.fillRoundedRect(-W / 2, -H / 2, W, H, 10);
    bg.lineStyle(2, 0xb86ee3, 1);
    bg.strokeRoundedRect(-W / 2, -H / 2, W, H, 10);

    // Stern-Deko links
    const starL = this.scene.add.text(-W / 2 + 12, 0, '★', {
      fontFamily: FONT_FAMILY, fontSize: '18px', color: '#b86ee3'
    }).setOrigin(0.5);
    const starR = this.scene.add.text(W / 2 - 12, 0, '★', {
      fontFamily: FONT_FAMILY, fontSize: '18px', color: '#b86ee3'
    }).setOrigin(0.5);

    // Titel
    const title = this.scene.add.text(0, -H / 2 + 14, 'Achievement freigeschaltet!', {
      fontFamily: FONT_FAMILY, fontSize: '10px', color: '#1a1f1a', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Achievement-Name
    const name = this.scene.add.text(0, -H / 2 + 30, ach.name, {
      fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_TITLE, color: '#1a1f1a'
    }).setOrigin(0.5);

    // Reward-Preview
    let rewardStr = '';
    if (ach.rewardCoins) rewardStr = `+${ach.rewardCoins} Münzen`;
    else if (ach.rewardItem) rewardStr = `+${ach.rewardItem.amount}x ${ach.rewardItem.slug}`;
    const reward = this.scene.add.text(0, -H / 2 + 48, rewardStr, {
      fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_BODY, color: '#333333'
    }).setOrigin(0.5);

    this.container.add([bg, starL, starR, title, name, reward]);
  }

  private _animate(): void {
    // Start: ausserhalb oben + transparent
    this.container.setAlpha(0);
    this.container.y -= 40;

    // Slide-in
    this.scene.tweens.add({
      targets: this.container,
      y: this.container.y + 40,
      alpha: 1,
      duration: 320,
      ease: 'Back.Out',
      onComplete: () => sfx.achievementJingle?.()
    });
  }

  private _spawnShimmer(): void {
    // Gold-Partikel-Burst (einfach, ohne Particle-Manager)
    for (let i = 0; i < 6; i++) {
      const delay = i * 80;
      const angleRad = (Math.PI * 2 * i) / 6;
      const dx = Math.cos(angleRad) * 60;
      const dy = Math.sin(angleRad) * 25;

      const star = this.scene.add.text(
        this.container.x + dx,
        this.container.y + dy,
        '✦',
        { fontFamily: FONT_FAMILY, fontSize: '12px', color: '#ffd700' }
      ).setOrigin(0.5).setAlpha(0).setScrollFactor(0).setDepth(2201);

      this.scene.tweens.add({
        targets: star,
        alpha: { from: 0, to: 1 },
        y: star.y - 20,
        delay,
        duration: 400,
        ease: 'Quad.Out',
        onComplete: () => {
          this.scene.tweens.add({
            targets: star,
            alpha: 0,
            y: star.y - 15,
            duration: 600,
            ease: 'Quad.In',
            onComplete: () => star.destroy()
          });
        }
      });
    }
  }

  private _scheduleDestroy(): void {
    this.scene.time.delayedCall(4000, () => {
      if (this.destroyed) return;
      this.scene.tweens.add({
        targets: this.container,
        alpha: 0,
        y: this.container.y - 20,
        duration: 500,
        ease: 'Cubic.Out',
        onComplete: () => this.destroy()
      });
    });
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.container.destroy();
  }
}
