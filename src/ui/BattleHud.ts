/**
 * BattleHud - Turn-Indicator und HP-Bar-Farb-Helfer fuer BattleScene.
 *
 * Exportiert:
 *   - TurnIndicator: Zeigt einen animierten Pfeil/Puls an der aktiven Seite
 *   - hpBarColor(pct): Gibt Hex-Farbe passend zum HP-Prozentsatz zurueck
 *   - formatHp(hp, maxHp): Formatiert HP-Text
 *
 * S-POLISH Batch 5 Run 10
 */
import Phaser from 'phaser';

// ─── Helfer-Funktionen (auch ohne Phaser testbar) ─────────────────────────

/** Gibt die HP-Bar-Farbe fuer einen HP-Prozentsatz zurueck. */
export function hpBarColor(pct: number): number {
  if (pct > 0.5) return 0x6abf3a;   // gruen: gesund
  if (pct > 0.2) return 0xfcd95c;   // gelb: kritisch
  return 0xc94a4a;                   // rot: fast tod
}

/** Formatiert HP als "HP 42 / 100". */
export function formatHp(hp: number, maxHp: number): string {
  return `HP ${Math.max(0, Math.floor(hp))} / ${Math.floor(maxHp)}`;
}

/** Berechnet die Breite eines HP-Balkens in Pixeln. */
export function hpBarWidth(hp: number, maxHp: number, maxWidth: number): number {
  const pct = Math.max(0, Math.min(1, hp / maxHp));
  return Math.round(pct * maxWidth);
}

// ─── TurnIndicator ────────────────────────────────────────────────────────

export interface TurnIndicatorConfig {
  /** Phaser.Scene Referenz */
  scene: Phaser.Scene;
  /** X-Position des Spieler-Indikators */
  playerX: number;
  /** X-Position des Wild-Indikators */
  wildX: number;
  /** Y-Position beider Indikatoren */
  y: number;
  /** Depth (Standard: 80) */
  depth?: number;
}

/**
 * Animierter Turn-Indicator.
 *
 * Zeigt einen pulsierenden Pfeil (▼) ueber dem Charakter, der gerade dran ist.
 * Wechselt zwischen Spieler- und Wild-Seite mit Slide-Tween.
 */
export class TurnIndicator {
  private scene: Phaser.Scene;
  private arrow!: Phaser.GameObjects.Text;
  private pulseTween: Phaser.Tweens.Tween | null = null;

  private readonly playerX: number;
  private readonly wildX: number;
  private readonly y: number;

  /** 'player' | 'wild' | 'none' */
  private _side: 'player' | 'wild' | 'none' = 'none';

  constructor(cfg: TurnIndicatorConfig) {
    this.scene = cfg.scene;
    this.playerX = cfg.playerX;
    this.wildX = cfg.wildX;
    this.y = cfg.y;

    const depth = cfg.depth ?? 80;

    this.arrow = this.scene.add.text(cfg.playerX, cfg.y, '▼', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#fcd95c',
    })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(depth);

    this._startPulse();
  }

  /** Aktiviert den Indikator auf der Spieler-Seite. */
  showPlayer(): void {
    this._moveTo(this.playerX, 'player');
  }

  /** Aktiviert den Indikator auf der Wild-Seite. */
  showWild(): void {
    this._moveTo(this.wildX, 'wild');
  }

  /** Versteckt den Indikator (z.B. waehrend einer Animation). */
  hide(): void {
    this._side = 'none';
    this.scene.tweens.add({
      targets: this.arrow,
      alpha: 0,
      duration: 150,
      ease: 'Cubic.Out',
    });
  }

  get side(): 'player' | 'wild' | 'none' {
    return this._side;
  }

  destroy(): void {
    if (this.pulseTween) {
      this.pulseTween.stop();
      this.pulseTween = null;
    }
    this.arrow.destroy();
  }

  // ── Private ────────────────────────────────────────────────────────────

  private _moveTo(targetX: number, side: 'player' | 'wild'): void {
    this._side = side;
    // Springe sofort zur X-Position, fade in
    this.arrow.setX(targetX);
    this.scene.tweens.add({
      targets: this.arrow,
      alpha: 1,
      duration: 200,
      ease: 'Cubic.Out',
    });
  }

  private _startPulse(): void {
    this.pulseTween = this.scene.tweens.add({
      targets: this.arrow,
      y: this.y + 5,
      duration: 480,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1,
    });
  }
}
