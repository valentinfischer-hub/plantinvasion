/**
 * DebugOverlay - Developer-Tools-Overlay.
 *
 * Nur aktiv wenn URL ?debug=1 enthaelt.
 * Zeigt: FPS-Tier, Genome-Inspector, Save-State-Dump, Feature-Flags.
 * Kein Phaser-Zugriff noetig - rein DOM-basiert.
 *
 * S-POLISH Batch 5 Run 2
 */

/** Prueft ob Debug-Modus aktiv */
export function isDebugMode(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('debug') === '1';
  } catch {
    return false;
  }
}

// ---- DOM-Panel ----
let _panel: HTMLDivElement | null = null;
let _rafId = 0;
let _fpsHistory: number[] = [];
let _lastFrameTime = 0;

function _createPanel(): HTMLDivElement {
  const panel = document.createElement('div');
  panel.id = 'pi-debug-overlay';
  panel.style.cssText = [
    'position:fixed',
    'top:8px',
    'right:8px',
    'z-index:99999',
    'background:rgba(0,0,0,0.82)',
    'color:#39ff14',
    'font:11px/1.5 monospace',
    'padding:8px 12px',
    'border-radius:6px',
    'border:1px solid #39ff14',
    'min-width:240px',
    'max-height:90vh',
    'overflow-y:auto',
    'pointer-events:auto',
    'user-select:text',
  ].join(';');
  document.body.appendChild(panel);
  return panel;
}

function _getTierColor(fps: number): string {
  if (fps >= 55) return '#39ff14'; // gruen
  if (fps >= 40) return '#ffe600'; // gelb
  return '#ff4040';                // rot
}

function _renderPanel(): void {
  if (!_panel) return;

  // FPS messen
  const now = performance.now();
  const delta = now - (_lastFrameTime || now);
  _lastFrameTime = now;
  const fps = delta > 0 ? Math.round(1000 / delta) : 60;
  _fpsHistory.push(fps);
  if (_fpsHistory.length > 60) _fpsHistory.shift();
  const avgFps = Math.round(_fpsHistory.reduce((a, b) => a + b, 0) / _fpsHistory.length);
  const tierColor = _getTierColor(avgFps);

  // Save-State lesen
  let saveInfo = 'n/a';
  try {
    const raw = localStorage.getItem('plantinvasion_save');
    if (raw) {
      const s = JSON.parse(raw) as Record<string, unknown>;
      saveInfo = `v${String(s['saveVersion'] ?? '?')} | day${String(s['day'] ?? '?')}`;
    }
  } catch { /* ignore */ }

  // Feature-Flags lesen
  let ffInfo = 'n/a';
  try {
    const raw = localStorage.getItem('pi_feature_flags');
    if (raw) {
      ffInfo = raw.substring(0, 80);
    }
  } catch { /* ignore */ }

  // Genome-Inspector: aktive Pflanze aus Save
  let genomeInfo = 'n/a';
  try {
    const raw = localStorage.getItem('plantinvasion_save');
    if (raw) {
      const s = JSON.parse(raw) as { garden?: Array<{ species?: string; genome?: Record<string, unknown> }> };
      const slot0 = s.garden?.[0];
      if (slot0?.genome) {
        const keys = Object.keys(slot0.genome).slice(0, 4);
        genomeInfo = keys.map(k => `${k}:${String((slot0.genome as Record<string, unknown>)[k])}`).join(' ');
      }
    }
  } catch { /* ignore */ }

  _panel.innerHTML = [
    `<b style="color:#fff">PI Debug v0.1</b>`,
    `<hr style="border-color:#39ff14;margin:4px 0">`,
    `FPS: <span style="color:${tierColor}">${avgFps}</span>/${fps} (1min-avg/now)`,
    `Save: ${saveInfo}`,
    `Genome[0]: ${genomeInfo}`,
    `FF: ${ffInfo}`,
    `URL: ${window.location.pathname}${window.location.search}`,
    `<hr style="border-color:#333;margin:4px 0">`,
    `<small style="color:#888">Schliessen: Ctrl+Shift+D</small>`,
  ].join('<br>');
}

function _loop(): void {
  _renderPanel();
  _rafId = requestAnimationFrame(_loop);
}

/** Startet den Debug-Overlay (nur wenn ?debug=1) */
export function initDebugOverlay(): void {
  if (!isDebugMode()) return;
  if (_panel) return; // bereits aktiv

  _panel = _createPanel();
  _loop();

  // Ctrl+Shift+D schliesst den Overlay
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      destroyDebugOverlay();
    }
  });

  console.info('[PI Debug] Overlay aktiv. Ctrl+Shift+D zum Schliessen.');
}

/** Stoppt und entfernt den Debug-Overlay */
export function destroyDebugOverlay(): void {
  if (_rafId) {
    cancelAnimationFrame(_rafId);
    _rafId = 0;
  }
  if (_panel) {
    _panel.remove();
    _panel = null;
  }
}
