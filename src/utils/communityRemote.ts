import type {
  CommentCursor,
  CommentEntry,
  CommunityAggregate,
  CommunityCommentPage,
  FeedbackTargetType,
  RatingEntry,
} from '../types/community';
import { safeRead, safeRemove, safeWrite } from './browserStorage';
import { communityApiUrl, remoteEnabled } from './communityConfig';
import { requestCommunityHumanProof } from './communityHumanCheck';

const URL = communityApiUrl;
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_LEADERBOARD_TARGETS = 100;
const DEFAULT_COMMENT_PAGE_SIZE = 10;
const MAX_COMMENT_PAGE_SIZE = 50;
const ACTOR_KEY = 'tlp-community-actor:v1';
const ACTOR_EXPIRY_SKEW_MS = 60_000;
const MAX_ACTOR_TOKEN_LENGTH = 4096;

type StoredActorSession = {
  version: 1;
  actorToken: string;
  expiresAt: number;
};

type SessionResponse = {
  actorToken?: unknown;
  expiresAt?: unknown;
};

type AggregateResponse = CommunityAggregate;
type AggregateBatchResponse = { aggregates?: CommunityAggregate[] };
type CommentsResponse = {
  comments?: CommentEntry[];
  nextCursor?: CommentCursor | null;
};

export { remoteEnabled };

export function emptyCommunityAggregate(
  targetType: FeedbackTargetType,
  targetId: string,
): CommunityAggregate {
  return {
    targetType,
    targetId,
    ratingCount: 0,
    commentCount: 0,
    overall: 0,
    dimensions: {},
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    deviation: null,
  };
}

async function fetchWithTimeout(input: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

function apiUrl(path: string) {
  return `${URL}${path}`;
}

function jsonHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...extra,
  };
}

function sanitizeAggregate(value: unknown, targetType: FeedbackTargetType, targetId: string): CommunityAggregate | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<CommunityAggregate>;
  if (candidate.targetType !== targetType || candidate.targetId !== targetId) return null;
  const dimensions = candidate.dimensions && typeof candidate.dimensions === 'object' && !Array.isArray(candidate.dimensions)
    ? Object.fromEntries(Object.entries(candidate.dimensions)
        .map(([key, raw]) => [key, Number(raw)] as const)
        .filter(([, score]) => Number.isFinite(score) && score >= 0 && score <= 5))
    : {};
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (candidate.distribution && typeof candidate.distribution === 'object' && !Array.isArray(candidate.distribution)) {
    for (const [key, raw] of Object.entries(candidate.distribution)) {
      const bucket = Number(key);
      const count = Number(raw);
      if (Number.isInteger(bucket) && bucket >= 1 && bucket <= 5 && Number.isFinite(count) && count >= 0) {
        distribution[bucket] = Math.floor(count);
      }
    }
  }
  const deviation = candidate.deviation === null ? null : Number(candidate.deviation);
  return {
    targetType,
    targetId,
    ratingCount: Math.max(0, Math.floor(Number(candidate.ratingCount) || 0)),
    commentCount: Math.max(0, Math.floor(Number(candidate.commentCount) || 0)),
    overall: Math.max(0, Math.min(5, Number(candidate.overall) || 0)),
    dimensions,
    distribution,
    deviation: deviation === null || !Number.isFinite(deviation) ? null : Math.max(0, deviation),
  };
}

function sanitizeComment(value: unknown): CommentEntry | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<CommentEntry>;
  if (
    typeof candidate.id !== 'string'
    || typeof candidate.targetId !== 'string'
    || !['poet', 'poem', 'track', 'article'].includes(String(candidate.targetType))
    || typeof candidate.author !== 'string'
    || typeof candidate.text !== 'string'
    || !['literary', 'history', 'moral', 'performance'].includes(String(candidate.kind))
    || typeof candidate.createdAt !== 'string'
  ) return null;
  return {
    id: candidate.id,
    targetType: candidate.targetType as FeedbackTargetType,
    targetId: candidate.targetId,
    author: candidate.author,
    text: candidate.text,
    kind: candidate.kind as CommentEntry['kind'],
    helpful: Math.max(0, Math.floor(Number(candidate.helpful) || 0)),
    createdAt: candidate.createdAt,
  };
}

function readActorSession(): StoredActorSession | null {
  const raw = safeRead(ACTOR_KEY);
  if (!raw) return null;
  try {
    const candidate = JSON.parse(raw) as Partial<StoredActorSession>;
    if (
      candidate.version !== 1
      || typeof candidate.actorToken !== 'string'
      || candidate.actorToken.length < 32
      || candidate.actorToken.length > MAX_ACTOR_TOKEN_LENGTH
      || !Number.isFinite(Number(candidate.expiresAt))
    ) return null;
    return { version: 1, actorToken: candidate.actorToken, expiresAt: Number(candidate.expiresAt) };
  } catch {
    return null;
  }
}

function persistActorSession(value: StoredActorSession) {
  return safeWrite(ACTOR_KEY, JSON.stringify(value));
}

async function mintActorSession(): Promise<string | null> {
  if (!remoteEnabled || !URL) return null;
  const humanProof = await requestCommunityHumanProof();
  if (!humanProof) return null;
  try {
    const response = await fetchWithTimeout(apiUrl('/v1/session'), {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ turnstileToken: humanProof }),
    });
    if (!response.ok) return null;
    const payload = await response.json() as SessionResponse;
    const actorToken = typeof payload.actorToken === 'string' ? payload.actorToken : '';
    const expiresAt = Number(payload.expiresAt);
    if (
      actorToken.length < 32
      || actorToken.length > MAX_ACTOR_TOKEN_LENGTH
      || !Number.isFinite(expiresAt)
      || expiresAt <= Date.now() + ACTOR_EXPIRY_SKEW_MS
    ) return null;
    const session: StoredActorSession = { version: 1, actorToken, expiresAt };
    if (!persistActorSession(session)) return null;
    return actorToken;
  } catch {
    return null;
  }
}

