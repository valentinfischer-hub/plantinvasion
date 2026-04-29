import Phaser from 'phaser';
import { gameStore, GRID_COLUMNS, GRID_ROWS } from '../state/gameState';
import {
  stageOf,
  canBeWatered,
  waterCooldownRemaining,
  hydrationStatus,
  hydrationMultiplier,
  biomeMatchMultiplier,
  hybridVigorMultiplier,
  timeOfDayMultiplier,
  stageMultiplier,
  BASE_XP_PER_SEC,
  xpToNextLevel,
  isCrossable,
  waterPlant,
  isHarvestReady,
  bloomProgress,
  isBlooming,
  TIER_COLORS,
  TIER_THRESHOLDS,
  tierForCareScore,
  totalXpToReachLevel,
  STAGE_LEVEL_THRESHOLDS
} from '../data/leveling';
import { GROWTH_STAGE_NAMES, QUALITY_TIERS, type Plant, type QualityTier } from '../types/plant';
import { getSpecies } from '../data/species';
import { generateAllPlantStages } from '../assets/proceduralPlantSprites';
import { listActiveBoosters, boosterRemainingMs } from '../data/boosters';
import { companionBonus, getCompanionsFor } from '../data/companion';
import { plantRole } from '../data/roles';
import { getAllele } from '../data/genes';
import { isSeedItem, getItem } from '../data/items';
import { debugLog } from '../utils/debugLog';
import { showToast, type ToastType } from '../ui/Toast';
import { drawModalBox } from '../ui/uiTheme';
import { sfx } from '../audio/sfxGenerator';

const STAGE_FILES = ['00_seed', '01_sprout', '02_juvenile', '03_adult', '04_blooming'];
const TILE = 92;
const TILE_PAD = 6;

interface PlantCard {
  plant: Plant;
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Image;
  levelText: Phaser.GameObjects.Text;
  xpBar: Phaser.GameObjects.Graphics;
  hydrationBar: Phaser.GameObjects.Graphics;
  thirstIcon: Phaser.GameObjects.Text;
  bg: Phaser.GameObjects.Graphics;
  harvestPulse?: Phaser.Tweens.Tween;
  mutationGlow?: Phaser.GameObjects.Graphics;
  mutationGlowTween?: Phaser.Tweens.Tween;
  lastSeenStage: number;
}

export class GardenScene extends Phaser.Scene {
  private gridOriginX = 0;
  private gridOriginY = 0;
  private cards: Map<string, PlantCard> = new Map();
  // S-POLISH Run16: Subscribe-Throttle — renderPlants() max 1x alle 500ms aus der store-Subscription
  private _renderPending = false;
  private crossMode = false;
  private companionLineGraphics?: Phaser.GameObjects.Graphics;
  // S-POLISH-B2-R13: Bonsai-Aura-Ring Graphics
  private bonsaiAuraGraphics?: Phaser.GameObjects.Graphics;
  private crossFirstPlantId: string | null = null;
  private crossModeHint?: Phaser.GameObjects.Text;
  private crossBtnBg?: Phaser.GameObjects.Rectangle;
  private crossBtnTxt?: Phaser.GameObjects.Text;
  private headerText!: Phaser.GameObjects.Text;
  private detailPanel?: Phaser.GameObjects.Container;
  private slotHotspots: Array<{ gridX: number; gridY: number; hotspot: Phaser.GameObjects.Rectangle }> = [];
  private dragSource?: { plantId: string; startX: number; startY: number };

  constructor() {
    super('GardenScene');
  }

  preload(): void {
    // PNG-Stage-Sprites fuer Spezies mit existierendem Asset-Set
    const pngSpecies = ['sunflower', 'spike-cactus', 'venus-flytrap', 'lavender', 'tomato-plant'];
    pngSpecies.forEach((slug) => {
      STAGE_FILES.forEach((stageFile, idx) => {
        const key = `${slug}-${idx}`;
        if (!this.textures.exists(key)) {
          this.load.image(key, `assets/sprites/plants/${slug}/${stageFile}.png`);
        }
      });
    });
  }

  create(): void {
    debugLog('[GardenScene] create called');
    const { width } = this.scale;

    // Procedural-Plant-Sprites fuer Spezies ohne PNG (V0.5 erweiterte Pokedex)
    generateAllPlantStages(this);

    this.cameras.main.setBackgroundColor('#2d3a2a');

    // Boden-Tile-Background (Sprint 1 Atlas): full-screen 32x32 Tile-Pattern
    // mit ground_erdig-Variationen rotiert per Hash-Index. Subtle Alpha
    // damit Slot-Marker plus Pflanzen-Sprites darueber gut sichtbar bleiben.
    if (this.textures.exists('ground_sprint_1')) {
      const TS = 32;
      const sceneW = this.scale.width;
      const sceneH = this.scale.height;
      const cols = Math.ceil(sceneW / TS);
      const rows = Math.ceil(sceneH / TS);
      for (let ty = 0; ty < rows; ty++) {
        for (let tx = 0; tx < cols; tx++) {
          const v = ((tx * 7 + ty * 13) % 4) + 1;
          this.add.image(tx * TS, ty * TS, 'ground_sprint_1', `ground_erdig_v${v}.webp`)
            .setOrigin(0, 0)
            .setAlpha(0.4)
            .setDepth(-100);
        }
      }
    }


    this.headerText = this.add.text(width / 2, 16, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#9be36e'
    }).setOrigin(0.5, 0);

    const gridWidth = GRID_COLUMNS * (TILE + TILE_PAD) - TILE_PAD;
    const gridHeight = GRID_ROWS * (TILE + TILE_PAD) - TILE_PAD;
    this.gridOriginX = (width - gridWidth) / 2;
    this.gridOriginY = 60;

