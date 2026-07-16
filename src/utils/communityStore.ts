import {
  FEEDBACK_LIMITS,
  type CommentEntry,
  type FeedbackSnapshot,
  type FeedbackTargetType,
  type RatingEntry,
} from '../types/community';
import { fetchAllRemote, remoteEnabled } from './communityRemote';

const STORE_KEY = 'tlp-community-feedback-v1';
const COOLDOWN_KEY = 'tlp-community-cooldowns-v1';
const HELPFUL_KEY = 'tlp-community-helpful-v1';
const RATED_KEY = 'tlp-community-rated-v1';
const COOLDOWN_MS = FEEDBACK_LIMITS.cooldownMs;

const emptySnapshot: FeedbackSnapshot = {
  ratings: [],
  comments: [],
};

/**
 * Safe localStorage write. Never throws (Safari private mode, quota exceeded) —
 * returns false so callers can surface a soft message instead of dying in a click handler.
 */
function safeWrite(key: string, value: unknown): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function safeReadObject<T extends object>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function isTargetType(value: unknown): value is FeedbackTargetType {
  return value === 'poet' || value === 'poem' || value === 'track' || value === 'article' || value === 'essay';
}

function sanitizeSnapshot(raw: unknown): FeedbackSnapshot {
  if (!raw || typeof raw !== 'object') return emptySnapshot;
  const src = raw as Partial<FeedbackSnapshot>;
  const ratings: RatingEntry[] = Array.isArray(src.ratings)
    ? src.ratings.filter(
        (r): r is RatingEntry =>
          !!r &&
          typeof r === 'object' &&
          typeof r.id === 'string' &&
          isTargetType(r.targetType) &&
          typeof r.targetId === 'string' &&
          !!r.scores &&
          typeof r.scores === 'object',
      )
    : [];
  const comments: CommentEntry[] = Array.isArray(src.comments)
    ? src.comments.filter(
        (c): c is CommentEntry =>
          !!c &&
          typeof c === 'object' &&
          typeof c.id === 'string' &&
          isTargetType(c.targetType) &&
          typeof c.targetId === 'string' &&
          typeof c.text === 'string' &&
          typeof c.author === 'string',
      )
    : [];
  return { ratings, comments };
}

function readRaw(): FeedbackSnapshot {
  if (typeof window === 'undefined') return emptySnapshot;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return sanitizeSnapshot(raw ? JSON.parse(raw) : emptySnapshot);
  } catch {
    return emptySnapshot;
  }
}

/* ------------------------------------------------------------------ *
 * Reactive single-source store.
 *
 * Every panel on a page reads from ONE in-memory snapshot and subscribes
 * to it, so concurrent panels can no longer clobber each other's writes
 * and every summary updates live after a vote. Backed by
 * useSyncExternalStore in the hook; kept in sync across tabs via `storage`.
 * ------------------------------------------------------------------ */
let current: FeedbackSnapshot = readRaw();
const listeners = new Set<() => void>();
let storageBound = false;

function emit() {
  listeners.forEach((l) => l());
}

function bindStorageListener() {
  if (storageBound || typeof window === 'undefined') return;
  storageBound = true;
  window.addEventListener('storage', (event) => {
    if (event.key !== STORE_KEY) return;
    current = readRaw();
    emit();
  });
}

