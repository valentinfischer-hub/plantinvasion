import Phaser from 'phaser';
import { gameStore } from '../state/gameState';

/**
 * Season-Tint-Overlay V0.1 (S-09 D.o.D. #3, 2026-04-25).
 *
 * Sehr leichter Tint je Saison als Stand-In bis echte Tile-Variations
 * via PixelLab kommen.
 * - Fruehling: leichter rosa Tint (Bluete)
 * - Sommer: warm-gelblich
 * - Herbst: orange-braun
 * - Winter: blau-weiss
 */
export class SeasonTintOverlay {
  private scene: Phaser.Scene;
  private uiCam!: Phaser.Cameras.Scene2D.Camera;
  private tintRect!: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const cam = scene.cameras.main;
    this.uiCam = scene.cameras.add(0, 0, cam.width, cam.height);
    this.uiCam.setZoom(1);
    this.uiCam.setScroll(0, 0);
    this.tintRect = scene.add.rectangle(0, 0, cam.width, cam.height, 0x000000, 0)
      .setOrigin(0).setDepth(890).setScrollFactor(0);
    cam.ignore(this.tintRect);
    scene.children.list.forEach((obj) => {
      if (obj !== this.tintRect) this.uiCam.ignore(obj);
    });
    this.refresh();
  }

  /** Im update aufrufen, leichtgewichtig. */
  public refresh(): void {
    const t = gameStore.getTime();
    let color = 0x000000;
    let alpha = 0;
    // S-POLISH-B2-R5: Stärkere Saison-Farbton-Shifts
    switch (t.season) {
      case 0: color = 0xc8f0b0; alpha = 0.07; break; // Frühling: frisches Grünlich
      case 1: color = 0xffe066; alpha = 0.06; break; // Sommer: warmes Sonnen-Gelb
      case 2: color = 0xff8c30; alpha = 0.09; break; // Herbst: intensives Orange-Braun
      case 3: color = 0xa0c0ff; alpha = 0.10; break; // Winter: kühles Blau
    }
    this.tintRect.fillColor = color;
    this.tintRect.fillAlpha = alpha;
  }

  public ignoreInUICam(obj: Phaser.GameObjects.GameObject): void {
    if (this.uiCam) this.uiCam.ignore(obj);
  }

  public destroy(): void {
    this.tintRect?.destroy();
    if (this.uiCam) this.scene.cameras.remove(this.uiCam);
  }
}
