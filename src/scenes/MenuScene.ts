import Phaser from 'phaser';
import { loadGame } from '../state/storage';
import { gameStore } from '../state/gameState';
import { startAmbientBGM, sfx } from '../audio/sfxGenerator';

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

    // Title
    const _title = this.add.text(cx, plantY + 75, 'Plantinvasion', {
      fontFamily: 'monospace', fontSize: '36px', color: '#9be36e'
    }).setOrigin(0.5);
    const _subtitle = this.add.text(cx, plantY + 110, 'Cozy Botanik-RPG', {
      fontFamily: 'monospace', fontSize: '12px', color: '#8a6e4a'
    }).setOrigin(0.5);

    const save = loadGame();

    let by = plantY + 170;
    if (save) {
      void this.makeButton(cx, by, 'Weiterspielen', '#9be36e', () => {
        sfx.dialogAdvance();
        startAmbientBGM();
        // Garten ist Herzstueck: Default auf GardenScene
        const target = save.overworld?.lastSceneVisited ?? 'GardenScene';
        this.scene.start(target);
      });
      by += 60;
    }
    const _newGameBtn = this.makeButton(cx, by, save ? 'Neues Spiel' : 'Spiel starten', '#fcd95c', () => {
      // V0.2 (Critic-Review-Fix): Bei Neues-Spiel direkt in OverworldScene
      // mit Tutorial-Step 0. Vorher startete man in GardenScene mit
      // einer einsamen Sunflower und kam sich verloren vor.
      gameStore.resetToNewGame();
      gameStore.advanceTutorial(0);
      sfx.dialogAdvance();
      startAmbientBGM();
      this.scene.start('OverworldScene');
    });
    by += 60;
    const _settingsBtn = this.makeButton(cx, by, 'Einstellungen', '#8eaedd', () => {
      sfx.dialogAdvance();
      this.scene.start('SettingsScene');
    });
    by += 60;
    const _helpBtn = this.makeButton(cx, by, 'Hilfe & Hotkeys', '#fcd95c', () => {
      sfx.dialogAdvance();
      this.scene.start('HelpScene');
    });
    by += 60;

    const _hint = this.add.text(cx, height - 24, 'v0.8 - Brave Browser empfohlen', {
      fontFamily: 'monospace', fontSize: '10px', color: '#553e2d'
    }).setOrigin(0.5);
    void _hint; void _title; void _subtitle; void _newGameBtn; void _settingsBtn; void _helpBtn;
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
    // S-POLISH-09: Hover-State (Scale 1.05 plus Border-Glow auf 3px)
    bg.on('pointerover', () => {
      this.tweens.add({ targets: c, scale: 1.05, duration: 120, ease: 'Cubic.Out' });
      bg.setStrokeStyle(3, accentColor);
      sfx.dialogAdvance();
    });
    bg.on('pointerout', () => {
      this.tweens.add({ targets: c, scale: 1.0, duration: 120, ease: 'Cubic.Out' });
      bg.setStrokeStyle(2, accentColor);
      bg.setFillStyle(0x000000, 0.65);
    });
    bg.on('pointerdown', () => { bg.setFillStyle(accentColor, 0.4); });
    bg.on('pointerup', () => { bg.setFillStyle(0x000000, 0.65); onClick(); });
    c.add([bg, txt]);
    return c;
  }
}
