/**
 * TutorialHighlight - Step-Highlight-Overlay fuer Tutorial.
 *
 * Erzeugt ein dunkles Overlay mit einem "Spotlight" auf einen
 * bestimmten Bildschirmbereich um auf wichtige UI-Elemente hinzuweisen.
 *
 * Usage:
 *   const highlight = new TutorialHighlight(scene);
 *   highlight.show(140, 200, 120, 40); // x, y, width, height des Ziel-Bereichs
 *   highlight.hide();
 *   highlight.destroy();
 *
 * S-POLISH Batch 5 Run 9
 */
import Phaser from 'phaser';

export interface HighlightTarget {
  /** X-Mitte des Ziel-Bereichs. */
  x: number;
  /** Y-Mitte des Ziel-Bereichs. */
  y: number;
  /** Breite des Spotlight-Ausschnitts. */
  w: number;
  /** Hoehe des Spotlight-Ausschnitts. */
  h: number;
  /** Ecken-Radius fuer Rundung. Standard: 6. */
  radius?: number;
}

export class TutorialHighlight {
  private scene: Phaser.Scene;
  private overlay: Phaser.GameObjects.Graphics;
  private pulseRing: Phaser.GameObjects.Graphics;
  private pulseAlpha = 0;
  private pulseDir = 1;
  private lastTarget: HighlightTarget | null = null;
  private _visible = false;

  constructor(scene: Phaser.Scene, depth = 2400) {
    this.scene = scene;
    this.overlay = scene.add.graphics().setDepth(depth).setScrollFactor(0).setVisible(false);
    this.pulseRing = scene.add.graphics().setDepth(depth + 1).setScrollFactor(0).setVisible(false);
  }

  /** Zeigt Spotlight-Overlay auf dem angegebenen Bereich. */
  show(target: HighlightTarget): void {
    this.lastTarget = target;
    this._visible = true;
    this._draw(target);
    this.overlay.setVisible(true);
    this.pulseRing.setVisible(true);
  }

  /** Versteckt den Overlay. */
  hide(): void {
    this._visible = false;
    this.overlay.setVisible(false);
    this.pulseRing.setVisible(false);
  }

  /** Aktualisiert den Puls-Effekt (in Phaser update() aufrufen). */
  update(): void {
    if (!this._visible || !this.lastTarget) return;

    this.pulseAlpha += 0.03 * this.pulseDir;
    if (this.pulseAlpha >= 1) { this.pulseAlpha = 1; this.pulseDir = -1; }
    if (this.pulseAlpha <= 0) { this.pulseAlpha = 0; this.pulseDir = 1; }

    const t = this.lastTarget;
    const r = (t.radius ?? 6) + 4;
    this.pulseRing.clear();
    this.pulseRing.lineStyle(2, 0xfcd95c, this.pulseAlpha * 0.8);
    this.pulseRing.strokeRoundedRect(
      t.x - t.w / 2 - 4,
      t.y - t.h / 2 - 4,
      t.w + 8,
      t.h + 8,
      r
    );
  }

  private _draw(target: HighlightTarget): void {
    const { scene } = this;
    const cam = scene.cameras.main;
    const W = cam.width;
    const H = cam.height;
    const r = target.radius ?? 6;

    this.overlay.clear();

    // Dunkles Overlay ueber den ganzen Bildschirm
    this.overlay.fillStyle(0x000000, 0.65);
    this.overlay.fillRect(0, 0, W, H);

    // "Lochen" des Overlays via XOR/Eraser-Pattern
    // Phaser unterstuetzt kein echtes Compositing, daher:
    // Wir zeichnen das Spotlight-Rechteck transparent (Alpha 0) drauf.
    // Stattdessen: Overlay besteht aus 4 Rechtecken um das Spotlight
    const sx = target.x - target.w / 2;
    const sy = target.y - target.h / 2;
    const sw = target.w;
    const sh = target.h;

    this.overlay.clear();
    // Oben
    this.overlay.fillStyle(0x000000, 0.65);
    this.overlay.fillRect(0, 0, W, sy);
    // Links
    this.overlay.fillRect(0, sy, sx, sh);
    // Rechts
    this.overlay.fillRect(sx + sw, sy, W - (sx + sw), sh);
    // Unten
    this.overlay.fillRect(0, sy + sh, W, H - (sy + sh));

    // Border ums Spotlight
    this.overlay.lineStyle(2, 0xfcd95c, 0.6);
    this.overlay.strokeRoundedRect(sx, sy, sw, sh, r);
  }

  destroy(): void {
    this.overlay.destroy();
    this.pulseRing.destroy();
  }
}
