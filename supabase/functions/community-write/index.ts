import { withSupabase } from 'npm:@supabase/server@1.4.1';

type FeedbackTargetType = 'poet' | 'poem' | 'track' | 'article';
type CommentKind = 'literary' | 'history' | 'moral' | 'performance';

type CommunityMutationBody =
  | { kind: 'rating'; targetType: FeedbackTargetType; targetId: string; scores: Record<string, number> }
  | {
      kind: 'comment';
      commentId: string;
      targetType: FeedbackTargetType;
      targetId: string;
      author: string;
      text: string;
      commentKind: CommentKind;
    }
  | { kind: 'helpful'; commentId: string };

type TargetManifest = {
  version: 1;
  targets: Record<FeedbackTargetType, string[]>;
};

const TARGET_TYPES = new Set<FeedbackTargetType>(['poet', 'poem', 'track', 'article']);
const COMMENT_KINDS = new Set<CommentKind>(['literary', 'history', 'moral', 'performance']);
const TARGET_ID = /^[a-z0-9][a-z0-9-]{1,159}$/;
const COMMENT_ID = /^comment-[a-z0-9][a-z0-9-]{7,199}$/;
const SCORE_KEY = /^[a-z0-9][a-z0-9-]{0,79}$/;
const EXPECTED_SCORE_KEYS: Record<FeedbackTargetType, readonly string[]> = {
  poet: ['language', 'depth', 'legacy', 'truth'],
  poem: ['beauty', 'form', 'impact'],
  track: ['voice', 'music', 'text'],
  article: ['clarity', 'depth', 'fairness'],
};
const DEFAULT_MANIFEST_URL = 'https://thelegendarypoet.ru/community-targets.json';
const MANIFEST_TTL_MS = 5 * 60_000;
const MAX_REQUEST_BYTES = 12_000;
const ALLOWED_ORIGINS = new Set([
  'https://thelegendarypoet.ru',
  'https://www.thelegendarypoet.ru',
]);

let manifestCache: { expiresAt: number; keys: Set<string> } | null = null;

function responseHeaders(origin: string | null) {
  const allowOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://thelegendarypoet.ru';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  };
}

function json(status: number, body: Record<string, unknown>, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders(origin) });
}

function isAllowedOrigin(origin: string | null) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  const allowLocal = Deno.env.get('COMMUNITY_ALLOW_LOCAL_ORIGINS') === 'true';
  return allowLocal && /^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(origin);
}

function normalizeIp(value: string) {
  const raw = value.trim().toLowerCase().replace(/^\[|\]$/g, '');
  if (!raw || raw.length > 64 || /[\s\x00-\x1f]/.test(raw)) return null;

  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(raw)) {
    const octets = raw.split('.').map(Number);
    return octets.every((part) => Number.isInteger(part) && part >= 0 && part <= 255) ? raw : null;
  }

  if (raw.includes(':') && /^[0-9a-f:.]+$/.test(raw)) return raw;
  return null;
}

function firstForwardedIp(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0] ?? '';
  return normalizeIp(forwarded);
}

async function hmacNetworkKey(ip: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(ip));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function targetKey(targetType: FeedbackTargetType, targetId: string) {
  return `${targetType}:${targetId}`;
}

function parseManifest(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<TargetManifest>;
  if (candidate.version !== 1 || !candidate.targets || typeof candidate.targets !== 'object') return null;

  const keys = new Set<string>();
  for (const targetType of TARGET_TYPES) {
    const ids = candidate.targets[targetType];
    if (!Array.isArray(ids) || ids.length > 20_000) return null;
    for (const id of ids) {
      if (typeof id !== 'string' || !TARGET_ID.test(id)) return null;
      keys.add(targetKey(targetType, id));
    }
  }
  return keys;
}

