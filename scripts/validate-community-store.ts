export {};

process.env.VITE_SUPABASE_URL = 'https://community.test.invalid';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';

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

const now = Date.now();
const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString();
const ownRatingId = 'rating-11111111-1111-4111-8111-111111111111';
const pendingRatingId = 'rating-22222222-2222-4222-8222-222222222222';
const pendingCommentId = 'comment-33333333-3333-4333-8333-333333333333';

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
      { id: pendingRatingId, targetType: 'poet', targetId: 'alexander-pushkin', scores: { language: 5 }, createdAt: iso(-500) },
    ],
    comments: [
      ...remoteComments,
      { id: pendingCommentId, targetType: 'article', targetId: 'sergei-yesenin-1921-1925', author: 'Локальный автор', text: 'Этот ожидающий комментарий должен пережить миграцию.', kind: 'history', helpful: 0, createdAt: iso(-400) },
    ],
  },
  outbox: [
    { id: `rating:${pendingRatingId}`, kind: 'rating', voterId: 'device-a', entry: { id: pendingRatingId, targetType: 'poet', targetId: 'alexander-pushkin', scores: { language: 5 }, createdAt: iso(-500) }, createdAt: iso(-500), attempts: 0 },
    { id: `comment:${pendingCommentId}`, kind: 'comment', voterId: 'device-a', entry: { id: pendingCommentId, targetType: 'article', targetId: 'sergei-yesenin-1921-1925', author: 'Локальный автор', text: 'Этот ожидающий комментарий должен пережить миграцию.', kind: 'history', helpful: 0, createdAt: iso(-400) }, createdAt: iso(-400), attempts: 0 },
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
let rpcSucceeds = false;
globalThis.fetch = async (input) => {
  requestCount += 1;
  const url = String(input);
  if (url.includes('/rest/v1/rpc/')) return new Response(null, { status: rpcSucceeds ? 204 : 503 });
  return new Response(null, { status: 500 });
};

const store = await import('../src/utils/communityStore');
const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };

const migrated = store.getFeedbackSnapshot();
expect(requestCount === 0, 'importing or subscribing to the store must not start community reads');
expect(migrated.ratings.length === 2, 'v2 migration must retain only the pending and device-owned ratings');
expect(migrated.ratings.some((rating) => rating.id === pendingRatingId), 'pending rating must survive v2 migration');
expect(migrated.ratings.some((rating) => rating.id === ownRatingId), 'device-owned rating must survive v2 migration');
expect(migrated.comments.length === 1 && migrated.comments[0]?.id === pendingCommentId, 'only pending comments may survive v2 migration');
expect(!migrated.ratings.some((rating) => rating.id.startsWith('rating-remote-')), 'public ratings corpus must be discarded during migration');
expect(!migrated.comments.some((comment) => comment.id.startsWith('comment-remote-')), 'public comments corpus must be discarded during migration');
expect(storage.getItem('tlp-community-feedback:v2') === null, 'v2 envelope must be removed after successful migration');
expect(storage.getItem('tlp-community-feedback:v3') !== null, 'bounded v3 envelope must be persisted');

const persisted = JSON.parse(storage.getItem('tlp-community-feedback:v3') ?? '{}') as { localSnapshot?: { ratings?: unknown[]; comments?: unknown[] }; outbox?: unknown[] };
expect((persisted.localSnapshot?.ratings?.length ?? 0) === 2, 'v3 persistence must contain only device-owned ratings');
expect((persisted.localSnapshot?.comments?.length ?? 0) === 1, 'v3 persistence must contain only pending/device comments');
expect((persisted.outbox?.length ?? 0) === 2, 'v3 persistence must retain the outbox');

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

rpcSucceeds = false;
await store.flushCommunityOutbox();
expect(store.getCommunitySyncSnapshot().phase === 'offline', 'failed outbox delivery must expose offline state');
expect(store.getCommunitySyncSnapshot().pendingCount === 2, 'failed delivery must retain all queued mutations');

rpcSucceeds = true;
await store.flushCommunityOutbox();
expect(store.getCommunitySyncSnapshot().phase === 'online', 'successful outbox retry must restore online state');
expect(store.getCommunitySyncSnapshot().pendingCount === 0, 'successful retry must empty the outbox');

const newRatingId = 'rating-44444444-4444-4444-8444-444444444444';
expect(store.commitRatingFeedback({
  id: newRatingId,
  targetType: 'poet',
  targetId: 'anna-akhmatova',
  scores: { language: 5, depth: 4 },
  createdAt: iso(100),
}, 'rating:poet:anna-akhmatova', 'device-a'), 'UUID-based rating ids must be accepted by the client store');
expect(store.getCommunitySyncSnapshot().pendingCount === 1, 'new remote-enabled writes must enter the outbox');

const remoteHelpfulId = 'comment-55555555-5555-4555-8555-555555555555';
expect(store.commitHelpfulFeedback(remoteHelpfulId, `helpful:article:sergei-yesenin-1921-1925:${remoteHelpfulId}`, 'device-a'), 'helpful vote for a non-persisted remote comment must queue');
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
}, 'comment:article:sergei-yesenin-1921-1925', 'device-a');
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
console.log(`Community store validation: ${failures.length} error(s), ${requestCount} write request(s), no startup reads.`);
if (failures.length) process.exit(1);
