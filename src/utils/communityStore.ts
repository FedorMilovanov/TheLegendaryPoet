import type {
  CommentEntry,
  CommunitySyncState,
  FeedbackSnapshot,
  FeedbackTargetType,
  RatingEntry,
} from '../types/community';
import {
  markHelpfulRemote,
  remoteEnabled,
  submitCommentRemote,
  submitRatingRemote,
} from './communityRemote';

const STORE_KEY = 'tlp-community-feedback:v3';
const LEGACY_V2_STORE_KEY = 'tlp-community-feedback:v2';
const LEGACY_STORE_KEY = 'tlp-community-feedback-v1';
const LEGACY_COOLDOWN_KEY = 'tlp-community-cooldowns-v1';
const LEGACY_HELPFUL_KEY = 'tlp-community-helpful-v1';
const LEGACY_RATED_KEY = 'tlp-community-rated-v1';
const COOLDOWN_MS = 30 * 1000;
const MAX_OUTBOX_ITEMS = 500;
const MAX_LOCAL_ENTRIES = 500;
const TARGET_ID = /^[a-z0-9][a-z0-9-]{1,159}$/i;
const RATING_ID = /^rating-[a-z0-9][a-z0-9-]{7,199}$/i;
const COMMENT_ID = /^comment-[a-z0-9][a-z0-9-]{7,199}$/i;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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
      previousScores?: Record<string, number>;
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
  version: 3;
  localSnapshot: FeedbackSnapshot;
  outbox: PendingOperation[];
  cooldowns: Record<string, number>;
  helpfulVotes: Record<string, true>;
  ownRatings: RatedScopes;
  updatedAt: string;
  lastSyncedAt: string | null;
}

export interface PendingTargetOverlay {
  ratings: Array<{ entry: RatingEntry; previousScores?: Record<string, number> }>;
  comments: CommentEntry[];
  helpfulCommentIds: string[];
}

export interface CommunityRemoteMutation {
  targetType: FeedbackTargetType;
  targetId: string;
  kind: PendingOperation['kind'];
}

const emptySnapshot: FeedbackSnapshot = { ratings: [], comments: [] };

function defaultState(): PersistedCommunityState {
  return {
    version: 3,
    localSnapshot: emptySnapshot,
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
    || !RATING_ID.test(candidate.id)
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
    || !COMMENT_ID.test(candidate.id)
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
  return [...byId.values()]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt) || left.id.localeCompare(right.id))
    .slice(0, MAX_LOCAL_ENTRIES);
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
  return [...byId.values()]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt) || left.id.localeCompare(right.id))
    .slice(0, MAX_LOCAL_ENTRIES);
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
  if (typeof candidate.id !== 'string' || !RATING_ID.test(candidate.id) || !scores || !updatedAt) return null;
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

function parseHelpfulScope(scope: string, commentId: string) {
  const match = /^helpful:(poet|poem|track|article):([a-z0-9][a-z0-9-]{1,159}):(comment-[a-z0-9][a-z0-9-]{7,199})$/i.exec(scope);
  return Boolean(match && match[3] === commentId);
}

