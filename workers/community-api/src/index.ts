type FeedbackTargetType = 'poet' | 'poem' | 'track' | 'article';
type CommentKind = 'literary' | 'history' | 'moral' | 'performance';

type D1Result<T> = { results?: T[]; success?: boolean };
type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run(): Promise<unknown>;
};
type D1Database = {
  prepare(query: string): D1PreparedStatement;
};

type Env = {
  DB: D1Database;
  COMMUNITY_SESSION_SECRET?: string;
  COMMUNITY_NETWORK_SECRET?: string;
  TURNSTILE_SECRET?: string;
  TURNSTILE_HOSTNAMES?: string;
  ALLOWED_ORIGINS?: string;
  COMMUNITY_TARGET_MANIFEST_URL?: string;
};

type TargetManifest = {
  version: 1;
  targets: Record<FeedbackTargetType, string[]>;
};

type SessionPayload = {
  v: 1;
  actor: string;
  iat: number;
  exp: number;
};

const TARGET_TYPES = new Set<FeedbackTargetType>(['poet', 'poem', 'track', 'article']);
const COMMENT_KINDS = new Set<CommentKind>(['literary', 'history', 'moral', 'performance']);
const TARGET_ID = /^[a-z0-9][a-z0-9-]{1,159}$/;
const COMMENT_ID = /^comment-[a-z0-9][a-z0-9-]{7,199}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SCORE_KEY = /^[a-z0-9][a-z0-9-]{0,79}$/;
const EXPECTED_SCORE_KEYS: Record<FeedbackTargetType, readonly string[]> = {
  poet: ['language', 'depth', 'legacy', 'truth'],
  poem: ['beauty', 'form', 'impact'],
  track: ['voice', 'music', 'text'],
  article: ['clarity', 'depth', 'fairness'],
};
const DEFAULT_ALLOWED_ORIGINS = 'https://thelegendarypoet.ru,https://www.thelegendarypoet.ru';
const DEFAULT_MANIFEST_URL = 'https://thelegendarypoet.ru/community-targets.json';
const MAX_BODY_BYTES = 12_000;
const MAX_COMMENT_PAGE = 50;
const MAX_BATCH_TARGETS = 100;
const MANIFEST_TTL_MS = 5 * 60_000;
const SESSION_TTL_MS = 90 * 24 * 60 * 60_000;
const MAX_SESSION_TOKEN = 4096;
const encoder = new TextEncoder();
const decoder = new TextDecoder();
let manifestCache: { expiresAt: number; keys: Set<string> } | null = null;

class HttpError extends Error {
  constructor(public status: number, public code: string) {
    super(code);
  }
}

