import Phaser from 'phaser';
import { sfx } from '../audio/sfxGenerator';

interface HelpSection {
  title: string;
  lines: string[];
}

const HELP: HelpSection[] = [
  {
    title: 'Bewegung & Welt',
    lines: [
      'WASD oder Pfeiltasten - bewege dich Tile-fuer-Tile',
      'Shift halten - rennen',
      'E oder Space - mit NPCs reden, Schilder lesen, Tueren oeffnen',
      'Karten-Rand - wechselt automatisch in das angrenzende Biom'
    ]
  },
  {
    title: 'Hotkeys (OverworldScene)',
    lines: [
      'I - Inventar oeffnen',
      'P - Pokedex oeffnen',
      'Q - Quest-Log oeffnen',
      'M - Markt oeffnen',
      'T - Tagebuch oeffnen',
      'H - Heil-Tonikum auf erste Pflanze',
      'K - Boss-Battle starten (wenn Quest aktiv)',
      'Esc - Pause-Menu'
    ]
  },
  {
    title: 'Garten',
    lines: [
      'S - Pflanze einsaeen Modal',
      'X - Erste 2 Pflanzen kreuzen',
      'O - Zurueck zur Welt',
      'Klick auf Pflanze - Detail-Panel mit Stats und Booster',
      '"Kreuzen"-Button - Cross-Mode aktivieren, dann 2 Pflanzen klicken'
    ]
  },
  {
    title: 'Battle',
    lines: [
      'Wahl aus 4 Moves pro Pflanze',
      'Status-Effekte: welk, vergiftet, schlaf, wurzeln, pilz',
      'Capture mit Lockstoff-Items (basic-lure, great-lure)',
      'Battle-Drops: 25% Chance auf Samen nach Sieg',
      'Run mit niedriger Erfolgswahrscheinlichkeit'
    ]
  },
  {
    title: 'Crossing & Hybriden',
    lines: [
      '2 Pflanzen kreuzen erzeugt eine Nachkommen-Pflanze',
      '10 spezifische Hybrid-Recipes erzeugen einzigartige neue Spezies',
      'Mutationen passieren mit kleiner Chance',
      'Hybrid-Booster-Item erhoeht Mutation-Chance'
    ]
  },
  {
    title: 'Wetter & Saison',
    lines: [
      'Wetter wechselt zufaellig (clear, rain, snow, storm, fog)',
      'Regen erhoeht Bromelien-Encounter, Schnee Frostkamm-Encounter',
      'Saison wechselt alle 30 In-Game-Tage',
      'Pflanzen wachsen je nach Biom-Match unterschiedlich schnell'
    ]
  },
  {
    title: 'Story',
    lines: [
      'Sprich mit Iris in Wurzelheim um Akt 1 zu starten',
      'Tildas-Tagebuch zeigt Story-Eintraege',
      '7-Akt Hero-Journey, ca 20h Hauptstory',
      '6 Boss-Battles in den Biomen, Verodyne als Final-Boss'
    ]
  }
];

export class HelpScene extends Phaser.Scene {
  private listContainer!: Phaser.GameObjects.Container;
  private scrollY = 0;
  private maxScrollY = 0;
  private viewportTop = 80;
  private viewportBottom = 0;

  constructor() {
    super('HelpScene');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#1a2820');
    this.viewportBottom = height - 60;

    this.add
      .text(width / 2, 32, 'Hilfe & Hotkeys', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#9be36e'
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, 56, 'Scrollen mit Mouse-Wheel oder Pfeiltasten', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#553e2d'
      })
      .setOrigin(0.5);

    this.listContainer = this.add.container(0, this.viewportTop);
    let by = 0;
    for (const sec of HELP) {
      const head = this.add.text(width / 2, by, sec.title, {
        fontFamily: 'monospace', fontSize: '14px', color: '#fcd95c', fontStyle: 'bold'
      }).setOrigin(0.5, 0);
      this.listContainer.add(head);
      by += 22;
      for (const line of sec.lines) {
        const t = this.add.text(width / 2, by, line, {
          fontFamily: 'monospace', fontSize: '11px', color: '#ffffff',
          wordWrap: { width: width - 80 }, align: 'center'
        }).setOrigin(0.5, 0);
        this.listContainer.add(t);
        by += 16;
      }
      by += 14;
    }
    this.maxScrollY = Math.max(0, by - (this.viewportBottom - this.viewportTop));

    this.input.on('wheel', (_p: unknown, _gos: unknown, _dx: number, dy: number) => {
      this.scrollBy(dy * 0.8);
    });
    if (this.input.keyboard) {
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP).on('down', () => this.scrollBy(-30));
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN).on('down', () => this.scrollBy(30));
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PAGE_UP).on('down', () => this.scrollBy(-(this.viewportBottom - this.viewportTop)));
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PAGE_DOWN).on('down', () => this.scrollBy(this.viewportBottom - this.viewportTop));
    }

    const backY = height - 24;
    const backBg = this.add
      .rectangle(width / 2, backY, 160, 28, 0x000000, 0.7)
      .setStrokeStyle(1, 0x9be36e)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(width / 2, backY, 'Zurueck (Esc)', {
        fontFamily: 'monospace', fontSize: '12px', color: '#9be36e'
      })
      .setOrigin(0.5);
    const back = () => { sfx.click(); this.scene.start('MenuScene'); };
    backBg.on('pointerup', back);
    if (this.input.keyboard) {
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', back);
    }
  }

  private scrollBy(dy: number): void {
    this.scrollY = Math.max(0, Math.min(this.maxScrollY, this.scrollY + dy));
    this.listContainer.y = this.viewportTop - this.scrollY;
    this.listContainer.list.forEach((item) => {
      const obj = item as Phaser.GameObjects.Text;
      const absoluteY = this.listContainer.y + obj.y;
      const visible = absoluteY > this.viewportTop - 20 && absoluteY < this.viewportBottom + 4;
      obj.setVisible(visible);
    });
  }
}
