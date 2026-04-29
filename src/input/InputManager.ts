/**
 * InputManager - Unified-Input-Abstraktionsschicht fuer Plantinvasion.
 *
 * Abstrahiert Keyboard, Touch und (optional) Gamepad-Eingaben zu
 * einheitlichen semantischen Actions. Scene-Code nutzt nur Actions,
 * nicht einzelne Tasten.
 *
 * Aktuell unterstuetzte Actions:
 *   - MOVE_UP / MOVE_DOWN / MOVE_LEFT / MOVE_RIGHT
 *   - CONFIRM / CANCEL
 *   - PAUSE / DEBUG
 *
 * Usage:
 *   const input = new InputManager(this); // in Scene.create()
 *   // in Scene.update():
 *   if (input.isDown('MOVE_UP')) player.y -= speed;
 *   if (input.justPressed('CONFIRM')) openDialog();
 *   input.destroy(); // in Scene.shutdown()
 *
 * S-POLISH Batch 5 Run 14
 */
import Phaser from 'phaser';

// ─── Action-Typen ─────────────────────────────────────────────────────────

export type InputAction =
  | 'MOVE_UP'
  | 'MOVE_DOWN'
  | 'MOVE_LEFT'
  | 'MOVE_RIGHT'
  | 'CONFIRM'
  | 'CANCEL'
  | 'PAUSE'
  | 'DEBUG';

// ─── Standard-Keybindings ─────────────────────────────────────────────────

type KeyCode = number;

/** Mapping von Action zu Phaser-Keycodes. */
export const DEFAULT_BINDINGS: Record<InputAction, KeyCode[]> = {
  MOVE_UP:    [Phaser.Input.Keyboard.KeyCodes.W, Phaser.Input.Keyboard.KeyCodes.UP],
  MOVE_DOWN:  [Phaser.Input.Keyboard.KeyCodes.S, Phaser.Input.Keyboard.KeyCodes.DOWN],
  MOVE_LEFT:  [Phaser.Input.Keyboard.KeyCodes.A, Phaser.Input.Keyboard.KeyCodes.LEFT],
  MOVE_RIGHT: [Phaser.Input.Keyboard.KeyCodes.D, Phaser.Input.Keyboard.KeyCodes.RIGHT],
  CONFIRM:    [Phaser.Input.Keyboard.KeyCodes.ENTER, Phaser.Input.Keyboard.KeyCodes.SPACE, Phaser.Input.Keyboard.KeyCodes.Z],
  CANCEL:     [Phaser.Input.Keyboard.KeyCodes.ESC, Phaser.Input.Keyboard.KeyCodes.X],
  PAUSE:      [Phaser.Input.Keyboard.KeyCodes.P, Phaser.Input.Keyboard.KeyCodes.ESC],
  DEBUG:      [Phaser.Input.Keyboard.KeyCodes.F3],
};

// ─── InputManager ─────────────────────────────────────────────────────────

export class InputManager {
  private scene: Phaser.Scene;
  private keys: Map<InputAction, Phaser.Input.Keyboard.Key[]> = new Map();
  private _prevState: Map<InputAction, boolean> = new Map();
  private _currState: Map<InputAction, boolean> = new Map();

  constructor(scene: Phaser.Scene, bindings = DEFAULT_BINDINGS) {
    this.scene = scene;

    if (!scene.input?.keyboard) return;

    for (const [action, codes] of Object.entries(bindings) as [InputAction, KeyCode[]][]) {
      const keys = codes.map(code => scene.input.keyboard!.addKey(code));
      this.keys.set(action, keys);
      this._prevState.set(action, false);
      this._currState.set(action, false);
    }
  }

  /**
   * Muss am Anfang von Scene.update() aufgerufen werden.
   * Aktualisiert prev/curr State fuer justPressed().
   */
  update(): void {
    for (const [action, keys] of this.keys.entries()) {
      this._prevState.set(action, this._currState.get(action) ?? false);
      const isDown = keys.some(k => k.isDown);
      this._currState.set(action, isDown);
    }
  }

  /** Gibt true wenn die Action gerade gedrueckt gehalten wird. */
  isDown(action: InputAction): boolean {
    return this._currState.get(action) ?? false;
  }

  /** Gibt true wenn die Action in diesem Frame erstmals gedrueckt wurde. */
  justPressed(action: InputAction): boolean {
    return (this._currState.get(action) ?? false) && !(this._prevState.get(action) ?? false);
  }

  /** Gibt true wenn die Action in diesem Frame losgelassen wurde. */
  justReleased(action: InputAction): boolean {
    return !(this._currState.get(action) ?? false) && (this._prevState.get(action) ?? false);
  }

  /** Gibt den aktuellen Bewegungsvektor zurueck (normalisiert fuer Diagonal). */
  getMovement(): { x: number; y: number } {
    let x = 0;
    let y = 0;
    if (this.isDown('MOVE_LEFT')) x -= 1;
    if (this.isDown('MOVE_RIGHT')) x += 1;
    if (this.isDown('MOVE_UP')) y -= 1;
    if (this.isDown('MOVE_DOWN')) y += 1;

    // Normalisierung fuer Diagonal-Bewegung
    if (x !== 0 && y !== 0) {
      const factor = 1 / Math.sqrt(2);
      x *= factor;
      y *= factor;
    }

    return { x, y };
  }

  /** Raeume alle Keys auf. */
  destroy(): void {
    for (const keys of this.keys.values()) {
      for (const k of keys) {
        try { this.scene.input?.keyboard?.removeKey(k); } catch {}
      }
    }
    this.keys.clear();
    this._prevState.clear();
    this._currState.clear();
  }
}
