export {};

process.env.VITE_COMMUNITY_API_URL = 'https://community.test.invalid';
process.env.VITE_TURNSTILE_SITE_KEY = 'test-turnstile-site-key';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
}

const listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
const testWindow = {
  localStorage: new MemoryStorage(),
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

const targetId = 'runtime-refresh-race';
let summaryCalls = 0;
let commentCalls = 0;
let releaseFirstSummary: (() => void) | null = null;
let releaseFirstComments: (() => void) | null = null;

const aggregate = (ratingCount: number, overall: number) => ({
  targetType: 'article',
  targetId,
  ratingCount,
  commentCount: 1,
  overall,
  dimensions: { clarity: overall, depth: overall, fairness: overall },
  distribution: { [Math.round(overall)]: ratingCount },
  deviation: 0,
});

const comment = (id: string, text: string) => ({
  id,
  targetType: 'article',
  targetId,
  author: 'Race QA',
  text,
  kind: 'literary',
  helpful: 0,
  createdAt: '2026-09-08T08:00:00.000Z',
});

globalThis.fetch = async (input) => {
  const url = new URL(String(input));
  if (url.pathname === '/v1/summary') {
    summaryCalls += 1;
    if (summaryCalls === 1) {
      return new Promise<Response>((resolve) => {
        releaseFirstSummary = () => resolve(Response.json(aggregate(1, 3)));
      });
    }
    return Response.json(aggregate(2, 5));
  }
  if (url.pathname === '/v1/comments') {
    commentCalls += 1;
    if (commentCalls === 1) {
      return new Promise<Response>((resolve) => {
        releaseFirstComments = () => resolve(Response.json({
          comments: [comment('comment-00000001', 'Старый снимок до подтверждённой записи.')],
          nextCursor: null,
        }));
      });
    }
    return Response.json({
      comments: [comment('comment-00000002', 'Свежий снимок после подтверждённой записи.')],
      nextCursor: null,
    });
  }
  return new Response(null, { status: 404 });
};

const targets = await import('../src/utils/communityTargetStore');
const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
const settle = async () => {
  for (let index = 0; index < 8; index += 1) await new Promise((resolve) => setTimeout(resolve, 0));
};
const waitFor = async (predicate: () => boolean) => {
  for (let index = 0; index < 100 && !predicate(); index += 1) await new Promise((resolve) => setTimeout(resolve, 0));
};

const stop = targets.subscribeFeedbackTarget('article', targetId, () => undefined, 'full');
await waitFor(() => Boolean(releaseFirstSummary && releaseFirstComments));
expect(summaryCalls === 1 && commentCalls === 1, 'initial full subscription must have exactly one in-flight summary and comments request');

const forcedRefresh = targets.retryFeedbackTarget('article', targetId, 'full');
await settle();
expect(summaryCalls === 1 && commentCalls === 1, 'forced refresh must queue behind in-flight reads instead of starting concurrent duplicate requests');

releaseFirstSummary?.();
releaseFirstComments?.();
await forcedRefresh;
await settle();

expect(summaryCalls === 2, 'summary force arriving during an in-flight read must run exactly one post-flight refresh');
expect(commentCalls === 2, 'comments reset arriving during an in-flight read must run exactly one post-flight refresh');
const snapshot = targets.getFeedbackTargetSnapshot('article', targetId);
expect(snapshot.aggregate.ratingCount === 2 && snapshot.aggregate.overall === 5, 'post-flight summary refresh must win over the stale pre-refresh response');
expect(snapshot.comments.length === 1 && snapshot.comments[0]?.id === 'comment-00000002', 'post-flight comments reset must replace the stale pre-refresh page');
expect(snapshot.summaryPhase === 'ready' && snapshot.commentsPhase === 'ready', 'queued post-flight refreshes must settle both read phases as ready');

stop();
for (const failure of failures) console.error(`ERROR community-refresh-race: ${failure}`);
console.log(`Community refresh race validation: ${failures.length} error(s), forced reads are serialized and stale pre-ACK snapshots cannot become terminal state.`);
if (failures.length) process.exit(1);