function sanitizeOperation(value: unknown): PendingOperation | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<PendingOperation> & { entry?: unknown; previousScores?: unknown };
  const createdAt = validIsoDate(candidate.createdAt) ?? new Date().toISOString();
  const attempts = Math.max(0, Math.min(1000, Math.floor(Number(candidate.attempts) || 0)));
  if (
    typeof candidate.id !== 'string'
    || candidate.id.length > 420
    || typeof candidate.voterId !== 'string'
    || !UUID.test(candidate.voterId)
  ) return null;

  if (candidate.kind === 'rating') {
    const entry = sanitizeRating(candidate.entry);
    const previousScores = sanitizeScores(candidate.previousScores) ?? undefined;
    return entry && candidate.id === `rating:${entry.id}`
      ? { id: candidate.id, kind: 'rating', voterId: candidate.voterId, entry, previousScores, createdAt, attempts }
      : null;
  }
  if (candidate.kind === 'comment') {
    const entry = sanitizeComment(candidate.entry);
    return entry && candidate.id === `comment:${entry.id}`
      ? { id: candidate.id, kind: 'comment', voterId: candidate.voterId, entry, createdAt, attempts }
      : null;
  }
  if (
    candidate.kind === 'helpful'
    && typeof candidate.commentId === 'string'
    && COMMENT_ID.test(candidate.commentId)
    && typeof candidate.scope === 'string'
    && parseHelpfulScope(candidate.scope, candidate.commentId)
    && candidate.id === `helpful:${candidate.scope}`
  ) {
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
    version: 3,
    localSnapshot: sanitizeSnapshot(candidate.localSnapshot),
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

function readJson(storage: Storage, key: string): unknown {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function parseRatingScope(scope: string): { targetType: FeedbackTargetType; targetId: string } | null {
  const match = /^rating:(poet|poem|track|article):([a-z0-9][a-z0-9-]{1,159})$/i.exec(scope);
  return match ? { targetType: match[1] as FeedbackTargetType, targetId: match[2] } : null;
}

function migrateV2(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultState();
  const candidate = value as {
    snapshot?: unknown;
    outbox?: unknown;
    cooldowns?: unknown;
    helpfulVotes?: unknown;
    ownRatings?: unknown;
    updatedAt?: unknown;
    lastSyncedAt?: unknown;
  };
  const snapshot = sanitizeSnapshot(candidate.snapshot);
  const outbox = Array.isArray(candidate.outbox)
    ? candidate.outbox.map(sanitizeOperation).filter((operation): operation is PendingOperation => Boolean(operation)).slice(-MAX_OUTBOX_ITEMS)
    : [];
  const ownRatings = sanitizeRecord(candidate.ownRatings, 'ratings') as RatedScopes;

  const pendingRatingIds = new Set(outbox.filter((operation) => operation.kind === 'rating').map((operation) => operation.entry.id));
  const pendingCommentIds = new Set(outbox.filter((operation) => operation.kind === 'comment').map((operation) => operation.entry.id));
  const ratings = snapshot.ratings.filter((rating) => pendingRatingIds.has(rating.id));
  const comments = snapshot.comments.filter((comment) => pendingCommentIds.has(comment.id));

  for (const [scope, valueRecord] of Object.entries(ownRatings)) {
    if (!valueRecord || valueRecord === true || ratings.some((rating) => rating.id === valueRecord.id)) continue;
    const target = parseRatingScope(scope);
    if (!target) continue;
    ratings.push({
      id: valueRecord.id,
      targetType: target.targetType,
      targetId: target.targetId,
      scores: { ...valueRecord.scores },
      createdAt: valueRecord.updatedAt,
    });
  }

  return sanitizeState({
    version: 3,
    localSnapshot: { ratings, comments },
    outbox,
    cooldowns: candidate.cooldowns,
    helpfulVotes: candidate.helpfulVotes,
    ownRatings,
    updatedAt: candidate.updatedAt,
    lastSyncedAt: candidate.lastSyncedAt,
  });
}

function migrateLegacy(storage: Storage) {
  const snapshot = sanitizeSnapshot(readJson(storage, LEGACY_STORE_KEY));
  return sanitizeState({
    ...defaultState(),
    localSnapshot: snapshot,
    cooldowns: readJson(storage, LEGACY_COOLDOWN_KEY),
    helpfulVotes: readJson(storage, LEGACY_HELPFUL_KEY),
    ownRatings: readJson(storage, LEGACY_RATED_KEY),
  });
}

function commitMigration(storage: Storage, state: PersistedCommunityState, keys: string[]) {
  if (!persistState(storage, state)) return state;
  for (const key of keys) {
    try { storage.removeItem(key); } catch { /* storage became unavailable */ }
  }
  return state;
}

function readState(): PersistedCommunityState {
  const storage = getStorage();
  if (!storage) return defaultState();

  const current = readJson(storage, STORE_KEY);
  if (current && typeof current === 'object' && (current as { version?: number }).version === 3) {
    const sanitized = sanitizeState(current);
    if (!persistState(storage, sanitized)) return sanitized;
    return sanitized;
  }

  const v2 = readJson(storage, LEGACY_V2_STORE_KEY);
  if (v2 && typeof v2 === 'object') {
    return commitMigration(storage, migrateV2(v2), [LEGACY_V2_STORE_KEY]);
  }

  const legacy = migrateLegacy(storage);
  return commitMigration(storage, legacy, [LEGACY_STORE_KEY, LEGACY_COOLDOWN_KEY, LEGACY_HELPFUL_KEY, LEGACY_RATED_KEY]);
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
const remoteMutationListeners = new Set<(mutation: CommunityRemoteMutation) => void>();
let storageBound = false;
let networkBound = false;
let flushPromise: Promise<void> | null = null;
let activeRemoteReads = 0;
let remoteReadFailed = false;

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
  const next = sanitizeState({ ...nextValue, version: 3, updatedAt: new Date().toISOString() });
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
    if (![STORE_KEY, LEGACY_V2_STORE_KEY, LEGACY_STORE_KEY, LEGACY_COOLDOWN_KEY, LEGACY_HELPFUL_KEY, LEGACY_RATED_KEY].includes(event.key ?? '')) return;
    currentState = readState();
    emit();
    setSyncState({ pendingCount: currentState.outbox.length, lastSyncedAt: currentState.lastSyncedAt });
  });
}

