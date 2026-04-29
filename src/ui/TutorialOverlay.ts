import Phaser from 'phaser';
import { gameStore } from '../state/gameState';
import { sfx } from '../audio/sfxGenerator';

export interface TutorialStep {
  step: number;
  title: string;
  text: string;
  advanceWhen?: (ctx: { tileX: number; tileY: number; facing: string; isMoving: boolean; lastInteract?: string }) => boolean;
}

// D-041 R19: Tutorial-Texte überarbeitet — persönlicher, klarer, Stardew-Warmth
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    step: 0,
    title: '🌿 Willkommen, Tilda!',
    text: 'Wurzelheim begrüsst dich. Du bist die wandernde Botanikerin,\ndie dieses Tal mit seltenen Pflanzen erfüllen wird.\nDrücke [Weiter] — dein Abenteuer beginnt jetzt.'
  },
  {
    step: 1,
    title: '👣 Erste Schritte',
    text: 'Bewege dich mit W A S D oder den Pfeiltasten.\nShift = Rennen. Probier es aus — lauf einfach irgendwohin!',
    advanceWhen: (ctx) => ctx.tileX !== 14 || ctx.tileY !== 17
  },
  {
    step: 2,
    title: '💬 Die Dorfbewohner',
    text: 'Anya, Björn und Clara stehen bei den Marktständen.\nLauf zu einem und drücke E — sie haben Tipps für dich.',
    advanceWhen: (ctx) => ctx.lastInteract === 'npc'
  },
  {
    step: 3,
    title: '🪴 Dein Garten wartet',
    text: 'Die goldene Tür am Spielerhaus führt zu deinem Garten.\nDein erster Sämling ist schon eingepflanzt.\nX = Kreuzen   O = Zurück zur Overworld',
    advanceWhen: (ctx) => ctx.lastInteract === 'garden'
  },
  {
    step: 4,
    title: '🗺️ Alles im Überblick',
    text: 'M = Markt     P = Pokédex     Q = Quests\nE = Reden      Shift = Rennen\n\nViel Freude beim Züchten! 🌱'
  }
];

/**
 * Tutorial-Overlay rendert in einer separaten UI-Camera die nicht mit der World-Camera zoomed.
 * Die Main-Camera ignoriert die Tutorial-Objekte, die UI-Camera ignoriert den Rest.
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

    const w = W - 24;
    const h = 130;
    const cx = W / 2;
    const cy = H - h / 2 - 12;

    this.container = this.scene.add.container(cx, cy);
    this.container.setDepth(2500);

    const bg = this.scene.add.rectangle(0, 0, w, h, 0x000000, 0.92)
      .setStrokeStyle(2, 0xfcd95c);
    // R55: Tilda-Avatar-Icon links oben (gruener Kreis mit Blatt-Symbol)
    const avatarCircle = this.scene.add.circle(-w / 2 + 22, -h / 2 + 22, 14, 0x2a4a2a, 1)
      .setStrokeStyle(2, 0x9be36e);
    const avatarLeaf = this.scene.add.text(-w / 2 + 22, -h / 2 + 22, '🌿', {
      fontFamily: 'monospace', fontSize: '14px'
    }).setOrigin(0.5);
    this.titleText = this.scene.add.text(-w / 2 + 44, -h / 2 + 10, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#fcd95c', fontStyle: 'bold'
    });
    this.bodyText = this.scene.add.text(-w / 2 + 12, -h / 2 + 36, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#ffffff',
      wordWrap: { width: w - 24 }
    });
    // R56: Bounce-Arrow fuer Step 3 (Garten-Tuer), unsichtbar bis Step 3
    this.arrowHint = this.scene.add.text(0, -h / 2 - 28, '⬇ Garten-Eingang', {
      fontFamily: 'monospace', fontSize: '11px', color: '#9be36e',
      backgroundColor: '#0a1a0a', padding: { x: 6, y: 3 }
    }).setOrigin(0.5).setAlpha(0);

    const nextBtn = this.makeButton(w / 2 - 60, h / 2 - 18, 'Weiter', '#9be36e', () => this.handleNext());
    const skipBtn = this.makeButton(-w / 2 + 50, h / 2 - 18, 'Skip', '#ff7e7e', () => this.handleSkip());

    // R44: Step-Progress-Dots visuell (filled=aktiv, leer=pending)
    this.progressDots = [];
    for (let di = 0; di < TUTORIAL_STEPS.length; di++) {
      const dot = this.scene.add.circle(-((TUTORIAL_STEPS.length - 1) * 10) / 2 + di * 10, h / 2 - 36, 3, 0x555555, 1);
      this.progressDots.push(dot);
      this.container.add(dot);
    }

    this.container.add([bg, avatarCircle, avatarLeaf, this.arrowHint!, this.titleText, this.bodyText, nextBtn, skipBtn]);

    // Camera-Routing: Main-Cam ignoriert Tutorial, UI-Cam ignoriert World
    cam.ignore(this.container);
    // UI-Cam soll nur den Tutorial-Container sehen, nicht die World
    this.scene.children.list.forEach((obj) => {
      if (obj !== this.container) {
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
    bg.on('pointerup', () => {
      sfx.dialogAdvance();
      onClick();
    });
    c.add([bg, txt]);
    return c;
  }

  private handleNext(): void {
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
      return;
    }
    const def = TUTORIAL_STEPS.find((s) => s.step === t.step);
    if (!def) {
      this.container.setVisible(false);
      return;
    }
    this.container.setVisible(true);
    this.titleText.setText(`(${t.step + 1}/${TUTORIAL_STEPS.length})  ${def.title}`);
    this.bodyText.setText(def.text);
    // R44: Progress-Dots aktualisieren
    this.progressDots.forEach((dot, i) => {
      dot.setFillStyle(i <= t.step ? 0xfcd95c : 0x555555);
      dot.setScale(i === t.step ? 1.4 : 1);
    });
    if (this.currentStep !== t.step) {
      sfx.dialogOpen();
      this.currentStep = t.step;
    }
    // R56: Arrow bei Step 3 (Garten) einblenden + bouncing Tween
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
      } else {
        this.arrowHint.setAlpha(0);
        if (this.arrowTween) { this.arrowTween.stop(); this.arrowTween = undefined; }
      }
    }
  }

  /**
   * Sorgt dafuer dass spaeter erstellte UI-Objekte (Toasts etc.) nicht
   * doppelt von der UI-Cam gerendert werden. Nur Tutorial-Container soll
   * die UI-Cam sehen.
   */
  public ignoreInUICam(obj: Phaser.GameObjects.GameObject): void {
    if (this.uiCam) this.uiCam.ignore(obj);
  }

  public destroy(): void {
    this.container.destroy();
    if (this.uiCam) {
      this.scene.cameras.remove(this.uiCam);
    }
  }
}
