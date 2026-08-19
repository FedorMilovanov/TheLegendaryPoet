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
  cooldowns: { 'rating:poet:alexander-pushkin': now + 5000 },
  helpfulVotes: {},
  ownRatings: {
    'rating:poet:sergei-yesenin': { id: ownRatingId, scores: { language: 4, depth: 5 }, updatedAt: iso(-600) },
  },
  updatedAt: iso(-300),
  lastSyncedAt: iso(-1000),
}));

let requestCount = 0;
let mutationSucceeds = false;
globalThis.fetch = async (input, init) => {
  const url = new URL(String(input));
  if (url.pathname === '/v1/session') {
    return Response.json({
      actorToken: 'v1.test-signed-actor-token-that-is-long-enough.signature',
      expiresAt: Date.now() + 30 * 24 * 60 * 60_000,
    });
  }
  if (['/v1/rating', '/v1/comment', '/v1/helpful'].includes(url.pathname)) {
    requestCount += 1;
    return Response.json({ ok: mutationSucceeds }, { status: mutationSucceeds ? 200 : 503 });
  }
  if ((init?.method ?? 'GET') === 'GET') return Response.json({});
  return new Response(null, { status: 500 });
};

const store = await import('../src/utils/communityStore');
const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };

const migrated = store.getFeedbackSnapshot();
expect(requestCount === 0, 'importing or subscribing to the store must not start community reads/writes');
expect(migrated.ratings.length === 2, 'v2 migration must retain only a deliverable pending rating and device-owned rating');
expect(migrated.ratings.some((rating) => rating.id === pendingRatingId), 'complete pending rating must survive v2 migration');
expect(!migrated.ratings.some((rating) => rating.id === incompletePendingRatingId), 'incomplete legacy pending rating must not survive as a remote-deliverable local overlay');
expect(migrated.ratings.some((rating) => rating.id === ownRatingId), 'device-owned historical rating must survive v2 migration even when it predates the strict remote score contract');
expect(migrated.comments.length === 1 && migrated.comments[0]?.id === pendingCommentId, 'only pending comments may survive v2 migration');
expect(!migrated.ratings.some((rating) => rating.id.startsWith('rating-remote-')), 'public ratings corpus must be discarded during migration');
expect(!migrated.comments.some((comment) => comment.id.startsWith('comment-remote-')), 'public comments corpus must be discarded during migration');
expect(storage.getItem('tlp-community-feedback:v2') === null, 'v2 envelope must be removed after successful migration');
expect(storage.getItem('tlp-community-feedback:v3') !== null, 'bounded v3 envelope must be persisted');

const persisted = JSON.parse(storage.getItem('tlp-community-feedback:v3') ?? '{}') as { localSnapshot?: { ratings?: Array<{ id?: string }>; comments?: unknown[] }; outbox?: Array<{ id?: string }> };
expect((persisted.localSnapshot?.ratings?.length ?? 0) === 2, 'v3 persistence must contain only device-owned/deliverable ratings');
expect(!(persisted.localSnapshot?.ratings ?? []).some((rating) => rating.id === incompletePendingRatingId), 'v3 migration must quarantine an incomplete pending rating rather than retry it forever');
expect((persisted.localSnapshot?.comments?.length ?? 0) === 1, 'v3 persistence must contain only pending/device comments');
expect((persisted.outbox?.length ?? 0) === 2, 'v3 persistence must retain only deliverable mutations');
expect(!(persisted.outbox ?? []).some((operation) => operation.id === `rating:${incompletePendingRatingId}`), 'incomplete legacy rating operation must be removed from the remote outbox');

let syncNotifications = 0;
const stopSync = store.subscribeCommunitySync(() => { syncNotifications += 1; });
expect(requestCount === 0, 'sync subscription must not hydrate the remote corpus');

store.beginCommunityRemoteRead('read-a');
store.beginCommunityRemoteRead('read-b');
store.finishCommunityRemoteRead(false);
store.finishCommunityRemoteRead(true);
expect(store.getCommunitySyncSnapshot().phase === 'offline', 'a failed concurrent read must not be hidden by a later successful read');
expect(syncNotifications > 0, 'remote read state changes must notify sync subscribers');
stopSync();

mutationSucceeds = false;
await store.flushCommunityOutbox();
expect(store.getCommunitySyncSnapshot().phase === 'offline', 'failed outbox delivery must expose offline state');
expect(store.getCommunitySyncSnapshot().pendingCount === 2, 'failed delivery must retain all queued deliverable mutations');
expect(storage.getItem('tlp-community-actor:v1') !== null, 'successful Turnstile-backed session mint must persist the signed actor token');

mutationSucceeds = true;
await store.flushCommunityOutbox();
expect(store.getCommunitySyncSnapshot().phase === 'online', 'successful outbox retry must restore online state');
expect(store.getCommunitySyncSnapshot().pendingCount === 0, 'successful retry must empty the outbox');

const incompleteNewRatingId = 'rating-88888888-8888-4888-8888-888888888888';
expect(!store.commitRatingFeedback({
  id: incompleteNewRatingId,
  targetType: 'poet',
  targetId: 'anna-akhmatova',
  scores: { language: 5, depth: 4 },
  createdAt: iso(50),
}, 'rating:poet:anna-akhmatova', voterId), 'new incomplete rating payloads must be rejected before local/outbox commit');
expect(store.getCommunitySyncSnapshot().pendingCount === 0, 'rejected incomplete rating must never enter the outbox');

const newRatingId = 'rating-44444444-4444-4444-8444-444444444444';
expect(store.commitRatingFeedback({
  id: newRatingId,
  targetType: 'poet',
  targetId: 'anna-akhmatova',
  scores: completePoetScores,
  createdAt: iso(100),
}, 'rating:poet:anna-akhmatova', voterId), 'complete canonical rating payload must be accepted by the client store');
expect(store.getCommunitySyncSnapshot().pendingCount === 1, 'new remote-enabled canonical writes must enter the outbox');

const remoteHelpfulId = 'comment-55555555-5555-4555-8555-555555555555';
expect(store.commitHelpfulFeedback(remoteHelpfulId, `helpful:article:sergei-yesenin-1921-1925:${remoteHelpfulId}`, voterId), 'helpful vote for a non-persisted remote comment must queue');
expect(store.getPendingTargetOverlay('article', 'sergei-yesenin-1921-1925').helpfulCommentIds.includes(remoteHelpfulId), 'remote helpful overlay must remain target-scoped');

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
  createdAt: iso(200),
}, 'comment:article:sergei-yesenin-1921-1925', voterId);
storage.failWrites = false;
expect(!blocked, 'quota failures must be reported');
expect(store.getFeedbackSnapshot().comments.length === countBeforeFailure, 'failed persistence must not create dishonest in-memory state');

let localNotifications = 0;
const stopFeedback = store.subscribeFeedback(() => { localNotifications += 1; });
const event = new Event('storage') as Event & { key?: string };
event.key = 'tlp-community-feedback:v3';
testWindow.dispatchEvent(event);
stopFeedback();
expect(localNotifications === 1, 'cross-tab v3 storage events must notify once');

for (const failure of failures) console.error(`ERROR community-store: ${failure}`);
console.log(`Community store validation: ${failures.length} error(s), ${requestCount} Worker mutation request(s), no startup reads; incomplete legacy rating writes quarantined.`);
if (failures.length) process.exit(1);
