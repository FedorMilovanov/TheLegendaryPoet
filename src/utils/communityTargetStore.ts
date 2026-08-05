import type {
  CommentEntry,
  CommunityAggregate,
  CommunitySyncPhase,
  FeedbackTargetType,
  RatingEntry,
} from '../types/community';
import {
  averageScores,
  beginCommunityRemoteRead,
  distributionFromRatings,
  finishCommunityRemoteRead,
  getLocalTargetSnapshot,
  getPendingTargetOverlay,
  subscribeCommunityRemoteMutations,
  subscribeFeedback,
  type CommunityRemoteMutation,
} from './communityStore';
import {
  emptyCommunityAggregate,
  fetchTargetAggregate,
  fetchTargetCommentsPage,
  remoteEnabled,
} from './communityRemote';

export type CommunityTargetLoadMode = 'passive' | 'summary' | 'full';

type LoadPhase = 'idle' | 'loading' | 'ready' | 'error';

export interface FeedbackTargetSnapshot {
  aggregate: CommunityAggregate;
  comments: CommentEntry[];
  summaryPhase: LoadPhase;
  commentsPhase: LoadPhase;
  hasMoreComments: boolean;
  error: string | null;
}

type TargetRecord = {
  targetType: FeedbackTargetType;
  targetId: string;
  remoteAggregate: CommunityAggregate | null;
  remoteComments: CommentEntry[];
  nextCursor: { createdAt: string; id: string } | null;
  summaryPhase: LoadPhase;
  commentsPhase: LoadPhase;
  summaryPromise: Promise<void> | null;
  commentsPromise: Promise<void> | null;
  snapshot: FeedbackTargetSnapshot;
  fingerprint: string;
  listeners: Set<() => void>;
  modeCounts: Record<CommunityTargetLoadMode, number>;
};

const records = new Map<string, TargetRecord>();
let stopLocalSubscription: (() => void) | null = null;
let stopRemoteMutationSubscription: (() => void) | null = null;

function targetKey(targetType: FeedbackTargetType, targetId: string) {
  return `${targetType}:${targetId}`;
}

function ratingAverage(scores: Record<string, number>) {
  const values = Object.values(scores).filter((value) => Number.isFinite(value) && value >= 1 && value <= 5);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function aggregateLocalRatings(
  targetType: FeedbackTargetType,
  targetId: string,
  ratings: RatingEntry[],
  commentCount: number,
): CommunityAggregate {
  const summary = averageScores(ratings);
  const values = ratings.map((rating) => ratingAverage(rating.scores)).filter((value) => value > 0);
  const deviation = values.length > 1
    ? Math.sqrt(values.reduce((sum, value) => sum + (value - summary.overall) ** 2, 0) / values.length)
    : null;

  return {
    targetType,
    targetId,
    ratingCount: ratings.length,
    commentCount,
    overall: summary.overall,
    dimensions: summary.dimensions,
    distribution: distributionFromRatings(ratings),
    deviation,
  };
}

function cloneAggregate(value: CommunityAggregate): CommunityAggregate {
  return {
    ...value,
    dimensions: { ...value.dimensions },
    distribution: { ...value.distribution },
  };
}

function applyPendingAggregate(base: CommunityAggregate): CommunityAggregate {
  const overlay = getPendingTargetOverlay(base.targetType, base.targetId);
  if (!overlay.ratings.length && !overlay.comments.length) return cloneAggregate(base);

  const aggregate = cloneAggregate(base);
  for (const pending of overlay.ratings) {
    const nextOverall = ratingAverage(pending.entry.scores);
    const previousOverall = pending.previousScores ? ratingAverage(pending.previousScores) : 0;
    const replacesExisting = Boolean(pending.previousScores && aggregate.ratingCount > 0);
    const previousCount = aggregate.ratingCount;
    const nextCount = replacesExisting ? previousCount : previousCount + 1;

    aggregate.overall = nextCount > 0
      ? Math.max(0, Math.min(5, (
        aggregate.overall * previousCount
        - (replacesExisting ? previousOverall : 0)
        + nextOverall
      ) / nextCount))
      : 0;

    const dimensionKeys = new Set([
      ...Object.keys(aggregate.dimensions),
      ...Object.keys(pending.entry.scores),
      ...Object.keys(pending.previousScores ?? {}),
    ]);
    for (const key of dimensionKeys) {
      const previousMean = aggregate.dimensions[key] ?? 0;
      const nextValue = pending.entry.scores[key];
      const previousValue = pending.previousScores?.[key];
      const dimensionCount = previousCount;
      if (typeof nextValue !== 'number') continue;
      aggregate.dimensions[key] = nextCount > 0
        ? Math.max(0, Math.min(5, (
          previousMean * dimensionCount
          - (replacesExisting && typeof previousValue === 'number' ? previousValue : 0)
          + nextValue
        ) / nextCount))
        : 0;
    }

    if (replacesExisting && previousOverall > 0) {
      const bucket = Math.max(1, Math.min(5, Math.round(previousOverall)));
      aggregate.distribution[bucket] = Math.max(0, (aggregate.distribution[bucket] ?? 0) - 1);
    }
    if (nextOverall > 0) {
      const bucket = Math.max(1, Math.min(5, Math.round(nextOverall)));
      aggregate.distribution[bucket] = (aggregate.distribution[bucket] ?? 0) + 1;
    }

    aggregate.ratingCount = nextCount;
    aggregate.deviation = null;
  }

  aggregate.commentCount += overlay.comments.length;
  return aggregate;
}

function mergeComments(record: TargetRecord) {
  const local = getLocalTargetSnapshot(record.targetType, record.targetId).comments;
  const byId = new Map<string, CommentEntry>();
  for (const comment of record.remoteComments) byId.set(comment.id, comment);
  for (const comment of local) {
    const existing = byId.get(comment.id);
    byId.set(comment.id, existing ? { ...comment, helpful: Math.max(comment.helpful, existing.helpful) } : comment);
  }

  const localIds = new Set(local.map((comment) => comment.id));
  const pendingHelpful = new Set(getPendingTargetOverlay(record.targetType, record.targetId).helpfulCommentIds);
  for (const commentId of pendingHelpful) {
    if (localIds.has(commentId)) continue;
    const existing = byId.get(commentId);
    if (existing) byId.set(commentId, { ...existing, helpful: existing.helpful + 1 });
  }

  return [...byId.values()].sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt) || right.id.localeCompare(left.id),
  );
}

