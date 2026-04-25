import Phaser from 'phaser';

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
    const boxW = cam.width - 40;
    const boxH = 120;
    const boxX = cam.width / 2;
    const boxY = cam.height - boxH / 2 - 20;

    this.container = scene.add.container(boxX, boxY);
    this.container.setScrollFactor(0);
    this.container.setDepth(1000);

    this.bg = scene.add.rectangle(0, 0, boxW, boxH, 0x000000, 0.85)
      .setStrokeStyle(2, 0x9be36e);
    this.text = scene.add.text(-boxW / 2 + 12, -boxH / 2 + 10, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
      wordWrap: { width: boxW - 24 }
    });
    this.hint = scene.add.text(boxW / 2 - 80, boxH / 2 - 16, '[E] weiter', {
      fontFamily: 'monospace', fontSize: '10px', color: '#9be36e'
    });

    this.container.add([this.bg, this.text, this.hint]);
    this.container.setVisible(false);
  }

  public open(lines: string[], onClose?: () => void): void {
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
