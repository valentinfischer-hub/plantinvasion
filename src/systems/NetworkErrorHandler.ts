/**
 * NetworkErrorHandler — Graceful-Degradation bei Netzwerk-Problemen.
 *
 * - Offline-Mode-Flag: erkennt navigator.onLine + fetch-Timeouts
 * - Network-Error-Toast mit Retry-Button (DOM-basiert)
 * - Lokaler Sync-Queue für Cloud-Sync-Operationen
 * - Flush bei nächster erfolgreicher Verbindung
 *
 * B6-R4 | S-POLISH
 */

// ---- Offline-State ----
let _isOffline = false;
let _toastEl: HTMLDivElement | null = null;
let _retryCallbacks: Array<() => Promise<void>> = [];
let _onlineListener: (() => void) | null = null;
let _offlineListener: (() => void) | null = null;

/** Gibt zurück ob der Client als offline gilt. */
export function isOfflineMode(): boolean {
  return _isOffline;
}

/** Setzt den Offline-State manuell (für Tests). */
export function setOfflineMode(val: boolean): void {
  _isOffline = val;
}

// ---- Sync-Queue ----
interface SyncEntry {
  id: string;
  operation: () => Promise<void>;
  addedAt: number;
}

const _syncQueue: SyncEntry[] = [];

/**
 * Fügt eine Operation zur Sync-Queue hinzu.
 * Wird ausgeführt wenn die Verbindung wiederhergestellt wird.
 */
export function enqueueSyncOperation(id: string, operation: () => Promise<void>): void {
  // Doppelte IDs überschreiben alte Einträge
  const existing = _syncQueue.findIndex((e) => e.id === id);
  if (existing >= 0) {
    _syncQueue.splice(existing, 1);
  }
  _syncQueue.push({ id, operation, addedAt: Date.now() });
}

/** Gibt die aktuelle Sync-Queue zurück (für Tests/Debug). */
export function getSyncQueueLength(): number {
  return _syncQueue.length;
}

/** Leert die Sync-Queue. */
export function clearSyncQueue(): void {
  _syncQueue.length = 0;
}

/** Führt alle Queue-Operationen aus und entfernt sie bei Erfolg. */
async function _flushSyncQueue(): Promise<void> {
  const toProcess = [..._syncQueue];
  for (const entry of toProcess) {
    try {
      await entry.operation();
      const idx = _syncQueue.findIndex((e) => e.id === entry.id);
      if (idx >= 0) _syncQueue.splice(idx, 1);
    } catch {
      // Bleibt in der Queue
    }
  }
}

// ---- Network-Error-Toast ----
function _createToast(message: string, onRetry?: () => void): void {
  // Alten Toast entfernen
  _removeToast();

  const toast = document.createElement('div');
  toast.id = 'pi-network-toast';
  toast.style.cssText = [
    'position:fixed',
    'bottom:20px',
    'left:50%',
    'transform:translateX(-50%)',
    'background:#2a1a1a',
    'color:#ffaaaa',
    'font:12px/1.5 monospace',
    'padding:10px 18px',
    'border-radius:8px',
    'border:1px solid #ff6666',
    'z-index:99998',
    'display:flex',
    'align-items:center',
    'gap:12px',
    'min-width:280px',
    'box-shadow:0 4px 12px rgba(0,0,0,0.5)',
    'transition:opacity 0.3s',
  ].join(';');

  const msgSpan = document.createElement('span');
  msgSpan.textContent = message;
  toast.appendChild(msgSpan);

  if (onRetry) {
    const btn = document.createElement('button');
    btn.textContent = 'Erneut versuchen';
    btn.style.cssText = [
      'background:#3a1a1a',
      'color:#ff9999',
      'border:1px solid #ff6666',
      'border-radius:4px',
      'padding:3px 8px',
      'font:11px monospace',
      'cursor:pointer',
    ].join(';');
    btn.addEventListener('click', () => {
      _removeToast();
      onRetry();
    });
    toast.appendChild(btn);
  }

  document.body?.appendChild(toast);
  _toastEl = toast;
}

function _removeToast(): void {
  if (_toastEl) {
    _toastEl.remove();
    _toastEl = null;
  }
}

/**
 * Zeigt einen Network-Error-Toast mit optionalem Retry-Button.
 * Auto-Dismiss nach 8s wenn kein Retry angegeben.
 */
export function showNetworkErrorToast(message: string, onRetry?: () => void): void {
  _createToast(message, onRetry);
  if (!onRetry) {
    setTimeout(_removeToast, 8000);
  }
}

/** Entfernt den Network-Error-Toast. */
export function hideNetworkErrorToast(): void {
  _removeToast();
}

// ---- Fetch-Wrapper mit Timeout ----

/**
 * Fetch mit Timeout-Unterstützung.
 * Wirft bei Timeout einen `NetworkTimeoutError`.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 8000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return resp;
  } catch (err) {
    clearTimeout(id);
    if ((err as Error).name === 'AbortError') {
      throw new Error('NetworkTimeoutError: Verbindung abgebrochen nach ' + timeoutMs + 'ms');
    }
    throw err;
  }
}

// ---- Event-Listener ----

/**
 * Initialisiert den NetworkErrorHandler.
 * Registriert online/offline Event-Listener.
 * Muss einmal beim App-Start aufgerufen werden.
 */
export function initNetworkErrorHandler(): void {
  if (_onlineListener) return; // bereits initialisiert

  _isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

  _onlineListener = () => {
    _isOffline = false;
    _removeToast();
    void _flushSyncQueue();
  };

  _offlineListener = () => {
    _isOffline = true;
    showNetworkErrorToast('Keine Verbindung — Änderungen werden lokal gespeichert.');
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', _onlineListener);
    window.addEventListener('offline', _offlineListener);
  }
}

/** Entfernt alle Event-Listener (für Tests/Cleanup). */
export function destroyNetworkErrorHandler(): void {
  if (_onlineListener && typeof window !== 'undefined') {
    window.removeEventListener('online', _onlineListener);
    window.removeEventListener('offline', _offlineListener!);
  }
  _onlineListener = null;
  _offlineListener = null;
  _removeToast();
  _retryCallbacks = [];
}

/** Exportiert alle Retry-Callbacks (für Tests). */
export function getRetryCallbacks(): Array<() => Promise<void>> {
  return _retryCallbacks;
}
