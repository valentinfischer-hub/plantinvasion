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

export class NPC {
  public sprite: Phaser.GameObjects.Sprite;
  public data: NPCData;

  constructor(scene: Phaser.Scene, data: NPCData) {
    this.data = data;
    // PNG-Sprite via Registry, Fallback auf 'npc_anya' falls slug nicht in Map
    const key = NPC_SPRITE_KEYS[data.id] ?? 'npc_anya';
    const px = data.tileX * TILE_SIZE + TILE_SIZE / 2;
    const py = data.tileY * TILE_SIZE + TILE_SIZE / 2;
    this.sprite = scene.add.sprite(px, py, key);
    this.sprite.setDisplaySize(TILE_SIZE, TILE_SIZE);
    this.sprite.setDepth(9);
  }

  public destroy(): void {
    this.sprite.destroy();
  }
}
