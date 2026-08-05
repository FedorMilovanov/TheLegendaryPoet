export {};

process.env.VITE_SUPABASE_URL = 'https://community.test.invalid';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';

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

const targetId = 'sergei-yesenin-1921-1925';
const voterId = '11111111-1111-4111-8111-111111111111';
const equalTimestamp = '2026-08-05T10:00:00.000Z';
const commentRows = Array.from({ length: 12 }, (_, index) => ({
  id: `comment-${String(99 - index).padStart(8, '0')}`,
  target_type: 'article',
  target_id: targetId,
  author: `Читатель ${index + 1}`,
  text: `Содержательное адресное наблюдение номер ${index + 1}.`,
  kind: index % 2 ? 'history' : 'literary',
  helpful: index,
  created_at: index < 3 ? equalTimestamp : new Date(Date.parse(equalTimestamp) - index * 1000).toISOString(),
}));

let requestUrls: string[] = [];
let summaryAvailable = true;
globalThis.fetch = async (input) => {
  const url = new URL(String(input));
  requestUrls.push(url.toString());

  if (url.pathname.endsWith('/tlp_feedback_summary_public')) {
    if (!summaryAvailable) return new Response(null, { status: 404 });
    const type = url.searchParams.get('target_type');
    if (type === 'eq.poet') {
      return Response.json([
        { target_type: 'poet', target_id: 'alexander-pushkin', rating_count: 12, comment_count: 3, overall: 4.5, dimensions: { language: 4.7 }, distribution: { 4: 4, 5: 8 }, deviation: 0.3 },
        { target_type: 'poet', target_id: 'sergei-yesenin', rating_count: 8, comment_count: 2, overall: 4.2, dimensions: { language: 4.3 }, distribution: { 4: 6, 5: 2 }, deviation: 0.4 },
      ]);
    }
    return Response.json([
      { target_type: 'article', target_id: targetId, rating_count: 9, comment_count: 12, overall: 4.4, dimensions: { language: 4.6, depth: 4.2 }, distribution: { 4: 5, 5: 4 }, deviation: 0.35 },
    ]);
  }

  if (url.pathname.endsWith('/tlp_comments_public')) {
    const cursor = url.searchParams.get('or');
    return Response.json(cursor ? commentRows.slice(10) : commentRows.slice(0, 11));
  }

  if (url.pathname.includes('/rpc/')) return new Response(null, { status: 204 });
  return new Response(null, { status: 404 });
};

const store = await import('../src/utils/communityStore');
const targets = await import('../src/utils/communityTargetStore');
const leaderboard = await import('../src/utils/communityLeaderboardStore');
const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
const settle = async () => {
  for (let index = 0; index < 8; index += 1) await new Promise((resolve) => setTimeout(resolve, 0));
};

const passiveStart = requestUrls.length;
const stopPassive = targets.subscribeFeedbackTarget('article', targetId, () => undefined, 'passive');
await settle();
expect(requestUrls.length === passiveStart, 'passive target subscription must perform zero remote reads');
stopPassive();

const summaryStart = requestUrls.length;
let summaryNotifications = 0;
const stopSummary = targets.subscribeFeedbackTarget('article', targetId, () => { summaryNotifications += 1; }, 'summary');
await settle();
const summaryRequests = requestUrls.slice(summaryStart);
expect(summaryRequests.length === 1, 'summary mode must issue exactly one target aggregate request');
expect(summaryRequests[0]?.includes('tlp_feedback_summary_public'), 'summary mode must use the aggregate view');
expect(summaryRequests[0]?.includes('target_type=eq.article') && summaryRequests[0]?.includes(`target_id=eq.${targetId}`), 'summary request must be target scoped');
expect(!summaryRequests.some((url) => url.includes('tlp_comments_public') || url.includes('tlp_ratings_public')), 'summary mode must not download comments or raw ratings');
const summarySnapshot = targets.getFeedbackTargetSnapshot('article', targetId);
expect(summarySnapshot.aggregate.ratingCount === 9 && summarySnapshot.aggregate.commentCount === 12, 'summary mode must expose aggregate counts');
expect(summarySnapshot.comments.length === 0, 'summary mode must not hydrate comments');
expect(summaryNotifications > 0, 'summary completion must notify subscribers');
stopSummary();

const fullStart = requestUrls.length;
let fullNotifications = 0;
const stopFull = targets.subscribeFeedbackTarget('article', targetId, () => { fullNotifications += 1; }, 'full');
await settle();
const fullRequests = requestUrls.slice(fullStart);
expect(fullRequests.some((url) => url.includes('tlp_feedback_summary_public')), 'full mode must request the target aggregate');
const firstCommentRequest = fullRequests.find((url) => url.includes('tlp_comments_public'));
expect(Boolean(firstCommentRequest), 'full mode must request one bounded comments page');
expect(firstCommentRequest?.includes('limit=11') === true, 'first comments request must use page-size + sentinel, not an unbounded range');
expect(firstCommentRequest?.includes('target_type=eq.article') === true && firstCommentRequest?.includes(`target_id=eq.${targetId}`) === true, 'comments request must be target scoped');
expect(!fullRequests.some((url) => url.includes('tlp_ratings_public')), 'full mode must not download raw ratings when aggregate view exists');
const firstPage = targets.getFeedbackTargetSnapshot('article', targetId);
expect(firstPage.comments.length === 10, 'first comments page must expose exactly the bounded page size');
expect(firstPage.hasMoreComments, 'sentinel row must produce a next cursor');
expect(new Set(firstPage.comments.map((comment) => comment.id)).size === firstPage.comments.length, 'first comments page must not contain duplicate ids');

