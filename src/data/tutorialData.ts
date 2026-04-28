/**
 * Tutorial-Schritt-Daten (ohne Phaser-Abhängigkeit, testbar).
 */
export interface TutorialStep {
  step: number;
  title: string;
  text: string;
  advanceWhen?: (ctx: { tileX: number; tileY: number; facing: string; isMoving: boolean; lastInteract?: string }) => boolean;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    step: 0,
    title: 'Willkommen in Wurzelheim',
    text: 'Du bist die wandernde Botanikerin. Druecke [Weiter] um zu beginnen.'
  },
  {
    step: 1,
    title: 'Bewegung',
    text: 'Bewege dich mit WASD oder den Pfeiltasten. Halte Shift fuer Rennen.\nLaufe einen Tile in eine Richtung.',
    advanceWhen: (ctx) => ctx.tileX !== 14 || ctx.tileY !== 17
  },
  {
    step: 2,
    title: 'NPCs ansprechen',
    text: 'Anya, Bjoern und Clara warten in der Naehe der Marktstaende.\nLaufe zu einem NPC und druecke E um zu reden.',
    advanceWhen: (ctx) => ctx.lastInteract === 'npc'
  },
  {
    step: 3,
    title: 'Garten betreten',
    text: 'Die goldene Tuer am Spielerhaus (oben in der Mitte) fuehrt zum Garten.\nDort waechst dein Sonnenblumen-Setzling. X kreuzt 2 Pflanzen, O bringt zurueck.',
    advanceWhen: (ctx) => ctx.lastInteract === 'garden'
  },
  {
    step: 4,
    title: 'Hotkeys merken',
    text: 'M = Markt   P = Pokedex   Q = Quests\nE = NPC reden   Shift = Rennen\n\nViel Spass beim Erkunden!'
  }
];
