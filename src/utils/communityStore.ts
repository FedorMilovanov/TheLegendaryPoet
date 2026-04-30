import { CommentEntry, FeedbackSnapshot, FeedbackTargetType, RatingEntry } from '../types/community';

const STORE_KEY = 'tlp-community-feedback-v1';
const COOLDOWN_KEY = 'tlp-community-cooldowns-v1';
const HELPFUL_KEY = 'tlp-community-helpful-v1';
const RATED_KEY = 'tlp-community-rated-v1';
const COOLDOWN_MS = 30 * 1000;

const emptySnapshot: FeedbackSnapshot = {
  ratings: [],
  comments: [],
};

export function loadFeedback(): FeedbackSnapshot {
  if (typeof window === 'undefined') return emptySnapshot;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : emptySnapshot;
  } catch {
    return emptySnapshot;
  }
}

export function saveFeedback(snapshot: FeedbackSnapshot) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(snapshot));
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
  const overall = Object.values(dimensions).reduce((sum, value) => sum + value, 0) / Object.values(dimensions).length;
  return { overall, dimensions };
}

export function distributionFromRatings(ratings: RatingEntry[]) {
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach((rating) => {
    const values = Object.values(rating.scores);
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
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(COOLDOWN_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCooldowns(value: Record<string, number>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(COOLDOWN_KEY, JSON.stringify(value));
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
  saveCooldowns(cooldowns);
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

function saveHelpfulVotes(value: Record<string, true>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(HELPFUL_KEY, JSON.stringify(value));
}

export function canMarkHelpful(scope: string) {
  const votes = loadHelpfulVotes();
  return !votes[scope];
}

export function rememberHelpful(scope: string) {
  const votes = loadHelpfulVotes();
  votes[scope] = true;
  saveHelpfulVotes(votes);
}

function loadRatedScopes(): Record<string, true> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(RATED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveRatedScopes(value: Record<string, true>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(RATED_KEY, JSON.stringify(value));
}

export function hasRated(scope: string) {
  const rated = loadRatedScopes();
  return !!rated[scope];
}

export function rememberRated(scope: string) {
  const rated = loadRatedScopes();
  rated[scope] = true;
  saveRatedScopes(rated);
}