export function subscribeFeedback(listener: () => void): () => void {
  bindStorageListener();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getFeedbackSnapshot(): FeedbackSnapshot {
  return current;
}

/**
 * When a shared backend is configured, pull everyone's ratings/comments once
 * at startup and make them the live snapshot. On any failure the local
 * (per-device) data is kept untouched. No-op otherwise.
 */
export async function hydrateFromRemote(): Promise<void> {
  if (!remoteEnabled) return;
  const remote = await fetchAllRemote();
  if (!remote) return;
  current = sanitizeSnapshot(remote);
  safeWrite(STORE_KEY, current);
  emit();
}

/** True when ratings/comments are shared via a backend (not just local). */
export const isFeedbackShared = remoteEnabled;

/** Backwards-compatible reader (returns the live in-memory snapshot). */
export function loadFeedback(): FeedbackSnapshot {
  return current;
}

/**
 * Apply an immutable update to the shared snapshot, persist it, notify every
 * subscriber. Returns false if the write was rejected by the browser.
 */
export function mutateFeedback(update: (snapshot: FeedbackSnapshot) => FeedbackSnapshot): boolean {
  const next = update(current);
  const ok = safeWrite(STORE_KEY, next);
  // Keep memory in sync even if storage is blocked so the current session still works.
  current = next;
  emit();
  return ok;
}

export function makeFeedbackId(prefix: string) {
  // crypto.randomUUID when available — better uniqueness across tabs/devices.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function filterRatings(
  snapshot: FeedbackSnapshot,
  targetType: FeedbackTargetType,
  targetId: string,
): RatingEntry[] {
  return snapshot.ratings.filter((item) => item.targetType === targetType && item.targetId === targetId);
}

export function filterComments(
  snapshot: FeedbackSnapshot,
  targetType: FeedbackTargetType,
  targetId: string,
): CommentEntry[] {
  return snapshot.comments.filter((item) => item.targetType === targetType && item.targetId === targetId);
}

export function averageScores(ratings: RatingEntry[]) {
  if (!ratings.length) return { overall: 0, dimensions: {} as Record<string, number> };
  const totals: Record<string, number> = {};
  const counts: Record<string, number> = {};
  ratings.forEach((rating) => {
    Object.entries(rating.scores).forEach(([key, value]) => {
      if (typeof value !== 'number' || !Number.isFinite(value)) return;
      totals[key] = (totals[key] || 0) + value;
      counts[key] = (counts[key] || 0) + 1;
    });
  });
  const dimensions = Object.fromEntries(
    Object.entries(totals).map(([key, value]) => [key, value / (counts[key] || 1)]),
  );
  const dimensionValues = Object.values(dimensions);
  const overall = dimensionValues.length
    ? dimensionValues.reduce((sum, value) => sum + value, 0) / dimensionValues.length
    : 0;
  return { overall, dimensions };
}

export function distributionFromRatings(ratings: RatingEntry[]) {
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach((rating) => {
    const values = Object.values(rating.scores).filter((v) => typeof v === 'number' && Number.isFinite(v));
    if (!values.length) return;
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const bucket = Math.max(1, Math.min(5, Math.round(average)));
    distribution[bucket] += 1;
  });
  return distribution;
}

export function trustLabel(count: number) {
  if (count >= 20) return 'Сильный сигнал';
  if (count >= 8) return 'Есть база мнений';
  if (count >= 3) return 'Ранний сигнал';
  return 'Пока мало данных';
}

function loadCooldowns(): Record<string, number> {
  return safeReadObject<Record<string, number>>(COOLDOWN_KEY, {});
}

export function checkCooldown(scope: string) {
  const cooldowns = loadCooldowns();
  const until = cooldowns[scope] || 0;
  const now = Date.now();
  return { allowed: until <= now, remainingMs: Math.max(0, until - now) };
}

export function setCooldown(scope: string) {
  const cooldowns = loadCooldowns();
  cooldowns[scope] = Date.now() + COOLDOWN_MS;
  safeWrite(COOLDOWN_KEY, cooldowns);
}

function loadHelpfulVotes(): Record<string, true> {
  return safeReadObject<Record<string, true>>(HELPFUL_KEY, {});
}

export function canMarkHelpful(scope: string) {
  return !loadHelpfulVotes()[scope];
}

export function rememberHelpful(scope: string) {
  const votes = loadHelpfulVotes();
  votes[scope] = true;
  safeWrite(HELPFUL_KEY, votes);
}

function loadRatedScopes(): Record<string, true> {
  return safeReadObject<Record<string, true>>(RATED_KEY, {});
}

export function hasRated(scope: string) {
  return !!loadRatedScopes()[scope];
}

export function rememberRated(scope: string) {
  const rated = loadRatedScopes();
  rated[scope] = true;
  safeWrite(RATED_KEY, rated);
}

/** Scope keys — always build them through these helpers so UI and store never drift. */
export function ratingScope(targetType: FeedbackTargetType, targetId: string) {
  return `rating:${targetType}:${targetId}`;
}

export function commentScope(targetType: FeedbackTargetType, targetId: string) {
  return `comment:${targetType}:${targetId}`;
}

export function helpfulScope(targetType: FeedbackTargetType, targetId: string, commentId: string) {
  return `helpful:${targetType}:${targetId}:${commentId}`;
}
