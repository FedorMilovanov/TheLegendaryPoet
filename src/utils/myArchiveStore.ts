/**
 * Personal poem archive (favorites).
 *
 * Same reactive pattern as communityStore: one in-memory snapshot, localStorage
 * persistence, cross-tab sync via the `storage` event, safe writes. UI hooks
 * into it with useSyncExternalStore so every surface updates live.
 */

export interface FavoritePoem {
  id: string;
  addedAt: number;
}

const FAVORITES_KEY = 'tlp-my-archive-favorites-v2';

function safeWrite(value: FavoritePoem[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function readFavorites(): FavoritePoem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is FavoritePoem =>
        !!item &&
        typeof item === 'object' &&
        typeof (item as FavoritePoem).id === 'string' &&
        typeof (item as FavoritePoem).addedAt === 'number',
    );
  } catch {
    return [];
  }
}

let current: FavoritePoem[] = readFavorites();
const listeners = new Set<() => void>();
let storageBound = false;

function emit() {
  listeners.forEach((l) => l());
}

function bindStorage() {
  if (storageBound || typeof window === 'undefined') return;
  storageBound = true;
  window.addEventListener('storage', (event) => {
    if (event.key !== FAVORITES_KEY) return;
    current = readFavorites();
    emit();
  });
}

export function subscribeArchive(listener: () => void): () => void {
  bindStorage();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getFavoritePoems(): FavoritePoem[] {
  return current;
}

export function isFavoritePoem(poemId: string): boolean {
  return current.some((f) => f.id === poemId);
}

/**
 * Toggle a poem in the archive. Returns the new membership state
 * (true = now saved, false = removed). Memory updates even if storage is blocked
 * so the current session stays consistent.
 */
export function toggleFavoritePoem(poemId: string): boolean {
  const index = current.findIndex((f) => f.id === poemId);
  let next: FavoritePoem[];
  let nowFavorite: boolean;
  if (index !== -1) {
    next = current.filter((_, i) => i !== index);
    nowFavorite = false;
  } else {
    next = [...current, { id: poemId, addedAt: Date.now() }];
    nowFavorite = true;
  }
  current = next;
  safeWrite(next);
  emit();
  return nowFavorite;
}