let actorPromise: Promise<string | null> | null = null;
async function getActorToken(forceRefresh = false): Promise<string | null> {
  if (!remoteEnabled) return null;
  if (!forceRefresh) {
    const existing = readActorSession();
    if (existing && existing.expiresAt > Date.now() + ACTOR_EXPIRY_SKEW_MS) return existing.actorToken;
  } else {
    safeRemove(ACTOR_KEY);
  }
  if (actorPromise) return actorPromise;
  const pending = mintActorSession().finally(() => { actorPromise = null; });
  actorPromise = pending;
  return pending;
}

async function mutation(path: string, body: Record<string, unknown>): Promise<boolean> {
  if (!remoteEnabled || !URL) return false;
  const attempt = async (forceRefresh: boolean) => {
    const actorToken = await getActorToken(forceRefresh);
    if (!actorToken) return { ok: false, unauthorized: false };
    try {
      const response = await fetchWithTimeout(apiUrl(path), {
        method: 'POST',
        headers: jsonHeaders({ Authorization: `Bearer ${actorToken}` }),
        body: JSON.stringify(body),
      });
      return { ok: response.ok, unauthorized: response.status === 401 };
    } catch {
      return { ok: false, unauthorized: false };
    }
  };

  const first = await attempt(false);
  if (first.ok) return true;
  if (!first.unauthorized) return false;
  return (await attempt(true)).ok;
}

export async function fetchTargetAggregate(
  targetType: FeedbackTargetType,
  targetId: string,
): Promise<CommunityAggregate | null> {
  if (!remoteEnabled || !URL) return null;
  try {
    const params = new URLSearchParams({ targetType, targetId });
    const response = await fetchWithTimeout(apiUrl(`/v1/summary?${params.toString()}`), {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    return sanitizeAggregate(await response.json() as AggregateResponse, targetType, targetId);
  } catch {
    return null;
  }
}

export async function fetchPoetAggregates(targetIds: readonly string[]): Promise<CommunityAggregate[] | null> {
  if (!remoteEnabled || !URL) return null;
  const ids = [...new Set(targetIds)].filter(Boolean).slice(0, MAX_LEADERBOARD_TARGETS);
  if (!ids.length) return [];
  try {
    const response = await fetchWithTimeout(apiUrl('/v1/summary/batch'), {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ targetType: 'poet', targetIds: ids }),
    });
    if (!response.ok) return null;
    const payload = await response.json() as AggregateBatchResponse;
    if (!Array.isArray(payload.aggregates)) return null;
    const byId = new Map<string, CommunityAggregate>();
    for (const id of ids) {
      const raw = payload.aggregates.find((entry) => entry?.targetType === 'poet' && entry?.targetId === id);
      const aggregate = sanitizeAggregate(raw, 'poet', id);
      if (aggregate) byId.set(id, aggregate);
    }
    return ids.map((targetId) => byId.get(targetId) ?? emptyCommunityAggregate('poet', targetId));
  } catch {
    return null;
  }
}

export async function fetchTargetCommentsPage(
  targetType: FeedbackTargetType,
  targetId: string,
  cursor: CommentCursor | null = null,
  requestedLimit = DEFAULT_COMMENT_PAGE_SIZE,
): Promise<CommunityCommentPage | null> {
  if (!remoteEnabled || !URL) return null;
  const limit = Math.max(1, Math.min(MAX_COMMENT_PAGE_SIZE, Math.floor(requestedLimit) || DEFAULT_COMMENT_PAGE_SIZE));
  try {
    const params = new URLSearchParams({ targetType, targetId, limit: String(limit) });
    if (cursor) {
      params.set('cursorCreatedAt', cursor.createdAt);
      params.set('cursorId', cursor.id);
    }
    const response = await fetchWithTimeout(apiUrl(`/v1/comments?${params.toString()}`), {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const payload = await response.json() as CommentsResponse;
    if (!Array.isArray(payload.comments)) return null;
    const comments = payload.comments.map(sanitizeComment).filter((entry): entry is CommentEntry => Boolean(entry));
    const nextCursor = payload.nextCursor && typeof payload.nextCursor === 'object'
      && typeof payload.nextCursor.createdAt === 'string' && typeof payload.nextCursor.id === 'string'
      ? { createdAt: payload.nextCursor.createdAt, id: payload.nextCursor.id }
      : null;
    return { comments, nextCursor };
  } catch {
    return null;
  }
}

export async function submitRatingRemote(entry: RatingEntry, _localDeviceId: string): Promise<boolean> {
  return mutation('/v1/rating', {
    targetType: entry.targetType,
    targetId: entry.targetId,
    scores: entry.scores,
  });
}

export async function submitCommentRemote(entry: CommentEntry, _localDeviceId: string): Promise<boolean> {
  return mutation('/v1/comment', {
    commentId: entry.id,
    targetType: entry.targetType,
    targetId: entry.targetId,
    author: entry.author,
    text: entry.text,
    commentKind: entry.kind,
  });
}

export async function markHelpfulRemote(commentId: string, _localDeviceId: string): Promise<boolean> {
  return mutation('/v1/helpful', { commentId });
}
