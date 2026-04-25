import Phaser from 'phaser';
import { gameStore } from '../state/gameState';

/**
 * Tildas Tagebuch: zeigt alle gesammelten Eintraege der Story.
 * Aufgerufen via T-Hotkey aus OverworldScene.
 *
 * Eintraege sind eigene Story-Texte (frei erfunden).
 */

interface DiaryEntryDef {
  id: number;
  date: string;
  title: string;
  content: string;
}

export const DIARY_ENTRIES: DiaryEntryDef[] = [
  {
    id: 1,
    date: 'Eintrag 1, vor 30 Jahren',
    title: 'Aufbruch nach Botanopia',
    content: 'Ich habe das Buendel meiner Grossmutter auf den Schultern. Sie hat mir das Tagebuch hinterlassen. Verodyne ist staerker geworden. Ich werde jeden Winkel von Botanopia dokumentieren.'
  },
  {
    id: 2,
    date: 'Eintrag 2, Wurzelheim',
    title: 'Iris die Wandernde',
    content: 'Iris Salbeyen hat mich am Dorfteich abgepasst. Sie kannte Tilda persoenlich. Sie sagt, Tilda lebt vielleicht noch. Eine seltsame Hoffnung.'
  },
  {
    id: 3,
    date: 'Eintrag 3, Wurzelheim',
    title: 'Bjoerns Bericht',
    content: 'Bjoern hat vor Jahren beobachtet wie Verodyne-Soldaten Pestizide in den Fluss kippten. Niemand hat ihm geglaubt. Ich glaube ihm.'
  },
  {
    id: 4,
    date: 'Eintrag 4, Verdanto',
    title: 'Tropische Welt',
    content: 'Verdanto ist anders als Wurzelheim. Bromelien wachsen hier auf jedem Ast. Die Luft ist schwer. Ich finde Spuren von Tildas alten Pflanz-Experimenten.'
  },
  {
    id: 5,
    date: 'Eintrag 5, Verdanto',
    title: 'Lyras Forschung',
    content: 'Lyra forscht hier seit Jahren gegen Verodyne. Sie ist Bromelien-Expertin. Wir tauschen Daten. Sie erzaehlt, dass Tildas letzte Spur in Kaktoria war.'
  },
  {
    id: 6,
    date: 'Eintrag 6, Verdanto',
    title: 'Verodyne-Lager entdeckt',
    content: 'Captain Schimmelpilz fiel im Kampf, ich konnte ein Verodyne-Dokument retten. Es spricht von einem "Eden Lost" Projekt. Was zur Hoelle ist Eden Lost?'
  },
  {
    id: 12,
    date: 'Eintrag 12, Kaktoria',
    title: 'Tildas Hoehle',
    content: 'In einer geheimen Hoehle: Tildas Pflanzensammlung. Ueberlebenspflanzen, die sie hier vor Verodyne versteckt hat. Sie hatte einen Plan. Sie hat etwas vor.'
  },
  {
    id: 18,
    date: 'Eintrag 18, Frostkamm',
    title: 'Tilda lebt',
    content: 'Iris zeigte mir Tildas Handschuh. Frisch. Frisch! Sie ist noch da draussen. Sie kaempft. Ich werde sie finden.'
  },
  {
    id: 25,
    date: 'Eintrag 25, Mordwald',
    title: 'Sumpf-Schamanin Morag',
    content: 'Morag spricht mit den Pflanzen. Wirklich, sie spricht mit ihnen. Pitcher of Death war ihre groesste Pruefung. Wir haben ihn besiegt. Sie gibt mir das Sumpf-Symbol.'
  },
  {
    id: 32,
    date: 'Eintrag 32, Magmabluete',
    title: 'Magmus Rex',
    content: 'Magmus Rex war Verodynes ultimatives Pflanzenexperiment. Caspar Verodynicus hat ihn erschaffen. Wir haben ihn besiegt. Pyra sagt, das war erst der Anfang.'
  },
  {
    id: 50,
    date: 'Eintrag 50, Eden Lost',
    title: 'Tildas Wahrheit',
    content: 'Tilda lebt. Alt aber lebendig. Sie hat 15 Jahre versteckt geforscht in Eden Lost. Caspar war ihr Forscherkollege. Sie haben gemeinsam Verodyne gegruendet. Er hat den Pfad der Manipulation gewaehlt. Sie den der Bewahrung.'
  },
  {
    id: 100,
    date: 'Eintrag 100, Botanopia',
    title: 'Heimkehr',
    content: 'Verodynicus ist gefallen. Eden Lost ist offen. Botanopia kann atmen. Die Pflanzen erholen sich. Tilda ist alt, aber frei. Wir feiern in Wurzelheim. Es ist gut.'
  }
];

