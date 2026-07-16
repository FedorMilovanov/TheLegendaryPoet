import { CommentEntry, FeedbackSnapshot, RatingEntry } from '../types/community';

/* ------------------------------------------------------------------ *
 * Optional shared backend for ratings & comments (FREE, no server).
 *
 * Uses Supabase's built-in REST endpoint (PostgREST) via plain `fetch`
 * — no SDK, no build weight. Enabled only when both env vars are set at
 * build time; otherwise every function is a no-op and the app falls back
 * to the local (per-device) store. See docs/COMMENTS_SETUP.md.
 *
 * The anon key is designed to be public; it is safe in client code as
 * long as Row Level Security is enabled (the setup SQL does this).
 * ------------------------------------------------------------------ */

// Vite inlines import.meta.env at build time. Guard for non-Vite runners
// (tsx integrity scripts, unit smoke) where `env` may be undefined.
const env = (typeof import.meta !== 'undefined' && import.meta.env) || ({} as ImportMetaEnv);
const URL = (env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '');
const KEY = env.VITE_SUPABASE_ANON_KEY as string | undefined;

const RATINGS = 'tlp_ratings';
const COMMENTS = 'tlp_comments';

export const remoteEnabled = Boolean(URL && KEY);

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: KEY as string,
    Authorization: `Bearer ${KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

// DB rows use snake_case; the app uses camelCase.
interface RatingRow { id: string; target_type: string; target_id: string; scores: Record<string, number>; created_at: string }
interface CommentRow { id: string; target_type: string; target_id: string; author: string; text: string; kind: string; helpful: number; created_at: string }

const VALID_TARGETS = new Set(['poet', 'poem', 'track', 'article', 'essay']);
const VALID_KINDS = new Set(['literary', 'history', 'moral', 'performance']);

function rowToRating(r: RatingRow): RatingEntry | null {
  if (!r?.id || !VALID_TARGETS.has(r.target_type) || !r.target_id) return null;
  return {
    id: r.id,
    targetType: r.target_type as RatingEntry['targetType'],
    targetId: r.target_id,
    scores: r.scores || {},
    createdAt: r.created_at,
  };
}
function rowToComment(r: CommentRow): CommentEntry | null {
  if (!r?.id || !VALID_TARGETS.has(r.target_type) || !r.target_id || !r.text) return null;
  const kind = VALID_KINDS.has(r.kind) ? (r.kind as CommentEntry['kind']) : 'literary';
  return {
    id: r.id,
    targetType: r.target_type as CommentEntry['targetType'],
    targetId: r.target_id,
    author: r.author || 'Анонимный читатель',
    text: r.text,
    kind,
    helpful: r.helpful ?? 0,
    createdAt: r.created_at,
  };
}

/** Pull the full shared snapshot. Returns null on any failure (caller keeps local data). */
export async function fetchAllRemote(): Promise<FeedbackSnapshot | null> {
  if (!remoteEnabled) return null;
  try {
    const [rRes, cRes] = await Promise.all([
      fetch(`${URL}/rest/v1/${RATINGS}?select=*`, { headers: headers() }),
      fetch(`${URL}/rest/v1/${COMMENTS}?select=*&order=created_at.desc`, { headers: headers() }),
    ]);
    if (!rRes.ok || !cRes.ok) return null;
    const ratings = (await rRes.json() as RatingRow[]).map(rowToRating).filter((r): r is RatingEntry => r !== null);
    const comments = (await cRes.json() as CommentRow[]).map(rowToComment).filter((c): c is CommentEntry => c !== null);
    return { ratings, comments };
  } catch {
    return null;
  }
}

/** Fire-and-forget insert of a rating. Never throws. */
export async function insertRatingRemote(entry: RatingEntry): Promise<void> {
  if (!remoteEnabled) return;
  try {
    await fetch(`${URL}/rest/v1/${RATINGS}`, {
      method: 'POST',
      headers: headers({ Prefer: 'return=minimal' }),
      body: JSON.stringify({ id: entry.id, target_type: entry.targetType, target_id: entry.targetId, scores: entry.scores, created_at: entry.createdAt }),
    });
  } catch { /* offline / blocked: local copy already saved */ }
}

/** Fire-and-forget insert of a comment. Never throws. */
export async function insertCommentRemote(entry: CommentEntry): Promise<void> {
  if (!remoteEnabled) return;
  try {
    await fetch(`${URL}/rest/v1/${COMMENTS}`, {
      method: 'POST',
      headers: headers({ Prefer: 'return=minimal' }),
      body: JSON.stringify({ id: entry.id, target_type: entry.targetType, target_id: entry.targetId, author: entry.author, text: entry.text, kind: entry.kind, helpful: entry.helpful, created_at: entry.createdAt }),
    });
  } catch { /* offline / blocked */ }
}

/** Best-effort update of a comment's helpful count. Never throws. */
export async function bumpHelpfulRemote(id: string, helpful: number): Promise<void> {
  if (!remoteEnabled) return;
  try {
    await fetch(`${URL}/rest/v1/${COMMENTS}?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: headers({ Prefer: 'return=minimal' }),
      body: JSON.stringify({ helpful }),
    });
  } catch { /* offline / blocked */ }
}