function createRecord(targetType: FeedbackTargetType, targetId: string): TargetRecord {
  const local = getLocalTargetSnapshot(targetType, targetId);
  const base = remoteEnabled
    ? emptyCommunityAggregate(targetType, targetId)
    : aggregateLocalRatings(targetType, targetId, local.ratings, local.comments.length);
  const snapshot: FeedbackTargetSnapshot = {
    aggregate: base,
    comments: local.comments,
    summaryPhase: remoteEnabled ? 'idle' : 'ready',
    commentsPhase: remoteEnabled ? 'idle' : 'ready',
    hasMoreComments: false,
    error: null,
  };

  return {
    targetType,
    targetId,
    remoteAggregate: null,
    remoteComments: [],
    nextCursor: null,
    summaryPhase: snapshot.summaryPhase,
    commentsPhase: snapshot.commentsPhase,
    summaryPromise: null,
    commentsPromise: null,
    snapshot,
    fingerprint: '',
    listeners: new Set(),
    modeCounts: { passive: 0, summary: 0, full: 0 },
  };
}

function ensureRecord(targetType: FeedbackTargetType, targetId: string) {
  const key = targetKey(targetType, targetId);
  const existing = records.get(key);
  if (existing) return existing;
  const record = createRecord(targetType, targetId);
  records.set(key, record);
  refreshRecord(record, false);
  return record;
}

function fingerprint(snapshot: FeedbackTargetSnapshot) {
  return JSON.stringify(snapshot);
}

function refreshRecord(record: TargetRecord, notify = true) {
  const local = getLocalTargetSnapshot(record.targetType, record.targetId);
  const base = record.remoteAggregate
    ?? (remoteEnabled
      ? emptyCommunityAggregate(record.targetType, record.targetId)
      : aggregateLocalRatings(record.targetType, record.targetId, local.ratings, local.comments.length));
  const aggregate = remoteEnabled ? applyPendingAggregate(base) : base;
  const comments = mergeComments(record);
  const next: FeedbackTargetSnapshot = {
    aggregate,
    comments,
    summaryPhase: record.summaryPhase,
    commentsPhase: record.commentsPhase,
    hasMoreComments: Boolean(record.nextCursor),
    error: record.summaryPhase === 'error' || record.commentsPhase === 'error'
      ? 'Общая база временно недоступна. Локальные изменения сохранены.'
      : null,
  };
  const nextFingerprint = fingerprint(next);
  if (record.fingerprint === nextFingerprint) return;
  record.snapshot = next;
  record.fingerprint = nextFingerprint;
  if (notify) for (const listener of record.listeners) listener();
}

function refreshSubscribedRecords() {
  for (const record of records.values()) {
    if (record.listeners.size) refreshRecord(record);
  }
}

function ensureSharedSubscriptions() {
  if (!stopLocalSubscription) stopLocalSubscription = subscribeFeedback(refreshSubscribedRecords);
  if (!stopRemoteMutationSubscription) {
    stopRemoteMutationSubscription = subscribeCommunityRemoteMutations(handleRemoteMutation);
  }
}

function releaseSharedSubscriptionsIfIdle() {
  if ([...records.values()].some((record) => record.listeners.size > 0)) return;
  stopLocalSubscription?.();
  stopLocalSubscription = null;
  stopRemoteMutationSubscription?.();
  stopRemoteMutationSubscription = null;
  records.clear();
}

