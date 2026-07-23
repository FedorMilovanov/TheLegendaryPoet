import type {
  CommentEntry,
  CommunitySyncState,
  FeedbackSnapshot,
  FeedbackTargetType,
  RatingEntry,
} from '../types/community';
import {
  fetchAllRemote,
  markHelpfulRemote,
  remoteEnabled,
  submitCommentRemote,
  submitRatingRemote,
} from './communityRemote';

const STORE_KEY = 'tlp-community-feedback:v2';
const LEGACY_STORE_KEY = 'tlp-community-feedback-v1';
const LEGACY_COOLDOWN_KEY = 'tlp-community-cooldowns-v1';
const LEGACY_HELPFUL_KEY = 'tlp-community-helpful-v1';
const LEGACY_RATED_KEY = 'tlp-community-rated-v1';
const COOLDOWN_MS = 30 * 1000;
const MAX_OUTBOX_ITEMS = 500;
const TARGET_ID = /^[a-z0-9][a-z0-9-]{1,159}$/i;
const FEEDBACK_ID = /^[a-z0-9][a-z0-9-]{1,199}$/i;
const SCORE_KEY = /^[a-z0-9][a-z0-9-]{0,79}$/i;
const TARGET_TYPES = new Set<FeedbackTargetType>(['poet', 'poem', 'track', 'article']);
const COMMENT_KINDS = new Set(['literary', 'history', 'moral', 'performance']);

export interface OwnRatingRecord {
  id: string;
  scores: Record<string, number>;
  updatedAt: string;
}

type RatedScopes = Record<string, OwnRatingRecord | true>;

type PendingOperation =
  | {
      id: string;
      kind: 'rating';
      voterId: string;
      entry: RatingEntry;
      createdAt: string;
      attempts: number;
    }
  | {
      id: string;
      kind: 'comment';
      voterId: string;
      entry: CommentEntry;
      createdAt: string;
      attempts: number;
    }
  | {
      id: string;
      kind: 'helpful';
      voterId: string;
      commentId: string;
      scope: string;
      createdAt: string;
      attempts: number;
    };

interface PersistedCommunityState {
  version: 2;
  snapshot: FeedbackSnapshot;
  outbox: PendingOperation[];
  cooldowns: Record<string, number>;
  helpfulVotes: Record<string, true>;
  ownRatings: RatedScopes;
  updatedAt: string;
  lastSyncedAt: string | null;
}

const emptySnapshot: FeedbackSnapshot = { ratings: [], comments: [] };

function defaultState(): PersistedCommunityState {
  return {
    version: 2,
    snapshot: emptySnapshot,
    outbox: [],
    cooldowns: {},
    helpfulVotes: {},
    ownRatings: {},
    updatedAt: new Date().toISOString(),
    lastSyncedAt: null,
  };
}

function getStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function validIsoDate(value: unknown) {
  if (typeof value !== 'string') return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return null;
  return new Date(Math.min(parsed, Date.now() + 5 * 60_000)).toISOString();
}

function normalizeText(value: unknown, maxLength: number) {
  return typeof value === 'string'
    ? value.replace(/\r\n?/g, '\n').replace(/[\t ]+/g, ' ').trim().slice(0, maxLength)
    : '';
}

function sanitizeScores(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const scores: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value).slice(0, 16)) {
    const score = Number(raw);
    if (!SCORE_KEY.test(key) || !Number.isInteger(score) || score < 1 || score > 5) continue;
    scores[key] = score;
  }
  return Object.keys(scores).length ? scores : null;
}

function sanitizeRating(value: unknown): RatingEntry | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<RatingEntry>;
  const scores = sanitizeScores(candidate.scores);
  const createdAt = validIsoDate(candidate.createdAt);
  if (
    typeof candidate.id !== 'string'
    || !FEEDBACK_ID.test(candidate.id)
    || !TARGET_TYPES.has(candidate.targetType as FeedbackTargetType)
    || typeof candidate.targetId !== 'string'
    || !TARGET_ID.test(candidate.targetId)
    || !scores
    || !createdAt
  ) return null;
  return {
    id: candidate.id,
    targetType: candidate.targetType as FeedbackTargetType,
    targetId: candidate.targetId,
    scores,
    createdAt,
  };
}

