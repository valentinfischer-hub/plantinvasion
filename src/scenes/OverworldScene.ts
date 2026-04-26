import Phaser from 'phaser';
import wurzelheim, { type MapDef } from '../data/maps/wurzelheim';
import verdanto from '../data/maps/verdanto';
import kaktoria from '../data/maps/kaktoria';
import frostkamm from '../data/maps/frostkamm';
import salzbucht from '../data/maps/salzbucht';
import mordwald from '../data/maps/mordwald';
import magmabluete from '../data/maps/magmabluete';
import glaciara from '../data/maps/glaciara';
import { WURZELHEIM_TALLGRASS, VERDANTO_TALLGRASS, VERDANTO_BROMELIEN, KAKTORIA_TALLGRASS, FROSTKAMM_TALLGRASS, SALZBUCHT_TALLGRASS, MORDWALD_TALLGRASS, MAGMABLUETE_TALLGRASS,
  GLACIARA_TALLGRASS, pickEncounter, randomLevel, type EncounterDef } from '../data/encounters';
import {
  TILE_SIZE,
  CAMERA_ZOOM,
  CAMERA_LERP
} from '../utils/constants';
import { PlayerController, type CollisionChecker } from '../entities/PlayerController';
import { NPC } from '../entities/NPC';
import { DialogBox } from '../ui/DialogBox';
import { TILE_SPRITE_KEYS, getAllSpriteFiles } from '../assets/spriteRegistry';
import { generateBiomeFallbackTiles } from '../assets/biomeFallbackTiles';
import { gameStore } from '../state/gameState';
import { sfx, startAmbientBGM } from '../audio/sfxGenerator';
import { isForageTile, FORAGE_TILE_BUSH, FORAGE_TILE_WILDPLANT, findHiddenSpot } from '../data/foraging';
import { getAchievement } from '../data/achievements';
import { QUESTS, type QuestDef } from '../data/quests';
import { buildTouchControls, type TouchKeysHandle } from '../ui/TouchControls';
import { TutorialOverlay } from '../ui/TutorialOverlay';
import { MiniMap } from '../ui/MiniMap';
import { PauseOverlay } from '../ui/PauseOverlay';
import { TimeOverlay } from '../ui/TimeOverlay';
import { WeatherOverlay } from '../ui/WeatherOverlay';

const SIGN_DIALOGS: Record<string, string[]> = {
  // Verdanto
  'verdanto:7:9': ['Schild: Verdanto-Pfad', 'Achte auf die Bromelien, sie speichern Wasser.'],
  'verdanto:20:12': ['Schild: Wuergefeigen-Sektor', 'Hinter den hohen Lianen leben rare Encounter.'],
  // Kaktoria
  'kaktoria:8:7': ['Schild: Wuesten-Pfad', 'Wasser ist hier knapp. Trag immer Aloe-Saft mit dir.'],
  'kaktoria:22:11': ['Schild: Saguaro-Hain', 'Riesenkakteen koennen 100 Jahre alt werden.'],
  // Frostkamm
  'frostkamm:8:7': ['Schild: Eisroute', 'Vorsicht, Eis-Tiles rutschen.'],
  'frostkamm:22:12': ['Schild: Bergfichten-Wald', 'Ueber Tausenden Jahren gewachsen.'],
  // Salzbucht
  'salzbucht:7:6': ['Schild: Strandweg', 'Bei Sturm kommen rare Encounter.'],
  'salzbucht:21:11': ['Schild: Mangrove-Inseln', 'Brackwasser - manche Pflanzen lieben es.'],
  // Mordwald
  'mordwald:8:5': ['Schild: Sumpfpfad', 'Folge dem Holzsteg, sonst sinkst du.'],
  'mordwald:20:12': ['Schild: Karnivoren-Anbau', 'Hier wachsen die hungrigsten Pflanzen.'],
  // Magmabluete
  'magmabluete:7:5': ['Schild: Lava-Adern', 'Vorsicht: Lava-Tiles geben Schaden!'],
  'magmabluete:22:12': ['Schild: Krater-Pfad', 'Ganz oben wartet das Magmaherz.'],
  // Glaciara
  'glaciara:8:6': ['Schild: Endgame-Eis', 'Hier wachsen die haertesten Pflanzen.'],
  'glaciara:22:12': ['Schild: Mythical-Tor', 'Eden Lost wartet hinter dem Tor.'],
};

