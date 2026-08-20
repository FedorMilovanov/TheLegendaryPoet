export {};

process.env.VITE_COMMUNITY_API_URL = 'https://community.test.invalid';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  failWrites = false;

  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) {
    if (this.failWrites) throw new Error('quota exceeded');
    this.values.set(key, String(value));
  }
}

const storage = new MemoryStorage();
const listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
const testWindow = {
  localStorage: storage,
  location: { hostname: '127.0.0.1' },
  setTimeout: globalThis.setTimeout.bind(globalThis),
  clearTimeout: globalThis.clearTimeout.bind(globalThis),
  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    const bucket = listeners.get(type) ?? new Set<EventListenerOrEventListenerObject>();
    bucket.add(listener);
    listeners.set(type, bucket);
  },
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    listeners.get(type)?.delete(listener);
  },
  dispatchEvent(event: Event) {
    for (const listener of listeners.get(event.type) ?? []) {
      if (typeof listener === 'function') listener.call(testWindow, event);
      else listener.handleEvent(event);
    }
    return true;
  },
};

Object.defineProperty(globalThis, 'window', { configurable: true, value: testWindow });
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { onLine: true } });
Object.assign(globalThis, {
  __TLP_COMMUNITY_TEST_CONFIG__: {
    url: 'https://community.test.invalid',
    humanProof: 'turnstile-test-proof',
  },
});

const now = Date.now();
const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString();
const ownRatingId = 'rating-11111111-1111-4111-8111-111111111111';
const pendingRatingId = 'rating-22222222-2222-4222-8222-222222222222';
const incompletePendingRatingId = 'rating-77777777-7777-4777-8777-777777777777';
const pendingCommentId = 'comment-33333333-3333-4333-8333-333333333333';
const voterId = '11111111-1111-4111-8111-111111111111';
const completePoetScores = { language: 5, depth: 4, legacy: 5, truth: 4 };

const remoteRatings = Array.from({ length: 120 }, (_, index) => ({
  id: `rating-remote-${String(index).padStart(8, '0')}`,
  targetType: 'poet',
  targetId: `remote-poet-${index}`,
  scores: { language: 3 },
  createdAt: iso(-20_000 - index),
}));
const remoteComments = Array.from({ length: 120 }, (_, index) => ({
  id: `comment-remote-${String(index).padStart(8, '0')}`,
  targetType: 'article',
  targetId: `remote-article-${index}`,
  author: 'Удалённый читатель',
  text: 'Этот публичный удалённый комментарий не должен мигрировать в локальный корпус.',
  kind: 'literary',
  helpful: 0,
  createdAt: iso(-10_000 - index),
}));

storage.setItem('tlp-community-feedback:v2', JSON.stringify({
  version: 2,
  snapshot: {
    ratings: [
      ...remoteRatings,
      { id: pendingRatingId, targetType: 'poet', targetId: 'alexander-pushkin', scores: completePoetScores, createdAt: iso(-500) },
      { id: incompletePendingRatingId, targetType: 'poet', targetId: 'alexander-pushkin', scores: { language: 5 }, createdAt: iso(-450) },
    ],
    comments: [
      ...remoteComments,
      { id: pendingCommentId, targetType: 'article', targetId: 'sergei-yesenin-1921-1925', author: 'Локальный автор', text: 'Этот ожидающий комментарий должен пережить миграцию.', kind: 'history', helpful: 0, createdAt: iso(-400) },
    ],
  },
  outbox: [
    { id: `rating:${pendingRatingId}`, kind: 'rating', voterId, entry: { id: pendingRatingId, targetType: 'poet', targetId: 'alexander-pushkin', scores: completePoetScores, createdAt: iso(-500) }, createdAt: iso(-500), attempts: 0 },
    { id: `rating:${incompletePendingRatingId}`, kind: 'rating', voterId, entry: { id: incompletePendingRatingId, targetType: 'poet', targetId: 'alexander-pushkin', scores: { language: 5 }, createdAt: iso(-450) }, createdAt: iso(-450), attempts: 9 },
    { id: `comment:${pendingCommentId}`, kind: 'comment', voterId, entry: { id: pendingCommentId, targetType: 'article', targetId: 'sergei-yesenin-1921-1925', author: 'Локальный автор', text: 'Этот ожидающий комментарий должен пережить миграцию.', kind: 'history', helpful: 0, createdAt: iso(-400) }, createdAt: iso(-400), attempts: 0 },
  ],
  cooldowns: { 'comment:article:sergei-yesenin-1921-1925': now + 5000 },
  helpfulVotes: {},
  ownRatings: {
    'rating:poet:sergei-yesenin': { id: ownRatingId, scores: { language: 4, depth: 5 }, updatedAt: iso(-600) },
  },
  updatedAt: iso(-300),
  lastSyncedAt: iso(-1000),
}));