function sanitizeComment(value: unknown): CommentEntry | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<CommentEntry>;
  const createdAt = validIsoDate(candidate.createdAt);
  const author = normalizeText(candidate.author, 60) || 'Анонимный читатель';
  const text = normalizeText(candidate.text, 2000);
  const helpful = Math.max(0, Math.min(1_000_000, Math.floor(Number(candidate.helpful) || 0)));
  if (
    typeof candidate.id !== 'string'
    || !FEEDBACK_ID.test(candidate.id)
    || !TARGET_TYPES.has(candidate.targetType as FeedbackTargetType)
    || typeof candidate.targetId !== 'string'
    || !TARGET_ID.test(candidate.targetId)
    || !COMMENT_KINDS.has(String(candidate.kind))
    || text.length < 8
    || !createdAt
  ) return null;
  return {
    id: candidate.id,
    targetType: candidate.targetType as FeedbackTargetType,
    targetId: candidate.targetId,
    author,
    text,
    kind: candidate.kind as CommentEntry['kind'],
    helpful,
    createdAt,
  };
}

function dedupeRatings(values: unknown) {
  const byId = new Map<string, RatingEntry>();
  if (Array.isArray(values)) {
    for (const value of values) {
      const rating = sanitizeRating(value);
      if (!rating) continue;
      const existing = byId.get(rating.id);
      if (!existing || Date.parse(rating.createdAt) >= Date.parse(existing.createdAt)) byId.set(rating.id, rating);
    }
  }
  return [...byId.values()].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

function dedupeComments(values: unknown) {
  const byId = new Map<string, CommentEntry>();
  if (Array.isArray(values)) {
    for (const value of values) {
      const comment = sanitizeComment(value);
      if (!comment) continue;
      const existing = byId.get(comment.id);
      if (!existing) byId.set(comment.id, comment);
      else byId.set(comment.id, {
        ...(Date.parse(comment.createdAt) >= Date.parse(existing.createdAt) ? comment : existing),
        helpful: Math.max(existing.helpful, comment.helpful),
      });
    }
  }
  return [...byId.values()].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

function sanitizeSnapshot(value: unknown): FeedbackSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return emptySnapshot;
  const candidate = value as Partial<FeedbackSnapshot>;
  return {
    ratings: dedupeRatings(candidate.ratings),
    comments: dedupeComments(candidate.comments),
  };
}

function sanitizeOwnRating(value: unknown): OwnRatingRecord | true | null {
  if (value === true) return true;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<OwnRatingRecord>;
  const scores = sanitizeScores(candidate.scores);
  const updatedAt = validIsoDate(candidate.updatedAt);
  if (typeof candidate.id !== 'string' || !FEEDBACK_ID.test(candidate.id) || !scores || !updatedAt) return null;
  return { id: candidate.id, scores, updatedAt };
}

function sanitizeRecord(value: unknown, mode: 'cooldowns' | 'helpful' | 'ratings') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result: Record<string, number | true | OwnRatingRecord> = {};
  for (const [key, raw] of Object.entries(value).slice(-5000)) {
    if (!key || key.length > 420) continue;
    if (mode === 'cooldowns') {
      const until = Number(raw);
      if (Number.isFinite(until) && until > Date.now() - COOLDOWN_MS) result[key] = until;
    } else if (mode === 'helpful') {
      if (raw === true) result[key] = true;
    } else {
      const rating = sanitizeOwnRating(raw);
      if (rating) result[key] = rating;
    }
  }
  return result;
}

