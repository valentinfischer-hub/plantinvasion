import Phaser from 'phaser';
import { TILE_SIZE } from '../utils/constants';
import type { Dir } from './PlayerController';

export interface NPCData {
  id: string;
  name: string;
  tileX: number;
  tileY: number;
  facing: Dir;
  dialog: string[];
  color: number;
}

export class NPC {
  public sprite: Phaser.GameObjects.Rectangle;
  public data: NPCData;

  constructor(scene: Phaser.Scene, data: NPCData) {
    this.data = data;
    const px = data.tileX * TILE_SIZE + TILE_SIZE / 2;
    const py = data.tileY * TILE_SIZE + TILE_SIZE / 2;
    this.sprite = scene.add.rectangle(px, py, TILE_SIZE - 4, TILE_SIZE - 4, data.color)
      .setStrokeStyle(1, 0x000000);
    this.sprite.setDepth(9);
  }

  public destroy(): void {
    this.sprite.destroy();
  }
}
