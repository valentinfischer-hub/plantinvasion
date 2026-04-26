import Phaser from 'phaser';
import { sfx } from '../audio/sfxGenerator';

export interface DialogChoice {
  label: string;
  onSelect: () => void;
}

/**
 * DialogBox V2 - Camera-Zoom aware UI overlay mit Choice-Support.
 *
 * 2026-04-25 V2: Choice-Mode hinzugefuegt (S-09 D.o.D. #1).
 *  - openWithChoices(prompt, choices) zeigt Frage + 2-4 Buttons
 *  - Tasten 1-4 oder Klick auswaehlen
 *
 * 2026-04-25 V1: Bug-Fix B-001/B-005: Container-Scale 1/zoom + Position
 *  durch zoom geteilt damit Dialog im Sichtbereich landet bei cam.zoom=2.
 */
export class DialogBox {
  private container: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Rectangle;
  private text: Phaser.GameObjects.Text;
  private hint: Phaser.GameObjects.Text;
  private choiceButtons: Phaser.GameObjects.Container[] = [];
  private lines: string[] = [];
  private idx = 0;
  private isOpen = false;
  private isChoiceMode = false;
  private choices: DialogChoice[] = [];
  private onCloseCb: (() => void) | null = null;
  private scene: Phaser.Scene;
  private boxW: number;
  private boxH: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const cam = scene.cameras.main;
    const z = cam.zoom || 1;
    this.boxW = cam.width - 40;
    this.boxH = 140; // etwas hoeher fuer Choices
    const boxX = (cam.width / 2) / z;
    const boxY = (cam.height - this.boxH / 2 - 20) / z;

    this.container = scene.add.container(boxX, boxY);
    this.container.setScrollFactor(0);
    this.container.setDepth(1000);
    this.container.setScale(1 / z);

    this.bg = scene.add
      .rectangle(0, 0, this.boxW, this.boxH, 0x000000, 0.85)
      .setStrokeStyle(2, 0x9be36e);
    this.text = scene.add.text(-this.boxW / 2 + 12, -this.boxH / 2 + 10, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      wordWrap: { width: this.boxW - 24 }
    });
    this.hint = scene.add.text(this.boxW / 2 - 90, this.boxH / 2 - 20, '[E] weiter', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#9be36e'
    });

    this.container.add([this.bg, this.text, this.hint]);
    this.container.setVisible(false);
  }

  public open(lines: string[], onClose?: () => void): void {
    sfx.dialogOpen();
    this.lines = lines;
    this.idx = 0;
    this.onCloseCb = onClose ?? null;
    this.isChoiceMode = false;
    this.clearChoices();
    this.text.setText(lines[0] ?? '');
    this.hint.setText('[E] weiter');
    this.hint.setVisible(true);
    this.container.setVisible(true);
    this.isOpen = true;
  }

  public openWithChoices(prompt: string, choices: DialogChoice[], onClose?: () => void): void {
    if (choices.length === 0 || choices.length > 4) {
      console.warn('[DialogBox] choices muss 1-4 Eintraege haben, fallback open()');
      this.open([prompt], onClose);
      return;
    }
    sfx.dialogOpen();
    this.onCloseCb = onClose ?? null;
    this.isChoiceMode = true;
    this.choices = choices;
    this.text.setText(prompt);
    this.hint.setText('[1-' + choices.length + '] waehlen');
    this.hint.setVisible(true);
    this.clearChoices();
    this.renderChoices();
    this.container.setVisible(true);
    this.isOpen = true;
  }

  public next(): void {
    if (!this.isOpen) return;
    if (this.isChoiceMode) return; // ignorieren in Choice-Mode
    this.idx++;
    sfx.dialogAdvance();
    if (this.idx >= this.lines.length) {
      this.close();
    } else {
      this.text.setText(this.lines[this.idx] ?? '');
    }
  }

  public selectChoice(idx: number): void {
    if (!this.isOpen || !this.isChoiceMode) return;
    if (idx < 0 || idx >= this.choices.length) return;
    sfx.click();
    const choice = this.choices[idx];
    this.close();
    choice.onSelect();
  }

  private renderChoices(): void {
    const startY = -this.boxH / 2 + 50;
    const btnH = 22;
    const gap = 4;
    for (let i = 0; i < this.choices.length; i++) {
      const c = this.choices[i];
      const cont = this.scene.add.container(0, startY + i * (btnH + gap));
      const w = this.boxW - 32;
      const bg = this.scene.add.rectangle(0, 0, w, btnH, 0x000000, 0.7)
        .setStrokeStyle(1, 0x553e2d)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      const txt = this.scene.add.text(-w / 2 + 8, 0, `${i + 1}. ${c.label}`, {
        fontFamily: 'monospace', fontSize: '12px', color: '#9be36e'
      }).setOrigin(0, 0.5);
      bg.on('pointerover', () => { bg.setStrokeStyle(2, 0xfcd95c); txt.setColor('#fcd95c'); });
      bg.on('pointerout', () => { bg.setStrokeStyle(1, 0x553e2d); txt.setColor('#9be36e'); });
      bg.on('pointerup', () => this.selectChoice(i));
      cont.add([bg, txt]);
      this.container.add(cont);
      this.choiceButtons.push(cont);
    }
  }

  private clearChoices(): void {
    for (const c of this.choiceButtons) c.destroy();
    this.choiceButtons = [];
  }

  public close(): void {
    this.container.setVisible(false);
    this.isOpen = false;
    this.isChoiceMode = false;
    this.clearChoices();
    if (this.onCloseCb) {
      const cb = this.onCloseCb;
      this.onCloseCb = null;
      cb();
    }
  }

  public get open_(): boolean {
    return this.isOpen;
  }

  public get isChoiceMode_(): boolean {
    return this.isChoiceMode;
  }

  public destroy(): void {
    this.container.destroy();
  }
}
