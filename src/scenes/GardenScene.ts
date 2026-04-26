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
  tierForCareScore
} from '../data/leveling';
import { GROWTH_STAGE_NAMES, QUALITY_TIERS, type Plant, type QualityTier } from '../types/plant';
import { getSpecies } from '../data/species';
import { generateAllPlantStages } from '../assets/proceduralPlantSprites';
import { listActiveBoosters, boosterRemainingMs } from '../data/boosters';
import { isSeedItem, getItem } from '../data/items';

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
  lastSeenStage: number;
}

export class GardenScene extends Phaser.Scene {
  private gridOriginX = 0;
  private gridOriginY = 0;
  private cards: Map<string, PlantCard> = new Map();
  private crossModeActive = false;
  private crossSelected: string[] = [];
  private crossModeText?: Phaser.GameObjects.Text;
  private headerText!: Phaser.GameObjects.Text;
  private detailPanel?: Phaser.GameObjects.Container;
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
    console.log('[GardenScene] create called');
    const { width } = this.scale;

    // Procedural-Plant-Sprites fuer Spezies ohne PNG (V0.5 erweiterte Pokedex)
    generateAllPlantStages(this);

    this.cameras.main.setBackgroundColor('#2d3a2a');

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
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLUMNS; x++) {
        const sx = this.gridOriginX + x * (TILE + TILE_PAD);
        const sy = this.gridOriginY + y * (TILE + TILE_PAD);
        const slot = this.add.graphics();
        slot.fillStyle(0x223520, 0.5);
        slot.fillRoundedRect(sx, sy, TILE, TILE, 4);
        slot.lineStyle(1, 0x44603f, 0.5);
        slot.strokeRoundedRect(sx, sy, TILE, TILE, 4);
      }
    }

    this.renderPlants();

    // Tick-Loop: alle 1s
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        gameStore.tick();
        this.refreshCards();
      }
    });

    gameStore.subscribe(() => this.renderPlants());

    this.refreshHeader();

    // Cross-Mode-Indikator
    (window as any).__gardenSelectForCross = (id: string) => this.selectForCross(id);
    this.crossModeText = this.add.text(this.scale.width / 2, 36, 'CROSS-MODE: 2 Pflanzen anklicken (C zum schliessen)', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ff7eb8',
      backgroundColor: '#000000', padding: { x: 6, y: 3 }
    }).setOrigin(0.5).setDepth(2400).setVisible(false);

    if (this.input.keyboard) {
      const crossKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
      crossKey.on('down', () => {
        const state = gameStore.get();
        if (state.plants.length < 2) {
          this.showFlash('Brauchst 2 Pflanzen zum Kreuzen', '#ff7e7e');
          return;
        }
        const result = gameStore.crossPlants(state.plants[0].id, state.plants[1].id);
        if (!result.ok) {
          this.showFlash(result.reason ?? 'Crossing fehlgeschlagen', '#ff7e7e');
        } else {
          this.showFlash(result.child?.isMutation ? 'Mutation! Neue Pflanze' : 'Kreuzung erfolgreich', '#9be36e');
        }
      });
      // C-Hotkey toggle cross-mode (UI-Polish: 2-Slot-Select)
      const cKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
      cKey.on('down', () => {
        this.crossModeActive = !this.crossModeActive;
        this.crossSelected = [];
        if (this.crossModeText) this.crossModeText.setVisible(this.crossModeActive);
        this.refreshCrossHighlights();
        if (this.crossModeActive) this.showFlash('Cross-Mode: 2 Pflanzen anklicken', '#ff7eb8');
      });
      const owKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
      owKey.on('down', () => this.scene.start('OverworldScene'));

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
    const { width, height } = this.scale;
    const panelW = 320;
    const panelH = Math.min(380, 80 + seedSlugs.length * 26);
    const container = this.add.container(width / 2, height / 2);
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1f1a, 0.96);
    bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 8);
    bg.lineStyle(2, 0x9be36e, 0.8);
    bg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 8);
    container.add(bg);
    const title = this.add.text(0, -panelH / 2 + 12, 'Pflanze einsaeen', {
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

  private refreshCrossHighlights(): void {
    // Visualisierung der ausgewaehlten Slots (subtile Color-Indikator). Ohne 'frame'-property auf Card: nur logisch
    void this.crossSelected;
  }

  private selectForCross(plantId: string): void {
    if (!this.crossModeActive) return;
    if (this.crossSelected.includes(plantId)) {
      this.crossSelected = this.crossSelected.filter((p) => p !== plantId);
    } else if (this.crossSelected.length < 2) {
      this.crossSelected.push(plantId);
    }
    this.refreshCrossHighlights();
    if (this.crossSelected.length === 2) {
      const result = gameStore.crossPlants(this.crossSelected[0], this.crossSelected[1]);
      if (!result.ok) {
        this.showFlash(result.reason ?? 'Crossing fehlgeschlagen', '#ff7e7e');
      } else {
        this.showFlash(result.child?.isMutation ? 'Mutation! Neue Pflanze' : 'Kreuzung erfolgreich', '#9be36e');
      }
      this.crossSelected = [];
      this.crossModeActive = false;
      if (this.crossModeText) this.crossModeText.setVisible(false);
      this.refreshCrossHighlights();
    }
  }

  private flashText?: Phaser.GameObjects.Text;
  private showFlash(message: string, color: string): void {
    if (this.flashText) this.flashText.destroy();
    const { width, height } = this.scale;
    this.flashText = this.add.text(width / 2, height / 2, message, {
      fontFamily: 'monospace', fontSize: '14px', color,
      backgroundColor: '#000000', padding: { x: 10, y: 6 }
    }).setOrigin(0.5).setDepth(2000);
    this.tweens.add({
      targets: this.flashText,
      alpha: 0,
      duration: 1800,
      onComplete: () => { this.flashText?.destroy(); this.flashText = undefined; }
    });
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
        scale: 0.2,
        duration: 700,
        ease: 'Quad.easeOut',
        onComplete: () => dot.destroy()
      });
    }
  }

  private refreshHeader(): void {
    const state = gameStore.get();
    this.headerText.setText(
      `Plantinvasion · ${state.plants.length}/${GRID_COLUMNS * GRID_ROWS} · Coins ${state.coins}`
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
        card.container.destroy();
        this.cards.delete(id);
      }
    });
    this.refreshHeader();

    // Cross-Mode-Indikator
    (window as any).__gardenSelectForCross = (id: string) => this.selectForCross(id);
    this.crossModeText = this.add.text(this.scale.width / 2, 36, 'CROSS-MODE: 2 Pflanzen anklicken (C zum schliessen)', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ff7eb8',
      backgroundColor: '#000000', padding: { x: 6, y: 3 }
    }).setOrigin(0.5).setDepth(2400).setVisible(false);
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
        this.openDetailPanel(plant.id);
      }
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
      card.thirstIcon.setText('!').setColor('#ff8c42');
    } else if (hStatus === 'durstig') {
      card.thirstIcon.setText('~').setColor('#ffd166');
    } else if (ready) {
      card.thirstIcon.setText('*').setColor('#4dafff');
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
          alpha: { from: 0.5, to: 1.0 },
          duration: 700,
          yoyo: true,
          repeat: -1
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
  }

  private refreshCards(): void {
    const state = gameStore.get();
    state.plants.forEach((plant) => {
      const card = this.cards.get(plant.id);
      if (card) this.updateCard(card, plant);
    });
    this.refreshHeader();

    // Cross-Mode-Indikator
    (window as any).__gardenSelectForCross = (id: string) => this.selectForCross(id);
    this.crossModeText = this.add.text(this.scale.width / 2, 36, 'CROSS-MODE: 2 Pflanzen anklicken (C zum schliessen)', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ff7eb8',
      backgroundColor: '#000000', padding: { x: 6, y: 3 }
    }).setOrigin(0.5).setDepth(2400).setVisible(false);
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
    bg.fillStyle(0x1a1f1a, 0.96);
    bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 8);
    bg.lineStyle(2, 0x9be36e, 0.8);
    bg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 8);
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
    const lines = [
      `Stage: ${GROWTH_STAGE_NAMES[stage]}`,
      `Level: ${plant.level} / 100`,
      `XP: ${Math.floor(plant.xp)} / ${xpToNextLevel(plant.level)}`,
      `Hydration: ${Math.floor(plant.hydration)}% (${hStatus})`,
      `Wachstum: ${xpPerSec.toFixed(2)} XP/s`,
      ``,
      `ATK ${plant.stats.atk}  DEF ${plant.stats.def}  SPD ${plant.stats.spd}`,
      `Generation: F${plant.generation}${plant.isMutation ? ' (Mutation)' : ''}`
    ];
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
    bg.fillStyle(0x1a1f1a, 0.96);
    bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 8);
    bg.lineStyle(2, 0xffd166, 0.8);
    bg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 8);
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
