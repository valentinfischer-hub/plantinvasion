import Phaser from 'phaser';
import { gameStore } from '../state/gameState';
import { sfx } from '../audio/sfxGenerator';

export interface TutorialStep {
  step: number;
  title: string;
  text: string;
  /**
   * Bedingung wann der Step automatisch advanced wird.
   * Wird in OverworldScene.update() gecheckt.
   */
  advanceWhen?: (ctx: { tileX: number; tileY: number; facing: string; isMoving: boolean; lastInteract?: string }) => boolean;
}

/**
 * Tutorial-Schritte fuer Wurzelheim (erstes Spiel).
 */
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    step: 0,
    title: 'Willkommen in Wurzelheim',
    text: 'Du bist die wandernde Botanikerin. Beginne mit der Erkundung des Heimatdorfs.\nDruecke [Weiter] um zu starten.'
  },
  {
    step: 1,
    title: 'Bewegung',
    text: 'Bewege dich mit WASD oder den Pfeiltasten. Halte Shift fuer Rennen.\nLaufe einen Tile in eine beliebige Richtung.',
    advanceWhen: (ctx) => ctx.tileX !== 14 || ctx.tileY !== 17
  },
  {
    step: 2,
    title: 'NPCs ansprechen',
    text: 'Anya, Bjoern und Clara warten in der Naehe der Marktstaende.\nLaufe zu einem NPC und druecke E oder Space um zu reden.',
    advanceWhen: (ctx) => ctx.lastInteract === 'npc'
  },
  {
    step: 3,
    title: 'Garten betreten',
    text: 'Die goldene Tuer am Spielerhaus (oben in der Mitte) fuehrt zum Garten.\nTipp: Im Garten kreuzt X die ersten beiden Pflanzen, O bringt dich zurueck.\nLaufe zur Tuer und betritt den Garten.',
    advanceWhen: (ctx) => ctx.lastInteract === 'garden'
  },
  {
    step: 4,
    title: 'Hotkeys merken',
    text: 'M = Anyas Markt\nP = Pokedex (entdeckte Pflanzen)\nQ = Quest-Log\nE = NPC reden / interagieren\n\nViel Spass beim Erkunden!',
  }
];

export class TutorialOverlay {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private bg!: Phaser.GameObjects.Rectangle;
  private titleText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private nextBtn!: Phaser.GameObjects.Container;
  private skipBtn!: Phaser.GameObjects.Container;
  private currentStep = -1;
  public lastInteract: string | undefined;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.build();
    this.refresh();
  }

  private build(): void {
    const cam = this.scene.cameras.main;
    const w = cam.width - 24;
    const h = 160;
    const cx = cam.width / 2;
    const cy = h / 2 + 12;

    this.container = this.scene.add.container(cx, cy);
    this.container.setScrollFactor(0);
    this.container.setDepth(2500);

    this.bg = this.scene.add.rectangle(0, 0, w, h, 0x000000, 0.88)
      .setStrokeStyle(2, 0xfcd95c);
    this.titleText = this.scene.add.text(-w / 2 + 12, -h / 2 + 10, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#fcd95c'
    });
    this.bodyText = this.scene.add.text(-w / 2 + 12, -h / 2 + 32, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#ffffff',
      wordWrap: { width: w - 24 }
    });

    this.nextBtn = this.makeButton(w / 2 - 60, h / 2 - 18, 'Weiter', '#9be36e', () => this.handleNext());
    this.skipBtn = this.makeButton(-w / 2 + 60, h / 2 - 18, 'Skip', '#ff7e7e', () => this.handleSkip());

    this.container.add([this.bg, this.titleText, this.bodyText, this.nextBtn, this.skipBtn]);
  }

  private makeButton(x: number, y: number, label: string, color: string, onClick: () => void): Phaser.GameObjects.Container {
    const c = this.scene.add.container(x, y);
    const w = 100;
    const h = 26;
    const bg = this.scene.add.rectangle(0, 0, w, h, 0x222222, 0.9)
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

  /** Wird in OverworldScene.update() aufgerufen, prueft auto-advance. */
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

  /** Markiere dass Spieler etwas getan hat (NPC reden, Garten betreten). */
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
  }
}
