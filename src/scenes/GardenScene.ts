import Phaser from 'phaser';
import { gameStore, GRID_COLUMNS, GRID_ROWS } from '../state/gameState';
import {
  stageOf,
  canBeWatered,
  waterCooldownRemaining,
  isNeglected,
  xpToNextLevel,
  isCrossable,
  waterPlant
} from '../data/leveling';
import { GROWTH_STAGE_NAMES, type Plant } from '../types/plant';
import { getSpecies } from '../data/species';

const STAGE_FILES = ['00_seed', '01_sprout', '02_juvenile', '03_adult', '04_blooming'];
const TILE = 92;
const TILE_PAD = 6;

interface PlantCard {
  plant: Plant;
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Image;
  levelText: Phaser.GameObjects.Text;
  xpBar: Phaser.GameObjects.Graphics;
  thirstIcon: Phaser.GameObjects.Text;
  bg: Phaser.GameObjects.Graphics;
}

export class GardenScene extends Phaser.Scene {
  private gridOriginX = 0;
  private gridOriginY = 0;
  private cards: Map<string, PlantCard> = new Map();
  private headerText!: Phaser.GameObjects.Text;
  private detailPanel?: Phaser.GameObjects.Container;
  private dragSource?: { plantId: string; startX: number; startY: number };

  constructor() {
    super('GardenScene');
  }

  preload(): void {
    // Sprites werden bereits in BootScene-Preload geladen (oder hier erneut)
    Object.values(getSpecies('sunflower') ? {} : {}); // ensure import
    // Fallback: lade alle 25 Sprites
    const species = ['sunflower', 'spike-cactus', 'venus-flytrap', 'lavender', 'tomato-plant'];
    species.forEach((slug) => {
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

    // Hintergrund: Greenhouse-Look
    this.cameras.main.setBackgroundColor('#2d3a2a');

    // Header
    this.headerText = this.add.text(width / 2, 16, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#9be36e'
    }).setOrigin(0.5, 0);

    // Grid-Position berechnen
    const gridWidth = GRID_COLUMNS * (TILE + TILE_PAD) - TILE_PAD;
    const gridHeight = GRID_ROWS * (TILE + TILE_PAD) - TILE_PAD;
    this.gridOriginX = (width - gridWidth) / 2;
    this.gridOriginY = 60;

    // Grid-Hintergrund
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

    // Initial-Render
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

    // State-Subscription
    gameStore.subscribe(() => this.renderPlants());

    // Initial Header
    this.refreshHeader();

    // Cross-Hotkey: X kreuzt die ersten 2 Plants im State
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
      // O fuer Overworld zurueck
      const owKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
      owKey.on('down', () => this.scene.start('OverworldScene'));
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

    // Entferne verschwundene Karten
    this.cards.forEach((card, id) => {
      if (!seenIds.has(id)) {
        card.container.destroy();
        this.cards.delete(id);
      }
    });
    this.refreshHeader();
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
      // Klick (kein Drag): Detail oeffnen
      const dx = p.x - (this.dragSource?.startX ?? 0);
      const dy = p.y - (this.dragSource?.startY ?? 0);
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
        this.openDetailPanel(plant.id);
      }
    });

    const card: PlantCard = { plant, container, sprite, levelText, xpBar, thirstIcon, bg };
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

    // Thirst-Indicator
    const cooldownLeft = waterCooldownRemaining(plant);
    const ready = canBeWatered(plant);
    if (isNeglected(plant)) {
      card.thirstIcon.setText('!').setColor('#ff5555');
    } else if (ready) {
      card.thirstIcon.setText('*').setColor('#5b8de8');
    } else {
      const min = Math.ceil(cooldownLeft / 60000);
      card.thirstIcon.setText(`${min}m`).setColor('#999999');
    }

    // Hintergrund-Glow je nach Stufe / kreuzungsreif
    card.bg.clear();
    if (isCrossable(plant)) {
      card.bg.lineStyle(2, 0xffd166, 0.7);
      card.bg.strokeRoundedRect(-TILE / 2 + 2, -TILE / 2 + 2, TILE - 4, TILE - 4, 6);
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

  private openDetailPanel(plantId: string): void {
    if (this.detailPanel) {
      this.detailPanel.destroy();
      this.detailPanel = undefined;
    }
    const plant = gameStore.get().plants.find((p) => p.id === plantId);
    if (!plant) return;

    const species = getSpecies(plant.speciesSlug);
    const { width, height } = this.scale;
    const panelW = 300;
    const panelH = 220;

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
    const lines = [
      `Stage: ${GROWTH_STAGE_NAMES[stage]}`,
      `Level: ${plant.level} / 100`,
      `XP: ${Math.floor(plant.xp)} / ${xpToNextLevel(plant.level)}`,
      `Total XP: ${Math.floor(plant.totalXp)}`,
      ``,
      `ATK ${plant.stats.atk}  DEF ${plant.stats.def}  SPD ${plant.stats.spd}`,
    ];
    const stats = this.add.text(-panelW / 2 + 14, -panelH / 2 + 50, lines.join('\n'), {
      fontFamily: 'monospace', fontSize: '11px', color: '#dcdcdc'
    });
    container.add(stats);

    // Wasser-Button
    const btnY = panelH / 2 - 36;
    const ready = canBeWatered(plant);
    const btnLabel = ready ? 'Giessen (+5 XP)' : `Cooldown ${Math.ceil(waterCooldownRemaining(plant) / 60000)}m`;
    const btn = this.add.text(0, btnY, btnLabel, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: ready ? '#1a1f1a' : '#888888',
      backgroundColor: ready ? '#9be36e' : '#3a3a3a',
      padding: { left: 12, right: 12, top: 6, bottom: 6 }
    }).setOrigin(0.5);
    if (ready) btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => {
      if (!canBeWatered(plant)) return;
      gameStore.updatePlant(plant.id, (p) => {
        const { plant: updated } = waterPlant(p);
        return updated;
      });
      this.openDetailPanel(plant.id); // re-render
    });
    container.add(btn);

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
}
