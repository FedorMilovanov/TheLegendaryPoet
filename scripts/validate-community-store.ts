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

storage.setItem('tlp-community-feedback-v1', JSON.stringify({
  ratings: [
    { id: 'rating-legacy', targetType: 'poet', targetId: 'sergei-yesenin', scores: { language: 3 }, createdAt: iso(-5000) },
    { id: 'rating-legacy', targetType: 'poet', targetId: 'sergei-yesenin', scores: { language: 5 }, createdAt: iso(-4000) },
    { id: 'rating-invalid', targetType: 'poet', targetId: 'sergei-yesenin', scores: { language: 8 }, createdAt: iso(-3000) },
  ],
  comments: [
    { id: 'comment-legacy', targetType: 'poet', targetId: 'sergei-yesenin', author: ' Читатель ', text: 'Содержательное наблюдение.', kind: 'literary', helpful: 1, createdAt: iso(-5000) },
    { id: 'comment-legacy', targetType: 'poet', targetId: 'sergei-yesenin', author: 'Читатель', text: 'Содержательное наблюдение.', kind: 'literary', helpful: 4, createdAt: iso(-4000) },
    { id: 'comment-invalid', targetType: 'poet', targetId: 'sergei-yesenin', author: 'X', text: 'мало', kind: 'literary', helpful: 0, createdAt: iso(-3000) },
  ],
}));
storage.setItem('tlp-community-cooldowns-v1', JSON.stringify({ 'rating:poet:legacy': now + 5000 }));
storage.setItem('tlp-community-helpful-v1', JSON.stringify({ 'helpful:poet:legacy': true }));
storage.setItem('tlp-community-rated-v1', JSON.stringify({
  'rating:poet:sergei-yesenin': { id: 'rating-legacy', scores: { language: 5 }, updatedAt: iso(-4000) },
}));

let rpcSucceeds = true;
let getRequestCount = 0;
let observedRange = '';

