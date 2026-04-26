import Phaser from 'phaser';
import { sfx } from '../audio/sfxGenerator';

/**
 * PauseOverlay V0.3 (2026-04-25).
 *
 * V0.3: Eigene UI-Camera (zoom 1) wie TutorialOverlay/TimeOverlay statt
 * scrollFactor-0-Math die in landscape-mode 720x540 + cam.zoom 2 nicht
 * sauber zentriert hat. Main-Cam ignoriert dim+container, UI-Cam zeigt
 * NUR dim+container.
 */
export class PauseOverlay {
  private scene: Phaser.Scene;
  private uiCam: Phaser.Cameras.Scene2D.Camera;
  private container: Phaser.GameObjects.Container;
  private dim: Phaser.GameObjects.Rectangle;
  private isOpen = false;
  private items: { label: string; onSelect: () => void }[];

  constructor(scene: Phaser.Scene, items: { label: string; onSelect: () => void }[]) {
    this.scene = scene;
    this.items = items;
    const cam = scene.cameras.main;
    const W = cam.width;
    const H = cam.height;

    // Eigene UI-Camera mit zoom 1
    this.uiCam = scene.cameras.add(0, 0, W, H);
    this.uiCam.setZoom(1);
    this.uiCam.setScroll(0, 0);

    // Dim deckt vollen Viewport
    this.dim = scene.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0).setDepth(2999).setVisible(false);

    // Menu-Container in Camera-Pixel-Koordinaten zentriert
    const menuW = 240;
    const menuH = 60 + this.items.length * 36;
    this.container = scene.add.container(W / 2, H / 2);
    this.container.setDepth(3000);

    const bg = scene.add.rectangle(0, 0, menuW, menuH, 0x1a1f1a, 0.95)
      .setStrokeStyle(2, 0x9be36e);
    const title = scene.add.text(0, -menuH / 2 + 14, 'Pause', {
      fontFamily: 'monospace', fontSize: '16px', color: '#9be36e'
    }).setOrigin(0.5, 0);
    this.container.add([bg, title]);

    let by = -menuH / 2 + 50;
    for (const item of this.items) {
      const btn = this.makeButton(0, by, item.label, item.onSelect);
      this.container.add(btn);
      by += 36;
    }
    this.container.setVisible(false);

    // Camera-Routing: Main-Cam ignoriert UI-Objekte, UI-Cam zeigt nur die UI-Objekte
    cam.ignore(this.container);
    cam.ignore(this.dim);
    scene.children.list.forEach((obj) => {
      if (obj !== this.container && obj !== this.dim) {
        this.uiCam.ignore(obj);
      }
    });
  }

  private makeButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Container {
    const c = this.scene.add.container(x, y);
    const w = 200;
    const h = 28;
    const bg = this.scene.add.rectangle(0, 0, w, h, 0x000000, 0.8)
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
    this.dim.setVisible(true);
    this.container.setVisible(true);
    sfx.dialogOpen();
  }

  public close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.dim.setVisible(false);
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

  public ignoreInUICam(obj: Phaser.GameObjects.GameObject): void {
    if (this.uiCam) this.uiCam.ignore(obj);
  }

  public destroy(): void {
    this.container.destroy();
    this.dim.destroy();
    if (this.uiCam) this.scene.cameras.remove(this.uiCam);
  }
}
