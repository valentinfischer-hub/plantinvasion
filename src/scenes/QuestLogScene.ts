import Phaser from 'phaser';
import { gameStore } from '../state/gameState';
import { QUESTS, getQuest } from '../data/quests';

/**
 * Quest-Log: zeigt aktive und abgeschlossene Quests.
 * Aufgerufen via Q-Hotkey aus OverworldScene.
 */
export class QuestLogScene extends Phaser.Scene {
  constructor() {
    super('QuestLogScene');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#1a2820');

    this.add.text(width / 2, 30, 'Tagebuch', {
      fontFamily: 'monospace', fontSize: '20px', color: '#9be36e'
    }).setOrigin(0.5);

    const dex = gameStore.getPokedex();
    void dex;
    const inv = gameStore.getInventory();

    let by = 80;
    let count = 0;
    for (const q of QUESTS) {
      const status = gameStore.getQuestState(q.id);
      if (status === 'pending') continue;
      const color = status === 'completed' ? '#9be36e' : '#fcd95c';
      this.add.text(width / 2, by, `[${status}] ${q.title}`, {
        fontFamily: 'monospace', fontSize: '13px', color
      }).setOrigin(0.5);
      by += 18;
      this.add.text(width / 2, by, q.description, {
        fontFamily: 'monospace', fontSize: '10px', color: '#ffffff',
        wordWrap: { width: width - 40 }, align: 'center'
      }).setOrigin(0.5);
      by += 22;
      // Progress
      let progress = '';
      const g = q.goal;
      if (g.type === 'capture') {
        const captured = gameStore.getPokedex().captured.includes(g.speciesSlug);
        progress = captured ? `Gefangen ja` : `Gefangen nein`;
      } else if (g.type === 'have-plant') {
        const has = gameStore.get().plants.some((p) => p.speciesSlug === g.speciesSlug);
        progress = has ? 'Pflanze vorhanden' : 'Pflanze fehlt';
      } else if (g.type === 'have-item') {
        progress = `Bestand: ${inv[g.itemSlug] ?? 0}`;
      }
      this.add.text(width / 2, by, progress, {
        fontFamily: 'monospace', fontSize: '10px', color: '#8a6e4a'
      }).setOrigin(0.5);
      by += 24;
      count++;
    }
    if (count === 0) {
      this.add.text(width / 2, by, 'Noch keine Quests aktiv. Sprich mit NPCs.', {
        fontFamily: 'monospace', fontSize: '12px', color: '#8a6e4a'
      }).setOrigin(0.5);
    }

    // Back
    const backY = height - 30;
    const bg = this.add.rectangle(width / 2, backY, 160, 32, 0x000000, 0.7)
      .setStrokeStyle(1, 0x9be36e)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, backY, 'Zurueck (B)', {
      fontFamily: 'monospace', fontSize: '12px', color: '#9be36e'
    }).setOrigin(0.5);
    const back = () => this.scene.start('OverworldScene');
    bg.on('pointerup', back);
    if (this.input.keyboard) {
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B).on('down', back);
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', back);
    }

    void getQuest;
  }
}
