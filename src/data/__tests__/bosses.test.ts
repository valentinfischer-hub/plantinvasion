import { describe, it, expect } from 'vitest';
import { BOSSES, getBoss, getBossesForZone } from '../bosses';

describe('BOSSES Datenstruktur', () => {
  it('hat mindestens 3 Bosses', () => {
    expect(BOSSES.length).toBeGreaterThanOrEqual(3);
  });

  it('jeder Boss hat id, name, zone', () => {
    for (const b of BOSSES) {
      expect(b.id).toBeTruthy();
      expect(b.name).toBeTruthy();
      expect(b.zone).toBeTruthy();
    }
  });

  it('keine duplizierten ids', () => {
    const ids = BOSSES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getBoss', () => {
  it('liefert Boss bei bekannter id', () => {
    const first = BOSSES[0];
    expect(getBoss(first.id)).toEqual(first);
  });
  it('liefert undefined bei unbekannter id', () => {
    expect(getBoss('not-a-boss')).toBeUndefined();
  });
});

describe('getBossesForZone', () => {
  it('liefert Bosses in der zone', () => {
    const zone = BOSSES[0].zone;
    const r = getBossesForZone(zone);
    expect(r.length).toBeGreaterThan(0);
    for (const b of r) expect(b.zone).toBe(zone);
  });
  it('leeres Array bei unbekannter zone', () => {
    expect(getBossesForZone('not-a-zone')).toEqual([]);
  });
});
