/**
 * QuestCompleteOverlay - Animation wenn eine Quest abgeschlossen wird.
 *
 * Features:
 *  - Slide-in Panel mit Quest-Titel
 *  - Reward-Reveal Sequenz (sequenzielle Einblendung)
 *  - Konfetti-artige Partikel
 *  - SFX: harvest (Erfolgsakkord)
 *  - Auto-Destroy nach 5s oder bei Tap/Click
 *
 * Wird aus OverworldScene/BattleScene aufgerufen wenn Quest-Trigger feuert.
 *
 * S-POLISH Batch 5 Run 5
 */
import Phaser from 'phaser';
import type { QuestDef } from '../data/quests';
import { FONT_FAMILY, FONT_SIZE_TITLE, FONT_SIZE_BODY, COLOR_SUCCESS, COLOR_REWARD } from './uiTheme';
import { sfx } from '../audio/sfxGenerator';

export class QuestCompleteOverlay {
  private container: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;
  private destroyed = false;

  constructor(scene: Phaser.Scene, quest: QuestDef, x: number, y: number) {
    this.scene = scene;
    this.container = scene.add
      .container(x, y)
      .setScrollFactor(0)
      .setDepth(2300);

    this._build(quest);
    this._animateIn();
    this._spawnConfetti();
    this._scheduleFadeOut();
  }

  private _build(quest: QuestDef): void {
    const W = 310;
    const H = 120;

    // Hintergrund
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a3020, 0.97);
    bg.fillRoundedRect(-W / 2, -H / 2, W, H, 10);
    bg.lineStyle(3, 0x4ab84a, 1);
    bg.strokeRoundedRect(-W / 2, -H / 2, W, H, 10);

    // Checkmark-Icon
    const check = this.scene.add.text(-W / 2 + 20, 0, '✓', {
      fontFamily: FONT_FAMILY, fontSize: '28px', color: COLOR_SUCCESS
    }).setOrigin(0.5);

    // Header
    const header = this.scene.add.text(0, -H / 2 + 16, 'Quest abgeschlossen!', {
      fontFamily: FONT_FAMILY, fontSize: '11px', color: COLOR_SUCCESS, fontStyle: 'bold'
    }).setOrigin(0.5);

    // Quest-Titel
    const title = this.scene.add.text(0, -H / 2 + 35, quest.title, {
      fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_TITLE, color: '#e8f8d0'
    }).setOrigin(0.5);

    // Reward-Zeile (mit Delay sichtbar machen)
    const rewardItems: Phaser.GameObjects.Text[] = [];
    if (quest.reward) {
      const r = quest.reward;
      const parts: string[] = [];
      if (r.coins) parts.push(`+${r.coins} Münzen`);
      // xp field optional
      if (r.items) {
        for (const [slug, amount] of Object.entries(r.items)) {
          parts.push(`+${amount}x ${slug}`);
        }
      }
      for (let i = 0; i < parts.length; i++) {
        const rText = this.scene.add.text(0, -H / 2 + 55 + i * 18, parts[i]!, {
          fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_BODY, color: COLOR_REWARD
        }).setOrigin(0.5).setAlpha(0);
        rewardItems.push(rText);
      }
    }

    // Close-Hint
    const closeHint = this.scene.add.text(W / 2 - 10, H / 2 - 14, 'Tippen zum Schliessen', {
      fontFamily: FONT_FAMILY, fontSize: '8px', color: '#556655'
    }).setOrigin(1, 1);

    this.container.add([bg, check, header, title, closeHint, ...rewardItems]);

    // Reward-Reveal Sequenz (gestaffelt)
    rewardItems.forEach((t, i) => {
      this.scene.time.delayedCall(600 + i * 250, () => {
        if (this.destroyed) return;
        this.scene.tweens.add({
          targets: t, alpha: 1, duration: 300, ease: 'Cubic.Out'
        });
        sfx.coin?.();
      });
    });

    // Tap-to-close
    bg.setInteractive(
      new Phaser.Geom.Rectangle(-W / 2, -H / 2, W, H),
      Phaser.Geom.Rectangle.Contains
    );
    bg.on('pointerup', () => this.destroy());
  }

  private _animateIn(): void {
    this.container.setAlpha(0);
    this.container.setScale(0.8);

    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 350,
      ease: 'Back.Out',
      onComplete: () => sfx.harvest?.()
    });
  }

  private _spawnConfetti(): void {
    const colors = ['#9be36e', '#fcd95c', '#70aaff', '#ff9ecc', '#b86ee3'];
    for (let i = 0; i < 8; i++) {
      const c = colors[i % colors.length]!;
      const angle = (Math.PI * 2 * i) / 8;
      const dist = 80 + Math.random() * 40;
      const tx = this.container.x + Math.cos(angle) * dist;
      const ty = this.container.y + Math.sin(angle) * dist * 0.5;
      const dot = this.scene.add.text(
        this.container.x, this.container.y, '●',
        { fontFamily: FONT_FAMILY, fontSize: '8px', color: c }
      ).setOrigin(0.5).setAlpha(0).setScrollFactor(0).setDepth(2301);

      this.scene.tweens.add({
        targets: dot,
        x: tx, y: ty,
        alpha: { from: 0, to: 1 },
        duration: 500, delay: i * 60, ease: 'Quad.Out',
        onComplete: () => {
          this.scene.tweens.add({
            targets: dot, alpha: 0, duration: 400, delay: 800,
            onComplete: () => dot.destroy()
          });
        }
      });
    }
  }

  private _scheduleFadeOut(): void {
    this.scene.time.delayedCall(5000, () => {
      if (this.destroyed) return;
      this.scene.tweens.add({
        targets: this.container,
        alpha: 0,
        y: this.container.y - 30,
        duration: 600,
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
