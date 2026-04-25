import Phaser from 'phaser';
import wurzelheim, { type MapDef } from '../data/maps/wurzelheim';
import verdanto from '../data/maps/verdanto';
import kaktoria from '../data/maps/kaktoria';
import frostkamm from '../data/maps/frostkamm';
import salzbucht from '../data/maps/salzbucht';
import { WURZELHEIM_TALLGRASS, VERDANTO_TALLGRASS, VERDANTO_BROMELIEN, KAKTORIA_TALLGRASS, FROSTKAMM_TALLGRASS, SALZBUCHT_TALLGRASS, pickEncounter, randomLevel, type EncounterDef } from '../data/encounters';
import {
  TILE_SIZE,
  CAMERA_ZOOM,
  CAMERA_LERP
} from '../utils/constants';
import { PlayerController, type CollisionChecker } from '../entities/PlayerController';
import { NPC } from '../entities/NPC';
import { DialogBox } from '../ui/DialogBox';
import { TILE_SPRITE_KEYS, getAllSpriteFiles } from '../assets/spriteRegistry';
import { gameStore } from '../state/gameState';
import { sfx, startAmbientBGM } from '../audio/sfxGenerator';
import { QUESTS, type QuestDef } from '../data/quests';
import { buildTouchControls, type TouchKeysHandle } from '../ui/TouchControls';

// Building-Tueren bleiben collide, Dialog kommt via interact key (E/Space) wenn der Spieler davor steht
const COLLIDE_TILES = new Set<number>([3, 4, 5, 6, 8, 9, 10, 14]);

const MAPS: Record<string, MapDef> = {
  wurzelheim,
  verdanto,
  kaktoria,
  frostkamm,
  salzbucht
};

function getEncounterPool(zone: string, tile: number): EncounterDef[] {
  if (zone === 'verdanto') {
    if (tile === 13) return VERDANTO_BROMELIEN;
    return VERDANTO_TALLGRASS;
  }
  if (zone === 'kaktoria') return KAKTORIA_TALLGRASS;
  if (zone === 'frostkamm') return FROSTKAMM_TALLGRASS;
  if (zone === 'salzbucht') return SALZBUCHT_TALLGRASS;
  return WURZELHEIM_TALLGRASS;
}

void pickEncounter; void randomLevel;

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

function checkQuestComplete(quest: QuestDef): boolean {
  const dex = gameStore.getPokedex();
  const goal = quest.goal;
  if (goal.type === 'capture') return dex.captured.includes(goal.speciesSlug);
  if (goal.type === 'discover') return dex.discovered.includes(goal.speciesSlug);
  if (goal.type === 'have-plant') return gameStore.get().plants.some((p) => p.speciesSlug === goal.speciesSlug);
  if (goal.type === 'have-item') return (gameStore.getInventory()[goal.itemSlug] ?? 0) >= goal.count;
  return false;
}

export class OverworldScene extends Phaser.Scene implements CollisionChecker {
  private map: MapDef = wurzelheim;
  private currentZone: string = 'wurzelheim';
  private player!: PlayerController;
  private npcs: NPC[] = [];
  private dialog!: DialogBox;
  private keyE!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyP!: Phaser.Input.Keyboard.Key;
  private keyM!: Phaser.Input.Keyboard.Key;
  private keyQ!: Phaser.Input.Keyboard.Key;
  private debugText!: Phaser.GameObjects.Text;
  private _saveAccum?: number;
  private interactHint!: Phaser.GameObjects.Text;
  private touch!: TouchKeysHandle;
  private prevTouchE = false;

  constructor() {
    super('OverworldScene');
  }

  public preload(): void {
    for (const { key, file } of getAllSpriteFiles()) {
      if (!this.textures.exists(key)) {
        this.load.image(key, file);
      }
    }
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#1a1f1a');

    // Welt-Container fuer Tiles
    this.renderTiles();

    // Map basierend auf Save-Zone laden
    const ow = gameStore.getOverworldPos();
    this.currentZone = ow.zone || 'wurzelheim';
    this.map = MAPS[this.currentZone] ?? wurzelheim;
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
    this.keyP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.keyM = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);

