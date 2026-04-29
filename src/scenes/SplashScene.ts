import Phaser from 'phaser';

/**
 * S-POLISH-START-16 + D-041 FI-Boot-Time:
 * SplashScene als Vor-Hauptmenu-Boot.
 * - Neue User: voller Splash 3.5s mit Logo-Reveal + Pollen-Drift
 * - Returning User (localStorage 'pi_visited'): Auto-Skip nach 800ms (FI-Boost)
 * - Klick/Taste: sofortiger Skip immer verfuegbar
 */
export class SplashScene extends Phaser.Scene {
  constructor() {
    super('SplashScene');
  }

  preload(): void {
    if (!this.textures.exists('plants_sprint_1')) {
      this.load.atlas(
        'plants_sprint_1',
        'assets/atlases/plants_sprint_1.webp',
        'assets/atlases/plants_sprint_1.json'
      );
    }
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#0a0e0a');

    const cx = width / 2;
    const cy = height / 2;

    // Returning-User-Detection: schnellerer Boot
    const isReturning = (() => {
      try { return !!localStorage.getItem('pi_visited'); } catch { return false; }
    })();
    const splashDuration = isReturning ? 800 : 3500;
    try { localStorage.setItem('pi_visited', '1'); } catch { /* ignore */ }

    let switched = false;
    const goToMenu = () => {
      if (switched) return;
      switched = true;
      this.cameras.main.fadeOut(150, 0, 0, 0);
      this.time.delayedCall(160, () => this.scene.start('MenuScene'));
    };

    if (isReturning) {
      // D-041 R21: Returning-User — schneller aber nicht kahl
      const titleR = this.add.text(cx, cy - 10, 'Plantinvasion', {
        fontFamily: 'monospace', fontSize: '32px', color: '#9be36e'
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: titleR, alpha: 0.9, scale: { from: 0.92, to: 1 }, duration: 300, ease: 'Back.Out' });
      const subR = this.add.text(cx, cy + 32, '🌿 Willkommen zurück', {
        fontFamily: 'monospace', fontSize: '12px', color: '#8a6e4a'
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: subR, alpha: 1, duration: 250, delay: 150 });
      // Minimal pollen (5 statt 25)
      for (let i = 0; i < 5; i++) {
        const pp = this.add.circle(Math.random() * width, height + 10, 2, 0xfcd95c, 0.5);
        this.tweens.add({ targets: pp, y: -10, alpha: 0, duration: 800 + Math.random() * 400, delay: i * 100 });
      }
      this.input.on('pointerdown', goToMenu);
      this.input.keyboard?.on('keydown', goToMenu);
      this.time.delayedCall(splashDuration, goToMenu);
      return;
    }

    // --- Neuer User: voller Splash ---
    if (this.textures.exists('plants_sprint_1')) {
      const hero = this.add.image(cx, cy - 40, 'plants_sprint_1', 'mondlilie_bloom.webp')
        .setOrigin(0.5)
        .setScale(0)
        .setAlpha(0);
      this.tweens.add({
        targets: hero,
        scale: 1.4,
        alpha: 1,
        duration: 700,
        ease: 'Back.Out'
      });
    }

    for (let i = 0; i < 25; i++) {
      const px = Math.random() * width;
      const py = height + Math.random() * 50;
      const particle = this.add.circle(px, py, 1 + Math.random() * 2, 0xfcd95c, 0.6);
      this.tweens.add({
        targets: particle,
        y: -20,
        alpha: { from: 0.6, to: 0 },
        duration: 5500 + Math.random() * 2500,
        ease: 'Sine.easeInOut',
        repeat: -1,
        delay: Math.random() * 1500
      });
    }

    const title = this.add.text(cx, cy + 70, 'Plantinvasion', {
      fontFamily: 'monospace', fontSize: '32px', color: '#9be36e'
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 500, delay: 300 });

    // D-041 R21: Animierte Dots statt statischer Hint
    const hint = this.add.text(cx, cy + 120, 'Lädt', {
      fontFamily: 'monospace', fontSize: '11px', color: '#8a6e4a'
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: hint, alpha: 1, duration: 400, delay: 800 });
    let dots = 0;
    const dotTimer = this.time.addEvent({
      delay: 400,
      loop: true,
      startAt: 800,
      callback: () => {
        dots = (dots + 1) % 4;
        hint.setText('Lädt' + '.'.repeat(dots));
      }
    });
    void dotTimer;
    const tapHint = this.add.text(cx, cy + 136, 'Tippen zum Überspringen', {
      fontFamily: 'monospace', fontSize: '9px', color: '#5a4e3a'
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: tapHint, alpha: 0.7, duration: 300, delay: 1600 });

    const barW = 200;
    const barH = 4;
    const barX = cx - barW / 2;
    const barY = cy + 145;
    this.add.rectangle(cx, barY, barW, barH, 0x333333, 0.7).setOrigin(0.5, 0.5);
    const barFill = this.add.rectangle(barX, barY, 0, barH, 0x9be36e, 0.8).setOrigin(0, 0.5);
    // D-041 R34: Shimmer-Highlight auf Loading-Bar
    const shimmer = this.add.rectangle(barX - 16, barY, 16, barH, 0xffffff, 0.45)
      .setOrigin(0, 0.5).setDepth(1);
    this.tweens.add({
      targets: barFill,
      width: barW,
      duration: 3200,
      ease: 'Cubic.Out',
      delay: 200
    });
    // Shimmer laeuft synchron ueber die Bar
    this.tweens.add({
      targets: shimmer,
      x: barX + barW,
      duration: 3200,
      ease: 'Cubic.Out',
      delay: 200,
      onComplete: () => shimmer.destroy()
    });

    this.input.on('pointerdown', goToMenu);
    this.input.keyboard?.on('keydown', goToMenu);
    this.time.delayedCall(splashDuration, goToMenu);
  }
}