globalThis.fetch = async (input, init) => {
  const url = String(input);
  if (url.includes('/rest/v1/tlp_ratings_public')) {
    getRequestCount += 1;
    observedRange = new Headers(init?.headers).get('Range') ?? '';
    return new Response(JSON.stringify([
      { id: 'rating-remote', target_type: 'poet', target_id: 'alexander-pushkin', scores: { language: 5, depth: 4 }, created_at: iso(-2000) },
      { id: 'rating-bad-remote', target_type: 'unknown', target_id: 'alexander-pushkin', scores: { language: 5 }, created_at: iso(-1000) },
    ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.includes('/rest/v1/tlp_comments_public')) {
    getRequestCount += 1;
    return new Response(JSON.stringify([
      { id: 'comment-remote', target_type: 'poet', target_id: 'alexander-pushkin', author: 'Мария', text: 'Точное и спокойное читательское замечание.', kind: 'history', helpful: 2, created_at: iso(-1500) },
      { id: 'comment-bad-remote', target_type: 'poet', target_id: 'alexander-pushkin', author: 'X', text: 'мало', kind: 'history', helpful: 0, created_at: iso(-1000) },
    ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.includes('/rest/v1/rpc/')) return new Response(null, { status: rpcSucceeds ? 204 : 503 });
  return new Response(null, { status: 404 });
};

const store = await import('../src/utils/communityStore');

const failures: string[] = [];
const expect = (condition: unknown, message: string) => {
  if (!condition) failures.push(message);
};

const migrated = store.getFeedbackSnapshot();
expect(migrated.ratings.length === 1, 'legacy migration must sanitize and deduplicate ratings');
expect(migrated.ratings[0]?.scores.language === 5, 'legacy duplicate ratings must retain the newest valid value');
expect(migrated.comments.length === 1 && migrated.comments[0]?.helpful === 4, 'legacy comments must deduplicate and retain the highest helpful count');
expect(storage.getItem('tlp-community-feedback:v2') !== null, 'legacy migration must persist the v2 envelope');
expect(storage.getItem('tlp-community-feedback-v1') === null, 'legacy snapshot key must be removed after successful migration');
expect(store.getOwnRating('rating:poet:sergei-yesenin')?.scores.language === 5, 'legacy own-rating metadata must migrate');

const summary = store.averageScores([
  { id: 'rating-a', targetType: 'poet', targetId: 'alexander-pushkin', scores: { language: 5, depth: 3 }, createdAt: iso(-1000) },
  { id: 'rating-b', targetType: 'poet', targetId: 'alexander-pushkin', scores: { language: 1 }, createdAt: iso(-500) },
]);
expect(summary.dimensions.language === 3, 'dimension averages must use their own sample count');
expect(summary.dimensions.depth === 3, 'missing dimensions must not dilute a valid dimension average');
expect(summary.overall === 3, 'overall score must average valid dimension means');

await store.hydrateFromRemote();
const hydrated = store.getFeedbackSnapshot();
expect(hydrated.ratings.length === 1 && hydrated.ratings[0]?.id === 'rating-remote', 'remote hydration must replace stale cache with sanitized remote ratings');
expect(hydrated.comments.length === 1 && hydrated.comments[0]?.id === 'comment-remote', 'remote hydration must reject malformed remote comments');
expect(store.getCommunitySyncSnapshot().phase === 'online', 'successful hydration must expose an online sync state');
expect(getRequestCount === 2 && observedRange === '0-999', 'remote hydration must request both views with explicit pagination');

const invalidRatingStored = store.commitRatingFeedback({
  id: 'rating-invalid-score',
  targetType: 'poet',
  targetId: 'alexander-pushkin',
  scores: { language: 9 },
  createdAt: iso(0),
}, 'rating:poet:alexander-pushkin', 'device-a');
expect(!invalidRatingStored, 'invalid score values must be rejected before persistence');

const validRating = {
  id: 'rating-local',
  targetType: 'poet' as const,
  targetId: 'alexander-pushkin',
  scores: { language: 4, depth: 5 },
  createdAt: iso(0),
};
expect(store.commitRatingFeedback(validRating, 'rating:poet:alexander-pushkin', 'device-a'), 'valid ratings must persist atomically');
expect(store.getCommunitySyncSnapshot().pendingCount === 1, 'remote-enabled rating mutations must enter the outbox');
expect(store.getOwnRating('rating:poet:alexander-pushkin')?.id === validRating.id, 'own rating metadata must commit with the optimistic rating');
expect(!store.checkCooldown('rating:poet:alexander-pushkin').allowed, 'successful rating commits must set a cooldown');

rpcSucceeds = false;
await store.flushCommunityOutbox();
expect(store.getCommunitySyncSnapshot().phase === 'offline', 'failed outbox delivery must expose an offline state');
expect(store.getCommunitySyncSnapshot().pendingCount === 1, 'failed outbox delivery must retain the queued mutation');

rpcSucceeds = true;
await store.flushCommunityOutbox();
expect(store.getCommunitySyncSnapshot().phase === 'online', 'successful retry must restore the online state');
expect(store.getCommunitySyncSnapshot().pendingCount === 0, 'successful retry must remove the queued mutation');

const localComment = {
  id: 'comment-local',
  targetType: 'poet' as const,
  targetId: 'alexander-pushkin',
  author: ' Автор ',
  text: 'Локальный комментарий должен пережить удалённую гидратацию.',
  kind: 'literary' as const,
  helpful: 0,
  createdAt: iso(100),
};
expect(store.commitCommentFeedback(localComment, 'comment:poet:alexander-pushkin', 'device-a'), 'valid comments must persist and queue');
await store.hydrateFromRemote();
expect(store.getFeedbackSnapshot().comments.some((comment) => comment.id === localComment.id), 'remote hydration must preserve a pending local comment');
expect(store.getCommunitySyncSnapshot().pendingCount === 0, 'hydration must flush a pending comment when the server is available');

const helpfulBefore = store.getFeedbackSnapshot().comments.find((comment) => comment.id === 'comment-remote')?.helpful ?? -1;
expect(store.commitHelpfulFeedback('comment-remote', 'helpful:poet:alexander-pushkin:comment-remote', 'device-a'), 'first helpful vote must commit');
expect(!store.commitHelpfulFeedback('comment-remote', 'helpful:poet:alexander-pushkin:comment-remote', 'device-a'), 'duplicate helpful votes must be rejected');
expect((store.getFeedbackSnapshot().comments.find((comment) => comment.id === 'comment-remote')?.helpful ?? -1) === helpfulBefore + 1, 'helpful votes must update optimistically once');
await store.flushCommunityOutbox();

const countBeforeFailure = store.getFeedbackSnapshot().comments.length;
storage.failWrites = true;
const blocked = store.commitCommentFeedback({ ...localComment, id: 'comment-blocked' }, 'comment:poet:blocked', 'device-a');
storage.failWrites = false;
expect(!blocked, 'quota or private-mode write failures must be reported');
expect(store.getFeedbackSnapshot().comments.length === countBeforeFailure, 'failed writes must not create dishonest in-memory comments');

let notifications = 0;
const unsubscribe = store.subscribeFeedback(() => { notifications += 1; });
storage.setItem('tlp-community-feedback:v2', '{broken json');
const storageEvent = new Event('storage') as Event & { key?: string };
storageEvent.key = 'tlp-community-feedback:v2';
testWindow.dispatchEvent(storageEvent);
unsubscribe();
expect(notifications === 1, 'cross-tab storage changes must notify subscribers once');
expect(Array.isArray(store.getFeedbackSnapshot().ratings), 'corrupt v2 JSON must recover without throwing');
expect(storage.getItem('tlp-community-feedback:v2')?.startsWith('{') === true, 'corrupt v2 JSON must be replaced by a valid envelope');

for (const failure of failures) console.error(`ERROR community-store: ${failure}`);
console.log(`Community store validation: ${failures.length} error(s)`);
if (failures.length) process.exit(1);
