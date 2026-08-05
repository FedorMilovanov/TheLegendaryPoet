import { useMemo, useSyncExternalStore } from 'react';
import {
  getCommunityLeaderboardSnapshot,
  retryCommunityLeaderboard,
  subscribeCommunityLeaderboard,
} from '../utils/communityLeaderboardStore';

export function useCommunityLeaderboard(targetIds: readonly string[]) {
  const key = targetIds.join('|');
  const stableIds = useMemo(() => (key ? key.split('|') : []), [key]);
  const store = useMemo(() => ({
    subscribe: (listener: () => void) => subscribeCommunityLeaderboard(stableIds, listener),
    getSnapshot: () => getCommunityLeaderboardSnapshot(stableIds),
  }), [stableIds]);
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return {
    ...snapshot,
    retry: () => retryCommunityLeaderboard(stableIds),
  };
}