async function getCanonicalTargets() {
  if (manifestCache && manifestCache.expiresAt > Date.now()) return manifestCache.keys;
  const manifestUrl = Deno.env.get('COMMUNITY_TARGET_MANIFEST_URL') ?? DEFAULT_MANIFEST_URL;
  if (!/^https:\/\//i.test(manifestUrl)) return null;

  try {
    const response = await fetch(manifestUrl, {
      headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
      signal: AbortSignal.timeout(5_000),
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

function validTargetType(value: unknown): value is FeedbackTargetType {
  return typeof value === 'string' && TARGET_TYPES.has(value as FeedbackTargetType);
}

function validateScores(targetType: FeedbackTargetType, value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const entries = Object.entries(value);
  const expected = EXPECTED_SCORE_KEYS[targetType];
  if (entries.length !== expected.length) return null;
  const scores: Record<string, number> = {};
  for (const [key, raw] of entries) {
    const score = Number(raw);
    if (!SCORE_KEY.test(key) || !expected.includes(key) || !Number.isInteger(score) || score < 1 || score > 5) return null;
    scores[key] = score;
  }
  if (!expected.every((key) => Object.hasOwn(scores, key))) return null;
  return scores;
}

function validateBody(value: unknown): CommunityMutationBody | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;

  if (body.kind === 'rating') {
    if (!validTargetType(body.targetType) || typeof body.targetId !== 'string' || !TARGET_ID.test(body.targetId)) return null;
    const scores = validateScores(body.targetType, body.scores);
    return scores ? { kind: 'rating', targetType: body.targetType, targetId: body.targetId, scores } : null;
  }

  if (body.kind === 'comment') {
    if (
      !validTargetType(body.targetType)
      || typeof body.targetId !== 'string'
      || !TARGET_ID.test(body.targetId)
      || typeof body.commentId !== 'string'
      || !COMMENT_ID.test(body.commentId)
      || typeof body.commentKind !== 'string'
      || !COMMENT_KINDS.has(body.commentKind as CommentKind)
      || typeof body.author !== 'string'
      || body.author.length > 120
      || typeof body.text !== 'string'
    ) return null;
    const text = body.text.replace(/\r\n?/g, '\n').trim();
    if (text.length < 8 || text.length > 2000) return null;
    const author = body.author.replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 60) || 'Анонимный читатель';
    return {
      kind: 'comment',
      commentId: body.commentId,
      targetType: body.targetType,
      targetId: body.targetId,
      author,
      text,
      commentKind: body.commentKind as CommentKind,
    };
  }

  if (body.kind === 'helpful' && typeof body.commentId === 'string' && COMMENT_ID.test(body.commentId)) {
    return { kind: 'helpful', commentId: body.commentId };
  }

  return null;
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const origin = req.headers.get('origin');
    if (!isAllowedOrigin(origin)) return json(403, { ok: false, code: 'origin_denied' }, origin);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: responseHeaders(origin) });
    if (req.method !== 'POST') return json(405, { ok: false, code: 'method_not_allowed' }, origin);

    const contentLength = Number(req.headers.get('content-length') ?? '0');
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      return json(413, { ok: false, code: 'payload_too_large' }, origin);
    }

    const abuseSecret = Deno.env.get('COMMUNITY_ABUSE_SECRET') ?? '';
    if (abuseSecret.length < 32) return json(503, { ok: false, code: 'server_not_ready' }, origin);

    const actorId = typeof ctx.userClaims?.sub === 'string' ? ctx.userClaims.sub : '';
    if (!actorId) return json(401, { ok: false, code: 'invalid_auth' }, origin);
    const admin = ctx.supabaseAdmin;

    const ip = firstForwardedIp(req);
    if (!ip) return json(503, { ok: false, code: 'network_authority_unavailable' }, origin);
    const networkKey = await hmacNetworkKey(ip, abuseSecret);

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return json(400, { ok: false, code: 'invalid_json' }, origin);
    }
    const body = validateBody(rawBody);
    if (!body) return json(400, { ok: false, code: 'invalid_payload' }, origin);

    const canonicalTargets = await getCanonicalTargets();
    if (!canonicalTargets) return json(503, { ok: false, code: 'target_authority_unavailable' }, origin);

    let targetType: FeedbackTargetType;
    let targetId: string;
    if (body.kind === 'helpful') {
      const { data: comment, error } = await admin
        .from('tlp_comments')
        .select('target_type,target_id,status')
        .eq('id', body.commentId)
        .maybeSingle();
      if (error || !comment || comment.status !== 'published' || !validTargetType(comment.target_type) || typeof comment.target_id !== 'string') {
        return json(404, { ok: false, code: 'comment_not_found' }, origin);
      }
      targetType = comment.target_type;
      targetId = comment.target_id;
    } else {
      targetType = body.targetType;
      targetId = body.targetId;
    }

    if (!canonicalTargets.has(targetKey(targetType, targetId))) {
      return json(404, { ok: false, code: 'unknown_target' }, origin);
    }

    let rpcName: string;
    let rpcArgs: Record<string, unknown>;
    if (body.kind === 'rating') {
      rpcName = 'tlp_submit_rating_server';
      rpcArgs = {
        p_target_type: body.targetType,
        p_target_id: body.targetId,
        p_actor_id: actorId,
        p_network_key: networkKey,
        p_scores: body.scores,
      };
    } else if (body.kind === 'comment') {
      rpcName = 'tlp_submit_comment_server';
      rpcArgs = {
        p_id: body.commentId,
        p_target_type: body.targetType,
        p_target_id: body.targetId,
        p_actor_id: actorId,
        p_network_key: networkKey,
        p_author: body.author,
        p_text: body.text,
        p_kind: body.commentKind,
      };
    } else {
      rpcName = 'tlp_mark_helpful_server';
      rpcArgs = {
        p_comment_id: body.commentId,
        p_actor_id: actorId,
        p_network_key: networkKey,
      };
    }

    const { error: rpcError } = await admin.rpc(rpcName, rpcArgs);
    if (rpcError) {
      const rateLimited = /community rate limit/i.test(rpcError.message);
      return json(rateLimited ? 429 : 400, {
        ok: false,
        code: rateLimited ? 'rate_limited' : 'write_rejected',
      }, origin);
    }

    return json(200, { ok: true }, origin);
  }),
};