function sanitizeOperation(value: unknown): PendingOperation | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<PendingOperation> & { entry?: unknown };
  const createdAt = validIsoDate(candidate.createdAt) ?? new Date().toISOString();
  const attempts = Math.max(0, Math.min(1000, Math.floor(Number(candidate.attempts) || 0)));
  if (typeof candidate.id !== 'string' || !candidate.id || candidate.id.length > 260 || typeof candidate.voterId !== 'string' || !candidate.voterId) return null;

  if (candidate.kind === 'rating') {
    const entry = sanitizeRating(candidate.entry);
    return entry ? { id: candidate.id, kind: 'rating', voterId: candidate.voterId, entry, createdAt, attempts } : null;
  }
  if (candidate.kind === 'comment') {
    const entry = sanitizeComment(candidate.entry);
    return entry ? { id: candidate.id, kind: 'comment', voterId: candidate.voterId, entry, createdAt, attempts } : null;
  }
  if (candidate.kind === 'helpful' && typeof candidate.commentId === 'string' && FEEDBACK_ID.test(candidate.commentId) && typeof candidate.scope === 'string') {
    return { id: candidate.id, kind: 'helpful', voterId: candidate.voterId, commentId: candidate.commentId, scope: candidate.scope, createdAt, attempts };
  }
  return null;
}

function sanitizeState(value: unknown): PersistedCommunityState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultState();
  const candidate = value as Partial<PersistedCommunityState>;
  const outbox = Array.isArray(candidate.outbox)
    ? candidate.outbox.map(sanitizeOperation).filter((operation): operation is PendingOperation => Boolean(operation)).slice(-MAX_OUTBOX_ITEMS)
    : [];
  return {
    version: 2,
    snapshot: sanitizeSnapshot(candidate.snapshot),
    outbox,
    cooldowns: sanitizeRecord(candidate.cooldowns, 'cooldowns') as Record<string, number>,
    helpfulVotes: sanitizeRecord(candidate.helpfulVotes, 'helpful') as Record<string, true>,
    ownRatings: sanitizeRecord(candidate.ownRatings, 'ratings') as RatedScopes,
    updatedAt: validIsoDate(candidate.updatedAt) ?? new Date().toISOString(),
    lastSyncedAt: candidate.lastSyncedAt ? validIsoDate(candidate.lastSyncedAt) : null,
  };
}