function bindNetworkListeners() {
  if (networkBound || typeof window === 'undefined' || !remoteEnabled) return;
  networkBound = true;
  window.addEventListener('offline', () => setSyncState({ phase: 'offline', message: 'Нет соединения; изменения останутся в очереди.' }));
  window.addEventListener('online', () => { void flushCommunityOutbox(); });
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

export function subscribeCommunityRemoteMutations(listener: (mutation: CommunityRemoteMutation) => void) {
  remoteMutationListeners.add(listener);
  return () => remoteMutationListeners.delete(listener);
}

export function getFeedbackSnapshot() {
  return currentState.localSnapshot;
}

export function getCommunitySyncSnapshot() {
  return syncState;
}

export const isFeedbackShared = remoteEnabled;

export function getLocalTargetSnapshot(targetType: FeedbackTargetType, targetId: string): FeedbackSnapshot {
  return {
    ratings: currentState.localSnapshot.ratings.filter((item) => item.targetType === targetType && item.targetId === targetId),
    comments: currentState.localSnapshot.comments.filter((item) => item.targetType === targetType && item.targetId === targetId),
  };
}

export function getPendingTargetOverlay(targetType: FeedbackTargetType, targetId: string): PendingTargetOverlay {
  const ratings: PendingTargetOverlay['ratings'] = [];
  const comments: CommentEntry[] = [];
  const helpfulCommentIds: string[] = [];

  for (const operation of currentState.outbox) {
    if (operation.kind === 'rating' && operation.entry.targetType === targetType && operation.entry.targetId === targetId) {
      ratings.push({ entry: operation.entry, previousScores: operation.previousScores });
    } else if (operation.kind === 'comment' && operation.entry.targetType === targetType && operation.entry.targetId === targetId) {
      comments.push(operation.entry);
    } else if (operation.kind === 'helpful') {
      const prefix = `helpful:${targetType}:${targetId}:`;
      if (operation.scope.startsWith(prefix)) helpfulCommentIds.push(operation.commentId);
    }
  }

  return { ratings, comments, helpfulCommentIds };
}

export function beginCommunityRemoteRead(message = 'Обновляем общую базу…') {
  if (!remoteEnabled) return;
  if (activeRemoteReads === 0) remoteReadFailed = false;
  activeRemoteReads += 1;
  setSyncState({ phase: 'syncing', message });
}

export function finishCommunityRemoteRead(ok: boolean) {
  if (!remoteEnabled) return;
  if (!ok) remoteReadFailed = true;
  activeRemoteReads = Math.max(0, activeRemoteReads - 1);
  if (activeRemoteReads > 0) return;
  if (remoteReadFailed) {
    setSyncState({ phase: 'offline', message: 'Общая база временно недоступна; локальные изменения сохранены.' });
  } else {
    setSyncState({ phase: 'online', message: null });
  }
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
  if (!entry || !UUID.test(voterId)) return false;
  const operationId = `rating:${entry.id}`;
  const pending = currentState.outbox.find((item) => item.kind === 'rating' && item.id === operationId);
  const previousScores = pending ? pending.previousScores : getOwnRating(scope)?.scores;
  const operation: PendingOperation = {
    id: operationId,
    kind: 'rating',
    voterId,
    entry,
    previousScores,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  return applyState({
    ...currentState,
    localSnapshot: {
      ...currentState.localSnapshot,
      ratings: dedupeRatings([...currentState.localSnapshot.ratings.filter((rating) => rating.id !== entry.id), entry]),
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
  if (!entry || !UUID.test(voterId)) return false;
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
    localSnapshot: { ...currentState.localSnapshot, comments: dedupeComments([entry, ...currentState.localSnapshot.comments]) },
    cooldowns: { ...currentState.cooldowns, [scope]: Date.now() + COOLDOWN_MS },
    outbox: remoteEnabled ? enqueueOperation(currentState.outbox, operation) : currentState.outbox,
  });
}

export function commitHelpfulFeedback(commentId: string, scope: string, voterId: string) {
  if (!COMMENT_ID.test(commentId) || !UUID.test(voterId) || !parseHelpfulScope(scope, commentId) || currentState.helpfulVotes[scope]) return false;
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
    localSnapshot: {
      ...currentState.localSnapshot,
      comments: currentState.localSnapshot.comments.map((comment) => comment.id === commentId
        ? { ...comment, helpful: comment.helpful + 1 }
        : comment),
    },
    helpfulVotes: { ...currentState.helpfulVotes, [scope]: true },
    outbox: remoteEnabled ? enqueueOperation(currentState.outbox, operation) : currentState.outbox,
  });
}

function targetForOperation(operation: PendingOperation): CommunityRemoteMutation | null {
  if (operation.kind === 'rating' || operation.kind === 'comment') {
    return { targetType: operation.entry.targetType, targetId: operation.entry.targetId, kind: operation.kind };
  }
  const match = /^helpful:(poet|poem|track|article):([a-z0-9][a-z0-9-]{1,159}):/i.exec(operation.scope);
  return match ? { targetType: match[1] as FeedbackTargetType, targetId: match[2], kind: 'helpful' } : null;
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

      const now = new Date().toISOString();
      applyState({
        ...currentState,
        outbox: currentState.outbox.filter((item) => item.id !== operation.id),
        lastSyncedAt: now,
      }, true);
      const mutation = targetForOperation(operation);
      if (mutation) for (const listener of remoteMutationListeners) listener(mutation);
    }

    if (failed) {
      setSyncState({ phase: 'offline', message: 'Сервер недоступен; изменения безопасно сохранены и будут повторены.' });
    } else {
      setSyncState({ phase: 'online', message: null, pendingCount: 0, lastSyncedAt: currentState.lastSyncedAt });
    }
  })().finally(() => { flushPromise = null; });

  return flushPromise;
}
