import { useSyncExternalStore } from 'react';
import { getFavoritePoems, subscribeFavoritePoems, type FavoritePoem } from '../utils/myArchiveStore';

const emptySnapshot: FavoritePoem[] = [];
const listeners = new Set<() => void>();
let currentSnapshot: FavoritePoem[] = emptySnapshot;
let initialized = false;
let stopStoreSubscription: (() => void) | null = null;

function snapshotsEqual(left: readonly FavoritePoem[], right: readonly FavoritePoem[]) {
  return left.length === right.length
    && left.every((favorite, index) => favorite.id === right[index]?.id && favorite.addedAt === right[index]?.addedAt);
}

function refreshSnapshot() {
  const next = getFavoritePoems();
  initialized = true;
  if (snapshotsEqual(currentSnapshot, next)) return;
  currentSnapshot = next;
  for (const listener of listeners) listener();
}

function getClientSnapshot() {
  if (!initialized && typeof window !== 'undefined') {
    currentSnapshot = getFavoritePoems();
    initialized = true;
  }
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
