import Phaser from 'phaser';
import { gameStore } from '../state/gameState';
import { WURZELHEIM_TALLGRASS, type EncounterDef } from '../data/encounters';
import { STARTER_SPECIES } from '../data/species';

/**
 * Pokedex-UI: zeigt alle entdeckten plus gefangenen Pflanzen.
 * Aufgerufen ueber Inventar-Menu (V0.5) oder Hotkey (P).
 */
export class PokedexScene extends Phaser.Scene {
  constructor() {
    super('PokedexScene');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#1a2820');

    this.add.text(width / 2, 40, 'Pokedex', {
      fontFamily: 'monospace', fontSize: '24px', color: '#9be36e'
    }).setOrigin(0.5);

    const dex = gameStore.getPokedex();
    this.add.text(width / 2, 70, `${dex.discovered.length} entdeckt, ${dex.captured.length} gefangen`, {
      fontFamily: 'monospace', fontSize: '11px', color: '#ffffff'
    }).setOrigin(0.5);

    // Combined pool: starter species + wild encounters
    const allKnown: Array<{ slug: string; name: string; family: string; rarity: number }> = [];
    for (const sp of STARTER_SPECIES) {
      allKnown.push({ slug: sp.slug, name: sp.commonName, family: 'Starter', rarity: sp.rarity });
    }
    for (const e of WURZELHEIM_TALLGRASS as EncounterDef[]) {
      if (!allKnown.find((a) => a.slug === e.slug)) {
        allKnown.push({ slug: e.slug, name: e.commonName, family: e.family, rarity: 1 });
      }
    }

    // Liste anzeigen
    let by = 100;
    for (const entry of allKnown) {
      const isDiscovered = dex.discovered.includes(entry.slug);
      const isCaptured = dex.captured.includes(entry.slug);
      const status = isCaptured ? '✓' : (isDiscovered ? '?' : '·');
      const color = isCaptured ? '#9be36e' : (isDiscovered ? '#fcd95c' : '#553e2d');
      const displayName = isDiscovered ? entry.name : '???';
      this.add.text(width / 2, by, `${status}  ${displayName}  (${entry.family})`, {
        fontFamily: 'monospace', fontSize: '12px', color
      }).setOrigin(0.5);
      by += 18;
    }

    // Back-Button
    const backY = height - 40;
    const backBg = this.add.rectangle(width / 2, backY, 160, 32, 0x000000, 0.7)
      .setStrokeStyle(1, 0x9be36e)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, backY, 'Zurueck (B)', {
      fontFamily: 'monospace', fontSize: '12px', color: '#9be36e'
    }).setOrigin(0.5);

    const back = () => this.scene.start('OverworldScene');
    backBg.on('pointerup', back);
    if (this.input.keyboard) {
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B).on('down', back);
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', back);
    }
  }
}
