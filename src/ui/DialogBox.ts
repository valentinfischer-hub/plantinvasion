import Phaser from 'phaser';
import { sfx } from '../audio/sfxGenerator';

export interface DialogChoice {
  label: string;
  onSelect: () => void;
}

/**
 * DialogBox V3 — D-041 R74 Polish.
 *
 * R74: Tilda-Avatar-Platzhalter (farbiger Kreis + Initialen) links neben Speaker-Label.
 *   - NPC-Avatar: gruener Kreis mit Initiale fuer generische NPCs
 *   - Tilda: spezielle Farbe #2a6a2a mit 'T'
 *   - Typewriter-Geschwindigkeit erhoehen: normale Zeichen 18ms (war 28ms)
 *
 * V2: Choice-Mode (S-09 D.o.D. #1).
 * V1: Bug-Fix B-001/B-005: Container-Scale 1/zoom + Position durch zoom.
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
  // Typewriter-State
  private typewriterTimer?: Phaser.Time.TimerEvent;
  private typewriterFull = '';
  private typewriterIdx = 0;
  private boxW: number;
  private boxH: number;
  private speakerLabel: Phaser.GameObjects.Text;
  private speakerBg!: Phaser.GameObjects.Rectangle;
  // R74: Tilda-Avatar-Kreis
  private avatarCircle?: Phaser.GameObjects.Arc;
  private avatarInitial?: Phaser.GameObjects.Text;

  // Bekannte Sprecher-Farben fuer Avatar-Differenzierung
  private static readonly SPEAKER_COLORS: Record<string, number> = {
    'Tilda': 0x2a6a2a,
    'Iris': 0x6a2a6a,
    'Anya': 0x6a4a2a,
    'Bjoern': 0x2a4a6a,
    'Clara': 0x4a2a6a,
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const cam = scene.cameras.main;
    const z = cam.zoom || 1;
    this.boxW = cam.width - 40;
    this.boxH = 140;
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

    // Speaker-Label + Hintergrund-Platte
    this.speakerBg = scene.add.rectangle(-this.boxW / 2 + 1, -this.boxH / 2 - 18, 80, 20, 0x3a2800, 0.9)
      .setStrokeStyle(1, 0xfcd95c).setOrigin(0, 0.5).setVisible(false);
    this.container.add(this.speakerBg);
    this.speakerLabel = scene.add.text(-this.boxW / 2 + 12, -this.boxH / 2 - 18, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#fcd95c',
      stroke: '#000000', strokeThickness: 2
    });

    // R74: Avatar-Kreis + Initiale (initial unsichtbar)
    this.avatarCircle = scene.add.arc(-this.boxW / 2 - 20, -this.boxH / 2 - 18, 12, 0, 360, false, 0x2a6a2a, 1)
      .setStrokeStyle(2, 0x9be36e).setVisible(false);
    this.avatarInitial = scene.add.text(-this.boxW / 2 - 20, -this.boxH / 2 - 18, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setVisible(false);

    this.container.add([this.bg, this.speakerBg, this.avatarCircle, this.avatarInitial, this.speakerLabel, this.text, this.hint]);
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
    // Bounce beim Oeffnen
    this.container.setScale((1 / (this.scene.cameras.main.zoom || 1)) * 0.88);
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1 / (this.scene.cameras.main.zoom || 1),
      scaleY: 1 / (this.scene.cameras.main.zoom || 1),
      duration: 160, ease: 'Back.Out'
    });
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

  /** R74: Schnellere Typewriter-Geschwindigkeit (18ms statt 28ms) + Speaker-Avatar */
  private startTypewriter(fullText: string): void {
    if (this.typewriterTimer) { this.typewriterTimer.destroy(); this.typewriterTimer = undefined; }
    // Speaker-Name aus 'Name: Text' extrahieren
    const speakerMatch = fullText.match(/^([A-Za-z\u00C0-\u024F\s-]{2,20}):/);
    if (speakerMatch) {
      const spkName = speakerMatch[1].trim();
      this.speakerLabel.setText(spkName);
      this.speakerBg.setSize(Math.max(spkName.length * 7 + 32, 70), 20);
      this.speakerLabel.setVisible(true);
      this.speakerBg.setVisible(true);
      fullText = fullText.slice(speakerMatch[0].length).trimStart();

      // R74: Avatar-Farbe + Initiale basierend auf Sprecher
      const avatarColor = DialogBox.SPEAKER_COLORS[spkName] ?? 0x3a3a6a;
      this.avatarCircle?.setFillStyle(avatarColor).setVisible(true);
      this.avatarInitial?.setText(spkName[0]?.toUpperCase() ?? '?').setVisible(true);
    } else {
      this.speakerLabel.setVisible(false);
      this.speakerBg.setVisible(false);
      this.avatarCircle?.setVisible(false);
      this.avatarInitial?.setVisible(false);
    }
    this.typewriterFull = fullText;
    this.typewriterIdx = 0;
    this.text.setText('');
    const advance = () => {
      if (this.typewriterIdx >= fullText.length) return;
      this.typewriterIdx++;
      this.text.setText(fullText.slice(0, this.typewriterIdx));
      const ch = fullText[this.typewriterIdx - 1] ?? '';
      // R74: 18ms normal (war 28ms) = 38% schneller
      const delay = ch === '.' || ch === '!' || ch === '?' ? 220 : ch === ',' ? 90 : 18;
      this.typewriterTimer = this.scene.time.delayedCall(delay, advance);
    };
    advance();
  }

  public next(): void {
    if (!this.isOpen) return;
    if (this.isChoiceMode) return;
    // Falls typewriter noch laeuft, Text sofort zeigen
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
      const txt = this.scene.add.text(-w / 2 + 8, 0, \`\${i + 1}. \${c.label}\`, {
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
