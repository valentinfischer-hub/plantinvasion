import Phaser from 'phaser';
/**
 * FPS-Drop-Monitor (D-041 FI: 60-FPS-Lock Score 3â5)
 *
 * Registriert sich am Phaser-Game und loggt jeden FPS-Drop unter 55 fps
 * fuer laenger als 100ms. Feuert PostHog fps_drop Event mit Scene-Context.
 *
 * Verwendung: fpsMonitor.attach(game) einmalig in main.ts nach Game-Erstellung.
 * Kosten: ~0 CPU da nur Vergleich pro Frame, kein Rendering.
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

  attach(game: Phaser.Game): void {
    if (this.attached) return;
    this.attached = true;

    game.events.on('step', (_time: number, delta: number) => {
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

    // Scene-Tracking: aktuellen Scene-Key merken
    game.events.on('scene-changed', (key: string) => {
      this.currentScene = key;
    });
  }

  setScene(key: string): void {
    this.currentScene = key;
  }

  private reportDrop(durationMs: number): void {
    const event: FpsDropEvent = {
      scene: this.currentScene,
      fps: this.dropMinFps,
      duration_ms: Math.round(durationMs)
    };

    // PostHog â nur wenn perfuegbar
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
