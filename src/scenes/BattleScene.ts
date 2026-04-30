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
import { getBoss, type BossDef } from '../data/bosses';
import { debugLog } from '../utils/debugLog';
import { t } from '../i18n/index';

interface BattleSceneInitData {
  poolKey?: string;
  bossId?: string;
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
  private playerHpGhost!: Phaser.GameObjects.Rectangle;
  private wildHpGhost!: Phaser.GameObjects.Rectangle;
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
  private bossId?: string;
  private bossDef?: BossDef;


  constructor() {
    super('BattleScene');
  }

  preload(): void {
    if (!this.textures.exists('tile_tropical')) this.load.image('tile_tropical', 'assets/generated/tile_tropical.png');
    if (!this.textures.exists('tile_flowerbed')) this.load.image('tile_flowerbed', 'assets/generated/tile_flowerbed.png');
    if (!this.textures.exists('tile_grass')) this.load.image('tile_grass', 'assets/generated/tile_grass.png');
    if (!this.textures.exists('tile_bromeliad')) this.load.image('tile_bromeliad', 'assets/generated/tile_bromeliad.png');
    if (!this.textures.exists('tile_cactus')) this.load.image('tile_cactus', 'assets/generated/tile_cactus.png');
  }

  init(data: BattleSceneInitData = {}) {
    this.over = false;
    this.poolKey = data.poolKey ?? 'wurzelheim-tallgrass';
    this.bossId = data.bossId;
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#1f3327');
    const uiCam = this.cameras.add(0, 0, width, height);
    uiCam.setZoom(1);

    // Setup Player-Plant
    const state = gameStore.get();
    const playerPlant = state.plants[0];
    if (!playerPlant) {
      this.endBattle(t('battle.noPlant'));
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

    if (this.bossId) {
      // Boss-Mode
      const boss = getBoss(this.bossId);
      if (boss) {
        this.bossDef = boss;
        this.wild = makeBattleSide({
          name: boss.name,
          family: boss.family,
          level: boss.level,
          isPlayer: false,
          spriteColor: boss.spriteColor,
          spriteKey: boss.spriteKey,
          moveSlugs: boss.moveSlugs,
          atkBias: boss.atkBias,
          defBias: boss.defBias,
          spdBias: boss.spdBias
        });
        // HP multiplier
        this.wild.stats.maxHp = Math.floor(this.wild.stats.maxHp * boss.hpMultiplier);
        this.wild.stats.hp = this.wild.stats.maxHp;
        this.xpReward = boss.rewardCoins / 4;
        this.capturedEnc = undefined;     // Boss kann nicht gefangen werden
      }
    } else {
      // Wild-Encounter
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
    }

    // Battle-Background: Biom-spezifische Textur + Tint (R12: QA-Critic-Audit)
    const bgTileKey = this.getBgTileKey();
    const biomTints = this.getBiomTints();
    if (this.textures.exists(bgTileKey)) {
      this.add.tileSprite(0, 0, width, height / 2, bgTileKey)
        .setOrigin(0, 0).setAlpha(0.72).setTint(biomTints.top);
      this.add.tileSprite(0, height / 2, width, height / 2, bgTileKey)
        .setOrigin(0, 0).setAlpha(0.55).setTint(biomTints.bot);
    } else {
      this.add.rectangle(width / 2, height / 4, width, height / 2, biomTints.top, 0.4).setOrigin(0.5);
      this.add.rectangle(width / 2, height * 3 / 4, width, height / 2, biomTints.bot, 0.5).setOrigin(0.5);
    }
    // Trennlinie Gegner/Spieler-Zone
    this.add.rectangle(width / 2, height / 2, width, 3, 0x1a2a10, 0.9).setOrigin(0.5);

    // Wild oben
    this.add.text(width / 2, 24, `${this.wild.name} (Lv${this.wild.level})`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff'
    }).setOrigin(0.5);
    this.add.text(width / 2, 42, this.wild.family, {
      fontFamily: 'monospace', fontSize: '12px', color: '#9be36e'
    }).setOrigin(0.5);
    const wildSpriteKey = this.bossDef?.spriteKey ?? this.pickWildSpriteKey(this.capturedEnc?.slug ?? 'common-daisy');
    // R12: Pokemon-Style Positioning — Wild oben links (96px), zeigt nach rechts
    this.wildSprite = this.add.sprite(width * 0.3, 110, wildSpriteKey);
    this.wildSprite.setDisplaySize(96, 96);
    this.wildSprite.setFlipX(true);
    this.wildHpGhost = this.add.rectangle(width / 2, 162, 200, 10, 0xbb4444, 0.5).setDepth(60);
    this.wildHpBar = this.add.rectangle(width / 2, 162, 200, 10, 0x6abf3a)
      .setStrokeStyle(1, 0x111111);
    this.wildHpText = this.add.text(width / 2, 180, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#ffffff'
    }).setOrigin(0.5);
    this.statusTextWild = this.add.text(width / 2, 196, '', {
      fontFamily: 'monospace', fontSize: '9px', color: '#fcd95c'
    }).setOrigin(0.5);

