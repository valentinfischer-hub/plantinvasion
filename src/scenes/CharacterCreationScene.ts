import Phaser from 'phaser';
import { gameStore } from '../state/gameState';
import {
  FONT_FAMILY,
  MODAL_BG_COLOR,
  COLOR_SUCCESS,
  COLOR_REWARD,
  COLOR_TEXT_DIM,
} from '../ui/uiTheme';
import { t } from '../i18n/index';

/**
 * S-POLISH-START-17: Charakter-Erstellungs-Scene.
 * Erscheint nach "Neues Spiel" in der MenuScene, bevor OverworldScene startet.
 *
 * Features:
 * - Name-Input via Tastatur (max 16 Zeichen, Umlaute-kompatibel)
 * - 4 Avatar-Choices (prozedural gezeichnet)
 * - "Spiel starten"-Button speichert playerName + avatarId
 * - "Überspringen" nutzt Default "Botaniker" + Avatar 0
 */

const AVATARS = [
  { bg: 0x1e4a1e, accent: 0x9be36e, accentHex: '#9be36e', label: 'Botaniker'     },
  { bg: 0x4a3a10, accent: 0xfcd95c, accentHex: '#fcd95c', label: 'Sonnengärtner'  },
  { bg: 0x102040, accent: 0x8eaedd, accentHex: '#8eaedd', label: 'Frostsammler'   },
  { bg: 0x300a50, accent: 0xd48ef0, accentHex: '#d48ef0', label: 'Mondkräutler'   },
];

const MAX_NAME = 16;

export class CharacterCreationScene extends Phaser.Scene {
  private nameInput   = '';
  private selectedAvatar = 0;
  private nameTxt!: Phaser.GameObjects.Text;
  private cursorOn    = true;
  private cursorTimer?: Phaser.Time.TimerEvent;
  private avatarCtrs: Phaser.GameObjects.Container[] = [];
  private rings: Phaser.GameObjects.Arc[] = [];

  constructor() { super('CharacterCreationScene'); }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;

    // Hintergrund
    this.cameras.main.setBackgroundColor('#0e160e');
    this.add.rectangle(cx, height / 2, width, height, 0x000000, 0.5);
    this.add.rectangle(cx, 0, width, 4, 0x9be36e).setOrigin(0.5, 0);

    // Titel
    this.add.text(cx, 26, t('ccs.title'), {
      fontFamily: FONT_FAMILY, fontSize: '18px', color: COLOR_SUCCESS,
    }).setOrigin(0.5, 0);

    this.add.text(cx, 52, t('ccs.subtitle'), {
      fontFamily: FONT_FAMILY, fontSize: '10px', color: COLOR_TEXT_DIM,
      wordWrap: { width: width - 60 }, align: 'center',
    }).setOrigin(0.5, 0);

    // ── Name-Input ─────────────────────────────────────────────
    const inputTopY = 100;
    this.add.text(cx, inputTopY, t('ccs.nameLabel'), {
      fontFamily: FONT_FAMILY, fontSize: '12px', color: '#aaaaaa',
    }).setOrigin(0.5, 1);

    const boxW  = Math.min(280, width - 80);
    const boxH  = 36;
    const boxCY = inputTopY + 18;

    this.add.rectangle(cx, boxCY, boxW, boxH, MODAL_BG_COLOR, 0.85)
      .setStrokeStyle(2, 0x9be36e)
      .setOrigin(0.5);

    this.nameTxt = this.add.text(cx - boxW / 2 + 10, boxCY, '', {
      fontFamily: FONT_FAMILY, fontSize: '14px', color: COLOR_REWARD,
    }).setOrigin(0, 0.5);

    this.refreshName();

