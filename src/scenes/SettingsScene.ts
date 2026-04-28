import Phaser from 'phaser';
import { gameStore } from '../state/gameState';
import { setMasterVolume, getMasterVolume, sfx, stopAmbientBGM, startAmbientBGM, setPersistedVolume, getPersistedVolume, setSfxVolume, getSfxVolume, setMusicVolume, getMusicVolume, getPersistedSfxVolume, setPersistedSfxVolume, getPersistedMusicVolume, setPersistedMusicVolume } from '../audio/sfxGenerator';
import { getLocale, setLocale } from '../i18n/index';
import { COLOR_ERROR, COLOR_REWARD, COLOR_SUCCESS, COLOR_TEXT_DIM, FONT_FAMILY, FONT_SIZE_BODY, FONT_SIZE_SMALL, MODAL_BORDER_COLOR } from '../ui/uiTheme';

/**
 * Settings-Scene V0.2 (2026-04-28).
 * Volume-Slider, BGM-Toggle, Locale-Toggle DE|EN, Save-Reset, Layout-Hint.
 * Aufruf via MenuScene-Button oder spaeter Esc-Pause-Menu.
 */
export class SettingsScene extends Phaser.Scene {
  private volumeBarFill!: Phaser.GameObjects.Rectangle;
  private volumeText!: Phaser.GameObjects.Text;
  // S-POLISH-B2-R14: SFX + Music separate Lautstärke
  private sfxBarFill!: Phaser.GameObjects.Rectangle;
  private sfxText!: Phaser.GameObjects.Text;
  private musicBarFill!: Phaser.GameObjects.Rectangle;
  private musicText!: Phaser.GameObjects.Text;
  private bgmEnabled = true;
  private bgmStatusText!: Phaser.GameObjects.Text;
  private localeDeBtn!: Phaser.GameObjects.Container;
  private localeEnBtn!: Phaser.GameObjects.Container;

  constructor() {
    super('SettingsScene');
  }