    // Player unten
    this.add.text(width / 2, height - 248, `${this.player.name} (Lv${this.player.level})`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#9be36e'
    }).setOrigin(0.5);
    this.add.text(width / 2, height - 230, this.player.family, {
      fontFamily: 'monospace', fontSize: '12px', color: '#82d44e'
    }).setOrigin(0.5);
    // R12: Player-Sprite unten rechts (80px)
    this.playerSprite = this.add.sprite(width * 0.7, height - 170, 'tile_flowerbed');
    this.playerSprite.setDisplaySize(80, 80);
    // D-041 Run10: Battle Intro Slide-in
    const slideOriginWild = this.wildSprite.x;
    const slideOriginPlayer = this.playerSprite.x;
    this.wildSprite.setX(width + 60);
    this.playerSprite.setX(-60);
    this.tweens.add({
      targets: this.wildSprite, x: slideOriginWild,
      duration: 420, ease: 'Back.Out', delay: 80
    });
    this.tweens.add({
      targets: this.playerSprite, x: slideOriginPlayer,
      duration: 420, ease: 'Back.Out', delay: 160
    });
    // Flash wipe bei Battle-Start
    this.cameras.main.flash(280, 220, 255, 220, false);
    this.playerHpGhost = this.add.rectangle(width / 2, height - 118, 200, 10, 0xbb4444, 0.5).setDepth(60);
    this.playerHpBar = this.add.rectangle(width / 2, height - 118, 200, 10, 0x6abf3a)
      .setStrokeStyle(1, 0x111111);
    this.playerHpText = this.add.text(width / 2, height - 100, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#ffffff'
    }).setOrigin(0.5);
    this.statusTextPlayer = this.add.text(width / 2, height - 84, '', {
      fontFamily: 'monospace', fontSize: '9px', color: '#fcd95c'
    }).setOrigin(0.5);

    // Status / Round-Log
    this.statusText = this.add.text(width / 2, height / 2 - 8, t('battle.action'), {
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
    if (this.bossDef) {
      this.statusText.setText(this.bossDef.introText.join('\n'));
      this.time.delayedCall(3500, () => {
        this.statusText.setText(t('battle.action'));
        this.waitingForInput = true;
      });
    } else {
      this.waitingForInput = true;
    }

    // Camera-Routing fuer UI: keine zoom Probleme da Battle-Cam zoom 1 ist

    (globalThis as { __battle?: BattleScene }).__battle = this;
  }

  private getBgTileKey(): string {
    // R12: Biom-spezifische Hintergrund-Textur (QA-Critic-Audit)
    const map: Record<string, string> = {
      'verdanto-tallgrass': 'tile_tropical',
      'verdanto-bromelien': 'tile_bromeliad',
      'kaktoria-tallgrass': 'tile_cactus',
      'frostkamm-tallgrass': 'tile_snow',
      'salzbucht-tallgrass': 'tile_beachsand',
      'wurzelheim-tallgrass': 'tile_grass',
      'mordwald-tallgrass': 'tile_swampfloor',
      'magmabluete-tallgrass': 'tile_ash',
      'glaciara-tallgrass': 'tile_iceground',
    };
    const key = map[this.poolKey] ?? 'tile_grass';
    return this.textures.exists(key) ? key : 'tile_grass';
  }

  /** Biom-spezifische Tint-Farben fuer Arena-Hintergrund (R12: QA-Critic-Audit) */
  private getBiomTints(): { top: number; bot: number } {
    const biom = this.poolKey.split('-')[0];
    const tints: Record<string, { top: number; bot: number }> = {
      kaktoria:     { top: 0xd4a855, bot: 0xa87820 },
      frostkamm:   { top: 0xaaccee, bot: 0x5588aa },
      salzbucht:   { top: 0x88aacc, bot: 0x446688 },
      verdanto:    { top: 0x44aa66, bot: 0x226644 },
      mordwald:    { top: 0x558844, bot: 0x334422 },
      magmabluete: { top: 0xcc5533, bot: 0x882211 },
      glaciara:    { top: 0x99bbdd, bot: 0x6699bb },
      wurzelheim:  { top: 0x6aaa44, bot: 0x2e5c1e },
    };
    return tints[biom] ?? { top: 0x6aaa44, bot: 0x2e5c1e };
  }

  private pickWildSpriteKey(slug: string): string {
    const map: Record<string, string> = {
      'bromeliad': 'tile_bromeliad',
      'air-plant': 'tile_bromeliad',
      'tropical-pitcher': 'tile_tropical',
      'heliconia': 'tile_tropical',
      'saguaro': 'tile_cactus',
      'barrel-cactus': 'tile_cactus',
      'common-daisy': 'tile_flowerbed',
      'dandelion': 'tile_flowerbed',
      'desert-rose': 'tile_desertflower'
    };
    const k = map[slug];
    return k && this.textures.exists(k) ? k : 'tile_flowerbed';
  }

  private setMoveButtonsEnabled(enabled: boolean): void {
    for (const btn of this.moveButtons) {
      if (enabled) btn.setInteractive();
      else btn.disableInteractive();
    }
  }

  private buildMoveButtons(): void {
    const { width, height } = this.scale;
    const moves = this.player.moveSlugs.map(getMove).filter(Boolean) as MoveDef[];
    const slotW = (width - 40) / 2;
    // S-POLISH Run18: Move-Buttons auf 44px Touch-Target-Mindesthoehe
    const slotH = 44;
    // D-041 R27: Family-Color-Map fuer Move-Buttons — jede Pflanzen-Familie hat eigene Akzentfarbe
    const FAMILY_COLORS: Record<string, number> = {
      root: 0xa0785a, leaf: 0x5ba85b, flower: 0xe87db0,
      cactus: 0xd4a843, vine: 0x7abf5f, fern: 0x4aad7a,
      aquatic: 0x5b8de8, fungi: 0xbf7ae8, desert: 0xe8b45b,
      alpine: 0xa0d4f4, tropical: 0xe8614a
    };
    for (let i = 0; i < 4; i++) {
      const m = moves[i];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 20 + col * slotW + slotW / 2;
      const y = height - 50 + row * (slotH + 4);
      const mColor = m ? (FAMILY_COLORS[m.family ?? ''] ?? 0x9be36e) : 0x444444;
      const mColorHex = '#' + mColor.toString(16).padStart(6, '0');

      const c = this.add.container(x, y);
      const bg = this.add.rectangle(0, 0, slotW - 4, slotH, 0x000000, 0.85)
        .setStrokeStyle(2, mColor)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: !!m });
      const nameTxt = this.add.text(-slotW / 2 + 8, -10, m ? m.name : '-', {
        fontFamily: 'monospace', fontSize: '11px', color: m ? '#ffffff' : '#666666'
      });
      const detailTxt = this.add.text(-slotW / 2 + 8, 4, m ? (m.power > 0 ? t('battle.detail', { power: m.power, accuracy: Math.round(m.accuracy * 100) }) : t('battle.status')) : '', {
        fontFamily: 'monospace', fontSize: '9px', color: mColorHex
      });
      if (m) {
        // R61: Hover Glow-Halo + Scale
        const moveGlow = this.add.rectangle(0, 0, slotW, slotH + 10, mColor, 0)
          .setOrigin(0.5);
        c.add(moveGlow);
        c.sendToBack(moveGlow);
        bg.on('pointerover', () => {
          this.tweens.killTweensOf(c);
          this.tweens.killTweensOf(moveGlow);
          this.tweens.add({ targets: c, scale: 1.05, duration: 110, ease: 'Back.Out' });
          this.tweens.add({ targets: moveGlow, alpha: 0.15, duration: 140, ease: 'Cubic.Out' });
          bg.setStrokeStyle(3, mColor);
          bg.setFillStyle(mColor, 0.1);
        });
        bg.on('pointerdown', () => {
          this.tweens.killTweensOf(c);
          this.tweens.add({ targets: c, scale: 0.96, duration: 60, ease: 'Cubic.Out' });
          bg.setFillStyle(mColor, 0.35);
        });
        bg.on('pointerup', () => {
          this.tweens.add({ targets: c, scale: 1.0, duration: 80, ease: 'Back.Out' });
          bg.setFillStyle(0x000000, 0.85);
          this.onMoveSelected(m);
        });
        bg.on('pointerout', () => {
          this.tweens.killTweensOf(c);
          this.tweens.killTweensOf(moveGlow);
          this.tweens.add({ targets: c, scale: 1.0, duration: 100, ease: 'Cubic.Out' });
          this.tweens.add({ targets: moveGlow, alpha: 0, duration: 160, ease: 'Cubic.Out' });
          bg.setStrokeStyle(2, mColor);
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
    // S-POLISH Run18: 44px Touch-Target Mindesthoehe (WCAG-mobil)
    const h = 44;
    const bg = this.add.rectangle(0, 0, w, h, 0x000000, 0.85)
      .setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(color).color)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    const txt = this.add.text(0, 0, label, {
      fontFamily: 'monospace', fontSize: '12px', color
    }).setOrigin(0.5);
    // S-POLISH-09b: Hover-State kleine Buttons (Fluechten/Fangen)
    bg.on('pointerover', () => {
      this.tweens.add({ targets: c, scale: 1.06, duration: 100, ease: 'Cubic.Out' });
      bg.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color);
    });
    bg.on('pointerup', () => {
      bg.setFillStyle(0x000000, 0.85);
      onClick();
    });
    bg.on('pointerdown', () => bg.setFillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.3));
    bg.on('pointerout', () => {
      this.tweens.add({ targets: c, scale: 1.0, duration: 100, ease: 'Cubic.Out' });
      bg.setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(color).color);
      bg.setFillStyle(0x000000, 0.85);
    });
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
    // P1: Hitstop 50ms — kurzes Einfrieren fuer Impact-Feel
    this.tweens.timeScale = 0;
    setTimeout(() => { if (this.tweens) this.tweens.timeScale = 1; }, 50);
    this.setMoveButtonsEnabled(false);

    // Damage-Floater
    for (const r of outcome.results) {
      if (r.dmg > 0) {
        const target = (r.defender === this.player) ? this.playerSprite : this.wildSprite;
        this.spawnDamageFloater(target, r.dmg, r.crit, effectivenessLabel(r.effectiveness));
        // D-041 Run10: Hit-Shake auf dem getroffenen Sprite
        const shakeDir = (r.defender === this.player) ? 1 : -1;
        const origX = target.x;
        this.tweens.add({
          targets: target, x: origX + shakeDir * 8,
          duration: 60, ease: 'Cubic.Out', yoyo: true, repeat: 2,
          onComplete: () => { target.setX(origX); }
        });
      }
      if (r.selfHeal && r.selfHeal > 0) {
        const target = (r.attacker === this.player) ? this.playerSprite : this.wildSprite;
        this.spawnHealFloater(target, r.selfHeal);
      }
    }

    if (outcome.battleOver) {
      this.over = true;
if (this.bossDef && outcome.winner === this.player) {
        // Boss-Sieg: Story-Flag setzen, Rewards, Defeat-Text
        gameStore.setStoryFlag(this.bossDef.questFlagOnDefeat, true);
        gameStore.addCoins(this.bossDef.rewardCoins);
        for (const [slug, n] of Object.entries(this.bossDef.rewardItems)) {
          gameStore.addItem(slug, n);
        }
        this.statusText.setText(this.bossDef.defeatText.join('\n') + `\n+${this.bossDef.rewardCoins} Gold!`);
        sfx.pickup();
        this.time.delayedCall(3500, () => this.endBattle(`Boss besiegt: ${this.bossDef!.name}`));
      } else {
        this.time.delayedCall(2000, () => {
          if (outcome.winner === this.player) {
            // S-POLISH Run2: Victory-Konfetti Particles
            this.spawnVictoryConfetti();
            // Battle-Drop V0.2: 25% Seed, 10% Coins
            let dropMsg = '';
            if (this.capturedEnc?.slug) {
              const drop = gameStore.applyBattleDrop(this.capturedEnc.slug);
              if (drop.itemSlug) dropMsg += ` +1 ${drop.itemSlug}`;
              if (drop.coins) dropMsg += ` +${drop.coins} Coins`;
            }
            this.endBattle(`Sieg! +${this.xpReward} XP${dropMsg}`);
          } else {
            this.endBattle(t('battle.exhausted'));
          }
        });
      }
    } else {
      this.time.delayedCall(1500, () => {
        this.statusText.setText(t('battle.action'));
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
    // S-POLISH Run2: smooth draindown via Tween statt instant width-Set
    const w = 200;
    const playerPct = this.player.stats.hp / this.player.stats.maxHp;
    const wildPct = this.wild.stats.hp / this.wild.stats.maxHp;
    const targetPlayerW = Math.max(0, w * playerPct);
    const targetWildW = Math.max(0, w * wildPct);
    // P1: Ghost-Bar — zeigt vorherigen HP-Stand kurz als roter Balken
    if (this.playerHpGhost) {
      this.playerHpGhost.width = this.playerHpBar.width;
      this.tweens.add({ targets: this.playerHpGhost, width: targetPlayerW, duration: 600, delay: 250, ease: 'Cubic.Out' });
    }
    if (this.wildHpGhost) {
      this.wildHpGhost.width = this.wildHpBar.width;
      this.tweens.add({ targets: this.wildHpGhost, width: targetWildW, duration: 600, delay: 250, ease: 'Cubic.Out' });
    }
    this.tweens.add({ targets: this.playerHpBar, width: targetPlayerW, duration: 300, ease: 'Cubic.Out' });
    this.tweens.add({ targets: this.wildHpBar, width: targetWildW, duration: 300, ease: 'Cubic.Out' });
    this.playerHpBar.fillColor = playerPct > 0.5 ? 0x6abf3a : (playerPct > 0.2 ? 0xfcd95c : 0xc94a4a);
    this.wildHpBar.fillColor = wildPct > 0.5 ? 0x6abf3a : (wildPct > 0.2 ? 0xfcd95c : 0xc94a4a);
    this.playerHpText.setText(`HP ${this.player.stats.hp} / ${this.player.stats.maxHp}`);
    this.wildHpText.setText(`HP ${this.wild.stats.hp} / ${this.wild.stats.maxHp}`);
  }

  private shakeSprites(target: 'wild' | 'player' = 'wild'): void {
    // S-POLISH Run-2: mehr Punch - staerkeres Sprite-Shake + Scale-Dip + laengerer Camera-Shake
    // Beide Sprites: x-Swing +=6, 80ms, Back.Out fuer snappy Return-Gefuehl
    this.tweens.add({ targets: this.playerSprite, x: '+=6', duration: 80, yoyo: true, ease: 'Back.Out' });
    this.tweens.add({ targets: this.wildSprite, x: '-=6', duration: 80, yoyo: true, ease: 'Back.Out' });
    // Scale-Dip beim getroffenen Sprite (kurzes Zusammenzucken 1.0 -> 0.92 -> 1.0)
    const hit = target === 'wild' ? this.wildSprite : this.playerSprite;
    if (hit) {
      this.tweens.add({ targets: hit, scaleX: 0.92, duration: 70, yoyo: true, ease: 'Sine.easeInOut' });
    }
    // Camera-Shake staerker: 220ms, 0.008 Intensitaet
    this.cameras.main.shake(220, 0.008);
    // Flash: leicht roetlich bei Hit (war neutral grau)
    this.cameras.main.flash(100, 120, 60, 60);
    // Hit-Sprite-Tint-Flash (rot fuer ~200ms, dann clear)
    if (hit && 'setTint' in hit) {
      (hit as Phaser.GameObjects.Image).setTint(0xff3c3c);
      this.time.delayedCall(200, () => { try { (hit as Phaser.GameObjects.Image).clearTint?.(); } catch { } });
    }
  }

  /** P0 Fix 4 (D-041): Farbkodierte Schadenszahlen mit Scale-Pop + Effektivitäts-Label */
  private getDamageColor(dmg: number, crit: boolean, effLabel: string): string {
    if (crit) return '#ff4444';
    if (effLabel === 'STARK') return '#ffa040';
    if (effLabel === 'SCHWACH') return '#88ccff';
    if (dmg >= 20) return '#ff7777';
    return '#f4e8c1';
  }

  private spawnDamageFloater(target: Phaser.GameObjects.Sprite, dmg: number, crit: boolean, effLabel: string): void {
    const color = this.getDamageColor(dmg, crit, effLabel);
    const label = crit ? `-${dmg} KRIT!` : `-${dmg}`;
    const fontSize = crit ? '22px' : dmg >= 20 ? '18px' : '15px';
    const text = this.add.text(target.x, target.y - 20, label, {
      fontFamily: 'monospace', fontSize, color,
      stroke: '#000000', strokeThickness: crit ? 4 : 3
    }).setOrigin(0.5).setDepth(1500).setScale(0.6);

    // Scale-Pop: schnell hochskalieren, dann floaten + fade
    this.tweens.add({
      targets: text,
      scaleX: 1,
      scaleY: 1,
      duration: 120,
      ease: 'Back.Out',
      onComplete: () => {
        this.tweens.add({
          targets: text,
          y: Math.round(target.y - 65),
          alpha: 0,
          duration: 1100,
          ease: 'Quad.Out',
          onUpdate: () => { text.y = Math.round(text.y); },
          onComplete: () => text.destroy()
        });
      }
    });

    if (effLabel) {
      const effColor = effLabel === 'STARK' ? '#ffa040' : effLabel === 'SCHWACH' ? '#88ccff' : '#fcd95c';
      const eff = this.add.text(target.x, target.y + 8, effLabel, {
        fontFamily: 'monospace', fontSize: '11px', color: effColor,
        stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(1499);
      this.tweens.add({
        targets: eff,
        y: Math.round(target.y - 35),
        alpha: 0,
        duration: 1400,
        onUpdate: () => { eff.y = Math.round(eff.y); },
        onComplete: () => eff.destroy()
      });
    }
  }

  private spawnHealFloater(target: Phaser.GameObjects.Sprite, amt: number): void {
    const text = this.add.text(target.x, target.y - 20, `+${amt}`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#9be36e',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(1500);
    this.tweens.add({ targets: text, y: target.y - 50, alpha: 0, duration: 1000, onUpdate: () => { text.y = Math.round(text.y); }, onComplete: () => text.destroy() });
  }

  private tryCapture(): void {
    if (this.over || !this.waitingForInput) return;
    if (this.bossDef) {
      this.statusText.setText(t('battle.bossNoCatch'));
      sfx.bump();
      return;
    }
    const wildPct = this.wild.stats.hp / this.wild.stats.maxHp;
    if (wildPct > 0.4) {
      this.statusText.setText(t('battle.tooStrong'));
      sfx.bump();
      return;
    }
    if (!gameStore.hasItem('basic-lure')) {
      this.statusText.setText(t('battle.noLure'));
      sfx.bump();
      return;
    }
    gameStore.consumeItem('basic-lure');
    const baseRate = 0.5 * (1 - wildPct) * 1.5;
    const success = Math.random() < baseRate;
    if (success && this.capturedEnc) {
      gameStore.capturePlant(this.capturedEnc.slug, this.capturedEnc.level, 0, 0, 0);
      this.statusText.setText(t('battle.caught', { name: this.wild.name }));
      sfx.pickup();
      this.over = true;
      this.time.delayedCall(1500, () => this.endBattle('Gefangen!'));
    } else {
      this.statusText.setText(t('battle.catchFail'));
      sfx.bump();
      this.waitingForInput = false;
      const wildMoveSlug = pickWildMove(this.wild);
      const wildMove = getMove(wildMoveSlug);
      if (wildMove) {
        runMoveRound(this.player, this.wild, 'tackle', wildMoveSlug);  // dummy player move
        // actually nur wild attacks - hier vereinfacht
      }
      this.time.delayedCall(1200, () => {
        this.statusText.setText(t('battle.action'));
        this.waitingForInput = true;
        this.updateBars();
      });
    }
  }

  private tryRun(): void {
    if (this.over) return;
    if (this.player.statuses.some((s) => s.effect === 'rooted')) {
      this.statusText.setText(t('battle.rootsTrap'));
      sfx.bump();
      return;
    }
    const success = Math.random() < 0.7;
    if (success) {
      this.statusText.setText(t('battle.flee'));
      sfx.dialogAdvance();
      this.over = true;
      this.time.delayedCall(800, () => this.endBattle('Geflohen.'));
    } else {
      this.statusText.setText(t('battle.fleeFail'));
      sfx.bump();
    }
  }

  /** S-POLISH Run2: Konfetti-Burst bei Sieg - kleine farbige Rechtecke fallen von oben */
  private spawnVictoryConfetti(): void {
    const { width, height } = this.scale;
    const colors = [0xffd166, 0x9be36e, 0x6abf3a, 0xff5c5c, 0xb86ee3, 0x5b8de8];
    for (let i = 0; i < 18; i++) {
      const x = Phaser.Math.Between(50, width - 50);
      const y = -10;
      const color = colors[i % colors.length];
      const rect = this.add.rectangle(x, y, Phaser.Math.Between(4, 9), Phaser.Math.Between(5, 12), color)
        .setDepth(2000)
        .setAlpha(0.9);
      this.tweens.add({
        targets: rect,
        y: height + 20,
        x: x + Phaser.Math.Between(-60, 60),
        angle: Phaser.Math.Between(-360, 360),
        alpha: 0,
        duration: Phaser.Math.Between(1200, 2200),
        delay: i * 60,
        ease: 'Cubic.In',
        onComplete: () => rect.destroy()
      });
    }
  }

  // R41: Tween + Timer cleanup bei Scene-Stop (Memory-Leak Praevention)
  public shutdown(): void {
    this.tweens.killAll();
    this.time.removeAllEvents();
  }

  private endBattle(msg: string): void {
    debugLog('[BattleScene] end', msg);
    sfx.door();
    this.scene.start('OverworldScene');
  }
}
