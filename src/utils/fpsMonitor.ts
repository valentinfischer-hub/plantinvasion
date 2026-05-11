/**
 * FPS-Drop-Monitor (D-041 FI: 60-FPS-Lock Score 3→5)
 *
 * Registriert sich am Phaser-Game und loggt jeden FPS-Drop unter 55 fps
 * fuer laenger als 100ms. Feuert PostHog fps_drop Event mit Scene-Context.
 *
 * Verwendung: fpsMonitor.attach(game) einmalig in main.ts nach Game-Erstellung.
 * Kosten: ~0 CPU da nur Vergleich pro Frame, kein Rendering.
 *
 * R22-Fix: Scene-Tracking nutzt jetzt Phaser-internes Scene-Polling statt
 * nicht-existierendem 'scene-changed' Event. Liest aktive Scene direkt aus
 * game.scene.scenes[].sys.key — zuverlaessig, kein Event-Wiring noetig.
 */

interface FpsDropEvent {
  scene: string;
  fps: number;
  duration_ms: number;
}

const FPS_THRESHOLD = 55;
const DROP_SUSTAIN_MS = 100;

class FpsMonitor {
  private dropStart: number | null = null;
  private dropMinFps = 60;
  private currentScene = 'unknown';
  private attached = false;
  private gameRef: Phaser.Game | null = null;

  attach(game: Phaser.Game): void {
    if (this.attached) return;
    this.attached = true;
    this.gameRef = game;

    game.events.on('step', (_time: number, delta: number) => {
      // R22: Scene-Key aus Phaser direkt lesen (robust gegen fehlende Events)
      const activeScene = this.getActiveSceneKey();
      if (activeScene !== this.currentScene) {
        this.currentScene = activeScene;
      }

      const fps = Math.round(1000 / Math.max(delta, 1));
      const now = performance.now();

      if (fps < FPS_THRESHOLD) {
        if (this.dropStart === null) {
          this.dropStart = now;
          this.dropMinFps = fps;
        } else {
          this.dropMinFps = Math.min(this.dropMinFps, fps);
          if (now - this.dropStart >= DROP_SUSTAIN_MS) {
            this.reportDrop(now - this.dropStart);
            this.dropStart = null;
            this.dropMinFps = 60;
          }
        }
      } else {
        this.dropStart = null;
        this.dropMinFps = 60;
      }
    });
  }

  setScene(key: string): void {
    this.currentScene = key;
  }

  private getActiveSceneKey(): string {
    if (!this.gameRef) return 'unknown';
    try {
      const scenes = this.gameRef.scene.getScenes(true);
      return scenes[0]?.sys?.key ?? 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private reportDrop(durationMs: number): void {
    const event: FpsDropEvent = {
      scene: this.currentScene,
      fps: this.dropMinFps,
      duration_ms: Math.round(durationMs)
    };

    // PostHog — nur wenn verfuegbar
    const ph = (window as Window & {
      __posthog?: { capture: (e: string, p: Record<string, unknown>) => void }
    }).__posthog;
    ph?.capture('fps_drop', event as unknown as Record<string, unknown>);

    // Dev-Mode: Console-Warn fuer lokale Analyse
    if (import.meta.env.DEV) {
      console.warn('[FPS-Monitor] Drop:', event);
    }
  }
}

export const fpsMonitor = new FpsMonitor();
