import {
  FAVORITES_CHANGE_EVENT,
  FAVORITES_STORAGE_KEY,
  getFavoritePoems,
  isFavoritePoem,
  reconcileFavoritePoems,
  removeFavoritePoem,
  subscribeFavoritePoems,
  toggleFavoritePoem,
} from '../src/utils/myArchiveStore';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  failWrites = false;

  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) {
    if (this.failWrites) throw new Error('simulated storage quota failure');
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

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: testWindow,
});

const failures: string[] = [];
const expect = (condition: unknown, message: string) => {
  if (!condition) failures.push(message);
};

storage.clear();
const fresh = getFavoritePoems();
expect(fresh.length === 0, 'fresh archives must start empty');
expect(storage.getItem(FAVORITES_STORAGE_KEY) !== null, 'fresh archives must persist the validated v3 snapshot');

storage.clear();
const futureTimestamp = Date.now() + 86_400_000;
storage.setItem('tlp-my-archive-favorites-v2', JSON.stringify([
  { id: 'yesenin-1', addedAt: 10 },
  { id: 'yesenin-1', addedAt: 20 },
  { id: 'pushkin-1', addedAt: futureTimestamp },
  { id: 'bad id', addedAt: 30 },
  { id: 15, addedAt: 40 },
]));
const migrated = getFavoritePoems();
expect(migrated.length === 2, 'legacy migration must sanitize and deduplicate favorites');
expect(migrated.find((favorite) => favorite.id === 'yesenin-1')?.addedAt === 20, 'duplicate legacy favorites must retain the newest timestamp');
expect((migrated.find((favorite) => favorite.id === 'pushkin-1')?.addedAt ?? Infinity) <= Date.now(), 'future timestamps must be clamped to the current time');
expect(storage.getItem('tlp-my-archive-favorites-v2') === null, 'legacy storage must be removed only after successful v3 persistence');
expect(isFavoritePoem('yesenin-1'), 'migrated favorites must be discoverable');
expect(!isFavoritePoem('bad id'), 'invalid ids must never be treated as favorites');

let notifications = 0;
const unsubscribe = subscribeFavoritePoems(() => { notifications += 1; });
const added = toggleFavoritePoem('blok-1');
expect(added && isFavoritePoem('blok-1'), 'toggle must add a valid missing favorite');
expect(notifications === 1, 'same-tab writes must notify archive subscribers once');
testWindow.dispatchEvent({ type: 'storage', key: FAVORITES_STORAGE_KEY } as unknown as StorageEvent);
expect(notifications === 2, 'matching storage events must notify cross-tab subscribers');
testWindow.dispatchEvent({ type: 'storage', key: 'unrelated-key' } as unknown as StorageEvent);
expect(notifications === 2, 'unrelated storage events must be ignored');
const removedByToggle = toggleFavoritePoem('blok-1');
expect(!removedByToggle && !isFavoritePoem('blok-1'), 'toggle must remove an existing favorite');
expect(notifications === 3, 'same-tab removals must notify archive subscribers once');
unsubscribe();
toggleFavoritePoem('blok-2');
expect(notifications === 3, 'unsubscribed listeners must not receive later writes');
expect((listeners.get(FAVORITES_CHANGE_EVENT)?.size ?? 0) === 0, 'unsubscribe must release the custom-event listener');
expect((listeners.get('storage')?.size ?? 0) === 0, 'unsubscribe must release the storage-event listener');

expect(!toggleFavoritePoem('invalid favorite id'), 'invalid ids must be rejected without changing the archive');
expect(!removeFavoritePoem('not-present'), 'removing an unknown favorite must report no change');
expect(removeFavoritePoem('blok-2'), 'explicit removal must persist an existing favorite');
expect(!isFavoritePoem('blok-2'), 'explicit removal must update subsequent reads');

toggleFavoritePoem('kept-on-write-failure');
storage.failWrites = true;
expect(!toggleFavoritePoem('new-on-write-failure'), 'a failed add must return the actual unchanged false state');
expect(!isFavoritePoem('new-on-write-failure'), 'a failed add must not appear in subsequent reads');
expect(toggleFavoritePoem('kept-on-write-failure'), 'a failed removal must return the actual unchanged true state');
expect(isFavoritePoem('kept-on-write-failure'), 'a failed removal must leave the stored favorite intact');
expect(!removeFavoritePoem('kept-on-write-failure'), 'explicit removal must report failure when storage rejects the write');
storage.failWrites = false;
expect(removeFavoritePoem('kept-on-write-failure'), 'the same removal must succeed after storage recovers');

for (const id of ['yesenin-2', 'pushkin-2', 'removed-poem']) toggleFavoritePoem(id);
const reconciled = reconcileFavoritePoems(['yesenin-1', 'yesenin-2', 'pushkin-2']);
expect(reconciled.every((favorite) => ['yesenin-1', 'yesenin-2', 'pushkin-2'].includes(favorite.id)), 'reconciliation must prune poems removed from the library');
expect(!isFavoritePoem('removed-poem'), 'pruned poem ids must disappear from persistent storage');

const leakedCopy = getFavoritePoems();
leakedCopy.push({ id: 'mutated-outside-store', addedAt: Date.now() });
expect(!isFavoritePoem('mutated-outside-store'), 'returned favorite arrays must not expose mutable internal state');

storage.setItem(FAVORITES_STORAGE_KEY, '{broken json');
const recovered = getFavoritePoems();
expect(Array.isArray(recovered), 'corrupt archive JSON must recover without throwing');
expect(storage.getItem(FAVORITES_STORAGE_KEY)?.startsWith('{') === true, 'corrupt archive JSON must be replaced with a valid snapshot');

for (const failure of failures) console.error(`ERROR personal-archive: ${failure}`);
console.log(`Personal archive validation: ${failures.length} error(s)`);
if (failures.length) process.exit(1);
