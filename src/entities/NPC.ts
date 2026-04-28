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
 * NPC mit verbesserter Idle-Bounce-Animation und Walking-Bob (S-POLISH Run-1).
 * Idle: Breathing-Scale-Pulse + Vertical-Bounce mit Sine.easeInOut.
 * Walk: Bob-Effect (y +/- 1px) synchron zum Step-Takt.
 * Echte 4-Frame-Walking-Sprites via PixelLab kommen spaeter.
 */
export class NPC {
  public sprite: Phaser.GameObjects.Sprite;
  public data: NPCData;
  private bounceTween?: Phaser.Tweens.Tween;
  private breathTween?: Phaser.Tweens.Tween;
  private baseY: number;
  private questIndicator?: Phaser.GameObjects.Text;
  private questIndicatorTween?: Phaser.Tweens.Tween;
  private nameTag?: Phaser.GameObjects.Text;
  /** Zaehlt Walk-Steps um den Bob-Effekt zu togglen. */
  private walkStepCount = 0;
  /** Ob NPC gerade im Walk-Modus ist (Tweens pausiert). */
  private _isWalking = false;

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

    // Phasen-Versatz: jeder NPC hat eigene Tween-Phase damit sie nicht synchron animieren.
    const phaseDelay = (Math.abs(data.tileX * 31 + data.tileY * 17) % 11) * 90;
    // Bounce-Idle: vertikaler Bounce 1.5px mit Sine.easeInOut
    this.bounceTween = scene.tweens.add({
      targets: this.sprite,
      y: this.baseY - 1.5,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: phaseDelay
    });

    // Breathing-Scale-Pulse: subtiler Scale 1.0 -> 1.02 -> 1.0, langsamere Rate
    this.breathTween = scene.tweens.add({
      targets: this.sprite,
      scaleX: (TILE_SIZE / (this.sprite.width || TILE_SIZE)) * 1.02,
      scaleY: (TILE_SIZE / (this.sprite.height || TILE_SIZE)) * 1.02,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: phaseDelay + 300
    });
  }

  /**
   * Pausiert Idle-Tweens waehrend NPC laeuft, startet sie wieder wenn er stehen bleibt.
   * Wird von step() intern aufgerufen.
   */
  private setWalkingMode(scene: Phaser.Scene, walking: boolean): void {
    if (walking === this._isWalking) return;
    this._isWalking = walking;
    if (walking) {
      this.bounceTween?.pause();
      this.breathTween?.pause();
      // Scale auf Normal zuruecksetzen damit kein Artefakt bleibt
      const baseScale = TILE_SIZE / (this.sprite.width || TILE_SIZE);
      this.sprite.setScale(baseScale);
    } else {
      // Beim Stehenbleiben: Tweens mit Resume statt Neustart (Position bleibt korrekt)
      this.bounceTween?.resume();
      this.breathTween?.resume();
    }
    void scene; // scene-Param fuer kuenftige Nutzung reserviert
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
      // B-013: Safety-Check. Wenn questIndicator nach Scene-Teardown noch referenziert
      // aber bereits destroyed ist, knickt setColor mit "Cannot read properties of null
      // (reading 'drawImage')" ab. Pruefe active-Flag und re-create wenn noetig.
      if (this.questIndicator.active && this.questIndicator.scene) {
        this.questIndicator.setText(mode === 'turnin' ? '?' : '!');
        this.questIndicator.setColor(mode === 'turnin' ? '#9be36e' : '#fcd95c');
        return;
      }
      // Stale-Reference - cleanup und neu erstellen
      this.questIndicatorTween?.stop();
      this.questIndicator = undefined;
      this.questIndicatorTween = undefined;
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
      y: py - 4,
      duration: 700,
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
    if (this.breathTween) this.breathTween.stop();
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
   * Walking-Bob: bei jedem Step-Wechsel y um 1px alternierend (+/-) damit
   * ein subtiles Wippen entsteht auch ohne echte Frame-Animations.
   * @param now Game-Time in ms.
   * @param walls Set von "x,y" Tile-Strings die als Walls gelten.
   * @param dialogActive Wenn true, NPC pausiert.
   */
  public step(now: number, walls: ReadonlySet<string>, dialogActive = false): void {
    if (!this.movementState) return;
    const prev = this.movementState;
    const next = npcMovementTick(prev, now, walls, dialogActive);
    if (next === prev) {
      // NPC steht - Idle-Tweens aktivieren
      this.setWalkingMode({ tweens: null } as unknown as Phaser.Scene, false);
      return;
    }
    const moved = next.tileX !== prev.tileX || next.tileY !== prev.tileY;
    if (moved) {
      this.data.tileX = next.tileX;
      this.data.tileY = next.tileY;
      const px = next.tileX * 16 + 16 / 2;
      const py = next.tileY * 16 + 16 / 2;
      this.baseY = py;

      // Walking-Bob: alterniert pro Step um +/-1 Pixel
      this.walkStepCount++;
      const bob = (this.walkStepCount % 2 === 0) ? -1 : 1;
      this.sprite.x = px;
      this.sprite.y = py + bob;

      // Idle-Tweens pausieren waehrend NPC laeuft
      if (!this._isWalking) {
        this._isWalking = true;
        this.bounceTween?.pause();
        this.breathTween?.pause();
        const baseScale = TILE_SIZE / (this.sprite.width || TILE_SIZE);
        this.sprite.setScale(baseScale);
      }
    } else {
      // State-Wechsel ohne Tile-Wechsel (z.B. Richtungsaenderung): Idle wieder aktiv
      if (this._isWalking) {
        this._isWalking = false;
        this.bounceTween?.resume();
        this.breathTween?.resume();
      }
    }
    this.data.facing = next.facing;
    this.movementState = next;
  }
}
