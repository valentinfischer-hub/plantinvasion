import Phaser from 'phaser';
import { TILE_SIZE } from '../utils/constants';
import { NPC_SPRITE_KEYS } from '../assets/spriteRegistry';
import type { Dir } from './PlayerController';
import { npcMovementTick, makeNpcMovementState, type NpcMovementState } from './npcMovement';
import { TILE_SIZE as _TILE } from '../utils/constants';
void _TILE;

export interface NPCData {
  id: string;
  name: string;
  tileX: number;
  tileY: number;
  facing: Dir;
  dialog: string[];
  color: number;       // Body / Shirt-Farbe fuer Sprite
}

/**
 * NPC mit subtiler Idle-Bounce-Animation (S-09 D.o.D. #2 V0.1-Stand-In).
 * Echte 4-Frame-Walking-Sprites kommen mit PixelLab-Generation in S-10.
 */
export class NPC {
  public sprite: Phaser.GameObjects.Sprite;
  public data: NPCData;
  private bounceTween?: Phaser.Tweens.Tween;
  private baseY: number;
  private questIndicator?: Phaser.GameObjects.Text;
  private questIndicatorTween?: Phaser.Tweens.Tween;
  private nameTag?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, data: NPCData) {
    this.data = data;
    const key = NPC_SPRITE_KEYS[data.id] ?? 'npc_anya';
    const px = data.tileX * TILE_SIZE + TILE_SIZE / 2;
    const py = data.tileY * TILE_SIZE + TILE_SIZE / 2;
    this.sprite = scene.add.sprite(px, py, key);
    this.sprite.setDisplaySize(TILE_SIZE, TILE_SIZE);
    this.sprite.setDepth(9);
    this.baseY = py;
    // Name-Tag, klein ueber dem NPC, default UNSICHTBAR - wird via
    // setNameTagVisible() ein/aus geschaltet wenn Spieler nah ist (siehe
    // OverworldScene.refreshNpcNameTags). Truncate auf 12 chars damit nichts
    // ueberlappt.
    const shortName = data.name.length > 12 ? data.name.slice(0, 11) + '.' : data.name;
    const nameTag = scene.add.text(px, py - TILE_SIZE / 2 - 12, shortName, {
      fontFamily: 'monospace', fontSize: '7px', color: '#ffffff',
      backgroundColor: '#1a1f1a', padding: { x: 2, y: 1 }
    }).setOrigin(0.5, 1).setDepth(10).setAlpha(0.9).setVisible(false);
    this.nameTag = nameTag;
    // Subtiles Bounce-Idle - jeder NPC mit eigener Phase damit sie nicht synchron huepfen
    const phaseDelay = (Math.abs(data.tileX * 31 + data.tileY * 17) % 11) * 90;
    this.bounceTween = scene.tweens.add({
      targets: this.sprite,
      y: this.baseY - 1.2,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: phaseDelay
    });
  }

  /**
   * Zeigt ein blinkendes ! ueber dem NPC wenn er eine verfuegbare/aktive Quest hat.
   * mode: 'available' (gold !), 'turnin' (gruen ?), 'none' (entfernt).
   */
  public setQuestIndicator(scene: Phaser.Scene, mode: 'available' | 'turnin' | 'none'): void {
    if (mode === 'none') {
      this.questIndicatorTween?.stop();
      this.questIndicator?.destroy();
      this.questIndicator = undefined;
      this.questIndicatorTween = undefined;
      return;
    }
    if (this.questIndicator) {
      this.questIndicator.setText(mode === 'turnin' ? '?' : '!');
      this.questIndicator.setColor(mode === 'turnin' ? '#9be36e' : '#fcd95c');
      return;
    }
    const px = this.data.tileX * TILE_SIZE + TILE_SIZE / 2;
    const py = this.data.tileY * TILE_SIZE - 4;
    this.questIndicator = scene.add.text(px, py, mode === 'turnin' ? '?' : '!', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: mode === 'turnin' ? '#9be36e' : '#fcd95c',
      backgroundColor: '#1a1f1a',
      padding: { x: 3, y: 1 },
      stroke: '#1a1f1a',
      strokeThickness: 2
    }).setOrigin(0.5, 1).setDepth(11);
    this.questIndicatorTween = scene.tweens.add({
      targets: this.questIndicator,
      y: py - 3,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  public setNameTagVisible(visible: boolean): void {
    this.nameTag?.setVisible(visible);
  }

  public destroy(): void {
    if (this.bounceTween) this.bounceTween.stop();
    if (this.questIndicatorTween) this.questIndicatorTween.stop();
    this.questIndicator?.destroy();
    this.nameTag?.destroy();
    this.sprite.destroy();
  }

  /** Tier-4 Sprint-S-09: optionaler Movement-State fuer Auto-Walking-V0.1. */
  public movementState?: NpcMovementState;

  public initMovement(): void {
    this.movementState = makeNpcMovementState(this.data.id, this.data.tileX, this.data.tileY, this.data.facing);
  }

  /**
   * Tick-Hook fuer Auto-Walking. Wenn movementState gesetzt ist, wird ein
   * Movement-Schritt versucht. Visual-Sprite folgt der Tile-Position.
   * @param now Game-Time in ms.
   * @param walls Set von "x,y" Tile-Strings die als Walls gelten.
   * @param dialogActive Wenn true, NPC pausiert.
   */
  public step(now: number, walls: ReadonlySet<string>, dialogActive = false): void {
    if (!this.movementState) return;
    const next = npcMovementTick(this.movementState, now, walls, dialogActive);
    if (next === this.movementState) return;
    if (next.tileX !== this.movementState.tileX || next.tileY !== this.movementState.tileY) {
      this.data.tileX = next.tileX;
      this.data.tileY = next.tileY;
      const px = next.tileX * 16 + 16 / 2;
      const py = next.tileY * 16 + 16 / 2;
      this.sprite.x = px;
      this.sprite.y = py;
      this.baseY = py;
    }
    this.data.facing = next.facing;
    this.movementState = next;
  }
}
