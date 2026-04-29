/**
 * Input-Bindings ohne Phaser-Abhaengigkeit.
 * Gehalten separat damit Tests es ohne Phaser importieren koennen.
 *
 * S-POLISH Batch 5 Run 14
 */
import type { InputAction } from './InputManager';

// Phaser KeyCodes als Zahlen-Konstanten (keine Phaser-Import noetig)
const KC = {
  W: 87, S: 83, A: 65, D: 68,
  UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39,
  ENTER: 13, SPACE: 32, Z: 90,
  ESC: 27, X: 88,
  P: 80, F3: 114,
} as const;

/** Standard-Keybinding-Tabelle (numerische KeyCodes, kein Phaser noetig). */
export const INPUT_BINDINGS: Record<InputAction, number[]> = {
  MOVE_UP:    [KC.W, KC.UP],
  MOVE_DOWN:  [KC.S, KC.DOWN],
  MOVE_LEFT:  [KC.A, KC.LEFT],
  MOVE_RIGHT: [KC.D, KC.RIGHT],
  CONFIRM:    [KC.ENTER, KC.SPACE, KC.Z],
  CANCEL:     [KC.ESC, KC.X],
  PAUSE:      [KC.P, KC.ESC],
  DEBUG:      [KC.F3],
};
