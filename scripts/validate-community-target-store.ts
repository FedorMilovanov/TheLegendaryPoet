process.env.VITE_SUPABASE_URL = 'https://community.test';
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
};
Object.defineProperty(globalThis, 'window', { configurable: true, value: testWindow });
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { onLine: true } });

const requestUrls: string[] = [];
const commentBodies: Array<Record<string, unknown>> = [];
const timestamp = '2026-08-05T12:00:00.000Z';
const comments = Array.from({ length: 21 }, (_, index) => ({
  id: `comment-100-${String(21 - index).padStart(2, '0')}`,
  target_type: 'poet',
  target_id: 'alexander-pushkin',
  author: 'Читатель',
  text: `Комментарий для стабильной страницы ${21 - index}.`,
  kind: 'literary',
  helpful: index,
  created_at: timestamp,
}));

globalThis.fetch = async (input, init) => {
  const url = String(input);
  requestUrls.push(url);
  if (url.includes('/rest/v1/tlp_community_targets_public')) {
    return new Response(JSON.stringify([{
      target_type: 'poet',
      target_id: 'alexander-pushkin',
      rating_count: 4,
      comment_count: 21,
      overall: 4.25,
      dimensions: { language: 4.5, depth: 4 },
      distribution: { 1: 0, 2: 0, 3: 1, 4: 1, 5: 2 },
      deviation: 0.43,
    }]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.includes('/rest/v1/rpc/tlp_fetch_comments_page')) {
    const body = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>;
    commentBodies.push(body);
    const beforeId = typeof body.p_before_id === 'string' ? body.p_before_id : null;
    const start = beforeId ? comments.findIndex((comment) => comment.id === beforeId) + 1 : 0;
    return new Response(JSON.stringify(comments.slice(start, start + 11)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (url.includes('/rest/v1/rpc/')) return new Response(null, { status: 204 });
  return new Response(null, { status: 404 });
};

const store = await import('../src/utils/communityStore');
const targets = await import('../src/utils/communityTargetStore');
const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };

expect(requestUrls.length === 0, 'importing community stores must perform zero remote reads');
let firstNotifications = 0;
let secondNotifications = 0;
const stopFirst = targets.subscribeFeedbackTarget('poet', 'alexander-pushkin', () => { firstNotifications += 1; });
const stopSecond = targets.subscribeFeedbackTarget('poet', 'alexander-pushkin', () => { secondNotifications += 1; });
await targets.refreshFeedbackTarget('poet', 'alexander-pushkin');

const first = targets.getFeedbackTargetSnapshot('poet', 'alexander-pushkin');
expect(first.aggregate.ratingCount === 4 && first.aggregate.commentCount === 21, 'target must consume one aggregate row');
expect(first.comments.length === 10 && first.hasMoreComments, 'target must load one bounded comment page');
expect(first === targets.getFeedbackTargetSnapshot('poet', 'alexander-pushkin'), 'unchanged target snapshot identity must remain stable');
expect(requestUrls.filter((url) => url.includes('tlp_community_targets_public')).length === 1, 'duplicate target subscribers must share one aggregate request');
expect(requestUrls.every((url) => !url.includes('order=created_at.desc') || url.includes('target_id=eq.')), 'no request may scan an unfiltered raw corpus');
const aggregateUrl = requestUrls.find((url) => url.includes('tlp_community_targets_public')) ?? '';
expect(aggregateUrl.includes('target_type=eq.poet') && aggregateUrl.includes('target_id=eq.alexander-pushkin'), 'aggregate request must be target-scoped');

await targets.loadMoreFeedbackComments('poet', 'alexander-pushkin');
const second = targets.getFeedbackTargetSnapshot('poet', 'alexander-pushkin');
expect(second.comments.length === 20 && second.hasMoreComments, 'second cursor page must append ten unique comments');
expect(new Set(second.comments.map((comment) => comment.id)).size === 20, 'equal-timestamp cursor pages must not duplicate comments');
expect(commentBodies[1]?.p_before_created_at === timestamp, 'next page must carry the exact timestamp cursor');
expect(commentBodies[1]?.p_before_id === first.comments.at(-1)?.id, 'next page must carry the id tie-break cursor');

await targets.loadMoreFeedbackComments('poet', 'alexander-pushkin');
const final = targets.getFeedbackTargetSnapshot('poet', 'alexander-pushkin');
expect(final.comments.length === 21 && !final.hasMoreComments, 'final cursor page must close without gaps');
expect(new Set(final.comments.map((comment) => comment.id)).size === 21, 'all cursor pages must remain duplicate-free');

expect(store.commitRatingFeedback({
  id: 'rating-200-devicea',
  targetType: 'poet',
  targetId: 'alexander-pushkin',
  scores: { language: 5, depth: 5 },
  createdAt: new Date().toISOString(),
}, 'rating:poet:alexander-pushkin', 'device-target-test'), 'optimistic target rating must persist');
const optimistic = targets.getFeedbackTargetSnapshot('poet', 'alexander-pushkin');
expect(optimistic.aggregate.ratingCount === 5, 'pending new rating must overlay aggregate count immediately');
expect(firstNotifications > 0 && secondNotifications > 0, 'all subscribers of the changed target must receive updates');

stopFirst();
stopSecond();
for (const failure of failures) console.error(`ERROR community-target-store: ${failure}`);
console.log(`Community target store validation: ${failures.length} error(s), requests=${requestUrls.length}`);
if (failures.length) process.exit(1);
