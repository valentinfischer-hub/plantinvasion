import Phaser from 'phaser';

/**
 * On-Screen Touch-D-Pad fuer Mobile.
 * Setzt programmatisch die Cursor-Keys-Werte des PlayerControllers,
 * sodass die existierende Movement-Logik unveraendert bleibt.
 */

interface TouchHandle {
  pressed: boolean;
}

export interface TouchKeysHandle {
  up: TouchHandle;
  down: TouchHandle;
  left: TouchHandle;
  right: TouchHandle;
  e: TouchHandle;
  setEnabled(v: boolean): void;
}

/** S-POLISH-B2-R15: Swipe-Gesten-Handler fuer OverworldScene */
export function buildSwipeHandler(
  scene: Phaser.Scene,
  onSwipe: (dir: 'up' | 'down' | 'left' | 'right') => void
): void {
  let startX = 0, startY = 0;
  const SWIPE_MIN = 30; // px

  scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
    startX = p.x;
    startY = p.y;
  });
  scene.input.on('pointerup', (p: Phaser.Input.Pointer) => {
    const dx = p.x - startX;
    const dy = p.y - startY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (absDx < SWIPE_MIN && absDy < SWIPE_MIN) return;
    if (absDx > absDy) {
      onSwipe(dx > 0 ? 'right' : 'left');
    } else {
      onSwipe(dy > 0 ? 'down' : 'up');
    }
  });
}

/** S-POLISH-B2-R15: Pinch-to-Zoom auf der Kamera */
export function buildPinchZoom(scene: Phaser.Scene, minZoom = 0.8, maxZoom = 2.5): void {
  let lastPinchDist = 0;
  scene.input.on('pointermove', () => {
    const ptrs = scene.input.manager.pointers.filter((p) => p.isDown);
    if (ptrs.length < 2) {
      lastPinchDist = 0;
      return;
    }
    const [a, b] = ptrs;
    const dist = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
    if (lastPinchDist > 0) {
      const factor = dist / lastPinchDist;
      const cam = scene.cameras.main;
      const newZoom = Math.max(minZoom, Math.min(maxZoom, cam.zoom * factor));
      cam.setZoom(newZoom);
    }
    lastPinchDist = dist;
  });
  scene.input.on('pointerup', () => { lastPinchDist = 0; });
}

export function buildTouchControls(scene: Phaser.Scene): TouchKeysHandle {
  const cam = scene.cameras.main;
  const W = cam.width;
  const H = cam.height;

  const up: TouchHandle = { pressed: false };
  const down: TouchHandle = { pressed: false };
  const left: TouchHandle = { pressed: false };
  const right: TouchHandle = { pressed: false };
  const e: TouchHandle = { pressed: false };

  const container = scene.add.container(0, 0)
    .setDepth(2000)
    .setScrollFactor(0)
    .setVisible(false);

  const btnSize = 44;
  const padding = 12;

  // D-Pad Position (links unten)
  const padCenterX = padding + btnSize + 6;
  const padCenterY = H - padding - btnSize - 6;

  // S-POLISH-B2-R15: Verbesserte D-Pad-Buttons (Kreise statt Rechtecke)
  const makeBtn = (x: number, y: number, label: string, handle: TouchHandle) => {
    const bg = scene.add.circle(x, y, btnSize / 2, 0x000000, 0.55);
    bg.setStrokeStyle(2, 0x4ab84a);
    bg.setInteractive(new Phaser.Geom.Circle(0, 0, btnSize / 2), Phaser.Geom.Circle.Contains);
    const txt = scene.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '20px', color: '#9be36e'
    }).setOrigin(0.5);
    bg.on('pointerdown', () => { handle.pressed = true; bg.setFillStyle(0x4ab84a, 0.6); });
    bg.on('pointerup', () => { handle.pressed = false; bg.setFillStyle(0x000000, 0.55); });
    bg.on('pointerout', () => { handle.pressed = false; bg.setFillStyle(0x000000, 0.55); });
    container.add([bg, txt]);
  };

  // D-Pad - Kreuz-Layout
  makeBtn(padCenterX, padCenterY - btnSize - 6, '^', up);
  makeBtn(padCenterX, padCenterY + btnSize + 6, 'v', down);
  makeBtn(padCenterX - btnSize - 6, padCenterY, '<', left);
  makeBtn(padCenterX + btnSize + 6, padCenterY, '>', right);

  // E / Action-Button (rechts unten)
  const aX = W - padding - btnSize / 2;
  const aY = H - padding - btnSize / 2;
  makeBtn(aX, aY, 'E', e);

  // Sichtbarkeit nur auf Touch-Geraeten
  const isTouch = typeof window !== 'undefined' && (
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints !== undefined && navigator.maxTouchPoints > 0)
  );
  container.setVisible(isTouch);

  return {
    up, down, left, right, e,
    setEnabled(v: boolean) { container.setVisible(v && isTouch); }
  };
}

/** S-POLISH-B2-R15: Gibt zurück ob es sich um ein Touch-Gerät handelt */
export function isTouchDevice(): boolean {
  return typeof window !== 'undefined' && (
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints !== undefined && navigator.maxTouchPoints > 0)
  );
}
