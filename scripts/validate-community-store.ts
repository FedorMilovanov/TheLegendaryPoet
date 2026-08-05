process.env.VITE_SUPABASE_URL = 'https://community.test';
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
const navigatorState = { onLine: true };
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
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: navigatorState });

const now = Date.now();
const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString();
storage.setItem('tlp-community-feedback:v2', JSON.stringify({
  version: 2,
  snapshot: {
    ratings: Array.from({ length: 140 }, (_, index) => ({
      id: `rating-${index}`,
      targetType: 'poet',
      targetId: 'sergei-yesenin',
      scores: { language: (index % 5) + 1 },
      createdAt: iso(-index * 1000),
    })),
    comments: Array.from({ length: 140 }, (_, index) => ({
      id: `comment-${index}`,
      targetType: 'poet',
      targetId: 'sergei-yesenin',
      author: 'Читатель',
      text: `Содержательное наблюдение номер ${index}.`,
      kind: 'literary',
      helpful: index,
      createdAt: iso(-index * 1000),
    })),
  },
  outbox: [],
  cooldowns: {},
  helpfulVotes: {},
  ownRatings: {},
  updatedAt: iso(-1000),
  lastSyncedAt: null,
}));

let rpcSucceeds = true;
let readRequests = 0;
let writeRequests = 0;
globalThis.fetch = async (input, init) => {
  const url = String(input);
  if ((init?.method ?? 'GET') === 'GET') readRequests += 1;
  if (url.includes('/rest/v1/rpc/')) {
    writeRequests += 1;
    return new Response(null, { status: rpcSucceeds ? 204 : 503 });
  }
  return new Response(null, { status: 404 });
};

const store = await import('../src/utils/communityStore');
const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };

const migrated = store.getFeedbackSnapshot();
expect(migrated.ratings.length === 100, 'v2 migration must bound local rating cache to 100');
expect(migrated.comments.length === 100, 'v2 migration must bound local comment cache to 100');
expect(storage.getItem('tlp-community-feedback:v3') !== null, 'migration must persist the v3 envelope');
expect(storage.getItem('tlp-community-feedback:v2') === null, 'v2 corpus must be removed after bounded migration');
expect(readRequests === 0, 'communityStore import and migration must perform zero remote reads');

const summary = store.averageScores([
  { id: 'rating-a', targetType: 'poet', targetId: 'alexander-pushkin', scores: { language: 5, depth: 3 }, createdAt: iso(-1000) },
  { id: 'rating-b', targetType: 'poet', targetId: 'alexander-pushkin', scores: { language: 1 }, createdAt: iso(-500) },
]);
expect(summary.dimensions.language === 3, 'dimension averages must use their own sample count');
expect(summary.dimensions.depth === 3, 'missing dimensions must not dilute valid averages');
expect(summary.overall === 3, 'overall must average valid dimension means');

const ratingScope = 'rating:poet:alexander-pushkin';
const firstRating = {
  id: 'rating-100-devicea',
  targetType: 'poet' as const,
  targetId: 'alexander-pushkin',
  scores: { language: 4, depth: 5 },
  createdAt: iso(0),
};
expect(store.commitRatingFeedback(firstRating, ratingScope, 'device-a'), 'valid rating must persist atomically');
expect(store.getCommunitySyncSnapshot().pendingCount === 1, 'rating must enter remote outbox');
expect(store.getPendingTargetFeedback('poet', 'alexander-pushkin').ratings.length === 1, 'pending target overlay must expose the rating');

const updatedRating = { ...firstRating, scores: { language: 2, depth: 3 }, createdAt: iso(100) };
expect(store.commitRatingFeedback(updatedRating, ratingScope, 'device-a'), 'rating update must replace the same outbox operation');
const pendingRating = store.getPendingTargetFeedback('poet', 'alexander-pushkin').ratings[0];
expect(pendingRating?.previousScores?.language === 4, 'rating update must retain previous scores for exact optimistic aggregate replacement');
expect(store.getCommunitySyncSnapshot().pendingCount === 1, 'rating update must not duplicate the outbox item');

rpcSucceeds = false;
await store.flushCommunityOutbox();
expect(store.getCommunitySyncSnapshot().phase === 'offline', 'failed delivery must expose offline state');
expect(store.getCommunitySyncSnapshot().pendingCount === 1, 'failed delivery must retain queued work');
rpcSucceeds = true;
await store.flushCommunityOutbox();
expect(store.getCommunitySyncSnapshot().phase === 'online', 'successful retry must restore online state');
expect(store.getCommunitySyncSnapshot().pendingCount === 0, 'successful retry must empty outbox');
expect(writeRequests >= 2, 'outbox must use write RPCs');
expect(readRequests === 0, 'outbox retry must not trigger global remote reads');

const localComment = {
  id: 'comment-100-devicea',
  targetType: 'poet' as const,
  targetId: 'alexander-pushkin',
  author: 'Автор',
  text: 'Локальный комментарий сохраняется оптимистично и безопасно.',
  kind: 'literary' as const,
  helpful: 0,
  createdAt: iso(200),
};
expect(store.commitCommentFeedback(localComment, 'comment:poet:alexander-pushkin', 'device-a'), 'valid comment must persist and queue');
expect(store.getPendingTargetFeedback('poet', 'alexander-pushkin').comments[0]?.id === localComment.id, 'pending comment must be target-scoped');
expect(store.commitHelpfulFeedback(localComment.id, `helpful:poet:alexander-pushkin:${localComment.id}`, 'device-a'), 'first helpful vote must commit');
expect(!store.commitHelpfulFeedback(localComment.id, `helpful:poet:alexander-pushkin:${localComment.id}`, 'device-a'), 'duplicate helpful vote must be rejected');
await store.flushCommunityOutbox();

const id = store.makeFeedbackId('rating');
expect(/^rating-[0-9]+-[a-z0-9]{1,16}$/.test(id), 'generated ids must satisfy backend RPC validation');

const countBeforeFailure = store.getFeedbackSnapshot().comments.length;
storage.failWrites = true;
const blocked = store.commitCommentFeedback({ ...localComment, id: 'comment-101-devicea' }, 'comment:poet:blocked', 'device-a');
storage.failWrites = false;
expect(!blocked, 'quota/private-mode failures must be reported');
expect(store.getFeedbackSnapshot().comments.length === countBeforeFailure, 'failed persistence must not create dishonest memory-only comments');

let notifications = 0;
const unsubscribe = store.subscribeFeedback(() => { notifications += 1; });
storage.setItem('tlp-community-feedback:v3', '{broken json');
const storageEvent = new Event('storage') as Event & { key?: string };
storageEvent.key = 'tlp-community-feedback:v3';
testWindow.dispatchEvent(storageEvent);
unsubscribe();
expect(notifications === 1, 'cross-tab changes must notify subscribers once');
expect(Array.isArray(store.getFeedbackSnapshot().ratings), 'corrupt v3 JSON must recover without throwing');
expect(readRequests === 0, 'cross-tab recovery must remain local-only');

for (const failure of failures) console.error(`ERROR community-store: ${failure}`);
console.log(`Community store validation: ${failures.length} error(s), reads=${readRequests}, writes=${writeRequests}`);
if (failures.length) process.exit(1);