  create(): void {
    const { width, height } = this.scale;
    // Volume-Persist: Gespeicherten Wert laden (Safety-Check falls Settings direkt gebootet)
    setMasterVolume(getPersistedVolume());
    setSfxVolume(getPersistedSfxVolume());
    setMusicVolume(getPersistedMusicVolume());
    this.cameras.main.setBackgroundColor('#1a2820');

    this.add
      .text(width / 2, 40, 'Einstellungen', {
        fontFamily: FONT_FAMILY,
        fontSize: '22px',
        color: COLOR_SUCCESS
      })
      .setOrigin(0.5);

    let by = 100;
    // Volume-Slider
    this.add.text(width / 2 - 150, by, 'Lautstaerke', {
      fontFamily: FONT_FAMILY, fontSize: '13px', color: COLOR_REWARD
    });
    by += 24;
    const barW = 300;
    const barH = 20;
    const barX = width / 2 - barW / 2;
    const barBg = this.add
      .rectangle(barX, by, barW, barH, 0x000000, 0.6)
      .setStrokeStyle(1, 0x553e2d)
      .setOrigin(0, 0)
      .setInteractive(new Phaser.Geom.Rectangle(0, 0, barW, barH), Phaser.Geom.Rectangle.Contains);
    this.volumeBarFill = this.add
      .rectangle(barX, by, barW * getMasterVolume(), barH, MODAL_BORDER_COLOR, 0.85)
      .setOrigin(0, 0);
    this.volumeText = this.add
      .text(width / 2, by + barH + 14, `${Math.round(getMasterVolume() * 100)}%`, {
        fontFamily: FONT_FAMILY, fontSize: '12px', color: '#ffffff'
      })
      .setOrigin(0.5, 0);
    barBg.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const localX = p.x - barX;
      this.setVolume(Math.max(0, Math.min(1, localX / barW)));
    });
    barBg.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!p.isDown) return;
      const localX = p.x - barX;
      this.setVolume(Math.max(0, Math.min(1, localX / barW)));
    });

    by += 50;
    // S-POLISH-B2-R14: SFX-Lautstärke-Slider
    this.add.text(width / 2 - 150, by, 'SFX-Lautstaerke', {
      fontFamily: FONT_FAMILY, fontSize: '12px', color: COLOR_REWARD
    });
    by += 22;
    const sfxBarW = 300;
    const sfxBarX = width / 2 - sfxBarW / 2;
    const sfxBarBg = this.add.rectangle(sfxBarX, by, sfxBarW, 16, 0x000000, 0.6)
      .setStrokeStyle(1, 0x553e2d).setOrigin(0, 0)
      .setInteractive(new Phaser.Geom.Rectangle(0, 0, sfxBarW, 16), Phaser.Geom.Rectangle.Contains);
    this.sfxBarFill = this.add.rectangle(sfxBarX, by, sfxBarW * getSfxVolume(), 16, 0x5b8de8, 0.85).setOrigin(0, 0);
    this.sfxText = this.add.text(width / 2, by + 20, `${Math.round(getSfxVolume() * 100)}%`, {
      fontFamily: FONT_FAMILY, fontSize: '11px', color: '#ffffff'
    }).setOrigin(0.5, 0);
    sfxBarBg.on('pointerdown', (p: Phaser.Input.Pointer) => { this.setSfxVol(Math.max(0, Math.min(1, (p.x - sfxBarX) / sfxBarW))); });
    sfxBarBg.on('pointermove', (p: Phaser.Input.Pointer) => { if (!p.isDown) return; this.setSfxVol(Math.max(0, Math.min(1, (p.x - sfxBarX) / sfxBarW))); });

    by += 44;
    // S-POLISH-B2-R14: Musik-Lautstärke-Slider
    this.add.text(width / 2 - 150, by, 'Musik-Lautstaerke', {
      fontFamily: FONT_FAMILY, fontSize: '12px', color: COLOR_REWARD
    });
    by += 22;
    const musicBarX = width / 2 - sfxBarW / 2;
    const musicBarBg = this.add.rectangle(musicBarX, by, sfxBarW, 16, 0x000000, 0.6)
      .setStrokeStyle(1, 0x553e2d).setOrigin(0, 0)
      .setInteractive(new Phaser.Geom.Rectangle(0, 0, sfxBarW, 16), Phaser.Geom.Rectangle.Contains);
    this.musicBarFill = this.add.rectangle(musicBarX, by, sfxBarW * getMusicVolume(), 16, 0xfcd95c, 0.85).setOrigin(0, 0);
    this.musicText = this.add.text(width / 2, by + 20, `${Math.round(getMusicVolume() * 100)}%`, {
      fontFamily: FONT_FAMILY, fontSize: '11px', color: '#ffffff'
    }).setOrigin(0.5, 0);
    musicBarBg.on('pointerdown', (p: Phaser.Input.Pointer) => { this.setMusicVol(Math.max(0, Math.min(1, (p.x - musicBarX) / sfxBarW))); });
    musicBarBg.on('pointermove', (p: Phaser.Input.Pointer) => { if (!p.isDown) return; this.setMusicVol(Math.max(0, Math.min(1, (p.x - musicBarX) / sfxBarW))); });

    by += 44;
    // BGM Toggle
    this.add.text(width / 2 - 150, by, 'Hintergrundmusik', {
      fontFamily: FONT_FAMILY, fontSize: '13px', color: COLOR_REWARD
    });
    by += 24;
    this.bgmStatusText = this.add.text(width / 2, by, this.bgmEnabled ? 'AN' : 'AUS', {
      fontFamily: FONT_FAMILY, fontSize: '13px', color: this.bgmEnabled ? COLOR_SUCCESS : COLOR_ERROR
    }).setOrigin(0.5, 0);
    const bgmToggle = this.makeButton(width / 2, by + 30, 'BGM umschalten', COLOR_REWARD, () => this.toggleBGM());
    void bgmToggle;

    by += 80;
    // Locale-Toggle DE | EN
    this.add.text(width / 2 - 150, by, 'Sprache', {
      fontFamily: FONT_FAMILY, fontSize: '13px', color: COLOR_REWARD
    });
    by += 8;
    const locale = getLocale();
    this.localeDeBtn = this.makeLocaleButton(width / 2 - 55, by + 20, 'DE', locale === 'de', () => this.switchLocale('de'));
    this.localeEnBtn = this.makeLocaleButton(width / 2 + 55, by + 20, 'EN', locale === 'en', () => this.switchLocale('en'));
    by += 50;

    // Layout-Info
    const layout = (globalThis as { __layout?: string }).__layout || 'unknown';
    this.add.text(width / 2, by, `Layout: ${layout}`, {
      fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_BODY, color: '#553e2d'
    }).setOrigin(0.5, 0);
    by += 16;
    this.add.text(width / 2, by, '(Window-Resize beim Reload aendert das Layout)', {
      fontFamily: FONT_FAMILY, fontSize: '9px', color: '#553e2d'
    }).setOrigin(0.5, 0);

    by += 50;
    // Save-Reset (mit Bestaetigung)
    const _resetBtn = this.makeButton(width / 2, by, 'Spielstand loeschen', COLOR_ERROR, () => this.confirmReset());
    void _resetBtn;

    by += 60;
    // Save-Info
    const save = gameStore.get();
    this.add.text(width / 2, by, `Spielstand: v${save.version ?? '?'}   Coins: ${save.coins}   Pflanzen: ${save.plants.length}`, {
      fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_SMALL, color: COLOR_SUCCESS
    }).setOrigin(0.5, 0);

    // Back
    const backY = height - 30;
    const _backBtn = this.makeButton(width / 2, backY, 'Zurueck (Esc)', COLOR_SUCCESS, () => this.back());
    void _backBtn;
    if (this.input.keyboard) {
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => this.back());
    }
  }

  private back(): void {
    sfx.dialogAdvance();
    this.scene.start('MenuScene');
  }

  private setSfxVol(v: number): void {
    setSfxVolume(v);
    setPersistedSfxVolume(v);
    this.sfxBarFill.width = 300 * v;
    this.sfxText.setText(`${Math.round(v * 100)}%`);
    sfx.click();
  }

  private setMusicVol(v: number): void {
    setMusicVolume(v);
    setPersistedMusicVolume(v);
    this.musicBarFill.width = 300 * v;
    this.musicText.setText(`${Math.round(v * 100)}%`);
  }

  private setVolume(v: number): void {
    setMasterVolume(v);
    setPersistedVolume(v);
    this.volumeBarFill.width = 300 * v;
    this.volumeText.setText(`${Math.round(v * 100)}%`);
    sfx.click();
  }

  private toggleBGM(): void {
    this.bgmEnabled = !this.bgmEnabled;
    if (this.bgmEnabled) startAmbientBGM();
    else stopAmbientBGM();
    this.bgmStatusText.setText(this.bgmEnabled ? 'AN' : 'AUS');
    this.bgmStatusText.setColor(this.bgmEnabled ? COLOR_SUCCESS : COLOR_ERROR);
    sfx.click();
  }

  /** Wechselt Spielsprache und aktualisiert Button-Optik. */
  private switchLocale(locale: 'de' | 'en'): void {
    // S-POLISH Run7: Locale-Switch Feedback-Animation
    const btn = locale === 'de' ? this.localeDeBtn : this.localeEnBtn;
    this.tweens.add({ targets: btn, scaleX: 1.15, scaleY: 1.15, duration: 90, yoyo: true, ease: 'Back.Out' });
    setLocale(locale);
    sfx.click();
    // Button-Highlighting aktualisieren
    this.updateLocaleButtons();
  }

  private updateLocaleButtons(): void {
    const locale = getLocale();
    // Einfaches visuelles Feedback: aktive Locale = hellgruen, inaktiv = grau
    // Container-Zugriff via getAt(0) = bg-Rectangle, getAt(1) = Text
    const deBg = this.localeDeBtn.getAt(0) as Phaser.GameObjects.Rectangle;
    const enBg = this.localeEnBtn.getAt(0) as Phaser.GameObjects.Rectangle;
    deBg.setStrokeStyle(2, locale === 'de' ? MODAL_BORDER_COLOR : 0x553e2d);
    enBg.setStrokeStyle(2, locale === 'en' ? MODAL_BORDER_COLOR : 0x553e2d);
  }

  private makeLocaleButton(x: number, y: number, label: string, active: boolean, onClick: () => void): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    const w = 80;
    const h = 32;
    const accent = active ? MODAL_BORDER_COLOR : 0x553e2d;
    const bg = this.add.rectangle(0, 0, w, h, 0x000000, 0.7)
      .setStrokeStyle(2, accent)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    const txt = this.add.text(0, 0, label, {
      fontFamily: FONT_FAMILY, fontSize: '13px', color: active ? COLOR_SUCCESS : COLOR_TEXT_DIM
    }).setOrigin(0.5);
    bg.on('pointerup', () => { sfx.click(); onClick(); });
    c.add([bg, txt]);
    return c;
  }

  private confirmReset(): void {
    // Zeige Bestaetigungs-Dialog inline
    const { width, height } = this.scale;
    const overlay = this.add.rectangle(width / 2, height / 2, 360, 180, 0x000000, 0.95)
      .setStrokeStyle(2, 0xff7e7e)
      .setDepth(2000);
    const text = this.add.text(width / 2, height / 2 - 30, 'Spielstand wirklich loeschen?\n\nAlle Pflanzen, Items, Achievements\nund Story-Fortschritt gehen verloren!', {
      fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_BODY, color: '#ffffff', align: 'center'
    }).setOrigin(0.5).setDepth(2001);
    const yesBtn = this.makeButton(width / 2 - 80, height / 2 + 50, 'Ja, loeschen', COLOR_ERROR, () => {
      gameStore.resetToNewGame();
      sfx.click();
      overlay.destroy();
      text.destroy();
      yesBtn.destroy();
      noBtn.destroy();
      this.scene.start('MenuScene');
    });
    yesBtn.setDepth(2001);
    const noBtn = this.makeButton(width / 2 + 80, height / 2 + 50, 'Abbrechen', COLOR_SUCCESS, () => {
      overlay.destroy();
      text.destroy();
      yesBtn.destroy();
      noBtn.destroy();
    });
    noBtn.setDepth(2001);
  }

  private makeButton(x: number, y: number, label: string, accent: string, onClick: () => void): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    const w = 160;
    const h = 32;
    const bg = this.add.rectangle(0, 0, w, h, 0x000000, 0.7)
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(accent).color)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    const txt = this.add.text(0, 0, label, {
      fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_BODY, color: accent
    }).setOrigin(0.5);
    bg.on('pointerup', () => { sfx.click(); onClick(); });
    c.add([bg, txt]);
    return c;
  }
}
