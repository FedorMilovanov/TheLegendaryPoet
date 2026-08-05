import type {
  CommunityAggregate,
  CommunityTargetSnapshot,
  FeedbackTargetType,
} from '../types/community';
import {
  filterComments,
  filterRatings,
  getFeedbackSnapshot,
  getPendingTargetFeedback,
  subscribeCommunityRemoteRefresh,
  subscribeFeedback,
} from './communityStore';
import {
  fetchTargetComments,
  fetchTargetRemote,
  remoteEnabled,
} from './communityRemote';
import {
  aggregateCommunityRatings,
  emptyCommunityAggregate,
  mergeTargetComments,
  overlayPendingAggregate,
} from './communityAggregates';

type TargetRecord = {
  targetType: FeedbackTargetType;
  targetId: string;
  remoteAggregate: CommunityAggregate | null;
  remoteComments: CommunityTargetSnapshot['comments'];
  cursor: CommunityTargetSnapshot['cursor'];
  hasMoreComments: boolean;
  phase: CommunityTargetSnapshot['phase'];
  message: string | null;
  source: CommunityTargetSnapshot['source'];
  loadingMore: boolean;
  loaded: boolean;
  snapshot: CommunityTargetSnapshot;
  fingerprint: string;
  request: Promise<void> | null;
};

const records = new Map<string, TargetRecord>();
const listeners = new Map<string, Set<() => void>>();
let stopFeedbackSubscription: (() => void) | null = null;
let stopRemoteRefreshSubscription: (() => void) | null = null;

function targetKey(targetType: FeedbackTargetType, targetId: string) {
  return `${targetType}:${targetId}`;
}

function localAggregate(targetType: FeedbackTargetType, targetId: string) {
  const local = getFeedbackSnapshot();
  const ratings = filterRatings(local, targetType, targetId);
  const comments = filterComments(local, targetType, targetId);
  return {
    aggregate: aggregateCommunityRatings(targetType, targetId, ratings, comments.length),
    comments,
  };
}

function serialize(snapshot: CommunityTargetSnapshot) {
  return JSON.stringify({
    aggregate: snapshot.aggregate,
    comments: snapshot.comments.map((comment) => [comment.id, comment.createdAt, comment.helpful, comment.text]),
    cursor: snapshot.cursor,
    hasMoreComments: snapshot.hasMoreComments,
    phase: snapshot.phase,
    message: snapshot.message,
    source: snapshot.source,
    loadingMore: snapshot.loadingMore,
  });
}

function createRecord(targetType: FeedbackTargetType, targetId: string): TargetRecord {
  const local = localAggregate(targetType, targetId);
  const snapshot: CommunityTargetSnapshot = {
    aggregate: local.aggregate,
    comments: local.comments,
    cursor: null,
    hasMoreComments: false,
    phase: remoteEnabled ? 'loading' : 'local',
    message: remoteEnabled ? 'Загружаем данные этого произведения…' : null,
    source: 'local',
    loadingMore: false,
  };
  return {
    targetType,
    targetId,
    remoteAggregate: null,
    remoteComments: [],
    cursor: null,
    hasMoreComments: false,
    phase: snapshot.phase,
    message: snapshot.message,
    source: 'local',
    loadingMore: false,
    loaded: false,
    snapshot,
    fingerprint: serialize(snapshot),
    request: null,
  };
}

function ensureRecord(targetType: FeedbackTargetType, targetId: string) {
  const key = targetKey(targetType, targetId);
  const existing = records.get(key);
  if (existing) return existing;
  const record = createRecord(targetType, targetId);
  records.set(key, record);
  return record;
}

function rebuild(record: TargetRecord) {
  let aggregate: CommunityAggregate;
  let comments: CommunityTargetSnapshot['comments'];
  let source = record.source;

  if (!remoteEnabled || !record.remoteAggregate) {
    const local = localAggregate(record.targetType, record.targetId);
    aggregate = local.aggregate;
    comments = local.comments;
    if (!remoteEnabled) source = 'local';
  } else {
    const pending = getPendingTargetFeedback(record.targetType, record.targetId);
    aggregate = overlayPendingAggregate(record.remoteAggregate, pending);
    comments = mergeTargetComments(record.remoteComments, pending);
  }

  const next: CommunityTargetSnapshot = {
    aggregate,
    comments,
    cursor: record.cursor,
    hasMoreComments: record.hasMoreComments,
    phase: record.phase,
    message: record.message,
    source,
    loadingMore: record.loadingMore,
  };
  const fingerprint = serialize(next);
  if (fingerprint === record.fingerprint) return false;
  record.snapshot = next;
  record.fingerprint = fingerprint;
  return true;
}

