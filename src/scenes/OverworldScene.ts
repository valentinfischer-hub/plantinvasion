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
  GLACIARA_TALLGRASS, type EncounterDef } from '../data/encounters';
import {
  TILE_SIZE,
  CAMERA_ZOOM,
  CAMERA_LERP
} from '../utils/constants';
import { PlayerController, type CollisionChecker } from '../entities/PlayerController';
import { NPC } from '../entities/NPC';
import { buildWallsSet, setNpcTarget } from '../entities/npcMovement';
import { mulberry32 } from '../data/genetics';
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
import { SeasonTintOverlay } from '../ui/SeasonTintOverlay';
import { AmbientParticles } from '../ui/AmbientParticles';
import { debugLog } from '../utils/debugLog';
import { t } from '../i18n/index';
import { showToast } from '../ui/Toast';
import { now as gameTimeNow } from '../utils/gameTime';
import { evaluateAct1Progress, autoSetAct1Flags } from '../data/storyAct1';
import { evaluateAct2Progress, autoSetAct2Flags } from '../data/storyAct2';
import { COLOR_SUCCESS, FONT_FAMILY, FONT_SIZE_BODY, FONT_SIZE_SMALL, FONT_SIZE_TITLE, MODAL_BORDER_COLOR } from '../ui/uiTheme';

const SIGN_DIALOGS: Record<string, string[]> = {
  // Verdanto
  'verdanto:7:9': [t('sign.verdanto_7_9.title'), t('sign.verdanto_7_9.text')],
  'verdanto:20:12': [t('sign.verdanto_20_12.title'), t('sign.verdanto_20_12.text')],
  // Kaktoria
  'kaktoria:8:7': [t('sign.kaktoria_8_7.title'), t('sign.kaktoria_8_7.text')],
  'kaktoria:22:11': [t('sign.kaktoria_22_11.title'), t('sign.kaktoria_22_11.text')],
  // Frostkamm
  'frostkamm:8:7': [t('sign.frostkamm_8_7.title'), t('sign.frostkamm_8_7.text')],
  'frostkamm:22:12': [t('sign.frostkamm_22_12.title'), t('sign.frostkamm_22_12.text')],
  // Salzbucht
  'salzbucht:7:6': [t('sign.salzbucht_7_6.title'), t('sign.salzbucht_7_6.text')],
  'salzbucht:21:11': [t('sign.salzbucht_21_11.title'), t('sign.salzbucht_21_11.text')],
  // Mordwald
  'mordwald:8:5': [t('sign.mordwald_8_5.title'), t('sign.mordwald_8_5.text')],
  'mordwald:20:12': [t('sign.mordwald_20_12.title'), t('sign.mordwald_20_12.text')],
  // Magmabluete
  'magmabluete:7:5': [t('sign.magmabluete_7_5.title'), t('sign.magmabluete_7_5.text')],
  'magmabluete:22:12': [t('sign.magmabluete_22_12.title'), t('sign.magmabluete_22_12.text')],
  // Glaciara
  'glaciara:8:6': [t('sign.glaciara_8_6.title'), t('sign.glaciara_8_6.text')],
  'glaciara:22:12': [t('sign.glaciara_22_12.title'), t('sign.glaciara_22_12.text')],
};

// SIGN_DIALOGS wird lazy evaluiert damit t() zum Zeitpunkt des Zugriffs die richtige Locale hat
function getSignDialogs(): Record<string, string[]> {
  return SIGN_DIALOGS;
}

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


/** Alle 30s ein neues Wander-Ziel (6 Movement-Ticks a 5s). */
const WANDER_INTERVAL_MS = 30_000;

/**
 * Waehlt ein zufaelliges Walk-Ziel-Tile fuer den NPC innerhalb seiner spawnArea.
 * Seed: NPC-ID-Hash XOR aktueller Wander-Tick (deterministisch, wechselt alle 30s).
 * Gibt null zurueck wenn kein freies Tile in 20 Versuchen gefunden wird.
 */