type MutationMode = 'retry' | 'ack' | 'reject' | 'rate-limit';
let mutationMode: MutationMode = 'retry';
let mutationRequestCount = 0;
let sessionRequestCount = 0;
globalThis.fetch = async (input) => {
  const url = new URL(String(input));
  if (url.pathname === '/v1/session') {
    sessionRequestCount += 1;
    return Response.json({
      actorToken: 'v1.test-signed-actor-token-that-is-long-enough.signature',
      expiresAt: Date.now() + 30 * 24 * 60 * 60_000,
    });
  }
  if (['/v1/rating', '/v1/comment', '/v1/helpful'].includes(url.pathname)) {
    mutationRequestCount += 1;
    if (mutationMode === 'ack') return Response.json({ ok: true });
    if (mutationMode === 'reject') return Response.json({ ok: false, code: 'invalid_comment' }, { status: 400 });
    if (mutationMode === 'rate-limit') {
      return Response.json({ ok: false, code: 'rate_limited' }, { status: 429, headers: { 'Retry-After': '1' } });
    }
    return Response.json({ ok: false, code: 'temporary_failure' }, { status: 503 });
  }
  return new Response(null, { status: 404 });
};

const store = await import('../src/utils/communityStore');
const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };

const migrated = store.getFeedbackSnapshot();
expect(mutationRequestCount === 0 && sessionRequestCount === 0, 'importing or subscribing to the store must not start community writes');
expect(migrated.ratings.length === 2, 'v2 migration must retain only a deliverable pending rating and device-owned rating');
expect(migrated.ratings.some((rating) => rating.id === pendingRatingId), 'complete pending rating must survive v2 migration');
expect(!migrated.ratings.some((rating) => rating.id === incompletePendingRatingId), 'incomplete legacy pending rating must not survive as a remote-deliverable local overlay');
expect(migrated.ratings.some((rating) => rating.id === ownRatingId), 'device-owned historical rating must survive v2 migration even when it predates the strict remote score contract');
expect(migrated.comments.length === 1 && migrated.comments[0]?.id === pendingCommentId, 'only pending comments may survive v2 migration');
expect(!migrated.ratings.some((rating) => rating.id.startsWith('rating-remote-')), 'public ratings corpus must be discarded during migration');
expect(!migrated.comments.some((comment) => comment.id.startsWith('comment-remote-')), 'public comments corpus must be discarded during migration');
expect(storage.getItem('tlp-community-feedback:v2') === null, 'v2 envelope must be removed after successful migration');
expect(storage.getItem('tlp-community-feedback:v3') !== null, 'bounded v3 envelope must be persisted');

const persistedAfterMigration = JSON.parse(storage.getItem('tlp-community-feedback:v3') ?? '{}') as {
  localSnapshot?: { ratings?: Array<{ id?: string }>; comments?: unknown[] };
  outbox?: Array<{ id?: string }>;
  settledOperations?: Record<string, unknown>;
};
expect((persistedAfterMigration.localSnapshot?.ratings?.length ?? 0) === 2, 'v3 persistence must contain only device-owned/deliverable ratings');
expect(!(persistedAfterMigration.localSnapshot?.ratings ?? []).some((rating) => rating.id === incompletePendingRatingId), 'v3 migration must quarantine an incomplete pending rating rather than retry it forever');
expect((persistedAfterMigration.localSnapshot?.comments?.length ?? 0) === 1, 'v3 persistence must contain only pending/device comments');
expect((persistedAfterMigration.outbox?.length ?? 0) === 2, 'v3 persistence must retain only deliverable mutations');
expect(!(persistedAfterMigration.outbox ?? []).some((operation) => operation.id === `rating:${incompletePendingRatingId}`), 'incomplete legacy rating operation must be removed from the remote outbox');
expect(Boolean(persistedAfterMigration.settledOperations), 'v3 persistence must carry delivery settlement tombstones');

