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
  // S-POLISH Run8: Typewriter-State
  private typewriterTimer?: Phaser.Time.TimerEvent;
  private typewriterFull = '';
  private typewriterIdx = 0;
  private boxW: number;
  private boxH: number;
  private speakerLabel: Phaser.GameObjects.Text;
  private speakerBg!: Phaser.GameObjects.Rectangle; // R49: Hintergrund-Platte

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

    // D-041 R36: Speaker-Name-Label oben links im Dialog
    // R49: Hintergrund-Platte hinter speaker-Label
    this.speakerBg = scene.add.rectangle(-this.boxW / 2 + 1, -this.boxH / 2 - 18, 80, 20, 0x3a2800, 0.9)
      .setStrokeStyle(1, 0xfcd95c).setOrigin(0, 0.5).setVisible(false);
    this.container.add(this.speakerBg);
    this.speakerLabel = scene.add.text(-this.boxW / 2 + 12, -this.boxH / 2 - 18, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#fcd95c',
      stroke: '#000000', strokeThickness: 2
    });
    this.container.add([this.bg, this.speakerLabel, this.text, this.hint]);
    this.container.setVisible(false);
  }

  public open(lines: string[], onClose?: () => void): void {
    sfx.dialogOpen();
    this.lines = lines;
    this.idx = 0;
    this.onCloseCb = onClose ?? null;
    this.isChoiceMode = false;
    this.clearChoices();
    this.hint.setText('[E] weiter');
    this.hint.setVisible(true);
    this.container.setVisible(true);
    this.isOpen = true;
    // S-POLISH Run8: Bounce beim Öffnen
    this.container.setScale((1 / (this.scene.cameras.main.zoom || 1)) * 0.88);
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1 / (this.scene.cameras.main.zoom || 1),
      scaleY: 1 / (this.scene.cameras.main.zoom || 1),
      duration: 160, ease: 'Back.Out'
    });
    // Typewriter starten
    this.startTypewriter(lines[0] ?? '');
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

  /** S-POLISH Run8: Typewriter mit Pause bei . und , */
  private startTypewriter(fullText: string): void {
    if (this.typewriterTimer) { this.typewriterTimer.destroy(); this.typewriterTimer = undefined; }
    // D-041 R36: Speaker-Name aus 'Name: Text' extrahieren und als Header zeigen
    const speakerMatch = fullText.match(/^([A-Za-z\u00C0-\u024F\s-]{2,20}):/);
    if (speakerMatch) {
      const spkName = speakerMatch[1].trim();
      this.speakerLabel.setText(spkName);
      this.speakerBg.setSize(Math.max(spkName.length * 7 + 16, 60), 20);
      this.speakerLabel.setVisible(true);
      this.speakerBg.setVisible(true);
      fullText = fullText.slice(speakerMatch[0].length).trimStart();
    } else {
      this.speakerLabel.setVisible(false);
      this.speakerBg.setVisible(false);
    }
    this.typewriterFull = fullText;
    this.typewriterIdx = 0;
    this.text.setText('');
    const advance = () => {
      if (this.typewriterIdx >= fullText.length) return;
      this.typewriterIdx++;
      this.text.setText(fullText.slice(0, this.typewriterIdx));
      const ch = fullText[this.typewriterIdx - 1] ?? '';
      const delay = ch === '.' || ch === '!' || ch === '?' ? 280 : ch === ',' ? 120 : 28;
      this.typewriterTimer = this.scene.time.delayedCall(delay, advance);
    };
    advance();
  }

  public next(): void {
    if (!this.isOpen) return;
    if (this.isChoiceMode) return; // ignorieren in Choice-Mode
    // S-POLISH Run8: Falls typewriter noch läuft, Text sofort zeigen
    if (this.typewriterTimer && this.typewriterIdx < this.typewriterFull.length) {
      this.typewriterTimer.destroy(); this.typewriterTimer = undefined;
      this.text.setText(this.typewriterFull);
      this.typewriterIdx = this.typewriterFull.length;
      return;
    }
    this.idx++;
    sfx.dialogAdvance();
    if (this.idx >= this.lines.length) {
      this.close();
    } else {
      this.startTypewriter(this.lines[this.idx] ?? '');
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
