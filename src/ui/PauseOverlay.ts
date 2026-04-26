import Phaser from 'phaser';
import { sfx } from '../audio/sfxGenerator';

/**
 * PauseOverlay V0.1 (2026-04-25).
 * Wird in OverworldScene per Esc geoffnet. Stoppt update, zeigt Resume/Inv/Settings/Quit.
 * Camera-Zoom-aware (1/zoom Scale fuer Container).
 */
export class PauseOverlay {
  private container: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;
  private isOpen = false;
  private items: { label: string; onSelect: () => void }[];

  constructor(scene: Phaser.Scene, items: { label: string; onSelect: () => void }[]) {
    this.scene = scene;
    this.items = items;
    const cam = scene.cameras.main;
    const z = cam.zoom || 1;

    const w = 240;
    const h = 60 + this.items.length * 36;
    const cx = (cam.width / 2) / z;
    const cy = (cam.height / 2) / z;

    this.container = scene.add.container(cx, cy);
    this.container.setScrollFactor(0);
    this.container.setDepth(3000);
    this.container.setScale(1 / z);

    const dim = scene.add.rectangle(0, 0, cam.width / z * 4, cam.height / z * 4, 0x000000, 0.55);
    void dim;

    const bg = scene.add.rectangle(0, 0, w, h, 0x1a1f1a, 0.95)
      .setStrokeStyle(2, 0x9be36e);
    const title = scene.add.text(0, -h / 2 + 14, 'Pause', {
      fontFamily: 'monospace', fontSize: '16px', color: '#9be36e'
    }).setOrigin(0.5, 0);

    this.container.add([bg, title]);

    let by = -h / 2 + 50;
    for (const item of this.items) {
      const btn = this.makeButton(0, by, item.label, item.onSelect);
      this.container.add(btn);
      by += 36;
    }
    this.container.setVisible(false);
  }

  private makeButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Container {
    const c = this.scene.add.container(x, y);
    const w = 200;
    const h = 28;
    const bg = this.scene.add.rectangle(0, 0, w, h, 0x000000, 0.7)
      .setStrokeStyle(1, 0x9be36e)
      .setInteractive({ useHandCursor: true });
    const txt = this.scene.add.text(0, 0, label, {
      fontFamily: 'monospace', fontSize: '13px', color: '#9be36e'
    }).setOrigin(0.5);
    bg.on('pointerover', () => bg.setStrokeStyle(2, 0xfcd95c));
    bg.on('pointerout', () => bg.setStrokeStyle(1, 0x9be36e));
    bg.on('pointerup', () => { sfx.click(); onClick(); });
    c.add([bg, txt]);
    return c;
  }

  public open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.container.setVisible(true);
    sfx.dialogOpen();
  }

  public close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.container.setVisible(false);
    sfx.dialogAdvance();
  }

  public toggle(): void {
    if (this.isOpen) this.close();
    else this.open();
  }

  public get open_(): boolean {
    return this.isOpen;
  }

  public destroy(): void {
    this.container.destroy();
  }
}
