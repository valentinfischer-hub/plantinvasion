import Phaser from 'phaser';
import { sfx } from '../audio/sfxGenerator';
import { COLOR_REWARD, COLOR_SUCCESS, FONT_FAMILY, FONT_SIZE_BODY, FONT_SIZE_TITLE, MODAL_BORDER_COLOR } from '../ui/uiTheme';
import { t } from '../i18n/index';
interface HelpSection {
  title: string;
  lines: string[];
}

/** B4-R2: Tabs fuer HelpScene */
const HELP_TABS: { label: string; sections: HelpSection[] }[] = [
  {
    label: 'Steuerung',
    sections: [
      {
        title: '⌨ Bewegung & Welt',
        lines: [
          '⬆⬇⬅➡ / WASD  — bewege dich Tile-für-Tile',
          'Shift halten  — rennen',
          'E / Space  — mit NPCs reden, Schilder lesen',
          'Karten-Rand  — wechselt automatisch ins Nachbar-Biom'
        ]
      },
      {
        title: '⌨ Hotkeys Overworld',
        lines: [
          'W  — zurück zur Weltkarte',
          'G  — Garten öffnen',
          'I  — Inventar öffnen',
          'P  — Pokedex öffnen',
          'Q  — Quest-Log öffnen',
          'M  — Markt öffnen',
          'T  — Tagebuch öffnen',
          'H  — Hilfe (dieses Fenster)',
          'Esc  — Pause-Menu / Zurück'
        ]
      },
      {
        title: '⌨ Hotkeys Garten',
        lines: [
          'S  — Pflanze einsäen Modal',
          'X  — Erste 2 Pflanzen kreuzen',
          'O  — Zurück zur Welt',
          'Klick  — Detail-Panel mit Stats'
        ]
      }
    ]
  },
  {
    label: 'Garten',
    sections: [
      {
        title: 'Pflanzen pflanzen',
        lines: [
          'Drücke S um das Säen-Modal zu öffnen',
          'Wähle einen Samen aus dem Inventar',
          'Pflanzen wachsen durch Wasser und Zeit',
          'Level 10+ = erntebereit'
        ]
      },
      {
        title: 'Wasser & Boden',
        lines: [
          'Helle Braun = trocken, Dunkel = feucht, Blau = übergossen',
          'Gieße täglich für schnelles Wachstum',
          'Soil-Tier beeinflusst Mutations-Bonus',
          'Companion-Pflanzen geben Nachbar-Bonus'
        ]
      },
      {
        title: 'Wachstum & Ernte',
        lines: [
          'XP durch Ticks alle 30 Sek gesammelt',
          'Level-Up zeigt Funken-Animation',
          'Booster-Items für schnelleres Wachstum',
          'Ernte gibt Coins basierend auf Level und Seltenheit'
        ]
      }
    ]
  },
  {
    label: 'Zucht',
    sections: [
      {
        title: 'Crossing Grundlagen',
        lines: [
          'Klicke "Kreuzen" Button oder drücke X',
          'Beide Eltern brauchen Level 5+',
          'Kind erhaelt gemittelte Stats (+/- 10%)',
          'Kosten: 50 Coins pro Crossing'
        ]
      },
      {
        title: 'Hybrid-Recipes',
        lines: [
          '10 geheime Hybrid-Rezepte zu entdecken',
          'Bestimmte Arten-Kombinationen = neue Spezies',
          'Hybriden sind staerker als normale Kreuzungen',
          'Hybrid-Booster-Item erhoehte Mutations-Chance'
        ]
      },
      {
        title: 'Punnett-Quadrat',
        lines: [
          'Im Vorschau-Modal: ATK / DEF / SPD Vergleich',
          'Raute (◆) = dominantes Allel (höher)',
          'Kreis (◇) = rezessives Allel (tiefer)',
          'Kind nimmt Mittelwert beider Eltern'
        ]
      }
    ]
  },
  {
    label: 'Kampf',
    sections: [
      {
        title: 'Battle-Grundlagen',
        lines: [
          'Jede Pflanze hat 4 Moves',
          'Moves haben PP (Power Points) — begrenzte Nutzungen',
          'Rast in der Welt fuellt PP auf',
          'Reihenfolge nach SPD-Stat'
        ]
      },
      {
        title: 'Damage & Bonus',
        lines: [
          'STAB: Move aus eigener Familie = +50% Schaden',
          'Crit-Chance: 6.25% für 1.5x Schaden',
          'Accuracy: 100% / 95% / 85% je nach Move',
          'Miss-Animation wenn Angriff fehlschlaegt'
        ]
      },
      {
        title: 'Status & Capture',
        lines: [
          'Status-Effekte: welk, vergiftet, schlaf, wurzeln, pilz',
          'Capture mit Lockstoff-Items (basic-lure, great-lure)',
          'Battle-Drops: 25% Chance auf Samen nach Sieg',
          'Boss-Battles in jedem Biom'
        ]
      }
    ]
  }
];

/** Kontextuelle Hilfe pro Scene */
export const SCENE_HELP_HINT: Record<string, string> = {
  GardenScene: 'Garten',
  BattleScene: 'Kampf',
  OverworldScene: 'Steuerung',
  MarketScene: 'Steuerung',
  PokedexScene: 'Zucht',
};

