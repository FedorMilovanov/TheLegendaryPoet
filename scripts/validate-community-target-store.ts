delete process.env.VITE_SUPABASE_URL;
delete process.env.VITE_SUPABASE_ANON_KEY;

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

const store = await import('../src/utils/communityStore');
const targets = await import('../src/utils/communityTargetStore');

const failures: string[] = [];
const expect = (condition: unknown, message: string) => {
  if (!condition) failures.push(message);
};

let pushkinNotifications = 0;
let yeseninNotifications = 0;
const stopPushkin = targets.subscribeFeedbackTarget('poet', 'alexander-pushkin', () => { pushkinNotifications += 1; });
const stopYesenin = targets.subscribeFeedbackTarget('poet', 'sergei-yesenin', () => { yeseninNotifications += 1; });

const pushkinBefore = targets.getFeedbackTargetSnapshot('poet', 'alexander-pushkin');
const yeseninBefore = targets.getFeedbackTargetSnapshot('poet', 'sergei-yesenin');
expect(pushkinBefore === targets.getFeedbackTargetSnapshot('poet', 'alexander-pushkin'), 'unchanged target snapshots must keep stable identity');

expect(store.commitRatingFeedback({
  id: 'rating-pushkin-target-test',
  targetType: 'poet',
  targetId: 'alexander-pushkin',
  scores: { language: 5, depth: 4 },
  createdAt: new Date().toISOString(),
}, 'rating:poet:alexander-pushkin', 'device-target-test'), 'target test rating must persist');

const pushkinAfterRating = targets.getFeedbackTargetSnapshot('poet', 'alexander-pushkin');
const yeseninAfterPushkinRating = targets.getFeedbackTargetSnapshot('poet', 'sergei-yesenin');
expect(pushkinNotifications === 1, 'a changed target must notify its subscribers once');
expect(yeseninNotifications === 0, 'an unrelated target must not notify its subscribers');
expect(pushkinAfterRating !== pushkinBefore && pushkinAfterRating.ratings.length === 1, 'changed target snapshots must update');
expect(yeseninAfterPushkinRating === yeseninBefore, 'unrelated target snapshot identity must remain stable');

expect(store.commitCommentFeedback({
  id: 'comment-yesenin-target-test',
  targetType: 'poet',
  targetId: 'sergei-yesenin',
  author: 'Тестовый читатель',
  text: 'Отдельный комментарий для проверки адресной подписки.',
  kind: 'literary',
  helpful: 0,
  createdAt: new Date().toISOString(),
}, 'comment:poet:sergei-yesenin', 'device-target-test'), 'target test comment must persist');

expect(pushkinNotifications === 1, 'a second unrelated mutation must not rerender the first target');
expect(yeseninNotifications === 1, 'the second target must receive its own mutation');
expect(targets.getFeedbackTargetSnapshot('poet', 'sergei-yesenin').comments.length === 1, 'target snapshots must expose matching comments');

stopPushkin();
stopYesenin();

for (const failure of failures) console.error(`ERROR community-target-store: ${failure}`);
console.log(`Community target store validation: ${failures.length} error(s)`);
if (failures.length) process.exit(1);
