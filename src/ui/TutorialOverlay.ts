import Phaser from 'phaser';
import { gameStore } from '../state/gameState';
import { sfx } from '../audio/sfxGenerator';

export interface TutorialStep {
  step: number;
  title: string;
  text: string;
  advanceWhen?: (ctx: { tileX: number; tileY: number; facing: string; isMoving: boolean; lastInteract?: string }) => boolean;
}

// D-041 R19: Tutorial-Texte ueberarbeitet — persoenlicher, klarer, Stardew-Warmth
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    step: 0,
    title: '\u{1F33F} Willkommen, Tilda!',
    text: 'Wurzelheim begruesst dich. Du bist die wandernde Botanikerin,\ndie dieses Tal mit seltenen Pflanzen erfuellen wird.\nDruecke [Weiter] \u2014 dein Abenteuer beginnt jetzt.'
  },
  {
    step: 1,
    title: '\u{1F463} Erste Schritte',
    text: 'Bewege dich mit W A S D oder den Pfeiltasten.\nShift = Rennen. Probier es aus \u2014 lauf einfach irgendwohin!',
    advanceWhen: (ctx) => ctx.tileX !== 14 || ctx.tileY !== 17
  },
  {
    step: 2,
    title: '\u{1F4AC} Die Dorfbewohner',
    text: 'Anya, Bjoern und Clara stehen bei den Marktstaenden.\nLauf zu einem und druecke E \u2014 sie haben Tipps fuer dich.',
    advanceWhen: (ctx) => ctx.lastInteract === 'npc'
  },
  {
    step: 3,
    title: '\u{1FAB4} Dein Garten wartet',
    text: 'Die goldene Tuer am Spielerhaus fuehrt zu deinem Garten.\nDein erster Sämling ist schon eingepflanzt.\nX = Kreuzen   O = Zurück zur Overworld',
    advanceWhen: (ctx) => ctx.lastInteract === 'garden'
  },
  {
    step: 4,
    title: '\u{1F5FA}\uFE0F Alles im Ueberblick',
    text: 'M = Markt     P = Pokédex     Q = Quests\nE = Reden      Shift = Rennen\n\nViel Freude beim Zuechten! \u{1F331}'
  }
];

/**
 * Tutorial-Overlay rendert in einer separaten UI-Camera die nicht mit der World-Camera zoomed.
 * Die Main-Camera ignoriert die Tutorial-Objekte, die UI-Camera ignoriert den Rest.
 *
 * D-041 R71: Fullscreen-Dimmer auf Step 0 fuer maximalen First-Impression-Impact.
 *   - Schritt 0: dunkles Overlay ueber gesamtem Viewport, groessere Box in Bildmitte
 *   - Schritte 1-4: kompakte Box unten wie bisher
 *   - R72: WASD-Key-Visualizer als Overlay-Grafik auf Step 1
 *   - R73: Puls-Ring auf Garten-Arrow bei Step 3
 */