await targets.loadMoreFeedbackTargetComments('article', targetId);
await settle();
const secondPage = targets.getFeedbackTargetSnapshot('article', targetId);
const cursorRequest = requestUrls.filter((url) => url.includes('tlp_comments_public')).at(-1) ?? '';
expect(cursorRequest.includes('or='), 'subsequent comments request must include a stable timestamp/id cursor');
expect(decodeURIComponent(cursorRequest).includes('created_at.eq.') && decodeURIComponent(cursorRequest).includes('id.lt.'), 'cursor must break equal timestamps by id');
expect(secondPage.comments.length === 12, 'second comments page must append the remaining rows');
expect(!secondPage.hasMoreComments, 'final page must clear the cursor');
expect(new Set(secondPage.comments.map((comment) => comment.id)).size === 12, 'cursor merge must not create duplicates');
expect(fullNotifications > 0, 'full mode must notify as summary/comments arrive');

const unrelatedBefore = targets.getFeedbackTargetSnapshot('poet', 'anna-akhmatova');
let unrelatedNotifications = 0;
const stopUnrelated = targets.subscribeFeedbackTarget('poet', 'anna-akhmatova', () => { unrelatedNotifications += 1; }, 'passive');
expect(store.commitRatingFeedback({
  id: 'rating-77777777-7777-4777-8777-777777777777',
  targetType: 'article',
  targetId,
  scores: { language: 5, depth: 5 },
  createdAt: new Date().toISOString(),
}, `rating:article:${targetId}`, voterId), 'target optimistic rating must persist');
await settle();
expect(targets.getFeedbackTargetSnapshot('poet', 'anna-akhmatova') === unrelatedBefore, 'unrelated target snapshot identity must remain stable');
expect(unrelatedNotifications === 0, 'unrelated target subscribers must not rerender');

const leaderboardStart = requestUrls.length;
let leaderboardNotifications = 0;
const leaderboardIds = ['alexander-pushkin', 'sergei-yesenin'];
const stopLeaderboard = leaderboard.subscribeCommunityLeaderboard(leaderboardIds, () => { leaderboardNotifications += 1; });
await settle();
const leaderboardRequests = requestUrls.slice(leaderboardStart);
expect(leaderboardRequests.length === 1, 'leaderboard must issue one aggregate request');
expect(leaderboardRequests[0]?.includes('tlp_feedback_summary_public'), 'leaderboard must use the aggregate view');
expect(leaderboardRequests[0]?.includes('target_type=eq.poet'), 'leaderboard request must be poet scoped');
expect(decodeURIComponent(leaderboardRequests[0] ?? '').includes('target_id=in.('), 'leaderboard request must list bounded target ids');
expect(!leaderboardRequests.some((url) => url.includes('tlp_comments_public') || url.includes('tlp_ratings_public')), 'leaderboard must never download comments or raw ratings');
const leaderboardSnapshot = leaderboard.getCommunityLeaderboardSnapshot(leaderboardIds);
expect(leaderboardSnapshot.phase === 'ready' && leaderboardSnapshot.aggregates[0]?.ratingCount === 12, 'leaderboard must expose aggregate rows');
expect(leaderboardNotifications > 0, 'leaderboard completion must notify subscribers');

stopLeaderboard();

summaryAvailable = false;
requestUrls = [];
const missingIds = ['anna-akhmatova', 'marina-tsvetaeva'];
const stopMissing = leaderboard.subscribeCommunityLeaderboard(missingIds, () => undefined);
await settle();
expect(requestUrls.length === 1 && requestUrls[0]?.includes('tlp_feedback_summary_public'), 'missing aggregate view must still issue only the single bounded summary request');
expect(!requestUrls.some((url) => url.includes('tlp_ratings_public') || url.includes('tlp_comments_public')), 'leaderboard must fail closed instead of fanning out raw fallback reads');
expect(leaderboard.getCommunityLeaderboardSnapshot(missingIds).phase === 'error', 'missing aggregate view must surface a retryable leaderboard error');
stopMissing();
summaryAvailable = true;

stopUnrelated();
stopFull();

for (const failure of failures) console.error(`ERROR community-target-store: ${failure}`);
console.log(`Community target validation: ${failures.length} error(s), ${requestUrls.length} target-scoped request(s).`);
if (failures.length) process.exit(1);
