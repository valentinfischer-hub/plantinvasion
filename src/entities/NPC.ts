import Phaser from 'phaser';
import { TILE_SIZE } from '../utils/constants';
import { NPC_SPRITE_KEYS } from '../assets/spriteRegistry';
import type { Dir } from './PlayerController';

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

  constructor(scene: Phaser.Scene, data: NPCData) {
    this.data = data;
    const key = NPC_SPRITE_KEYS[data.id] ?? 'npc_anya';
    const px = data.tileX * TILE_SIZE + TILE_SIZE / 2;
    const py = data.tileY * TILE_SIZE + TILE_SIZE / 2;
    this.sprite = scene.add.sprite(px, py, key);
    this.sprite.setDisplaySize(TILE_SIZE, TILE_SIZE);
    this.sprite.setDepth(9);
    this.baseY = py;
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

  public destroy(): void {
    if (this.bounceTween) this.bounceTween.stop();
    this.sprite.destroy();
  }
}
