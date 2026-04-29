import Phaser from 'phaser';
import { gameStore } from '../state/gameState';
import { QUESTS } from '../data/quests';
import { COLOR_REWARD, COLOR_SUCCESS, FONT_FAMILY, FONT_SIZE_SMALL, MODAL_BORDER_COLOR } from '../ui/uiTheme';
import { t } from '../i18n/index';

/**
 * Quest-Log: zeigt aktive und abgeschlossene Quests.
 *
 * B6-R6: Filter (Aktiv/Abgeschlossen), Quest-Complete-Animation, Reward-Reveal
 * Aufgerufen via Q-Hotkey aus OverworldScene.
 */

type QuestFilter = 'all' | 'active' | 'completed';

export class QuestLogScene extends Phaser.Scene {
  private _filter: QuestFilter = 'all';
  private _listContainer?: Phaser.GameObjects.Container;
  private _filterBtns: Phaser.GameObjects.Rectangle[] = [];
  private _filterTxts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super('QuestLogScene');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#1a2820');

    this.add.text(width / 2, 24, t('qls.title'), {
      fontFamily: FONT_FAMILY, fontSize: '20px', color: COLOR_SUCCESS
    }).setOrigin(0.5);

    // B6-R6: Filter-Tabs
    this._buildFilterTabs(width);

    // Quest-Liste
    this._listContainer = this.add.container(0, 0);
    this._renderList(width, height);

    // Back
    const backY = height - 30;
    const bg = this.add.rectangle(width / 2, backY, 160, 32, 0x000000, 0.7)
      .setStrokeStyle(1, MODAL_BORDER_COLOR)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, backY, t('qls.back'), {
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
  }

  private _buildFilterTabs(width: number): void {
    const filters: { key: QuestFilter; label: string }[] = [
      { key: 'all',       label: t('qls.filterAll') },
      { key: 'active',    label: t('qls.filterActive') },
      { key: 'completed', label: t('qls.filterCompleted') },
    ];
    const tabW = 110;
    const tabH = 24;
    const startX = width / 2 - ((filters.length - 1) * (tabW + 8)) / 2;

    filters.forEach(({ key, label }, i) => {
      const x = startX + i * (tabW + 8);
      const isActive = this._filter === key;
      const bg = this.add.rectangle(x, 56, tabW, tabH,
        isActive ? 0x3a6e2a : 0x1a2418, isActive ? 1 : 0.7)
        .setStrokeStyle(1, isActive ? 0x9be36e : 0x44603f)
        .setInteractive({ useHandCursor: true });
      const txt = this.add.text(x, 56, label, {
        fontFamily: FONT_FAMILY, fontSize: '10px', color: isActive ? '#ffffff' : '#aaaaaa'
      }).setOrigin(0.5);
      bg.on('pointerup', () => {
        this._filter = key;
        this._refreshFilterUI();
        this._refreshList(this.scale.width, this.scale.height);
      });
      this._filterBtns.push(bg);
      this._filterTxts.push(txt);
    });
  }

  private _refreshFilterUI(): void {
    const filters: QuestFilter[] = ['all', 'active', 'completed'];
    this._filterBtns.forEach((bg, i) => {
      const isActive = this._filter === filters[i];
      bg.setFillStyle(isActive ? 0x3a6e2a : 0x1a2418, isActive ? 1 : 0.7);
      bg.setStrokeStyle(1, isActive ? 0x9be36e : 0x44603f);
      this._filterTxts[i].setColor(isActive ? '#ffffff' : '#aaaaaa');
    });
  }

  private _refreshList(width: number, height: number): void {
    this._listContainer?.destroy();
    this._listContainer = this.add.container(0, 0);
    this._renderList(width, height);
  }

