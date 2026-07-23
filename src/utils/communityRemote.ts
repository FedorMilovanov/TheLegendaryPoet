import { CommentEntry, FeedbackSnapshot, RatingEntry } from '../types/community';

const URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '');
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const RATINGS_VIEW = 'tlp_ratings_public';
const COMMENTS_VIEW = 'tlp_comments_public';

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

function rowToRating(r: RatingRow): RatingEntry {
  return { id: r.id, targetType: r.target_type as RatingEntry['targetType'], targetId: r.target_id, scores: r.scores || {}, createdAt: r.created_at };
}
function rowToComment(r: CommentRow): CommentEntry {
  return { id: r.id, targetType: r.target_type as CommentEntry['targetType'], targetId: r.target_id, author: r.author, text: r.text, kind: r.kind as CommentEntry['kind'], helpful: r.helpful ?? 0, createdAt: r.created_at };
}

export async function fetchAllRemote(): Promise<FeedbackSnapshot | null> {
  if (!remoteEnabled) return null;
  try {
    const [rRes, cRes] = await Promise.all([
      fetch(`${URL}/rest/v1/${RATINGS_VIEW}?select=*&order=created_at.desc`, { headers: headers() }),
      fetch(`${URL}/rest/v1/${COMMENTS_VIEW}?select=*&order=created_at.desc`, { headers: headers() }),
    ]);
    if (!rRes.ok || !cRes.ok) return null;
    const ratings = (await rRes.json() as RatingRow[]).map(rowToRating);
    const comments = (await cRes.json() as CommentRow[]).map(rowToComment);
    return { ratings, comments };
  } catch {
    return null;
  }
}

async function rpc(name: string, body: Record<string, unknown>): Promise<boolean> {
  if (!remoteEnabled) return false;
  try {
    const response = await fetch(`${URL}/rest/v1/rpc/${name}`, {
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
