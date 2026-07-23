import { useSyncExternalStore } from 'react';
import { getFavoritePoems, subscribeFavoritePoems, type FavoritePoem } from '../utils/myArchiveStore';

const emptySnapshot: FavoritePoem[] = [];
const emptyIds = new Set<string>();
const listeners = new Set<() => void>();
let currentSnapshot: FavoritePoem[] = emptySnapshot;
let currentIds = emptyIds;
let initialized = false;
let stopStoreSubscription: (() => void) | null = null;

function snapshotsEqual(left: readonly FavoritePoem[], right: readonly FavoritePoem[]) {
  return left.length === right.length
    && left.every((favorite, index) => favorite.id === right[index]?.id && favorite.addedAt === right[index]?.addedAt);
}

function installSnapshot(next: FavoritePoem[]) {
  currentSnapshot = next;
  currentIds = new Set(next.map((favorite) => favorite.id));
  initialized = true;
}

function refreshSnapshot() {
  const next = getFavoritePoems();
  if (!initialized) {
    installSnapshot(next);
    return;
  }
  if (snapshotsEqual(currentSnapshot, next)) return;
  installSnapshot(next);
  for (const listener of listeners) listener();
}

function ensureInitialized() {
  if (!initialized && typeof window !== 'undefined') installSnapshot(getFavoritePoems());
}

function getClientSnapshot() {
  ensureInitialized();
  return currentSnapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!stopStoreSubscription) stopStoreSubscription = subscribeFavoritePoems(refreshSnapshot);
  refreshSnapshot();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && stopStoreSubscription) {
      stopStoreSubscription();
      stopStoreSubscription = null;
    }
  };
}

export function useFavoritePoems() {
  return useSyncExternalStore(subscribe, getClientSnapshot, () => emptySnapshot);
}

export function useFavoritePoem(poemId: string) {
  return useSyncExternalStore(
    subscribe,
    () => {
      ensureInitialized();
      return currentIds.has(poemId);
    },
    () => false,
  );
}
