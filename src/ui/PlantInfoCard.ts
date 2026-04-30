/**
 * PlantInfoCard - Botanische Info-Karte fuer Pflanzen.
 *
 * Zeigt: scientificName, commonName, Rarity-Sterne, Biom-Pref,
 * Stat-Bias (ATK/DEF/SPD), Beschreibung.
 *
 * Wird in PokedexScene als Slide-in-Panel genutzt.
 *
 * S-POLISH Batch 5 Run 3
 */
import Phaser from 'phaser';
import type { PlantSpecies } from '../types/plant';
import { FONT_FAMILY, FONT_SIZE_BODY, FONT_SIZE_SMALL } from './uiTheme';

export interface PlantInfoCardData {
  species: PlantSpecies;
  /** Hat der Spieler diese Pflanze schon entdeckt? */
  isDiscovered: boolean;
  /** Hat der Spieler diese Pflanze schon gefangen/gezüchtet? */
  isCaptured: boolean;
}

const RARITY_COLORS: Record<number, string> = {
  1: '#aaaaaa',
  2: '#5cb85c',
  3: '#5bc0de',
  4: '#f0ad4e',
  5: '#d9534f',
  6: '#c079e6',
};

const RARITY_LABELS: Record<number, string> = {
  1: 'Gewöhnlich',
  2: 'Häufig',
  3: 'Ungewöhnlich',
  4: 'Selten',
  5: 'Episch',
  6: 'Mythisch',
};

/**
 * Erstellt einen Phaser Container mit der Info-Karte.
 * Caller ist verantwortlich für Lifecycle (destroy on close).
 */
export class PlantInfoCard {
  private container: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number, y: number, data: PlantInfoCardData) {
    this.scene = scene;
    this.container = scene.add.container(x, y);
    this._build(data);
  }

  private _build(data: PlantInfoCardData): void {
    const { species, isDiscovered, isCaptured } = data;
    const cardW = 260;
    const cardH = 180;

    // Hintergrund
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x111a11, 0.95);
    bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8);
    bg.lineStyle(2, isCaptured ? 0x9be36e : isDiscovered ? 0xfcd95c : 0x3a3a3a, 1);
    bg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8);
    this.container.add(bg);

    if (!isDiscovered) {
      // Silhouette-Karte
      const unknown = this.scene.add.text(0, -10, '???', {
        fontFamily: FONT_FAMILY, fontSize: '28px', color: '#3a3a3a'
      }).setOrigin(0.5);
      const hint = this.scene.add.text(0, 30, 'Noch nicht entdeckt', {
        fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_SMALL, color: '#553e2d'
      }).setOrigin(0.5);
      this.container.add([unknown, hint]);
      return;
    }

    // Wissenschaftlicher Name
    const sciName = this.scene.add.text(0, -cardH / 2 + 14, species.scientificName, {
      fontFamily: FONT_FAMILY, fontSize: '10px', color: '#8abba0',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // Common Name + Rarity
    const rarityColor = RARITY_COLORS[species.rarity] ?? '#aaaaaa';
    const rarityLabel = RARITY_LABELS[species.rarity] ?? '?';
    const stars = '★'.repeat(species.rarity) + '☆'.repeat(Math.max(0, 6 - species.rarity));
    const nameText = this.scene.add.text(0, -cardH / 2 + 32, species.commonName, {
      fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_BODY, color: '#e8f8d0'
    }).setOrigin(0.5);
    const rarityText = this.scene.add.text(0, -cardH / 2 + 48, `${rarityLabel}  ${stars}`, {
      fontFamily: FONT_FAMILY, fontSize: '10px', color: rarityColor
    }).setOrigin(0.5);

    // Biom-Präferenzen
    const prefBiomes = species.preferredBiomes?.join(', ') ?? 'alle';
    const wrongBiomes = species.wrongBiomes?.join(', ') ?? 'keine';
    const biomeText = this.scene.add.text(-cardW / 2 + 10, -cardH / 2 + 64,
      `Biome: ${prefBiomes}`, {
        fontFamily: FONT_FAMILY, fontSize: '9px', color: '#6db87a', wordWrap: { width: cardW - 20 }
      });
    const wrongText = this.scene.add.text(-cardW / 2 + 10, -cardH / 2 + 78,
      `Feinde: ${wrongBiomes}`, {
        fontFamily: FONT_FAMILY, fontSize: '9px', color: '#e07070', wordWrap: { width: cardW - 20 }
      });

    // Stat-Bias
    const atkColor = species.atkBias >= 0 ? '#e07070' : '#aaaaaa';
    const defColor = species.defBias >= 0 ? '#70aaff' : '#aaaaaa';
    const spdColor = species.spdBias >= 0 ? '#fcd95c' : '#aaaaaa';
    const biasSign = (v: number) => v >= 0 ? `+${v}` : `${v}`;
    const statsText = this.scene.add.text(0, -cardH / 2 + 100,
      [
        `ATK ${biasSign(species.atkBias)}`,
        `DEF ${biasSign(species.defBias)}`,
        `SPD ${biasSign(species.spdBias)}`
      ].join('   '), {
        fontFamily: FONT_FAMILY, fontSize: '10px',
        color: '#ffffff'
      }).setOrigin(0.5);
    // Color-coded parts via individual texts (simpler approach)
    const atkT = this.scene.add.text(-60, -cardH / 2 + 100, `ATK ${biasSign(species.atkBias)}`,
      { fontFamily: FONT_FAMILY, fontSize: '10px', color: atkColor });
    const defT = this.scene.add.text(-10, -cardH / 2 + 100, `DEF ${biasSign(species.defBias)}`,
      { fontFamily: FONT_FAMILY, fontSize: '10px', color: defColor });
    const spdT = this.scene.add.text(55, -cardH / 2 + 100, `SPD ${biasSign(species.spdBias)}`,
      { fontFamily: FONT_FAMILY, fontSize: '10px', color: spdColor });
    statsText.setVisible(false); // hide the combined (was just for reference)

    // Beschreibung
    const descText = this.scene.add.text(-cardW / 2 + 10, -cardH / 2 + 118,
      species.description, {
        fontFamily: FONT_FAMILY, fontSize: '9px', color: '#cccccc',
        wordWrap: { width: cardW - 20 }
      });

    // Capture-Status
    const statusStr = isCaptured ? '✓ Gefangen' : '? Gesehen';
    const statusColor = isCaptured ? '#9be36e' : '#fcd95c';
    const statusText = this.scene.add.text(cardW / 2 - 10, -cardH / 2 + 14,
      statusStr, { fontFamily: FONT_FAMILY, fontSize: '9px', color: statusColor }
    ).setOrigin(1, 0);

    this.container.add([
      sciName, nameText, rarityText, biomeText, wrongText,
      atkT, defT, spdT, statsText, descText, statusText
    ]);

    // Slide-in Tween
    this.container.setAlpha(0);
    this.container.setScale(0.9);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1, scaleX: 1, scaleY: 1,
      duration: 180, ease: 'Back.Out'
    });
  }

  destroy(): void {
    this.container.destroy();
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }
}
