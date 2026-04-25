import Phaser from 'phaser';
import { gameStore } from '../state/gameState';
import { WURZELHEIM_TALLGRASS, type EncounterDef } from '../data/encounters';
import { STARTER_SPECIES } from '../data/species';
import { ACHIEVEMENTS } from '../data/achievements';

/**
 * Pokedex-UI mit Tab-Switch zwischen Spezies-Liste und Achievements.
 * Aufgerufen ueber Inventar-Menu oder Hotkey P.
 */
export class PokedexScene extends Phaser.Scene {
  private tab: 'species' | 'achievements' = 'species';
  private listContainer!: Phaser.GameObjects.Container;
  private speciesTabBtn!: Phaser.GameObjects.Text;
  private achievementsTabBtn!: Phaser.GameObjects.Text;

  constructor() {
    super('PokedexScene');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#1a2820');

    this.add.text(width / 2, 32, 'Pokedex', {
      fontFamily: 'monospace', fontSize: '20px', color: '#9be36e'
    }).setOrigin(0.5);

    // Tabs
    this.speciesTabBtn = this.add.text(width / 2 - 80, 64, 'Spezies', {
      fontFamily: 'monospace', fontSize: '12px',
      color: '#1a2820', backgroundColor: '#9be36e',
      padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.speciesTabBtn.on('pointerdown', () => this.switchTab('species'));

    this.achievementsTabBtn = this.add.text(width / 2 + 80, 64, 'Achievements', {
      fontFamily: 'monospace', fontSize: '12px',
      color: '#aaaaaa', backgroundColor: '#2a3a30',
      padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.achievementsTabBtn.on('pointerdown', () => this.switchTab('achievements'));

    this.listContainer = this.add.container(0, 0);
    this.refreshList();

    // Back-Button
    const backY = height - 30;
    const back = this.add.text(width / 2, backY, 'Zurueck (B)', {
      fontFamily: 'monospace', fontSize: '12px',
      color: '#fcd95c', backgroundColor: '#000000',
      padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('OverworldScene'));
    if (this.input.keyboard) {
      const backKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
      backKey.on('down', () => this.scene.start('OverworldScene'));
      const escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      escKey.on('down', () => this.scene.start('OverworldScene'));
    }
  }

  private switchTab(tab: 'species' | 'achievements'): void {
    this.tab = tab;
    if (tab === 'species') {
      this.speciesTabBtn.setColor('#1a2820').setBackgroundColor('#9be36e');
      this.achievementsTabBtn.setColor('#aaaaaa').setBackgroundColor('#2a3a30');
    } else {
      this.speciesTabBtn.setColor('#aaaaaa').setBackgroundColor('#2a3a30');
      this.achievementsTabBtn.setColor('#1a2820').setBackgroundColor('#ffd166');
    }
    this.refreshList();
  }

  private refreshList(): void {
    const { width, height } = this.scale;
    this.listContainer.removeAll(true);
    if (this.tab === 'species') {
      this.renderSpecies(width, height);
    } else {
      this.renderAchievements(width, height);
    }
  }

  private renderSpecies(width: number, height: number): void {
    const dex = gameStore.getPokedex();
    this.listContainer.add(
      this.add.text(width / 2, 96, `${dex.discovered.length} entdeckt, ${dex.captured.length} gefangen`, {
        fontFamily: 'monospace', fontSize: '11px', color: '#ffffff'
      }).setOrigin(0.5)
    );

    const allKnown: Array<{ slug: string; name: string; family: string; rarity: number }> = [];
    for (const sp of STARTER_SPECIES) {
      allKnown.push({ slug: sp.slug, name: sp.commonName, family: 'Starter', rarity: sp.rarity });
    }
    for (const e of WURZELHEIM_TALLGRASS as EncounterDef[]) {
      if (!allKnown.find((a) => a.slug === e.slug)) {
        allKnown.push({ slug: e.slug, name: e.commonName, family: e.family, rarity: 1 });
      }
    }

    let by = 122;
    let shown = 0;
    for (const k of allKnown) {
      const isDiscovered = dex.discovered.includes(k.slug);
      const isCaptured = dex.captured.includes(k.slug);
      const status = isCaptured ? '[gefangen]' : (isDiscovered ? '[entdeckt]' : '[unbekannt]');
      const color = isCaptured ? '#9be36e' : (isDiscovered ? '#fcd95c' : '#666666');
      const display = isDiscovered ? k.name : '???';
      const t = this.add.text(40, by, `${display} (${k.family}) ${status}`, {
        fontFamily: 'monospace', fontSize: '10px', color
      });
      this.listContainer.add(t);
      by += 16;
      shown++;
      if (by > height - 80) break;
    }
    if (shown === 0) {
      this.listContainer.add(
        this.add.text(width / 2, 130, 'Noch keine Spezies entdeckt.', {
          fontFamily: 'monospace', fontSize: '11px', color: '#888888'
        }).setOrigin(0.5)
      );
    }
  }

  private renderAchievements(width: number, height: number): void {
    const unlocked = gameStore.getAchievements();
    this.listContainer.add(
      this.add.text(width / 2, 96, `${unlocked.length} / ${ACHIEVEMENTS.length} freigeschaltet`, {
        fontFamily: 'monospace', fontSize: '11px', color: '#ffd166'
      }).setOrigin(0.5)
    );

    let by = 122;
    for (const a of ACHIEVEMENTS) {
      const isUnlocked = unlocked.includes(a.slug);
      const color = isUnlocked ? '#ffd166' : '#666666';
      const symbol = isUnlocked ? '*' : '.';
      const reward = a.rewardCoins ? `+${a.rewardCoins} Coins` : (a.rewardItem ? `+${a.rewardItem.amount} ${a.rewardItem.slug}` : '');
      const line1 = this.add.text(20, by, `${symbol} ${a.name}  ${reward}`, {
        fontFamily: 'monospace', fontSize: '11px', color
      });
      const line2 = this.add.text(36, by + 13, a.description, {
        fontFamily: 'monospace', fontSize: '9px',
        color: isUnlocked ? '#ddc488' : '#444444'
      });
      this.listContainer.add(line1);
      this.listContainer.add(line2);
      by += 32;
      if (by > height - 80) break;
    }
  }
}
