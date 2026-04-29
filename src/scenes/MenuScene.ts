import Phaser from 'phaser';
import { loadGame } from '../state/storage';
import { gameStore } from '../state/gameState';
import { startAmbientBGM, sfx } from '../audio/sfxGenerator';
import { t } from '../i18n/index';

/**
 * Start-Screen mit Title und Continue/New-Game/Settings.
 * Wird als erste Scene geladen.
 */
export class MenuScene extends Phaser.Scene {

  constructor() {
    super('MenuScene');
  }

  public preload(): void {
    // Tier-1 FTUE: Loading-Indikator damit der erste Eindruck nicht "haengender Splash" ist.
    // Wird beim Atlas-Load-Start angezeigt und beim Complete via destroy() entfernt.
    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;
    const splashTitle = this.add.text(cx, cy - 20, 'Plantinvasion', {
      fontFamily: 'monospace', fontSize: '32px', color: '#9be36e'
    }).setOrigin(0.5);
    const splashStatus = this.add.text(cx, cy + 14, 'lade Assets 0%', {
      fontFamily: 'monospace', fontSize: '11px', color: '#888888'
    }).setOrigin(0.5);
    this.load.on('progress', (v: number) => {
      splashStatus.setText(`lade Assets ${Math.round(v * 100)}%`);
    });
    this.load.on('complete', () => {
      splashTitle.destroy();
      splashStatus.destroy();
    });

    // Sprint 0+1 Atlas-Pack (Art-UI Generation 2026-04-26).
    // 4 Atlases: 12 Pflanzen-Spezies plus 16 Boden-Tile-Variationen plus UI-Frames.
    // Frame-Names siehe public/assets/atlases/*.json.
    // Bindung an Spezies-Map plus GardenScene-Tiles erfolgt in Folge-Run.
    this.load.atlas('plants_sprint_0', 'assets/atlases/plants_sprint_0.webp', 'assets/atlases/plants_sprint_0.json');
    this.load.atlas('plants_sprint_1', 'assets/atlases/plants_sprint_1.webp', 'assets/atlases/plants_sprint_1.json');
    this.load.atlas('ground_sprint_1', 'assets/atlases/ground_sprint_1.webp', 'assets/atlases/ground_sprint_1.json');
    this.load.atlas('ui_sprint_0', 'assets/atlases/ui_sprint_0.webp', 'assets/atlases/ui_sprint_0.json');

    // 16 einzelne Boden-Tile-Files (erdig/steinig/moosig/aschig je 4 Varianten)
    // fuer GardenScene-Slot-Variation per Slot-Index modulo 4.
    const groundTypes = ['erdig', 'steinig', 'moosig', 'aschig'];
    groundTypes.forEach((type) => {
      for (let v = 1; v <= 4; v++) {
        this.load.image(`ground_${type}_v${v}`, `assets/sprites/tiles/ground_${type}_v${v}.webp`);
      }
    });

    // Plant-Sprites Legacy-Fallback (Sprint 0 Pilot-Spezies fuer existierende species-Map).
    const species = ['sunflower', 'spike-cactus', 'venus-flytrap', 'lavender', 'tomato-plant'];
    const stageFiles = ['00_seed', '01_sprout', '02_juvenile', '03_adult', '04_blooming'];
    species.forEach((slug) => {
      stageFiles.forEach((sf, idx) => {
        const key = `${slug}-${idx}`;
        if (!this.textures.exists(key)) {
          this.load.image(key, `assets/sprites/plants/${slug}/${sf}.png`);
        }
      });
    });
  }


