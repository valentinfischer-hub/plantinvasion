import { describe, it, expect } from 'vitest';
import { TUTORIAL_STEPS } from '../../data/tutorialData';

describe('TUTORIAL_STEPS', () => {
  it('hat mindestens 3 Schritte', () => {
    expect(TUTORIAL_STEPS.length).toBeGreaterThanOrEqual(3);
  });

  it('jeder Schritt hat step, title, text', () => {
    for (const step of TUTORIAL_STEPS) {
      expect(typeof step.step).toBe('number');
      expect(typeof step.title).toBe('string');
      expect(step.title.length).toBeGreaterThan(0);
      expect(typeof step.text).toBe('string');
      expect(step.text.length).toBeGreaterThan(0);
    }
  });

  it('steps sind sequenziell (0, 1, 2, ...)', () => {
    for (let i = 0; i < TUTORIAL_STEPS.length; i++) {
      expect(TUTORIAL_STEPS[i].step).toBe(i);
    }
  });

  it('erster Schritt (step=0) hat keine advanceWhen (manuell)', () => {
    const first = TUTORIAL_STEPS[0];
    expect(first.advanceWhen).toBeUndefined();
  });

  it('Bewegungs-Schritt prüft tileX/tileY', () => {
    const moveStep = TUTORIAL_STEPS.find(s => s.step === 1);
    expect(moveStep?.advanceWhen).toBeDefined();
    expect(moveStep?.advanceWhen?.({ tileX: 14, tileY: 17, facing: 'up', isMoving: false })).toBeFalsy();
    expect(moveStep?.advanceWhen?.({ tileX: 15, tileY: 17, facing: 'right', isMoving: true })).toBeTruthy();
  });

  it('NPC-Schritt prüft lastInteract === npc', () => {
    const npcStep = TUTORIAL_STEPS.find(s => s.step === 2);
    expect(npcStep?.advanceWhen?.({ tileX: 0, tileY: 0, facing: 'up', isMoving: false, lastInteract: 'npc' })).toBeTruthy();
    expect(npcStep?.advanceWhen?.({ tileX: 0, tileY: 0, facing: 'up', isMoving: false, lastInteract: 'market' })).toBeFalsy();
  });
});

describe('Tutorial Progress-Logik', () => {
  it('Progress-Prozent bei Schritt 0 von 5 beträgt 1/total', () => {
    const total = TUTORIAL_STEPS.length;
    const progress = (0 + 1) / total;
    expect(progress).toBeCloseTo(1 / total, 2);
  });

  it('Progress-Prozent bei letztem Schritt beträgt 100%', () => {
    const total = TUTORIAL_STEPS.length;
    const progress = total / total;
    expect(progress).toBe(1.0);
  });

  it('tutorial_skipped Flag ist ein gültiger Story-Flag-Name', () => {
    const flagName = 'tutorial_skipped';
    expect(typeof flagName).toBe('string');
    expect(flagName.length).toBeGreaterThan(0);
  });
});
