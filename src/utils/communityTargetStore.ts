import type { FeedbackSnapshot, FeedbackTargetType } from '../types/community';
import { filterComments, filterRatings, getFeedbackSnapshot, subscribeFeedback } from './communityStore';

type TargetRecord = {
  targetType: FeedbackTargetType;
  targetId: string;
  snapshot: FeedbackSnapshot;
  fingerprint: string;
};

const records = new Map<string, TargetRecord>();
const listeners = new Map<string, Set<() => void>>();
let stopGlobalSubscription: (() => void) | null = null;

function targetKey(targetType: FeedbackTargetType, targetId: string) {
  return `${targetType}:${targetId}`;
}

function buildSnapshot(targetType: FeedbackTargetType, targetId: string): FeedbackSnapshot {
  const source = getFeedbackSnapshot();
  return {
    ratings: filterRatings(source, targetType, targetId),
    comments: filterComments(source, targetType, targetId),
  };
}

function fingerprint(snapshot: FeedbackSnapshot) {
  return JSON.stringify({
    ratings: snapshot.ratings.map((rating) => [
      rating.id,
      rating.createdAt,
      Object.entries(rating.scores).sort(([left], [right]) => left.localeCompare(right)),
    ]),
    comments: snapshot.comments.map((comment) => [
      comment.id,
      comment.createdAt,
      comment.author,
      comment.text,
      comment.kind,
      comment.helpful,
    ]),
  });
}

function ensureRecord(targetType: FeedbackTargetType, targetId: string) {
  const key = targetKey(targetType, targetId);
  const nextSnapshot = buildSnapshot(targetType, targetId);
  const nextFingerprint = fingerprint(nextSnapshot);
  const existing = records.get(key);
  if (existing && existing.fingerprint === nextFingerprint) return existing;

  const record = { targetType, targetId, snapshot: nextSnapshot, fingerprint: nextFingerprint };
  records.set(key, record);
  return record;
}

function refreshSubscribedTargets() {
  for (const [key, bucket] of listeners) {
    const existing = records.get(key);
    if (!existing) continue;
    const previousFingerprint = existing.fingerprint;
    const next = ensureRecord(existing.targetType, existing.targetId);
    if (next.fingerprint !== previousFingerprint) {
      for (const listener of bucket) listener();
    }
  }
}

function ensureGlobalSubscription() {
  if (!stopGlobalSubscription) stopGlobalSubscription = subscribeFeedback(refreshSubscribedTargets);
}

export function getFeedbackTargetSnapshot(targetType: FeedbackTargetType, targetId: string) {
  return ensureRecord(targetType, targetId).snapshot;
}

export function subscribeFeedbackTarget(targetType: FeedbackTargetType, targetId: string, listener: () => void) {
  const key = targetKey(targetType, targetId);
  ensureRecord(targetType, targetId);
  const bucket = listeners.get(key) ?? new Set<() => void>();
  bucket.add(listener);
  listeners.set(key, bucket);
  ensureGlobalSubscription();

  return () => {
    const current = listeners.get(key);
    current?.delete(listener);
    if (current?.size === 0) listeners.delete(key);
    if (listeners.size === 0 && stopGlobalSubscription) {
      stopGlobalSubscription();
      stopGlobalSubscription = null;
      records.clear();
    }
  };
}
