import Phaser from 'phaser';
import { gameStore } from '../state/gameState';
import { sfx } from '../audio/sfxGenerator';
import {
  type BattleSide,
  makeStatsForLevel,
  runRound,
  effectivenessLabel
} from '../systems/BattleEngine';
import { pickEncounter, randomLevel, WURZELHEIM_TALLGRASS } from '../data/encounters';
import { getSpecies } from '../data/species';

interface BattleSceneInitData {
  pool?: 'wurzelheim-tallgrass';
}

export class BattleScene extends Phaser.Scene {
  private player!: BattleSide;
  private wild!: BattleSide;
  private playerHpBar!: Phaser.GameObjects.Rectangle;
  private wildHpBar!: Phaser.GameObjects.Rectangle;
  private playerHpText!: Phaser.GameObjects.Text;
  private wildHpText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private autoBattle = false;
  private over = false;
  private playerSprite!: Phaser.GameObjects.Rectangle;
  private wildSprite!: Phaser.GameObjects.Rectangle;
  private actionButtons: Phaser.GameObjects.Container[] = [];
  private nextRoundDelay = 1000;
  private lastRoundAt = 0;
  private xpReward = 0;

  constructor() {
    super('BattleScene');
  }

  init(_data: BattleSceneInitData = {}) {
    this.over = false;
    this.autoBattle = false;
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#2d3a2a');

    // Setup Player-Plant aus gameStore (erste Plant)
    const state = gameStore.get();
    const playerPlant = state.plants[0];
    if (!playerPlant) {
      // Sollte nicht passieren weil Starter-Plant immer da ist
      this.endBattle('Keine Pflanze im Garten zum Kaempfen.');
      return;
    }
    const speciesP = getSpecies(playerPlant.speciesSlug);
    const playerLevel = playerPlant.level;
    this.player = {
      name: speciesP?.commonName ?? playerPlant.speciesSlug,
      family: 'Asteraceae',
      stats: makeStatsForLevel(playerLevel, playerPlant.stats.atk - 50, playerPlant.stats.def - 50, playerPlant.stats.spd - 50),
      level: playerLevel,
      isPlayer: true,
      spriteColor: 0x9be36e
    };

    // Wild-Plant aus Encounter-Pool ziehen
    const enc = pickEncounter(WURZELHEIM_TALLGRASS);
    const wildLevel = randomLevel(enc);
    this.wild = {
      name: enc.commonName,
      family: enc.family,
      stats: makeStatsForLevel(wildLevel),
      level: wildLevel,
      isPlayer: false,
      spriteColor: enc.baseColor
    };
    this.xpReward = 10 + 5 * wildLevel;

    // UI
    // Wild oben
    this.add.text(width / 2, 30, `${this.wild.name} L${this.wild.level}`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff'
    }).setOrigin(0.5);
    this.add.text(width / 2, 50, this.wild.family, {
      fontFamily: 'monospace', fontSize: '10px', color: '#9be36e'
    }).setOrigin(0.5);
    this.wildSprite = this.add.rectangle(width / 2, 130, 64, 64, this.wild.spriteColor)
      .setStrokeStyle(2, 0x000000);
    this.wildHpBar = this.add.rectangle(width / 2, 180, 200, 12, 0x6abf3a)
      .setStrokeStyle(1, 0x111111);
    this.wildHpText = this.add.text(width / 2, 200, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#ffffff'
    }).setOrigin(0.5);

    // Player unten
    this.add.text(width / 2, height - 200, `${this.player.name} L${this.player.level}`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#9be36e'
    }).setOrigin(0.5);
    this.playerSprite = this.add.rectangle(width / 2, height - 130, 64, 64, this.player.spriteColor)
      .setStrokeStyle(2, 0x000000);
    this.playerHpBar = this.add.rectangle(width / 2, height - 80, 200, 12, 0x6abf3a)
      .setStrokeStyle(1, 0x111111);
    this.playerHpText = this.add.text(width / 2, height - 60, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#ffffff'
    }).setOrigin(0.5);

    // Status / Round-Log
    this.statusText = this.add.text(width / 2, height / 2 - 10, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#ffd13a',
      align: 'center'
    }).setOrigin(0.5);

    // Action-Buttons unten
    this.makeButton(width / 4, height - 24, 'Angreifen', '#ff7e7e', () => this.runOneRound());
    this.makeButton(width / 2, height - 24, 'Auto', '#9be36e', () => {
      this.autoBattle = !this.autoBattle;
    });
    this.makeButton((width / 4) * 3, height - 24, 'Fluechten', '#fcd95c', () => this.tryRun());

    this.updateBars();
    this.statusText.setText('Wilde Pflanze erscheint!');
    sfx.dialogOpen();
    (window as any).__battle = this;
  }

  update(time: number, _delta: number): void {
    if (this.over) return;
    if (this.autoBattle && time - this.lastRoundAt > this.nextRoundDelay) {
      this.runOneRound();
    }
  }

  private runOneRound(): void {
    if (this.over) return;
    const r = runRound(this.player, this.wild);
    this.lastRoundAt = this.time.now;
    let log = '';
    log += `${r.attackerFirst.name} greift an: -${r.dmgFirst} HP`;
    const ef1 = effectivenessLabel(r.effectivenessFirst);
    if (ef1) log += `  ${ef1}`;
    if (r.critFirst) log += '  KRIT!';
    if (r.dmgSecond > 0) {
      log += `\n${r.defenderFirst.name} kontert: -${r.dmgSecond} HP`;
      const ef2 = effectivenessLabel(r.effectivenessSecond);
      if (ef2) log += `  ${ef2}`;
      if (r.critSecond) log += '  KRIT!';
    }
    this.statusText.setText(log);
    this.updateBars();
    this.shakeSprites();
    sfx.bump();

    if (r.battleOver) {
      this.over = true;
      this.time.delayedCall(1500, () => {
        if (r.winner === this.player) this.endBattle(`Sieg! +${this.xpReward} XP`);
        else this.endBattle('Deine Pflanze ist erschoepft.');
      });
    }
  }

  private updateBars(): void {
    const w = 200;
    const playerPct = this.player.stats.hp / this.player.stats.maxHp;
    const wildPct = this.wild.stats.hp / this.wild.stats.maxHp;
    this.playerHpBar.width = Math.max(0, w * playerPct);
    this.wildHpBar.width = Math.max(0, w * wildPct);
    this.playerHpBar.fillColor = playerPct > 0.5 ? 0x6abf3a : (playerPct > 0.2 ? 0xfcd95c : 0xc94a4a);
    this.wildHpBar.fillColor = wildPct > 0.5 ? 0x6abf3a : (wildPct > 0.2 ? 0xfcd95c : 0xc94a4a);
    this.playerHpText.setText(`HP ${this.player.stats.hp} / ${this.player.stats.maxHp}`);
    this.wildHpText.setText(`HP ${this.wild.stats.hp} / ${this.wild.stats.maxHp}`);
  }

  private shakeSprites(): void {
    this.tweens.add({ targets: this.playerSprite, x: this.playerSprite.x + 6, duration: 50, yoyo: true });
    this.tweens.add({ targets: this.wildSprite, x: this.wildSprite.x - 6, duration: 50, yoyo: true });
  }

  private tryRun(): void {
    if (this.over) return;
    const success = Math.random() < 0.7;
    if (success) {
      this.statusText.setText('Du fliehst aus dem Kampf.');
      sfx.dialogAdvance();
      this.over = true;
      this.time.delayedCall(800, () => this.endBattle('Geflohen.'));
    } else {
      this.statusText.setText('Flucht misslungen!');
      sfx.bump();
      this.runOneRound();
    }
  }

  private endBattle(msg: string): void {
    console.log('[BattleScene] end', msg);
    sfx.door();
    this.scene.start('OverworldScene');
  }

  private makeButton(x: number, y: number, label: string, color: string, onClick: () => void): void {
    const c = this.add.container(x, y);
    const w = 110;
    const h = 30;
    const bg = this.add.rectangle(0, 0, w, h, 0x000000, 0.7)
      .setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(color).color)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    const txt = this.add.text(0, 0, label, {
      fontFamily: 'monospace', fontSize: '11px', color
    }).setOrigin(0.5);
    bg.on('pointerdown', () => bg.setFillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.4));
    bg.on('pointerup', () => { bg.setFillStyle(0x000000, 0.7); onClick(); });
    bg.on('pointerout', () => bg.setFillStyle(0x000000, 0.7));
    c.add([bg, txt]);
    this.actionButtons.push(c);
  }
}