export class HelpScene extends Phaser.Scene {
  private activeTab = 0;
  private contentContainer!: Phaser.GameObjects.Container;
  private tabBtns: Phaser.GameObjects.Text[] = [];
  private tabBgs: Phaser.GameObjects.Rectangle[] = [];
  private scrollY = 0;
  private maxScrollY = 0;
  private readonly viewportTop = 90;
  private viewportBottom = 0;
  /** Von welcher Scene kommt der Spieler? (fuer "Zurück"-Button) */
  private fromScene = 'MenuScene';

  constructor() {
    super('HelpScene');
  }

  init(data: { fromScene?: string; tabHint?: string }): void {
    this.fromScene = data?.fromScene ?? 'MenuScene';
    if (data?.tabHint) {
      const idx = HELP_TABS.findIndex((t) => t.label === data.tabHint);
      if (idx >= 0) this.activeTab = idx;
    }
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#1a2820');
    // D-041 R30: FadeIn fuer konsistente Scene-Transitions
    this.cameras.main.fadeIn(250, 0, 0, 0);
    this.viewportBottom = height - 54;
    this.tabBtns = [];
    this.tabBgs = [];

    // Titel
    this.add.text(width / 2, 20, t('help.title'), {
      fontFamily: FONT_FAMILY, fontSize: '20px', color: COLOR_SUCCESS
    }).setOrigin(0.5);

    // Tab-Leiste
    const tabW = Math.floor((width - 20) / HELP_TABS.length);
    HELP_TABS.forEach((tab, i) => {
      const tx = 10 + i * tabW + tabW / 2;
      const tabBg = this.add.rectangle(tx, 54, tabW - 4, 24, 0x000000, 0.7)
        .setStrokeStyle(1, MODAL_BORDER_COLOR)
        .setInteractive({ useHandCursor: true });
      const tabTxt = this.add.text(tx, 54, tab.label, {
        fontFamily: FONT_FAMILY, fontSize: '11px', color: '#aaaaaa'
      }).setOrigin(0.5);
      tabBg.on('pointerdown', () => this.switchTab(i));
      this.tabBgs.push(tabBg);
      this.tabBtns.push(tabTxt);
    });

    // Content-Container
    this.contentContainer = this.add.container(0, this.viewportTop);

    // Scroll-Mask
    const mask = this.add.graphics();
    mask.fillRect(0, this.viewportTop, width, this.viewportBottom - this.viewportTop);
    this.contentContainer.setMask(mask.createGeometryMask());

    this.switchTab(this.activeTab);

    // Scroll-Input
    this.input.on('wheel', (_p: unknown, _gos: unknown, _dx: number, dy: number) => {
      this.scrollBy(dy * 0.8);
    });
    if (this.input.keyboard) {
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP).on('down', () => this.scrollBy(-30));
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN).on('down', () => this.scrollBy(30));
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT).on('down', () => this.switchTab(Math.max(0, this.activeTab - 1)));
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT).on('down', () => this.switchTab(Math.min(HELP_TABS.length - 1, this.activeTab + 1)));
    }

    // Zurück-Button
    const backY = height - 24;
    const backBg = this.add
      .rectangle(width / 2, backY, 180, 26, 0x000000, 0.7)
      .setStrokeStyle(1, MODAL_BORDER_COLOR)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, backY, t('help.back'), {
      fontFamily: FONT_FAMILY, fontSize: '12px', color: COLOR_SUCCESS
    }).setOrigin(0.5);
    const back = () => { sfx.click(); this.scene.start(this.fromScene); };
    backBg.on('pointerup', back);
    if (this.input.keyboard) {
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', back);
    }
  }

  private switchTab(idx: number): void {
    this.activeTab = idx;
    this.scrollY = 0;

    // Tab-Farben aktualisieren
    this.tabBtns.forEach((btn, i) => {
      btn.setColor(i === idx ? '#fcd95c' : '#aaaaaa');
    });
    this.tabBgs.forEach((bg, i) => {
      bg.setStrokeStyle(i === idx ? 2 : 1, i === idx ? 0xfcd95c : MODAL_BORDER_COLOR);
      bg.setFillStyle(0x000000, i === idx ? 0.9 : 0.5);
    });

    // Content leeren und neu aufbauen
    this.contentContainer.removeAll(true);
    const { width } = this.scale;
    const tab = HELP_TABS[idx];
    let by = 0;

    tab.sections.forEach((sec) => {
      // Abschnitts-Titel
      const head = this.add.text(width / 2, by, sec.title, {
        fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_TITLE, color: COLOR_REWARD, fontStyle: 'bold'
      }).setOrigin(0.5, 0);
      this.contentContainer.add(head);
      by += 24;

      sec.lines.forEach((line) => {
        const txt = this.add.text(width / 2, by, line, {
          fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_BODY, color: '#dddddd',
          wordWrap: { width: width - 60 }, align: 'center'
        }).setOrigin(0.5, 0);
        this.contentContainer.add(txt);
        by += 18;
      });
      by += 12;
    });

    this.maxScrollY = Math.max(0, by - (this.viewportBottom - this.viewportTop));
    this.contentContainer.y = this.viewportTop;
    this.updateVisibility();
  }

  private scrollBy(dy: number): void {
    this.scrollY = Math.max(0, Math.min(this.maxScrollY, this.scrollY + dy));
    this.contentContainer.y = this.viewportTop - this.scrollY;
    this.updateVisibility();
  }

  private updateVisibility(): void {
    this.contentContainer.list.forEach((item) => {
      const obj = item as Phaser.GameObjects.Text;
      const absoluteY = this.contentContainer.y + obj.y;
      const visible = absoluteY > this.viewportTop - 24 && absoluteY < this.viewportBottom + 8;
      obj.setVisible(visible);
    });
  }
}