  private _renderList(width: number, height: number): void {
    if (!this._listContainer) return;
    const inv = gameStore.getInventory();

    const filteredQuests = QUESTS.filter((q) => {
      const status = gameStore.getQuestState(q.id);
      if (status === 'pending') return false;
      if (this._filter === 'active') return status === 'active';
      if (this._filter === 'completed') return status === 'completed';
      return true; // 'all'
    });

    let by = 78;
    let count = 0;

    for (const q of filteredQuests) {
      const status = gameStore.getQuestState(q.id);
      const color = status === 'completed' ? COLOR_SUCCESS : COLOR_REWARD;
      const statusLabel = status === 'completed' ? '✓' : '●';

      // B6-R6: Quest-Complete-Animation — Checkmark + Fanfare bei completed
      const questText = this.add.text(width / 2, by, `${statusLabel} ${q.title}`, {
        fontFamily: FONT_FAMILY, fontSize: '13px', color
      }).setOrigin(0.5);
      this._listContainer!.add(questText);

      if (status === 'completed') {
        // Pulse-Animation
        this.tweens.add({
          targets: questText, alpha: { from: 1, to: 0.6 }, duration: 1100,
          ease: 'Sine.InOut', yoyo: true, repeat: -1, delay: Math.random() * 500
        });
        // Fanfare-Konfetti (3 kleine Partikel)
        this._spawnCompletionParticles(width / 2 - 90, by);
      }
      by += 18;

      const descText = this.add.text(width / 2, by, q.description, {
        fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_SMALL, color: '#ffffff',
        wordWrap: { width: width - 40 }, align: 'center'
      }).setOrigin(0.5);
      this._listContainer!.add(descText);
      by += 22;

      // Progress
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

      const progText = this.add.text(width / 2, by, progressText, {
        fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_SMALL, color: '#8a6e4a'
      }).setOrigin(0.5);
      this._listContainer!.add(progText);
      by += 14;

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
      this._listContainer!.add(barG);
      by += 18;

      // B6-R6: Reward-Reveal bei abgeschlossenen Quests
      if (status === 'completed' && q.reward) {
        const rewardParts: string[] = [];
        if (q.reward.coins) rewardParts.push(`${q.reward.coins} Münzen`);
        if (q.reward.items) {
          Object.entries(q.reward.items).forEach(([slug, cnt]) => {
            rewardParts.push(`${slug} x${cnt}`);
          });
        }
        const rewardStr = rewardParts.join(', ');
        const rewardTxt = this.add.text(width / 2, by,
          `Belohnung: ${rewardStr}`, {
            fontFamily: FONT_FAMILY, fontSize: '9px', color: '#fcd95c'
          }).setOrigin(0.5);
        this._listContainer!.add(rewardTxt);
        by += 14;
      }

      count++;
      by += 4; // Extra-Abstand
    }

    if (count === 0) {
      const emptyTxt = this.add.text(width / 2, height / 2,
        this._filter === 'completed'
          ? 'Noch keine abgeschlossenen Quests.'
          : this._filter === 'active'
            ? 'Keine aktiven Quests. Sprich mit NPCs.'
            : 'Noch keine Quests aktiv. Sprich mit NPCs.', {
          fontFamily: FONT_FAMILY, fontSize: '12px', color: '#8a6e4a'
        }).setOrigin(0.5);
      this._listContainer!.add(emptyTxt);
    }
  }

  /** Kleine Fanfare-Partikel bei abgeschlossener Quest. */
  private _spawnCompletionParticles(x: number, y: number): void {
    const colors = [0xffd700, 0x9be36e, 0xff8c42];
    colors.forEach((color, i) => {
      const dot = this.add.graphics();
      dot.fillStyle(color, 1);
      dot.fillCircle(x + i * 8, y, 3);
      this._listContainer!.add(dot);
      this.tweens.add({
        targets: dot,
        y: y - 12 - i * 4,
        alpha: 0,
        duration: 800 + i * 150,
        ease: 'Cubic.Out',
        onComplete: () => dot.destroy()
      });
    });
  }
}
