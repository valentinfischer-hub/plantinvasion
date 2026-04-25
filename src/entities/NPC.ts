import Phaser from 'phaser';
import { TILE_SIZE } from '../utils/constants';
import { generateNPCAtlas, type CharacterAtlasEntry } from '../assets/proceduralSprites';
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
  private atlas: CharacterAtlasEntry;

  constructor(scene: Phaser.Scene, data: NPCData) {
    this.data = data;
    this.atlas = generateNPCAtlas(scene, data.id, {
      bodyColor: data.color,
      headColor: 0xfcd9a8,
      outlineColor: 0x111111,
      shoeColor: 0x553e2d,
      hairColor: 0x3a2d1c
    });
    const px = data.tileX * TILE_SIZE + TILE_SIZE / 2;
    const py = data.tileY * TILE_SIZE + TILE_SIZE / 2;
    this.sprite = scene.add.sprite(px, py, this.atlas.framesByDir[data.facing].idle);
    this.sprite.setDepth(9);
  }

  public destroy(): void {
    this.sprite.destroy();
  }
}