export class TutorialOverlay {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private titleText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private currentStep = -1;
  private uiCam!: Phaser.Cameras.Scene2D.Camera;
  private progressDots: Phaser.GameObjects.Arc[] = [];
  public lastInteract: string | undefined;
  private arrowHint?: Phaser.GameObjects.Text;
  private arrowTween?: Phaser.Tweens.Tween;
  // R71: Fullscreen-Dimmer fuer Step 0
  private fullscreenDimmer?: Phaser.GameObjects.Rectangle;
  // R72: WASD-Visualizer fuer Step 1
  private wasdContainer?: Phaser.GameObjects.Container;
  // R73: Puls-Ring Tween fuer Step 3
  private pulseRings: Phaser.GameObjects.Arc[] = [];
  private pulseRingTimer?: Phaser.Time.TimerEvent;
  // Typewriter-State
  private typewriterTimer?: Phaser.Time.TimerEvent;
  private typewriterFull = '';
  private typewriterIdx = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.build();
    this.refresh();
  }

  private build(): void {
    const cam = this.scene.cameras.main;
    const W = cam.width;
    const H = cam.height;

    // UI-Camera (zoom 1, deckt ganzes viewport)
    this.uiCam = this.scene.cameras.add(0, 0, W, H);
    this.uiCam.setZoom(1);
    this.uiCam.setScroll(0, 0);

    // R71: Fullscreen-Dimmer (nur auf Step 0 sichtbar)
    this.fullscreenDimmer = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.78)
      .setDepth(2490)
      .setAlpha(0);

    // Kompakte Box unten (Steps 1-4)
    const w = W - 24;
    const h = 130;
    const cx = W / 2;
    const cy = H - h / 2 - 12;

    this.container = this.scene.add.container(cx, cy);
    this.container.setDepth(2500);

    const bg = this.scene.add.rectangle(0, 0, w, h, 0x000000, 0.92)
      .setStrokeStyle(2, 0xfcd95c);
    // Tilda-Avatar-Icon links oben (gruener Kreis mit Blatt-Symbol)
    const avatarCircle = this.scene.add.circle(-w / 2 + 22, -h / 2 + 22, 14, 0x2a4a2a, 1)
      .setStrokeStyle(2, 0x9be36e);
    const avatarLeaf = this.scene.add.text(-w / 2 + 22, -h / 2 + 22, '\u{1F33F}', {
      fontFamily: 'monospace', fontSize: '14px'
    }).setOrigin(0.5);
    this.titleText = this.scene.add.text(-w / 2 + 44, -h / 2 + 10, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#fcd95c', fontStyle: 'bold'
    });
    this.bodyText = this.scene.add.text(-w / 2 + 12, -h / 2 + 36, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#ffffff',
      wordWrap: { width: w - 24 }
    });
    // R73: Arrow-Hint mit Puls-Ring fuer Step 3 (Garten-Tuer)
    this.arrowHint = this.scene.add.text(0, -h / 2 - 28, '\u{2B07} Garten-Eingang', {
      fontFamily: 'monospace', fontSize: '11px', color: '#9be36e',
      backgroundColor: '#0a1a0a', padding: { x: 6, y: 3 }
    }).setOrigin(0.5).setAlpha(0);

    const nextBtn = this.makeButton(w / 2 - 60, h / 2 - 18, 'Weiter', '#9be36e', () => this.handleNext());
    const skipBtn = this.makeButton(-w / 2 + 50, h / 2 - 18, 'Skip', '#ff7e7e', () => this.handleSkip());

    // Progress-Dots
    this.progressDots = [];
    for (let di = 0; di < TUTORIAL_STEPS.length; di++) {
      const dot = this.scene.add.circle(-((TUTORIAL_STEPS.length - 1) * 10) / 2 + di * 10, h / 2 - 36, 3, 0x555555, 1);
      this.progressDots.push(dot);
      this.container.add(dot);
    }

    this.container.add([bg, avatarCircle, avatarLeaf, this.arrowHint!, this.titleText, this.bodyText, nextBtn, skipBtn]);

    // Camera-Routing
    cam.ignore(this.container);
    cam.ignore(this.fullscreenDimmer);
    this.scene.children.list.forEach((obj) => {
      if (obj !== this.container && obj !== this.fullscreenDimmer) {
        this.uiCam.ignore(obj);
      }
    });
  }

  private makeButton(x: number, y: number, label: string, color: string, onClick: () => void): Phaser.GameObjects.Container {
    const c = this.scene.add.container(x, y);
    const w = 90;
    const h = 26;
    const bg = this.scene.add.rectangle(0, 0, w, h, 0x222222, 0.95)
      .setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(color).color)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    const txt = this.scene.add.text(0, 0, label, {
      fontFamily: 'monospace', fontSize: '11px', color
    }).setOrigin(0.5);
    bg.on('pointerover', () => {
      bg.setFillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.15);
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0x222222, 0.95);
    });
    bg.on('pointerdown', () => {
      this.scene.tweens.add({ targets: c, scale: 0.93, duration: 60, ease: 'Cubic.Out' });
    });
    bg.on('pointerup', () => {
      this.scene.tweens.add({ targets: c, scale: 1.0, duration: 80, ease: 'Back.Out' });
      sfx.dialogAdvance();
      onClick();
    });
    c.add([bg, txt]);
    return c;
  }

  /** R71: Typewriter-Effekt fuer Step-Text */
  private startTypewriter(text: string): void {
    if (this.typewriterTimer) { this.typewriterTimer.destroy(); this.typewriterTimer = undefined; }
    this.typewriterFull = text;
    this.typewriterIdx = 0;
    this.bodyText.setText('');
    const advance = () => {
      if (this.typewriterIdx >= text.length) return;
      this.typewriterIdx++;
      this.bodyText.setText(text.slice(0, this.typewriterIdx));
      const ch = text[this.typewriterIdx - 1] ?? '';
      const delay = ch === '.' || ch === '!' || ch === '?' ? 220 : ch === ',' ? 90 : 22;
      this.typewriterTimer = this.scene.time.delayedCall(delay, advance);
    };
    advance();
  }

  /** R72: WASD-Key-Visualizer fuer Step 1 */
  private buildWasdVisualizer(): void {
    if (this.wasdContainer) { this.wasdContainer.destroy(); this.wasdContainer = undefined; }
    const cam = this.scene.cameras.main;
    const W = cam.width;
    const H = cam.height;
    // Klein oben-rechts positioniert (WASD + Arrows Erklarung)
    const vx = W / 2 + 80;
    const vy = H - 160;
    this.wasdContainer = this.scene.add.container(vx, vy).setDepth(2510);

    const makeKey = (x: number, y: number, label: string, highlight = false) => {
      const bg = this.scene.add.rectangle(x, y, 24, 22, highlight ? 0x4a8228 : 0x222222, 0.95)
        .setStrokeStyle(1, highlight ? 0x9be36e : 0x555555).setOrigin(0.5);
      const txt = this.scene.add.text(x, y, label, {
        fontFamily: 'monospace', fontSize: '9px', color: highlight ? '#9be36e' : '#aaaaaa'
      }).setOrigin(0.5);
      this.wasdContainer!.add([bg, txt]);
    };
    makeKey(0, -24, 'W', true);
    makeKey(-26, 0, 'A', true);
    makeKey(0, 0, 'S', true);
    makeKey(26, 0, 'D', true);
    const arrowLabel = this.scene.add.text(0, 22, 'oder Pfeiltasten', {
      fontFamily: 'monospace', fontSize: '8px', color: '#888888'
    }).setOrigin(0.5);
    this.wasdContainer.add(arrowLabel);

    // Fade-in
    this.wasdContainer.setAlpha(0);
    this.scene.tweens.add({ targets: this.wasdContainer, alpha: 1, duration: 400, ease: 'Cubic.Out' });
    // UI-Cam muss neues Objekt ignorieren auf Main; UI-Cam soll es sehen
    this.scene.cameras.main.ignore(this.wasdContainer);
  }

  private destroyWasdVisualizer(): void {
    if (this.wasdContainer) {
      this.scene.tweens.add({
        targets: this.wasdContainer, alpha: 0, duration: 200, ease: 'Cubic.Out',
        onComplete: () => { this.wasdContainer?.destroy(); this.wasdContainer = undefined; }
      });
    }
  }

  /** R73: Puls-Ring-Emitter fuer Step 3 Arrow */
  private startPulseRings(): void {
    this.stopPulseRings();
    const cam = this.scene.cameras.main;
    const H = cam.height;
    // Rings entstehen um den Arrow-Hint-Bereich herum
    const spawnRing = () => {
      const ring = this.scene.add.arc(cam.width / 2, H - 175, 30, 0, 360, false, 0x9be36e, 0)
        .setStrokeStyle(2, 0x9be36e, 0.7)
        .setDepth(2495);
      this.pulseRings.push(ring);
      this.scene.cameras.main.ignore(ring);
      this.scene.tweens.add({
        targets: ring,
        scaleX: 3.5,
        scaleY: 3.5,
        alpha: 0,
        duration: 1000,
        ease: 'Cubic.Out',
        onComplete: () => {
          ring.destroy();
          this.pulseRings = this.pulseRings.filter(r => r !== ring);
        }
      });
    };
    spawnRing();
    this.pulseRingTimer = this.scene.time.addEvent({ delay: 1200, loop: true, callback: spawnRing });
  }

  private stopPulseRings(): void {
    if (this.pulseRingTimer) { this.pulseRingTimer.destroy(); this.pulseRingTimer = undefined; }
    this.pulseRings.forEach(r => r.destroy());
    this.pulseRings = [];
  }

  private handleNext(): void {
    // Skip typewriter wenn noch laeuft
    if (this.typewriterTimer && this.typewriterIdx < this.typewriterFull.length) {
      this.typewriterTimer.destroy(); this.typewriterTimer = undefined;
      this.bodyText.setText(this.typewriterFull);
      this.typewriterIdx = this.typewriterFull.length;
      return;
    }
    const t = gameStore.getTutorial();
    if (t.done) return;
    if (t.step < TUTORIAL_STEPS.length - 1) {
      gameStore.advanceTutorial(t.step + 1);
    } else {
      gameStore.skipTutorial();
    }
    this.refresh();
  }

  private handleSkip(): void {
    gameStore.skipTutorial();
    this.refresh();
  }

  public checkAdvance(ctx: { tileX: number; tileY: number; facing: string; isMoving: boolean }): void {
    const t = gameStore.getTutorial();
    if (t.done) return;
    const def = TUTORIAL_STEPS.find((s) => s.step === t.step);
    if (!def?.advanceWhen) return;
    const fullCtx = { ...ctx, lastInteract: this.lastInteract };
    if (def.advanceWhen(fullCtx)) {
      gameStore.advanceTutorial(t.step + 1);
      sfx.pickup();
      this.refresh();
    }
  }

  public markInteract(kind: 'npc' | 'garden' | 'market' | 'pokedex' | 'quest'): void {
    this.lastInteract = kind;
  }

  public refresh(): void {
    const t = gameStore.getTutorial();
    if (t.done) {
      this.container.setVisible(false);
      this.fullscreenDimmer?.setAlpha(0);
      this.destroyWasdVisualizer();
      this.stopPulseRings();
      return;
    }
    const def = TUTORIAL_STEPS.find((s) => s.step === t.step);
    if (!def) {
      this.container.setVisible(false);
      return;
    }
    this.container.setVisible(true);
    this.titleText.setText(\`(\${t.step + 1}/\${TUTORIAL_STEPS.length})  \${def.title}\`);

    // R71: Typewriter fuer Body-Text
    this.startTypewriter(def.text);

    // Progress-Dots aktualisieren
    this.progressDots.forEach((dot, i) => {
      dot.setFillStyle(i <= t.step ? 0xfcd95c : 0x555555);
      dot.setScale(i === t.step ? 1.4 : 1);
    });
    if (this.currentStep !== t.step) {
      sfx.dialogOpen();
      this.currentStep = t.step;
    }

    // R71: Fullscreen-Dimmer nur auf Step 0
    if (t.step === 0 && this.fullscreenDimmer) {
      this.scene.tweens.add({ targets: this.fullscreenDimmer, alpha: 1, duration: 400, ease: 'Cubic.Out' });
      // Box zur Bildmitte verschieben
      const cam = this.scene.cameras.main;
      this.scene.tweens.add({
        targets: this.container,
        x: cam.width / 2,
        y: cam.height / 2,
        duration: 300,
        ease: 'Back.Out'
      });
    } else if (this.fullscreenDimmer && this.fullscreenDimmer.alpha > 0) {
      this.scene.tweens.add({ targets: this.fullscreenDimmer, alpha: 0, duration: 300, ease: 'Cubic.Out' });
      // Box wieder nach unten
      const cam = this.scene.cameras.main;
      const w = cam.width - 24;
      const h = 130;
      this.scene.tweens.add({
        targets: this.container,
        x: cam.width / 2,
        y: cam.height - h / 2 - 12,
        duration: 250,
        ease: 'Cubic.Out'
      });
    }

    // R72: WASD-Visualizer nur auf Step 1
    if (t.step === 1) {
      this.buildWasdVisualizer();
    } else {
      this.destroyWasdVisualizer();
    }

    // R73 + R56: Arrow + Puls-Ring bei Step 3
    if (this.arrowHint) {
      if (t.step === 3) {
        this.arrowHint.setAlpha(1);
        if (this.arrowTween) this.arrowTween.stop();
        this.arrowTween = this.scene.tweens.add({
          targets: this.arrowHint,
          y: this.arrowHint.y + 6,
          duration: 600,
          ease: 'Sine.InOut',
          yoyo: true,
          repeat: -1
        });
        this.startPulseRings();
      } else {
        this.arrowHint.setAlpha(0);
        if (this.arrowTween) { this.arrowTween.stop(); this.arrowTween = undefined; }
        this.stopPulseRings();
      }
    }
  }

  /**
   * Sorgt dafuer dass spaeter erstellte UI-Objekte (Toasts etc.) nicht
   * doppelt von der UI-Cam gerendert werden.
   */
  public ignoreInUICam(obj: Phaser.GameObjects.GameObject): void {
    if (this.uiCam) this.uiCam.ignore(obj);
  }

  public destroy(): void {
    this.container.destroy();
    this.fullscreenDimmer?.destroy();
    this.destroyWasdVisualizer();
    this.stopPulseRings();
    if (this.uiCam) {
      this.scene.cameras.remove(this.uiCam);
    }
  }
}
