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
  private questIndicator?: Phaser.GameObjects.Text;
  private questIndicatorTween?: Phaser.Tweens.Tween;

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

  public destroy(): void {
    if (this.bounceTween) this.bounceTween.stop();
    if (this.questIndicatorTween) this.questIndicatorTween.stop();
    this.questIndicator?.destroy();
    this.sprite.destroy();
  }
}
