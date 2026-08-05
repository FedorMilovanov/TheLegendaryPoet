import type {
  CommentCursor,
  CommentEntry,
  CommunityAggregate,
  FeedbackTargetType,
  RatingDistribution,
  RatingEntry,
} from '../types/community';

const VITE_ENV = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
const NODE_ENV = typeof process !== 'undefined' ? process.env : undefined;
const URL = (VITE_ENV?.VITE_SUPABASE_URL ?? NODE_ENV?.VITE_SUPABASE_URL)?.replace(/\/$/, '');
const KEY = VITE_ENV?.VITE_SUPABASE_ANON_KEY ?? NODE_ENV?.VITE_SUPABASE_ANON_KEY;

const TARGETS_VIEW = 'tlp_community_targets_public';
const RATINGS_VIEW = 'tlp_ratings_public';
const COMMENTS_VIEW = 'tlp_comments_public';
const COMMENTS_RPC = 'tlp_fetch_comments_page';
const TARGET_RATING_FALLBACK_LIMIT = 500;
export const COMMENT_PAGE_SIZE = 10;
const REQUEST_TIMEOUT_MS = 12_000;

export const remoteEnabled = Boolean(URL && KEY);

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
  rating_count: number | string | null;
  comment_count: number | string | null;
  overall: number | string | null;
  dimensions: Record<string, number> | null;
  distribution: Record<string, number> | null;
  deviation: number | string | null;
}

export interface RemoteCommentPage {
  comments: CommentEntry[];
  cursor: CommentCursor | null;
  hasMore: boolean;
}