// Building-Tueren bleiben collide, Dialog kommt via interact key (E/Space) wenn der Spieler davor steht
const COLLIDE_TILES = new Set<number>([3, 4, 5, 6, 8, 9, 10, 14, 31, 32, 42, 43, 50, 51, 61, 62, 64]);

const MAPS: Record<string, MapDef> = {
  wurzelheim,
  verdanto,
  kaktoria,
  frostkamm,
  salzbucht,
  mordwald,
  magmabluete,
  glaciara
};

function getEncounterPool(zone: string, tile: number): EncounterDef[] {
  if (zone === 'verdanto') {
    if (tile === 13) return VERDANTO_BROMELIEN;
    return VERDANTO_TALLGRASS;
  }
  if (zone === 'kaktoria') return KAKTORIA_TALLGRASS;
  if (zone === 'frostkamm') return FROSTKAMM_TALLGRASS;
  if (zone === 'salzbucht') return SALZBUCHT_TALLGRASS;
  if (zone === 'mordwald') return MORDWALD_TALLGRASS;
  if (zone === 'magmabluete') return MAGMABLUETE_TALLGRASS;
  if (zone === 'glaciara') return GLACIARA_TALLGRASS;
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
  private keyI!: Phaser.Input.Keyboard.Key;
  private keyBoss!: Phaser.Input.Keyboard.Key;
  private keyDiary!: Phaser.Input.Keyboard.Key;
  private debugText!: Phaser.GameObjects.Text;
  private _saveAccum?: number;
  private interactHint!: Phaser.GameObjects.Text;
  private touch!: TouchKeysHandle;
  private prevTouchE = false;
  private knownAchievements: Set<string> = new Set();
  private tutorial!: TutorialOverlay;
  private miniMap!: MiniMap;
  private pauseMenu!: PauseOverlay;
  private keyEsc!: Phaser.Input.Keyboard.Key;
  private keyH!: Phaser.Input.Keyboard.Key;
  private key1!: Phaser.Input.Keyboard.Key;
  private key2!: Phaser.Input.Keyboard.Key;
  private key3!: Phaser.Input.Keyboard.Key;
  private key4!: Phaser.Input.Keyboard.Key;
  private timeOverlay!: TimeOverlay;
  private saveIcon!: Phaser.GameObjects.Text;
  private weatherOverlay!: WeatherOverlay;

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

  // Wird in create() VOR renderTiles aufgerufen, damit procedural-Texturen
  // fuer Mordwald/Magmabluete bereitstehen falls kein PNG geladen wurde.
  private ensureBiomeFallbackTiles(): void {
    generateBiomeFallbackTiles(this);
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#1a1f1a');

    // Procedural-Fallback-Tiles fuer Biome ohne PNG
    this.ensureBiomeFallbackTiles();
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
    this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.keyH = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H);
    this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.key3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    this.key4 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);
    this.keyBoss = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    this.keyDiary = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);

    // Debug
    this.debugText = this.add.text(8, 8, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#9be36e'
    }).setScrollFactor(0).setDepth(2000);

    // Touch-Controls (D-Pad) - nur auf Touch-Geraeten sichtbar
    this.touch = buildTouchControls(this);
    this.player.touch = this.touch;

    // Tutorial-Overlay
    this.tutorial = new TutorialOverlay(this);
    this.miniMap = new MiniMap(this);
    this.miniMap.refresh(this.currentZone);
    this.pauseMenu = new PauseOverlay(this, [
      { label: 'Weiterspielen', onSelect: () => this.pauseMenu.close() },
      { label: 'Inventar (I)', onSelect: () => { this.pauseMenu.close(); this.scene.start('InventoryScene'); } },
      { label: 'Pokedex (P)', onSelect: () => { this.pauseMenu.close(); this.scene.start('PokedexScene'); } },
      { label: 'Quests (Q)', onSelect: () => { this.pauseMenu.close(); this.scene.start('QuestLogScene'); } },
      { label: 'Hauptmenu', onSelect: () => { this.pauseMenu.close(); this.scene.start('MenuScene'); } }
    ]);
    if (this.tutorial && this.tutorial.ignoreInUICam) this.tutorial.ignoreInUICam((this.pauseMenu as any).container);
    if (this.timeOverlay && (this.timeOverlay as any).ignoreInUICam) (this.timeOverlay as any).ignoreInUICam((this.pauseMenu as any).container);
    if (this.timeOverlay && (this.timeOverlay as any).ignoreInUICam) (this.timeOverlay as any).ignoreInUICam((this.miniMap as any).container);
    if (this.tutorial && this.tutorial.ignoreInUICam) this.tutorial.ignoreInUICam((this.miniMap as any).container);

    // Day-Night-Cycle
    this.timeOverlay = new TimeOverlay(this);
    this.weatherOverlay = new WeatherOverlay(this);

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

    // Farm-Button: persistent oben rechts, fuehrt zur GardenScene (alias "Farm")
    this.makeFarmButton();
    if (this.input.keyboard) {
      const farmKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G);
      farmKey.on('down', () => this.gotoFarm());
    }

    console.log('[OverworldScene] created, player at', this.player.tileX, this.player.tileY);
    (window as any).__overworld = this;

    // Daily-Login-Reward: einmalig pro Real-Time-Tag claimen, dann Toast
    this.tryClaimDailyLogin();
    // Auto-Save-Indicator (oben-links, blendet kurz auf bei jedem Save)
    const camS = this.cameras.main;
    const zS = camS.zoom || 1;
    this.saveIcon = this.add.text(8 / zS, 24 / zS, '* gespeichert', {
      fontFamily: 'monospace', fontSize: '11px', color: '#9be36e', backgroundColor: '#1a1f1a', padding: { x: 4, y: 2 }
    }).setScrollFactor(0).setDepth(1900).setScale(1 / zS).setAlpha(0);
    if (this.tutorial && this.tutorial.ignoreInUICam) this.tutorial.ignoreInUICam(this.saveIcon);
    if (this.timeOverlay && (this.timeOverlay as any).ignoreInUICam) (this.timeOverlay as any).ignoreInUICam(this.saveIcon);
    // Zone-Visit fuer Achievement-Tracking
    gameStore.recordZoneVisit(this.currentZone);

    // Initial-Snapshot der bekannten Achievements
    this.knownAchievements = new Set(gameStore.getAchievements());
    // Subscribe fuer Achievement-Diffs
    gameStore.subscribe(() => this.checkNewAchievements());
  }

  private checkNewAchievements(): void {
    const current = gameStore.getAchievements();
    for (const slug of current) {
      if (!this.knownAchievements.has(slug)) {
        this.knownAchievements.add(slug);
        this.showAchievementToast(slug);
      }
    }
  }

  private showAchievementToast(slug: string): void {
    const def = getAchievement(slug);
    if (!def) return;
    const cam = this.cameras.main;
    const z = cam.zoom || 1;
    // Camera-Zoom-aware Position (siehe DialogBox.ts)
    const container = this.add
      .container(cam.width / 2 / z, 80 / z)
      .setScrollFactor(0)
      .setDepth(2100)
      .setScale(1 / z);
    const bg = this.add.graphics();
    bg.fillStyle(0xffd166, 0.95);
    bg.fillRoundedRect(-160, -28, 320, 56, 8);
    bg.lineStyle(2, 0xb86ee3, 1);
    bg.strokeRoundedRect(-160, -28, 320, 56, 8);
    container.add(bg);
    const title = this.add.text(0, -16, 'Achievement!', {
      fontFamily: 'monospace', fontSize: '12px', color: '#1a1f1a'
    }).setOrigin(0.5, 0);
    const name = this.add.text(0, 4, def.name, {
      fontFamily: 'monospace', fontSize: '14px', color: '#1a1f1a'
    }).setOrigin(0.5, 0);
    container.add([title, name]);
    if (this.tutorial && this.tutorial.ignoreInUICam) this.tutorial.ignoreInUICam(container);
    if (this.timeOverlay && (this.timeOverlay as any).ignoreInUICam) (this.timeOverlay as any).ignoreInUICam(container);
    sfx.dialogOpen();
    this.tweens.add({
      targets: container,
      alpha: { from: 1, to: 0 },
      delay: 3000,
      duration: 1500,
      onComplete: () => container.destroy()
    });
  }


  private makeFarmButton(): void {
    const { width } = this.scale;
    const btnX = width - 60;
    const btnY = 22;
    const c = this.add.container(btnX, btnY).setScrollFactor(0).setDepth(1900);
    const bg = this.add.graphics();
    bg.fillStyle(0x9be36e, 0.92);
    bg.fillRoundedRect(-44, -16, 88, 32, 6);
    bg.lineStyle(2, 0x4a8228, 1);
    bg.strokeRoundedRect(-44, -16, 88, 32, 6);
    const txt = this.add.text(0, -2, 'FARM (G)', {
      fontFamily: 'monospace', fontSize: '11px', color: '#1a1f1a'
    }).setOrigin(0.5);
    const hint = this.add.text(0, 9, 'giessen', {
      fontFamily: 'monospace', fontSize: '7px', color: '#1a1f1a'
    }).setOrigin(0.5);
    c.add([bg, txt, hint]);
    bg.setInteractive(new Phaser.Geom.Rectangle(-44, -16, 88, 32), Phaser.Geom.Rectangle.Contains);
    bg.on('pointerdown', () => this.gotoFarm());
    if (this.miniMap && (this.miniMap as any).ignoreInUICam) (this.miniMap as any).ignoreInUICam(c);
  }

  private gotoFarm(): void {
    if (this.dialog?.open_) return;
    sfx.door();
    gameStore.setOverworldPos(this.player.tileX, this.player.tileY, this.player.facing, 'GardenScene', this.currentZone);
    this.scene.start('GardenScene');
  }

  private tryClaimDailyLogin(): void {
    const r = gameStore.claimDailyLogin();
    if (!r.ok || !r.reward) return;
    const cam = this.cameras.main;
    const z = cam.zoom || 1;
    // Position durch zoom teilen, weil scrollFactor 0 nicht vom Camera-Zoom befreit.
    // Scale 1/z gleicht Pixel-Skalierung der Schrift aus.
    const toast = this.add
      .text(cam.width / 2 / z, (cam.height - 60) / z, `Tagesbelohnung: ${r.reward.label}`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffd166',
        backgroundColor: '#1a1f1a',
        padding: { x: 12, y: 8 }
      })
      .setOrigin(0.5)
      .setDepth(2000)
      .setScrollFactor(0)
      .setScale(1 / z);
    // Verhindere Doppel-Rendering durch UI-Cam des Tutorial-Overlays
    if (this.tutorial && this.tutorial.ignoreInUICam) this.tutorial.ignoreInUICam(toast);
    if (this.timeOverlay && (this.timeOverlay as any).ignoreInUICam) (this.timeOverlay as any).ignoreInUICam(toast);
    this.tweens.add({
      targets: toast,
      alpha: 0,
      duration: 4000,
      delay: 2500,
      onComplete: () => toast.destroy()
    });
  }

  private flashSaveIcon(): void {
    if (!this.saveIcon) return;
    this.saveIcon.setAlpha(1);
    this.tweens.add({ targets: this.saveIcon, alpha: 0, duration: 1200, delay: 600 });
  }

  public update(time: number, delta: number): void {
    if (this.dialog.open_) {
      // Choice-Mode: number keys 1-4
      if ((this.dialog as any).isChoiceMode_) {
        if (Phaser.Input.Keyboard.JustDown(this.key1)) { (this.dialog as any).selectChoice(0); return; }
        if (Phaser.Input.Keyboard.JustDown(this.key2)) { (this.dialog as any).selectChoice(1); return; }
        if (Phaser.Input.Keyboard.JustDown(this.key3)) { (this.dialog as any).selectChoice(2); return; }
        if (Phaser.Input.Keyboard.JustDown(this.key4)) { (this.dialog as any).selectChoice(3); return; }
        return;
      }
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

    // Tageszeit ticken
    this.timeOverlay?.tick(delta);
    this.weatherOverlay?.tick(delta);

    // Tutorial Auto-Advance
    this.tutorial.checkAdvance({ tileX: this.player.tileX, tileY: this.player.tileY, facing: this.player.facing, isMoving: this.player.isMoving });

    // Periodische Position-Speicherung (alle ~2s wenn nicht moving)
    if (!this.player.isMoving) {
      this._saveAccum = (this._saveAccum ?? 0) + delta;
      if (this._saveAccum > 2000) {
        this._saveAccum = 0;
        gameStore.setOverworldPos(this.player.tileX, this.player.tileY, this.player.facing, 'OverworldScene');
        this.flashSaveIcon();
      }
    }

    // Tagebuch-Hotkey (T)
    if (Phaser.Input.Keyboard.JustDown(this.keyDiary)) {
      gameStore.setOverworldPos(this.player.tileX, this.player.tileY, this.player.facing, 'OverworldScene', this.currentZone);
      this.scene.start('DiaryScene');
      return;
    }
    // Boss-Battle-Trigger (K-Hotkey): startet aktive boss-quest in current zone
    if (Phaser.Input.Keyboard.JustDown(this.keyBoss)) {
      const activeBossQuest = QUESTS.find((qq) => {
        if (qq.goal.type !== 'defeat-boss') return false;
        if (gameStore.getQuestState(qq.id) !== 'active') return false;
        return true;
      });
      if (activeBossQuest && activeBossQuest.goal.type === 'defeat-boss') {
        gameStore.setOverworldPos(this.player.tileX, this.player.tileY, this.player.facing, 'OverworldScene', this.currentZone);
        this.scene.start('BattleScene', { bossId: activeBossQuest.goal.bossId });
        return;
      }
    }
    // Quest-Log-Hotkey
    if (Phaser.Input.Keyboard.JustDown(this.keyQ)) {
      this.tutorial?.markInteract('quest');
      gameStore.setOverworldPos(this.player.tileX, this.player.tileY, this.player.facing, 'OverworldScene', this.currentZone);
      this.scene.start('QuestLogScene');
      return;
    }
    // Markt-Hotkey
    if (Phaser.Input.Keyboard.JustDown(this.keyM)) {
      this.tutorial?.markInteract('market');
      gameStore.setOverworldPos(this.player.tileX, this.player.tileY, this.player.facing, 'OverworldScene', this.currentZone);
      this.scene.start('MarketScene');
      return;
    }
    // Pokedex-Hotkey
    if (Phaser.Input.Keyboard.JustDown(this.keyEsc)) {
      this.pauseMenu.toggle();
      return;
    }
    if (this.pauseMenu.open_) return;
    if (Phaser.Input.Keyboard.JustDown(this.keyH)) {
      const used = gameStore.consumeItem('heal-tonic');
      if (used) {
        const plants = gameStore.get().plants;
        if (plants[0]) {
          (plants[0] as any).hydration = 100;
        }
        sfx.pickup();
      } else {
        sfx.bump();
      }
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyI)) {
      sfx.dialogOpen();
      this.scene.start('InventoryScene');
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyP)) {
      this.tutorial?.markInteract('pokedex');
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
      `${this.currentZone}  Tile (${this.player.tileX}, ${this.player.tileY})  Facing ${this.player.facing}  [E=talk, P=pokedex, Q=quest, M=markt, K=boss, T=tagebuch, Shift=run]`
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
      // Schild, Markstand, Building-Tuer, Forage-Tile, oder Hidden-Spot
      const hidden = findHiddenSpot(this.currentZone, front.tileX, front.tileY);
      const onHidden = hidden && !(gameStore.get().collectedHiddenSpots ?? []).includes(`${hidden.zone}:${hidden.tileX}:${hidden.tileY}`);
      if (t === 10 || t === 9 || t === 8 || t === 7 || isForageTile(t) || onHidden) {
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
      // Berry-Master: Daily-Free-Seed-Dialog
      // Iris: Choice-basiertes Story-Dialog (S-09)
      if (npc.data.id === 'iris-salbeyen') {
        this.tutorial?.markInteract('npc');
        const metFlag = gameStore.getStoryFlag?.('met_iris') ?? false;
        if (!metFlag) {
          this.dialog.openWithChoices(
            'Iris: Endlich. Ich habe schon auf dich gewartet, Erbin von Tilda.\nWillst du mit mir ueber die Sieben Biome reden?',
            [
              { label: 'Ja, erzaehl mir alles!', onSelect: () => {
                  gameStore.setStoryFlag?.('met_iris', true);
                  gameStore.acceptQuest('act1-meet-iris');
                  gameStore.completeQuest('act1-meet-iris', 0, { 'heal-tonic': 3 });
                  this.dialog.open([
                    'Iris: Danke. Du hast die Augen deiner Grossmutter.',
                    'Iris: Die Sieben Biome warten. Verodyne wird sie alle vergiften wenn wir nichts tun.',
                    'Iris: Ich gebe dir 3 Heil-Tonika. Pass auf dich auf, Botanikerin.'
                  ]);
                } },
              { label: 'Spaeter, vielleicht.', onSelect: () => {
                  this.dialog.open([
                    'Iris: Verstaendlich. Ich bin hier wenn du bereit bist.',
                    '(Komm zurueck und sprich mich erneut an wenn du loslegen willst.)'
                  ]);
                } },
              { label: 'Wer bist du eigentlich?', onSelect: () => {
                  this.dialog.open([
                    'Iris: Iris Salbeyen. Wandernde Forscherin der Botanischen Akademie.',
                    'Iris: Ich kannte deine Grossmutter Tilda gut.',
                    'Iris: (Sprich mich erneut an wenn du Lust hast loszuziehen.)'
                  ]);
                } }
            ]
          );
        } else {
          this.dialog.open([
            'Iris: Wie geht deine Reise voran, Botanikerin?',
            'Iris: Pass auf dich auf in den fremden Biomen.'
          ]);
        }
        return;
      }
      // Theo: Tausch-Modus (Item-fuer-Item, S-09)
      if (npc.data.id === 'theo-trader') {
        this.tutorial?.markInteract('npc');
        const inv = gameStore.getInventory();
        const choices: { label: string; onSelect: () => void }[] = [];
        const trades = [
          { wantSlug: 'seed-bromelia', wantQty: 1, giveSlug: 'great-lure', giveQty: 1, label: '1x Bromelia-Samen -> 1x Starker Lockstoff' },
          { wantSlug: 'seed-fern', wantQty: 1, giveSlug: 'compost-tea', giveQty: 1, label: '1x Fern-Samen -> 1x Kompost-Tee' },
          { wantSlug: 'seed-lavender', wantQty: 1, giveSlug: 'heal-tonic', giveQty: 2, label: '1x Lavender-Samen -> 2x Heil-Tonikum' }
        ];
        for (const t of trades) {
          const has = (inv[t.wantSlug] ?? 0) >= t.wantQty;
          if (has) {
            choices.push({
              label: t.label,
              onSelect: () => {
                gameStore.consumeItem(t.wantSlug);
                gameStore.addItem(t.giveSlug, t.giveQty);
                this.dialog.open([`Theo: Tauschdeal! Du erhaeltst ${t.giveQty}x ${t.giveSlug}.`]);
              }
            });
          }
        }
        choices.push({ label: 'Abbrechen', onSelect: () => {} });
        if (choices.length === 1) {
          this.dialog.open([
            'Theo: Du hast nichts dabei was ich brauche.',
            'Theo: Bring mir Samen aus Verdanto oder Wurzelheim, dann tauschen wir.'
          ]);
        } else {
          this.dialog.openWithChoices(
            'Theo: Was haettest du gern?',
            choices.slice(0, 4)
          );
        }
        return;
      }
      if (npc.data.id === 'bertram-berrymaster') {
        this.tutorial?.markInteract('npc');
        const r = gameStore.claimBerryMaster();
        if (r.ok) {
          const slug = r.itemSlug?.replace('seed-', '') ?? 'Samen';
          this.dialog.open([
            'Bertram: Schau, was ich heute fuer dich habe.',
            `Du erhaeltst: 1 ${slug} Samen!`,
            'Bertram: Komm morgen wieder.'
          ]);
        } else {
          this.dialog.open([
            'Bertram: Heute schon vorbeigeschaut, gell?',
            r.reason ?? 'Komm morgen wieder.'
          ]);
        }
        return;
      }
      this.tutorial?.markInteract('npc');
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
      const key = `${this.currentZone}:${front.tileX}:${front.tileY}`;
      const dlg = SIGN_DIALOGS[key];
      if (dlg) {
        this.dialog.open(dlg);
      } else {
        // Default-Dialog (Wurzelheim-Schild)
        this.dialog.open([
          'Schild: Heimatdorf Wurzelheim.',
          'Schild: Hinter dieser Tuer ist Grossmutters Garten.'
        ]);
      }
      return;
    }
    if (t === 9) {
      this.dialog.open([
        'Marktstand: Heute frischer Honig und Sonnenblumen-Samen.',
        'Marktstand: (Markt-Mechanik kommt in V0.3)'
      ]);
      return;
    }
    // Forage-Tile? (Tile 50 Bush, 51 WildPlant)
    if (t === FORAGE_TILE_BUSH || t === FORAGE_TILE_WILDPLANT) {
      const result = gameStore.forageTile(this.currentZone, front.tileX, front.tileY);
      if (result.ok) {
        sfx.dialogOpen();
        this.dialog.open([result.toast ?? 'Du hast etwas gefunden!']);
      } else {
        this.dialog.open([result.reason ?? 'Hier ist gerade nichts.']);
      }
      return;
    }
    // Hidden-Spot? (versteckte Position auf normalem Tile)
    const spot = findHiddenSpot(this.currentZone, front.tileX, front.tileY);
    if (spot) {
      const result = gameStore.searchHiddenSpot(this.currentZone, front.tileX, front.tileY);
      if (result.ok) {
        sfx.dialogOpen();
        this.dialog.open(['Du findest etwas Verstecktes!', result.toast ?? '+1 Item']);
        return;
      }
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
    if (this.currentZone === 'mordwald') return 'tile_swampfloor';
    if (this.currentZone === 'magmabluete') return 'tile_ash';
    if (this.currentZone === 'glaciara') return 'tile_iceground';
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
    return [2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 23, 24, 27, 28, 31, 32, 33, 34, 41, 42, 43, 44, 45, 50, 51, 60, 61, 62, 63, 64].includes(t);
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
    // Frostkamm Norden -> Glaciara Sueden
    if (this.currentZone === 'frostkamm' && tileY <= 0) {
      this.changeZone('glaciara', tileX, this.map.height - 2, 'up');
      return;
    }
    // Glaciara Sueden -> Frostkamm Norden
    if (this.currentZone === 'glaciara' && tileY >= this.map.height - 1) {
      this.changeZone('frostkamm', tileX, 1, 'down');
      return;
    }
    // Glaciara Norden -> Eden Lost (nicht implementiert in V0.6)
    if (this.currentZone === 'glaciara' && tileY <= 0) {
      this.dialog.open(['Mythical-Tor: Du brauchst Verodyne-Schluessel.', '(Eden Lost in V1.0 freischaltbar)']);
      return;
    }
    // Salzbucht Sueden -> Mordwald Norden
    if (this.currentZone === 'salzbucht' && tileY >= this.map.height - 1) {
      this.changeZone('mordwald', tileX, 1, 'down');
      return;
    }
    // Mordwald Norden -> Salzbucht Sueden
    if (this.currentZone === 'mordwald' && tileY <= 0) {
      this.changeZone('salzbucht', tileX, this.map.height - 2, 'up');
      return;
    }
    // Mordwald Sueden -> Magmabluete Norden
    if (this.currentZone === 'mordwald' && tileY >= this.map.height - 1) {
      this.changeZone('magmabluete', tileX, 1, 'down');
      return;
    }
    // Magmabluete Norden -> Mordwald Sueden
    if (this.currentZone === 'magmabluete' && tileY <= 0) {
      this.changeZone('mordwald', tileX, this.map.height - 2, 'up');
      return;
    }
    void tileX;
  }

  private changeZone(newZone: string, spawnX: number, spawnY: number, facing: 'up' | 'down' | 'left' | 'right'): void {
    console.log('[OverworldScene] zone change', this.currentZone, '->', newZone);
    sfx.dialogOpen();
    gameStore.setOverworldPos(spawnX, spawnY, facing, 'OverworldScene', newZone);
    gameStore.recordZoneVisit(newZone);
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
    const encounterRate = t === 13 ? 0.10 : (t === 2 || t === 34 || t === 44 ? 0.07 : 0);
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
      else if (this.currentZone === 'mordwald') poolKey = 'mordwald-tallgrass';
      else if (this.currentZone === 'magmabluete') poolKey = 'magmabluete-tallgrass';
      else if (this.currentZone === 'glaciara') poolKey = 'glaciara-tallgrass';
      this.scene.start('BattleScene', { poolKey });
      return;
    }
  }
}
