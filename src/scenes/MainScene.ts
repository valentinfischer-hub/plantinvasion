import Phaser from 'phaser';
import { STARTER_SPECIES } from '../data/species';
import { rollStarterStats } from '../data/genetics';
import { GROWTH_STAGE_NAMES } from '../types/plant';

const STAGE_FILES = ['00_seed', '01_sprout', '02_juvenile', '03_adult', '04_blooming'];

/**
 * MainScene V0.2 - laedt echte PixelLab-Sprites fuer alle 5 Spezies und 5 Stufen
 */
export class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  preload(): void {
    STARTER_SPECIES.forEach((species) => {
      STAGE_FILES.forEach((stageFile, stageIdx) => {
        const key = `${species.slug}-${stageIdx}`;
        const path = `assets/sprites/plants/${species.slug}/${stageFile}.png`;
        this.load.image(key, path);
      });
    });
  }

  create(): void {
    const { width } = this.scale;

    this.add.text(width / 2, 20, 'Plantinvasion', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#9be36e'
    }).setOrigin(0.5);

    this.add.text(width / 2, 42, 'V0.2 - 5 species x 5 stages', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#888888'
    }).setOrigin(0.5);

    const cellSize = 64;
    const padding = 4;
    const startY = 70;
    const labelWidth = 8;

    STARTER_SPECIES.forEach((species, rowIdx) => {
      const y = startY + rowIdx * (cellSize + padding * 2 + 12);
      const seed = (rowIdx + 1) * 1000 + 42;
      const stats = rollStarterStats(species, seed);

      this.add.text(labelWidth, y, species.commonName, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#9be36e'
      });
      this.add.text(labelWidth, y + 11, `ATK ${stats.atk} DEF ${stats.def} SPD ${stats.spd}`, {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#aaaaaa'
      });

      STAGE_FILES.forEach((_, stageIdx) => {
        const x = 110 + stageIdx * (cellSize + padding) + cellSize / 2;
        const key = `${species.slug}-${stageIdx}`;
        if (this.textures.exists(key)) {
          const sprite = this.add.image(x, y + cellSize / 2 + 2, key);
          sprite.setDisplaySize(cellSize, cellSize);
        }

        if (rowIdx === 0) {
          const stageName = GROWTH_STAGE_NAMES[stageIdx];
          this.add.text(x, startY - 14, stageName, {
            fontFamily: 'monospace',
            fontSize: '8px',
            color: '#7a7a7a'
          }).setOrigin(0.5);
        }
      });
    });
  }
}
