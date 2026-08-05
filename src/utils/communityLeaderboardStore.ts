import type {
  CommunityAggregate,
  CommunityLeaderboardSnapshot,
  FeedbackTargetType,
} from '../types/community';
import { fetchCommunityLeaderboard, remoteEnabled } from './communityRemote';
import {
  filterComments,
  filterRatings,
  getFeedbackSnapshot,
  getPendingTargetFeedback,
  subscribeCommunityRemoteRefresh,
  subscribeFeedback,
} from './communityStore';
import { aggregateCommunityRatings, overlayPendingAggregate } from './communityAggregates';

const listeners = new Set<() => void>();
let stopFeedbackSubscription: (() => void) | null = null;
let stopRemoteRefreshSubscription: (() => void) | null = null;
let request: Promise<void> | null = null;
let remoteRows: CommunityAggregate[] | null = null;
let snapshot: CommunityLeaderboardSnapshot = {
  rows: [],
  phase: remoteEnabled ? 'loading' : 'local',
  message: remoteEnabled ? 'Загружаем агрегированный рейтинг…' : null,
};
let fingerprint = '';

function localRows() {
  const local = getFeedbackSnapshot();
  const targets = new Set<string>();
  for (const rating of local.ratings) {
    if (rating.targetType === 'poet') targets.add(rating.targetId);
  }
  for (const comment of local.comments) {
    if (comment.targetType === 'poet') targets.add(comment.targetId);
  }
  return [...targets].map((targetId) => aggregateCommunityRatings(
    'poet',
    targetId,
    filterRatings(local, 'poet', targetId),
    filterComments(local, 'poet', targetId).length,
  ));
}

function overlayRows(rows: CommunityAggregate[]) {
  const byKey = new Map(rows.map((row) => [`${row.targetType}:${row.targetId}`, row]));
  const local = getFeedbackSnapshot();
  const targetIds = new Set<string>([
    ...rows.filter((row) => row.targetType === 'poet').map((row) => row.targetId),
    ...local.ratings.filter((rating) => rating.targetType === 'poet').map((rating) => rating.targetId),
    ...local.comments.filter((comment) => comment.targetType === 'poet').map((comment) => comment.targetId),
  ]);

  for (const targetId of targetIds) {
    const key = `poet:${targetId}`;
    const base = byKey.get(key) ?? aggregateCommunityRatings(
      'poet',
      targetId,
      remoteEnabled ? [] : filterRatings(local, 'poet', targetId),
      remoteEnabled ? 0 : filterComments(local, 'poet', targetId).length,
    );
    byKey.set(key, remoteEnabled
      ? overlayPendingAggregate(base, getPendingTargetFeedback('poet', targetId))
      : base);
  }

  return [...byKey.values()].sort((left, right) =>
    right.ratingCount - left.ratingCount || left.targetId.localeCompare(right.targetId));
}

function publish(rows: CommunityAggregate[], phase = snapshot.phase, message = snapshot.message) {
  const next: CommunityLeaderboardSnapshot = { rows: overlayRows(rows), phase, message };
  const nextFingerprint = JSON.stringify(next);
  if (nextFingerprint === fingerprint) return;
  snapshot = next;
  fingerprint = nextFingerprint;
  for (const listener of listeners) listener();
}

function refreshLocalOverlay() {
  publish(remoteRows ?? localRows());
}

function ensureSubscriptions() {
  if (!stopFeedbackSubscription) stopFeedbackSubscription = subscribeFeedback(refreshLocalOverlay);
  if (!stopRemoteRefreshSubscription) {
    stopRemoteRefreshSubscription = subscribeCommunityRemoteRefresh(() => { void refreshCommunityLeaderboard(); });
  }
}

function releaseSubscriptions() {
  if (listeners.size) return;
  stopFeedbackSubscription?.();
  stopFeedbackSubscription = null;
  stopRemoteRefreshSubscription?.();
  stopRemoteRefreshSubscription = null;
  remoteRows = null;
  request = null;
  snapshot = { rows: [], phase: remoteEnabled ? 'loading' : 'local', message: remoteEnabled ? 'Загружаем агрегированный рейтинг…' : null };
  fingerprint = '';
}

export function getCommunityLeaderboardSnapshot() {
  if (!snapshot.rows.length && !remoteEnabled) publish(localRows(), 'local', null);
  return snapshot;
}

export function subscribeCommunityLeaderboard(listener: () => void) {
  listeners.add(listener);
  ensureSubscriptions();
  void refreshCommunityLeaderboard();
  return () => {
    listeners.delete(listener);
    releaseSubscriptions();
  };
}

export function refreshCommunityLeaderboard() {
  if (!remoteEnabled) {
    remoteRows = null;
    publish(localRows(), 'local', null);
    return Promise.resolve();
  }
  if (request) return request;

  request = (async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      publish(remoteRows ?? localRows(), 'offline', 'Нет соединения; показаны сохранённые данные этого браузера.');
      return;
    }

    publish(remoteRows ?? localRows(), 'loading', 'Загружаем агрегированный рейтинг…');
    const rows = await fetchCommunityLeaderboard();
    if (!rows) {
      remoteRows = null;
      publish(localRows(), 'offline', 'Aggregate backend ещё не установлен или временно недоступен; raw corpus не загружался.');
      return;
    }

    remoteRows = rows.filter((row) => row.targetType === ('poet' satisfies FeedbackTargetType));
    publish(remoteRows, 'online', null);
  })().finally(() => { request = null; });

  return request;
}
