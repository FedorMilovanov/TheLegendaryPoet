import type {
  CommentCursor,
  CommentEntry,
  CommunityAggregate,
  CommunityCommentPage,
  FeedbackTargetType,
  RatingEntry,
} from '../types/community';

const VITE_ENV = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
const NODE_ENV = typeof process !== 'undefined' ? process.env : undefined;
const URL = (VITE_ENV?.VITE_SUPABASE_URL ?? NODE_ENV?.VITE_SUPABASE_URL)?.replace(/\/$/, '');
const KEY = VITE_ENV?.VITE_SUPABASE_ANON_KEY ?? NODE_ENV?.VITE_SUPABASE_ANON_KEY;

const RATINGS_VIEW = 'tlp_ratings_public';
const COMMENTS_VIEW = 'tlp_comments_public';
const SUMMARY_VIEW = 'tlp_feedback_summary_public';
const TARGET_RATING_FALLBACK_LIMIT = 2_000;
const DEFAULT_COMMENT_PAGE_SIZE = 10;
const MAX_COMMENT_PAGE_SIZE = 50;
const MAX_LEADERBOARD_TARGETS = 100;
const REQUEST_TIMEOUT_MS = 12_000;

export const remoteEnabled = Boolean(URL && KEY);

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: KEY as string,
    Authorization: `Bearer ${KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

interface RatingRow {
  id: string;
  target_type: string;
  target_id: string;
  scores: Record<string, number>;
  created_at: string;
}

interface CommentRow {
  id: string;
  target_type: string;
  target_id: string;
  author: string;
  text: string;
  kind: string;
  helpful: number;
  created_at: string;
}

interface AggregateRow {
  target_type: string;
  target_id: string;
  rating_count: number;
  comment_count: number;
  overall: number | null;
  dimensions: Record<string, number> | null;
  distribution: Record<string, number> | null;
  deviation: number | null;
}

function rowToRating(row: RatingRow): RatingEntry {
  return {
    id: row.id,
    targetType: row.target_type as RatingEntry['targetType'],
    targetId: row.target_id,
    scores: row.scores || {},
    createdAt: row.created_at,
  };
}

function rowToComment(row: CommentRow): CommentEntry {
  return {
    id: row.id,
    targetType: row.target_type as CommentEntry['targetType'],
    targetId: row.target_id,
    author: row.author,
    text: row.text,
    kind: row.kind as CommentEntry['kind'],
    helpful: row.helpful ?? 0,
    createdAt: row.created_at,
  };
}

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

function rowToAggregate(row: AggregateRow): CommunityAggregate {
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const [key, value] of Object.entries(row.distribution ?? {})) {
    const bucket = Number(key);
    if (Number.isInteger(bucket) && bucket >= 1 && bucket <= 5) {
      distribution[bucket] = Math.max(0, Math.floor(Number(value) || 0));
    }
  }

  return {
    targetType: row.target_type as FeedbackTargetType,
    targetId: row.target_id,
    ratingCount: Math.max(0, Math.floor(Number(row.rating_count) || 0)),
    commentCount: Math.max(0, Math.floor(Number(row.comment_count) || 0)),
    overall: Math.max(0, Math.min(5, Number(row.overall) || 0)),
    dimensions: Object.fromEntries(
      Object.entries(row.dimensions ?? {})
        .map(([key, value]) => [key, Math.max(0, Math.min(5, Number(value) || 0))] as const)
        .filter(([, value]) => value > 0),
    ),
    distribution,
    deviation: row.deviation === null || !Number.isFinite(Number(row.deviation))
      ? null
      : Math.max(0, Number(row.deviation)),
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

function buildRestUrl(view: string, params: URLSearchParams) {
  return `${URL}/rest/v1/${view}?${params.toString()}`;
}

function parseTotal(response: Response, fallback: number) {
  const contentRange = response.headers.get('Content-Range');
  const total = Number(contentRange?.split('/')[1]);
  return Number.isFinite(total) && total >= 0 ? total : fallback;
}

function aggregateRatings(
  targetType: FeedbackTargetType,
  targetId: string,
  ratings: RatingEntry[],
  commentCount: number,
): CommunityAggregate {
  const dimensionTotals = new Map<string, { sum: number; count: number }>();
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const overallValues: number[] = [];

  for (const rating of ratings) {
    const scores = Object.entries(rating.scores)
      .map(([key, value]) => [key, Number(value)] as const)
      .filter(([, value]) => Number.isFinite(value) && value >= 1 && value <= 5);
    if (!scores.length) continue;

    const overall = scores.reduce((sum, [, value]) => sum + value, 0) / scores.length;
    overallValues.push(overall);
    distribution[Math.max(1, Math.min(5, Math.round(overall)))] += 1;

    for (const [key, value] of scores) {
      const current = dimensionTotals.get(key) ?? { sum: 0, count: 0 };
      current.sum += value;
      current.count += 1;
      dimensionTotals.set(key, current);
    }
  }

  const overall = overallValues.length
    ? overallValues.reduce((sum, value) => sum + value, 0) / overallValues.length
    : 0;
  const deviation = overallValues.length > 1
    ? Math.sqrt(overallValues.reduce((sum, value) => sum + (value - overall) ** 2, 0) / overallValues.length)
    : null;

  return {
    targetType,
    targetId,
    ratingCount: overallValues.length,
    commentCount,
    overall,
    dimensions: Object.fromEntries(
      [...dimensionTotals].map(([key, value]) => [key, value.count ? value.sum / value.count : 0]),
    ),
    distribution,
    deviation,
  };
}

async function fetchCommentCount(targetType: FeedbackTargetType, targetId: string): Promise<number | null> {
  const params = new URLSearchParams({
    select: 'id',
    target_type: `eq.${targetType}`,
    target_id: `eq.${targetId}`,
    limit: '1',
  });
  const response = await fetchWithTimeout(buildRestUrl(COMMENTS_VIEW, params), {
    headers: headers({ Prefer: 'count=exact', Range: '0-0' }),
  });
  if (!response.ok) return null;
  return parseTotal(response, 0);
}

async function fetchTargetAggregateFallback(
  targetType: FeedbackTargetType,
  targetId: string,
): Promise<CommunityAggregate | null> {
  const params = new URLSearchParams({
    select: 'id,target_type,target_id,scores,created_at',
    target_type: `eq.${targetType}`,
    target_id: `eq.${targetId}`,
    order: 'created_at.desc,id.desc',
    limit: String(TARGET_RATING_FALLBACK_LIMIT),
  });

  const [ratingsResponse, commentCount] = await Promise.all([
    fetchWithTimeout(buildRestUrl(RATINGS_VIEW, params), {
      headers: headers({ Prefer: 'count=exact', Range: `0-${TARGET_RATING_FALLBACK_LIMIT - 1}` }),
    }),
    fetchCommentCount(targetType, targetId),
  ]);
  if (!ratingsResponse.ok || commentCount === null) return null;

  const rows = await ratingsResponse.json() as RatingRow[];
  if (!Array.isArray(rows)) return null;
  const total = parseTotal(ratingsResponse, rows.length);
  if (total > TARGET_RATING_FALLBACK_LIMIT) return null;
  return aggregateRatings(targetType, targetId, rows.map(rowToRating), commentCount);
}

export async function fetchTargetAggregate(
  targetType: FeedbackTargetType,
  targetId: string,
): Promise<CommunityAggregate | null> {
  if (!remoteEnabled) return null;
  try {
    const params = new URLSearchParams({
      select: '*',
      target_type: `eq.${targetType}`,
      target_id: `eq.${targetId}`,
      limit: '1',
    });
    const response = await fetchWithTimeout(buildRestUrl(SUMMARY_VIEW, params), { headers: headers() });
    if (response.ok) {
      const rows = await response.json() as AggregateRow[];
      if (!Array.isArray(rows)) return null;
      return rows[0] ? rowToAggregate(rows[0]) : emptyCommunityAggregate(targetType, targetId);
    }
    if (response.status !== 404) return null;
    return fetchTargetAggregateFallback(targetType, targetId);
  } catch {
    return null;
  }
}

function postgrestIn(values: readonly string[]) {
  return `in.(${values.map((value) => `"${value.replace(/["\\]/g, '')}"`).join(',')})`;
}

export async function fetchPoetAggregates(targetIds: readonly string[]): Promise<CommunityAggregate[] | null> {
  if (!remoteEnabled) return null;
  const ids = [...new Set(targetIds)].filter(Boolean).slice(0, MAX_LEADERBOARD_TARGETS);
  if (!ids.length) return [];

  try {
    const params = new URLSearchParams({
      select: '*',
      target_type: 'eq.poet',
      target_id: postgrestIn(ids),
      order: 'target_id.asc',
      limit: String(ids.length),
    });
    const response = await fetchWithTimeout(buildRestUrl(SUMMARY_VIEW, params), { headers: headers() });
    if (response.ok) {
      const rows = await response.json() as AggregateRow[];
      if (!Array.isArray(rows)) return null;
      const byId = new Map(rows.map((row) => [row.target_id, rowToAggregate(row)]));
      return ids.map((targetId) => byId.get(targetId) ?? emptyCommunityAggregate('poet', targetId));
    }
    return null;
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
  if (!remoteEnabled) return null;
  const limit = Math.max(1, Math.min(MAX_COMMENT_PAGE_SIZE, Math.floor(requestedLimit) || DEFAULT_COMMENT_PAGE_SIZE));

  try {
    const params = new URLSearchParams({
      select: '*',
      target_type: `eq.${targetType}`,
      target_id: `eq.${targetId}`,
      order: 'created_at.desc,id.desc',
      limit: String(limit + 1),
    });
    if (cursor) {
      params.set('or', `(created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id}))`);
    }

    const response = await fetchWithTimeout(buildRestUrl(COMMENTS_VIEW, params), { headers: headers() });
    if (!response.ok) return null;
    const rows = await response.json() as CommentRow[];
    if (!Array.isArray(rows)) return null;

    const hasMore = rows.length > limit;
    const comments = rows.slice(0, limit).map(rowToComment);
    const last = comments.at(-1);
    return {
      comments,
      nextCursor: hasMore && last ? { createdAt: last.createdAt, id: last.id } : null,
    };
  } catch {
    return null;
  }
}

async function rpc(name: string, body: Record<string, unknown>): Promise<boolean> {
  if (!remoteEnabled) return false;
  try {
    const response = await fetchWithTimeout(`${URL}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: headers({ Prefer: 'return=minimal' }),
      body: JSON.stringify(body),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function submitRatingRemote(entry: RatingEntry, voterId: string): Promise<boolean> {
  return rpc('tlp_submit_rating', {
    p_id: entry.id,
    p_target_type: entry.targetType,
    p_target_id: entry.targetId,
    p_voter_id: voterId,
    p_scores: entry.scores,
  });
}

export async function submitCommentRemote(entry: CommentEntry, voterId: string): Promise<boolean> {
  return rpc('tlp_submit_comment', {
    p_id: entry.id,
    p_target_type: entry.targetType,
    p_target_id: entry.targetId,
    p_voter_id: voterId,
    p_author: entry.author,
    p_text: entry.text,
    p_kind: entry.kind,
  });
}

export async function markHelpfulRemote(commentId: string, voterId: string): Promise<boolean> {
  return rpc('tlp_mark_helpful', { p_comment_id: commentId, p_voter_id: voterId });
}