function persistState(storage: Storage, state: PersistedCommunityState) {
  try {
    storage.setItem(STORE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function readLegacyObject(storage: Storage, key: string) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function migrateLegacy(storage: Storage) {
  let snapshot: FeedbackSnapshot = emptySnapshot;
  try {
    const raw = storage.getItem(LEGACY_STORE_KEY);
    snapshot = raw ? sanitizeSnapshot(JSON.parse(raw)) : emptySnapshot;
  } catch {
    snapshot = emptySnapshot;
  }

  const state = sanitizeState({
    ...defaultState(),
    snapshot,
    cooldowns: readLegacyObject(storage, LEGACY_COOLDOWN_KEY),
    helpfulVotes: readLegacyObject(storage, LEGACY_HELPFUL_KEY),
    ownRatings: readLegacyObject(storage, LEGACY_RATED_KEY),
  });

  if (persistState(storage, state)) {
    for (const key of [LEGACY_STORE_KEY, LEGACY_COOLDOWN_KEY, LEGACY_HELPFUL_KEY, LEGACY_RATED_KEY]) {
      try { storage.removeItem(key); } catch { /* storage became unavailable */ }
    }
  }
  return state;
}

function readState(): PersistedCommunityState {
  const storage = getStorage();
  if (!storage) return defaultState();
  try {
    const raw = storage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object' && (parsed as { version?: number }).version === 2) return sanitizeState(parsed);
    }
  } catch {
    // Corrupt v2 state falls through to the validated legacy/default migration.
  }
  return migrateLegacy(storage);
}

let currentState = readState();
let syncState: CommunitySyncState = {
  phase: remoteEnabled ? 'idle' : 'local',
  pendingCount: currentState.outbox.length,
  lastSyncedAt: currentState.lastSyncedAt,
  message: null,
};
const listeners = new Set<() => void>();
const syncListeners = new Set<() => void>();
let storageBound = false;
let networkBound = false;
let flushPromise: Promise<void> | null = null;
let hydratePromise: Promise<void> | null = null;

function emit() {
  for (const listener of listeners) listener();
}

function emitSync() {
  for (const listener of syncListeners) listener();
}

function setSyncState(patch: Partial<CommunitySyncState>) {
  const next = { ...syncState, ...patch, pendingCount: patch.pendingCount ?? currentState.outbox.length };
  if (
    next.phase === syncState.phase
    && next.pendingCount === syncState.pendingCount
    && next.lastSyncedAt === syncState.lastSyncedAt
    && next.message === syncState.message
  ) return;
  syncState = next;
  emitSync();
}

function applyState(nextValue: PersistedCommunityState, allowMemoryFallback = false) {
  const next = sanitizeState({ ...nextValue, version: 2, updatedAt: new Date().toISOString() });
  const storage = getStorage();
  const persisted = storage ? persistState(storage, next) : false;
  if (!persisted && !allowMemoryFallback) return false;
  currentState = next;
  emit();
  setSyncState({ pendingCount: next.outbox.length, lastSyncedAt: next.lastSyncedAt });
  return persisted || allowMemoryFallback;
}

function bindStorageListener() {
  if (storageBound || typeof window === 'undefined') return;
  storageBound = true;
  window.addEventListener('storage', (event) => {
    if (event.key !== STORE_KEY && ![LEGACY_STORE_KEY, LEGACY_COOLDOWN_KEY, LEGACY_HELPFUL_KEY, LEGACY_RATED_KEY].includes(event.key ?? '')) return;
    currentState = readState();
    emit();
    setSyncState({ pendingCount: currentState.outbox.length, lastSyncedAt: currentState.lastSyncedAt });
  });
}

function bindNetworkListeners() {
  if (networkBound || typeof window === 'undefined' || !remoteEnabled) return;
  networkBound = true;
  window.addEventListener('offline', () => setSyncState({ phase: 'offline', message: 'Нет соединения; изменения останутся в очереди.' }));
  window.addEventListener('online', () => { void hydrateFromRemote(); });
}

export function subscribeFeedback(listener: () => void) {
  bindStorageListener();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function subscribeCommunitySync(listener: () => void) {
  bindStorageListener();
  bindNetworkListeners();
  syncListeners.add(listener);
  return () => syncListeners.delete(listener);
}

export function getFeedbackSnapshot() {
  return currentState.snapshot;
}

export function getCommunitySyncSnapshot() {
  return syncState;
}

export const isFeedbackShared = remoteEnabled;

export function loadFeedback() {
  return currentState.snapshot;
}

export function mutateFeedback(update: (snapshot: FeedbackSnapshot) => FeedbackSnapshot) {
  return applyState({ ...currentState, snapshot: sanitizeSnapshot(update(currentState.snapshot)) });
}

function mergeRemoteWithPending(remote: FeedbackSnapshot, local: FeedbackSnapshot, outbox: PendingOperation[]) {
  const pendingRatingIds = new Set(outbox.filter((operation) => operation.kind === 'rating').map((operation) => operation.entry.id));
  const pendingCommentIds = new Set(outbox.filter((operation) => operation.kind === 'comment').map((operation) => operation.entry.id));
  const pendingHelpfulIds = new Set(outbox.filter((operation) => operation.kind === 'helpful').map((operation) => operation.commentId));

  const ratings = new Map(remote.ratings.map((rating) => [rating.id, rating]));
  for (const rating of local.ratings) if (pendingRatingIds.has(rating.id)) ratings.set(rating.id, rating);

  const comments = new Map(remote.comments.map((comment) => [comment.id, comment]));
  for (const comment of local.comments) {
    if (pendingCommentIds.has(comment.id)) comments.set(comment.id, comment);
    else if (pendingHelpfulIds.has(comment.id)) {
      const remoteComment = comments.get(comment.id);
      if (remoteComment) comments.set(comment.id, { ...remoteComment, helpful: Math.max(remoteComment.helpful, comment.helpful) });
    }
  }

  return sanitizeSnapshot({ ratings: [...ratings.values()], comments: [...comments.values()] });
}

async function sendOperation(operation: PendingOperation) {
  if (operation.kind === 'rating') return submitRatingRemote(operation.entry, operation.voterId);
  if (operation.kind === 'comment') return submitCommentRemote(operation.entry, operation.voterId);
  return markHelpfulRemote(operation.commentId, operation.voterId);
}

export function flushCommunityOutbox() {
  if (!remoteEnabled || currentState.outbox.length === 0) return Promise.resolve();
  if (flushPromise) return flushPromise;

  flushPromise = (async () => {
    setSyncState({ phase: 'syncing', message: 'Отправляем сохранённые изменения…' });
    let failed = false;

    for (const queued of [...currentState.outbox]) {
      const operation = currentState.outbox.find((item) => item.id === queued.id);
      if (!operation) continue;
      const ok = await sendOperation(operation);
      if (!ok) {
        failed = true;
        applyState({
          ...currentState,
          outbox: currentState.outbox.map((item) => item.id === operation.id ? { ...item, attempts: item.attempts + 1 } : item),
        }, true);
        break;
      }
      applyState({ ...currentState, outbox: currentState.outbox.filter((item) => item.id !== operation.id) }, true);
    }

    if (failed) {
      setSyncState({ phase: 'offline', message: 'Сервер недоступен; изменения безопасно сохранены и будут повторены.' });
    } else {
      setSyncState({ phase: 'online', message: null, pendingCount: 0 });
    }
  })().finally(() => { flushPromise = null; });

  return flushPromise;
}

export function hydrateFromRemote() {
  if (!remoteEnabled) {
    setSyncState({ phase: 'local', message: null, pendingCount: 0 });
    return Promise.resolve();
  }
  if (hydratePromise) return hydratePromise;

  bindNetworkListeners();
  hydratePromise = (async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncState({ phase: 'offline', message: 'Нет соединения; показан локальный кэш.' });
      return;
    }

    setSyncState({ phase: 'syncing', message: 'Обновляем общую базу…' });
    const remote = await fetchAllRemote();
    if (!remote) {
      setSyncState({ phase: 'offline', message: 'Общая база временно недоступна; показан локальный кэш.' });
      return;
    }

    const now = new Date().toISOString();
    applyState({
      ...currentState,
      snapshot: mergeRemoteWithPending(sanitizeSnapshot(remote), currentState.snapshot, currentState.outbox),
      lastSyncedAt: now,
    }, true);
    setSyncState({ phase: 'online', message: null, lastSyncedAt: now });
    await flushCommunityOutbox();
  })().finally(() => { hydratePromise = null; });

  return hydratePromise;
}

export function makeFeedbackId(prefix: string) {
  const suffix = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${suffix}`;
}

export function filterRatings(snapshot: FeedbackSnapshot, targetType: FeedbackTargetType, targetId: string) {
  return snapshot.ratings.filter((item) => item.targetType === targetType && item.targetId === targetId);
}

export function filterComments(snapshot: FeedbackSnapshot, targetType: FeedbackTargetType, targetId: string) {
  return snapshot.comments.filter((item) => item.targetType === targetType && item.targetId === targetId);
}

export function averageScores(ratings: RatingEntry[]) {
  if (!ratings.length) return { overall: 0, dimensions: {} as Record<string, number> };
  const totals: Record<string, number> = {};
  const counts: Record<string, number> = {};
  for (const rating of ratings) {
    for (const [key, value] of Object.entries(rating.scores)) {
      if (!Number.isFinite(value) || value < 1 || value > 5) continue;
      totals[key] = (totals[key] ?? 0) + value;
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  const dimensions = Object.fromEntries(Object.keys(totals).map((key) => [key, totals[key] / counts[key]]));
  const dimensionValues = Object.values(dimensions);
  const overall = dimensionValues.length ? dimensionValues.reduce((sum, value) => sum + value, 0) / dimensionValues.length : 0;
  return { overall, dimensions };
}

export function distributionFromRatings(ratings: RatingEntry[]) {
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const rating of ratings) {
    const values = Object.values(rating.scores).filter((value) => Number.isFinite(value) && value >= 1 && value <= 5);
    if (!values.length) continue;
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    distribution[Math.max(1, Math.min(5, Math.round(average)))] += 1;
  }
  return distribution;
}

export function trustLabel(count: number) {
  if (count >= 20) return 'Сильный сигнал';
  if (count >= 8) return 'Есть база мнений';
  if (count >= 3) return 'Ранний сигнал';
  return 'Пока мало данных';
}

export function checkCooldown(scope: string) {
  const until = currentState.cooldowns[scope] ?? 0;
  const now = Date.now();
  return { allowed: until <= now, remainingMs: Math.max(0, until - now) };
}

export function setCooldown(scope: string) {
  return applyState({ ...currentState, cooldowns: { ...currentState.cooldowns, [scope]: Date.now() + COOLDOWN_MS } });
}

export function canMarkHelpful(scope: string) {
  return !currentState.helpfulVotes[scope];
}

export function rememberHelpful(scope: string) {
  return applyState({ ...currentState, helpfulVotes: { ...currentState.helpfulVotes, [scope]: true } });
}

export function getOwnRating(scope: string): OwnRatingRecord | null {
  const value = currentState.ownRatings[scope];
  return value && value !== true ? { ...value, scores: { ...value.scores } } : null;
}

export function hasRated(scope: string) {
  return Boolean(currentState.ownRatings[scope]);
}

export function rememberRating(scope: string, record: OwnRatingRecord) {
  const sanitized = sanitizeOwnRating(record);
  if (!sanitized) return false;
  return applyState({ ...currentState, ownRatings: { ...currentState.ownRatings, [scope]: sanitized } });
}

export function rememberRated(scope: string) {
  if (currentState.ownRatings[scope]) return true;
  return applyState({ ...currentState, ownRatings: { ...currentState.ownRatings, [scope]: true } });
}

function enqueueOperation(outbox: PendingOperation[], operation: PendingOperation) {
  const withoutDuplicate = outbox.filter((item) => item.id !== operation.id);
  return [...withoutDuplicate, operation].slice(-MAX_OUTBOX_ITEMS);
}

export function commitRatingFeedback(entryValue: RatingEntry, scope: string, voterId: string) {
  const entry = sanitizeRating(entryValue);
  if (!entry || !voterId) return false;
  const operation: PendingOperation = {
    id: `rating:${entry.id}`,
    kind: 'rating',
    voterId,
    entry,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  return applyState({
    ...currentState,
    snapshot: {
      ...currentState.snapshot,
      ratings: dedupeRatings([...currentState.snapshot.ratings.filter((rating) => rating.id !== entry.id), entry]),
    },
    ownRatings: {
      ...currentState.ownRatings,
      [scope]: { id: entry.id, scores: { ...entry.scores }, updatedAt: entry.createdAt },
    },
    cooldowns: { ...currentState.cooldowns, [scope]: Date.now() + COOLDOWN_MS },
    outbox: remoteEnabled ? enqueueOperation(currentState.outbox, operation) : currentState.outbox,
  });
}

export function commitCommentFeedback(entryValue: CommentEntry, scope: string, voterId: string) {
  const entry = sanitizeComment(entryValue);
  if (!entry || !voterId) return false;
  const operation: PendingOperation = {
    id: `comment:${entry.id}`,
    kind: 'comment',
    voterId,
    entry,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  return applyState({
    ...currentState,
    snapshot: { ...currentState.snapshot, comments: dedupeComments([entry, ...currentState.snapshot.comments]) },
    cooldowns: { ...currentState.cooldowns, [scope]: Date.now() + COOLDOWN_MS },
    outbox: remoteEnabled ? enqueueOperation(currentState.outbox, operation) : currentState.outbox,
  });
}

export function commitHelpfulFeedback(commentId: string, scope: string, voterId: string) {
  if (!FEEDBACK_ID.test(commentId) || !voterId || currentState.helpfulVotes[scope]) return false;
  const exists = currentState.snapshot.comments.some((comment) => comment.id === commentId);
  if (!exists) return false;
  const operation: PendingOperation = {
    id: `helpful:${scope}`,
    kind: 'helpful',
    voterId,
    commentId,
    scope,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  return applyState({
    ...currentState,
    snapshot: {
      ...currentState.snapshot,
      comments: currentState.snapshot.comments.map((comment) => comment.id === commentId ? { ...comment, helpful: comment.helpful + 1 } : comment),
    },
    helpfulVotes: { ...currentState.helpfulVotes, [scope]: true },
    outbox: remoteEnabled ? enqueueOperation(currentState.outbox, operation) : currentState.outbox,
  });
}