async function loadSummary(record: TargetRecord, force = false) {
  if (!remoteEnabled) return;
  if (record.summaryPromise) return record.summaryPromise;
  if (!force && record.summaryPhase === 'ready') return;

  record.summaryPhase = 'loading';
  refreshRecord(record);
  beginCommunityRemoteRead('Загружаем сводку сообщества…');
  record.summaryPromise = (async () => {
    const aggregate = await fetchTargetAggregate(record.targetType, record.targetId);
    if (!aggregate) {
      record.summaryPhase = 'error';
      finishCommunityRemoteRead(false);
      return;
    }
    record.remoteAggregate = aggregate;
    record.summaryPhase = 'ready';
    finishCommunityRemoteRead(true);
  })().finally(() => {
    record.summaryPromise = null;
    refreshRecord(record);
  });
  return record.summaryPromise;
}

async function loadComments(record: TargetRecord, reset = false) {
  if (!remoteEnabled) return;
  if (record.commentsPromise) return record.commentsPromise;
  if (!reset && record.commentsPhase === 'ready' && !record.nextCursor) return;

  if (reset) {
    record.remoteComments = [];
    record.nextCursor = null;
  }
  record.commentsPhase = 'loading';
  refreshRecord(record);
  beginCommunityRemoteRead('Загружаем комментарии…');
  const cursor = reset ? null : record.nextCursor;
  record.commentsPromise = (async () => {
    const page = await fetchTargetCommentsPage(record.targetType, record.targetId, cursor);
    if (!page) {
      record.commentsPhase = 'error';
      finishCommunityRemoteRead(false);
      return;
    }

    const byId = new Map(record.remoteComments.map((comment) => [comment.id, comment]));
    for (const comment of page.comments) byId.set(comment.id, comment);
    record.remoteComments = [...byId.values()].sort(
      (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt) || right.id.localeCompare(left.id),
    );
    record.nextCursor = page.nextCursor;
    record.commentsPhase = 'ready';
    finishCommunityRemoteRead(true);
  })().finally(() => {
    record.commentsPromise = null;
    refreshRecord(record);
  });
  return record.commentsPromise;
}

function ensureModeLoaded(record: TargetRecord, mode: CommunityTargetLoadMode) {
  if (mode === 'passive') return;
  void loadSummary(record);
  if (mode === 'full') void loadComments(record, record.commentsPhase === 'idle');
}

function handleRemoteMutation(mutation: CommunityRemoteMutation) {
  const record = records.get(targetKey(mutation.targetType, mutation.targetId));
  if (!record || !record.listeners.size) return;
  if (record.modeCounts.summary + record.modeCounts.full > 0) void loadSummary(record, true);
  if (mutation.kind !== 'rating' && record.modeCounts.full > 0) void loadComments(record, true);
}

export function getFeedbackTargetSnapshot(targetType: FeedbackTargetType, targetId: string) {
  return ensureRecord(targetType, targetId).snapshot;
}

export function subscribeFeedbackTarget(
  targetType: FeedbackTargetType,
  targetId: string,
  listener: () => void,
  mode: CommunityTargetLoadMode = 'full',
) {
  const record = ensureRecord(targetType, targetId);
  record.listeners.add(listener);
  record.modeCounts[mode] += 1;
  ensureSharedSubscriptions();
  ensureModeLoaded(record, mode);

  return () => {
    record.listeners.delete(listener);
    record.modeCounts[mode] = Math.max(0, record.modeCounts[mode] - 1);
    if (record.listeners.size === 0) records.delete(targetKey(targetType, targetId));
    releaseSharedSubscriptionsIfIdle();
  };
}

export function loadMoreFeedbackTargetComments(targetType: FeedbackTargetType, targetId: string) {
  const record = ensureRecord(targetType, targetId);
  return loadComments(record, false);
}

export function retryFeedbackTarget(targetType: FeedbackTargetType, targetId: string, mode: CommunityTargetLoadMode) {
  const record = ensureRecord(targetType, targetId);
  const work: Promise<void>[] = [];
  if (mode !== 'passive') work.push(loadSummary(record, true) ?? Promise.resolve());
  if (mode === 'full') work.push(loadComments(record, true) ?? Promise.resolve());
  return Promise.all(work).then(() => undefined);
}

/** Used by the aggregate-only leaderboard store. */
export function overlayPendingCommunityAggregate(base: CommunityAggregate) {
  return applyPendingAggregate(base);
}

export function localCommunityAggregate(targetType: FeedbackTargetType, targetId: string) {
  const local = getLocalTargetSnapshot(targetType, targetId);
  return aggregateLocalRatings(targetType, targetId, local.ratings, local.comments.length);
}

export function targetPhaseToSyncPhase(snapshot: FeedbackTargetSnapshot): CommunitySyncPhase {
  if (!remoteEnabled) return 'local';
  if (snapshot.summaryPhase === 'loading' || snapshot.commentsPhase === 'loading') return 'syncing';
  if (snapshot.summaryPhase === 'error' || snapshot.commentsPhase === 'error') return 'offline';
  if (snapshot.summaryPhase === 'idle') return 'idle';
  return 'online';
}
