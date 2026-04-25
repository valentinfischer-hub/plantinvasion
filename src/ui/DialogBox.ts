import Phaser from 'phaser';
import { sfx } from '../audio/sfxGenerator';

/**
 * DialogBox - Camera-Zoom aware UI overlay.
 *
 * 2026-04-25 Bug-Fix B-001/B-005: Vorher wurde die Dialog-Box in OverworldScene
 * (cam.zoom = 2) ausserhalb des Sichtbereichs gerendert, weil scrollFactor 0
 * nicht von der Camera-Zoom-Skalierung befreit. Loesung: Container-Scale auf
 * 1/zoom setzen und Position in Camera-Pixel-Koordinaten umrechnen. WordWrap
 * jetzt zoom-aware so dass Text im verkleinerten Container passt.
 */
export class DialogBox {
  private container: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Rectangle;
  private text: Phaser.GameObjects.Text;
  private hint: Phaser.GameObjects.Text;
  private lines: string[] = [];
  private idx = 0;
  private isOpen = false;
  private onCloseCb: (() => void) | null = null;

  constructor(scene: Phaser.Scene) {
    const cam = scene.cameras.main;
    const z = cam.zoom || 1;
    // Box-Pixel-Dimensionen passend fuer das tatsaechlich gerenderte Bild
    // (boxW * scale-1/z = (cam.width-40)/z echte Canvas-Pixel breit)
    const boxW = cam.width - 40;
    const boxH = 120;
    const boxX = (cam.width / 2) / z;
    const boxY = (cam.height - boxH / 2 - 20) / z;

    this.container = scene.add.container(boxX, boxY);
    this.container.setScrollFactor(0);
    this.container.setDepth(1000);
    this.container.setScale(1 / z);

    this.bg = scene.add
      .rectangle(0, 0, boxW, boxH, 0x000000, 0.85)
      .setStrokeStyle(2, 0x9be36e);
    this.text = scene.add.text(-boxW / 2 + 12, -boxH / 2 + 10, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      // wordWrap-Width muss auf interne Box-Breite (NICHT Canvas-Pixel) zeigen
      wordWrap: { width: boxW - 24 }
    });
    this.hint = scene.add.text(boxW / 2 - 90, boxH / 2 - 20, '[E] weiter', {
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
    this.text.setText(lines[0] ?? '');
    this.container.setVisible(true);
    this.isOpen = true;
  }

  public next(): void {
    if (!this.isOpen) return;
    this.idx++;
    sfx.dialogAdvance();
    if (this.idx >= this.lines.length) {
      this.close();
    } else {
      this.text.setText(this.lines[this.idx] ?? '');
    }
  }

  public close(): void {
    this.container.setVisible(false);
    this.isOpen = false;
    if (this.onCloseCb) {
      const cb = this.onCloseCb;
      this.onCloseCb = null;
      cb();
    }
  }

  public get open_(): boolean {
    return this.isOpen;
  }

  public destroy(): void {
    this.container.destroy();
  }
}