function pickWanderTarget(
  npcId: string,
  spawnTileX: number,
  spawnTileY: number,
  spawnRadius: number,
  walls: ReadonlySet<string>,
  now: number
): { x: number; y: number } | null {
  const idHash = Array.from(npcId).reduce((h, c) => {
    const hh = (h << 5) - h + c.charCodeAt(0);
    return hh | 0;
  }, 0);
  const wanderTick = Math.floor(now / WANDER_INTERVAL_MS);
  const seed = Math.abs(idHash) ^ (wanderTick * 1_099_511_629);
  const rng = mulberry32(seed >>> 0);
  const diameter = spawnRadius * 2 + 1;
  for (let attempt = 0; attempt < 20; attempt++) {
    const offX = Math.floor(rng() * diameter) - spawnRadius;
    const offY = Math.floor(rng() * diameter) - spawnRadius;
    const tx = spawnTileX + offX;
    const ty = spawnTileY + offY;
    if (!walls.has(`${tx},${ty}`)) {
      return { x: tx, y: ty };
    }
  }
  return null;
}

export class OverworldScene extends Phaser.Scene implements CollisionChecker {
  private map: MapDef = wurzelheim;
  private npcWalls: ReadonlySet<string> = new Set();
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
  private _storyFlagAccum?: number;
  private _lastPlayerTileX?: number;
  private _lastPlayerTileY?: number;
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
  private coinHud!: Phaser.GameObjects.Text;
  private weatherOverlay!: WeatherOverlay;
  private seasonTint!: SeasonTintOverlay;
  private particles!: AmbientParticles;

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
    this.npcWalls = buildWallsSet(this.map.tiles);
    this.player = new PlayerController(
      this,
      ow.tileX,
      ow.tileY,
      this
    );
    this.player.facing = ow.facing;

    // NPCs
    this.npcs = this.map.npcs.map((n) => new NPC(this, n));
    // S-09 V0.1: NPC-Walking aktivieren. Alle NPCs bekommen Movement-State, Step-Tick im update().
    this.npcs.forEach((npc) => npc.initMovement());
    // S-POLISH Run12: NPC warm tint wenn schon getroffen (subtile Freundschafts-Variation)
    this.npcs.forEach((npc) => {
      if (gameStore.hasMetNpc(npc.data.id)) {
        npc.sprite.setTint(0xffe8d0);
      }
    });
    this.refreshQuestIndicators();

    // Camera
    const worldW = this.map.width * TILE_SIZE;
    const worldH = this.map.height * TILE_SIZE;
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setZoom(CAMERA_ZOOM);
    this.cameras.main.startFollow(this.player.sprite, true, CAMERA_LERP, CAMERA_LERP);
    // S-POLISH Run3: FadeIn beim Scene-Start (Zone-Transition + erste Load)
    this.cameras.main.fadeIn(280, 0, 0, 0);

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
      fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_SMALL, color: COLOR_SUCCESS
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
    this.registerInAllUiCams(this.pauseMenu.container);
    this.registerInAllUiCams(this.pauseMenu.dim);
    this.registerInAllUiCams(this.miniMap.container);

