import { readFileSync } from 'node:fs';

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

const testWindow = {
  localStorage: new MemoryStorage(),
  addEventListener() {},
  removeEventListener() {},
};
Object.defineProperty(globalThis, 'window', { configurable: true, value: testWindow });
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { onLine: true } });

const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
const files = {
  app: readFileSync('src/App.tsx', 'utf8'),
  remote: readFileSync('src/utils/communityRemote.ts', 'utf8'),
  store: readFileSync('src/utils/communityStore.ts', 'utf8'),
  target: readFileSync('src/utils/communityTargetStore.ts', 'utf8'),
  leaderboard: readFileSync('src/utils/communityLeaderboardStore.ts', 'utf8'),
  ratingsPage: readFileSync('src/pages/RatingsPage.tsx', 'utf8'),
  hook: readFileSync('src/hooks/useCommunityFeedback.ts', 'utf8'),
  schema: readFileSync('docs/community-schema.sql', 'utf8'),
  packageJson: readFileSync('package.json', 'utf8'),
};

expect(!/hydrateFromRemote|fetchAllRemote|communityRemote/.test(files.app), 'generic App startup must not import or call community remote reads');
expect(!/MAX_ROWS_PER_VIEW|fetchAllRemote|fetchRows<.*>\(view/.test(files.remote), 'remote client must not retain a global corpus scanner');
expect(files.remote.includes('tlp_community_targets_public'), 'remote client must use the aggregate target view');
expect(files.remote.includes('tlp_fetch_comments_page'), 'remote client must use the stable cursor RPC');
expect(files.remote.includes('TARGET_RATING_FALLBACK_LIMIT = 500'), 'target-only fallback must have an explicit rating ceiling');
expect(files.remote.includes('COMMENT_PAGE_SIZE = 10'), 'comment pages must have an explicit bounded size');
expect(!/fetchAllRemote|hydrateFromRemote/.test(files.store), 'local store must not expose wholesale hydration');
expect(files.store.includes("tlp-community-feedback:v3"), 'bounded local persistence must use the v3 envelope');
expect(files.store.includes('MAX_LOCAL_RATINGS = 100') && files.store.includes('MAX_LOCAL_COMMENTS = 100'), 'local persisted feedback must be explicitly bounded');
expect(files.target.includes('fetchTargetRemote') && files.target.includes('loadMoreFeedbackComments'), 'target store must own scoped initial load and cursor pagination');
expect(files.leaderboard.includes('fetchCommunityLeaderboard'), 'leaderboard store must use aggregate rows');
expect(!/tlp_comments_public|CommentEntry|comment\.text/.test(files.leaderboard), 'leaderboard store must not download or depend on comment bodies');
expect(files.ratingsPage.includes('communityLeaderboardStore'), 'ratings page must consume the aggregate-only leaderboard store');
expect(!/getFeedbackSnapshot|filterRatings|filterComments/.test(files.ratingsPage), 'ratings page must not aggregate a raw global snapshot');
expect(files.hook.includes('loadMoreFeedbackComments') && files.hook.includes('refreshFeedbackTarget'), 'detail hook must expose remote cursor loading and scoped revalidation');

for (const marker of [
  'create or replace view public.tlp_ratings_public',
  'create or replace view public.tlp_comments_public',
  'create or replace function public.tlp_submit_rating',
  'create or replace function public.tlp_submit_comment',
  'create or replace function public.tlp_mark_helpful',
  'create or replace view public.tlp_community_targets_public',
  'create or replace function public.tlp_fetch_comments_page',
  'order by c.created_at desc, c.id desc',
  "(c.created_at, c.id) < (p_before_created_at, coalesce(p_before_id, ''))",
  'grant select on public.tlp_ratings_public, public.tlp_comments_public, public.tlp_community_targets_public',
  'grant execute on function public.tlp_fetch_comments_page',
]) {
  expect(files.schema.includes(marker), `community schema lost additive W3 marker: ${marker}`);
}
expect(files.packageJson.includes('validate:community-scaling'), 'package scripts must expose the W3 validator');

const requests: Array<{ url: string; method: string; body: string }> = [];
let fallbackMode = false;
globalThis.fetch = async (input, init) => {
  const url = String(input);
  const method = init?.method ?? 'GET';
  requests.push({ url, method, body: String(init?.body ?? '') });

  if (url.includes('/rest/v1/tlp_community_targets_public')) {
    if (fallbackMode) return new Response(null, { status: 404 });
    return new Response(JSON.stringify([
      { target_type: 'poet', target_id: 'alexander-pushkin', rating_count: 8, comment_count: 3, overall: 4.5, dimensions: { language: 4.7 }, distribution: { 1: 0, 2: 0, 3: 1, 4: 2, 5: 5 }, deviation: 0.4 },
      { target_type: 'poet', target_id: 'sergei-yesenin', rating_count: 5, comment_count: 2, overall: 4.2, dimensions: { language: 4.4 }, distribution: { 1: 0, 2: 0, 3: 1, 4: 2, 5: 2 }, deviation: 0.6 },
    ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.includes('/rest/v1/rpc/tlp_fetch_comments_page')) {
    if (fallbackMode) return new Response(null, { status: 404 });
    return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.includes('/rest/v1/tlp_ratings_public')) {
    return new Response(JSON.stringify([
      { id: 'rating-1-device', target_type: 'poet', target_id: 'alexander-pushkin', scores: { language: 5 }, created_at: '2026-08-05T12:00:00Z' },
    ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.includes('/rest/v1/tlp_comments_public')) {
    return new Response(JSON.stringify([
      { id: 'comment-1-device', target_type: 'poet', target_id: 'alexander-pushkin', author: 'A', text: 'Достаточно длинный fallback комментарий.', kind: 'literary', helpful: 0, created_at: '2026-08-05T12:00:00Z' },
    ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  return new Response(null, { status: 404 });
};

const leaderboard = await import('../src/utils/communityLeaderboardStore');
await leaderboard.refreshCommunityLeaderboard();
const board = leaderboard.getCommunityLeaderboardSnapshot();
expect(board.rows.length === 2 && board.phase === 'online', 'leaderboard must publish aggregate rows only');
const leaderboardRequests = requests.filter((request) => request.url.includes('tlp_community_targets_public'));
expect(leaderboardRequests.length === 1, 'leaderboard must use one bounded aggregate request');
expect(leaderboardRequests[0]?.url.includes('target_type=eq.poet'), 'leaderboard request must filter the target type');
expect(!requests.some((request) => request.url.includes('tlp_comments_public')), 'leaderboard must never request comment bodies');
expect(!requests.some((request) => request.url.includes('tlp_ratings_public')), 'leaderboard must never request raw ratings');

fallbackMode = true;
requests.length = 0;
const remote = await import('../src/utils/communityRemote');
const fallback = await remote.fetchTargetRemote('poet', 'alexander-pushkin');
expect(fallback?.source === 'target-fallback', 'missing aggregate infrastructure must activate bounded target-only fallback');
expect(requests.some((request) => request.url.includes('tlp_ratings_public') && request.url.includes('target_type=eq.poet') && request.url.includes('target_id=eq.alexander-pushkin') && request.url.includes('limit=500')), 'rating fallback must be filtered and bounded');
expect(requests.some((request) => request.url.includes('tlp_comments_public') && request.url.includes('target_type=eq.poet') && request.url.includes('target_id=eq.alexander-pushkin') && request.url.includes('limit=11')), 'comment fallback must be filtered and bounded');
expect(!requests.some((request) => /tlp_(ratings|comments)_public\?select=\*&order=/.test(request.url)), 'fallback must never issue an unfiltered corpus request');

for (const failure of failures) console.error(`ERROR community-scaling: ${failure}`);
console.log(`Community scaling contract: ${failures.length} error(s), aggregate requests=${leaderboardRequests.length}, fallback requests=${requests.length}`);
if (failures.length) process.exit(1);
