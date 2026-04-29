/**
 * Micro-Interactions [b4-run14/15]
 * Wiederverwendbare Tween-Utilities für polished UX:
 * - Keyboard-Feedback (Taste blinkt kurz)
 * - Coin-Counter Bounce
 * - Energy-Bar Shake
 * - Save-Indikator (Diskette-Icon pulsiert)
 * - Button-Pressdown-Scale
 */

export interface MicroInteractionScene {
  tweens: Phaser.Tweens.TweenManager;
  add: Phaser.GameObjects.GameObjectFactory;
  time: Phaser.Time.Clock;
}

/**
 * Lässt ein Textobjekt kurz aufleuchten (Keyboard-Feedback)
 * Genutzt bei: Tastatureingaben in SettingsScene/HelpScene
 */
export function flashText(
  scene: MicroInteractionScene,
  target: Phaser.GameObjects.Text,
  flashColor = '#ffffff',
  baseColor = '#dcdcdc',
  duration = 80
): void {
  const orig = target.style.color;
  target.setColor(flashColor);
  scene.time.delayedCall(duration, () => {
    target.setColor(baseColor || orig);
  });
}

/**
 * Coin-Counter Bounce: Scale 1.0 → 1.25 → 1.0 mit Back.Out
 * Aufruf: bei jeder Coin-Änderung (harvest, sell, buy)
 */
export function bounceCoinCounter(
  scene: MicroInteractionScene,
  target: Phaser.GameObjects.Text | Phaser.GameObjects.Container
): void {
  scene.tweens.add({
    targets: target,
    scaleX: 1.25,
    scaleY: 1.25,
    duration: 120,
    ease: 'Back.Out',
    yoyo: true,
    onComplete: () => {
      target.setScale(1);
    }
  });
}

/**
 * Energy-Bar Shake: Kurzes seitliches Wackeln wenn Energie zu niedrig
 * Aufruf: wenn energy < 10 oder Aktion nicht möglich wegen Energie
 */
export function shakeEnergyBar(
  scene: MicroInteractionScene,
  target: Phaser.GameObjects.Graphics | Phaser.GameObjects.Container
): void {
  const origX = target.x;
  scene.tweens.add({
    targets: target,
    x: origX + 6,
    duration: 50,
    ease: 'Sine.InOut',
    yoyo: true,
    repeat: 3,
    onComplete: () => {
      target.x = origX;
    }
  });
}

/**
 * Save-Indikator: Kurze Alpha-Puls-Animation auf einem Text/Icon
 * Aufruf: nach erfolgreicher Auto-Save-Operation
 */
export function pulseSaveIndicator(
  scene: MicroInteractionScene,
  target: Phaser.GameObjects.Text | Phaser.GameObjects.Image,
  duration = 600
): void {
  scene.tweens.add({
    targets: target,
    alpha: { from: 0, to: 1 },
    duration: 160,
    ease: 'Cubic.Out',
    onComplete: () => {
      scene.tweens.add({
        targets: target,
        alpha: 0,
        duration: duration,
        delay: 200,
        ease: 'Cubic.In'
      });
    }
  });
}

/**
 * Button-Pressdown: Scale 1.0 → 0.93 → 1.0 (taktiles Feedback)
 * Aufruf: bei pointerdown auf wichtigen Buttons
 */
export function pressdownButton(
  scene: MicroInteractionScene,
  target: Phaser.GameObjects.Container | Phaser.GameObjects.Rectangle
): void {
  scene.tweens.add({
    targets: target,
    scaleX: 0.93,
    scaleY: 0.93,
    duration: 70,
    ease: 'Cubic.In',
    yoyo: true,
    onComplete: () => {
      target.setScale(1);
    }
  });
}

/**
 * Hover-Glow: Subtiles Tint-Highlighting bei Hover
 * Aufruf: pointerover auf interaktiven Elementen
 */
export function hoverGlow(
  scene: MicroInteractionScene,
  target: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle,
  onEnter: boolean
): void {
  if (onEnter) {
    scene.tweens.add({
      targets: target,
      alpha: 0.9,
      duration: 80,
      ease: 'Cubic.Out'
    });
  } else {
    scene.tweens.add({
      targets: target,
      alpha: 1.0,
      duration: 80,
      ease: 'Cubic.Out'
    });
  }
}

/**
 * Notification-Pop: Kleines Container/Text-Objekt poppt von unten rein
 * Aufruf: für Quest-Completed, Achievement-Unlocked etc.
 */
export function popNotification(
  scene: MicroInteractionScene,
  target: Phaser.GameObjects.Container | Phaser.GameObjects.Text,
  targetY: number,
  duration = 400
): void {
  target.setAlpha(0);
  target.y += 20;
  scene.tweens.add({
    targets: target,
    alpha: 1,
    y: targetY,
    duration,
    ease: 'Back.Out'
  });
}
