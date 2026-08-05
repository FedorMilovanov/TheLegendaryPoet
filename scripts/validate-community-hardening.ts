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
const testWindow = {
  localStorage: storage,
  addEventListener() {},
  removeEventListener() {},
};
Object.defineProperty(globalThis, 'window', { configurable: true, value: testWindow });
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { onLine: true } });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const voterId = '11111111-1111-4111-8111-111111111111';
const validCommentId = 'comment-22222222-2222-4222-8222-222222222222';
const now = new Date().toISOString();

storage.setItem('tlp-community-device-v1', 'not-a-uuid');
storage.setItem('tlp-community-feedback:v3', JSON.stringify({
  version: 3,
  localSnapshot: {
    ratings: [],
    comments: [{
      id: validCommentId,
      targetType: 'article',
      targetId: 'sergei-yesenin-1921-1925',
      author: 'Локальный автор',
      text: 'Валидная операция после повреждённой должна быть доставлена.',
      kind: 'history',
      helpful: 0,
      createdAt: now,
    }],
  },
  outbox: [
    {
      id: 'comment:wrong-id',
      kind: 'comment',
      voterId: 'broken-device',
      entry: {
        id: 'wrong-id',
        targetType: 'article',
        targetId: 'sergei-yesenin-1921-1925',
        author: 'Повреждено',
        text: 'Эта операция не соответствует backend-контракту.',
        kind: 'history',
        helpful: 0,
        createdAt: now,
      },
      createdAt: now,
      attempts: 999,
    },
    {
      id: `comment:${validCommentId}`,
      kind: 'comment',
      voterId,
      entry: {
        id: validCommentId,
        targetType: 'article',
        targetId: 'sergei-yesenin-1921-1925',
        author: 'Локальный автор',
        text: 'Валидная операция после повреждённой должна быть доставлена.',
        kind: 'history',
        helpful: 0,
        createdAt: now,
      },
      createdAt: now,
      attempts: 0,
    },
  ],
  cooldowns: {},
  helpfulVotes: {},
  ownRatings: {},
  updatedAt: now,
  lastSyncedAt: null,
}));

let postRequests = 0;
globalThis.fetch = async (_input, init) => {
  if ((init?.method ?? 'GET') === 'POST') postRequests += 1;
  return new Response(null, { status: 204 });
};

const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };

const identity = await import('../src/utils/communityIdentity');
const repairedDeviceId = identity.getCommunityDeviceId();
expect(UUID.test(repairedDeviceId), 'invalid persisted device id must be replaced with a UUID');
expect(storage.getItem('tlp-community-device-v1') === repairedDeviceId, 'repaired UUID must replace the invalid stored identity');

const store = await import('../src/utils/communityStore');
expect(store.getCommunitySyncSnapshot().pendingCount === 1, 'malformed persisted operation must be discarded before retry');
await store.flushCommunityOutbox();
expect(postRequests === 1, 'valid operation behind malformed state must still be delivered exactly once');
expect(store.getCommunitySyncSnapshot().pendingCount === 0, 'poison-safe outbox must reach zero');

const baseCount = 10;
const baseSum = 40;

const newScope = 'rating:poet:anna-akhmatova';
const newRatingId = 'rating-33333333-3333-4333-8333-333333333333';
expect(store.commitRatingFeedback({
  id: newRatingId,
  targetType: 'poet',
  targetId: 'anna-akhmatova',
  scores: { language: 5 },
  createdAt: new Date(Date.now() + 1).toISOString(),
}, newScope, voterId), 'first unsent rating must be accepted');
expect(store.commitRatingFeedback({
  id: newRatingId,
  targetType: 'poet',
  targetId: 'anna-akhmatova',
  scores: { language: 1 },
  createdAt: new Date(Date.now() + 2).toISOString(),
}, newScope, voterId), 'editing one unsent rating must replace its pending operation');

const newOverlay = store.getPendingTargetOverlay('poet', 'anna-akhmatova');
expect(newOverlay.ratings.length === 1, 'repeated unsent edits must retain one pending vote');
expect(newOverlay.ratings[0]?.previousScores === undefined, 'new unsent vote must preserve an undefined server baseline');
expect(newOverlay.ratings[0]?.entry.scores.language === 1, 'latest unsent score must win');
const newCount = baseCount + (newOverlay.ratings[0]?.previousScores ? 0 : 1);
const newSum = baseSum
  - (newOverlay.ratings[0]?.previousScores?.language ?? 0)
  + (newOverlay.ratings[0]?.entry.scores.language ?? 0);
expect(newCount === 11 && newSum === 41, 'new pending vote must increase count exactly once and add only the latest score');
await store.flushCommunityOutbox();

const syncedScope = 'rating:poet:alexander-pushkin';
const syncedRatingId = 'rating-44444444-4444-4444-8444-444444444444';
expect(store.rememberRating(syncedScope, {
  id: syncedRatingId,
  scores: { language: 5 },
  updatedAt: new Date(Date.now() - 1000).toISOString(),
}), 'synced own rating baseline must be stored');
expect(store.commitRatingFeedback({
  id: syncedRatingId,
  targetType: 'poet',
  targetId: 'alexander-pushkin',
  scores: { language: 4 },
  createdAt: new Date(Date.now() + 3).toISOString(),
}, syncedScope, voterId), 'first pending edit of synced rating must be accepted');
expect(store.commitRatingFeedback({
  id: syncedRatingId,
  targetType: 'poet',
  targetId: 'alexander-pushkin',
  scores: { language: 1 },
  createdAt: new Date(Date.now() + 4).toISOString(),
}, syncedScope, voterId), 'repeated pending edit of synced rating must be accepted');

const syncedOverlay = store.getPendingTargetOverlay('poet', 'alexander-pushkin');
expect(syncedOverlay.ratings.length === 1, 'synced rating edits must retain one operation');
expect(syncedOverlay.ratings[0]?.previousScores?.language === 5, 'repeated edits must retain the original server-side score');
expect(syncedOverlay.ratings[0]?.entry.scores.language === 1, 'latest synced edit must win');
const syncedCount = baseCount + (syncedOverlay.ratings[0]?.previousScores ? 0 : 1);
const syncedSum = baseSum
  - (syncedOverlay.ratings[0]?.previousScores?.language ?? 0)
  + (syncedOverlay.ratings[0]?.entry.scores.language ?? 0);
expect(syncedCount === 10 && syncedSum === 36, 'synced edit must keep count and replace the original server score exactly once');

const { readFileSync } = await import('node:fs');
const quickNav = readFileSync('src/components/poet-detail/PoemQuickNav.tsx', 'utf8');
const poemCard = readFileSync('src/components/poet-detail/PoemCard.tsx', 'utf8');
const panel = readFileSync('src/components/community/CommunityPanel.tsx', 'utf8');
expect(/mode:\s*'passive'/.test(quickNav), 'poem quick navigation must not start one summary request per row');
expect(/\bdeferRemote\b/.test(poemCard), 'poem cards must defer remote community reads');
expect(/data-community-activate-target/.test(panel), 'deferred panels need an explicit user activation boundary');

for (const failure of failures) console.error(`ERROR community-hardening: ${failure}`);
console.log(`Community hardening validation: ${failures.length} error(s), poison-safe queue, stable rating baselines, deferred poem reads.`);
if (failures.length) process.exit(1);