function json(status: number, body: unknown, origin: string | null, env: Env) {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  const allowed = allowedOrigin(origin, env);
  if (allowed) {
    headers.set('Access-Control-Allow-Origin', allowed);
    headers.set('Access-Control-Allow-Headers', 'authorization, content-type');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Vary', 'Origin');
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function allowedOrigins(env: Env) {
  return new Set((env.ALLOWED_ORIGINS ?? DEFAULT_ALLOWED_ORIGINS)
    .split(',')
    .map((value) => value.trim())
    .filter((value) => /^https:\/\//.test(value)));
}

function allowedOrigin(origin: string | null, env: Env) {
  if (!origin) return null;
  return allowedOrigins(env).has(origin) ? origin : null;
}

function requireAllowedOrigin(request: Request, env: Env) {
  const origin = request.headers.get('Origin');
  if (origin && !allowedOrigin(origin, env)) throw new HttpError(403, 'origin_denied');
  return origin;
}

function validTargetType(value: unknown): value is FeedbackTargetType {
  return typeof value === 'string' && TARGET_TYPES.has(value as FeedbackTargetType);
}

function cleanIp(request: Request) {
  const value = (request.headers.get('CF-Connecting-IP') ?? '').trim().toLowerCase();
  if (!value || value.length > 64 || !/^[0-9a-f:.]+$/.test(value)) throw new HttpError(503, 'network_authority_unavailable');
  return value;
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

function hex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function networkKey(request: Request, env: Env) {
  const secret = env.COMMUNITY_NETWORK_SECRET ?? '';
  if (secret.length < 32) throw new HttpError(503, 'server_not_ready');
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(cleanIp(request)));
  return hex(signature);
}

function base64urlEncode(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64urlDecode(value: string): ArrayBuffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

async function signSession(payload: SessionPayload, env: Env) {
  const secret = env.COMMUNITY_SESSION_SECRET ?? '';
  if (secret.length < 32 || secret === env.COMMUNITY_NETWORK_SECRET) throw new HttpError(503, 'server_not_ready');
  const encoded = base64urlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(`v1.${encoded}`));
  return `v1.${encoded}.${base64urlEncode(new Uint8Array(signature))}`;
}

async function verifySession(request: Request, env: Env) {
  const header = request.headers.get('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token || token.length > MAX_SESSION_TOKEN) throw new HttpError(401, 'invalid_session');
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') throw new HttpError(401, 'invalid_session');
  const secret = env.COMMUNITY_SESSION_SECRET ?? '';
  if (secret.length < 32) throw new HttpError(503, 'server_not_ready');
  let signature: ArrayBuffer;
  let payloadBytes: ArrayBuffer;
  try {
    signature = base64urlDecode(parts[2]);
    payloadBytes = base64urlDecode(parts[1]);
  } catch {
    throw new HttpError(401, 'invalid_session');
  }
  const verified = await crypto.subtle.verify(
    'HMAC',
    await hmacKey(secret),
    signature,
    encoder.encode(`v1.${parts[1]}`),
  );
  if (!verified) throw new HttpError(401, 'invalid_session');
  let payload: SessionPayload;
  try {
    payload = JSON.parse(decoder.decode(payloadBytes)) as SessionPayload;
  } catch {
    throw new HttpError(401, 'invalid_session');
  }
  const now = Date.now();
  if (
    payload.v !== 1
    || !UUID.test(payload.actor)
    || !Number.isFinite(payload.iat)
    || !Number.isFinite(payload.exp)
    || payload.iat > now + 5 * 60_000
    || payload.exp <= now
    || payload.exp - payload.iat > SESSION_TTL_MS + 60_000
  ) throw new HttpError(401, 'invalid_session');
  return payload.actor;
}

async function takeBudget(
  db: D1Database,
  key: string,
  action: string,
  scope: string,
  windowSeconds: number,
  limit: number,
) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(nowSeconds / windowSeconds) * windowSeconds;
  const row = await db.prepare(`
    INSERT INTO tlp_rate_buckets(network_key, action, scope, window_start, hits)
    VALUES (?, ?, ?, ?, 1)
    ON CONFLICT(network_key, action, scope, window_start)
    DO UPDATE SET hits = hits + 1
    RETURNING hits
  `).bind(key, action, scope, windowStart).first<{ hits: number }>();
  if (!row || Number(row.hits) > limit) throw new HttpError(429, 'rate_limited');
}

function targetKey(type: FeedbackTargetType, id: string) {
  return `${type}:${id}`;
}

function parseManifest(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<TargetManifest>;
  if (candidate.version !== 1 || !candidate.targets || typeof candidate.targets !== 'object') return null;
  const keys = new Set<string>();
  for (const type of TARGET_TYPES) {
    const ids = candidate.targets[type];
    if (!Array.isArray(ids) || ids.length > 20_000) return null;
    for (const id of ids) {
      if (typeof id !== 'string' || !TARGET_ID.test(id)) return null;
      keys.add(targetKey(type, id));
    }
  }
  return keys;
}

async function canonicalTargets(env: Env) {
  if (manifestCache && manifestCache.expiresAt > Date.now()) return manifestCache.keys;
  const manifestUrl = env.COMMUNITY_TARGET_MANIFEST_URL ?? DEFAULT_MANIFEST_URL;
  if (!/^https:\/\//.test(manifestUrl)) return null;
  try {
    const response = await fetch(manifestUrl, {
      headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const keys = parseManifest(await response.json());
    if (!keys) return null;
    manifestCache = { keys, expiresAt: Date.now() + MANIFEST_TTL_MS };
    return keys;
  } catch {
    return null;
  }
}

async function requireCanonicalTarget(env: Env, type: FeedbackTargetType, id: string) {
  const targets = await canonicalTargets(env);
  if (!targets) throw new HttpError(503, 'target_manifest_unavailable');
  if (!targets.has(targetKey(type, id))) throw new HttpError(404, 'unknown_target');
}

async function parseJson(request: Request) {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new HttpError(413, 'payload_too_large');
  try {
    const value = JSON.parse(text || '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('shape');
    return value as Record<string, unknown>;
  } catch {
    throw new HttpError(400, 'invalid_json');
  }
}

function validateScores(type: FeedbackTargetType, value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'invalid_scores');
  const entries = Object.entries(value);
  const expected = EXPECTED_SCORE_KEYS[type];
  if (entries.length !== expected.length) throw new HttpError(400, 'invalid_scores');
  const result: Record<string, number> = {};
  for (const [key, raw] of entries) {
    const score = Number(raw);
    if (!SCORE_KEY.test(key) || !expected.includes(key) || !Number.isInteger(score) || score < 1 || score > 5) {
      throw new HttpError(400, 'invalid_scores');
    }
    result[key] = score;
  }
  if (!expected.every((key) => Object.hasOwn(result, key))) throw new HttpError(400, 'invalid_scores');
  return result;
}

function scoresEqual(type: FeedbackTargetType, storedJson: string, requested: Record<string, number>) {
  try {
    const stored = JSON.parse(storedJson) as Record<string, unknown>;
    const keys = EXPECTED_SCORE_KEYS[type];
    return keys.every((key) => Number(stored[key]) === requested[key])
      && Object.keys(stored).length === keys.length;
  } catch {
    return false;
  }
}

function normalizeComment(body: Record<string, unknown>) {
  if (
    typeof body.commentId !== 'string' || !COMMENT_ID.test(body.commentId)
    || !validTargetType(body.targetType)
    || typeof body.targetId !== 'string' || !TARGET_ID.test(body.targetId)
    || typeof body.commentKind !== 'string' || !COMMENT_KINDS.has(body.commentKind as CommentKind)
    || typeof body.author !== 'string' || body.author.length > 120
    || typeof body.text !== 'string'
  ) throw new HttpError(400, 'invalid_comment');
  const text = body.text.replace(/\r\n?/g, '\n').replace(/[\t ]+/g, ' ').trim();
  if (text.length < 8 || text.length > 2000) throw new HttpError(400, 'invalid_comment');
  const author = body.author.replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 60) || 'Анонимный читатель';
  return {
    commentId: body.commentId,
    targetType: body.targetType,
    targetId: body.targetId,
    commentKind: body.commentKind as CommentKind,
    author,
    text,
  };
}

function overallExpression(type: FeedbackTargetType) {
  const keys = EXPECTED_SCORE_KEYS[type];
  return `(${keys.map((key) => `CAST(json_extract(scores_json, '$.${key}') AS REAL)`).join(' + ')}) / ${keys.length}.0`;
}

function aggregateSelect(type: FeedbackTargetType) {
  const overall = overallExpression(type);
  const dimensions = EXPECTED_SCORE_KEYS[type]
    .map((key) => `AVG(CAST(json_extract(scores_json, '$.${key}') AS REAL)) AS dim_${key}`)
    .join(', ');
  const distribution = [1, 2, 3, 4, 5]
    .map((bucket) => `SUM(CASE WHEN CAST(ROUND(${overall}) AS INTEGER) = ${bucket} THEN 1 ELSE 0 END) AS dist_${bucket}`)
    .join(', ');
  return `COUNT(*) AS rating_count, AVG(${overall}) AS overall, AVG((${overall}) * (${overall})) AS mean_square, ${dimensions}, ${distribution}`;
}

function aggregateFromRow(type: FeedbackTargetType, id: string, row: Record<string, unknown> | null, commentCount: number) {
  const overall = Math.max(0, Math.min(5, Number(row?.overall) || 0));
  const meanSquare = Number(row?.mean_square);
  const deviation = Number(row?.rating_count) > 1 && Number.isFinite(meanSquare)
    ? Math.sqrt(Math.max(0, meanSquare - overall * overall))
    : null;
  const dimensions = Object.fromEntries(EXPECTED_SCORE_KEYS[type]
    .map((key) => [key, Math.max(0, Math.min(5, Number(row?.[`dim_${key}`]) || 0))]));
  const distribution = Object.fromEntries([1, 2, 3, 4, 5]
    .map((bucket) => [bucket, Math.max(0, Math.floor(Number(row?.[`dist_${bucket}`]) || 0))]));
  return {
    targetType: type,
    targetId: id,
    ratingCount: Math.max(0, Math.floor(Number(row?.rating_count) || 0)),
    commentCount,
    overall,
    dimensions,
    distribution,
    deviation,
  };
}

async function aggregateForTarget(db: D1Database, type: FeedbackTargetType, id: string) {
  const [ratingRow, commentRow] = await Promise.all([
    db.prepare(`SELECT ${aggregateSelect(type)} FROM tlp_ratings WHERE target_type = ? AND target_id = ?`)
      .bind(type, id).first<Record<string, unknown>>(),
    db.prepare(`SELECT COUNT(*) AS count FROM tlp_comments WHERE target_type = ? AND target_id = ? AND status = 'published'`)
      .bind(type, id).first<{ count: number }>(),
  ]);
  return aggregateFromRow(type, id, ratingRow, Math.max(0, Math.floor(Number(commentRow?.count) || 0)));
}

async function aggregateBatch(db: D1Database, type: FeedbackTargetType, ids: string[]) {
  const unique = [...new Set(ids)].slice(0, MAX_BATCH_TARGETS);
  if (!unique.length) return [];
  const placeholders = unique.map(() => '?').join(',');
  const [ratingsResult, commentsResult] = await Promise.all([
    db.prepare(`SELECT target_id, ${aggregateSelect(type)} FROM tlp_ratings WHERE target_type = ? AND target_id IN (${placeholders}) GROUP BY target_id`)
      .bind(type, ...unique).all<Record<string, unknown>>(),
    db.prepare(`SELECT target_id, COUNT(*) AS count FROM tlp_comments WHERE target_type = ? AND target_id IN (${placeholders}) AND status = 'published' GROUP BY target_id`)
      .bind(type, ...unique).all<{ target_id: string; count: number }>(),
  ]);
  const ratings = new Map((ratingsResult.results ?? []).map((row) => [String(row.target_id), row]));
  const comments = new Map((commentsResult.results ?? []).map((row) => [row.target_id, Number(row.count) || 0]));
  return unique.map((id) => aggregateFromRow(type, id, ratings.get(id) ?? null, comments.get(id) ?? 0));
}

async function verifyTurnstile(token: string, request: Request, env: Env) {
  const secret = env.TURNSTILE_SECRET ?? '';
  const hosts = new Set((env.TURNSTILE_HOSTNAMES ?? '').split(',').map((value) => value.trim()).filter(Boolean));
  if (!secret || hosts.size === 0 || token.length < 1 || token.length > 2048) throw new HttpError(503, 'server_not_ready');
  let response: Response;
  try {
    response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip: cleanIp(request) }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new HttpError(503, 'human_verification_unavailable');
  }
  if (!response.ok) throw new HttpError(503, 'human_verification_unavailable');
  const result = await response.json() as { success?: unknown; action?: unknown; hostname?: unknown };
  if (result.success !== true || result.action !== 'community_session' || typeof result.hostname !== 'string' || !hosts.has(result.hostname)) {
    throw new HttpError(403, 'human_verification_failed');
  }
}

async function handleSession(request: Request, env: Env) {
  const body = await parseJson(request);
  if (Object.keys(body).some((key) => key !== 'turnstileToken')) throw new HttpError(400, 'unexpected_authority_field');
  if (typeof body.turnstileToken !== 'string') throw new HttpError(400, 'human_verification_required');
  const key = await networkKey(request, env);
  await takeBudget(env.DB, key, 'session-attempt', '*', 3600, 30);
  await verifyTurnstile(body.turnstileToken, request, env);
  await takeBudget(env.DB, key, 'session', '*', 86400, 30);
  const now = Date.now();
  const payload: SessionPayload = { v: 1, actor: crypto.randomUUID(), iat: now, exp: now + SESSION_TTL_MS };
  const actorToken = await signSession(payload, env);
  await env.DB.prepare('DELETE FROM tlp_rate_buckets WHERE window_start < ?').bind(Math.floor(now / 1000) - 7 * 86400).run();
  return { actorToken, expiresAt: payload.exp };
}

async function handleRating(request: Request, env: Env) {
  const actor = await verifySession(request, env);
  const body = await parseJson(request);
  if (Object.keys(body).some((key) => !['targetType', 'targetId', 'scores'].includes(key))) throw new HttpError(400, 'unexpected_authority_field');
  if (!validTargetType(body.targetType) || typeof body.targetId !== 'string' || !TARGET_ID.test(body.targetId)) throw new HttpError(400, 'invalid_target');
  const scores = validateScores(body.targetType, body.scores);
  await requireCanonicalTarget(env, body.targetType, body.targetId);
  const existing = await env.DB.prepare('SELECT scores_json FROM tlp_ratings WHERE target_type = ? AND target_id = ? AND actor_id = ?')
    .bind(body.targetType, body.targetId, actor).first<{ scores_json: string }>();
  if (existing && scoresEqual(body.targetType, existing.scores_json, scores)) return { ok: true, idempotent: true };
  const key = await networkKey(request, env);
  await takeBudget(env.DB, key, 'rating', '*', 3600, 60);
  await takeBudget(env.DB, key, 'rating', targetKey(body.targetType, body.targetId), 3600, 8);
  const now = Date.now();
  await env.DB.prepare(`
    INSERT INTO tlp_ratings(id, target_type, target_id, actor_id, scores_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(target_type, target_id, actor_id)
    DO UPDATE SET scores_json = excluded.scores_json, updated_at = excluded.updated_at
  `).bind(`rating-${crypto.randomUUID()}`, body.targetType, body.targetId, actor, JSON.stringify(scores), now, now).run();
  return { ok: true };
}

async function handleComment(request: Request, env: Env) {
  const actor = await verifySession(request, env);
  const body = await parseJson(request);
  if (Object.keys(body).some((key) => !['commentId', 'targetType', 'targetId', 'author', 'text', 'commentKind'].includes(key))) {
    throw new HttpError(400, 'unexpected_authority_field');
  }
  const comment = normalizeComment(body);
  await requireCanonicalTarget(env, comment.targetType, comment.targetId);
  const existing = await env.DB.prepare('SELECT actor_id, target_type, target_id FROM tlp_comments WHERE id = ?')
    .bind(comment.commentId).first<{ actor_id: string; target_type: string; target_id: string }>();
  if (existing) {
    if (existing.actor_id === actor && existing.target_type === comment.targetType && existing.target_id === comment.targetId) return { ok: true, idempotent: true };
    throw new HttpError(409, 'comment_id_conflict');
  }
  const now = Date.now();
  const recent = await env.DB.prepare('SELECT 1 AS found FROM tlp_comments WHERE actor_id = ? AND created_at > ? LIMIT 1')
    .bind(actor, now - 20_000).first<{ found: number }>();
  if (recent) throw new HttpError(429, 'comment_cooldown');
  const key = await networkKey(request, env);
  await takeBudget(env.DB, key, 'comment', '*', 3600, 12);
  await takeBudget(env.DB, key, 'comment', targetKey(comment.targetType, comment.targetId), 3600, 6);
  await env.DB.prepare(`
    INSERT INTO tlp_comments(id, target_type, target_id, actor_id, author, text, kind, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?)
  `).bind(comment.commentId, comment.targetType, comment.targetId, actor, comment.author, comment.text, comment.commentKind, now).run();
  return { ok: true };
}

async function handleHelpful(request: Request, env: Env) {
  const actor = await verifySession(request, env);
  const body = await parseJson(request);
  if (Object.keys(body).some((key) => key !== 'commentId')) throw new HttpError(400, 'unexpected_authority_field');
  if (typeof body.commentId !== 'string' || !COMMENT_ID.test(body.commentId)) throw new HttpError(400, 'invalid_comment');
  const comment = await env.DB.prepare(`SELECT target_type, target_id FROM tlp_comments WHERE id = ? AND status = 'published'`)
    .bind(body.commentId).first<{ target_type: FeedbackTargetType; target_id: string }>();
  if (!comment || !validTargetType(comment.target_type) || !TARGET_ID.test(comment.target_id)) throw new HttpError(404, 'comment_not_found');
  const existingVote = await env.DB.prepare('SELECT 1 AS found FROM tlp_helpful_votes WHERE comment_id = ? AND actor_id = ? LIMIT 1')
    .bind(body.commentId, actor).first<{ found: number }>();
  if (existingVote) return { ok: true, idempotent: true };
  const key = await networkKey(request, env);
  await takeBudget(env.DB, key, 'helpful', '*', 3600, 120);
  await takeBudget(env.DB, key, 'helpful', targetKey(comment.target_type, comment.target_id), 3600, 40);
  await env.DB.prepare('INSERT OR IGNORE INTO tlp_helpful_votes(comment_id, actor_id, created_at) VALUES (?, ?, ?)')
    .bind(body.commentId, actor, Date.now()).run();
  return { ok: true };
}

async function handleComments(url: URL, env: Env) {
  const type = url.searchParams.get('targetType');
  const id = url.searchParams.get('targetId');
  if (!validTargetType(type) || !id || !TARGET_ID.test(id)) throw new HttpError(400, 'invalid_target');
  const limit = Math.max(1, Math.min(MAX_COMMENT_PAGE, Math.floor(Number(url.searchParams.get('limit'))) || 10));
  const cursorCreatedAt = url.searchParams.get('cursorCreatedAt');
  const cursorId = url.searchParams.get('cursorId');
  let statement: D1PreparedStatement;
  if (cursorCreatedAt || cursorId) {
    const cursorMs = Date.parse(cursorCreatedAt ?? '');
    if (!Number.isFinite(cursorMs) || !cursorId || !COMMENT_ID.test(cursorId)) throw new HttpError(400, 'invalid_cursor');
    statement = env.DB.prepare(`
      SELECT c.id, c.target_type, c.target_id, c.author, c.text, c.kind, c.created_at, COUNT(v.comment_id) AS helpful
      FROM tlp_comments c
      LEFT JOIN tlp_helpful_votes v ON v.comment_id = c.id
      WHERE c.target_type = ? AND c.target_id = ? AND c.status = 'published'
        AND (c.created_at < ? OR (c.created_at = ? AND c.id < ?))
      GROUP BY c.id
      ORDER BY c.created_at DESC, c.id DESC
      LIMIT ?
    `).bind(type, id, cursorMs, cursorMs, cursorId, limit + 1);
  } else {
    statement = env.DB.prepare(`
      SELECT c.id, c.target_type, c.target_id, c.author, c.text, c.kind, c.created_at, COUNT(v.comment_id) AS helpful
      FROM tlp_comments c
      LEFT JOIN tlp_helpful_votes v ON v.comment_id = c.id
      WHERE c.target_type = ? AND c.target_id = ? AND c.status = 'published'
      GROUP BY c.id
      ORDER BY c.created_at DESC, c.id DESC
      LIMIT ?
    `).bind(type, id, limit + 1);
  }
  const result = await statement.all<Record<string, unknown>>();
  const rows = result.results ?? [];
  const hasMore = rows.length > limit;
  const comments = rows.slice(0, limit).map((row) => ({
    id: String(row.id),
    targetType: String(row.target_type) as FeedbackTargetType,
    targetId: String(row.target_id),
    author: String(row.author),
    text: String(row.text),
    kind: String(row.kind) as CommentKind,
    helpful: Math.max(0, Math.floor(Number(row.helpful) || 0)),
    createdAt: new Date(Number(row.created_at)).toISOString(),
  }));
  const last = comments.at(-1);
  return { comments, nextCursor: hasMore && last ? { createdAt: last.createdAt, id: last.id } : null };
}

async function route(request: Request, env: Env) {
  const origin = requireAllowedOrigin(request, env);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: json(200, {}, origin, env).headers });
  const url = new URL(request.url);

  if (request.method === 'GET' && url.pathname === '/health') {
    const writesReady = Boolean(
      (env.COMMUNITY_SESSION_SECRET?.length ?? 0) >= 32
      && (env.COMMUNITY_NETWORK_SECRET?.length ?? 0) >= 32
      && env.COMMUNITY_SESSION_SECRET !== env.COMMUNITY_NETWORK_SECRET
      && env.TURNSTILE_SECRET
      && env.TURNSTILE_HOSTNAMES,
    );
    return json(200, { ok: true, database: 'd1', writesReady }, origin, env);
  }

  if (request.method === 'GET' && url.pathname === '/v1/summary') {
    const type = url.searchParams.get('targetType');
    const id = url.searchParams.get('targetId');
    if (!validTargetType(type) || !id || !TARGET_ID.test(id)) throw new HttpError(400, 'invalid_target');
    return json(200, await aggregateForTarget(env.DB, type, id), origin, env);
  }

  if (request.method === 'POST' && url.pathname === '/v1/summary/batch') {
    const body = await parseJson(request);
    if (!validTargetType(body.targetType) || !Array.isArray(body.targetIds) || body.targetIds.length > MAX_BATCH_TARGETS) throw new HttpError(400, 'invalid_target_batch');
    const ids = body.targetIds.filter((value): value is string => typeof value === 'string' && TARGET_ID.test(value));
    if (ids.length !== body.targetIds.length) throw new HttpError(400, 'invalid_target_batch');
    return json(200, { aggregates: await aggregateBatch(env.DB, body.targetType, ids) }, origin, env);
  }

  if (request.method === 'GET' && url.pathname === '/v1/comments') {
    return json(200, await handleComments(url, env), origin, env);
  }

  if (request.method === 'POST' && url.pathname === '/v1/session') {
    return json(200, await handleSession(request, env), origin, env);
  }
  if (request.method === 'POST' && url.pathname === '/v1/rating') {
    return json(200, await handleRating(request, env), origin, env);
  }
  if (request.method === 'POST' && url.pathname === '/v1/comment') {
    return json(200, await handleComment(request, env), origin, env);
  }
  if (request.method === 'POST' && url.pathname === '/v1/helpful') {
    return json(200, await handleHelpful(request, env), origin, env);
  }

  throw new HttpError(404, 'not_found');
}

export default {
  async fetch(request: Request, env: Env) {
    const origin = request.headers.get('Origin');
    try {
      return await route(request, env);
    } catch (error) {
      if (error instanceof HttpError) return json(error.status, { ok: false, code: error.code }, origin, env);
      console.error('community-api failure', error instanceof Error ? error.message : String(error));
      return json(500, { ok: false, code: 'internal_error' }, origin, env);
    }
  },
};