  public create(): void {
    const { width, height } = this.scale;
    // FI-D-041: title-visible mark + boot_time_ms PostHog event
    performance.mark('title-visible');
    try {
      performance.measure('boot-time', 'boot-start', 'title-visible');
      const bootMs = Math.round(performance.getEntriesByName('boot-time')[0]?.duration ?? 0);
      if (bootMs > 0) {
        const ph = (window as Window & { __posthog?: { capture: (e: string, p: Record<string, unknown>) => void } }).__posthog;
        ph?.capture('boot_time_ms', { duration_ms: bootMs, layout: (globalThis as { __layout?: string }).__layout ?? 'unknown' });
      }
    } catch (_) { /* PerformanceMeasure nicht verfuegbar */ }

    this.cameras.main.setBackgroundColor('#1a2820');

    // Tile-Background mit ground_erdig-Variationen (Sprint 1 Atlas).
    // 32x32-Grid, vier Variationen rotiert per Slot-Index modulo 4.
    if (this.textures.exists('ground_erdig_v1')) {
      const TS = 32;
      const cols = Math.ceil(width / TS);
      const rows = Math.ceil(height / TS);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const v = ((x * 7 + y * 13) % 4) + 1;
          this.add.image(x * TS, y * TS, `ground_erdig_v${v}`)
            .setOrigin(0, 0)
            .setAlpha(0.45);
        }
      }
    }

    // Hero-Sprite: Mondlilie Bloom als Title-Decoration (Sprint 1 Atlas).
    // Fallback auf procedural-Plant-Icon falls Atlas noch nicht im Cache.
    const cx = width / 2;
    const plantY = 80;
    if (this.textures.exists('plants_sprint_1')) {
      this.add.image(cx, plantY, 'plants_sprint_1', 'mondlilie_bloom.webp')
        .setOrigin(0.5)
        .setScale(0.85);
    } else {
      const stem = this.add.rectangle(cx, plantY + 30, 4, 30, 0x4a8228).setOrigin(0.5);
      const leaf1 = this.add.ellipse(cx - 14, plantY + 18, 22, 12, 0x6abf3a).setRotation(-0.3);
      const leaf2 = this.add.ellipse(cx + 14, plantY + 24, 22, 12, 0x6abf3a).setRotation(0.3);
      const flower = this.add.circle(cx, plantY, 14, 0xff7eb8).setStrokeStyle(2, 0x000000);
      const flowerCenter = this.add.circle(cx, plantY, 5, 0xfcd95c);
      // QW-14: Idle-Bob-Tween fuer das Logo-Pflanz-Objekt
    this.tweens.add({
      targets: [stem, leaf1, leaf2, flower, flowerCenter],
      y: '-=5',
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    // Leichtes Rotate-Wobble auf den Blaettern
    this.tweens.add({
      targets: leaf1,
      angle: -3,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this.tweens.add({
      targets: leaf2,
      angle: 3,
      duration: 2100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    void stem; void leaf1; void leaf2; void flower; void flowerCenter;
    }

    // Spezies-Showcase: 6 Spezies als kleine Bloom-Sprites unten als Footer-Decoration
    if (this.textures.exists('plants_sprint_0') && this.textures.exists('plants_sprint_1')) {
      const showcase = [
        { atlas: 'plants_sprint_0', frame: 'sonnenherz_bloom.webp' },
        { atlas: 'plants_sprint_0', frame: 'schnappklaue_bloom.webp' },
        { atlas: 'plants_sprint_0', frame: 'steinblatt_bloom.webp' },
        { atlas: 'plants_sprint_1', frame: 'wurzelmaul_bloom.webp' },
        { atlas: 'plants_sprint_1', frame: 'knochenpilz_bloom.webp' },
        { atlas: 'plants_sprint_1', frame: 'quarzkugel_bloom.webp' }
      ];
      const fy = height - 50;
      const spacing = Math.min(60, (width - 80) / showcase.length);
      const startX = cx - ((showcase.length - 1) * spacing) / 2;
      showcase.forEach((s, i) => {
        this.add.image(startX + i * spacing, fy, s.atlas, s.frame)
          .setOrigin(0.5)
          .setScale(0.35)
          .setAlpha(0.95);
      });
    }

    // S-POLISH-START: Logo-Reveal-Animation
    const title = this.add.text(cx, plantY + 75, 'Plantinvasion', {
      fontFamily: 'monospace', fontSize: '36px', color: '#9be36e'
    }).setOrigin(0.5);
    this.tweens.killTweensOf(title);
    title.setAlpha(0);
    title.setScale(0.7);
    this.tweens.add({
      targets: title,
      alpha: 1,
      scale: 1,
      duration: 700,
      ease: 'Back.Out',
      delay: 100
    });
    // Subtle Idle-Float auf Title nach Reveal
    this.tweens.add({
      targets: title,
      y: title.y + 4,
      duration: 2400,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1,
      delay: 900
    });

    // S-POLISH-START: Subtitle-Rotation (3 Taglines im Loop, je 3.5s sichtbar plus 0.5s Cross-Fade)
    const taglines = ['Cozy Botanik-RPG', 'Pflanzen-Sammler-Hybrid', 'Stardew trifft Pokemon'];
    const subtitle = this.add.text(cx, plantY + 110, taglines[0], {
      fontFamily: 'monospace', fontSize: '12px', color: '#8a6e4a'
    }).setOrigin(0.5);
    subtitle.setAlpha(0);
    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 600,
      delay: 600
    });
    let taglineIndex = 0;
    this.time.addEvent({
      delay: 4000,
      loop: true,
      callback: () => {
        this.tweens.add({
          targets: subtitle,
          alpha: 0,
          duration: 400,
          ease: 'Cubic.Out',
          onComplete: () => {
            taglineIndex = (taglineIndex + 1) % taglines.length;
            subtitle.setText(taglines[taglineIndex]);
            this.tweens.add({ targets: subtitle, alpha: 1, duration: 400, ease: 'Cubic.Out' });
          }
        });
      }
    });

    const save = loadGame();

    // D-041 Run9: Staggered Button Entrance â alle Buttons starten bei alpha=0, y+20 (slide up)
    const menuBtns: Phaser.GameObjects.Container[] = [];
    let by = plantY + 170;
    if (save) {
      const contBtn = this.makeButton(cx, by, t('menu.continue'), '#9be36e', () => {
        sfx.dialogAdvance();
        startAmbientBGM();
        // Garten ist Herzstueck: Default auf GardenScene
        const target = save.overworld?.lastSceneVisited ?? 'GardenScene';
        // D-041 R16: Fade-Out Transition vor Scene-Wechsel
        this.cameras.main.fadeOut(350, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(target));
      });
      contBtn.setAlpha(0);
      (contBtn as Phaser.GameObjects.Container).setY(by + 20);
      menuBtns.push(contBtn);
      by += 60;
    }
    const newGameBtn = this.makeButton(cx, by, save ? t('menu.newGame') : t('menu.startGame'), '#fcd95c', () => {
      // V0.2 (Critic-Review-Fix): Bei Neues-Spiel direkt in OverworldScene
      // mit Tutorial-Step 0. Vorher startete man in GardenScene mit
      // einer einsamen Sunflower und kam sich verloren vor.
      gameStore.resetToNewGame();
      gameStore.advanceTutorial(0);
      sfx.dialogAdvance();
      startAmbientBGM();
      // D-041 R16: Fade-Out Transition
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('OverworldScene'));
    });
    newGameBtn.setAlpha(0);
    (newGameBtn as Phaser.GameObjects.Container).setY(by + 20);
    menuBtns.push(newGameBtn);
    by += 60;
    const _settingsBtn = this.makeButton(cx, by, t('menu.settings'), '#8eaedd', () => {
      sfx.dialogAdvance();
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('SettingsScene'));
    });
    _settingsBtn.setAlpha(0);
    (_settingsBtn as Phaser.GameObjects.Container).setY(by + 20);
    menuBtns.push(_settingsBtn);
    by += 60;
    const _helpBtn = this.makeButton(cx, by, t('menu.help'), '#fcd95c', () => {
      sfx.dialogAdvance();
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('HelpScene'));
    });
    _helpBtn.setAlpha(0);
    (_helpBtn as Phaser.GameObjects.Container).setY(by + 20);
    menuBtns.push(_helpBtn);
    by += 60;
    // Staggered entrance: slide up + fade in, 80ms apart, starts after title reveal (delay 800ms)
    menuBtns.forEach((btn, i) => {
      this.tweens.add({
        targets: btn,
        alpha: 1,
        y: btn.y - 20,
        duration: 320,
        ease: 'Back.Out',
        delay: 800 + i * 80
      });
    });
    // S-POLISH-START: Primary-CTA Pulse-Animation um neue Spieler zum Klick zu fuehren
    this.tweens.add({
      targets: newGameBtn,
      scale: 1.04,
      duration: 1200,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1,
      delay: 1400
    });
    // D-041 R31: Attract-Ring Beacon — expandierende Ringe als persistentes CTA-Signal
    const spawnBeaconRing = (delayMs: number) => {
      this.time.delayedCall(delayMs, () => {
        if (!this.scene.isActive()) return;
        const ring = this.add.circle(newGameBtn.x, newGameBtn.y, 110, 0xfcd95c, 0)
          .setStrokeStyle(2, 0xfcd95c, 0.6)
          .setDepth(89);
        this.tweens.add({
          targets: ring,
          scaleX: 1.8,
          scaleY: 1.8,
          alpha: 0,
          duration: 1800,
          ease: 'Cubic.Out',
          onComplete: () => ring.destroy()
        });
        spawnBeaconRing(2400); // wiederhole alle 2.4s
      });
    };
    spawnBeaconRing(2000);
    spawnBeaconRing(3200); // zweiter Ring versetzt

    const _hint = this.add.text(cx, height - 24, 'v0.9-S-POLISH - Brave Browser empfohlen', {
      fontFamily: 'monospace', fontSize: '10px', color: '#553e2d'
    }).setOrigin(0.5);
    // S-POLISH-START: First-Visit-Welcome-Modal fuer neue Spieler ohne Save
    if (!save) {
      this.time.delayedCall(1500, () => this.showWelcomeModal());
    }

    // S-POLISH-START: Auto-Ambient-BGM nach 2s damit Hauptmenue Atmosphaere bekommt
    // (mit Try-Catch fuer Browser-Autoplay-Block, dann erst beim ersten Button-Click)
    this.time.delayedCall(2000, () => {
      try { startAmbientBGM(); } catch { /* Browser-Autoplay-Block, BGM startet bei erstem Click */ }
    });

    // S-POLISH-START: Atmospheric Plant-Growth-Loop hinten links
    // Mini-Pflanze die langsam waechst, Stage 0 -> 1 -> 2 -> 3 in 12s, dann reset
    if (this.textures.exists('plants_sprint_0')) {
      const plantX = 60;
      const plantY = height - 80;
      const stages = ['sonnenherz_stage_0_seed.webp', 'sonnenherz_stage_1_sprout.webp', 'sonnenherz_stage_2_juvenile.webp', 'sonnenherz_stage_3_adult.webp'];
      const ambientPlant = this.add.image(plantX, plantY, 'plants_sprint_0', stages[0]).setOrigin(0.5, 1).setScale(0.6).setAlpha(0.7);
      // D-041 Run9: Idle-Breathing fuer Ambient-Plants
      this.tweens.add({
        targets: ambientPlant,
        scaleY: 0.63,
        scaleX: 0.57,
        duration: 1800 + i * 300,
        ease: 'Sine.InOut',
        yoyo: true,
        repeat: -1,
        delay: i * 400
      });
      let stageIdx = 0;
      this.time.addEvent({
        delay: 3000,
        loop: true,
        callback: () => {
          stageIdx = (stageIdx + 1) % stages.length;
          this.tweens.add({
            targets: ambientPlant,
            alpha: 0.2,
            duration: 300,
            ease: 'Cubic.Out',
            onComplete: () => {
              ambientPlant.setFrame(stages[stageIdx]);
              this.tweens.add({ targets: ambientPlant, alpha: 0.7, duration: 300, ease: 'Cubic.Out' });
            }
          });
        }
      });
      // D-041 R38: Spiegel-Pflanze rechts fuer Tiefe + Symmetrie
      const mirrorStages = ['steinblatt_stage_0_seed.webp', 'steinblatt_stage_1_sprout.webp', 'steinblatt_stage_2_juvenile.webp', 'steinblatt_stage_3_adult.webp'];
      const mirrorPlant = this.add.image(width - 60, height - 80, 'plants_sprint_0', mirrorStages[0])
        .setOrigin(0.5, 1).setScale(0.6).setAlpha(0.55).setFlipX(true);
      this.tweens.add({
        targets: mirrorPlant, scaleY: 0.63, scaleX: 0.57,
        duration: 2100, ease: 'Sine.InOut', yoyo: true, repeat: -1, delay: 600
      });
      let mIdx = 0;
      this.time.addEvent({
        delay: 3800, loop: true,
        callback: () => {
          mIdx = (mIdx + 1) % mirrorStages.length;
          this.tweens.add({ targets: mirrorPlant, alpha: 0.1, duration: 300, ease: 'Cubic.Out',
            onComplete: () => {
              mirrorPlant.setFrame(mirrorStages[mIdx]);
              this.tweens.add({ targets: mirrorPlant, alpha: 0.55, duration: 300, ease: 'Cubic.Out' });
            }
          });
        }
      });
    }

    void _hint; void _settingsBtn; void _helpBtn; void newGameBtn; void title; void subtitle;
  }

  private showWelcomeModal(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;
    const overlay = this.add.container(cx, cy).setDepth(10000);
    const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0.5);
    overlay.add(dim);
    const panelW = 320;
    const panelH = 220;
    const panel = this.add.rectangle(0, 0, panelW, panelH, 0x1a2820, 0.98)
      .setStrokeStyle(3, 0x9be36e).setOrigin(0.5);
    overlay.add(panel);

    const slides = [
      {
        title: 'Willkommen in Plantinvasion',
        body: 'Sammle, zuechte plus kaempfe mit Pflanzen. Jede Spezies hat\nDNA die du kombinieren kannst um neue Hybriden zu schaffen.'
      },
      {
        title: 'Cozy plus Strategisch',
        body: 'Garten-Hub fuer Pflege plus Zuchten.\nWelt-Erkundung fuer Wild-Encounter plus Quests.\nKein Stress: dein Tempo bestimmt der Tag.'
      },
      {
        title: 'Tipps zum Start',
        body: 'X = Kreuzen plus G = Garten plus W = Welt\nKlick einen leeren Slot um zu pflanzen\nKlick eine Pflanze fuer Detail-Panel'
      }
    ];

    let slideIdx = 0;
    const titleText = this.add.text(0, -panelH / 2 + 30, slides[0].title, {
      fontFamily: 'monospace', fontSize: '16px', color: '#fcd95c'
    }).setOrigin(0.5);
    overlay.add(titleText);
    const bodyText = this.add.text(0, -10, slides[0].body, {
      fontFamily: 'monospace', fontSize: '11px', color: '#dcdcdc', align: 'center'
    }).setOrigin(0.5);
    overlay.add(bodyText);
    const dotsContainer = this.add.container(0, panelH / 2 - 60);
    const dots: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < slides.length; i++) {
      const dot = this.add.circle((i - 1) * 14, 0, 4, i === 0 ? 0x9be36e : 0x44603f);
      dotsContainer.add(dot);
      dots.push(dot);
    }
    overlay.add(dotsContainer);

    const updateSlide = () => {
      titleText.setText(slides[slideIdx].title);
      bodyText.setText(slides[slideIdx].body);
      dots.forEach((d, i) => d.setFillStyle(i === slideIdx ? 0x9be36e : 0x44603f));
    };

    const nextBtn = this.add.text(panelW / 2 - 50, panelH / 2 - 25, 'Weiter ->', {
      fontFamily: 'monospace', fontSize: '13px', color: '#9be36e',
      backgroundColor: '#000000', padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    nextBtn.on('pointerdown', () => {
      sfx.dialogAdvance();
      if (slideIdx < slides.length - 1) {
        slideIdx++;
        updateSlide();
        if (slideIdx === slides.length - 1) nextBtn.setText('Los gehts!');
      } else {
        this.tweens.add({
          targets: overlay,
          alpha: 0,
          duration: 300,
          ease: 'Cubic.Out',
          onComplete: () => overlay.destroy()
        });
      }
    });
    overlay.add(nextBtn);

    const skipBtn = this.add.text(-panelW / 2 + 35, panelH / 2 - 25, 'Skip', {
      fontFamily: 'monospace', fontSize: '11px', color: '#888888',
      padding: { x: 6, y: 3 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    skipBtn.on('pointerdown', () => {
      sfx.dialogAdvance();
      this.tweens.add({
        targets: overlay,
        alpha: 0,
        duration: 200,
        ease: 'Cubic.Out',
        onComplete: () => overlay.destroy()
      });
    });
    overlay.add(skipBtn);

    overlay.setAlpha(0);
    this.tweens.add({ targets: overlay, alpha: 1, duration: 400, ease: 'Cubic.Out' });
  }

  private makeButton(x: number, y: number, label: string, accent: string, onClick: () => void): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    const w = 220;
    const h = 44;
    const accentColor = Phaser.Display.Color.HexStringToColor(accent).color;
    const bg = this.add.rectangle(0, 0, w, h, 0x000000, 0.65)
      .setStrokeStyle(2, accentColor)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    const txt = this.add.text(0, 0, label, {
      fontFamily: 'monospace', fontSize: '14px', color: accent
    }).setOrigin(0.5);
    // D-041 R22: Hover/Press polish â fill tint + text brighten + scale
    bg.on('pointerover', () => {
      this.tweens.killTweensOf(c);
      this.tweens.add({ targets: c, scale: 1.06, duration: 150, ease: 'Back.Out' });
      bg.setStrokeStyle(3, accentColor);
      bg.setFillStyle(accentColor, 0.12);
      txt.setAlpha(1.0);
      sfx.dialogAdvance();
    });
    bg.on('pointerout', () => {
      this.tweens.killTweensOf(c);
      this.tweens.add({ targets: c, scale: 1.0, duration: 120, ease: 'Cubic.Out' });
      bg.setStrokeStyle(2, accentColor);
      bg.setFillStyle(0x000000, 0.65);
      txt.setAlpha(0.92);
    });
    bg.on('pointerdown', () => {
      this.tweens.killTweensOf(c);
      this.tweens.add({ targets: c, scale: 0.96, duration: 80, ease: 'Cubic.Out' });
      bg.setFillStyle(accentColor, 0.35);
    });
    bg.on('pointerup', () => {
      this.tweens.add({ targets: c, scale: 1.0, duration: 100, ease: 'Back.Out' });
      bg.setFillStyle(0x000000, 0.65);
      onClick();
    });
    txt.setAlpha(0.92); // leicht gedimmt im Idle
    c.add([bg, txt]);
    return c;
  }
}
