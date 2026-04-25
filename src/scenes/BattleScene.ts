import Phaser from 'phaser';
import { gameStore } from '../state/gameState';
import { sfx } from '../audio/sfxGenerator';
import {
  type BattleSide,
  makeBattleSide,
  runMoveRound,
  clampLevelToRegion,
  pickWildMove,
  effectivenessLabel,
  statusName
} from '../systems/BattleEngine';
import { pickEncounter, randomLevel, WURZELHEIM_TALLGRASS, VERDANTO_TALLGRASS, VERDANTO_BROMELIEN, KAKTORIA_TALLGRASS, FROSTKAMM_TALLGRASS, SALZBUCHT_TALLGRASS, type EncounterDef } from '../data/encounters';
import { getSpecies } from '../data/species';
import { getMove, defaultMovesForFamily, type MoveDef } from '../data/moves';

interface BattleSceneInitData {
  poolKey?: string;
}

function poolFromKey(key?: string): EncounterDef[] {
  if (key === 'verdanto-tallgrass') return VERDANTO_TALLGRASS;
  if (key === 'verdanto-bromelien') return VERDANTO_BROMELIEN;
  if (key === 'kaktoria-tallgrass') return KAKTORIA_TALLGRASS;
  if (key === 'frostkamm-tallgrass') return FROSTKAMM_TALLGRASS;
  if (key === 'salzbucht-tallgrass') return SALZBUCHT_TALLGRASS;
  return WURZELHEIM_TALLGRASS;
}

export class BattleScene extends Phaser.Scene {
  private player!: BattleSide;
  private wild!: BattleSide;
  private playerHpBar!: Phaser.GameObjects.Rectangle;
  private wildHpBar!: Phaser.GameObjects.Rectangle;
  private playerHpText!: Phaser.GameObjects.Text;
  private wildHpText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private statusTextWild!: Phaser.GameObjects.Text;
  private statusTextPlayer!: Phaser.GameObjects.Text;
  private over = false;
  private playerSprite!: Phaser.GameObjects.Sprite;
  private wildSprite!: Phaser.GameObjects.Sprite;
  private moveButtons: Phaser.GameObjects.Container[] = [];
  private waitingForInput = false;
  private xpReward = 0;
  private capturedEnc?: { slug: string; rarity: number; level: number };
  private poolKey: string = 'wurzelheim-tallgrass';
  private uiCam!: Phaser.Cameras.Scene2D.Camera;

  constructor() {
    super('BattleScene');
  }

