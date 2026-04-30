import Phaser from 'phaser';
import { gameStore } from '../state/gameState';
import { QUESTS, getQuest } from '../data/quests';
import { COLOR_REWARD, COLOR_SUCCESS, FONT_FAMILY, FONT_SIZE_SMALL, MODAL_BORDER_COLOR } from '../ui/uiTheme';

/**
 * Quest-Log V2 (B7-R7): Filter (Aktiv/Abgeschlossen), Quest-Complete-Animation,
 * Reward-Reveal, Scroll-Support.
 */
type QuestFilter = 'all' | 'active' | 'completed';

export class QuestLogScene extends Phaser.Scene {
  private filterMode: QuestFilter = 'all';
  private filterBtns: { mode: QuestFilter; bg: Phaser.GameObjects.Rectangle; txt: Phaser.GameObjects.Text }[] = [];
  private listContainer!: Phaser.GameObjects.Container;
  private scrollY = 0;
  private maxScrollY = 0;

  constructor() {
    super('QuestLogScene');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#1a2820');

    this.add.text(width / 2, 28, 'Tagebuch', {
      fontFamily: FONT_FAMILY, fontSize: '20px', color: COLOR_SUCCESS
    }).setOrigin(0.5);

    // B7-R7: Filter-Buttons
    this.buildFilterButtons(width);

    // Scroll-Container
    this.listContainer = this.add.container(0, 0).setDepth(10);

    // Scroll via Mausrad
    this.input.on('wheel', (_p: Phaser.Input.Pointer, _dx: number, _dy: number, deltaY: number) => {
      this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY * 0.5, 0, this.maxScrollY);
      this.listContainer.setY(-this.scrollY + 96);
    });

    this.renderQuests();

