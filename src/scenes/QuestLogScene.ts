import Phaser from 'phaser';
import { gameStore } from '../state/gameState';
import { QUESTS, getQuest } from '../data/quests';
import { COLOR_REWARD, COLOR_SUCCESS, FONT_FAMILY, FONT_SIZE_SMALL, MODAL_BORDER_COLOR } from '../ui/uiTheme';

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
      fontFamily: FONT_FAMILY, fontSize: '20px', color: COLOR_SUCCESS
    }).setOrigin(0.5);

    const dex = gameStore.getPokedex();
    void dex;
    const inv = gameStore.getInventory();

    let by = 80;
    let count = 0;
    for (const q of QUESTS) {
      const status = gameStore.getQuestState(q.id);
      if (status === 'pending') continue;
      const color = status === 'completed' ? COLOR_SUCCESS : COLOR_REWARD;
      const statusLabel = status === 'completed' ? '✓' : '●';
      const questText = this.add.text(width / 2, by, `${statusLabel} ${q.title}`, {
        fontFamily: FONT_FAMILY, fontSize: '13px', color
      }).setOrigin(0.5);
      // S-POLISH Run7: glow-pulse bei abgeschlossenen Quests
      if (status === 'completed') {
        this.tweens.add({
          targets: questText, alpha: { from: 1, to: 0.6 }, duration: 1100,
          ease: 'Sine.InOut', yoyo: true, repeat: -1, delay: Math.random() * 500
        });
      }
      by += 18;
      this.add.text(width / 2, by, q.description, {
        fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_SMALL, color: '#ffffff',
        wordWrap: { width: width - 40 }, align: 'center'
      }).setOrigin(0.5);
      by += 22;
      // S-POLISH-B2-R11: Quest Progress mit visuellem Fortschrittsbalken
      const g = q.goal;
      let progressText = '';
      let progressPct = 0;
      if (g.type === 'capture') {
        const captured = gameStore.getPokedex().captured.includes(g.speciesSlug);
        progressText = captured ? `Gefangen: ${g.speciesSlug}` : `Noch nicht gefangen: ${g.speciesSlug}`;
        progressPct = captured ? 1 : 0;
      } else if (g.type === 'have-plant') {
        const has = gameStore.get().plants.some((p) => p.speciesSlug === g.speciesSlug);
        progressText = has ? 'Pflanze vorhanden' : 'Pflanze fehlt';
        progressPct = has ? 1 : 0;
      } else if (g.type === 'have-item') {
        const have = inv[g.itemSlug] ?? 0;
        const need = g.count ?? 1;
        progressText = `Bestand: ${have} / ${need}`;
        progressPct = Math.min(1, have / need);
      } else if (g.type === 'discover') {
        const disc = gameStore.getPokedex().discovered.includes(g.speciesSlug);
        progressText = disc ? 'Entdeckt' : 'Noch nicht entdeckt';
        progressPct = disc ? 1 : 0;
      } else if (g.type === 'reach-zone') {
        const visited = gameStore.get().overworld?.zone === g.zone;
        progressText = visited ? `Zone erreicht: ${g.zone}` : `Zone: ${g.zone}`;
        progressPct = visited ? 1 : 0;
      } else {
        progressText = 'Fortschritt unbekannt';
      }
      // Progress Text
      this.add.text(width / 2, by, progressText, {
        fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_SMALL, color: '#8a6e4a'
      }).setOrigin(0.5);
      by += 14;
      // Fortschrittsbalken
      const barG = this.add.graphics();
      const barW = width - 60;
      const barX = 30;
      barG.fillStyle(0x222222, 0.8);
      barG.fillRect(barX, by, barW, 6);
      const fillColor = status === 'completed' ? 0x4ab84a : (progressPct >= 0.5 ? 0xfcd95c : 0x8a4a1a);
      const fillW = Math.max(2, Math.round(barW * progressPct));
      barG.fillStyle(fillColor, 1);
      barG.fillRect(barX + 1, by + 1, fillW - 2, 4);
      barG.lineStyle(1, 0x555555, 0.8);
      barG.strokeRect(barX, by, barW, 6);
      by += 14;
      count++;
    }
    if (count === 0) {
      this.add.text(width / 2, by, 'Noch keine Quests aktiv. Sprich mit NPCs.', {
        fontFamily: FONT_FAMILY, fontSize: '12px', color: '#8a6e4a'
      }).setOrigin(0.5);
    }

    // Back
    const backY = height - 30;
    const bg = this.add.rectangle(width / 2, backY, 160, 32, 0x000000, 0.7)
      .setStrokeStyle(1, MODAL_BORDER_COLOR)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, backY, 'Zurück (B)', {
      fontFamily: FONT_FAMILY, fontSize: '12px', color: COLOR_SUCCESS
    }).setOrigin(0.5);
    const back = () => this.scene.start('OverworldScene');
    bg.on('pointerup', back);
    // S-POLISH Run-3: Hover-State fuer Back-Button
    bg.on('pointerover', () => { bg.setStrokeStyle(2, 0x9be36e); bg.setFillStyle(0x000000, 0.9); });
    bg.on('pointerout', () => { bg.setStrokeStyle(1, 0x9be36e); bg.setFillStyle(0x000000, 0.7); });
    if (this.input.keyboard) {
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B).on('down', back);
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', back);
    }

    void getQuest;
  }
}
