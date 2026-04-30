/**
 * ObjectPool<T> - Generischer Object-Pool fuer Phaser GameObjects.
 *
 * Reduziert GC-Pressure bei Partikel-Systemen, Geschossen, Effekten.
 *
 * Usage:
 *   const pool = new ObjectPool(() => scene.add.text(0,0,''), 20);
 *   const obj = pool.get();
 *   obj.setVisible(true).setPosition(x, y);
 *   // Wenn fertig:
 *   pool.release(obj);
 *
 * S-POLISH Batch 5 Run 6
 */
export class ObjectPool<T extends { setVisible: (v: boolean) => T; setActive: (v: boolean) => T }> {
  private _free: T[] = [];
  private _used: Set<T> = new Set();
  private _factory: () => T;

  constructor(factory: () => T, initialSize = 10) {
    this._factory = factory;
    for (let i = 0; i < initialSize; i++) {
      const obj = factory();
      obj.setVisible(false).setActive(false);
      this._free.push(obj);
    }
  }

  /** Holt ein Objekt aus dem Pool (oder erstellt ein neues). */
  get(): T {
    let obj: T;
    if (this._free.length > 0) {
      obj = this._free.pop()!;
    } else {
      obj = this._factory();
    }
    obj.setVisible(true).setActive(true);
    this._used.add(obj);
    return obj;
  }

  /** Gibt ein Objekt zurueck in den Pool. */
  release(obj: T): void {
    if (!this._used.has(obj)) return;
    this._used.delete(obj);
    obj.setVisible(false).setActive(false);
    this._free.push(obj);
  }

  /** Gibt alle aktiven Objekte zurueck. */
  releaseAll(): void {
    for (const obj of this._used) {
      obj.setVisible(false).setActive(false);
      this._free.push(obj);
    }
    this._used.clear();
  }

  /** Wie viele Objekte sind aktuell aktiv? */
  get activeCount(): number { return this._used.size; }

  /** Wie viele Objekte sind frei? */
  get freeCount(): number { return this._free.length; }

  /** Total Poolgroesse. */
  get totalSize(): number { return this._free.length + this._used.size; }

  destroy(): void {
    this._free = [];
    this._used.clear();
  }
}
