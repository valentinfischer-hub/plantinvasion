/**
 * DailyChallengeModal - Daily-Challenge-Anzeige Panel.
 *
 * Features:
 *  - Countdown-Timer bis zur naechsten Challenge (mitternacht)
 *  - Challenge-Ziel und Belohnung anzeigen
 *  - Fortschrittsbalken
 *  - Reaktiv auf Phaser-Time-Events
 *
 * S-POLISH Batch 5 Run 8
 */
import Phaser from 'phaser';
import type { DailyChallenge } from '../systems/scoreSystem';
import { FONT_FAMILY, FONT_SIZE_BODY, FONT_SIZE_TITLE, FONT_SIZE_SMALL, COLOR_SUCCESS, COLOR_REWARD } from './uiTheme';
import { sfx } from '../audio/sfxGenerator';

export interface DailyChallengeModalData {
  challenge: DailyChallenge;
  /** Wie viel Fortschritt hat der Spieler (0..targetCount). */
  progress: number;
  /** Ist die Challenge bereits abgeschlossen? */
  isCompleted: boolean;
}


/** Berechnet verbleibende Zeit bis Mitternacht (naechste Challenge). */
export function msUntilMidnight(now = Date.now()): number {
  const d = new Date(now);
  d.setHours(24, 0, 0, 0);
  return d.getTime() - now;
}

/** Formatiert Millisekunden als HH:MM:SS. */
export function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export class DailyChallengeModal {
  private container: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;
  private countdownText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressText!: Phaser.GameObjects.Text;
  private progressBg!: Phaser.GameObjects.Graphics;
  private data: DailyChallengeModalData;
  private destroyed = false;
  private W = 320;
  private H = 200;

  constructor(scene: Phaser.Scene, x: number, y: number, data: DailyChallengeModalData) {
    this.scene = scene;
    this.data = data;
    this.container = scene.add
      .container(x, y)
      .setScrollFactor(0)
      .setDepth(2100);

    this._build();
    this._startCountdown();
  }

  private _build(): void {
    const { challenge, progress, isCompleted } = this.data;
    const { W, H } = this;

    // Hintergrund
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0e1a0e, 0.97);
    bg.fillRoundedRect(-W / 2, -H / 2, W, H, 10);
    const borderColor = isCompleted ? 0x9be36e : (0x554422 as number);
    bg.lineStyle(2, borderColor, 1);
    bg.strokeRoundedRect(-W / 2, -H / 2, W, H, 10);

    // Header
    const header = this.scene.add.text(0, -H / 2 + 16, 'Tages-Challenge', {
      fontFamily: FONT_FAMILY, fontSize: '13px', color: COLOR_REWARD, fontStyle: 'bold'
    }).setOrigin(0.5);

    // Challenge-Ziel
    const goalText = this.scene.add.text(0, -H / 2 + 40, challenge.goal, {
      fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_TITLE, color: '#e8f8d0',
      wordWrap: { width: W - 30 }, align: 'center'
    }).setOrigin(0.5);

    // Bonus-Punkte Preview
    const bonusText = this.scene.add.text(0, -H / 2 + 66,
      `Belohnung: +${challenge.bonusPoints} Punkte`, {
        fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_BODY, color: COLOR_REWARD
      }).setOrigin(0.5);

    // Progress-Bar
    const barX = -W / 2 + 20;
    const barY = -H / 2 + 88;
    const barW = W - 40;
    const barH = 14;

    this.progressBg = this.scene.add.graphics();
    this.progressBg.fillStyle(0x222222, 0.9);
    this.progressBg.fillRoundedRect(barX, barY, barW, barH, 4);
    this.progressBg.lineStyle(1, 0x556655, 1);
    this.progressBg.strokeRoundedRect(barX, barY, barW, barH, 4);

    this.progressBar = this.scene.add.graphics();
    this.progressText = this.scene.add.text(0, -H / 2 + 110,
      '', { fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_SMALL, color: '#9be36e' }
    ).setOrigin(0.5);

    // Completed Badge
    if (isCompleted) {
      const done = this.scene.add.text(0, -H / 2 + 125, '✓ Abgeschlossen!', {
        fontFamily: FONT_FAMILY, fontSize: '12px', color: COLOR_SUCCESS, fontStyle: 'bold'
      }).setOrigin(0.5);
      this.container.add(done);
      sfx.achievementJingle?.();
    }

    // Countdown bis naechste Challenge
    const countdownLabel = this.scene.add.text(0, -H / 2 + 146,
      'Naechste Challenge in:', {
        fontFamily: FONT_FAMILY, fontSize: '9px', color: '#556655'
      }).setOrigin(0.5);

    this.countdownText = this.scene.add.text(0, -H / 2 + 162, '00:00:00', {
      fontFamily: FONT_FAMILY, fontSize: '14px', color: '#8abba0', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Close-Button
    const closeBtn = this.scene.add.text(W / 2 - 10, -H / 2 + 10, '✕', {
      fontFamily: FONT_FAMILY, fontSize: '14px', color: '#556655'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerup', () => this.destroy());
    closeBtn.on('pointerover', () => closeBtn.setColor('#9be36e'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#556655'));

    this.container.add([
      bg, header, goalText, bonusText,
      this.progressBg, this.progressBar, this.progressText,
      countdownLabel, this.countdownText,
      closeBtn
    ]);

    this._updateProgress(progress);

    // Slide-in
    this.container.setAlpha(0);
    this.container.setY(this.container.y - 20);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      y: this.container.y + 20,
      duration: 250,
      ease: 'Cubic.Out'
    });
  }

  private _updateProgress(progress: number): void {
    const { challenge } = this.data;
    const pct = Math.min(1, progress / Math.max(1, challenge.targetCount));
    const barX = -this.W / 2 + 20;
    const barY = -this.H / 2 + 88;
    const barW = this.W - 40;
    const barH = 14;

    this.progressBar.clear();
    if (pct > 0) {
      this.progressBar.fillStyle(pct >= 1 ? 0x9be36e : 0x4ab84a, 1);
      this.progressBar.fillRoundedRect(barX + 1, barY + 1, Math.round((barW - 2) * pct), barH - 2, 3);
    }

    this.progressText.setText(`${Math.min(progress, challenge.targetCount)} / ${challenge.targetCount}`);
  }

  private _startCountdown(): void {
    const tick = () => {
      if (this.destroyed) return;
      const ms = msUntilMidnight();
      this.countdownText.setText(formatCountdown(ms));
    };
    tick();
    this.scene.time.addEvent({ delay: 1000, callback: tick, loop: true });
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.container.destroy();
  }
}