    this.cursorTimer = this.time.addEvent({
      delay: 530, loop: true,
      callback: () => { this.cursorOn = !this.cursorOn; this.refreshName(); },
    });

    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => this.onKey(e));

    // ── Avatar-Auswahl ──────────────────────────────────────────
    const avLabelY = boxCY + boxH / 2 + 24;
    this.add.text(cx, avLabelY, t('ccs.avatarLabel'), {
      fontFamily: FONT_FAMILY, fontSize: '12px', color: '#aaaaaa',
    }).setOrigin(0.5, 0);

    const avCY     = avLabelY + 72;
    const avCount  = AVATARS.length;
    const spacing  = Math.min(96, (width - 60) / avCount);
    const avStartX = cx - (spacing * (avCount - 1)) / 2;

    AVATARS.forEach((av, i) => {
      const c = this.buildAvatar(avStartX + i * spacing, avCY, i, av);
      this.avatarCtrs.push(c);
    });
    this.refreshSelection();

    // ── Buttons ─────────────────────────────────────────────────
    const btnY = avCY + 82;
    this.makeButton(cx, btnY,      t('ccs.startBtn'), COLOR_REWARD,  () => this.confirm());
    this.makeButton(cx, btnY + 52, t('ccs.skipBtn'),    '#666666',     () => this.skip());

    this.add.text(cx, btnY + 86, t('ccs.skipHint'), {
      fontFamily: FONT_FAMILY, fontSize: '9px', color: '#555555',
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(280, 0, 0, 0);
  }

  // ── Keyboard ─────────────────────────────────────────────────
  private onKey(e: KeyboardEvent): void {
    if (e.key === 'Backspace') {
      this.nameInput = this.nameInput.slice(0, -1);
    } else if (e.key === 'Enter') {
      this.confirm();
    } else if (e.key === 'Escape') {
      this.skip();
    } else if (e.key.length === 1 && this.nameInput.length < MAX_NAME) {
      this.nameInput += e.key;
    }
    this.refreshName();
  }

  private refreshName(): void {
    const cursor = this.cursorOn ? '|' : ' ';
    this.nameTxt?.setText(this.nameInput + cursor);
  }

  // ── Avatar-Button ─────────────────────────────────────────────
  private buildAvatar(
    x: number, y: number, idx: number,
    av: { bg: number; accent: number; accentHex: string; label: string }
  ): Phaser.GameObjects.Container {
    const c  = this.add.container(x, y);
    const r  = 26;

    const circle = this.add.circle(0, 0, r, av.bg, 1)
      .setStrokeStyle(2, av.accent)
      .setInteractive({ useHandCursor: true });

    // Blatt-Shape
    const leaf = this.add.graphics();
    leaf.fillStyle(av.accent, 0.85);
    leaf.fillEllipse(0, -7, 13, 20);
    leaf.fillEllipse(-6, 4, 10, 12);
    leaf.fillStyle(av.bg, 0.55);
    leaf.fillRect(-1, -13, 2, 26);

    // Augen
    const eyes = this.add.graphics();
    eyes.fillStyle(0xffffff, 0.9);
    eyes.fillCircle(-5, 1, 2.8);
    eyes.fillCircle(5, 1, 2.8);
    eyes.fillStyle(0x000000, 1);
    eyes.fillCircle(-5, 2, 1.4);
    eyes.fillCircle(5, 2, 1.4);

    // Selektion-Ring (initially hidden)
    const ring = this.add.circle(0, 0, r + 6, 0x000000, 0)
      .setStrokeStyle(3, 0xffffff);
    ring.setVisible(false);
    this.rings.push(ring);

    const lbl = this.add.text(0, r + 10, av.label, {
      fontFamily: FONT_FAMILY, fontSize: '9px', color: av.accentHex, align: 'center',
    }).setOrigin(0.5, 0);

    c.add([circle, leaf, eyes, ring, lbl]);

    circle.on('pointerover', () => {
      if (this.selectedAvatar !== idx)
        this.tweens.add({ targets: c, scale: 1.08, duration: 110, ease: 'Cubic.Out' });
    });
    circle.on('pointerout', () => {
      if (this.selectedAvatar !== idx)
        this.tweens.add({ targets: c, scale: 1.0, duration: 110, ease: 'Cubic.Out' });
    });
    circle.on('pointerup', () => {
      this.selectedAvatar = idx;
      this.refreshSelection();
    });

    return c;
  }

  private refreshSelection(): void {
    this.avatarCtrs.forEach((c, i) => {
      const sel = i === this.selectedAvatar;
      this.rings[i].setVisible(sel);
      this.tweens.add({ targets: c, scale: sel ? 1.12 : 1.0, duration: 140, ease: 'Back.Out' });
    });
  }

  // ── Confirm / Skip ────────────────────────────────────────────
  private confirm(): void {
    const name = this.nameInput.trim() || 'Botaniker';
    gameStore.setPlayerProfile(name, this.selectedAvatar);
    this.fadeToOverworld();
  }

  private skip(): void {
    gameStore.setPlayerProfile('Botaniker', 0);
    this.fadeToOverworld();
  }

  private fadeToOverworld(): void {
    this.cameras.main.fadeOut(240, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.cursorTimer?.destroy();
      this.scene.start('OverworldScene');
    });
  }

  // ── Button-Helper ─────────────────────────────────────────────
  private makeButton(
    x: number, y: number, label: string, accent: string, onClick: () => void
  ): Phaser.GameObjects.Container {
    const c   = this.add.container(x, y);
    const w   = 220;
    const h   = 44;
    const col = Phaser.Display.Color.HexStringToColor(accent).color;
    const bg  = this.add.rectangle(0, 0, w, h, MODAL_BG_COLOR, 0.8)
      .setStrokeStyle(2, col).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const txt = this.add.text(0, 0, label, {
      fontFamily: FONT_FAMILY, fontSize: '14px', color: accent,
    }).setOrigin(0.5);
    bg.on('pointerover', () =>
      this.tweens.add({ targets: c, scale: 1.05, duration: 120, ease: 'Cubic.Out' })
    );
    bg.on('pointerout', () =>
      this.tweens.add({ targets: c, scale: 1.0, duration: 120, ease: 'Cubic.Out' })
    );
    bg.on('pointerdown', () => bg.setFillStyle(col, 0.3));
    bg.on('pointerup',   () => { bg.setFillStyle(MODAL_BG_COLOR, 0.8); onClick(); });
    c.add([bg, txt]);
    return c;
  }
}