    const gridBg = this.add.graphics();
    gridBg.fillStyle(0x1a2418, 0.6);
    gridBg.fillRoundedRect(
      this.gridOriginX - 8,
      this.gridOriginY - 8,
      gridWidth + 16,
      gridHeight + 16,
      6
    );
    this.slotHotspots = [];
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLUMNS; x++) {
        const sx = this.gridOriginX + x * (TILE + TILE_PAD);
        const sy = this.gridOriginY + y * (TILE + TILE_PAD);
        const slot = this.add.graphics();
        // QW-14: Slot-Farbvariation per Position – leicht unterschiedliche Erdtoene
        const hash = (x * 3 + y * 7) % 6;
        const slotColors = [0x223520, 0x1e3018, 0x27391e, 0x1c2e16, 0x243822, 0x1a2c14];
        const borderColors = [0x44603f, 0x3a5234, 0x4e6a47, 0x3c5838, 0x486244, 0x405a3a];
        slot.fillStyle(slotColors[hash], 0.6);
        slot.fillRoundedRect(sx, sy, TILE, TILE, 4);
        slot.lineStyle(1, borderColors[hash], 0.65);
        slot.strokeRoundedRect(sx, sy, TILE, TILE, 4);
        // Subtile Innen-Punkte als Bodenstruktur
        const dotCount = 2 + (hash % 3);
        for (let d = 0; d < dotCount; d++) {
          const dx = sx + 10 + ((x * 17 + y * 13 + d * 7) % (TILE - 20));
          const dy = sy + 10 + ((x * 11 + y * 19 + d * 5) % (TILE - 20));
          slot.fillStyle(borderColors[hash], 0.25);
          slot.fillCircle(dx, dy, 3);
        }

        // Slot-spezifischer Boden-Tile (Sprint 1 Atlas) als visuelle Variation.
        // 4 Erdtypen (erdig/steinig/moosig/aschig) rotiert per Slot-Index modulo 4.
        const groundTypes = ['erdig', 'steinig', 'moosig', 'aschig'];
        const groundType = groundTypes[(x + y) % groundTypes.length];
        const groundVariant = ((x * 3 + y * 5) % 4) + 1;
        const groundKey = `ground_${groundType}_v${groundVariant}`;
        if (this.textures.exists('ground_sprint_1')) {
          this.add.image(sx + TILE / 2, sy + TILE / 2, 'ground_sprint_1', `${groundKey}.webp`)
            .setOrigin(0.5)
            .setDisplaySize(TILE - 4, TILE - 4)
            .setAlpha(0.7)
            .setDepth(-50);
        }

        // B-012 V0.2: jeder Slot ist klickbar fuer Slot-First-Saeen-UI.
        const hotspot = this.add.rectangle(sx + TILE / 2, sy + TILE / 2, TILE, TILE, 0x000000, 0)
          .setInteractive({ useHandCursor: true })
          .setDepth(-1);
        hotspot.on('pointerdown', () => this.onSlotClick(x, y));
        // S-POLISH-09b + Run1: Slot Hover-Glow + subtle scale
        hotspot.on('pointerover', () => {
          hotspot.setStrokeStyle(3, 0x9be36e, 0.85);
          this.tweens.add({ targets: hotspot, scaleX: 1.04, scaleY: 1.04, duration: 120, ease: 'Cubic.Out' });
        });
        hotspot.on('pointerout', () => {
          hotspot.setStrokeStyle(0);
          this.tweens.add({ targets: hotspot, scaleX: 1.0, scaleY: 1.0, duration: 100, ease: 'Cubic.Out' });
        });
        this.slotHotspots.push({ gridX: x, gridY: y, hotspot });

        // S-POLISH-B3-R1: Slot-Nummerierung A1–D3 (dezenter Stardew-Inventory-Stil)
        const colLabel = String.fromCharCode(65 + x); // A, B, C, D
        const rowLabel = (y + 1).toString();           // 1, 2, 3
        this.add.text(sx + 4, sy + 2, `${colLabel}${rowLabel}`, {
          fontFamily: 'monospace',
          fontSize: '8px',
          color: '#5a7050',
          alpha: 0.7
        }).setDepth(-2);
      }
    }

    this.renderPlants();

    // S-POLISH-START-18: Tutorial-Step-0 First-Plant-Slot-Highlight
    this.setupTutorialHighlight();

    // Tick-Loop: alle 1s
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        gameStore.tick();
        this.refreshCards();
      }
    });

    gameStore.subscribe(() => {
      // S-POLISH Run16: Throttle — verzoegert renderPlants() via rAF-Debounce (max 1x pro Frame)
      if (!this._renderPending) {
        this._renderPending = true;
        this.time.delayedCall(500, () => {
          this._renderPending = false;
          this.renderPlants();
        });
      }
    });

    this.refreshHeader();

    if (this.input.keyboard) {
      const crossKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
      crossKey.on('down', () => {
        const state = gameStore.get();
        if (state.plants.length < 2) {
          this.showFlash('Brauchst 2 Pflanzen zum Kreuzen', '#ff7e7e');
          return;
        }
        ((window as Window & { __posthog?: { capture: (e: string) => void } }).__posthog?.capture('breeding_attempted'));
        // s-polish-02: Eltern-Anflug Pre-Animation, dann Crossing plus Hybrid-Reveal
        void this.runCrossWithDrift(state.plants[0].id, state.plants[1].id, '#9be36e');
      });
      const owKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
      owKey.on('down', () => this.gotoOverworld());
      const wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      wKey.on('down', () => this.gotoOverworld());

      // S = Seed-Plant-Modal
      const seedKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      seedKey.on('down', () => this.openSeedPlantModal());
    }

    // Header-Button "Pflanze einsaeen"
    const seedBtn = this.add.text(width - 70, 14, 'Saeen', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#1a1f1a',
      backgroundColor: '#9be36e',
      padding: { left: 8, right: 8, top: 4, bottom: 4 }
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    seedBtn.on('pointerdown', () => this.openSeedPlantModal());

    // Welt-Erkunden-Button: prominent oben links, fuehrt zur OverworldScene
    const worldBtn = this.add.text(70, 14, 'Welt (W)', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#1a1f1a',
      backgroundColor: '#fcd95c',
      padding: { left: 10, right: 10, top: 4, bottom: 4 }
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    worldBtn.on('pointerdown', () => this.gotoOverworld());

    // Cross-Mode-Button (S-09 D.o.D. #7)
    this.crossBtnBg = this.add.rectangle(width - 140, 22, 70, 22, 0x000000, 0.7)
      .setStrokeStyle(1, 0xb86ee3)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.crossBtnTxt = this.add.text(width - 140, 22, 'Kreuzen', {
      fontFamily: 'monospace', fontSize: '11px', color: '#b86ee3'
    }).setOrigin(0.5);
    this.crossBtnBg.on('pointerdown', () => this.toggleCrossMode());

    this.crossModeHint = this.add.text(width / 2, 50, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#b86ee3', backgroundColor: '#1a1f1a', padding: { x: 6, y: 2 }
    }).setOrigin(0.5).setVisible(false);
  }

  private toggleCrossMode(): void {
    this.crossMode = !this.crossMode;
    this.crossFirstPlantId = null;
    this.refreshCrossUI();
    this.renderPlants();
  }

  private refreshCrossUI(): void {
    if (this.crossBtnBg) {
      this.crossBtnBg.setStrokeStyle(2, this.crossMode ? 0xfcd95c : 0xb86ee3);
    }
    if (this.crossBtnTxt) {
      this.crossBtnTxt.setColor(this.crossMode ? '#fcd95c' : '#b86ee3');
      this.crossBtnTxt.setText(this.crossMode ? 'Aktiv' : 'Kreuzen');
    }
    if (this.crossModeHint) {
      if (this.crossMode) {
        const txt = this.crossFirstPlantId
          ? 'Waehle zweite Pflanze (Kreuzen-Btn fuer Abbruch)'
          : 'Cross-Mode: klicke erste Pflanze zum Auswaehlen';
        this.crossModeHint.setText(txt);
        this.crossModeHint.setVisible(true);
      } else {
        this.crossModeHint.setVisible(false);
      }
    }
  }

  private handleCrossClick(plantId: string): void {
    if (!this.crossFirstPlantId) {
      this.crossFirstPlantId = plantId;
      this.refreshCrossUI();
      this.renderPlants();
      return;
    }
    if (this.crossFirstPlantId === plantId) {
      this.showFlash('Selbe Pflanze - waehle eine andere', '#ff7e7e');
      return;
    }
    // Preview-Modal vor Bestaetigung
    this.openCrossPreviewModal(this.crossFirstPlantId, plantId);
  }

  private openCrossPreviewModal(parentAId: string, parentBId: string): void {
    if (this.detailPanel) {
      this.detailPanel.destroy();
      this.detailPanel = undefined;
    }
    const preview = gameStore.previewCross(parentAId, parentBId);
    if (!preview.ok) {
      this.showFlash(preview.reason ?? 'Crossing fehlgeschlagen', '#ff7e7e');
      this.crossMode = false;
      this.crossFirstPlantId = null;
      this.refreshCrossUI();
      this.renderPlants();
      return;
    }
    const { width, height } = this.scale;
    const panelW = 320;
    const panelH = 240;
    const c = this.add.container(width / 2, height / 2);
    const bg = this.add.graphics();
    drawModalBox(bg, { width: panelW, height: panelH, borderColor: 0xb86ee3, borderAlpha: 0.9 });
    c.add(bg);
    const title = this.add.text(0, -panelH / 2 + 12, 'Kreuzungs-Vorschau', {
      fontFamily: 'monospace', fontSize: '14px', color: '#b86ee3'
    }).setOrigin(0.5, 0);
    c.add(title);
    const childLabel = this.add.text(0, -panelH / 2 + 38, `Kind: ${preview.childSlug}`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#9be36e'
    }).setOrigin(0.5, 0);
    c.add(childLabel);
    const r = preview.statRange!;
    const stats = this.add.text(-panelW / 2 + 14, -panelH / 2 + 64,
      [
        'Stat-Range (Mittel +/- 10%):',
        `  ATK ${r.atk[0]} - ${r.atk[1]}`,
        `  DEF ${r.def[0]} - ${r.def[1]}`,
        `  SPD ${r.spd[0]} - ${r.spd[1]}`,
        '',
        `Mutation-Chance: ${(preview.mutationChance! * 100).toFixed(0)}%`,
        `Kosten: 50 Coins`
      ].join('\n'),
      { fontFamily: 'monospace', fontSize: '11px', color: '#dcdcdc' });
    c.add(stats);
    const okBtn = this.add.text(-60, panelH / 2 - 30, 'Kreuzen!', {
      fontFamily: 'monospace', fontSize: '12px', color: '#1a1f1a',
      backgroundColor: '#b86ee3', padding: { left: 14, right: 14, top: 6, bottom: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    okBtn.on('pointerdown', () => {
      ((window as Window & { __posthog?: { capture: (e: string) => void } }).__posthog?.capture('breeding_attempted'));
      // s-polish-02: Modal zuerst schliessen, dann Eltern-Anflug-Animation, dann Crossing
      c.destroy();
      this.detailPanel = undefined;
      this.crossMode = false;
      this.crossFirstPlantId = null;
      this.refreshCrossUI();
      void this.runCrossWithDrift(parentAId, parentBId, '#b86ee3');
    });
    c.add(okBtn);
    const cancelBtn = this.add.text(60, panelH / 2 - 30, 'Abbruch', {
      fontFamily: 'monospace', fontSize: '11px', color: '#dcdcdc',
      backgroundColor: '#3a3a3a', padding: { left: 12, right: 12, top: 6, bottom: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    cancelBtn.on('pointerdown', () => {
      c.destroy();
      this.detailPanel = undefined;
      this.crossMode = false;
      this.crossFirstPlantId = null;
      this.refreshCrossUI();
      this.renderPlants();
    });
    c.add(cancelBtn);
    this.detailPanel = c;
  }

  private openSeedPlantModal(): void {
    if (this.detailPanel) {
      this.detailPanel.destroy();
      this.detailPanel = undefined;
    }
    const inv = gameStore.getInventory();
    const seedSlugs = Object.keys(inv).filter((k) => isSeedItem(k) && (inv[k] ?? 0) > 0);
    if (seedSlugs.length === 0) {
      this.showFlash('Keine Samen im Inventar', '#ff7e7e');
      return;
    }
    // B-012: Vorab-Check Garten-voll, sonst landen wir im Modal mit deaktivierten Klicks und der Toast kommt erst danach
    const freeSlots = gameStore.getFreeSlotCount();
    if (freeSlots === 0) {
      this.showFlash('Garten voll. Ernte oder verschiebe Pflanzen.', '#ff7e7e');
      return;
    }
    const { width, height } = this.scale;
    const panelW = 320;
    const panelH = Math.min(380, 80 + seedSlugs.length * 26);
    const container = this.add.container(width / 2, height + panelH / 2);
    const bg = this.add.graphics();

    drawModalBox(bg, { width: panelW, height: panelH });
    container.add(bg);
    // S-POLISH Run1: Slide-in von unten
    this.tweens.add({ targets: container, y: height / 2, duration: 280, ease: 'Cubic.Out' });
    const title = this.add.text(0, -panelH / 2 + 12, `Pflanze einsaeen (${freeSlots} frei)`, {
      fontFamily: 'monospace', fontSize: '13px', color: '#9be36e'
    }).setOrigin(0.5, 0);
    container.add(title);
    seedSlugs.forEach((slug, i) => {
      const item = getItem(slug);
      const label = `${item?.name ?? slug} (${inv[slug]})`;
      const btn = this.add.text(-panelW / 2 + 14, -panelH / 2 + 38 + i * 26, label, {
        fontFamily: 'monospace', fontSize: '11px',
        color: '#dcdcdc',
        backgroundColor: '#2a3325',
        padding: { left: 8, right: 8, top: 4, bottom: 4 }
      }).setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        const result = gameStore.plantSeed(slug);
        if (result.ok) {
          this.showFlash(`${item?.name ?? slug} eingesaeet`, '#9be36e');
          container.destroy();
          this.detailPanel = undefined;
        } else {
          this.showFlash(result.reason ?? 'Fehlgeschlagen', '#ff7e7e');
        }
      });
      container.add(btn);
    });
    const close = this.add.text(panelW / 2 - 12, -panelH / 2 + 6, 'X', {
      fontFamily: 'monospace', fontSize: '14px', color: '#888888'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => {
      container.destroy();
      this.detailPanel = undefined;
    });
    container.add(close);
    this.detailPanel = container;
  }

  /**
   * B-012 V0.2: Slot-First-Click. Wenn der Slot leer ist, oeffnet sich der Seed-Picker
   * fuer genau diesen Slot. Bei besetztem Slot greift weiter die Plant-Card-Click-Logik
   * (Detail-Panel, Cross-Mode etc.) ueber den darueberliegenden Card-Container.
   */
  private onSlotClick(gridX: number, gridY: number): void {
    if (this.crossMode) return;
    const occupied = gameStore.get().plants.some((p) => p.gridX === gridX && p.gridY === gridY);
    if (occupied) return;
    this.openSeedPlantModalForSlot(gridX, gridY);
  }

  /**
   * B-012 V0.2: Slot-First-Variante des Saeen-Modals. Nutzt plantSeedAt() statt plantSeed()
   * damit der User seine Slot-Auswahl behaelt und nicht der erste freie Slot ueberschrieben wird.
   */
  private openSeedPlantModalForSlot(gridX: number, gridY: number): void {
    if (this.detailPanel) {
      this.detailPanel.destroy();
      this.detailPanel = undefined;
    }
    const inv = gameStore.getInventory();
    const seedSlugs = Object.keys(inv).filter((k) => isSeedItem(k) && (inv[k] ?? 0) > 0);
    if (seedSlugs.length === 0) {
      this.showFlash('Keine Samen im Inventar', '#ff7e7e');
      return;
    }
    const { width, height } = this.scale;
    const panelW = 320;
    const panelH = Math.min(380, 80 + seedSlugs.length * 26);
    const container = this.add.container(width / 2, height + panelH / 2);
    const bg = this.add.graphics();
    drawModalBox(bg, { width: panelW, height: panelH });
    container.add(bg);
    // S-POLISH Run1: Slide-in von unten
    this.tweens.add({ targets: container, y: height / 2, duration: 280, ease: 'Cubic.Out' });
    const title = this.add.text(0, -panelH / 2 + 12, `Slot ${gridX},${gridY} bepflanzen`, {
      fontFamily: 'monospace', fontSize: '13px', color: '#9be36e'
    }).setOrigin(0.5, 0);
    container.add(title);
    seedSlugs.forEach((slug, i) => {
      const item = getItem(slug);
      const label = `${item?.name ?? slug} (${inv[slug]})`;
      const btn = this.add.text(-panelW / 2 + 14, -panelH / 2 + 38 + i * 26, label, {
        fontFamily: 'monospace', fontSize: '11px',
        color: '#dcdcdc',
        backgroundColor: '#2a3325',
        padding: { left: 8, right: 8, top: 4, bottom: 4 }
      }).setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        const result = gameStore.plantSeedAt(slug, gridX, gridY);
        if (result.ok) {
          this.showFlash(`${item?.name ?? slug} in Slot ${gridX},${gridY} eingesaeet`, '#9be36e');
          container.destroy();
          this.detailPanel = undefined;
        } else {
          this.showFlash(result.reason ?? 'Fehlgeschlagen', '#ff7e7e');
        }
      });
      container.add(btn);
    });
    const close = this.add.text(panelW / 2 - 12, -panelH / 2 + 6, 'X', {
      fontFamily: 'monospace', fontSize: '14px', color: '#888888'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => {
      container.destroy();
      this.detailPanel = undefined;
    });
    container.add(close);
    this.detailPanel = container;
  }

  private gotoOverworld(): void {
    gameStore.setOverworldPos(
      gameStore.getOverworldPos().tileX,
      gameStore.getOverworldPos().tileY,
      gameStore.getOverworldPos().facing,
      'OverworldScene',
      gameStore.getOverworldPos().zone
    );
    this.scene.start('OverworldScene');
  }

  /**
   * Tier-3-Konsistenz (V0.1): Wrapper auf zentralen showToast.
   * Color-Mapping: legacy color-strings auf neue ToastType-Convention.
   * Background ist jetzt #1a1f1a (vorher #000000) damit konsistent zu Overworld-Toasts.
   */
  /**
   * S-POLISH-02: Eltern-Anflug Pre-Animation.
   * Tween beider Parent-Plant-Card-Container 1500ms Cubic.InOut auf Bildmitte (links/rechts versetzt).
   * Resolved true wenn Animation lief, false wenn Cards nicht auffindbar (Fallback-Pfad).
   */
  private playParentDrift(parentAId: string, parentBId: string): Promise<boolean> {
    const cardA = this.cards.get(parentAId);
    const cardB = this.cards.get(parentBId);
    if (!cardA || !cardB) {
      return Promise.resolve(false);
    }
    const cam = this.cameras.main;
    const cx = cam.scrollX + cam.width / 2;
    const cy = cam.scrollY + cam.height / 2;
    // Cards auf Top-Layer heben damit ueber anderen Karten gezeichnet
    cardA.container.setDepth(2000);
    cardB.container.setDepth(2000);
    return new Promise<boolean>((resolve) => {
      let pending = 2;
      const done = () => {
        pending -= 1;
        if (pending === 0) resolve(true);
      };
      this.tweens.add({
        targets: cardA.container,
        x: cx - 36,
        y: cy,
        duration: 1500,
        ease: 'Cubic.InOut',
        onUpdate: () => { cardA.container.x = Math.round(cardA.container.x); cardA.container.y = Math.round(cardA.container.y); },
        onComplete: done
      });
      this.tweens.add({
        targets: cardB.container,
        x: cx + 36,
        y: cy,
        duration: 1500,
        ease: 'Cubic.InOut',
        onUpdate: () => { cardB.container.x = Math.round(cardB.container.x); cardB.container.y = Math.round(cardB.container.y); },
        onComplete: done
      });
    });
  }

  /**
   * S-POLISH-02: Promise-Chain fuer Crossing-Trigger.
   * Drift Eltern-Cards zur Bildmitte (1500ms), dann gameStore.crossPlants, dann playHybridReveal
   * plus Scale-In der neuen Hybrid-Card. Fallback bei Card-Lookup-Fehler oder Store-Error:
   * keine Pre-Animation, direkt zum Reveal.
   */
  private async runCrossWithDrift(parentAId: string, parentBId: string, successColor: string): Promise<void> {
    const drifted = await this.playParentDrift(parentAId, parentBId);
    const result = gameStore.crossPlants(parentAId, parentBId);
    if (!result.ok) {
      this.showFlash(result.reason ?? 'Crossing fehlgeschlagen', '#ff7e7e');
      return;
    }
    const isMutation = !!result.child?.isMutation;
    this.playHybridReveal(isMutation);
    this.showFlash(isMutation ? 'Mutation! Neue Pflanze' : 'Kreuzung erfolgreich', successColor);
    // Scale-In der neuen Hybrid-Card sobald renderPlants sie erstellt hat
    if (result.child) {
      const hybridId = result.child.id;
      this.time.delayedCall(20, () => {
        const newCard = this.cards.get(hybridId);
        if (!newCard) return;
        const targetScale = newCard.container.scale || 1;
        newCard.container.setScale(0);
        this.tweens.add({
          targets: newCard.container,
          scale: targetScale,
          duration: 420,
          ease: 'Back.Out'
        });
      });
    }
    // Drift-spezifisches Cleanup: nichts noetig, da Parent-Cards bei renderPlants
    // automatisch destroyed werden (gameStore.crossPlants entfernt sie aus state).
    void drifted;
  }

  /**
   * S-POLISH: Hybrid-Reveal-Stinger.
   * Camera-Zoom-Punch plus Tint-Flash plus Pollen-Particle-Burst bei erfolgreichem Crossing.
   * Bei isMutation zusaetzlich violet-Tint plus Camera-Shake.
   */
  private playHybridReveal(isMutation: boolean): void {
    const cam = this.cameras.main;
    const baseZoom = cam.zoom;
    // Zoom-Punch
    this.tweens.add({
      targets: cam,
      zoom: baseZoom * 1.15,
      duration: 200,
      ease: 'Cubic.Out',
      yoyo: true
    });
    // Tint-Flash
    const flashColor = isMutation ? 0xb86ee3 : 0xfff5cc;
    const flash = this.add.rectangle(
      cam.scrollX + cam.width / 2,
      cam.scrollY + cam.height / 2,
      cam.width,
      cam.height,
      flashColor,
      0.55
    ).setDepth(9999);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 600,
      ease: 'Cubic.Out',
      onComplete: () => flash.destroy()
    });
    if (isMutation) {
      cam.shake(300, 0.008);
    }

    // Pollen-Particle-Burst aus Bildmitte (50 partikel, lifespan 1500ms)
    const cx = cam.scrollX + cam.width / 2;
    const cy = cam.scrollY + cam.height / 2;
    for (let i = 0; i < 50; i++) {
      const angle = (Math.PI * 2 * i) / 50 + (Math.random() - 0.5) * 0.3;
      const dist = 60 + Math.random() * 100;
      const px = cx + Math.cos(angle) * 8;
      const py = cy + Math.sin(angle) * 8;
      const tx = cx + Math.cos(angle) * dist;
      const ty = cy + Math.sin(angle) * dist;
      const color = isMutation ? 0xff7eb8 : 0xfcd95c;
      const particle = this.add.circle(px, py, 3 + Math.random() * 2, color, 0.95).setDepth(9998);
      this.tweens.add({
        targets: particle,
        x: tx,
        y: ty,
        alpha: 0,
        scale: { from: 1, to: 0.3 },
        duration: 1200 + Math.random() * 400,
        ease: 'Cubic.Out',
        onUpdate: () => { particle.x = Math.round(particle.x); particle.y = Math.round(particle.y); },
        onComplete: () => particle.destroy()
      });
    }

    // PostHog-Event fuer Telemetrie
    const posthog = (window as Window & { __posthog?: { capture: (e: string, p?: Record<string, unknown>) => void } }).__posthog;
    if (posthog) {
      posthog.capture(isMutation ? 'mutation_triggered' : 'breeding_succeeded', {
        timestamp: new Date().toISOString()
      });
    }
  }

  private showFlash(message: string, color: string): void {
    const t: ToastType = mapLegacyColor(color);
    showToast(this, message, t);
  }

  private spawnStageUpBurst(x: number, y: number): void {
    // Kleine Konfetti-Explosion mit Particles oder einfach mit kurzen Tween-Kreisen
    for (let i = 0; i < 8; i++) {
      const dot = this.add.circle(x, y, 3, 0xffd166, 1).setDepth(1500);
      const angle = (i / 8) * Math.PI * 2;
      const dist = 30 + Math.random() * 20;
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.15,
        duration: 750,
        ease: 'Back.Out',
        onUpdate: () => { dot.x = Math.round(dot.x); dot.y = Math.round(dot.y); },
        onComplete: () => dot.destroy()
      });
    }
  }

  /** Booster-Partikel-Burst in Booster-spezifischer Farbe */
  /**
   * S-POLISH-B3-R1: Harvest-Floating-Text — "+X Coins" aufsteigend von Pflanze.
   */
  private spawnHarvestFloatingText(x: number, y: number, coins: number): void {
    const label = this.add.text(x, y - 20, `+${coins} Coins`, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#ffd166',
      stroke: '#1a1f1a',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(2000);
    this.tweens.add({
      targets: label,
      y: y - 70,
      alpha: 0,
      duration: 1400,
      ease: 'Cubic.Out',
      onComplete: () => label.destroy()
    });
  }

  /**
   * S-POLISH-B2-R18 (fix): Harvest-Burst — goldene Partikel-Explosion.
   * War referenziert aber nie implementiert. Fix in B3-R4.
   */
  private spawnHarvestBurst(x: number, y: number): void {
    const colors = [0xffd166, 0xfcd95c, 0xffeeaa];
    for (let i = 0; i < 10; i++) {
      const dot = this.add.circle(x, y, 4, colors[i % colors.length], 1).setDepth(1600);
      const angle = (i / 10) * Math.PI * 2;
      const dist = 28 + Math.random() * 20;
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 600,
        ease: 'Power2',
        onComplete: () => dot.destroy()
      });
    }
    // Zentral-Flash
    const flash = this.add.circle(x, y, 14, 0xffd166, 0.7).setDepth(1599);
    this.tweens.add({ targets: flash, alpha: 0, scale: 2.2, duration: 350, onComplete: () => flash.destroy() });
  }

  private spawnBoosterBurst(x: number, y: number, color: number): void {
    for (let i = 0; i < 12; i++) {
      const dot = this.add.circle(x, y, 4, color, 1).setDepth(1500);
      const angle = (i / 12) * Math.PI * 2;
      const dist = 20 + Math.random() * 30;
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.1,
        duration: 600,
        ease: 'Power2',
        onComplete: () => dot.destroy()
      });
    }
    // Zentral-Glow
    const glow = this.add.circle(x, y, 12, color, 0.7).setDepth(1499);
    this.tweens.add({ targets: glow, alpha: 0, scale: 2.5, duration: 400, onComplete: () => glow.destroy() });
  }

  /** Soil-Upgrade-Effekt: kurzes Pulsieren in lila */
  private spawnSoilUpgradeEffect(x: number, y: number): void {
    const ring = this.add.circle(x, y, 16, 0xb86ee3, 0.8).setDepth(1500);
    this.tweens.add({ targets: ring, alpha: 0, scale: 3, duration: 500, ease: 'Power2', onComplete: () => ring.destroy() });
    // Drei goldene Funken
    for (let i = 0; i < 6; i++) {
      const spark = this.add.circle(x, y, 3, 0xffd166, 1).setDepth(1501);
      const angle = (i / 6) * Math.PI * 2;
      this.tweens.add({
        targets: spark, x: x + Math.cos(angle) * 24, y: y + Math.sin(angle) * 24,
        alpha: 0, scale: 0.3, duration: 450, ease: 'Back.Out', onComplete: () => spark.destroy()
      });
    }
  }

  private refreshHeader(): void {
    const state = gameStore.get();
    // S-POLISH-B3-R4: Saison + Tag-Anzeige im Header (Stardew-Stil)
    const seasons = ['Fruehling', 'Sommer', 'Herbst', 'Winter'];
    const time = state.time ?? { minute: 360, day: 1, season: 0, year: 1 };
    const seasonLabel = seasons[time.season ?? 0];
    const dayLabel = time.day ?? 1;
    const winterWarn = (time.season === 3) ? '  ⚠Frost' : '';
    this.headerText.setText(
      `${seasonLabel}, Tag ${dayLabel}${winterWarn}  ·  ${state.plants.length}/${GRID_COLUMNS * GRID_ROWS}  ·  ${state.coins} Coins`
    );
  }

  private renderPlants(): void {
    const state = gameStore.get();
    const seenIds = new Set<string>();

    state.plants.forEach((plant) => {
      seenIds.add(plant.id);
      let card = this.cards.get(plant.id);
      if (!card) {
        card = this.createCard(plant);
        this.cards.set(plant.id, card);
      } else {
        this.updateCard(card, plant);
      }
    });

    this.cards.forEach((card, id) => {
      if (!seenIds.has(id)) {
        card.mutationGlowTween?.stop();
        card.container.destroy();
        this.cards.delete(id);
      }
    });
    // S-POLISH-B2-R3: Companion-Aura - grüne Aura auf Karten bei aktiven Companion-Paaren
    this.updateCompanionAuras(state.plants);
    this.refreshHeader();
  }

  private updateCompanionAuras(plants: Plant[]): void {
    if (!this.companionLineGraphics) {
      this.companionLineGraphics = this.add.graphics();
      this.companionLineGraphics.setDepth(50);
    }
    const g = this.companionLineGraphics;
    g.clear();
    const drawn = new Set<string>();
    for (const plant of plants) {
      const { bonus } = companionBonus(plant, plants);
      if (bonus <= 0) continue;
      // Zeichne einen grünen Glow-Ring um die Card
      const card = this.cards.get(plant.id);
      if (!card) continue;
      const cx = card.container.x, cy = card.container.y;
      const pairKey = `${plant.gridX},${plant.gridY}`;
      if (drawn.has(pairKey)) continue;
      drawn.add(pairKey);
      g.lineStyle(2, 0x9be36e, 0.5);
      g.strokeCircle(cx, cy, TILE * 0.52);
    }

    // S-POLISH-B2-R13: Bonsai-Aura — goldener Ring um Bonsai-Pflanzen
    if (!this.bonsaiAuraGraphics) {
      this.bonsaiAuraGraphics = this.add.graphics();
      this.bonsaiAuraGraphics.setDepth(49);
    }
    const bg = this.bonsaiAuraGraphics;
    bg.clear();
    for (const plant of plants) {
      if (!plant.bonsaiMode) continue;
      const card = this.cards.get(plant.id);
      if (!card) continue;
      const cx = card.container.x, cy = card.container.y;
      // Äusserer goldener Ring
      bg.lineStyle(3, 0xfcd95c, 0.55);
      bg.strokeCircle(cx, cy, TILE * 0.56);
      // Innerer Ring (dünner)
      bg.lineStyle(1, 0xffd700, 0.3);
      bg.strokeCircle(cx, cy, TILE * 0.44);
    }
  }

  /**
   * S-POLISH-START-18: Bei tutorialStep === 0 (Neuer Spieler) ein Highlight
   * auf den ersten leeren Plant-Slot setzen plus Hint-Text mit Pfeil.
   */
  private tutorialHighlight?: Phaser.GameObjects.Graphics;
  private tutorialHint?: Phaser.GameObjects.Text;
  private tutorialArrow?: Phaser.GameObjects.Text;
  private tutorialPulseTween?: Phaser.Tweens.Tween;

  private setupTutorialHighlight(): void {
    const state = gameStore.get();
    const tutorialStep = state.tutorial?.step ?? -1;
    if (tutorialStep !== 0) return;

    // Erster leerer Slot finden (kein plant.gridX/Y matched)
    const occupied = new Set(state.plants.map((p) => `${p.gridX},${p.gridY}`));
    let targetX = -1, targetY = -1;
    for (let y = 0; y < GRID_ROWS && targetX === -1; y++) {
      for (let x = 0; x < GRID_COLUMNS && targetX === -1; x++) {
        if (!occupied.has(`${x},${y}`)) {
          targetX = x;
          targetY = y;
        }
      }
    }
    if (targetX === -1) return;

    const sx = this.gridOriginX + targetX * (TILE + TILE_PAD);
    const sy = this.gridOriginY + targetY * (TILE + TILE_PAD);

    // Pulsing Outline
    const highlight = this.add.graphics();
    highlight.lineStyle(3, 0xfcd95c, 1);
    highlight.strokeRoundedRect(sx, sy, TILE, TILE, 4);
    highlight.setDepth(50);
    this.tutorialHighlight = highlight;
    this.tutorialPulseTween = this.tweens.add({
      targets: highlight,
      alpha: { from: 1, to: 0.4 },
      duration: 1500,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1
    });

    // Hint-Text oberhalb Garten-Grid
    const hint = this.add.text(this.scale.width / 2, this.gridOriginY - 28,
      'Klick hier um deine erste Pflanze zu setzen', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#fcd95c',
      backgroundColor: '#1a1f1a',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setDepth(51);
    this.tutorialHint = hint;

    // Pfeil von Hint runter zum Slot (Bouncy)
    const arrow = this.add.text(sx + TILE / 2, sy - 16, 'v', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#fcd95c'
    }).setOrigin(0.5).setDepth(51);
    this.tutorialArrow = arrow;
    this.tweens.add({
      targets: arrow,
      y: sy - 10,
      duration: 600,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1
    });

    // Subscribe gameStore: wenn tutorial-step ueber 0 advanced wird, cleanup
    const unsub = gameStore.subscribe(() => {
      const t = gameStore.get().tutorial?.step ?? -1;
      if (t > 0) {
        this.tutorialPulseTween?.stop();
        this.tutorialHighlight?.destroy();
        this.tutorialHint?.destroy();
        this.tutorialArrow?.destroy();
        unsub();
      }
    });
  }


  private gridToWorld(x: number, y: number): { x: number; y: number } {
    return {
      x: this.gridOriginX + x * (TILE + TILE_PAD) + TILE / 2,
      y: this.gridOriginY + y * (TILE + TILE_PAD) + TILE / 2
    };
  }

  private worldToGrid(x: number, y: number): { x: number; y: number } | null {
    const gx = Math.floor((x - this.gridOriginX) / (TILE + TILE_PAD));
    const gy = Math.floor((y - this.gridOriginY) / (TILE + TILE_PAD));
    if (gx < 0 || gx >= GRID_COLUMNS || gy < 0 || gy >= GRID_ROWS) return null;
    return { x: gx, y: gy };
  }

  private createCard(plant: Plant): PlantCard {
    const pos = this.gridToWorld(plant.gridX, plant.gridY);
    const container = this.add.container(pos.x, pos.y);

    const bg = this.add.graphics();
    container.add(bg);

    const stage = stageOf(plant);
    const key = `${plant.speciesSlug}-${stage}`;
    const sprite = this.add.image(0, -8, key);
    sprite.setDisplaySize(TILE - 16, TILE - 28);
    container.add(sprite);

    // S-POLISH-START-04: Spawn-Animation fuer neue Plants (besonders Hybrid-Reveal)
    // Container scaled von 0 auf 1 in 800ms Back-Out plus Alpha 0->1
    container.setScale(0);
    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      scale: 1,
      alpha: 1,
      duration: 800,
      ease: 'Back.Out'
    });

    // S-POLISH-START-04: Stat-Diff-Floating-Text fuer Hybrids (Mutation oder neuer Cross)
    // Erscheint kurz ueber der Pflanze und faded weg
    if (plant.isMutation) {
      const mutBadge = this.add.text(0, -TILE / 2 + 4, 'MUTATION', {
        fontFamily: 'monospace', fontSize: '8px', color: '#ffffff',
        backgroundColor: '#b86ee3', padding: { x: 4, y: 1 }
      }).setOrigin(0.5);
      container.add(mutBadge);
      this.tweens.add({
        targets: mutBadge,
        y: mutBadge.y - 14,
        alpha: 0,
        duration: 1800,
        delay: 800,
        ease: 'Cubic.Out',
        onComplete: () => mutBadge.destroy()
      });
    }

    // S-POLISH Mutation-Glow: ambient pulsing halo um Pflanzen mit isMutation
    let mutationGlow: Phaser.GameObjects.Graphics | undefined;
    let mutationGlowTween: Phaser.Tweens.Tween | undefined;
    if (plant.isMutation) {
      mutationGlow = this.add.graphics();
      mutationGlow.fillStyle(0xb86ee3, 0.4);
      mutationGlow.fillCircle(0, -8, TILE / 2 - 4);
      container.add(mutationGlow);
      container.sendToBack(mutationGlow);
      mutationGlowTween = this.tweens.add({
        targets: mutationGlow,
        alpha: { from: 0.18, to: 0.55 },
        duration: 1100,
        ease: 'Sine.InOut',
        yoyo: true,
        repeat: -1
      });
    }

    const levelText = this.add.text(0, TILE / 2 - 22, '', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#dcdcdc'
    }).setOrigin(0.5, 0);
    container.add(levelText);

    const xpBar = this.add.graphics();
    container.add(xpBar);

    const hydrationBar = this.add.graphics();
    container.add(hydrationBar);

    const thirstIcon = this.add.text(TILE / 2 - 10, -TILE / 2 + 4, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ff8c42'
    }).setOrigin(1, 0);
    container.add(thirstIcon);

    container.setSize(TILE, TILE);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerdown', () => {
      this.dragSource = { plantId: plant.id, startX: container.x, startY: container.y };
    });

    container.on('drag', (_p: Phaser.Input.Pointer, dx: number, dy: number) => {
      container.setPosition(dx, dy);
    });

    container.on('dragend', (p: Phaser.Input.Pointer) => {
      const grid = this.worldToGrid(p.x, p.y);
      if (grid && gameStore.movePlant(plant.id, grid.x, grid.y)) {
        const np = this.gridToWorld(grid.x, grid.y);
        container.setPosition(np.x, np.y);
      } else if (this.dragSource) {
        container.setPosition(this.dragSource.startX, this.dragSource.startY);
      }
      this.dragSource = undefined;
    });

    container.on('pointerup', (p: Phaser.Input.Pointer) => {
      const dx = p.x - (this.dragSource?.startX ?? 0);
      const dy = p.y - (this.dragSource?.startY ?? 0);
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
        if (this.crossMode) {
          this.handleCrossClick(plant.id);
        } else {
          this.openDetailPanel(plant.id);
        }
      }
    });
    // S-POLISH Run-3: Plant-Card Hover-Scale - Back.Out fuer bouncier Gefuehl
    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.07, duration: 140, ease: 'Back.Out' });
    });
    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1.0, duration: 120, ease: 'Cubic.Out' });
    });

    const card: PlantCard = {
      plant,
      container,
      sprite,
      levelText,
      xpBar,
      hydrationBar,
      thirstIcon,
      bg,
      mutationGlow,
      mutationGlowTween,
      lastSeenStage: stage
    };
    this.updateCard(card, plant);
    return card;
  }

  private updateCard(card: PlantCard, plant: Plant): void {
    card.plant = plant;
    const stage = stageOf(plant);
    const key = `${plant.speciesSlug}-${stage}`;
    if (card.sprite.texture.key !== key && this.textures.exists(key)) {
      card.sprite.setTexture(key);
    }

    // Stage-Up-Burst
    if (stage > card.lastSeenStage) {
      this.spawnStageUpBurst(card.container.x, card.container.y);
      card.lastSeenStage = stage;
    }

    const stageName = GROWTH_STAGE_NAMES[stage];
    card.levelText.setText(`L${plant.level} · ${stageName}`);

    // S-POLISH Run13: Droop-Visual fuer dehydrierte Pflanzen (< 20% hydration)
    // S-POLISH-B2-R2: Booster-Cooldown-Tint (überschreibt Droop nur wenn kein Droop)
    if (plant.hydration < 20) {
      card.sprite.setTint(0xc8b860);
      if (card.sprite.y === 0) card.sprite.setY(2);
    } else {
      // Booster-Tint: subtiler Grün-Schimmer wenn ein Booster aktiv ist
      const activeBoosters = plant.activeBoosters.filter(b => Date.now() - b.startedAt < b.durationMs);
      if (activeBoosters.length > 0) {
        // Subtiler Booster-Tint: leicht grün für wachstumsbooster, gold für pristine, lila für hybrid
        const hasHybrid = activeBoosters.some(b => b.type === 'hybrid');
        const hasPristine = activeBoosters.some(b => b.type === 'xp');
        const tintColor = hasHybrid ? 0xd0a0ff : hasPristine ? 0xffeeaa : 0xaaffaa;
        card.sprite.setTint(tintColor);
      } else {
        card.sprite.clearTint();
      }
      if (card.sprite.y !== 0) card.sprite.setY(0);
    }

    // XP-Bar
    const ratio = plant.level >= 100 ? 1 : plant.xp / xpToNextLevel(plant.level);
    card.xpBar.clear();
    const barW = TILE - 24;
    const barX = -barW / 2;
    const barY = TILE / 2 - 10;
    card.xpBar.fillStyle(0x222a20, 1);
    card.xpBar.fillRoundedRect(barX, barY, barW, 4, 2);
    card.xpBar.fillStyle(plant.level >= 100 ? 0xffd166 : 0x9be36e, 1);
    card.xpBar.fillRoundedRect(barX, barY, Math.max(0, Math.min(1, ratio)) * barW, 4, 2);

    // Hydration-Bar (unter XP-Bar)
    const hRatio = plant.hydration / 100;
    const hBarY = TILE / 2 - 4;
    card.hydrationBar.clear();
    card.hydrationBar.fillStyle(0x182018, 1);
    card.hydrationBar.fillRoundedRect(barX, hBarY, barW, 3, 1.5);
    // Farbe je nach Status
    const hStatus = hydrationStatus(plant);
    const hColor =
      hStatus === 'saftig' ? 0x4dafff :
      hStatus === 'gut' ? 0x68b6e8 :
      hStatus === 'durstig' ? 0xffd166 :
      hStatus === 'trocken' ? 0xff8c42 : 0xff5555;
    card.hydrationBar.fillStyle(hColor, 1);
    card.hydrationBar.fillRoundedRect(barX, hBarY, Math.max(0, Math.min(1, hRatio)) * barW, 3, 1.5);

    // Thirst-Indicator-Text
    const ready = canBeWatered(plant);
    if (hStatus === 'vertrocknet') {
      card.thirstIcon.setText('!!').setColor('#ff5555');
    } else if (hStatus === 'trocken') {
      // S-POLISH-B3-R1: Tropfen-Icon fuer trockene Pflanzen (Stardew-Wasser-Indikator)
      card.thirstIcon.setText('💧').setColor('#ff8c42');
    } else if (hStatus === 'durstig') {
      card.thirstIcon.setText('💧').setColor('#ffd166');
    } else if (ready) {
      card.thirstIcon.setText('💧').setColor('#4dafff');
    } else {
      card.thirstIcon.setText('').setColor('#999999');
    }

    // Hintergrund-Glow je nach Quality-Tier oder kreuzungsreif oder Harvest-Ready
    card.bg.clear();
    const qualityColor = plant.qualityTier ? TIER_COLORS[plant.qualityTier] : null;
    if (isHarvestReady(plant)) {
      // Pulsierender Gold-Rand wenn Ernte bereit
      card.bg.lineStyle(3, 0xffd166, 0.95);
      card.bg.strokeRoundedRect(-TILE / 2 + 2, -TILE / 2 + 2, TILE - 4, TILE - 4, 6);
      if (!card.harvestPulse) {
        card.harvestPulse = this.tweens.add({
          targets: card.bg,
          alpha: { from: 0.45, to: 1.0 },
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    } else {
      if (card.harvestPulse) {
        card.harvestPulse.stop();
        card.harvestPulse = undefined;
        card.bg.alpha = 1;
      }
      if (qualityColor && stage >= 3) {
        card.bg.lineStyle(2, qualityColor, 0.7);
        card.bg.strokeRoundedRect(-TILE / 2 + 2, -TILE / 2 + 2, TILE - 4, TILE - 4, 6);
      } else if (isCrossable(plant)) {
        card.bg.lineStyle(2, 0xffd166, 0.5);
        card.bg.strokeRoundedRect(-TILE / 2 + 2, -TILE / 2 + 2, TILE - 4, TILE - 4, 6);
      }
    }

    // S-POLISH-B2-R13: Bonsai-Badge — gold Punkt oben-rechts wenn bonsaiMode aktiv
    if (plant.bonsaiMode) {
      card.bg.fillStyle(0xfcd95c, 0.9);
      card.bg.fillCircle(TILE / 2 - 6, -TILE / 2 + 6, 4);
    }
  }

  private refreshCards(): void {
    const state = gameStore.get();
    state.plants.forEach((plant) => {
      const card = this.cards.get(plant.id);
      if (card) this.updateCard(card, plant);
    });
    this.refreshHeader();
  }

  private formatGeneSummary(plant: Plant): string {
    if (!plant.genes) return '';
    const parts: string[] = [];
    for (const slug of Object.values(plant.genes)) {
      if (!slug) continue;
      const a = getAllele(slug);
      if (a) parts.push(a.label);
    }
    return parts.length > 0 ? `Genes: ${parts.slice(0, 4).join(', ')}` : '';
  }

  private tierLabel(tier: QualityTier): string {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  }

  private nextTierProgress(careScore: number): { next?: QualityTier; remaining: number } {
    const order: QualityTier[] = ['common', 'fine', 'quality', 'premium', 'pristine'];
    const current = tierForCareScore(careScore);
    const idx = order.indexOf(current);
    if (idx >= order.length - 1) return { remaining: 0 };
    const next = order[idx + 1];
    return { next, remaining: Math.max(0, TIER_THRESHOLDS[next] - careScore) };
  }

  private openDetailPanel(plantId: string): void {
    if (this.detailPanel) {
      this.detailPanel.destroy();
      this.detailPanel = undefined;
    }
    const plant = gameStore.get().plants.find((p) => p.id === plantId);
    if (!plant) return;

    const species = getSpecies(plant.speciesSlug);
    const { width, height } = this.scale;
    const panelW = 320;
    const panelH = 320;

    const container = this.add.container(width / 2, height / 2);
    const bg = this.add.graphics();

    drawModalBox(bg, { width: panelW, height: panelH });
    container.add(bg);

    const title = this.add.text(0, -panelH / 2 + 10, species?.commonName ?? plant.speciesSlug, {
      fontFamily: 'monospace', fontSize: '14px', color: '#9be36e'
    }).setOrigin(0.5, 0);
    container.add(title);

    const sci = this.add.text(0, -panelH / 2 + 28, species?.scientificName ?? '', {
      fontFamily: 'monospace', fontSize: '8px', color: '#888888'
    }).setOrigin(0.5, 0);
    container.add(sci);

    const stage = stageOf(plant);
    const hStatus = hydrationStatus(plant);
    const zone = 'wurzelheim';
    const xpPerSec =
      BASE_XP_PER_SEC *
      stageMultiplier(stage) *
      Math.max(0, hydrationMultiplier(plant)) *
      biomeMatchMultiplier(plant.speciesSlug, zone) *
      hybridVigorMultiplier(plant) *
      timeOfDayMultiplier();
    // S-POLISH-B3-R1: Stage-Fortschritt-Infos
    const stageNames = GROWTH_STAGE_NAMES as unknown as string[];
    const nextStageLvl = stage < 4 ? STAGE_LEVEL_THRESHOLDS[stage + 1] : null;
    const xpNeededForStage = nextStageLvl ? (totalXpToReachLevel(nextStageLvl) - (plant.totalXp ?? 0)) : 0;
    const daysToNextStage = (xpPerSec > 0 && nextStageLvl)
      ? Math.ceil(xpNeededForStage / (xpPerSec * 86400 * 0.5))
      : 0;
    const stageInfo = nextStageLvl
      ? `Stage ${stage + 1}/${stageNames.length - 1} → ${stageNames[stage + 1]} (~${daysToNextStage}d)`
      : `Stage ${stage}/${stageNames.length - 1} (Max)`;
    const estimatedCoins = Math.round((5 + 0 * 4) * 1); // rough estimate common tier
    const harvestInfo = stage >= 4 ? `Ertrag ~${estimatedCoins}–${estimatedCoins + 16} Coins` : `Ertrag ab Stage Blooming`;

    const lines = [
      `Stage: ${GROWTH_STAGE_NAMES[stage]}  (${stageInfo})`,
      `Level: ${plant.level} / 100`,
      `XP: ${Math.floor(plant.xp)} / ${xpToNextLevel(plant.level)}`,
      `Hydration: ${Math.floor(plant.hydration)}% (${hStatus})`,
      `Wachstum: ${xpPerSec.toFixed(2)} XP/s  |  ${harvestInfo}`,
      ``,
      `ATK ${plant.stats.atk}  DEF ${plant.stats.def}  SPD ${plant.stats.spd}`,
      `Generation: F${plant.generation}${plant.isMutation ? ' (Mutation' + (plant.mutationKind ? '-' + plant.mutationKind : '') + ')' : ''}`,
      `Rolle: ${plantRole(plant).role} (${plantRole(plant).hint})`,
      plant.hydration >= 80 ? 'Gen: Growth-Gen aktiv (+Wachstum)' : (plant.hydration < 25 ? 'Gen: Resistenz-Gen aktiv (+Defense)' : ''),
      plant.genes ? this.formatGeneSummary(plant) : ''
    ].filter((l) => l !== '');
    const stats = this.add.text(-panelW / 2 + 14, -panelH / 2 + 50, lines.join('\n'), {
      fontFamily: 'monospace', fontSize: '11px', color: '#dcdcdc'
    });
    container.add(stats);

    // Quality-Tier-Anzeige
    const tierY = -panelH / 2 + 188;
    if (plant.qualityTier) {
      const color = `#${TIER_COLORS[plant.qualityTier].toString(16).padStart(6, '0')}`;
      const tierText = this.add.text(-panelW / 2 + 14, tierY, `Tier: ${this.tierLabel(plant.qualityTier)}`, {
        fontFamily: 'monospace', fontSize: '11px', color
      });
      container.add(tierText);
    } else {
      const np = this.nextTierProgress(plant.careScore);
      const careText = this.add.text(-panelW / 2 + 14, tierY,
        np.next
          ? `Care: ${Math.floor(plant.careScore)} (${np.remaining.toFixed(0)} bis ${this.tierLabel(np.next)})`
          : `Care: ${Math.floor(plant.careScore)}`,
        { fontFamily: 'monospace', fontSize: '11px', color: '#bbbbbb' }
      );
      container.add(careText);
      const hint = this.add.text(-panelW / 2 + 14, tierY + 14,
        'Tier wird bei Adult fixiert', { fontFamily: 'monospace', fontSize: '8px', color: '#666666' });
      container.add(hint);
    }

    // Quality-Stars
    const starsY = tierY + 32;
    const tierIdx = plant.qualityTier
      ? QUALITY_TIERS.indexOf(plant.qualityTier) + 1
      : 0;
    for (let i = 0; i < 5; i++) {
      const filled = i < tierIdx;
      const star = this.add.text(-panelW / 2 + 14 + i * 14, starsY, filled ? '*' : '.', {
        fontFamily: 'monospace', fontSize: '14px',
        color: filled
          ? (plant.qualityTier ? `#${TIER_COLORS[plant.qualityTier].toString(16).padStart(6, '0')}` : '#dcdcdc')
          : '#444444'
      });
      container.add(star);
    }

    // Bloom-Progress (wenn Blooming)
    if (isBlooming(plant)) {
      const bp = bloomProgress(plant);
      const bpY = starsY + 22;
      const bpText = this.add.text(-panelW / 2 + 14, bpY,
        plant.pendingHarvest ? 'Ernte bereit!' : `Bloom: ${Math.floor(bp * 100)}%`,
        { fontFamily: 'monospace', fontSize: '11px', color: plant.pendingHarvest ? '#ffd166' : '#bbbbbb' }
      );
      container.add(bpText);
    }

    // Active Boosters auflisten
    const activeBoosters = listActiveBoosters(plant);
    const boostY = starsY + (isBlooming(plant) ? 42 : 22);
    if (activeBoosters.length > 0) {
      const labels = activeBoosters.map((b) => {
        const remMin = Math.round(boosterRemainingMs(b) / 60000);
        const tag = b.type === 'xp' ? `${b.multiplier}x XP` :
                    b.type === 'sun-lamp' ? 'Sun-Lamp' : 'Sprinkler';
        return `${tag} (${remMin}m)`;
      });
      const boostText = this.add.text(-panelW / 2 + 14, boostY, `Boost: ${labels.join(', ')}`, {
        fontFamily: 'monospace', fontSize: '10px', color: '#ffd166'
      });
      container.add(boostText);
    }

    // Soil-Tier Anzeige + Upgrade-Button
    const soilTier = gameStore.getSoilTier(plant.gridX, plant.gridY);
    const soilY = boostY + (activeBoosters.length > 0 ? 14 : 0);
    const soilText = this.add.text(-panelW / 2 + 14, soilY, `Soil: ${soilTier}`, {
      fontFamily: 'monospace', fontSize: '10px', color: '#bbbbbb'
    });
    container.add(soilText);

    // Companion-Bonus-Anzeige
    const cBonus = companionBonus(plant, gameStore.get().plants);
    if (cBonus.bonus > 0) {
      const compText = this.add.text(-panelW / 2 + 14, soilY + 14,
        `Companion +${(cBonus.bonus * 100).toFixed(0)}%: ${cBonus.hint ?? ''}`, {
        fontFamily: 'monospace', fontSize: '9px', color: '#9be36e'
      });
      container.add(compText);
    } else {
      const partners = getCompanionsFor(plant.speciesSlug);
      if (partners.length > 0) {
        const partnerHint = partners.slice(0, 2).map((p) => p.partner).join(', ');
        const compText = this.add.text(-panelW / 2 + 14, soilY + 14,
          `Companion-Hint: ${partnerHint} nebenan`, {
          fontFamily: 'monospace', fontSize: '9px', color: '#888888'
        });
        container.add(compText);
      }
    }

    // Bonsai-Toggle
    const bonsaiY = soilY + 28;
    // S-POLISH-B2-R13: Grow-Modus-Selector mit visueller Differenzierung
    const modeIcon = plant.bonsaiMode ? '🌿' : '🌱';
    const modeColor = plant.bonsaiMode ? '#fcd95c' : '#9be36e';
    const modeBg = plant.bonsaiMode ? '#2a2000' : '#1a2a1a';
    const bonsaiLabel = plant.bonsaiMode
      ? `${modeIcon} BONSAI  (Cap L44, +30% HP)`
      : `${modeIcon} NORMAL  (unbegrenzt Level-Up)`;
    const bonsaiBtn = this.add.text(-panelW / 2 + 14, bonsaiY, `${bonsaiLabel}  [Toggle]`, {
      fontFamily: 'monospace', fontSize: '9px',
      color: modeColor,
      backgroundColor: modeBg,
      padding: { x: 4, y: 2 }
    }).setInteractive({ useHandCursor: true });
    bonsaiBtn.on('pointerdown', () => {
      const r = gameStore.toggleBonsai(plant.id);
      if (!r.ok) {
        this.showFlash(r.reason ?? 'Toggle fehlgeschlagen', '#ff7e7e');
      } else {
        this.showFlash(r.bonsai ? 'Bonsai aktiviert (+30% maxHp im Battle)' : 'Bonsai deaktiviert', r.bonsai ? '#fcd95c' : '#bbbbbb');
        this.openDetailPanel(plant.id);
      }
    });
    container.add(bonsaiBtn);

    // Wasser-Button
    const ready = canBeWatered(plant);
    const btnLabelW = ready
      ? (plant.hydration < 50 ? 'Giessen (+5 XP, +Care)' : 'Giessen (+5 XP)')
      : `Wasser CD ${Math.ceil(waterCooldownRemaining(plant) / 1000)}s`;
    const waterBtn = this.add.text(-90, panelH / 2 - 30, btnLabelW, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: ready ? '#1a1f1a' : '#888888',
      backgroundColor: ready ? '#5b8de8' : '#3a3a3a',
      padding: { left: 10, right: 10, top: 6, bottom: 6 }
    }).setOrigin(0.5);
    if (ready) waterBtn.setInteractive({ useHandCursor: true });
    waterBtn.on('pointerdown', () => {
      if (!canBeWatered(plant)) return;
      gameStore.updatePlant(plant.id, (p) => {
        const { plant: updated } = waterPlant(p);
        return updated;
      });
      this.openDetailPanel(plant.id);
    });
    container.add(waterBtn);

    // Harvest-Button (nur Blooming + ready)
    if (isHarvestReady(plant)) {
      const harvestBtn = this.add.text(90, panelH / 2 - 30, 'Ernten', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#1a1f1a',
        backgroundColor: '#ffd166',
        padding: { left: 14, right: 14, top: 6, bottom: 6 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      harvestBtn.on('pointerdown', () => {
        const result = gameStore.harvestPlant(plant.id);
        if (result.ok) {
          const parts = [`+${result.coins} Coin`];
          if (result.seedSlug) parts.push(`+1 ${result.seedSlug} Samen`);
          if (result.pollen) parts.push(`+1 Pristine-Pollen`);
          this.showFlash(`Ernte: ${parts.join(', ')}`, '#ffd166');
          // S-POLISH-B2-R18: Harvest-SFX + Gold-Partikel-Burst
          sfx.harvest();
          const card = this.cards.get(plant.id);
          if (card) {
            this.spawnHarvestBurst(card.container.x, card.container.y);
            // S-POLISH-B3-R1: Floating-Zahl "+X Coins"
            this.spawnHarvestFloatingText(card.container.x, card.container.y, result.coins);
          }
          this.openDetailPanel(plant.id);
        } else {
          this.showFlash(result.reason ?? 'Ernte fehlgeschlagen', '#ff8c42');
        }
      });
      container.add(harvestBtn);
    } else if (isBlooming(plant)) {
      const lockBtn = this.add.text(90, panelH / 2 - 30,
        `Ernte ${Math.floor(bloomProgress(plant) * 100)}%`, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#888888',
        backgroundColor: '#2a2a2a',
        padding: { left: 12, right: 12, top: 6, bottom: 6 }
      }).setOrigin(0.5);
      container.add(lockBtn);
    }

    // Booster-Apply-Button
    const boosterBtn = this.add.text(-90, panelH / 2 - 56, 'Booster anwenden', {
      fontFamily: 'monospace', fontSize: '10px', color: '#1a1f1a',
      backgroundColor: '#ffd166',
      padding: { left: 8, right: 8, top: 4, bottom: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    boosterBtn.on('pointerdown', () => {
      this.openBoosterApplyModal(plant.id);
    });
    container.add(boosterBtn);

    // Soil-Upgrade-Button
    const soilBtn = this.add.text(90, panelH / 2 - 56, 'Soil upgraden', {
      fontFamily: 'monospace', fontSize: '10px', color: '#1a1f1a',
      backgroundColor: '#b86ee3',
      padding: { left: 8, right: 8, top: 4, bottom: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    soilBtn.on('pointerdown', () => {
      const result = gameStore.upgradeSoil(plant.gridX, plant.gridY);
      if (result.ok) {
        this.showFlash(`Soil aufgeruestet zu ${result.newTier}`, '#b86ee3');
        // S-POLISH-B2-R2: Soil-Upgrade-Animation
        const card = this.cards.get(plant.id);
        if (card) this.spawnSoilUpgradeEffect(card.container.x, card.container.y);
        this.openDetailPanel(plant.id);
      } else {
        this.showFlash(result.reason ?? 'Soil-Upgrade fehlgeschlagen', '#ff7e7e');
      }
    });
    container.add(soilBtn);

    // Close-Button
    const close = this.add.text(panelW / 2 - 12, -panelH / 2 + 6, 'X', {
      fontFamily: 'monospace', fontSize: '14px', color: '#888888'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => {
      container.destroy();
      this.detailPanel = undefined;
    });
    container.add(close);

    // S-POLISH Run1: Detail-Panel Scale-in Bounce
    container.setScale(0.85);
    container.setAlpha(0);
    this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, alpha: 1, duration: 220, ease: 'Back.Out' });
    this.detailPanel = container;
  }

  private openBoosterApplyModal(plantId: string): void {
    if (this.detailPanel) {
      this.detailPanel.destroy();
      this.detailPanel = undefined;
    }
    const inv = gameStore.getInventory();
    const applicableKinds = ['fertilizer', 'care-pollen', 'tier-pollen', 'sun-lamp', 'sprinkler', 'compost'];
    const slugs = Object.keys(inv).filter((k) => {
      const item = getItem(k);
      return item && applicableKinds.includes(item.kind) && (inv[k] ?? 0) > 0;
    });
    if (slugs.length === 0) {
      this.showFlash('Keine Booster im Inventar', '#ff7e7e');
      this.openDetailPanel(plantId);
      return;
    }
    const { width, height } = this.scale;
    const panelW = 320;
    const panelH = Math.min(360, 80 + slugs.length * 28);
    const container = this.add.container(width / 2, height / 2);
    const bg = this.add.graphics();
    drawModalBox(bg, { width: panelW, height: panelH, borderColor: 0xffd166 });
    container.add(bg);
    const title = this.add.text(0, -panelH / 2 + 12, 'Booster anwenden', {
      fontFamily: 'monospace', fontSize: '13px', color: '#ffd166'
    }).setOrigin(0.5, 0);
    container.add(title);
    slugs.forEach((slug, i) => {
      const item = getItem(slug);
      const label = `${item?.name ?? slug} (${inv[slug]})`;
      const btn = this.add.text(-panelW / 2 + 14, -panelH / 2 + 38 + i * 28, label, {
        fontFamily: 'monospace', fontSize: '11px',
        color: '#dcdcdc',
        backgroundColor: '#2a3325',
        padding: { left: 8, right: 8, top: 4, bottom: 4 }
      }).setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        const r = gameStore.applyItemToPlant(plantId, slug);
        if (r.ok) {
          this.showFlash(r.message ?? 'Angewendet', '#ffd166');
          // S-POLISH-B2-R2: Booster-Partikel-Burst in Booster-Farbe
          const boosterColors: Record<string, number> = {
            'compost-tea': 0x4caf50, 'compost-bag': 0x4caf50,
            'volcano-ash': 0x4caf50, 'swamp-pollen': 0x4caf50,
            'pristine-pollen': 0xffd700, 'growth-hormone': 0xffd700,
            'hybrid-booster': 0x9c27b0, 'sun-lamp': 0xffa726, 'sprinkler': 0x2196f3
          };
          const burstColor = boosterColors[slug] ?? 0xffd166;
          const plantCard = this.cards.get(plantId);
          if (plantCard) this.spawnBoosterBurst(plantCard.container.x, plantCard.container.y, burstColor);
          container.destroy();
          this.detailPanel = undefined;
          this.openDetailPanel(plantId);
        } else {
          this.showFlash(r.reason ?? 'Fehlgeschlagen', '#ff7e7e');
        }
      });
      container.add(btn);
    });
    const close = this.add.text(panelW / 2 - 12, -panelH / 2 + 6, 'X', {
      fontFamily: 'monospace', fontSize: '14px', color: '#888888'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => {
      container.destroy();
      this.detailPanel = undefined;
      this.openDetailPanel(plantId);
    });
    container.add(close);
    this.detailPanel = container;
  }
}

function mapLegacyColor(color: string): ToastType {
  switch (color) {
    case '#9be36e': return 'success';
    case '#ff7e7e': return 'error';
    case '#fcd95c': return 'reward';
    case '#b86ee3': return 'mutation';
    case '#8eaedd': return 'info';
    default: return 'info';
  }
}
