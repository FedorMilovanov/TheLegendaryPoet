import type { CommentEntry, FeedbackSnapshot, RatingEntry } from '../types/community';

const ENV = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
const URL = ENV?.VITE_SUPABASE_URL?.replace(/\/$/, '');
const KEY = ENV?.VITE_SUPABASE_ANON_KEY;

const RATINGS_VIEW = 'tlp_ratings_public';
const COMMENTS_VIEW = 'tlp_comments_public';
const PAGE_SIZE = 1000;
const MAX_ROWS_PER_VIEW = 20_000;
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

interface RatingRow { id: string; target_type: string; target_id: string; scores: Record<string, number>; created_at: string }
interface CommentRow { id: string; target_type: string; target_id: string; author: string; text: string; kind: string; helpful: number; created_at: string }

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

async function fetchWithTimeout(input: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

async function fetchRows<Row>(view: string): Promise<Row[] | null> {
  const rows: Row[] = [];

  for (let offset = 0; offset < MAX_ROWS_PER_VIEW; offset += PAGE_SIZE) {
    const response = await fetchWithTimeout(
      `${URL}/rest/v1/${view}?select=*&order=created_at.desc`,
      {
        headers: headers({
          Range: `${offset}-${offset + PAGE_SIZE - 1}`,
          Prefer: 'count=exact',
        }),
      },
    );
    if (!response.ok) return null;

    const page = await response.json() as Row[];
    if (!Array.isArray(page)) return null;
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }

  return rows;
}

export async function fetchAllRemote(): Promise<FeedbackSnapshot | null> {
  if (!remoteEnabled) return null;
  try {
    const [ratingRows, commentRows] = await Promise.all([
      fetchRows<RatingRow>(RATINGS_VIEW),
      fetchRows<CommentRow>(COMMENTS_VIEW),
    ]);
    if (!ratingRows || !commentRows) return null;
    return {
      ratings: ratingRows.map(rowToRating),
      comments: commentRows.map(rowToComment),
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
