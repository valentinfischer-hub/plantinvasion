/**
 * ObjectPool Tests - S-POLISH Batch 5 Run 6
 */
import { describe, it, expect, vi } from 'vitest';
import { ObjectPool } from '../objectPool';

// Mock-Objekt
function makeMockObj() {
  const obj = {
    _visible: true,
    _active: true,
    setVisible(v: boolean) { obj._visible = v; return obj; },
    setActive(v: boolean) { obj._active = v; return obj; },
  };
  return obj;
}

describe('ObjectPool', () => {
  it('initialisiert mit angegebenem Size', () => {
    const pool = new ObjectPool(makeMockObj, 5);
    expect(pool.freeCount).toBe(5);
    expect(pool.activeCount).toBe(0);
    expect(pool.totalSize).toBe(5);
  });

  it('get() holt Objekt aus Pool', () => {
    const pool = new ObjectPool(makeMockObj, 3);
    const obj = pool.get();
    expect(obj).toBeDefined();
    expect(pool.activeCount).toBe(1);
    expect(pool.freeCount).toBe(2);
  });

  it('release() gibt Objekt zurueck', () => {
    const pool = new ObjectPool(makeMockObj, 3);
    const obj = pool.get();
    pool.release(obj);
    expect(pool.activeCount).toBe(0);
    expect(pool.freeCount).toBe(3);
  });

  it('get() nach erschoepftem Pool erstellt neues Objekt', () => {
    const pool = new ObjectPool(makeMockObj, 1);
    const a = pool.get();
    const b = pool.get(); // Pool leer, erstellt neues
    expect(pool.activeCount).toBe(2);
    expect(a).not.toBe(b);
  });

  it('releaseAll() gibt alle Objekte frei', () => {
    const pool = new ObjectPool(makeMockObj, 3);
    pool.get(); pool.get(); pool.get();
    expect(pool.activeCount).toBe(3);
    pool.releaseAll();
    expect(pool.activeCount).toBe(0);
    expect(pool.freeCount).toBe(3);
  });

  it('release() eines nicht-aktiven Objekts ist sicher', () => {
    const pool = new ObjectPool(makeMockObj, 2);
    const obj = makeMockObj();
    expect(() => pool.release(obj)).not.toThrow();
  });

  it('destroy() leert den Pool', () => {
    const pool = new ObjectPool(makeMockObj, 3);
    pool.get();
    pool.destroy();
    expect(pool.freeCount).toBe(0);
    expect(pool.activeCount).toBe(0);
  });
});
