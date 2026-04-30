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
    // R54: Browser-Tab-Title + Favicon setzen
    try {
      // R78: Dynamischer Tab-Title mit Phase-Anzeige
      document.title = 'Plantinvasion | Laedt...';
      // Nach kurzer Verzoegerung auf finalen Namen
      setTimeout(() => {
        if (document.title === 'Plantinvasion | Laedt...') {
          document.title = 'Plantinvasion — Cozy Botanik-RPG';
        }
      }, 2000);
      let favicon = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      // Einfaches SVG-Favicon: gruenes Blatt
      // R78: Verbessertes SVG-Favicon mit Blatt-Form statt Emoji (bessere Browser-Compat)
      const svgFav = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="16" fill="#1a2820"/>
        <ellipse cx="16" cy="17" rx="7" ry="10" fill="#4a8228" transform="rotate(-20 16 17)"/>
        <ellipse cx="16" cy="17" rx="7" ry="10" fill="#6abf3a" transform="rotate(-20 16 17)" opacity="0.7"/>
        <line x1="16" y1="24" x2="14" y2="8" stroke="#2a5a14" stroke-width="1.2" stroke-linecap="round"/>
      </svg>`;
      favicon.href = 'data:image/svg+xml,' + encodeURIComponent(svgFav);
    } catch { /* ignorieren falls nicht verfuegbar */ }

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
      fontFamily: 'monospace', fontSize: '32px', color: '#9be36e',
      stroke: '#1a3a1a', strokeThickness: 2
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 500, delay: 300,
      onComplete: () => {
        // D-041 R37: Sanftes Scale-Breathing auf Titel + Sparkle-Dots
        this.tweens.add({
          targets: title, scale: { from: 1, to: 1.03 },
          duration: 2400, ease: 'Sine.InOut', yoyo: true, repeat: -1
        });
        // 8 Sparkle-Dots rund um den Titel
        for (let si = 0; si < 8; si++) {
          const angle = (Math.PI * 2 * si) / 8;
          const r = 90 + Math.random() * 30;
          const sx = cx + Math.cos(angle) * r;
          const sy = (cy + 70) + Math.sin(angle) * 22;
          const spark = this.add.circle(sx, sy, 2, 0xfcd95c, 0)
            .setDepth(2);
          this.tweens.add({
            targets: spark, alpha: { from: 0, to: 0.85 },
            duration: 500 + si * 80, ease: 'Cubic.Out',
            yoyo: true, repeat: -1,
            delay: 200 + si * 100
          });
        }
      }
    });

    // R46: Tagline fuer persoenliche Note beim Loading
    const tagline = this.add.text(cx, cy + 96, 'Zueichte. Entdecke. Staune.', {
      fontFamily: 'monospace', fontSize: '11px', color: '#6a9e4a'
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: tagline, alpha: 0.75, duration: 700, delay: 950, ease: 'Cubic.Out' });

    // D-041 R21: Animierte Dots statt statischer Hint
    const hint = this.add.text(cx, cy + 120, 'Lädt', {
      fontFamily: 'monospace', fontSize: '11px', color: '#8a6e4a'
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: hint, alpha: 1, duration: 400, delay: 800 });
    let dots = 0;
    this.time.addEvent({
      delay: 400,
      loop: true,
      startAt: 800,
      callback: () => {
        dots = (dots + 1) % 4;
        hint.setText('Lädt' + '.'.repeat(dots));
      }
    });
    const tapHint = this.add.text(cx, cy + 136, 'Tippen zum Überspringen', {
      fontFamily: 'monospace', fontSize: '9px', color: '#5a4e3a'
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: tapHint, alpha: 0.7, duration: 300, delay: 1600 });

    // R68: Loading-Bar poliert — breiter, hoher, mit Glow-Rahmen + Shimmer
    const barW = 240;
    const barH = 6;
    const barX = cx - barW / 2;
    const barY = cy + 148;
    // Aeusserer Glow-Rahmen
    const barGlow = this.add.rectangle(cx, barY, barW + 6, barH + 6, 0x9be36e, 0)
      .setOrigin(0.5, 0.5);
    this.tweens.add({
      targets: barGlow, alpha: 0.15, duration: 600, delay: 800,
      yoyo: true, repeat: -1, ease: 'Sine.InOut'
    });
    // Hintergrund-Leiste
    this.add.rectangle(cx, barY, barW, barH, 0x333333, 0.8).setOrigin(0.5, 0.5);
    // Fortschritts-Fill
    const barFill = this.add.rectangle(barX, barY, 0, barH, 0x9be36e, 0.9).setOrigin(0, 0.5);
    // D-041 R34 + R68: Shimmer-Highlight auf Loading-Bar
    const shimmer = this.add.rectangle(barX - 20, barY, 20, barH, 0xffffff, 0.55)
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
