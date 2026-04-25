import Phaser from 'phaser';
import wurzelheim, { type MapDef } from '../data/maps/wurzelheim';
import {
  TILE_SIZE,
  CAMERA_ZOOM,
  CAMERA_LERP
} from '../utils/constants';
import { PlayerController, type CollisionChecker } from '../entities/PlayerController';
import { NPC } from '../entities/NPC';
import { DialogBox } from '../ui/DialogBox';
import { generateTilesetTextures, getTileTextureKey } from '../assets/proceduralTileset';
import { gameStore } from '../state/gameState';

// Building-Tueren bleiben collide, Dialog kommt via interact key (E/Space) wenn der Spieler davor steht
const COLLIDE_TILES = new Set<number>([3, 4, 5, 6, 8, 9, 10]);

// Tile-Position -> Dialog-Daten fuer Building-Tueren in V0.3
interface BuildingDoor {
  tileX: number;
  tileY: number;
  dialog: string[];
}
const BUILDING_DOORS: BuildingDoor[] = [
  // Markthalle
  { tileX: 20, tileY: 6, dialog: ['Markthalle: Heute geschlossen.', 'Markthalle: (Voll funktional in V0.3)'] },
  { tileX: 21, tileY: 6, dialog: ['Markthalle: Heute geschlossen.', 'Markthalle: (Voll funktional in V0.3)'] },
  // Botanik-Akademie
  { tileX: 6, tileY: 15, dialog: ['Botanik-Akademie: Die Tuer ist verschlossen.', 'Akademie: Komm zurueck wenn du den ersten Pokedex-Eintrag hast.'] },
  // NPC-Wohnhaus
  { tileX: 21, tileY: 15, dialog: ['NPC-Wohnhaus: Niemand zuhause.', '(Privater Bereich, V0.3)'] }
];

export class OverworldScene extends Phaser.Scene implements CollisionChecker {
  private map: MapDef = wurzelheim;
  private player!: PlayerController;
  private npcs: NPC[] = [];
  private dialog!: DialogBox;
  private keyE!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private debugText!: Phaser.GameObjects.Text;
  private _saveAccum?: number;

  constructor() {
    super('OverworldScene');
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#1a1f1a');

    // Welt-Container fuer Tiles
    this.renderTiles();

    // Player Spawn: vorzugsweise aus Save-State
    const ow = gameStore.getOverworldPos();
    this.player = new PlayerController(
      this,
      ow.tileX,
      ow.tileY,
      this
    );
    this.player.facing = ow.facing;

    // NPCs
    this.npcs = this.map.npcs.map((n) => new NPC(this, n));

    // Camera
    const worldW = this.map.width * TILE_SIZE;
    const worldH = this.map.height * TILE_SIZE;
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setZoom(CAMERA_ZOOM);
    this.cameras.main.startFollow(this.player.sprite, true, CAMERA_LERP, CAMERA_LERP);

    // Dialog
    this.dialog = new DialogBox(this);

    // Interact-Keys
    if (!this.input.keyboard) {
      throw new Error('Keyboard input not available');
    }
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Debug
    this.debugText = this.add.text(8, 8, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#9be36e'
    }).setScrollFactor(0).setDepth(2000);

    console.log('[OverworldScene] created, player at', this.player.tileX, this.player.tileY);
    (window as any).__overworld = this;
  }

  public update(time: number, delta: number): void {
    if (this.dialog.open_) {
      // Wenn Dialog offen, Keys nur fuer Dialog-Advance
      if (Phaser.Input.Keyboard.JustDown(this.keyE) || Phaser.Input.Keyboard.JustDown(this.keySpace)) {
        this.dialog.next();
      }
      return;
    }

    this.player.update(time, delta);

    // Periodische Position-Speicherung (alle ~2s wenn nicht moving)
    if (!this.player.isMoving) {
      this._saveAccum = (this._saveAccum ?? 0) + delta;
      if (this._saveAccum > 2000) {
        this._saveAccum = 0;
        gameStore.setOverworldPos(this.player.tileX, this.player.tileY, this.player.facing, 'OverworldScene');
      }
    }

    // Interact-Key
    if (Phaser.Input.Keyboard.JustDown(this.keyE) || Phaser.Input.Keyboard.JustDown(this.keySpace)) {
      this.tryInteract();
    }

    // Debug
    this.debugText.setText(
      `Wurzelheim  Tile (${this.player.tileX}, ${this.player.tileY})  Facing ${this.player.facing}  [E/Space=interact, Shift=run]`
    );
  }

  private tryInteract(): void {
    const front = this.player.getTileInFront();
    // NPC?
    const npc = this.npcs.find((n) => n.data.tileX === front.tileX && n.data.tileY === front.tileY);
    if (npc) {
      this.dialog.open(npc.data.dialog);
      return;
    }
    // Schild?
    const t = this.getTile(front.tileX, front.tileY);
    if (t === 10) {
      this.dialog.open([
        'Schild: Heimatdorf Wurzelheim.',
        'Schild: Hinter dieser Tuer ist Grossmutters Garten.'
      ]);
      return;
    }
    if (t === 9) {
      this.dialog.open([
        'Marktstand: Heute frischer Honig und Sonnenblumen-Samen.',
        'Marktstand: (Markt-Mechanik kommt in V0.3)'
      ]);
      return;
    }
    // Building-Tuer?
    const door = BUILDING_DOORS.find((d) => d.tileX === front.tileX && d.tileY === front.tileY);
    if (door) {
      this.dialog.open(door.dialog);
      return;
    }
  }

  private renderTiles(): void {
    // Tileset-Texturen einmal generieren bevor Tiles erstellt werden
    generateTilesetTextures(this, 'tile');
    const layer = this.add.container(0, 0);
    for (let y = 0; y < this.map.height; y++) {
      for (let x = 0; x < this.map.width; x++) {
        const t = this.map.tiles[y][x];
        const sprite = this.add.image(
          x * TILE_SIZE + TILE_SIZE / 2,
          y * TILE_SIZE + TILE_SIZE / 2,
          getTileTextureKey(t, 'tile')
        );
        layer.add(sprite);
      }
    }
    layer.setDepth(0);
  }

  private getTile(x: number, y: number): number {
    if (x < 0 || x >= this.map.width || y < 0 || y >= this.map.height) return 4;
    return this.map.tiles[y][x];
  }

  // CollisionChecker
  public canEnter(tileX: number, tileY: number): boolean {
    const t = this.getTile(tileX, tileY);
    if (COLLIDE_TILES.has(t)) return false;
    // NPC-Tile-Lock
    if (this.npcs.some((n) => n.data.tileX === tileX && n.data.tileY === tileY)) return false;
    return true;
  }

  public onEnterTile(tileX: number, tileY: number): void {
    const t = this.getTile(tileX, tileY);
    // Tuer zum Garten
    if (t === 7) {
      console.log('[OverworldScene] door triggered, switching to GreenhouseScene');
      gameStore.setOverworldPos(this.player.tileX, this.player.tileY, this.player.facing, 'GreenhouseScene');
      this.scene.start('GreenhouseScene');
      return;
    }
    // Map-Edge-Sueden Verdanto
    if (t === 11) {
      this.dialog.open([
        'Vor dir liegt der Tropische Regenwald Verdanto.',
        '(In V0.3 freischaltbar)'
      ]);
      return;
    }
  }
}
