import Phaser from 'phaser';
import { gameStore } from '../state/gameState';
import { setMasterVolume, getMasterVolume, sfx, stopAmbientBGM, startAmbientBGM, setPersistedVolume, getPersistedVolume, setSfxVolume, getSfxVolume, setMusicVolume, getMusicVolume, getPersistedSfxVolume, setPersistedSfxVolume, getPersistedMusicVolume, setPersistedMusicVolume } from '../audio/sfxGenerator';
import { getLocale, setLocale } from '../i18n/index';
import { COLOR_ERROR, COLOR_INFO, COLOR_REWARD, COLOR_SUCCESS, COLOR_TEXT_DIM, FONT_FAMILY, FONT_SIZE_BODY, FONT_SIZE_SMALL, MODAL_BORDER_COLOR, getColorblindMode, setColorblindMode, type ColorblindMode } from '../ui/uiTheme';

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
    // D-041 R29: Sanftes FadeIn fuer konsistente Scene-Transitions
    this.cameras.main.fadeIn(250, 0, 0, 0);

    this.add
      .text(width / 2, 40, '⚙️ Einstellungen', {
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
    this.makeButton(width / 2, by + 30, 'BGM umschalten', COLOR_REWARD, () => this.toggleBGM());

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

    by += 36;
    // S-POLISH-B2-R16: Colorblind-Mode Selector
    this.add.text(width / 2 - 150, by, 'Farbenblind-Modus', {
      fontFamily: FONT_FAMILY, fontSize: '12px', color: COLOR_REWARD
    });
    by += 22;
    const cbModes: ColorblindMode[] = ['normal', 'deuteranopia', 'protanopia', 'tritanopia'];
    const cbLabels: Record<ColorblindMode, string> = {
      normal: 'Normal', deuteranopia: 'Deuteranopie (R/G)', protanopia: 'Protanopie (R/G)', tritanopia: 'Tritanopie (B/G)'
    };
    let currentCbMode = getColorblindMode();
    const cbModeText = this.add.text(width / 2, by, cbLabels[currentCbMode], {
      fontFamily: FONT_FAMILY, fontSize: '11px', color: COLOR_SUCCESS,
      backgroundColor: '#222', padding: { x: 6, y: 3 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    cbModeText.on('pointerup', () => {
      const nextIdx = (cbModes.indexOf(currentCbMode) + 1) % cbModes.length;
      currentCbMode = cbModes[nextIdx];
      setColorblindMode(currentCbMode);
      cbModeText.setText(cbLabels[currentCbMode]);
      sfx.click();
    });
    by += 42;

    // Save-Reset (mit Bestaetigung)
    this.makeButton(width / 2 - 100, by, 'Spielstand loeschen', COLOR_ERROR, () => this.confirmReset());
    // B4-R4: Credits-Button
    this.makeButton(width / 2 + 100, by, 'Credits', COLOR_REWARD, () => this.showCredits());

    by += 60;
    // S-POLISH-B2-R17: Export + Import Spielstand
    this.add.text(width / 2 - 150, by, 'Spielstand Export/Import', {
      fontFamily: FONT_FAMILY, fontSize: '12px', color: COLOR_REWARD
    });
    by += 26;
    const exportBtn = this.makeButton(width / 2 - 90, by, 'JSON exportieren', COLOR_INFO, () => {
      const json = gameStore.exportSaveJSON();
      try {
        navigator.clipboard.writeText(json).then(() => {
          exportBtn.getAt(1) && ((exportBtn.getAt(1) as Phaser.GameObjects.Text).setText('Kopiert!'));
          this.time.delayedCall(2000, () => {
            (exportBtn.getAt(1) as Phaser.GameObjects.Text).setText('JSON exportieren');
          });
        }).catch(() => {
          (exportBtn.getAt(1) as Phaser.GameObjects.Text).setText('Copy failed');
        });
      } catch {}
      sfx.click();
    });
    this.makeButton(width / 2 + 90, by, 'JSON importieren', COLOR_INFO, () => {
      const json = prompt('Spielstand-JSON einfügen:');
      if (!json) return;
      const r = gameStore.importSaveJSON(json);
      if (r.ok) {
        this.showFlash('Import erfolgreich!', COLOR_SUCCESS);
      } else {
        this.showFlash(`Import-Fehler: ${r.error ?? '?'}`, COLOR_ERROR);
      }
      sfx.click();
    });
    by += 52;

    // Save-Info
    const save = gameStore.get();
    this.add.text(width / 2, by, `Spielstand: v${save.version ?? '?'}   Coins: ${save.coins}   Pflanzen: ${save.plants.length}`, {
      fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_SMALL, color: COLOR_SUCCESS
    }).setOrigin(0.5, 0);

    // Back
    const backY = height - 30;
    this.makeButton(width / 2, backY, 'Zurück (Esc)', COLOR_SUCCESS, () => this.back());
    if (this.input.keyboard) {
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => this.back());
    }
  }

  private back(): void {
    sfx.dialogAdvance();
    this.scene.start('MenuScene');
  }

  private flashText?: Phaser.GameObjects.Text;
  private showFlash(msg: string, color: string): void {
    if (this.flashText) this.flashText.destroy();
    const { width } = this.scale;
    this.flashText = this.add.text(width / 2, 80, msg, {
      fontFamily: FONT_FAMILY, fontSize: '12px', color,
      backgroundColor: '#111', padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setDepth(3000);
    this.tweens.add({
      targets: this.flashText, alpha: 0, delay: 2500, duration: 500,
      onComplete: () => { this.flashText?.destroy(); }
    });
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

  /**
   * B4-R4: Spielstand loeschen mit doppelter Bestaetigung.
   * Schritt 1: Warnung-Modal. Schritt 2: Tippe "LOESCHEN" zur Bestaetigung.
   */
  private confirmReset(): void {
    const { width, height } = this.scale;
    const DEPTH = 2000;
    // Erster Dialog
    const overlay1 = this.add.rectangle(width / 2, height / 2, 340, 200, 0x000000, 0.95)
      .setStrokeStyle(2, 0xff7e7e).setDepth(DEPTH);
    const warn = this.add.text(width / 2, height / 2 - 40,
      'Spielstand loeschen?\n\nAlle Pflanzen, Items, Story-Fortschritt\nund Achievements gehen VERLOREN!', {
        fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_BODY, color: '#ffffff', align: 'center'
      }).setOrigin(0.5).setDepth(DEPTH + 1);
    const destroyStep1 = () => { overlay1.destroy(); warn.destroy(); next1.destroy(); cancel1.destroy(); };
    const next1 = this.makeButton(width / 2 - 80, height / 2 + 62, 'Weiter', COLOR_ERROR, () => {
      destroyStep1();
      this.showDeleteConfirmStep2();
    });
    next1.setDepth(DEPTH + 1);
    const cancel1 = this.makeButton(width / 2 + 80, height / 2 + 62, 'Abbrechen', COLOR_SUCCESS, destroyStep1);
    cancel1.setDepth(DEPTH + 1);
  }

  private showDeleteConfirmStep2(): void {
    const { width, height } = this.scale;
    const DEPTH = 2100;
    const overlay2 = this.add.rectangle(width / 2, height / 2, 340, 220, 0x000000, 0.95)
      .setStrokeStyle(2, 0xff7e7e).setDepth(DEPTH);
    this.add.text(width / 2, height / 2 - 60,
      'Tippe LOESCHEN und bestatige:', {
        fontFamily: FONT_FAMILY, fontSize: '12px', color: '#ff7e7e', align: 'center'
      }).setOrigin(0.5).setDepth(DEPTH + 1);
    // Eingabe-Feld (simuliert via Text + keyboard-capture)
    let typed = '';
    const inputDisplay = this.add.text(width / 2, height / 2 - 20, '_ _ _ _ _ _ _ _', {
      fontFamily: FONT_FAMILY, fontSize: '16px', color: '#fcd95c',
      backgroundColor: '#111', padding: { x: 10, y: 6 }
    }).setOrigin(0.5).setDepth(DEPTH + 1);
    const hint = this.add.text(width / 2, height / 2 + 14,
      'Tastatur-Eingabe aktiv', {
        fontFamily: FONT_FAMILY, fontSize: '10px', color: '#555555'
      }).setOrigin(0.5).setDepth(DEPTH + 1);
    const confirmBtn = this.makeButton(width / 2 - 80, height / 2 + 70, 'Bestaetigen', COLOR_ERROR, () => {
      if (typed.toUpperCase() === 'LOESCHEN') {
        gameStore.resetToNewGame();
        sfx.click();
        overlay2.destroy(); inputDisplay.destroy(); hint.destroy();
        confirmBtn.destroy(); cancelBtn2.destroy();
        this.showFlash('Spielstand geloescht.', COLOR_ERROR);
        this.time.delayedCall(1200, () => { this.scene.start('MenuScene'); });
      } else {
        this.showFlash('Eingabe falsch — tippe LOESCHEN', COLOR_ERROR);
      }
    });
    confirmBtn.setDepth(DEPTH + 1);
    const cancelBtn2 = this.makeButton(width / 2 + 80, height / 2 + 70, 'Abbrechen', COLOR_SUCCESS, () => {
      overlay2.destroy(); inputDisplay.destroy(); hint.destroy();
      confirmBtn.destroy(); cancelBtn2.destroy();
    });
    cancelBtn2.setDepth(DEPTH + 1);
    // Keyboard-Capture fuer Text-Eingabe
    if (this.input.keyboard) {
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          cancelBtn2.list[0] && (cancelBtn2.list[0] as Phaser.GameObjects.Rectangle).emit('pointerup');
          this.input.keyboard?.off('keydown', onKey);
          return;
        }
        if (e.key === 'Backspace') { typed = typed.slice(0, -1); }
        else if (e.key.length === 1 && typed.length < 8) { typed += e.key.toUpperCase(); }
        inputDisplay.setText(typed.padEnd(8, '_').split('').join(' '));
      };
      this.input.keyboard.on('keydown', onKey);
    }
  }

  /**
   * B4-R4: Credits-Screen als kleines Modal.
   */
  private showCredits(): void {
    const { width, height } = this.scale;
    const DEPTH = 3000;
    const overlay = this.add.rectangle(width / 2, height / 2, 360, 280, 0x000000, 0.95)
      .setStrokeStyle(2, MODAL_BORDER_COLOR).setDepth(DEPTH);
    this.add.text(width / 2, height / 2 - 110, 'Credits', {
      fontFamily: FONT_FAMILY, fontSize: '16px', color: COLOR_REWARD
    }).setOrigin(0.5).setDepth(DEPTH + 1);
    const lines = [
      'Plantinvasion v0.9-S-POLISH',
      '(c) 2026 Valentin Fischer',
      '',
      'Engine: Phaser 3',
      'Build: Vite + TypeScript',
      'Audio: Web Audio API',
      'i18n: i18next',
      'Analytics: PostHog',
      'Error: Sentry',
      '',
      'Botanic Advisor: Claude AI',
    ];
    lines.forEach((line, i) => {
      this.add.text(width / 2, height / 2 - 80 + i * 16, line, {
        fontFamily: FONT_FAMILY, fontSize: '11px', color: line.startsWith('(') ? '#fcd95c' : '#dddddd'
      }).setOrigin(0.5).setDepth(DEPTH + 1);
    });
    const closeBtn = this.makeButton(width / 2, height / 2 + 108, 'Schliessen', COLOR_SUCCESS, () => {
      overlay.destroy();
      closeBtn.destroy();
      // Alle Credits-Texte auch entfernen
      this.children.getAll().filter((c) => (c as Phaser.GameObjects.GameObject & { depth?: number }).depth === DEPTH + 1).forEach((c) => c.destroy());
    });
    closeBtn.setDepth(DEPTH + 1);
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
