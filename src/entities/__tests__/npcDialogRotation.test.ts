/**
 * B4-R8: NPC-Dialog-Rotation und Memory Tests
 */
import { describe, it, expect } from 'vitest';
import {
  getNpcScheduleTarget,
  getNpcMemoryDialog,
  addToDialogHistory,
  getDialogHistory,
  NPC_SCHEDULES,
} from '../../entities/npcDialogSystem';

describe('NPC-Schedule', () => {
  it('iris hat schedule fuer alle tageszeiten', () => {
    const times = ['morning', 'day', 'evening', 'night'] as const;
    times.forEach((t) => {
      const target = getNpcScheduleTarget('iris', t);
      expect(target).toBeDefined();
      expect(target!.tileX).toBeGreaterThan(0);
      expect(target!.tileY).toBeGreaterThan(0);
    });
  });

  it('unbekannter npc gibt undefined', () => {
    expect(getNpcScheduleTarget('unknown_npc', 'morning')).toBeUndefined();
  });

  it('market_npc tagsüber immer am gleichen ort', () => {
    const morning = getNpcScheduleTarget('market_npc', 'morning');
    const day = getNpcScheduleTarget('market_npc', 'day');
    expect(morning?.tileX).toBe(day?.tileX);
    expect(morning?.tileY).toBe(day?.tileY);
  });

  it('alle schedules haben 4 eintraege', () => {
    Object.values(NPC_SCHEDULES).forEach((schedule) => {
      expect(schedule).toHaveLength(4);
    });
  });
});

describe('NPC-Memory-Dialog', () => {
  it('iris begruessungstext ohne flags', () => {
    const dialog = getNpcMemoryDialog('iris', {});
    expect(dialog).toBeTruthy();
    expect(typeof dialog).toBe('string');
  });

  it('iris erinnert sich an abgeschlossene quest', () => {
    const dialog = getNpcMemoryDialog('iris', { quest_1_completed: true });
    expect(dialog).toContain('letzte Woche');
  });

  it('tilda warnt vor verodynicus wenn getroffen', () => {
    const dialog = getNpcMemoryDialog('tilda', { met_verodynicus: true });
    expect(dialog).toContain('Verodynicus');
  });

  it('unbekannter npc gibt undefined', () => {
    const dialog = getNpcMemoryDialog('unknown_npc', {});
    expect(dialog).toBeUndefined();
  });
});

describe('NPC-Dialog-History', () => {
  it('dialog wird zur history hinzugefuegt', () => {
    const history = addToDialogHistory({}, 'iris', 'Hallo!');
    expect(history['iris']).toHaveLength(1);
    expect(history['iris'][0]).toBe('Hallo!');
  });

  it('neuer dialog wird vorne eingefuegt (LIFO)', () => {
    let history = addToDialogHistory({}, 'iris', 'Erster Dialog');
    history = addToDialogHistory(history, 'iris', 'Zweiter Dialog');
    expect(history['iris'][0]).toBe('Zweiter Dialog');
    expect(history['iris'][1]).toBe('Erster Dialog');
  });

  it('max 5 eintraege pro npc', () => {
    let history: Record<string, string[]> = {};
    for (let i = 0; i < 10; i++) {
      history = addToDialogHistory(history, 'iris', `Dialog ${i}`);
    }
    expect(history['iris']).toHaveLength(5);
  });

  it('getDialogHistory gibt leeres array fuer unbekannte npc', () => {
    const result = getDialogHistory({}, 'unknown_npc');
    expect(result).toEqual([]);
  });

  it('verschiedene npcs haben getrennte histories', () => {
    let history = addToDialogHistory({}, 'iris', 'Iris-Dialog');
    history = addToDialogHistory(history, 'tilda', 'Tilda-Dialog');
    expect(getDialogHistory(history, 'iris')).toHaveLength(1);
    expect(getDialogHistory(history, 'tilda')).toHaveLength(1);
    expect(history['iris'][0]).toBe('Iris-Dialog');
    expect(history['tilda'][0]).toBe('Tilda-Dialog');
  });
});
