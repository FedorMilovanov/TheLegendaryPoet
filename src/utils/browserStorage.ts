export type BrowserStorageArea = 'local' | 'session';

function storageFor(area: BrowserStorageArea): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return area === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

/** Read browser storage without allowing privacy settings or quota failures to affect the UI. */
export function safeRead(key: string, area: BrowserStorageArea = 'local'): string | null {
  try {
    return storageFor(area)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** Persist a small UI preference without making browser storage a runtime dependency. */
export function safeWrite(key: string, value: string, area: BrowserStorageArea = 'local'): boolean {
  try {
    const storage = storageFor(area);
    if (!storage) return false;
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemove(key: string, area: BrowserStorageArea = 'local'): boolean {
  try {
    const storage = storageFor(area);
    if (!storage) return false;
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