export interface RemoteTargetResult {
  aggregate: CommunityAggregate;
  page: RemoteCommentPage;
  source: 'aggregate' | 'target-fallback';
  message: string | null;
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: KEY as string,
    Authorization: `Bearer ${KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

function cleanNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function cleanRecord(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .map(([key, raw]) => [key, cleanNumber(raw)] as const)
      .filter(([, number]) => Number.isFinite(number)),
  );
}

function emptyDistribution(): RatingDistribution {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
}

function cleanDistribution(value: unknown): RatingDistribution {
  const result = emptyDistribution();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
  for (const score of [1, 2, 3, 4, 5] as const) {
    result[score] = Math.max(0, Math.floor(cleanNumber((value as Record<string, unknown>)[String(score)])));
  }
  return result;
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
    helpful: Math.max(0, Math.floor(cleanNumber(row.helpful))),
    createdAt: row.created_at,
  };
}

function rowToAggregate(row: AggregateRow): CommunityAggregate {
  const deviation = row.deviation === null || row.deviation === undefined
    ? null
    : cleanNumber(row.deviation);
  return {
    targetType: row.target_type as FeedbackTargetType,
    targetId: row.target_id,
    ratingCount: Math.max(0, Math.floor(cleanNumber(row.rating_count))),
    commentCount: Math.max(0, Math.floor(cleanNumber(row.comment_count))),
    overall: cleanNumber(row.overall),
    dimensions: cleanRecord(row.dimensions),
    distribution: cleanDistribution(row.distribution),
    deviation,
  };
}

function ratingAverage(scores: Record<string, number>) {
  const values = Object.values(scores).filter((value) => Number.isFinite(value) && value >= 1 && value <= 5);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function aggregateRatings(
  targetType: FeedbackTargetType,
  targetId: string,
  ratings: RatingEntry[],
  commentCount: number,
): CommunityAggregate {
  const dimensionTotals: Record<string, number> = {};
  const dimensionCounts: Record<string, number> = {};
  const overallValues: number[] = [];
  const distribution = emptyDistribution();

  for (const rating of ratings) {
    const average = ratingAverage(rating.scores);
    if (average > 0) {
      overallValues.push(average);
      distribution[Math.max(1, Math.min(5, Math.round(average))) as 1 | 2 | 3 | 4 | 5] += 1;
    }
    for (const [key, score] of Object.entries(rating.scores)) {
      if (!Number.isFinite(score) || score < 1 || score > 5) continue;
      dimensionTotals[key] = (dimensionTotals[key] ?? 0) + score;
      dimensionCounts[key] = (dimensionCounts[key] ?? 0) + 1;
    }
  }

  const dimensions = Object.fromEntries(
    Object.keys(dimensionTotals).map((key) => [key, dimensionTotals[key] / dimensionCounts[key]]),
  );
  const dimensionValues = Object.values(dimensions);
  const overall = dimensionValues.length
    ? dimensionValues.reduce((sum, value) => sum + value, 0) / dimensionValues.length
    : 0;
  const deviation = overallValues.length > 1
    ? Math.sqrt(overallValues.reduce((sum, value) => sum + (value - (overallValues.reduce((a, b) => a + b, 0) / overallValues.length)) ** 2, 0) / overallValues.length)
    : null;

  return {
    targetType,
    targetId,
    ratingCount: ratings.length,
    commentCount,
    overall,
    dimensions,
    distribution,
    deviation,
  };
}

async function fetchWithTimeout(input: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

async function requestJson<Row>(input: string, init: RequestInit = {}) {
  try {
    const response = await fetchWithTimeout(input, { ...init, headers: headers(init.headers as Record<string, string> | undefined) });
    if (!response.ok) return { ok: false as const, status: response.status, data: null };
    const data = await response.json() as Row;
    return { ok: true as const, status: response.status, data };
  } catch {
    return { ok: false as const, status: 0, data: null };
  }
}

function targetQuery(targetType: FeedbackTargetType, targetId: string) {
  return `target_type=eq.${encodeURIComponent(targetType)}&target_id=eq.${encodeURIComponent(targetId)}`;
}

async function fetchAggregate(targetType: FeedbackTargetType, targetId: string) {
  const result = await requestJson<AggregateRow[]>(
    `${URL}/rest/v1/${TARGETS_VIEW}?select=*&${targetQuery(targetType, targetId)}&limit=1`,
  );
  if (!result.ok || !Array.isArray(result.data)) return null;
  return result.data[0]
    ? rowToAggregate(result.data[0])
    : rowToAggregate({
        target_type: targetType,
        target_id: targetId,
        rating_count: 0,
        comment_count: 0,
        overall: 0,
        dimensions: {},
        distribution: {},
        deviation: null,
      });
}

async function fetchTargetRatingsFallback(targetType: FeedbackTargetType, targetId: string) {
  const result = await requestJson<RatingRow[]>(
    `${URL}/rest/v1/${RATINGS_VIEW}?select=*&${targetQuery(targetType, targetId)}&order=created_at.desc,id.desc&limit=${TARGET_RATING_FALLBACK_LIMIT}`,
    { headers: { Prefer: 'count=exact', Range: `0-${TARGET_RATING_FALLBACK_LIMIT - 1}` } },
  );
  return result.ok && Array.isArray(result.data) ? result.data.map(rowToRating) : null;
}

async function fetchCommentsRpc(
  targetType: FeedbackTargetType,
  targetId: string,
  cursor: CommentCursor | null,
): Promise<RemoteCommentPage | null> {
  const result = await requestJson<CommentRow[]>(`${URL}/rest/v1/rpc/${COMMENTS_RPC}`, {
    method: 'POST',
    body: JSON.stringify({
      p_target_type: targetType,
      p_target_id: targetId,
      p_before_created_at: cursor?.createdAt ?? null,
      p_before_id: cursor?.id ?? null,
      p_limit: COMMENT_PAGE_SIZE + 1,
    }),
  });
  if (!result.ok || !Array.isArray(result.data)) return null;
  const mapped = result.data.map(rowToComment);
  const comments = mapped.slice(0, COMMENT_PAGE_SIZE);
  const last = comments.at(-1);
  return {
    comments,
    cursor: last ? { createdAt: last.createdAt, id: last.id } : null,
    hasMore: mapped.length > COMMENT_PAGE_SIZE,
  };
}

async function fetchCommentsFallback(
  targetType: FeedbackTargetType,
  targetId: string,
  cursor: CommentCursor | null,
): Promise<RemoteCommentPage | null> {
  const cursorFilter = cursor
    ? `&or=(created_at.lt.${encodeURIComponent(cursor.createdAt)},and(created_at.eq.${encodeURIComponent(cursor.createdAt)},id.lt.${encodeURIComponent(cursor.id)}))`
    : '';
  const result = await requestJson<CommentRow[]>(
    `${URL}/rest/v1/${COMMENTS_VIEW}?select=*&${targetQuery(targetType, targetId)}${cursorFilter}&order=created_at.desc,id.desc&limit=${COMMENT_PAGE_SIZE + 1}`,
  );
  if (!result.ok || !Array.isArray(result.data)) return null;
  const mapped = result.data.map(rowToComment);
  const comments = mapped.slice(0, COMMENT_PAGE_SIZE);
  const last = comments.at(-1);
  return {
    comments,
    cursor: last ? { createdAt: last.createdAt, id: last.id } : null,
    hasMore: mapped.length > COMMENT_PAGE_SIZE,
  };
}

export async function fetchTargetComments(
  targetType: FeedbackTargetType,
  targetId: string,
  cursor: CommentCursor | null = null,
) {
  if (!remoteEnabled) return null;
  return await fetchCommentsRpc(targetType, targetId, cursor)
    ?? await fetchCommentsFallback(targetType, targetId, cursor);
}

export async function fetchTargetRemote(
  targetType: FeedbackTargetType,
  targetId: string,
): Promise<RemoteTargetResult | null> {
  if (!remoteEnabled) return null;
  const [aggregate, page] = await Promise.all([
    fetchAggregate(targetType, targetId),
    fetchTargetComments(targetType, targetId),
  ]);
  if (aggregate && page) return { aggregate, page, source: 'aggregate', message: null };

  const [ratings, fallbackPage] = await Promise.all([
    fetchTargetRatingsFallback(targetType, targetId),
    page ? Promise.resolve(page) : fetchCommentsFallback(targetType, targetId, null),
  ]);
  if (!ratings || !fallbackPage) return null;
  const bounded = ratings.length >= TARGET_RATING_FALLBACK_LIMIT;
  return {
    aggregate: aggregateRatings(targetType, targetId, ratings, fallbackPage.comments.length),
    page: fallbackPage,
    source: 'target-fallback',
    message: bounded
      ? 'Используется ограниченный target-only fallback; установите aggregate schema для полной статистики.'
      : 'Используется ограниченный target-only fallback до установки aggregate schema.',
  };
}

export async function fetchCommunityLeaderboard(): Promise<CommunityAggregate[] | null> {
  if (!remoteEnabled) return null;
  const result = await requestJson<AggregateRow[]>(
    `${URL}/rest/v1/${TARGETS_VIEW}?select=*&target_type=eq.poet&order=rating_count.desc,target_id.asc&limit=200`,
  );
  if (!result.ok || !Array.isArray(result.data)) return null;
  return result.data.map(rowToAggregate);
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
