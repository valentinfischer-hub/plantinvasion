import { describe, it, expect } from 'vitest';
import wurzelheim from '../wurzelheim';
import verdanto from '../verdanto';
import kaktoria from '../kaktoria';
import frostkamm from '../frostkamm';
import salzbucht from '../salzbucht';
import mordwald from '../mordwald';
import magmabluete from '../magmabluete';
import glaciara from '../glaciara';

const ALL_MAPS = [
  { name: 'wurzelheim', map: wurzelheim },
  { name: 'verdanto', map: verdanto },
  { name: 'kaktoria', map: kaktoria },
  { name: 'frostkamm', map: frostkamm },
  { name: 'salzbucht', map: salzbucht },
  { name: 'mordwald', map: mordwald },
  { name: 'magmabluete', map: magmabluete },
  { name: 'glaciara', map: glaciara }
];

describe('Maps Datenstruktur', () => {
  for (const { name, map } of ALL_MAPS) {
    describe(`${name}.ts`, () => {
      it('hat width und height > 0', () => {
        expect(map.width).toBeGreaterThan(0);
        expect(map.height).toBeGreaterThan(0);
      });

      it('tiles ist 2D-Array mit korrekten Dimensionen', () => {
        expect(map.tiles.length).toBe(map.height);
        for (const row of map.tiles) {
          expect(row.length).toBe(map.width);
        }
      });

      it('alle Tiles sind Numbers', () => {
        for (const row of map.tiles) {
          for (const t of row) {
            expect(typeof t).toBe('number');
          }
        }
      });

      it('playerSpawn liegt im Map-Bereich', () => {
        expect(map.playerSpawn.tileX).toBeGreaterThanOrEqual(0);
        expect(map.playerSpawn.tileX).toBeLessThan(map.width);
        expect(map.playerSpawn.tileY).toBeGreaterThanOrEqual(0);
        expect(map.playerSpawn.tileY).toBeLessThan(map.height);
      });

      it('NPCs haben valide Positionen', () => {
        for (const npc of map.npcs) {
          expect(npc.id).toBeTruthy();
          expect(npc.name).toBeTruthy();
          expect(npc.tileX).toBeGreaterThanOrEqual(0);
          expect(npc.tileX).toBeLessThan(map.width);
          expect(npc.tileY).toBeGreaterThanOrEqual(0);
          expect(npc.tileY).toBeLessThan(map.height);
        }
      });

      it('NPC-IDs sind eindeutig', () => {
        const ids = map.npcs.map(n => n.id);
        expect(new Set(ids).size).toBe(ids.length);
      });
    });
  }
});

describe('Cross-Map-Validierung', () => {
  it('alle Maps haben mindestens 1 NPC', () => {
    for (const { name, map } of ALL_MAPS) {
      expect(map.npcs.length).toBeGreaterThan(0);
      void name;
    }
  });

  it('keine 2 Maps haben identische NPC-IDs', () => {
    const allIds = ALL_MAPS.flatMap(({ map }) => map.npcs.map(n => n.id));
    expect(new Set(allIds).size).toBe(allIds.length);
  });
});