    // Day-Night-Cycle
    this.timeOverlay = new TimeOverlay(this);
    this.weatherOverlay = new WeatherOverlay(this);
    this.seasonTint = new SeasonTintOverlay(this);
    this.particles = new AmbientParticles(this);

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
      fontFamily: FONT_FAMILY, fontSize: '8px', color: '#ffffff',
      backgroundColor: '#222222', padding: { x: 2, y: 1 }
    }).setDepth(50).setVisible(false).setOrigin(0.5, 1);

    // V0.2: Day-Time-Tint entfernt - TimeOverlay macht das schon, Stacking war zu dunkel

    // Farm-Button: persistent oben rechts, fuehrt zur GardenScene (alias "Farm")
    this.makeFarmButton();
    if (this.input.keyboard) {
      const farmKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G);
      farmKey.on('down', () => this.gotoFarm());
    }

    debugLog('[OverworldScene] created, player at', this.player.tileX, this.player.tileY);
    (globalThis as { __overworld?: OverworldScene }).__overworld = this;

    // Daily-Login-Reward: einmalig pro Real-Time-Tag claimen, dann Toast
    this.tryClaimDailyLogin();
    // Auto-Save-Indicator (oben-links, blendet kurz auf bei jedem Save)
    const camS = this.cameras.main;
    const zS = camS.zoom || 1;
    this.saveIcon = this.add.text(8 / zS, 24 / zS, '* gespeichert', {
      fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_BODY, color: COLOR_SUCCESS, backgroundColor: '#1a1f1a', padding: { x: 4, y: 2 }
    }).setScrollFactor(0).setDepth(1900).setScale(1 / zS).setAlpha(0);
    this.registerInAllUiCams(this.saveIcon);

    // Coin-HUD oben-links unter saveIcon
    this.coinHud = this.add.text(8 / zS, 42 / zS, t('ow.coins.label'), {
      fontFamily: FONT_FAMILY, fontSize: '12px', color: '#f4e8c1', stroke: '#000000', strokeThickness: 2, backgroundColor: '#1a1f1a', padding: { x: 6, y: 3 }
    }).setScrollFactor(0).setDepth(1850).setScale(1 / zS);
    this.registerInAllUiCams(this.coinHud);
    this.refreshCoinHud();
    gameStore.subscribe(() => this.refreshCoinHud());

    // Zone-Toast: Name der aktuellen Zone fuer 2.5s einblenden
    this.showZoneToast(this.currentZone);
    // Zone-Visit fuer Achievement-Tracking
    gameStore.recordZoneVisit(this.currentZone);

    // Initial-Snapshot der bekannten Achievements
    this.knownAchievements = new Set(gameStore.getAchievements());
    // Subscribe fuer Achievement-Diffs
    gameStore.subscribe(() => { this.checkNewAchievements(); this.refreshQuestIndicators(); });
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
      fontFamily: FONT_FAMILY, fontSize: '12px', color: '#1a1f1a'
    }).setOrigin(0.5, 0);
    const name = this.add.text(0, 4, def.name, {
      fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_TITLE, color: '#1a1f1a'
    }).setOrigin(0.5, 0);
    container.add([title, name]);
    this.registerInAllUiCams(container);
    sfx.dialogOpen();
    // S-POLISH Run-2: Entrance-Animation (Scale + Alpha-In) dann Fade-Out
    container.setScale(0.85);
    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      scale: 1,
      alpha: 1,
      duration: 280,
      ease: 'Back.Out'
    });
    this.tweens.add({
      targets: container,
      alpha: 0,
      delay: 3200,
      duration: 600,
      ease: 'Cubic.Out',
      onComplete: () => container.destroy()
    });
  }


  private makeFarmButton(): void {
    const { width } = this.scale;
    const btnX = width - 60;
    const btnY = 22;
    const c = this.add.container(btnX, btnY).setScrollFactor(0).setDepth(1900);
    const bg = this.add.graphics();
    bg.fillStyle(MODAL_BORDER_COLOR, 0.92);
    bg.fillRoundedRect(-44, -16, 88, 32, 6);
    bg.lineStyle(2, 0x4a8228, 1);
    bg.strokeRoundedRect(-44, -16, 88, 32, 6);
    const txt = this.add.text(0, -2, 'FARM (G)', {
      fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_BODY, color: '#1a1f1a'
    }).setOrigin(0.5);
    const hint = this.add.text(0, 9, 'giessen', {
      fontFamily: FONT_FAMILY, fontSize: '7px', color: '#1a1f1a'
    }).setOrigin(0.5);
    c.add([bg, txt, hint]);
    bg.setInteractive(new Phaser.Geom.Rectangle(-44, -16, 88, 32), Phaser.Geom.Rectangle.Contains);
    bg.on('pointerdown', () => this.gotoFarm());
    // S-POLISH Run-3: Hover-State fuer Farm-Button (Scale-Tween)
    bg.on('pointerover', () => {
      this.tweens.add({ targets: c, scale: 1.06, duration: 100, ease: 'Back.Out' });
    });
    bg.on('pointerout', () => {
      this.tweens.add({ targets: c, scale: 1.0, duration: 100, ease: 'Cubic.Out' });
    });
    if (this.miniMap) this.miniMap.ignoreInUICam(c);
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
    // Tier-3 V0.2: Tagesbelohnung-Toast als reward-Variante (gold), bottom-positioniert.
    const cam = this.cameras.main;
    const toast = showToast(this, `Tagesbelohnung: ${r.reward.label}`, 'reward', {
      cameraZoom: cam.zoom || 1,
      yAbsolute: cam.height - 60,
      padding: { x: 12, y: 8 },
      duration: 4000,
      delay: 2500
    });
    // Verhindere Doppel-Rendering durch UI-Cam des Tutorial-Overlays
    this.registerInAllUiCams(toast);
  }

  private registerInAllUiCams(obj: Phaser.GameObjects.GameObject): void {
    if (this.tutorial) this.tutorial.ignoreInUICam(obj);
    if (this.timeOverlay) this.timeOverlay.ignoreInUICam(obj);
    if (this.seasonTint) this.seasonTint.ignoreInUICam(obj);
    if (this.particles) this.particles.ignoreInUICam(obj);
    if (this.weatherOverlay) this.weatherOverlay.ignoreInUICam(obj);
  }

  private refreshNpcNameTags(): void {
    const px = this.player?.tileX ?? 0;
    const py = this.player?.tileY ?? 0;
    for (const npc of this.npcs) {
      const dx = Math.abs(npc.data.tileX - px);
      const dy = Math.abs(npc.data.tileY - py);
      const dist = Math.max(dx, dy);
      npc.setNameTagVisible(dist <= 2);
    }
  }

  private refreshQuestIndicators(): void {
    for (const npc of this.npcs) {
      const quests = QUESTS.filter((qq) => qq.giverId === npc.data.id);
      if (quests.length === 0) { npc.setQuestIndicator(this, 'none'); continue; }
      let mode: 'available' | 'turnin' | 'none' = 'none';
      for (const q of quests) {
        const status = gameStore.getQuestState(q.id);
        if (status === 'pending') { mode = 'available'; break; }
        if (status === 'active' && checkQuestComplete(q)) { mode = 'turnin'; }
      }
      npc.setQuestIndicator(this, mode);
    }
  }

  private refreshCoinHud(): void {
    if (!this.coinHud) return;
    const s = gameStore.get();
    this.coinHud.setText(`Coins: ${s.coins}`);
  }

  private showZoneToast(zone: string): void {
    // D-041 R39: Biome-Color-Flash beim Betreten neuer Zone
    const BIOME_COLORS: Record<string, number> = {
      wurzelheim: 0x4a7a4a, verdanto: 0x2d6b2d, kaktoria: 0xb87a2d,
      frostkamm: 0x5588bb, salzbucht: 0x2d6888, mordwald: 0x4a3a2d,
      glaciara: 0x88aacc, magmabluete: 0xbb4422
    };
    // R47: Slide-in Zonen-Banner von rechts
    const cam47 = this.cameras.main;
    const W47 = cam47.width; const H47 = cam47.height;
    const zoneName = zone.charAt(0).toUpperCase() + zone.slice(1);
    const banner = this.add.text(W47 + 100, H47 / 2 - 24, zoneName, {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3
    }).setScrollFactor(0).setDepth(800).setAlpha(0.92);
    this.tweens.add({
      targets: banner, x: W47 / 2, duration: 380, ease: 'Cubic.Out',
      onComplete: () => {
        this.tweens.add({
          targets: banner, alpha: 0, duration: 450, delay: 1300, ease: 'Cubic.In',
          onComplete: () => banner.destroy()
        });
      }
    });
    const bColor = BIOME_COLORS[zone] ?? 0x335533;
    const cam = this.cameras.main;
    cam.flash(400, (bColor >> 16) & 0xff, (bColor >> 8) & 0xff, bColor & 0xff, true);
    // D-041 R24: Zone-Toast mit Emoji + deutschen Namen
    const ZONE_LABELS: Record<string, string> = {
      wurzelheim: 'Ã°ÂÂÂ¿ Wurzelheim',
      verdanto: 'Ã°ÂÂÂ² Verdanto',
      kaktoria: 'Ã°ÂÂÂµ Kaktoria',
      frostkamm: 'Ã¢ÂÂÃ¯Â¸Â Frostkamm',
      salzbucht: 'Ã°ÂÂÂ Salzbucht',
      mordwald: 'Ã°ÂÂÂ Mordwald',
      glaciara: 'Ã°ÂÂ§Â Glaciara',
      magmabluete: 'Ã°ÂÂÂ¥ MagmablÃ¼te',
    };
    const label = ZONE_LABELS[zone] ?? (zone.charAt(0).toUpperCase() + zone.slice(1));
    const cam2 = this.cameras.main;
    const toast = showToast(this, label, 'success', {
      cameraZoom: cam2.zoom || 1,
      yAbsolute: 36,
      fontSize: '18px',
      padding: { x: 14, y: 6 },
      depth: 1950,
      duration: 1400,
      delay: 1500
    });
    this.registerInAllUiCams(toast);
  }

  private flashSaveIcon(): void {
    if (!this.saveIcon) return;
    this.saveIcon.setAlpha(1);
    this.tweens.add({ targets: this.saveIcon, alpha: 0, duration: 900, delay: 500, ease: 'Cubic.Out' });
  }

  public update(time: number, delta: number): void {
    // S-09 V0.1: NPC-Auto-Walking. Pure-Function pro NPC, walls-Set leer (V0.1).
    // Performance: Max 5-10 NPCs, jeweils ein Funktions-Call alle Frames mit fruehem Return wenn Idle. Vernachlaessigbar bei 60fps.
    if (this.npcs && this.npcs.length > 0) {
      const dialogActive = this.dialog?.open_ ?? false;
      const npcWalls = this.npcWalls;
      const now = gameTimeNow();
      // S-POLISH Run16: Camera-Frustum-Cull Ã¢ÂÂ NPCs > 200px ausserhalb des Viewports
      // bekommen kein step(). Bewegung + Animationen pausiert ausserhalb des sichtbaren Bereichs.
      const cam = this.cameras.main;
      const camL = cam.scrollX - 200;
      const camR = cam.scrollX + cam.width + 200;
      const camT = cam.scrollY - 200;
      const camB = cam.scrollY + cam.height + 200;
      for (const npc of this.npcs) {
        // S-10 Item-1: Wander-Ziel-Logik. Alle 30s neues Ziel setzen via pickWanderTarget.
        if (npc.movementState) {
          const ms = npc.movementState;
          const atTarget = ms.targetTile
            ? (ms.tileX === ms.targetTile.x && ms.tileY === ms.targetTile.y)
            : false;
          const needsTarget = !ms.targetTile || atTarget;
          if (needsTarget) {
            const target = pickWanderTarget(
              ms.id,
              ms.spawnTileX,
              ms.spawnTileY,
              ms.spawnRadius,
              npcWalls,
              now
            );
            npc.movementState = setNpcTarget(ms, target);
          }
        }
        // Frustum-Cull: step() nur fuer sichtbare NPCs
        const sx = npc.sprite.x;
        const sy = npc.sprite.y;
        if (sx >= camL && sx <= camR && sy >= camT && sy <= camB) {
          npc.step(now, npcWalls, dialogActive);
        }
      }
    }

    // S-POLISH Run-4 Performance: Story-Flag-Check auf 500ms throttled (war: jeden Frame).
    this._storyFlagAccum = (this._storyFlagAccum ?? 0) + delta;
    const doStoryCheck = this._storyFlagAccum >= 500;
    if (doStoryCheck) this._storyFlagAccum = 0;

    // S-09 V0.1: Story-Akt-1-Auto-Tracking. Autosetting der Quest-Flags + Akt-Advance.
    // Pure-Function pro Tick, kein State ausser story.flags + currentAct.
    if (doStoryCheck) {
      const state = gameStore.get();
      const flags = state.story?.flags ?? {};
      const updatedFlags = autoSetAct1Flags(flags, state.plants);
      // Side-Effect nur bei Aenderung
      const flagsChanged = Object.keys(updatedFlags).some(k => updatedFlags[k] !== flags[k]);
      if (flagsChanged) {
        for (const [k, v] of Object.entries(updatedFlags)) {
          if (v) gameStore.setStoryFlag(k, true);
        }
      }
      // Akt-Abschluss-Check
      const status = evaluateAct1Progress(updatedFlags, state.plants);
      if (status === 'completed' && gameStore.getCurrentAct() < 1) {
        gameStore.advanceAct(1);
        if (gameStore.collectDiaryEntry(1)) {
          showToast(this, t('diary.firstDay') || 'Tagebuch: Mein erster Tag in Wurzelheim', 'reward', { yOffset: -100 });
        }
      }
    }

    // S-10 V0.1: Story-Akt-2-Auto-Tracking ("Verdanto erkundet").
    // LÃ¤uft nur wenn currentAct >= 1 (Akt-1 abgeschlossen) UND doStoryCheck.
    if (doStoryCheck && gameStore.getCurrentAct() >= 1) {
      const state = gameStore.get();
      const flags = state.story?.flags ?? {};
      const visitedZones = gameStore.getAchievementCounters().visitedZones;
      const inventory = gameStore.getInventory();
      const updatedFlags = autoSetAct2Flags(flags, visitedZones, inventory);
      // Side-Effect nur bei Ãnderung
      const flagsChanged = Object.keys(updatedFlags).some(k => updatedFlags[k] !== flags[k]);
      if (flagsChanged) {
        for (const [k, v] of Object.entries(updatedFlags)) {
          if (v) gameStore.setStoryFlag(k, true);
        }
        // Achievement "verdanto_erkundet" triggern wenn Flag frisch gesetzt
        if (updatedFlags['verdanto_erkundet'] && !flags['verdanto_erkundet']) {
          gameStore.unlockAchievementBySlug('verdanto_erkundet');
          showToast(this, t('ow.achievement.verdanto'), 'reward', { yOffset: -100 });
        }
      }
      // Akt-Abschluss-Check
      const status = evaluateAct2Progress(updatedFlags);
      if (status === 'completed' && gameStore.getCurrentAct() < 2) {
        gameStore.advanceAct(2);
        if (gameStore.collectDiaryEntry(5)) {
          showToast(this, t('ow.diary.verdanto'), 'reward', { yOffset: -100 });
        }
      }
    }
    if (this.dialog.open_) {
      // Choice-Mode: number keys 1-4
      if (this.dialog.isChoiceMode_) {
        if (Phaser.Input.Keyboard.JustDown(this.key1)) { this.dialog.selectChoice(0); return; }
        if (Phaser.Input.Keyboard.JustDown(this.key2)) { this.dialog.selectChoice(1); return; }
        if (Phaser.Input.Keyboard.JustDown(this.key3)) { this.dialog.selectChoice(2); return; }
        if (Phaser.Input.Keyboard.JustDown(this.key4)) { this.dialog.selectChoice(3); return; }
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
    this.seasonTint?.refresh();
    this.particles?.update(this.weatherOverlay?.getCurrentWeather?.() ?? 'clear');

    // Tutorial Auto-Advance
    this.tutorial.checkAdvance({ tileX: this.player.tileX, tileY: this.player.tileY, facing: this.player.facing, isMoving: this.player.isMoving });

    // S-POLISH Run-4 Performance: NPC-Name-Tag-Refresh nur bei Tile-Position-Wechsel
    // Vorher: O(n) forEach jeden Frame. Jetzt: nur wenn tileX/tileY sich geaendert hat.
    if (!this.player.isMoving) {
      const curX = this.player.tileX;
      const curY = this.player.tileY;
      if (curX !== this._lastPlayerTileX || curY !== this._lastPlayerTileY) {
        this._lastPlayerTileX = curX;
        this._lastPlayerTileY = curY;
        this.refreshNpcNameTags();
      }
    }
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
          plants[0].hydration = 100;
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
      const hasMetBefore = gameStore.hasMetNpc(npc.data.id);
      gameStore.meetNpc(npc.data.id);
      // S-POLISH Run12: Dialog-Rotation - bei bekannten NPCs Zeile shufflen
      let lines: string[];
      if (hasMetBefore && npc.data.dialog.length > 1) {
        const randomIdx = Math.floor(Math.random() * npc.data.dialog.length);
        lines = [npc.data.dialog[randomIdx]];
      } else {
        lines = [...npc.data.dialog];
      }
      // Quest-Logic: Pick beste Quest fuer diesen NPC
      // 1. active (priorisiert), 2. pending mit erfuelltem requiredFlag
      const candidates = QUESTS.filter((qq) => qq.giverId === npc.data.id);
      const activeQuest = candidates.find((qq) => gameStore.getQuestState(qq.id) === 'active');
      const pendingQuest = candidates.find((qq) => {
        if (gameStore.getQuestState(qq.id) !== 'pending') return false;
        if (qq.requiredFlag && !gameStore.getStoryFlag(qq.requiredFlag)) return false;
        return true;
      });
      const quest = activeQuest ?? pendingQuest;
      if (quest) {
        const status = gameStore.getQuestState(quest.id);
        if (status === 'pending') {
          lines.push('---', `Neue Quest: ${quest.title}`, quest.description);
          gameStore.acceptQuest(quest.id);
          // talk-to-Quests werden direkt completed beim akzeptieren
          if (quest.goal.type === 'talk-to' && quest.goal.npcId === npc.data.id) {
            const rewardCoins = quest.reward.coins ?? 0;
            const rewardItems = quest.reward.items ?? {};
            gameStore.completeQuest(quest.id, rewardCoins, rewardItems);
            if (quest.setsFlag) gameStore.setStoryFlag(quest.setsFlag, true);
            if (quest.advancesAct) gameStore.advanceAct(quest.advancesAct);
            if (quest.diaryEntry) gameStore.collectDiaryEntry(quest.diaryEntry);
            lines.push('---', `Quest sofort abgeschlossen: +${rewardCoins} Gold`);
            if (quest.diaryEntry) lines.push('Neuer Tagebuch-Eintrag (T)!');
          }
        } else if (status === 'active') {
          // Pruefe Erfuellung
          const ok = checkQuestComplete(quest);
          if (ok) {
            const rewardCoins = quest.reward.coins ?? 0;
            const rewardItems = quest.reward.items ?? {};
            gameStore.completeQuest(quest.id, rewardCoins, rewardItems);
            if (quest.setsFlag) gameStore.setStoryFlag(quest.setsFlag, true);
            if (quest.advancesAct) gameStore.advanceAct(quest.advancesAct);
            if (quest.diaryEntry) gameStore.collectDiaryEntry(quest.diaryEntry);
            lines.push('---', `Quest abgeschlossen: ${quest.title}!`, `Belohnung: ${rewardCoins} Gold`);
            if (quest.diaryEntry) lines.push('Neuer Tagebuch-Eintrag (T)!');
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
  }

  private changeZone(newZone: string, spawnX: number, spawnY: number, facing: 'up' | 'down' | 'left' | 'right'): void {
    debugLog('[OverworldScene] zone change', this.currentZone, '->', newZone);
    // S-POLISH Run3: Camera fadeOut vor Zone-Wechsel fuer smoother Transition
    sfx.dialogOpen();
    gameStore.setOverworldPos(spawnX, spawnY, facing, 'OverworldScene', newZone);
    gameStore.recordZoneVisit(newZone);
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.restart();
    });
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
      debugLog('[OverworldScene] door triggered, switching to GardenScene');
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
    let encounterRate = t === 13 ? 0.10 : (t === 2 || t === 34 || t === 44 ? 0.07 : 0);
    // Wetter-Modifier S-09 D.o.D. #4: Regen +20% Bromelia, Schnee +20% Frostkamm
    const weather = this.weatherOverlay?.getCurrentWeather?.() ?? 'clear';
    if (weather === 'rain' && t === 13) encounterRate *= 1.2;
    if (weather === 'snow' && this.currentZone === 'frostkamm' && t === 2) encounterRate *= 1.2;
    if (weather === 'storm' && this.currentZone === 'salzbucht' && t === 2) encounterRate *= 1.3;
    if (weather === 'fog' && this.currentZone === 'mordwald' && t === 34) encounterRate *= 1.25;
    if (encounterRate > 0 && Math.random() < encounterRate) {
      let pool = getEncounterPool(this.currentZone, t);
      // Wetter-Modifier: Re-weight pool je Wetter
      const weather = this.weatherOverlay?.getCurrentWeather() ?? 'clear';
      if (weather !== 'clear') {
        pool = pool.map((e) => {
          let weightBoost = 1.0;
          if (weather === 'rain' && (e.family === 'Bromeliaceae' || e.family === 'Orchidaceae')) weightBoost = 1.5;
          if (weather === 'snow' && (e.family === 'Crassulaceae' || e.family === 'Asteraceae')) weightBoost = 1.5;
          if (weather === 'storm' && e.family === 'Mythical') weightBoost = 3.0;
          if (weather === 'fog' && e.family === 'Droseraceae') weightBoost = 1.4;
          return { ...e, weight: Math.floor(e.weight * weightBoost) };
        });
      }
      debugLog('[OverworldScene] encounter triggered on tile', t, 'pool:', this.currentZone, 'weather:', weather, 'size:', pool.length);
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