    // Debug
    this.debugText = this.add.text(8, 8, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#9be36e'
    }).setScrollFactor(0).setDepth(2000);

    // Touch-Controls (D-Pad) - nur auf Touch-Geraeten sichtbar
    this.touch = buildTouchControls(this);
    this.player.touch = this.touch;

    // Audio-Context wird erst nach erstem User-Input freigeschaltet (Browser-Policy).
    // Wir attachen daher die BGM-Start an den ersten Pointer- oder Key-Event.
    const startAudio = () => {
      startAmbientBGM();
      this.input.off('pointerdown', startAudio);
      if (this.input.keyboard) this.input.keyboard.off('keydown', startAudio);
    };
    this.input.on('pointerdown', startAudio);
    this.input.keyboard?.on('keydown', startAudio);

    // Interact-Hint (E-Icon) ueber NPC oder Schild wenn Spieler benachbart
    this.interactHint = this.add.text(0, 0, '[E]', {
      fontFamily: 'monospace', fontSize: '8px', color: '#ffffff',
      backgroundColor: '#222222', padding: { x: 2, y: 1 }
    }).setDepth(50).setVisible(false).setOrigin(0.5, 1);

    // Day-Time-Tint: warmer Filter fuer cozy-Vibe
    const tint = this.add.rectangle(0, 0, 9999, 9999, 0xffd4a0, 0.08).setOrigin(0).setDepth(900).setScrollFactor(0);
    tint.setInteractive({ useHandCursor: false });
    tint.disableInteractive();

    console.log('[OverworldScene] created, player at', this.player.tileX, this.player.tileY);
    (window as any).__overworld = this;
  }

  public update(time: number, delta: number): void {
    if (this.dialog.open_) {
      // Wenn Dialog offen, Keys nur fuer Dialog-Advance
      const touchE = this.touch && this.touch.e.pressed && !this.prevTouchE;
      this.prevTouchE = this.touch ? this.touch.e.pressed : false;
      if (Phaser.Input.Keyboard.JustDown(this.keyE) || Phaser.Input.Keyboard.JustDown(this.keySpace) || touchE) {
        this.dialog.next();
      }
      return;
    }

    this.player.update(time, delta);

    // Update Interact-Hint
    this.updateInteractHint();

    // Periodische Position-Speicherung (alle ~2s wenn nicht moving)
    if (!this.player.isMoving) {
      this._saveAccum = (this._saveAccum ?? 0) + delta;
      if (this._saveAccum > 2000) {
        this._saveAccum = 0;
        gameStore.setOverworldPos(this.player.tileX, this.player.tileY, this.player.facing, 'OverworldScene');
      }
    }

    // Quest-Log-Hotkey
    if (Phaser.Input.Keyboard.JustDown(this.keyQ)) {
      gameStore.setOverworldPos(this.player.tileX, this.player.tileY, this.player.facing, 'OverworldScene', this.currentZone);
      this.scene.start('QuestLogScene');
      return;
    }
    // Markt-Hotkey
    if (Phaser.Input.Keyboard.JustDown(this.keyM)) {
      gameStore.setOverworldPos(this.player.tileX, this.player.tileY, this.player.facing, 'OverworldScene', this.currentZone);
      this.scene.start('MarketScene');
      return;
    }
    // Pokedex-Hotkey
    if (Phaser.Input.Keyboard.JustDown(this.keyP)) {
      gameStore.setOverworldPos(this.player.tileX, this.player.tileY, this.player.facing, 'OverworldScene', this.currentZone);
      this.scene.start('PokedexScene');
      return;
    }
    // Interact-Key (Tastatur oder Touch)
    const touchE = this.touch.e.pressed && !this.prevTouchE;
    this.prevTouchE = this.touch.e.pressed;
    if (Phaser.Input.Keyboard.JustDown(this.keyE) || Phaser.Input.Keyboard.JustDown(this.keySpace) || touchE) {
      this.tryInteract();
    }

    // Debug
    this.debugText.setText(
      `${this.currentZone}  Tile (${this.player.tileX}, ${this.player.tileY})  Facing ${this.player.facing}  [E=talk, P=pokedex, Q=quest, M=markt, Shift=run]`
    );
  }

  private updateInteractHint(): void {
    const front = this.player.getTileInFront();
    let show = false;
    let targetX = 0, targetY = 0;
    const npc = this.npcs.find((n) => n.data.tileX === front.tileX && n.data.tileY === front.tileY);
    if (npc) {
      show = true;
      targetX = npc.sprite.x;
      targetY = npc.sprite.y - 8;
    } else {
      const t = this.getTile(front.tileX, front.tileY);
      // Schild, Markstand oder Building-Tuer
      if (t === 10 || t === 9 || t === 8 || t === 7) {
        show = true;
        targetX = front.tileX * TILE_SIZE + TILE_SIZE / 2;
        targetY = front.tileY * TILE_SIZE + TILE_SIZE / 2 - 8;
      }
    }
    this.interactHint.setVisible(show);
    if (show) {
      this.interactHint.setPosition(targetX, targetY);
    }
  }

  private tryInteract(): void {
    const front = this.player.getTileInFront();
    // NPC?
    const npc = this.npcs.find((n) => n.data.tileX === front.tileX && n.data.tileY === front.tileY);
    if (npc) {
      const lines = [...npc.data.dialog];
      // Quest-Logic: Suche Quest fuer diesen NPC
      const quest = QUESTS.find((qq) => qq.giverId === npc.data.id);
      if (quest) {
        const status = gameStore.getQuestState(quest.id);
        if (status === 'pending') {
          lines.push('---', `Neue Quest: ${quest.title}`, quest.description);
          gameStore.acceptQuest(quest.id);
        } else if (status === 'active') {
          // Pruefe Erfuellung
          const ok = checkQuestComplete(quest);
          if (ok) {
            const rewardCoins = quest.reward.coins ?? 0;
            const rewardItems = quest.reward.items ?? {};
            gameStore.completeQuest(quest.id, rewardCoins, rewardItems);
            lines.push('---', `Quest abgeschlossen: ${quest.title}!`, `Belohnung: ${rewardCoins} Gold`);
          } else {
            lines.push('---', `Aktive Quest: ${quest.title} (noch nicht erfuellt)`);
          }
        } else {
          lines.push('---', `${quest.title}: erledigt.`);
        }
      }
      this.dialog.open(lines);
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
    const layer = this.add.container(0, 0);
    // Erstes Pass: Boden (Gras, Sand, Schnee, Strand) ohne Variation
    for (let y = 0; y < this.map.height; y++) {
      for (let x = 0; x < this.map.width; x++) {
        const t = this.map.tiles[y][x];
        const baseKey = this.getBaseTileKey(t);
        const baseSprite = this.add.image(
          x * TILE_SIZE + TILE_SIZE / 2,
          y * TILE_SIZE + TILE_SIZE / 2,
          baseKey
        );
        baseSprite.setDisplaySize(TILE_SIZE, TILE_SIZE);
        layer.add(baseSprite);
      }
    }
    // Zweites Pass: Deko (Tree, Cactus, Bromeliad etc.) on top of base
    for (let y = 0; y < this.map.height; y++) {
      for (let x = 0; x < this.map.width; x++) {
        const t = this.map.tiles[y][x];
        if (this.isDecoTile(t)) {
          const key = TILE_SPRITE_KEYS[t];
          if (key && this.textures.exists(key)) {
            const deco = this.add.image(
              x * TILE_SIZE + TILE_SIZE / 2,
              y * TILE_SIZE + TILE_SIZE / 2,
              key
            );
            deco.setDisplaySize(TILE_SIZE, TILE_SIZE);
            layer.add(deco);
          }
        }
      }
    }
    layer.setDepth(0);
  }

  private getBaseTileKey(t: number): string {
    // Base-Tile pro Zone (kein Tree/Cactus etc auf Top-Layer)
    if (this.currentZone === 'kaktoria') return 'tile_sand';
    if (this.currentZone === 'frostkamm') return 'tile_snow';
    if (this.currentZone === 'salzbucht') return 'tile_beachsand';
    // wurzelheim/verdanto base = grass
    if (t === 1) return 'tile_path';
    if (t === 3) return 'tile_water';
    if (t === 21) return 'tile_snow';
    if (t === 22) return 'tile_ice';
    if (t === 25) return 'tile_beachsand';
    if (t === 26) return 'tile_saltwater';
    if (t === 16) return 'tile_sand';
    return 'tile_grass';
  }

  private isDecoTile(t: number): boolean {
    // Tiles die auf top of base layer sollen
    return [2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 23, 24, 27, 28].includes(t);
  }

  private getTile(x: number, y: number): number {
    if (x < 0 || x >= this.map.width || y < 0 || y >= this.map.height) return 4;
    return this.map.tiles[y][x];
  }

  private handleMapEdge(tileX: number, tileY: number): void {
    // Wurzelheim Sueden -> Verdanto Norden
    if (this.currentZone === 'wurzelheim' && tileY >= this.map.height - 1) {
      this.changeZone('verdanto', 14, 1, 'down');
      return;
    }
    // Verdanto Norden -> Wurzelheim Sueden
    if (this.currentZone === 'verdanto' && tileY <= 0) {
      this.changeZone('wurzelheim', 14, this.map.height - 2, 'up');
      return;
    }
    // Verdanto Sueden -> Salzbucht Norden
    if (this.currentZone === 'verdanto' && tileY >= this.map.height - 1) {
      this.changeZone('salzbucht', tileX, 1, 'down');
      return;
    }
    // Salzbucht Norden -> Verdanto Sueden
    if (this.currentZone === 'salzbucht' && tileY <= 0) {
      this.changeZone('verdanto', tileX, this.map.height - 2, 'up');
      return;
    }
    // Verdanto Osten -> Kaktoria West (durch Map-Edge an X=W-1)
    if (this.currentZone === 'verdanto' && tileX >= this.map.width - 1) {
      this.changeZone('kaktoria', 1, tileY, 'right');
      return;
    }
    // Kaktoria Osten -> Verdanto West (umgekehrt)
    if (this.currentZone === 'kaktoria' && tileX >= this.map.width - 1) {
      this.changeZone('verdanto', this.map.width - 2, tileY, 'left');
      return;
    }
    // Kaktoria Norden -> Frostkamm Sueden
    if (this.currentZone === 'kaktoria' && tileY <= 0) {
      this.changeZone('frostkamm', tileX, this.map.height - 2, 'up');
      return;
    }
    // Frostkamm Sueden -> Kaktoria Norden
    if (this.currentZone === 'frostkamm' && tileY >= this.map.height - 1) {
      this.changeZone('kaktoria', tileX, 1, 'down');
      return;
    }
    // Frostkamm Norden -> (Glaciara V0.9)
    if (this.currentZone === 'frostkamm' && tileY <= 0) {
      this.dialog.open(['Vor dir liegt Glaciara, das Endgame-Biom.', '(In V0.9 freischaltbar)']);
      return;
    }
    void tileX;
  }

  private changeZone(newZone: string, spawnX: number, spawnY: number, facing: 'up' | 'down' | 'left' | 'right'): void {
    console.log('[OverworldScene] zone change', this.currentZone, '->', newZone);
    sfx.dialogOpen();
    gameStore.setOverworldPos(spawnX, spawnY, facing, 'OverworldScene', newZone);
    this.scene.restart();
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
      console.log('[OverworldScene] door triggered, switching to GardenScene');
      sfx.door();
      gameStore.setOverworldPos(this.player.tileX, this.player.tileY, this.player.facing, 'GardenScene');
      this.scene.start('GardenScene');
      return;
    }
    // Map-Edge: Zone-Wechsel
    if (t === 11) {
      this.handleMapEdge(tileX, tileY);
      return;
    }
    // Hohes Gras (Tile 2) oder Bromelien (Tile 13): Encounter-Trigger
    const encounterRate = t === 13 ? 0.10 : (t === 2 ? 0.05 : 0);
    if (encounterRate > 0 && Math.random() < encounterRate) {
      const pool = getEncounterPool(this.currentZone, t);
      console.log('[OverworldScene] encounter triggered on tile', t, 'pool:', this.currentZone, 'size:', pool.length);
      gameStore.setOverworldPos(this.player.tileX, this.player.tileY, this.player.facing, 'OverworldScene', this.currentZone);
      sfx.dialogOpen();
      let poolKey = 'wurzelheim-tallgrass';
      if (this.currentZone === 'verdanto') poolKey = t === 13 ? 'verdanto-bromelien' : 'verdanto-tallgrass';
      else if (this.currentZone === 'kaktoria') poolKey = 'kaktoria-tallgrass';
      else if (this.currentZone === 'frostkamm') poolKey = 'frostkamm-tallgrass';
      else if (this.currentZone === 'salzbucht') poolKey = 'salzbucht-tallgrass';
      this.scene.start('BattleScene', { poolKey });
      return;
    }
  }
}
