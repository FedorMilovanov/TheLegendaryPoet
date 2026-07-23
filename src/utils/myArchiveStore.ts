export const FAVORITES_STORAGE_KEY = 'tlp-my-archive:v3';
export const FAVORITES_CHANGE_EVENT = 'tlp:archive-change';

const LEGACY_FAVORITES_KEY = 'tlp-my-archive-favorites-v2';
const POEM_ID = /^[a-z0-9][a-z0-9-]{1,159}$/i;

export interface FavoritePoem {
  id: string;
  addedAt: number;
}

interface FavoriteArchiveSnapshot {
  version: 3;
  items: FavoritePoem[];
  updatedAt: number;
}

function getStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function sanitizeFavorite(value: unknown): FavoritePoem | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<FavoritePoem>;
  if (typeof candidate.id !== 'string' || !POEM_ID.test(candidate.id)) return null;
  const addedAt = Number(candidate.addedAt);
  return {
    id: candidate.id,
    addedAt: Number.isFinite(addedAt) && addedAt > 0 ? Math.min(addedAt, Date.now()) : 0,
  };
}

function sanitizeItems(value: unknown) {
  if (!Array.isArray(value)) return [];
  const byId = new Map<string, FavoritePoem>();
  for (const entry of value) {
    const favorite = sanitizeFavorite(entry);
    if (!favorite) continue;
    const existing = byId.get(favorite.id);
    if (!existing || favorite.addedAt >= existing.addedAt) byId.set(favorite.id, favorite);
  }
  return [...byId.values()];
}

function sanitizeSnapshot(value: unknown): FavoriteArchiveSnapshot | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<FavoriteArchiveSnapshot>;
  if (candidate.version !== 3) return null;
  const updatedAt = Number(candidate.updatedAt);
  return {
    version: 3,
    items: sanitizeItems(candidate.items),
    updatedAt: Number.isFinite(updatedAt) && updatedAt > 0 ? updatedAt : Date.now(),
  };
}

function notifyArchiveChanged() {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  try { window.dispatchEvent(new Event(FAVORITES_CHANGE_EVENT)); } catch { /* restricted environment */ }
}

function writeSnapshot(snapshot: FavoriteArchiveSnapshot) {
  const storage = getStorage();
  if (!storage) return false;
  const sanitized = sanitizeSnapshot({ ...snapshot, version: 3, updatedAt: Date.now() });
  if (!sanitized) return false;
  try {
    storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(sanitized));
    notifyArchiveChanged();
    return true;
  } catch {
    return false;
  }
}

function migrateLegacy(storage: Storage) {
  let items: FavoritePoem[] = [];
  try {
    items = sanitizeItems(JSON.parse(storage.getItem(LEGACY_FAVORITES_KEY) ?? '[]'));
  } catch {
    items = [];
  }
  const snapshot: FavoriteArchiveSnapshot = { version: 3, items, updatedAt: Date.now() };
  if (writeSnapshot(snapshot)) {
    try { storage.removeItem(LEGACY_FAVORITES_KEY); } catch { /* storage became unavailable */ }
  }
  return snapshot;
}

function readSnapshot(): FavoriteArchiveSnapshot {
  const storage = getStorage();
  if (!storage) return { version: 3, items: [], updatedAt: Date.now() };

  try {
    const raw = storage.getItem(FAVORITES_STORAGE_KEY);
    if (raw) {
      const parsed = sanitizeSnapshot(JSON.parse(raw));
      if (parsed) return parsed;
    }
  } catch {
    // Corrupt state falls through to a validated migration/default.
  }

  return migrateLegacy(storage);
}

export function getFavoritePoems(): FavoritePoem[] {
  return readSnapshot().items.map((favorite) => ({ ...favorite }));
}

export function isFavoritePoem(poemId: string): boolean {
  return POEM_ID.test(poemId) && readSnapshot().items.some((favorite) => favorite.id === poemId);
}

export function removeFavoritePoem(poemId: string): boolean {
  if (!POEM_ID.test(poemId)) return false;
  const snapshot = readSnapshot();
  const items = snapshot.items.filter((favorite) => favorite.id !== poemId);
  if (items.length === snapshot.items.length) return false;
  return writeSnapshot({ ...snapshot, items });
}

export function toggleFavoritePoem(poemId: string): boolean {
  if (!POEM_ID.test(poemId)) return false;
  const snapshot = readSnapshot();
  const existing = snapshot.items.some((favorite) => favorite.id === poemId);
  const items = existing
    ? snapshot.items.filter((favorite) => favorite.id !== poemId)
    : [...snapshot.items, { id: poemId, addedAt: Date.now() }];
  const persisted = writeSnapshot({ ...snapshot, items });
  return persisted ? !existing : existing;
}

export function reconcileFavoritePoems(validPoemIds: Iterable<string>) {
  const validIds = new Set([...validPoemIds].filter((id) => POEM_ID.test(id)));
  const snapshot = readSnapshot();
  const items = snapshot.items.filter((favorite) => validIds.has(favorite.id));
  if (items.length === snapshot.items.length) return items.map((favorite) => ({ ...favorite }));
  const persisted = writeSnapshot({ ...snapshot, items });
  const result = persisted ? items : snapshot.items;
  return result.map((favorite) => ({ ...favorite }));
}

export function subscribeFavoritePoems(listener: () => void) {
  if (typeof window === 'undefined') return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (event.key === FAVORITES_STORAGE_KEY || event.key === LEGACY_FAVORITES_KEY) listener();
  };
  window.addEventListener(FAVORITES_CHANGE_EVENT, listener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(FAVORITES_CHANGE_EVENT, listener);
    window.removeEventListener('storage', onStorage);
  };
}