export class DiaryScene extends Phaser.Scene {
  private entries: DiaryEntryDef[] = [];
  private currentIdx = 0;
  private titleText!: Phaser.GameObjects.Text;
  private dateText!: Phaser.GameObjects.Text;
  private contentText!: Phaser.GameObjects.Text;
  private indexText!: Phaser.GameObjects.Text;

  constructor() {
    super('DiaryScene');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#1f2417');

    // Titel
    this.add.text(width / 2, 24, 'Tildas Tagebuch', {
      fontFamily: 'monospace', fontSize: '20px', color: '#fcd95c'
    }).setOrigin(0.5);

    const collected = gameStore.getDiaryEntries();
    this.entries = DIARY_ENTRIES.filter((e) => collected.includes(e.id));

    if (this.entries.length === 0) {
      this.add.text(width / 2, height / 2, 'Noch keine Eintraege gesammelt.\nLoese Story-Quests um Tildas Geschichte zu erfahren.', {
        fontFamily: 'monospace', fontSize: '11px', color: '#8a6e4a',
        align: 'center', wordWrap: { width: width - 40 }
      }).setOrigin(0.5);
    } else {
      // Buch-Anzeige
      const bookY = 80;
      const bookH = height - 160;
      this.add.rectangle(width / 2, bookY + bookH / 2, width - 30, bookH, 0x2d2418, 0.95)
        .setStrokeStyle(2, 0x8b6e3a);
      this.dateText = this.add.text(width / 2, bookY + 14, '', {
        fontFamily: 'monospace', fontSize: '10px', color: '#8b6e3a'
      }).setOrigin(0.5);
      this.titleText = this.add.text(width / 2, bookY + 36, '', {
        fontFamily: 'monospace', fontSize: '14px', color: '#fcd95c', fontStyle: 'bold'
      }).setOrigin(0.5);
      this.contentText = this.add.text(width / 2, bookY + 80, '', {
        fontFamily: 'monospace', fontSize: '11px', color: '#ffffff',
        wordWrap: { width: width - 60 }, lineSpacing: 4
      }).setOrigin(0.5, 0);
      this.indexText = this.add.text(width / 2, height - 80, '', {
        fontFamily: 'monospace', fontSize: '11px', color: '#9be36e'
      }).setOrigin(0.5);

      // Navigation
      const prevBtn = this.add.rectangle(width / 4, height - 56, 80, 28, 0x222222, 0.9)
        .setStrokeStyle(1, 0x9be36e).setInteractive({ useHandCursor: true });
      const nextBtn = this.add.rectangle((width / 4) * 3, height - 56, 80, 28, 0x222222, 0.9)
        .setStrokeStyle(1, 0x9be36e).setInteractive({ useHandCursor: true });
      this.add.text(width / 4, height - 56, '< Prev', { fontFamily: 'monospace', fontSize: '10px', color: '#9be36e' }).setOrigin(0.5);
      this.add.text((width / 4) * 3, height - 56, 'Next >', { fontFamily: 'monospace', fontSize: '10px', color: '#9be36e' }).setOrigin(0.5);
      prevBtn.on('pointerup', () => this.navigate(-1));
      nextBtn.on('pointerup', () => this.navigate(1));
      if (this.input.keyboard) {
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT).on('down', () => this.navigate(-1));
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT).on('down', () => this.navigate(1));
      }
      this.refresh();
    }

    // Back-Button
    const backBg = this.add.rectangle(width / 2, height - 24, 160, 32, 0x000000, 0.7)
      .setStrokeStyle(1, 0x9be36e)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, height - 24, 'Zurueck (B)', {
      fontFamily: 'monospace', fontSize: '12px', color: '#9be36e'
    }).setOrigin(0.5);
    const back = () => this.scene.start('OverworldScene');
    backBg.on('pointerup', back);
    if (this.input.keyboard) {
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B).on('down', back);
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', back);
    }
  }

  private navigate(delta: number): void {
    if (this.entries.length === 0) return;
    this.currentIdx = (this.currentIdx + delta + this.entries.length) % this.entries.length;
    this.refresh();
  }

  private refresh(): void {
    if (this.entries.length === 0) return;
    const e = this.entries[this.currentIdx];
    this.dateText.setText(e.date);
    this.titleText.setText(e.title);
    this.contentText.setText(e.content);
    this.indexText.setText(`${this.currentIdx + 1} / ${this.entries.length}`);
  }
}
