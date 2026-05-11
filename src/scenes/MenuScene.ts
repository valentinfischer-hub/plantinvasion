import Phaser from 'phaser';
import { loadGame } from '../state/storage';
import { gameStore } from '../state/gameState';
import { sfx } from '../audio/sfxGenerator';
import { startTitleBGM, stopTitleBGM } from '../audio/titleBgm';
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

    // FI Art-UI R1 2026-05-11: Blütenstaub-Partikel-Hintergrund (max 30, 60fps-safe)
    // Pollen-Dot-Textur dynamisch erzeugen (kein Atlas-Datei-Request)
    if (!this.textures.exists('pollen_dot')) {
      const gfx = this.make.graphics({ x: 0, y: 0, add: false });
      gfx.fillStyle(0xffffff, 1);
      gfx.fillCircle(4, 4, 4);
      gfx.generateTexture('pollen_dot', 8, 8);
      gfx.destroy();
    }
    // Partikel: driften langsam von unten nach oben, random X, max 30 aktiv
    this.add.particles(cx, height + 10, 'pollen_dot', {
      x: { min: -cx + 20, max: cx - 20 },
      y: 0,
      speedX: { min: -12, max: 12 },
      speedY: { min: -22, max: -8 },
      scale: { start: 0.9, end: 0.2 },
      alpha: { start: 0.55, end: 0 },
      lifespan: { min: 5000, max: 9000 },
      quantity: 1,
      frequency: 450,
      maxParticles: 30,
      tint: [0xfcd95c, 0x9be36e, 0xf4a832, 0xd4f5a0],
      blendMode: 'ADD'
    }).setDepth(1);

    // S-POLISH-START: Logo-Reveal-Animation
    // FI Art-UI R2 (2026-05-11): Pixel-Art Logo-Styling — warmes Off-White, Pixel-Outline ohne Blur,
    // Leaf-Dekorationen, koordinierte 4-Element-Entrance, Idle-Glow-Puls, Pollen-Burst.
    // Score: 3 -> 4 (Art-UI Handoff 2026-05-11).
    const titleY = plantY + 75;
    const title = this.add.text(cx, titleY - 30, 'Plantinvasion', {
      fontFamily: 'monospace',
      fontSize: '42px',
      color: '#f4e8c1',
      stroke: '#2c1f0e',
      strokeThickness: 6,
      shadow: { offsetX: 3, offsetY: 4, color: '#1a0f00', blur: 0, fill: true }
    }).setOrigin(0.5).setDepth(2).setAlpha(0);

    // Leaf-Dekorationen links + rechts (starten eingefahren, fliegen raus)
    const leafL = this.add.text(cx - 165, titleY + 2, '🌿', { fontSize: '26px' })
      .setOrigin(0.5).setAlpha(0).setDepth(2);
    const leafR = this.add.text(cx + 165, titleY + 2, '🌿', { fontSize: '26px' })
      .setOrigin(0.5).setAlpha(0).setDepth(2);

    // Statische Tagline — ersetzt Subtitle-Rotation (Schritt C der Entrance)
    const tagline = this.add.text(
      cx, titleY + 38,
      '― Sammle • Kreuze • Entdecke ―',
      { fontFamily: 'monospace', fontSize: '9px', color: '#9abd7a' }
    ).setOrigin(0.5).setAlpha(0).setDepth(2);

    // 4-Element koordinierte Entrance-Sequenz
    // Schritt A: Title faellt rein (300ms Delay)
    this.tweens.add({
      targets: title,
      alpha: 1,
      y: titleY,
      ease: 'Back.Out',
      duration: 700,
      delay: 300,
      easeParams: [2.0]
    });
    // Schritt B: Leaves fliegen rein (400ms Delay)
    this.tweens.add({
      targets: leafL,
      alpha: 1,
      x: cx - 185,
      ease: 'Back.Out',
      duration: 500,
      delay: 400
    });
    this.tweens.add({
      targets: leafR,
      alpha: 1,
      x: cx + 185,
      ease: 'Back.Out',
      duration: 500,
      delay: 400
    });
    // Schritt C: Tagline erscheint (800ms Delay)
    this.tweens.add({
      targets: tagline,
      alpha: 0.85,
      ease: 'Linear',
      duration: 400,
      delay: 800
    });
    // Schritt D: Idle-Glow-Puls nach Entrance (1100ms) — Alpha-Puls statt Color-Tween (Performance)
    this.time.delayedCall(1100, () => {
      this.tweens.add({
        targets: title,
        alpha: { from: 1.0, to: 0.88 },
        ease: 'Sine.InOut',
        duration: 2400,
        yoyo: true,
        repeat: -1
      });
    });
    // Pollen-Burst beim Title-Erscheinen (650ms = ca. 50% der Entrance-Animation)
    this.time.delayedCall(650, () => {
      if (this.textures.exists('pollen_dot')) {
        const burst = this.add.particles(cx, titleY, 'pollen_dot', {
          speed: { min: 40, max: 120 },
          angle: { min: -110, max: -70 },
          scale: { start: 0.8, end: 0 },
          alpha: { start: 0.9, end: 0 },
          lifespan: 1200,
          quantity: 18,
          emitting: false,
          tint: [0xfcd95c, 0x9be36e, 0xf4e8c1]
        });
        burst.explode(18);
        this.time.delayedCall(1500, () => burst.destroy());
      }
    });

    // FI Art-UI R1 2026-05-11: Sweep-Gloss-Tween nach 1.5s (Pokemon-Red Referenz)
    // Ein heller Streifen gleitet einmalig von links nach rechts über den Titel-Text
    this.time.delayedCall(1500, () => {
      const titleBounds = title.getBounds();
      const gloss = this.add.rectangle(
        titleBounds.left - 20, titleBounds.centerY,
        20, titleBounds.height + 10,
        0x9be36e, 0
      ).setOrigin(0, 0.5).setDepth(3).setBlendMode(Phaser.BlendModes.ADD);
      // Phase 1: fade in + sweep right
      this.tweens.add({
        targets: gloss,
        x: titleBounds.right + 20,
        alpha: 0.7,
        duration: 220,
        ease: 'Cubic.In',
        onComplete: () => {
          // Phase 2: fade out am Ende
          this.tweens.add({
            targets: gloss,
            alpha: 0,
            duration: 120,
            ease: 'Cubic.Out',
            onComplete: () => gloss.destroy()
          });
        }
      });
    });


    const save = loadGame();

    // D-041 Run9: Staggered Button Entrance – alle Buttons starten bei alpha=0, y+20 (slide up)
    const menuBtns: Phaser.GameObjects.Container[] = [];
    let by = plantY + 170;
    if (save) {
      const contBtn = this.makeButton(cx, by, t('menu.continue'), '#9be36e', () => {
        sfx.dialogAdvance();
        stopTitleBGM(480); // Cross-Fade: Title-BGM ausfaden synchron mit Kamera-Fade
        // Garten ist Herzstueck: Default auf GardenScene
        const target = save.overworld?.lastSceneVisited ?? 'GardenScene';
        // FI-Transition V2 (2026-05-10): Nature-Flash + Dark-Green FadeOut
        // Score 2→4: Flash gibt Portal-Gefühl, dunkles Grün passt zur Natur-Ästhetik
        this.cameras.main.flash(200, 155, 227, 110, false);
        this.time.delayedCall(80, () => {
          this.cameras.main.fadeOut(480, 8, 14, 8);
          this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(target));
        });
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
      stopTitleBGM(480); // Cross-Fade parallel zur Kamera-Animation
      // FI-Transition V2 (2026-05-10): Nature-Flash + Dark-Green FadeOut (identisch Continue-Button)
      this.cameras.main.flash(200, 155, 227, 110, false);
      this.time.delayedCall(80, () => {
        this.cameras.main.fadeOut(480, 8, 14, 8);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('OverworldScene'));
      });
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
      const targetY = (btn as Phaser.GameObjects.Container & { staggerTargetY?: number }).staggerTargetY ?? btn.y - 20;
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

    // FI-Boot-Time R22: TS-Fix — kein const-Assignment, add.text hat Side-Effect (Render)
    this.add.text(cx, height - 24, 'v0.9 | 2026-05-11 - Brave Browser empfohlen', {
      fontFamily: 'monospace', fontSize: '10px', color: '#553e2d'
    }).setOrigin(0.5);
    // S-POLISH-START: First-Visit-Welcome-Modal fuer neue Spieler ohne Save
    if (!save) {
      this.time.delayedCall(1500, () => this.showWelcomeModal());
    }

    // FI-Run 2026-05-11: Title-BGM (D-Dur Major-7-Pad) ersetzt generischen Ambient-Drone.
    // Fade-In über 2s. Bei Autoplay-Block startet BGM beim ersten Button-Interaction.
    // Score-Ziel: FI-Item "Title-BGM (erste 10s)" 1->4.
    this.time.delayedCall(200, () => {
      try { startTitleBGM(2000); } catch { /* Autoplay-Block: BGM startet bei erstem Klick */ }
    });

    // S-POLISH-START: Atmospheric Plant-Growth-Loop hinten links
    // Mini-Pflanze die langsam waechst, Stage 0 -> 1 -> 2 -> 3 in 12s, dann reset
    if (this.textures.exists('plants_sprint_0')) {
      const plantX = 60;
      const plantY = height - 80;
      const stages = ['sonnenherz_stage_0_seed.webp', 'sonnenherz_stage_1_sprout.webp', 'sonnenherz_stage_2_juvenile.webp', 'sonnenherz_stage_3_adult.webp'];
      const ambientPlant = this.add.image(plantX, plantY, 'plants_sprint_0', stages[0]).setOrigin(0.5, 1).setScale(0.6).setAlpha(0.7);
      // D-041 Run9: Idle-Breathing fuer Ambient-Plants
      // FI Art-UI R1: i-Variable-Bug behoben (war undefiniert in diesem Scope)
      this.tweens.add({
        targets: ambientPlant,
        scaleY: 0.63,
        scaleX: 0.57,
        duration: 1800,
        ease: 'Sine.InOut',
        yoyo: true,
        repeat: -1,
        delay: 200
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
    }

    void _settingsBtn; void _helpBtn; void newGameBtn; void title; void tagline; void leafL; void leafR;
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
        body: 'Sammle, züchte plus kämpfe mit Pflanzen. Jede Spezies hat\nDNA die du kombinieren kannst um neue Hybriden zu schaffen.'
      },
      {
        title: 'Cozy plus Strategisch',
        body: 'Garten-Hub für Pflege plus Züchten.\nWelt-Erkundung für Wild-Encounter plus Quests.\nKein Stress: dein Tempo bestimmt der Tag.'
      },
      {
        title: 'Tipps zum Start',
        body: 'X = Kreuzen plus G = Garten plus W = Welt\nKlick einen leeren Slot um zu pflanzen\nKlick eine Pflanze für Detail-Panel'
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

  shutdown(): void {
    // Cleanup: alle Tweens + Timer der MenuScene beenden (kein Memory-Leak beim Scene-Wechsel)
    this.tweens.killAll();
    this.time.removeAllEvents();
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
    // D-041 R22: Hover/Press polish — fill tint + text brighten + scale
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