let syncNotifications = 0;
const stopSync = store.subscribeCommunitySync(() => { syncNotifications += 1; });
expect(mutationRequestCount === 0, 'sync subscription must not immediately mutate the backend');

store.beginCommunityRemoteRead('read-a');
store.beginCommunityRemoteRead('read-b');
store.finishCommunityRemoteRead(false);
store.finishCommunityRemoteRead(true);
expect(store.getCommunitySyncSnapshot().phase === 'offline', 'a failed concurrent read must not be hidden by a later successful read');
expect(syncNotifications > 0, 'remote read state changes must notify sync subscribers');
stopSync();

mutationMode = 'retry';
await store.flushCommunityOutbox({ interactive: true });
expect(store.getCommunitySyncSnapshot().phase === 'offline', 'transient delivery failure must expose offline/queued state');
expect(store.getCommunitySyncSnapshot().pendingCount === 2, 'transient failure must retain all queued deliverable mutations in order');
expect(sessionRequestCount === 1, 'interactive flush without an actor session must mint exactly one signed actor session');
expect(storage.getItem('tlp-community-actor:v1') !== null, 'successful Turnstile-backed session mint must persist the signed actor token');

mutationMode = 'ack';
await store.flushCommunityOutbox();
expect(store.getCommunitySyncSnapshot().phase === 'online', 'successful background retry with an existing actor session must restore online state');
expect(store.getCommunitySyncSnapshot().pendingCount === 0, 'successful retry must empty the outbox');
expect(sessionRequestCount === 1, 'background retry must reuse the existing signed actor instead of minting another session');

const incompleteNewRatingId = 'rating-88888888-8888-4888-8888-888888888888';
expect(!store.commitRatingFeedback({
  id: incompleteNewRatingId,
  targetType: 'poet',
  targetId: 'anna-akhmatova',
  scores: { language: 5, depth: 4 },
  createdAt: iso(50),
}, 'rating:poet:anna-akhmatova', voterId), 'new incomplete rating payloads must be rejected before local/outbox commit');
expect(store.getCommunitySyncSnapshot().pendingCount === 0, 'rejected incomplete rating must never enter the outbox');

const rejectedCommentId = 'comment-88888888-8888-4888-8888-888888888888';
expect(store.commitCommentFeedback({
  id: rejectedCommentId,
  targetType: 'article',
  targetId: 'sergei-yesenin-1921-1925',
  author: 'Автор',
  text: 'Этот комментарий сервер отвергнет окончательно.',
  kind: 'literary',
  helpful: 0,
  createdAt: iso(100),
}, 'comment:article:sergei-yesenin-1921-1925', voterId), 'valid comment must enter the durable outbox');
mutationMode = 'reject';
await store.flushCommunityOutbox({ interactive: true });
expect(store.getCommunitySyncSnapshot().pendingCount === 0, 'permanent server rejection must remove poison work instead of retrying forever');
expect(!store.getFeedbackSnapshot().comments.some((comment) => comment.id === rejectedCommentId), 'permanent rejection must remove the optimistic local comment so server truth wins');
const afterReject = JSON.parse(storage.getItem('tlp-community-feedback:v3') ?? '{}') as { settledOperations?: Record<string, { outcome?: string }> };
expect(afterReject.settledOperations?.[`comment:${rejectedCommentId}`]?.outcome === 'reject', 'permanent rejection must persist a settlement tombstone against stale-tab resurrection');

const rateLimitedCommentId = 'comment-99999999-9999-4999-8999-999999999999';
expect(store.commitCommentFeedback({
  id: rateLimitedCommentId,
  targetType: 'article',
  targetId: 'sergei-yesenin-1921-1925',
  author: 'Автор',
  text: 'Этот комментарий временно ограничен серверным бюджетом.',
  kind: 'history',
  helpful: 0,
  createdAt: iso(150),
}, 'comment:article:sergei-yesenin-1921-1925', voterId), 'second valid comment must queue');
mutationMode = 'rate-limit';
await store.flushCommunityOutbox({ interactive: true });
expect(store.getCommunitySyncSnapshot().pendingCount === 1, '429 must remain retryable and retain the operation');
mutationMode = 'ack';
await store.flushCommunityOutbox();
expect(store.getCommunitySyncSnapshot().pendingCount === 0, 'rate-limited operation must clear after a later successful retry');

