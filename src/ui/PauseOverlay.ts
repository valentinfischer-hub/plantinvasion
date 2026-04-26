import Phaser from 'phaser';
import { sfx } from '../audio/sfxGenerator';

/**
 * PauseOverlay V0.2 (2026-04-25).
 * Wird in OverworldScene per Esc geoffnet. Stoppt update, zeigt Buttons.
 *
 * V0.2 Fixes (Game-Critic-Review B-006/B-012):
 *  - dim-Rectangle wird jetzt korrekt zum Container hinzugefuegt und
 *    als Teil der Pause-UI sichtbar/unsichtbar geschaltet (vorher
 *    permanent visible, hat das ganze Spiel verdunkelt)
 *  - Container-Origin auf top-left statt center, Position-Mathe sauber
 *    fuer Camera-Zoom + scrollFactor 0
 */
export class PauseOverlay {
  private container: Phaser.GameObjects.Container;
  private dim: Phaser.GameObjects.Rectangle;
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

    // Dim-Layer: ueber kompletten Camera-Viewport (in cam-pixel-koord)
    // Position (0,0) origin top-left, scrollFactor 0, scale 1/zoom damit
    // breite/hoehe stimmen.
    this.dim = scene.add.rectangle(0, 0, cam.width, cam.height, 0x000000, 0.6)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(2999)
      .setScale(1 / z)
      .setVisible(false);

    // Menu-Container in der Camera-Mitte
    this.container = scene.add.container((cam.width / 2) / z, (cam.height / 2) / z);
    this.container.setScrollFactor(0);
    this.container.setDepth(3000);
    this.container.setScale(1 / z);

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

  public get container_(): Phaser.GameObjects.Container {
    return this.container;
  }

  public get dim_(): Phaser.GameObjects.Rectangle {
    return this.dim;
  }

  public destroy(): void {
    this.container.destroy();
    this.dim.destroy();
  }
}
