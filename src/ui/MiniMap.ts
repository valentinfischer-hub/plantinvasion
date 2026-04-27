import Phaser from 'phaser';
import { gameStore } from '../state/gameState';

/**
 * Mini-Map V0.1 (2026-04-25).
 * Kleiner HUD oben-rechts der OverworldScene mit Zone-Liste und Player-Marker.
 * Zoom-aware (positioniert sich relativ zur cam in screen-Koordinaten).
 */

const ZONES = [
  { slug: 'wurzelheim', label: 'Wurzelheim', x: 1, y: 0 },
  { slug: 'verdanto', label: 'Verdanto', x: 1, y: 1 },
  { slug: 'kaktoria', label: 'Kaktoria', x: 0, y: 2 },
  { slug: 'mordwald', label: 'Mordwald', x: 2, y: 1 },
  { slug: 'frostkamm', label: 'Frostkamm', x: 1, y: -1 },
  { slug: 'salzbucht', label: 'Salzbucht', x: 2, y: 0 },
  { slug: 'magmabluete', label: 'Magmabluete', x: 0, y: 1 },
  { slug: 'glaciara', label: 'Glaciara', x: 1, y: -2 }
];

const TILE = 14;
const PAD = 4;

export class MiniMap {
  public container: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;
  private playerDot: Phaser.GameObjects.Rectangle;
  // currentZone wird in refresh genutzt aber nicht persistent gehalten

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const cam = scene.cameras.main;
    const z = cam.zoom || 1;
    // Position oben-rechts, zoom-aware
    const w = (TILE + PAD) * 3 + 12;
    const h = (TILE + PAD) * 5 + 24;
    const cx = (cam.width - w / 2 - 8) / z;
    const cy = (h / 2 + 8) / z;

    this.container = scene.add.container(cx, cy);
    this.container.setScrollFactor(0);
    this.container.setDepth(1500);
    this.container.setScale(1 / z);

    const bg = scene.add.rectangle(0, 0, w, h, 0x000000, 0.6)
      .setStrokeStyle(1, 0x9be36e);
    const title = scene.add.text(0, -h / 2 + 4, 'Karte', {
      fontFamily: 'monospace', fontSize: '10px', color: '#9be36e'
    }).setOrigin(0.5, 0);
    this.container.add([bg, title]);

    // Zone-Tiles
    for (const zone of ZONES) {
      const tx = (zone.x - 1) * (TILE + PAD);
      const ty = -h / 2 + 22 + (zone.y + 2) * (TILE + PAD);
      const tile = scene.add.rectangle(tx, ty, TILE, TILE, 0x553e2d, 0.85)
        .setStrokeStyle(1, 0x553e2d);
      tile.setData('zoneSlug', zone.slug);
      this.container.add(tile);
    }
    // Player-Dot
    this.playerDot = scene.add.rectangle(0, 0, 6, 6, 0xff5577, 1)
      .setStrokeStyle(1, 0xffffff);
    this.container.add(this.playerDot);

    this.refresh('wurzelheim');
  }

  public refresh(currentZone: string): void {
    
    const visited = gameStore.getAchievementCounters?.()?.visitedZones ?? [];
    // Update zone-tile-colors
    this.container.list.forEach((obj) => {
      if (obj === this.playerDot) return;
      const tile = obj as Phaser.GameObjects.Rectangle;
      const slug = tile.getData ? tile.getData('zoneSlug') : null;
      if (!slug) return;
      const zone = ZONES.find((z) => z.slug === slug);
      if (!zone) return;
      const isCurrent = slug === currentZone;
      const isVisited = visited.includes(slug);
      let color = 0x553e2d; // unknown
      if (isVisited) color = 0x9be36e; // discovered
      if (isCurrent) color = 0xfcd95c; // current
      tile.setFillStyle(color, 0.85);
      if (isCurrent) {
        const cam = this.scene.cameras.main;
        const z = cam.zoom || 1;
        void z;
        this.playerDot.setPosition(tile.x, tile.y);
      }
    });
  }

  public destroy(): void {
    this.container.destroy();
  }

  public ignoreInUICam(obj: Phaser.GameObjects.GameObject): void {
    void obj;
    // MiniMap hat keine eigenen UI-Cameras zu pflegen, no-op fuer registerInAllUiCams-API.
  }
}
