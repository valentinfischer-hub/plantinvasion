import Phaser from 'phaser';
import { STARTER_SPECIES } from '../data/species';
import { rollStarterStats } from '../data/genetics';
import { GROWTH_STAGE_NAMES } from '../types/plant';

/**
 * MainScene V0.1.1 - zeigt die 5 Start-Spezies mit ihren initialen Roll-Stats.
 * Ohne echte Sprites (PixelLab-Generation kommt naechster Schritt).
 */
export class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  create(): void {
    const { width } = this.scale;

    this.add.text(width / 2, 40, 'Plantinvasion', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#9be36e'
    }).setOrigin(0.5);

    this.add.text(width / 2, 70, 'V0.1.1 — 5 Starter-Spezies', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#888888'
    }).setOrigin(0.5);

    let y = 110;
    STARTER_SPECIES.forEach((species, idx) => {
      const seed = (idx + 1) * 1000 + 42;
      const stats = rollStarterStats(species, seed);
      const stage = GROWTH_STAGE_NAMES[Math.min(idx, 4)];

      // Rarity-Sterne
      const rarityStr = '★'.repeat(species.rarity) + '☆'.repeat(5 - species.rarity);

      this.add.text(20, y, species.commonName, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#9be36e'
      });

      this.add.text(20, y + 18, species.scientificName, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#aaaaaa'
      });

      this.add.text(20, y + 32, `${rarityStr}  ATK ${stats.atk}  DEF ${stats.def}  SPD ${stats.spd}  ${stage}`, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#dddddd'
      });

      y += 70;
    });

    this.add.text(width / 2, this.scale.height - 24, 'sprites kommen via PixelLab', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#555555'
    }).setOrigin(0.5);
  }
}
