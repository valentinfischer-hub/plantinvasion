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

  const makeBtn = (x: number, y: number, label: string, handle: TouchHandle) => {
    const bg = scene.add.rectangle(x, y, btnSize, btnSize, 0x000000, 0.45)
      .setStrokeStyle(2, 0x9be36e)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: false });
    const txt = scene.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '20px', color: '#9be36e'
    }).setOrigin(0.5);
    bg.on('pointerdown', () => { handle.pressed = true; bg.setFillStyle(0x9be36e, 0.45); });
    bg.on('pointerup', () => { handle.pressed = false; bg.setFillStyle(0x000000, 0.45); });
    bg.on('pointerout', () => { handle.pressed = false; bg.setFillStyle(0x000000, 0.45); });
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
