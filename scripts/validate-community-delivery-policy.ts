import { readFileSync } from 'node:fs';

export {};

process.env.VITE_COMMUNITY_API_URL = 'https://community.test.invalid';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
}

const storage = new MemoryStorage();
const testWindow = {
  localStorage: storage,
  location: { hostname: '127.0.0.1' },
  setTimeout: globalThis.setTimeout.bind(globalThis),
  clearTimeout: globalThis.clearTimeout.bind(globalThis),
  addEventListener() {},
  removeEventListener() {},
};
Object.defineProperty(globalThis, 'window', { configurable: true, value: testWindow });
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { onLine: true } });
Object.assign(globalThis, {
  __TLP_COMMUNITY_TEST_CONFIG__: {
    url: 'https://community.test.invalid',
    humanProof: 'turnstile-delivery-policy-proof',
  },
});

const ACTOR_KEY = 'tlp-community-actor:v1';
const actorToken = 'v1.delivery-policy-actor-token-that-is-long-enough.signature';
const replacementActorToken = 'v1.delivery-policy-replacement-token-that-is-long-enough.signature';
const writeActor = (token: string) => storage.setItem(ACTOR_KEY, JSON.stringify({
  version: 1,
  actorToken: token,
  expiresAt: Date.now() + 30 * 24 * 60 * 60_000,
}));
writeActor(actorToken);

type Mode = 'ack' | 'terminal' | 'unknown-404' | 'origin-denied' | 'rate-limit' | 'double-401';
let mode: Mode = 'ack';
let sessionRequests = 0;
let mutationRequests = 0;

globalThis.fetch = async (input) => {
  const url = new URL(String(input));
  if (url.pathname === '/v1/session') {
    sessionRequests += 1;
    return Response.json({
      actorToken: replacementActorToken,
      expiresAt: Date.now() + 30 * 24 * 60 * 60_000,
    });
  }
  if (url.pathname === '/v1/comment') {
    mutationRequests += 1;
    if (mode === 'ack') return Response.json({ ok: true, idempotent: true });
    if (mode === 'terminal') return Response.json({ ok: false, code: 'invalid_comment' }, { status: 400 });
    if (mode === 'origin-denied') return Response.json({ ok: false, code: 'origin_denied' }, { status: 403 });
    if (mode === 'rate-limit') {
      return Response.json({ ok: false, code: 'rate_limited' }, { status: 429, headers: { 'Retry-After': '1' } });
    }
    if (mode === 'double-401') return Response.json({ ok: false, code: 'invalid_session' }, { status: 401 });
    return new Response('<html>edge route mismatch</html>', { status: 404, headers: { 'Content-Type': 'text/html' } });
  }
  return new Response(null, { status: 404 });
};

const remote = await import('../src/utils/communityRemote');
const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
const entry = {
  id: 'comment-11111111-1111-4111-8111-111111111111',
  targetType: 'article' as const,
  targetId: 'essay-yesenin-biography-part-two',
  author: 'Reader QA',
  text: 'Достаточно длинный комментарий для проверки политики доставки.',
  kind: 'history' as const,
  helpful: 0,
  createdAt: new Date().toISOString(),
};

mode = 'ack';
let result = await remote.submitCommentRemote(entry, '11111111-1111-4111-8111-111111111111');
expect(result.outcome === 'ack' && result.idempotent === true, '2xx/idempotent Worker response must be a terminal ACK');

mode = 'terminal';
result = await remote.submitCommentRemote(entry, '11111111-1111-4111-8111-111111111111');
expect(result.outcome === 'reject' && result.code === 'invalid_comment', 'known Worker contract rejection must be terminal, not retried forever');

mode = 'unknown-404';
result = await remote.submitCommentRemote(entry, '11111111-1111-4111-8111-111111111111');
expect(result.outcome === 'retry' && result.code === 'http_404', 'unknown/non-JSON 404 must preserve queued work instead of being misclassified as permanent');
expect(result.outcome !== 'retry' || result.retryAfterMs === 30_000, 'ambiguous client failures must use bounded retry delay');