const crossTabA = 'comment-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
expect(store.commitCommentFeedback({
  id: crossTabA,
  targetType: 'article',
  targetId: 'sergei-yesenin-1921-1925',
  author: 'Вкладка A',
  text: 'Операция из первой вкладки должна пережить слияние.',
  kind: 'literary',
  helpful: 0,
  createdAt: iso(200),
}, 'comment:article:sergei-yesenin-1921-1925', voterId), 'tab A operation must persist');
const staleTabA = JSON.parse(storage.getItem('tlp-community-feedback:v3') ?? '{}');
const tabAOperation = staleTabA.outbox?.find((operation: { id?: string }) => operation.id === `comment:${crossTabA}`);
const tabAComment = staleTabA.localSnapshot?.comments?.find((comment: { id?: string }) => comment.id === crossTabA);
expect(Boolean(tabAOperation && tabAComment), 'tab A snapshot must contain its pending operation and optimistic comment');

const crossTabB = 'comment-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const externalB = structuredClone(staleTabA);
externalB.outbox = [{
  ...tabAOperation,
  id: `comment:${crossTabB}`,
  entry: {
    ...tabAOperation.entry,
    id: crossTabB,
    author: 'Вкладка B',
    text: 'Независимая операция второй вкладки не должна потеряться.',
    createdAt: iso(210),
  },
  createdAt: iso(210),
  attempts: 0,
}];
externalB.localSnapshot.comments = [{
  ...tabAComment,
  id: crossTabB,
  author: 'Вкладка B',
  text: 'Независимая операция второй вкладки не должна потеряться.',
  createdAt: iso(210),
}];
externalB.updatedAt = iso(220);
storage.setItem('tlp-community-feedback:v3', JSON.stringify(externalB));
const mergeEvent = new Event('storage') as Event & { key?: string };
mergeEvent.key = 'tlp-community-feedback:v3';
testWindow.dispatchEvent(mergeEvent);
expect(store.getCommunitySyncSnapshot().pendingCount === 2, 'cross-tab reconciliation must union independent pending operations instead of last-writer-wins loss');
expect(store.getFeedbackSnapshot().comments.some((comment) => comment.id === crossTabA), 'tab A optimistic work must survive tab B storage event');
expect(store.getFeedbackSnapshot().comments.some((comment) => comment.id === crossTabB), 'tab B optimistic work must be adopted by tab A');

const staleBeforeAck = JSON.stringify(externalB);
mutationMode = 'ack';
await store.flushCommunityOutbox();
expect(store.getCommunitySyncSnapshot().pendingCount === 0, 'merged cross-tab queue must deliver completely');
storage.setItem('tlp-community-feedback:v3', staleBeforeAck);
const staleEvent = new Event('storage') as Event & { key?: string };
staleEvent.key = 'tlp-community-feedback:v3';
testWindow.dispatchEvent(staleEvent);
expect(store.getCommunitySyncSnapshot().pendingCount === 0, 'settlement tombstones must prevent a stale tab from resurrecting already-ACKed operations');
expect(!store.getFeedbackSnapshot().comments.some((comment) => comment.id === crossTabA || comment.id === crossTabB), 'ACKed optimistic comments must not shadow later server moderation truth');

const countBeforeFailure = store.getFeedbackSnapshot().comments.length;
storage.failWrites = true;
const blocked = store.commitCommentFeedback({
  id: 'comment-66666666-6666-4666-8666-666666666666',
  targetType: 'article',
  targetId: 'sergei-yesenin-1921-1925',
  author: 'Автор',
  text: 'Запись при переполненном хранилище не должна появиться только в памяти.',
  kind: 'literary',
  helpful: 0,
  createdAt: iso(300),
}, 'comment:article:sergei-yesenin-1921-1925', voterId);
storage.failWrites = false;
expect(!blocked, 'quota failures must be reported');
expect(store.getFeedbackSnapshot().comments.length === countBeforeFailure, 'failed persistence must not create dishonest in-memory state');

for (const failure of failures) console.error(`ERROR community-store: ${failure}`);
console.log(`Community store validation: ${failures.length} error(s), ${mutationRequestCount} Worker mutation request(s), typed ACK/retry/reject reconciliation, stale-tab-safe settlement and no startup writes.`);
if (failures.length) process.exit(1);