    // Back-Button
    const backY = height - 30;
    const bg = this.add.rectangle(width / 2, backY, 160, 32, 0x000000, 0.7)
      .setStrokeStyle(1, MODAL_BORDER_COLOR)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, backY, 'Zurueck (B)', {
      fontFamily: FONT_FAMILY, fontSize: '12px', color: COLOR_SUCCESS
    }).setOrigin(0.5);
    const back = () => this.scene.start('OverworldScene');
    bg.on('pointerup', back);
    bg.on('pointerover', () => { bg.setStrokeStyle(2, 0x9be36e); bg.setFillStyle(0x000000, 0.9); });
    bg.on('pointerout', () => { bg.setStrokeStyle(1, 0x9be36e); bg.setFillStyle(0x000000, 0.7); });
    if (this.input.keyboard) {
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B).on('down', back);
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', back);
    }
    void getQuest;
  }

  private buildFilterButtons(width: number): void {
    const modes: { mode: QuestFilter; label: string }[] = [
      { mode: 'all', label: 'Alle' },
      { mode: 'active', label: 'Aktiv' },
      { mode: 'completed', label: 'Abgeschlossen' },
    ];
    const totalW = 260;
    const btnW = totalW / modes.length;
    let bx = width / 2 - totalW / 2;
    for (const m of modes) {
      const active = this.filterMode === m.mode;
      const bg = this.add.rectangle(bx + btnW / 2, 60, btnW - 4, 22, 0x000000, 0.8)
        .setStrokeStyle(2, active ? 0x9be36e : 0x556644)
        .setInteractive({ useHandCursor: true });
      const txt = this.add.text(bx + btnW / 2, 60, m.label, {
        fontFamily: FONT_FAMILY, fontSize: '10px', color: active ? '#9be36e' : '#aaaaaa'
      }).setOrigin(0.5);
      bg.on('pointerdown', () => {
        this.filterMode = m.mode;
        this.updateFilterBtns();
        this.scrollY = 0;
        this.listContainer.setY(96);
        this.renderQuests();
      });
      this.filterBtns.push({ mode: m.mode, bg, txt });
      bx += btnW;
    }
  }

  private updateFilterBtns(): void {
    for (const btn of this.filterBtns) {
      const active = btn.mode === this.filterMode;
      btn.bg.setStrokeStyle(2, active ? 0x9be36e : 0x556644);
      btn.txt.setColor(active ? '#9be36e' : '#aaaaaa');
    }
  }

  private renderQuests(): void {
    this.listContainer.removeAll(true);
    const { width } = this.scale;
    const inv = gameStore.getInventory();
    const dex = gameStore.getPokedex();
    void dex;

    let by = 0;
    let count = 0;

    for (const q of QUESTS) {
      const status = gameStore.getQuestState(q.id);
      if (status === 'pending') continue;
      // Filter anwenden
      if (this.filterMode === 'active' && status !== 'active') continue;
      if (this.filterMode === 'completed' && status !== 'completed') continue;

      const color = status === 'completed' ? COLOR_SUCCESS : COLOR_REWARD;
      const statusLabel = status === 'completed' ? '✓' : '●';

      // B7-R7: Quest-Complete-Animation — goldener Shine-Flash bei completed
      const questRow = this.add.container(width / 2, by);

      const questText = this.add.text(0, 0, `${statusLabel} ${q.title}`, {
        fontFamily: FONT_FAMILY, fontSize: '13px', color
      }).setOrigin(0.5);
      questRow.add(questText);

      if (status === 'completed') {
        // Glow-Pulse
        this.tweens.add({
          targets: questText, alpha: { from: 1, to: 0.65 }, duration: 1100,
          ease: 'Sine.InOut', yoyo: true, repeat: -1, delay: Math.random() * 500
        });
        // B7-R7: Reward-Reveal — kleines Badge rechts
        const qr = q.reward;
        if (qr) {
          let rewardLabel = '';
          if (qr.coins) rewardLabel += `+${qr.coins}c `;
          if (qr.items) {
            const firstItem = Object.entries(qr.items)[0];
            if (firstItem) rewardLabel += `+${firstItem[1]}x ${firstItem[0]}`;
          }
          if (rewardLabel) {
            const rewardBadge = this.add.text(width / 4, 0, rewardLabel.trim(), {
              fontFamily: FONT_FAMILY, fontSize: '9px', color: COLOR_REWARD,
              backgroundColor: '#1a1400', padding: { x: 4, y: 2 }
            }).setOrigin(0, 0.5);
            questRow.add(rewardBadge);
          }
        }
      }

      this.listContainer.add(questRow);
      by += 20;

      const descText = this.add.text(0, by, q.description, {
        fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_SMALL, color: '#cccccc',
        wordWrap: { width: width - 40 }, align: 'center'
      }).setOrigin(0.5, 0);
      this.listContainer.add(descText);
      by += (descText.height + 4);

      // Progress-Bar
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
      }

      const progLabel = this.add.text(0, by, progressText, {
        fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_SMALL, color: '#8a6e4a'
      }).setOrigin(0.5, 0);
      this.listContainer.add(progLabel);
      by += 14;

      const barG = this.add.graphics();
      const barW = width - 60;
      barG.fillStyle(0x222222, 0.8);
      barG.fillRect(-barW / 2, by, barW, 6);
      const fillColor = status === 'completed' ? 0x4ab84a : (progressPct >= 0.5 ? 0xfcd95c : 0x8a4a1a);
      const fillW = Math.max(2, Math.round(barW * progressPct));
      barG.fillStyle(fillColor, 1);
      barG.fillRect(-barW / 2 + 1, by + 1, fillW - 2, 4);
      barG.lineStyle(1, 0x555555, 0.8);
      barG.strokeRect(-barW / 2, by, barW, 6);
      const barContainer = this.add.container(width / 2, 0);
      barContainer.add(barG);
      this.listContainer.add(barContainer);
      by += 20;

      count++;
    }

    if (count === 0) {
      const emptyTxt = this.add.text(0, 20, this.filterMode === 'all'
        ? 'Noch keine Quests aktiv. Sprich mit NPCs.'
        : `Keine ${this.filterMode === 'active' ? 'aktiven' : 'abgeschlossenen'} Quests.`,
        { fontFamily: FONT_FAMILY, fontSize: '12px', color: '#8a6e4a' }
      ).setOrigin(0.5);
      const containerX = this.add.container(width / 2, 0);
      containerX.add(emptyTxt);
      this.listContainer.add(containerX);
      by += 40;
    }

    this.listContainer.setY(96);
    this.maxScrollY = Math.max(0, by - (this.scale.height - 130));
  }
}