mode = 'origin-denied';
result = await remote.submitCommentRemote(entry, '11111111-1111-4111-8111-111111111111');
expect(result.outcome === 'retry' && result.code === 'origin_denied', 'operator/configuration 403 must preserve user work for later recovery');

mode = 'rate-limit';
result = await remote.submitCommentRemote(entry, '11111111-1111-4111-8111-111111111111');
expect(result.outcome === 'retry' && result.code === 'rate_limited' && result.retryAfterMs === 1000, '429 must remain retryable and honor Retry-After');

mode = 'double-401';
writeActor(actorToken);
const sessionsBefore401 = sessionRequests;
const mutationsBefore401 = mutationRequests;
result = await remote.submitCommentRemote(entry, '11111111-1111-4111-8111-111111111111', { interactive: true });
expect(result.outcome === 'retry' && result.code === 'actor_session_required', 'two consecutive 401s must retain work and require a future legitimate actor session');
expect(sessionRequests === sessionsBefore401 + 1, 'interactive 401 recovery may mint exactly one replacement actor session');
expect(mutationRequests === mutationsBefore401 + 2, 'interactive 401 recovery must retry the mutation only once');
expect(storage.getItem(ACTOR_KEY) === null, 'second rejected actor token must be invalidated rather than persisted as apparently valid authority');

mode = 'ack';
const sessionsBeforeBackground = sessionRequests;
result = await remote.submitCommentRemote(entry, '11111111-1111-4111-8111-111111111111', { interactive: false });
expect(result.outcome === 'retry' && result.code === 'actor_session_required', 'background replay without actor session must keep work queued');
expect(sessionRequests === sessionsBeforeBackground, 'background replay must never summon Turnstile/session minting');

const commentContract = readFileSync('src/data/communityContract.ts', 'utf8');
const feedbackHook = readFileSync('src/hooks/useCommunityFeedback.ts', 'utf8');
const panel = readFileSync('src/components/community/CommunityPanel.tsx', 'utf8');
const remoteSource = readFileSync('src/utils/communityRemote.ts', 'utf8');
expect(commentContract.includes("COMMUNITY_COMMENT_COOLDOWN_SCOPE = 'comment:global'"), 'client comment cooldown scope must be one global actor-level scope matching Worker enforcement');
expect(feedbackHook.includes('checkCooldown(COMMUNITY_COMMENT_COOLDOWN_SCOPE)'), 'comment UX admission must check the shared global cooldown scope');
expect(feedbackHook.includes('commitCommentFeedback(entry, COMMUNITY_COMMENT_COOLDOWN_SCOPE'), 'comment persistence must record the same global cooldown scope after local admission');
expect(remoteSource.includes('TERMINAL_MUTATION_CODES') && remoteSource.includes("'comment_id_conflict'"), 'remote delivery must use an explicit terminal Worker-code allowlist');
expect(remoteSource.includes('AMBIGUOUS_CLIENT_RETRY_MS') && remoteSource.includes('TERMINAL_MUTATION_CODES.has(payload.code)'), 'unknown 4xx responses must default to durable retry rather than destructive rejection');
expect(panel.includes('if (feedback.sync.message)') && panel.includes("role={syncPresentation.alert ? 'alert' : 'status'}"), 'terminal reconciliation message must remain visible and programmatically announced after the sync phase returns online');
expect(panel.includes("aria-live={syncPresentation.alert ? 'assertive' : 'polite'}"), 'warning reconciliation state must use assertive live semantics');

for (const failure of failures) console.error(`ERROR community-delivery-policy: ${failure}`);
console.log(`Community delivery policy: ${failures.length} error(s); explicit terminal allowlist, ambiguous-4xx preservation, Retry-After, bounded 401 recovery, global cooldown scope, announced reconciliation and no background actor mint checked.`);
if (failures.length) process.exit(1);