  init(data: BattleSceneInitData = {}) {
    this.over = false;
    this.poolKey = data.poolKey ?? 'wurzelheim-tallgrass';
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#1f3327');
    this.uiCam = this.cameras.add(0, 0, width, height);
    this.uiCam.setZoom(1);

    // Setup Player-Plant
    const state = gameStore.get();
    const playerPlant = state.plants[0];
    if (!playerPlant) {
      this.endBattle('Keine Pflanze im Garten zum Kaempfen.');
      return;
    }
    const speciesP = getSpecies(playerPlant.speciesSlug);
    this.player = makeBattleSide({
      name: speciesP?.commonName ?? playerPlant.speciesSlug,
      family: 'Asteraceae',
      level: playerPlant.level,
      isPlayer: true,
      spriteColor: 0x9be36e,
      atkBias: playerPlant.stats.atk - 50,
      defBias: playerPlant.stats.def - 50,
      spdBias: playerPlant.stats.spd - 50
    });

    // Wild-Plant aus Encounter-Pool
    const pool = poolFromKey(this.poolKey);
    const enc = pickEncounter(pool);
    gameStore.discoverSpecies(enc.slug);
    const zone = gameStore.getOverworldPos().zone;
    const wildLevel = clampLevelToRegion(randomLevel(enc), zone);
    this.wild = makeBattleSide({
      name: enc.commonName,
      family: enc.family,
      level: wildLevel,
      isPlayer: false,
      spriteColor: enc.baseColor,
      moveSlugs: defaultMovesForFamily(enc.family)
    });
    this.xpReward = 10 + 5 * wildLevel;
    this.capturedEnc = { slug: enc.slug, rarity: 2, level: wildLevel };

    // Battle-Background-Bereich (heller fuer Gegner, dunkler fuer Spieler)
    const bgTop = this.add.rectangle(width / 2, height / 4, width, height / 2, 0x4a8228, 0.4).setOrigin(0.5);
    const bgBot = this.add.rectangle(width / 2, height * 3 / 4, width, height / 2, 0x2d4a1f, 0.5).setOrigin(0.5);
    void bgTop; void bgBot;

    // Wild oben
    this.add.text(width / 2, 24, `${this.wild.name} (Lv${this.wild.level})`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff'
    }).setOrigin(0.5);
    this.add.text(width / 2, 42, this.wild.family, {
      fontFamily: 'monospace', fontSize: '10px', color: '#9be36e'
    }).setOrigin(0.5);
    this.wildSprite = this.add.sprite(width / 2, 110, 'tile_tropical');
    this.wildSprite.setDisplaySize(72, 72);
    this.wildHpBar = this.add.rectangle(width / 2, 162, 200, 10, 0x6abf3a)
      .setStrokeStyle(1, 0x111111);
    this.wildHpText = this.add.text(width / 2, 180, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ffffff'
    }).setOrigin(0.5);
    this.statusTextWild = this.add.text(width / 2, 196, '', {
      fontFamily: 'monospace', fontSize: '9px', color: '#fcd95c'
    }).setOrigin(0.5);

    // Player unten
    this.add.text(width / 2, height - 248, `${this.player.name} (Lv${this.player.level})`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#9be36e'
    }).setOrigin(0.5);
    this.add.text(width / 2, height - 230, this.player.family, {
      fontFamily: 'monospace', fontSize: '10px', color: '#82d44e'
    }).setOrigin(0.5);
    this.playerSprite = this.add.sprite(width / 2, height - 170, 'tile_flowerbed');
    this.playerSprite.setDisplaySize(80, 80);
    this.playerHpBar = this.add.rectangle(width / 2, height - 118, 200, 10, 0x6abf3a)
      .setStrokeStyle(1, 0x111111);
    this.playerHpText = this.add.text(width / 2, height - 100, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ffffff'
    }).setOrigin(0.5);
    this.statusTextPlayer = this.add.text(width / 2, height - 84, '', {
      fontFamily: 'monospace', fontSize: '9px', color: '#fcd95c'
    }).setOrigin(0.5);

    // Status / Round-Log
    this.statusText = this.add.text(width / 2, height / 2 - 8, 'Was soll deine Pflanze tun?', {
      fontFamily: 'monospace', fontSize: '11px', color: '#fcd95c',
      align: 'center', wordWrap: { width: width - 40 }
    }).setOrigin(0.5);

    // Move-Buttons
    this.buildMoveButtons();
    // Run + Capture buttons (small row)
    this.makeSmallButton(width / 4, 32, 'Fluechten', '#fcd95c', () => this.tryRun());
    this.makeSmallButton((width / 4) * 3, 32, 'Fangen', '#ff7eb8', () => this.tryCapture());

    this.updateBars();
    sfx.dialogOpen();
    this.waitingForInput = true;

    // Camera-Routing fuer UI: keine zoom Probleme da Battle-Cam zoom 1 ist
    void this.uiCam;

    (window as any).__battle = this;
  }

  private buildMoveButtons(): void {
    const { width, height } = this.scale;
    const moves = this.player.moveSlugs.map(getMove).filter(Boolean) as MoveDef[];
    const slotW = (width - 40) / 2;
    const slotH = 36;
    for (let i = 0; i < 4; i++) {
      const m = moves[i];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 20 + col * slotW + slotW / 2;
      const y = height - 50 + row * (slotH + 4);

      const c = this.add.container(x, y);
      const bg = this.add.rectangle(0, 0, slotW - 4, slotH, 0x000000, 0.85)
        .setStrokeStyle(2, m ? 0x9be36e : 0x444444)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: !!m });
      const nameTxt = this.add.text(-slotW / 2 + 8, -10, m ? m.name : '-', {
        fontFamily: 'monospace', fontSize: '11px', color: m ? '#ffffff' : '#666666'
      });
      const detailTxt = this.add.text(-slotW / 2 + 8, 4, m ? `${m.power > 0 ? `Power ${m.power}` : 'Status'} | ${Math.round(m.accuracy * 100)}%` : '', {
        fontFamily: 'monospace', fontSize: '9px', color: '#9be36e'
      });
      if (m) {
        bg.on('pointerdown', () => {
          bg.setFillStyle(0x9be36e, 0.3);
        });
        bg.on('pointerup', () => {
          bg.setFillStyle(0x000000, 0.85);
          this.onMoveSelected(m);
        });
        bg.on('pointerout', () => {
          bg.setFillStyle(0x000000, 0.85);
        });
      }
      c.add([bg, nameTxt, detailTxt]);
      this.moveButtons.push(c);
    }
  }

  private makeSmallButton(x: number, y: number, label: string, color: string, onClick: () => void): void {
    const c = this.add.container(x, y);
    const w = 88;
    const h = 22;
    const bg = this.add.rectangle(0, 0, w, h, 0x000000, 0.85)
      .setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(color).color)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    const txt = this.add.text(0, 0, label, {
      fontFamily: 'monospace', fontSize: '10px', color
    }).setOrigin(0.5);
    bg.on('pointerup', () => {
      bg.setFillStyle(0x000000, 0.85);
      onClick();
    });
    bg.on('pointerdown', () => bg.setFillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.3));
    bg.on('pointerout', () => bg.setFillStyle(0x000000, 0.85));
    c.add([bg, txt]);
  }

  private onMoveSelected(playerMove: MoveDef): void {
    if (!this.waitingForInput || this.over) return;
    this.waitingForInput = false;
    const wildMoveSlug = pickWildMove(this.wild);
    const outcome = runMoveRound(this.player, this.wild, playerMove.slug, wildMoveSlug);

    let log = '';
    for (const r of outcome.results) log += r.log + '\n';
    for (const tl of outcome.tickLogs) log += tl + '\n';

    this.statusText.setText(log.trim());
    this.updateBars();
    this.shakeSprites();
    sfx.bump();

    // Damage-Floater
    for (const r of outcome.results) {
      if (r.dmg > 0) {
        const target = (r.defender === this.player) ? this.playerSprite : this.wildSprite;
        this.spawnDamageFloater(target, r.dmg, r.crit, effectivenessLabel(r.effectiveness));
      }
      if (r.selfHeal && r.selfHeal > 0) {
        const target = (r.attacker === this.player) ? this.playerSprite : this.wildSprite;
        this.spawnHealFloater(target, r.selfHeal);
      }
    }

    if (outcome.battleOver) {
      this.over = true;
      this.time.delayedCall(2000, () => {
        if (outcome.winner === this.player) this.endBattle(`Sieg! +${this.xpReward} XP`);
        else this.endBattle('Deine Pflanze ist erschoepft.');
      });
    } else {
      this.time.delayedCall(1500, () => {
        this.statusText.setText('Was soll deine Pflanze tun?');
        this.waitingForInput = true;
      });
    }
  }

  update(_time: number, _delta: number): void {
    // status-Anzeige live updaten
    this.statusTextWild.setText(this.formatStatuses(this.wild));
    this.statusTextPlayer.setText(this.formatStatuses(this.player));
  }

  private formatStatuses(side: BattleSide): string {
    if (side.statuses.length === 0) return '';
    return side.statuses.map((s) => `[${statusName(s.effect)}]`).join(' ');
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
    this.tweens.add({ targets: this.playerSprite, x: '+=6', duration: 60, yoyo: true, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: this.wildSprite, x: '-=6', duration: 60, yoyo: true, ease: 'Sine.easeInOut' });
    this.cameras.main.flash(80, 100, 100, 100);
  }

  private spawnDamageFloater(target: Phaser.GameObjects.Sprite, dmg: number, crit: boolean, effLabel: string): void {
    const color = crit ? '#ff5c5c' : '#ffffff';
    const text = this.add.text(target.x, target.y - 20, `-${dmg}${crit ? '!' : ''}`, {
      fontFamily: 'monospace', fontSize: crit ? '20px' : '15px', color,
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(1500);
    this.tweens.add({ targets: text, y: target.y - 60, alpha: 0, duration: 1100, ease: 'Quad.easeOut', onComplete: () => text.destroy() });
    if (effLabel) {
      const eff = this.add.text(target.x, target.y, effLabel, {
        fontFamily: 'monospace', fontSize: '10px', color: '#fcd95c', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(1499);
      this.tweens.add({ targets: eff, y: target.y - 40, alpha: 0, duration: 1500, onComplete: () => eff.destroy() });
    }
  }

  private spawnHealFloater(target: Phaser.GameObjects.Sprite, amt: number): void {
    const text = this.add.text(target.x, target.y - 20, `+${amt}`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#9be36e',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(1500);
    this.tweens.add({ targets: text, y: target.y - 50, alpha: 0, duration: 1000, onComplete: () => text.destroy() });
  }

  private tryCapture(): void {
    if (this.over || !this.waitingForInput) return;
    const wildPct = this.wild.stats.hp / this.wild.stats.maxHp;
    if (wildPct > 0.4) {
      this.statusText.setText('Wilde Pflanze ist zu stark zum Fangen.\nReduziere ihre HP unter 40%.');
      sfx.bump();
      return;
    }
    if (!gameStore.hasItem('basic-lure')) {
      this.statusText.setText('Du hast keine Lockstoffe!');
      sfx.bump();
      return;
    }
    gameStore.consumeItem('basic-lure');
    const baseRate = 0.5 * (1 - wildPct) * 1.5;
    const success = Math.random() < baseRate;
    if (success && this.capturedEnc) {
      gameStore.capturePlant(this.capturedEnc.slug, this.capturedEnc.level, 0, 0, 0);
      this.statusText.setText(`${this.wild.name} wurde gefangen!`);
      sfx.pickup();
      this.over = true;
      this.time.delayedCall(1500, () => this.endBattle('Gefangen!'));
    } else {
      this.statusText.setText('Fang-Versuch misslungen.');
      sfx.bump();
      this.waitingForInput = false;
      const wildMoveSlug = pickWildMove(this.wild);
      const wildMove = getMove(wildMoveSlug);
      if (wildMove) {
        const r = runMoveRound(this.player, this.wild, 'tackle', wildMoveSlug);  // dummy player move
        // actually nur wild attacks - hier vereinfacht
        void r;
      }
      this.time.delayedCall(1200, () => {
        this.statusText.setText('Was soll deine Pflanze tun?');
        this.waitingForInput = true;
        this.updateBars();
      });
    }
  }

  private tryRun(): void {
    if (this.over) return;
    if (this.player.statuses.some((s) => s.effect === 'rooted')) {
      this.statusText.setText('Du bist von Wurzeln gefangen und kannst nicht fliehen.');
      sfx.bump();
      return;
    }
    const success = Math.random() < 0.7;
    if (success) {
      this.statusText.setText('Du fliehst aus dem Kampf.');
      sfx.dialogAdvance();
      this.over = true;
      this.time.delayedCall(800, () => this.endBattle('Geflohen.'));
    } else {
      this.statusText.setText('Flucht misslungen!');
      sfx.bump();
    }
  }

  private endBattle(msg: string): void {
    console.log('[BattleScene] end', msg);
    sfx.door();
    this.scene.start('OverworldScene');
  }
}
