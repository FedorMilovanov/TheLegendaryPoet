import { CommentEntry, FeedbackSnapshot, FeedbackTargetType, RatingEntry } from '../types/community';
import { fetchAllRemote, remoteEnabled } from './communityRemote';

const STORE_KEY = 'tlp-community-feedback-v1';
const COOLDOWN_KEY = 'tlp-community-cooldowns-v1';
const HELPFUL_KEY = 'tlp-community-helpful-v1';
const RATED_KEY = 'tlp-community-rated-v1';
const COOLDOWN_MS = 30 * 1000;

export interface OwnRatingRecord {
  id: string;
  scores: Record<string, number>;
  updatedAt: string;
}

type RatedScopes = Record<string, OwnRatingRecord | true>;

const emptySnapshot: FeedbackSnapshot = {
  ratings: [],
  comments: [],
};

/** Safe localStorage write: never throws in private mode or on quota errors. */
function safeWrite(key: string, value: unknown): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function readRaw(): FeedbackSnapshot {
  if (typeof window === 'undefined') return emptySnapshot;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    const parsed = raw ? (JSON.parse(raw) as FeedbackSnapshot) : emptySnapshot;
    if (!parsed || !Array.isArray(parsed.ratings) || !Array.isArray(parsed.comments)) return emptySnapshot;
    return parsed;
  } catch {
    return emptySnapshot;
  }
}

let current: FeedbackSnapshot = readRaw();
const listeners = new Set<() => void>();
let storageBound = false;

function emit() {
  listeners.forEach((listener) => listener());
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
  return () => listeners.delete(listener);
}

export function getFeedbackSnapshot(): FeedbackSnapshot {
  return current;
}

/** Pull the shared snapshot once. The local cache remains the offline fallback. */
export async function hydrateFromRemote(): Promise<void> {
  if (!remoteEnabled) return;
  const remote = await fetchAllRemote();
  if (!remote) return;
  current = remote;
  safeWrite(STORE_KEY, current);
  emit();
}

export const isFeedbackShared = remoteEnabled;

export function loadFeedback(): FeedbackSnapshot {
  return current;
}

export function mutateFeedback(update: (snapshot: FeedbackSnapshot) => FeedbackSnapshot): boolean {
  const next = update(current);
  const ok = safeWrite(STORE_KEY, next);
  current = next;
  emit();
  return ok;
}

export function makeFeedbackId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function filterRatings(snapshot: FeedbackSnapshot, targetType: FeedbackTargetType, targetId: string): RatingEntry[] {
  return snapshot.ratings.filter((item) => item.targetType === targetType && item.targetId === targetId);
}

export function filterComments(snapshot: FeedbackSnapshot, targetType: FeedbackTargetType, targetId: string): CommentEntry[] {
  return snapshot.comments.filter((item) => item.targetType === targetType && item.targetId === targetId);
}

export function averageScores(ratings: RatingEntry[]) {
  if (!ratings.length) return { overall: 0, dimensions: {} as Record<string, number> };
  const totals: Record<string, number> = {};
  ratings.forEach((rating) => {
    Object.entries(rating.scores).forEach(([key, value]) => {
      totals[key] = (totals[key] || 0) + value;
    });
  });
  const dimensions = Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, value / ratings.length]));
  const dimensionValues = Object.values(dimensions);
  const overall = dimensionValues.length
    ? dimensionValues.reduce((sum, value) => sum + value, 0) / dimensionValues.length
    : 0;
  return { overall, dimensions };
}

export function distributionFromRatings(ratings: RatingEntry[]) {
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach((rating) => {
    const values = Object.values(rating.scores);
    if (!values.length) return;
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    distribution[Math.max(1, Math.min(5, Math.round(average)))] += 1;
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
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(COOLDOWN_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function checkCooldown(scope: string) {
  const until = loadCooldowns()[scope] || 0;
  const now = Date.now();
  return { allowed: until <= now, remainingMs: Math.max(0, until - now) };
}

export function setCooldown(scope: string) {
  const cooldowns = loadCooldowns();
  cooldowns[scope] = Date.now() + COOLDOWN_MS;
  safeWrite(COOLDOWN_KEY, cooldowns);
}

function loadHelpfulVotes(): Record<string, true> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(HELPFUL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function canMarkHelpful(scope: string) {
  return !loadHelpfulVotes()[scope];
}

export function rememberHelpful(scope: string) {
  const votes = loadHelpfulVotes();
  votes[scope] = true;
  safeWrite(HELPFUL_KEY, votes);
}

function loadRatedScopes(): RatedScopes {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(RATED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getOwnRating(scope: string): OwnRatingRecord | null {
  const value = loadRatedScopes()[scope];
  if (!value || value === true || typeof value !== 'object') return null;
  if (typeof value.id !== 'string' || !value.id || !value.scores || typeof value.scores !== 'object') return null;
  return value;
}

export function hasRated(scope: string) {
  return Boolean(loadRatedScopes()[scope]);
}

export function rememberRating(scope: string, record: OwnRatingRecord) {
  const rated = loadRatedScopes();
  rated[scope] = record;
  safeWrite(RATED_KEY, rated);
}

/** Compatibility for older callers and pre-update local data. */
export function rememberRated(scope: string) {
  const rated = loadRatedScopes();
  if (!rated[scope]) rated[scope] = true;
  safeWrite(RATED_KEY, rated);
}