function notify(record: TargetRecord) {
  if (!rebuild(record)) return;
  const bucket = listeners.get(targetKey(record.targetType, record.targetId));
  for (const listener of bucket ?? []) listener();
}

function refreshLocalLayers() {
  for (const key of listeners.keys()) {
    const record = records.get(key);
    if (record) notify(record);
  }
}

function refreshRemoteLayers() {
  for (const key of listeners.keys()) {
    const record = records.get(key);
    if (record) void refreshFeedbackTarget(record.targetType, record.targetId);
  }
}

function ensureGlobalSubscriptions() {
  if (!stopFeedbackSubscription) stopFeedbackSubscription = subscribeFeedback(refreshLocalLayers);
  if (!stopRemoteRefreshSubscription) {
    stopRemoteRefreshSubscription = subscribeCommunityRemoteRefresh(refreshRemoteLayers);
  }
}

function releaseGlobalSubscriptions() {
  if (listeners.size > 0) return;
  stopFeedbackSubscription?.();
  stopFeedbackSubscription = null;
  stopRemoteRefreshSubscription?.();
  stopRemoteRefreshSubscription = null;
  records.clear();
}

export function getFeedbackTargetSnapshot(targetType: FeedbackTargetType, targetId: string) {
  return ensureRecord(targetType, targetId).snapshot;
}

export function subscribeFeedbackTarget(
  targetType: FeedbackTargetType,
  targetId: string,
  listener: () => void,
) {
  const key = targetKey(targetType, targetId);
  ensureRecord(targetType, targetId);
  const bucket = listeners.get(key) ?? new Set<() => void>();
  bucket.add(listener);
  listeners.set(key, bucket);
  ensureGlobalSubscriptions();
  void refreshFeedbackTarget(targetType, targetId);

  return () => {
    const current = listeners.get(key);
    current?.delete(listener);
    if (current?.size === 0) listeners.delete(key);
    releaseGlobalSubscriptions();
  };
}

export function refreshFeedbackTarget(targetType: FeedbackTargetType, targetId: string) {
  const record = ensureRecord(targetType, targetId);
  if (!remoteEnabled) {
    record.phase = 'local';
    record.message = null;
    record.source = 'local';
    notify(record);
    return Promise.resolve();
  }
  if (record.request) return record.request;

  record.request = (async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      record.phase = 'offline';
      record.message = 'Нет соединения; показаны сохранённые данные этого браузера.';
      notify(record);
      return;
    }

    record.phase = 'loading';
    record.message = record.loaded ? 'Обновляем данные этого произведения…' : 'Загружаем данные этого произведения…';
    notify(record);

    const result = await fetchTargetRemote(targetType, targetId);
    if (!result) {
      record.phase = 'offline';
      record.message = 'Данные сообщества временно недоступны; локальные изменения сохранены.';
      notify(record);
      return;
    }

    record.remoteAggregate = result.aggregate;
    record.remoteComments = result.page.comments;
    record.cursor = result.page.cursor;
    record.hasMoreComments = result.page.hasMore;
    record.phase = 'online';
    record.message = result.message;
    record.source = result.source;
    record.loaded = true;
    notify(record);
  })().finally(() => { record.request = null; });

  return record.request;
}

export async function loadMoreFeedbackComments(targetType: FeedbackTargetType, targetId: string) {
  const record = ensureRecord(targetType, targetId);
  if (!remoteEnabled || !record.hasMoreComments || record.loadingMore) return;
  record.loadingMore = true;
  notify(record);

  const page = await fetchTargetComments(targetType, targetId, record.cursor);
  if (!page) {
    record.phase = 'offline';
    record.message = 'Следующую страницу пока не удалось загрузить.';
    record.loadingMore = false;
    notify(record);
    return;
  }

  const byId = new Map(record.remoteComments.map((comment) => [comment.id, comment]));
  for (const comment of page.comments) byId.set(comment.id, comment);
  record.remoteComments = [...byId.values()].sort((left, right) =>
    Date.parse(right.createdAt) - Date.parse(left.createdAt) || right.id.localeCompare(left.id));
  record.cursor = page.cursor;
  record.hasMoreComments = page.hasMore;
  record.phase = 'online';
  record.message = null;
  record.loadingMore = false;
  notify(record);
}
