import Phaser from 'phaser';
import {
  TILE_SIZE,
  PLAYER_SPEED_PX_PER_SEC,
  PLAYER_RUN_MULTIPLIER
} from '../utils/constants';

export type Dir = 'up' | 'down' | 'left' | 'right';

const DIR_VEC: Record<Dir, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 }
};

export interface CollisionChecker {
  /**
   * Liefert true wenn der Spieler dieses Tile betreten darf.
   */
  canEnter(tileX: number, tileY: number): boolean;

  /**
   * Optional: wird aufgerufen sobald Spieler ein Tile betreten hat.
   * Hier koennen Door-Trigger feuern.
   */
  onEnterTile?(tileX: number, tileY: number, controller: PlayerController): void;
}

export class PlayerController {
  public sprite: Phaser.GameObjects.Rectangle;
  public tileX: number;
  public tileY: number;
  public facing: Dir = 'down';
  public isMoving = false;
  private targetTileX: number;
  private targetTileY: number;
  private px: number;
  private py: number;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyShift: Phaser.Input.Keyboard.Key;
  private keyW: Phaser.Input.Keyboard.Key;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyS: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;
  private collision: CollisionChecker;

  constructor(scene: Phaser.Scene, tileX: number, tileY: number, collision: CollisionChecker) {
    this.tileX = tileX;
    this.tileY = tileY;
    this.targetTileX = tileX;
    this.targetTileY = tileY;
    this.px = tileX * TILE_SIZE + TILE_SIZE / 2;
    this.py = tileY * TILE_SIZE + TILE_SIZE / 2;
    this.collision = collision;

    // Placeholder-Sprite: gruener Rect bis PixelLab-Sprites da sind
    this.sprite = scene.add.rectangle(this.px, this.py, TILE_SIZE - 2, TILE_SIZE - 2, 0x9be36e)
      .setStrokeStyle(1, 0x000000);
    this.sprite.setDepth(10);

    if (!scene.input.keyboard) {
      throw new Error('Keyboard input not available');
    }
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keyShift = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.keyW = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
  }

  public update(_time: number, delta: number): void {
    if (this.isMoving) {
      this.advanceMovement(delta);
      return;
    }

    // Input-Read
    const up = this.cursors.up?.isDown || this.keyW.isDown;
    const down = this.cursors.down?.isDown || this.keyS.isDown;
    const left = this.cursors.left?.isDown || this.keyA.isDown;
    const right = this.cursors.right?.isDown || this.keyD.isDown;

    let dir: Dir | null = null;
    if (up) dir = 'up';
    else if (down) dir = 'down';
    else if (left) dir = 'left';
    else if (right) dir = 'right';

    if (!dir) return;

    this.facing = dir;
    const v = DIR_VEC[dir];
    const nx = this.tileX + v.dx;
    const ny = this.tileY + v.dy;
    if (this.collision.canEnter(nx, ny)) {
      this.targetTileX = nx;
      this.targetTileY = ny;
      this.isMoving = true;
    } else {
      // Bump-Sound oder Rotate-only (V0.2 still)
    }
  }

  private advanceMovement(delta: number): void {
    const dt = delta / 1000;
    const isRunning = this.keyShift.isDown;
    const speed = PLAYER_SPEED_PX_PER_SEC * (isRunning ? PLAYER_RUN_MULTIPLIER : 1);
    const targetPx = this.targetTileX * TILE_SIZE + TILE_SIZE / 2;
    const targetPy = this.targetTileY * TILE_SIZE + TILE_SIZE / 2;
    const dx = targetPx - this.px;
    const dy = targetPy - this.py;
    const dist = Math.hypot(dx, dy);
    const step = speed * dt;

    if (step >= dist) {
      // Snap to target
      this.px = targetPx;
      this.py = targetPy;
      this.tileX = this.targetTileX;
      this.tileY = this.targetTileY;
      this.isMoving = false;
      this.sprite.setPosition(this.px, this.py);
      this.collision.onEnterTile?.(this.tileX, this.tileY, this);
    } else {
      const nx = dx / dist;
      const ny = dy / dist;
      this.px += nx * step;
      this.py += ny * step;
      this.sprite.setPosition(this.px, this.py);
    }
  }

  public getTileInFront(): { tileX: number; tileY: number } {
    const v = DIR_VEC[this.facing];
    return { tileX: this.tileX + v.dx, tileY: this.tileY + v.dy };
  }

  public destroy(): void {
    this.sprite.destroy();
  }
}
