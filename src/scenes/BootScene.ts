import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    // Splash UI im preload (so kann der Benutzer den Lade-Status sehen)
    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;

    this.add.text(cx, cy - 20, 'Plantinvasion', {
      fontFamily: 'monospace', fontSize: '32px', color: '#9be36e'
    }).setOrigin(0.5);
    const status = this.add.text(cx, cy + 14, 'loading 0%', {
      fontFamily: 'monospace', fontSize: '11px', color: '#888888'
    }).setOrigin(0.5);

    this.load.on('progress', (v: number) => {
      status.setText(`loading ${Math.round(v * 100)}%`);
    });

    // Plant-Sprites fuer GreenhouseScene (Legacy-Loader, bleibt fuer Backward-Compat)
    const species = ['sunflower', 'spike-cactus', 'venus-flytrap', 'lavender', 'tomato-plant'];
    const stageFiles = ['00_seed', '01_sprout', '02_juvenile', '03_adult', '04_blooming'];
    species.forEach((slug) => {
      stageFiles.forEach((sf, idx) => {
        this.load.image(`${slug}-${idx}`, `assets/sprites/plants/${slug}/${sf}.png`);
      });
    });

    // Sprint 0+1 Atlas-Pack (Art-UI Generation 2026-04-26).
    // 12 Pflanzen-Spezies, 16 Boden-Tile-Variationen, UI-Frames.
    // Frame-Names siehe public/assets/atlases/*.json.
    // Bindung an species-Map plus GardenScene-Tiles erfolgt im naechsten Tech-Code-Run.
    this.load.atlas('plants_sprint_0', 'assets/atlases/plants_sprint_0.webp', 'assets/atlases/plants_sprint_0.json');
    this.load.atlas('plants_sprint_1', 'assets/atlases/plants_sprint_1.webp', 'assets/atlases/plants_sprint_1.json');
    this.load.atlas('ground_sprint_1', 'assets/atlases/ground_sprint_1.webp', 'assets/atlases/ground_sprint_1.json');
    this.load.atlas('ui_sprint_0', 'assets/atlases/ui_sprint_0.webp', 'assets/atlases/ui_sprint_0.json');

    // Boden-Tile-Variationen einzeln (16 Files: erdig/steinig/moosig/aschig je 4 Varianten).
    // Erst-Bindung in GardenScene per Slot-Index modulo 4 fuer visuelle Vielfalt.
    const groundTypes = ['erdig', 'steinig', 'moosig', 'aschig'];
    groundTypes.forEach((type) => {
      for (let v = 1; v <= 4; v++) {
        this.load.image(`ground_${type}_v${v}`, `assets/sprites/tiles/ground_${type}_v${v}.webp`);
      }
    });
  }

  create(): void {
    console.log('[BootScene] create called, switching to OverworldScene');
    // Explicit stop+start, weil bei Phaser 3.90 scene.start aus create der Boot-Scene
    // den Switch nicht zuverlaessig durchsetzt. Tool-Learning siehe brain/tech/tool_learnings.md
    this.scene.start('OverworldScene');
    this.scene.stop('BootScene');
  }
}
