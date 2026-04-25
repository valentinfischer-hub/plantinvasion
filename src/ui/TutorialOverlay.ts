import Phaser from 'phaser';
import { gameStore } from '../state/gameState';
import { sfx } from '../audio/sfxGenerator';

export interface TutorialStep {
  step: number;
  title: string;
  text: string;
  advanceWhen?: (ctx: { tileX: number; tileY: number; facing: string; isMoving: boolean; lastInteract?: string }) => boolean;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    step: 0,
    title: 'Willkommen in Wurzelheim',
    text: 'Du bist die wandernde Botanikerin. Druecke [Weiter] um zu beginnen.'
  },
  {
    step: 1,
    title: 'Bewegung',
    text: 'Bewege dich mit WASD oder den Pfeiltasten. Halte Shift fuer Rennen.\nLaufe einen Tile in eine Richtung.',
    advanceWhen: (ctx) => ctx.tileX !== 14 || ctx.tileY !== 17
  },
  {
    step: 2,
    title: 'NPCs ansprechen',
    text: 'Anya, Bjoern und Clara warten in der Naehe der Marktstaende.\nLaufe zu einem NPC und druecke E um zu reden.',
    advanceWhen: (ctx) => ctx.lastInteract === 'npc'
  },
  {
    step: 3,
    title: 'Garten betreten',
    text: 'Die goldene Tuer am Spielerhaus (oben in der Mitte) fuehrt zum Garten.\nDort waechst dein Sonnenblumen-Setzling. X kreuzt 2 Pflanzen, O bringt zurueck.',
    advanceWhen: (ctx) => ctx.lastInteract === 'garden'
  },
  {
    step: 4,
    title: 'Hotkeys merken',
    text: 'M = Markt   P = Pokedex   Q = Quests\nE = NPC reden   Shift = Rennen\n\nViel Spass beim Erkunden!'
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
  public lastInteract: string | undefined;

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
    this.titleText = this.scene.add.text(-w / 2 + 12, -h / 2 + 10, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#fcd95c', fontStyle: 'bold'
    });
    this.bodyText = this.scene.add.text(-w / 2 + 12, -h / 2 + 32, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#ffffff',
      wordWrap: { width: w - 24 }
    });

    const nextBtn = this.makeButton(w / 2 - 60, h / 2 - 18, 'Weiter', '#9be36e', () => this.handleNext());
    const skipBtn = this.makeButton(-w / 2 + 50, h / 2 - 18, 'Skip', '#ff7e7e', () => this.handleSkip());

    this.container.add([bg, this.titleText, this.bodyText, nextBtn, skipBtn]);

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
    if (this.currentStep !== t.step) {
      sfx.dialogOpen();
      this.currentStep = t.step;
    }
  }

  public destroy(): void {
    this.container.destroy();
    if (this.uiCam) {
      this.scene.cameras.remove(this.uiCam);
    }
  }
}
