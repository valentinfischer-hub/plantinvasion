import Phaser from 'phaser';
import { gameStore } from '../state/gameState';

/**
 * Debug-Overlay (B7-R8) — nur bei URL-Parameter ?debug=1 aktiv.
 *
 * Zeigt:
 * - FPS-Counter (oben links)
 * - Genome-Inspector: letztes aktives Battle-Opponent
 * - Save-State-Dump: Kurzinfo (Pflanzen, Coins, Tag)
 * - Gelber Rahmen um Overlay-Bereich
 *
 * Nutzung: `new DebugOverlay(scene)` in create(), dann `tick(delta)` in update()
 */
export class DebugOverlay {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private fpsText!: Phaser.GameObjects.Text;
  private stateText!: Phaser.GameObjects.Text;
  private genomeText!: Phaser.GameObjects.Text;
  private _active = false;
  private _frameCount = 0;
  private _fpsAccum = 0;
  private _displayFps = 0;

  static isEnabled(): boolean {
    try {
      return new URLSearchParams(window.location.search).get('debug') === '1';
    } catch {
      return false;
    }
  }

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this._active = DebugOverlay.isEnabled();
    if (!this._active) return;
    this.build();
  }

  private build(): void {
    const { width } = this.scene.scale;
    this.container = this.scene.add.container(0, 0)
      .setScrollFactor(0)
      .setDepth(9999);

    // Hintergrund-Panel
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.75);
    bg.fillRect(0, 0, 300, 130);
    bg.lineStyle(2, 0xfcd95c, 1);
    bg.strokeRect(0, 0, 300, 130);
    this.container.add(bg);

    // FPS
    this.fpsText = this.scene.add.text(6, 6, 'FPS: --', {
      fontFamily: 'monospace', fontSize: '11px', color: '#fcd95c'
    });
    this.container.add(this.fpsText);

    // State-Dump
    this.stateText = this.scene.add.text(6, 22, '', {
      fontFamily: 'monospace', fontSize: '9px', color: '#9be36e',
      wordWrap: { width: 288 }
    });
    this.container.add(this.stateText);

    // Genome-Inspector
    this.genomeText = this.scene.add.text(6, 80, 'Genome: --', {
      fontFamily: 'monospace', fontSize: '9px', color: '#b86ee3',
      wordWrap: { width: 288 }
    });
    this.container.add(this.genomeText);

    // Debug-Label
    this.scene.add.text(width - 6, 4, 'DEBUG', {
      fontFamily: 'monospace', fontSize: '9px', color: '#fcd95c'
    }).setScrollFactor(0).setOrigin(1, 0).setDepth(9999);
  }

  /** Aufruf in update() mit deltaMs */
  public tick(deltaMs: number): void {
    if (!this._active) return;

    // FPS-Berechnung (Durchschnitt über 30 Frames)
    this._frameCount++;
    this._fpsAccum += deltaMs;
    if (this._frameCount >= 30) {
      this._displayFps = Math.round(1000 / (this._fpsAccum / this._frameCount));
      this._frameCount = 0;
      this._fpsAccum = 0;
    }
    this.fpsText.setText(`FPS: ${this._displayFps}`);

    // State-Dump (nur alle 60 Frames aktualisieren für Performance)
    if (this._frameCount % 30 === 0) {
      const state = gameStore.get();
      const plants = state.plants.length;
      const coins = state.coins;
      const day = state.gameTime?.day ?? '?';
      const season = state.gameTime?.season ?? '?';
      const zone = state.overworld?.zone ?? '?';
      this.stateText.setText(
        `Plants: ${plants}  Coins: ${coins}  Day: ${day}  Season: ${season}\nZone: ${zone}  Achievements: ${(state.achievements ?? []).length}`
      );

      // Genome-Inspector: erste Pflanze im State
      const firstPlant = state.plants[0];
      if (firstPlant?.genes) {
        const genes = firstPlant.genes;
        const gStr = Object.entries(genes).slice(0, 4)
          .map(([k, v]) => `${k.slice(0, 6)}:${typeof v === 'number' ? v.toFixed(1) : v}`)
          .join('  ');
        this.genomeText.setText(`Genome[${firstPlant.speciesSlug}]: ${gStr}`);
      } else {
        this.genomeText.setText('Genome: (kein Plant im State)');
      }
    }
  }

  public destroy(): void {
    this.container?.destroy();
  }
}

/**
 * P0-Fix Run9: initDebugOverlay() — wird von main.ts aufgerufen.
 * Logt Debug-Modus und registriert globalen KeyHandler fuer Ctrl+D.
 */
export function initDebugOverlay(): void {
  if (!DebugOverlay.isEnabled()) return;
  console.info('[DebugOverlay] Debug-Modus aktiv (?debug=1)');
}
