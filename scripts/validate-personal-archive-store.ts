import {
  FAVORITES_CHANGE_EVENT,
  FAVORITES_STORAGE_KEY,
  FAVORITES_V3_STORAGE_KEY,
  LEGACY_FAVORITES_STORAGE_KEY,
  compareFavoriteArchiveOperations,
  createFavoriteArchiveOperation,
  getFavoritePoems,
  isFavoritePoem,
  mergeFavoriteArchiveOperations,
  reconcileFavoritePoems,
  removeFavoritePoem,
  subscribeFavoritePoems,
  toggleFavoritePoem,
  type FavoriteArchiveOperation,
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

Object.defineProperty(globalThis, 'window', { configurable: true, value: testWindow });

const failures: string[] = [];
const expect = (condition: unknown, message: string) => {
  if (!condition) failures.push(message);
};
const writerA = 'writer:archive-a';
const writerB = 'writer:archive-b';

function snapshotRaw(operations: FavoriteArchiveOperation[]) {
  return JSON.stringify({ version: 4, operations, updatedAt: Date.now() });
}

function dispatchStorage(oldValue: string | null, newValue: string | null) {
  testWindow.dispatchEvent({
    type: 'storage',
    key: FAVORITES_STORAGE_KEY,
    oldValue,
    newValue,
  } as unknown as StorageEvent);
}

storage.clear();
const fresh = getFavoritePoems();
expect(fresh.length === 0, 'fresh archives must start empty');
expect(storage.getItem(FAVORITES_STORAGE_KEY) !== null, 'fresh archives must persist the validated v4 operation snapshot');

storage.clear();
const futureTimestamp = Date.now() + 86_400_000;
storage.setItem(FAVORITES_V3_STORAGE_KEY, JSON.stringify({
  version: 3,
  updatedAt: Date.now(),
  items: [
    { id: 'yesenin-1', addedAt: 10 },
    { id: 'yesenin-1', addedAt: 20 },
    { id: 'pushkin-1', addedAt: futureTimestamp },
    { id: 'bad id', addedAt: 30 },
    { id: 15, addedAt: 40 },
  ],
}));
const migratedV3 = getFavoritePoems();
expect(migratedV3.length === 2, 'v3 migration must sanitize and deduplicate favorites');
expect(migratedV3.find((favorite) => favorite.id === 'yesenin-1')?.addedAt === 20, 'v3 duplicate favorites must retain the newest timestamp');
expect((migratedV3.find((favorite) => favorite.id === 'pushkin-1')?.addedAt ?? Infinity) <= Date.now(), 'v3 future timestamps must be clamped');
expect(storage.getItem(FAVORITES_STORAGE_KEY) !== null, 'v3 migration must persist v4 before retirement');
expect(storage.getItem(FAVORITES_V3_STORAGE_KEY) === null, 'v3 key must retire only after successful v4 persistence');
expect(isFavoritePoem('yesenin-1'), 'v3 migrated favorites must remain discoverable');

storage.clear();
storage.setItem(LEGACY_FAVORITES_STORAGE_KEY, JSON.stringify([
  { id: 'blok-legacy', addedAt: 25 },
  { id: 'bad legacy id', addedAt: 30 },
]));
const migratedV2 = getFavoritePoems();
expect(migratedV2.length === 1 && migratedV2[0]?.id === 'blok-legacy', 'v2 array migration must remain lossless and sanitized');
expect(storage.getItem(LEGACY_FAVORITES_STORAGE_KEY) === null, 'v2 key must retire only after successful v4 persistence');

const addA = createFavoriteArchiveOperation('race-poem-a', true, null, writerA, 100);
const addB = createFavoriteArchiveOperation('race-poem-b', true, null, writerB, 200);
expect(Boolean(addA && addB), 'deterministic race operations must be constructible');
if (addA && addB) {
  const mergedAB = mergeFavoriteArchiveOperations([addA], [addB]);
  const mergedBA = mergeFavoriteArchiveOperations([addB], [addA]);
  expect(mergedAB.length === 2 && mergedBA.length === 2, 'concurrent distinct adds must converge to both poem ids');
  expect(JSON.stringify(mergedAB) === JSON.stringify(mergedBA), 'distinct-add convergence must be independent of delivery order');
  expect(JSON.stringify(mergeFavoriteArchiveOperations(mergedAB, mergedAB)) === JSON.stringify(mergedAB), 'duplicate operation delivery must be idempotent');
}

const baseAdd = createFavoriteArchiveOperation('conflict-poem', true, null, writerA, 300);
const concurrentRemove = baseAdd && createFavoriteArchiveOperation('conflict-poem', false, baseAdd, writerA, 400);
const concurrentAdd = baseAdd && createFavoriteArchiveOperation('conflict-poem', true, baseAdd, writerB, 500);
expect(Boolean(baseAdd && concurrentRemove && concurrentAdd), 'same-id conflict operations must be constructible');
if (baseAdd && concurrentRemove && concurrentAdd) {
  expect(compareFavoriteArchiveOperations(concurrentRemove, concurrentAdd) > 0, 'remove must win an equal-generation concurrent add/remove conflict');
  const winner = mergeFavoriteArchiveOperations([concurrentAdd], [concurrentRemove])[0];
  expect(winner?.favorite === false, 'concurrent add/remove merge must deterministically retain the removal');
  const staleResurrection = mergeFavoriteArchiveOperations([concurrentRemove], [baseAdd])[0];
  expect(staleResurrection?.favorite === false, 'a stale older add snapshot must not resurrect a newer removal');
  const laterAdd = createFavoriteArchiveOperation('conflict-poem', true, concurrentRemove, writerB, 600);
  expect(Boolean(laterAdd) && compareFavoriteArchiveOperations(laterAdd as FavoriteArchiveOperation, concurrentRemove) > 0, 'an intentional re-add after observing removal must advance generation and succeed');
}

storage.clear();
storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify({
  version: 4,
  updatedAt: Date.now(),
  operations: [
    { id: 'valid-future', favorite: true, addedAt: futureTimestamp, generation: '1', writerId: writerA },
    { id: 'poison-generation', favorite: true, addedAt: 10, generation: '9'.repeat(49), writerId: writerA },
    { id: 'poison-writer', favorite: true, addedAt: 10, generation: '999999999999', writerId: 'x' },
    { id: 'bad id', favorite: true, addedAt: 10, generation: '999999999999', writerId: writerA },
  ],
}));
const sanitizedOrdering = getFavoritePoems();
expect(sanitizedOrdering.length === 1 && sanitizedOrdering[0]?.id === 'valid-future', 'malformed generation/writer/id metadata must be discarded');
expect((sanitizedOrdering[0]?.addedAt ?? Infinity) <= Date.now(), 'future addedAt metadata must be clamped and cannot order operations');

storage.clear();
let notifications = 0;
const unsubscribe = subscribeFavoritePoems(() => { notifications += 1; });
const added = toggleFavoritePoem('blok-1');
expect(added.status === 'added' && added.favorite && isFavoritePoem('blok-1'), 'toggle must report and persist an added favorite');
expect(notifications === 1, 'same-tab writes must notify archive subscribers once');
const currentRaw = storage.getItem(FAVORITES_STORAGE_KEY);
dispatchStorage(currentRaw, currentRaw);
expect(notifications === 2, 'matching storage events must notify cross-tab subscribers');
testWindow.dispatchEvent({ type: 'storage', key: 'unrelated-key' } as unknown as StorageEvent);
expect(notifications === 2, 'unrelated storage events must be ignored');
const removedByToggle = toggleFavoritePoem('blok-1');
expect(removedByToggle.status === 'removed' && !removedByToggle.favorite && !isFavoritePoem('blok-1'), 'toggle must report and persist removal of an existing favorite');
expect(notifications === 3, 'same-tab removals must notify archive subscribers once');
unsubscribe();
toggleFavoritePoem('blok-2');
expect(notifications === 3, 'unsubscribed listeners must not receive later writes');
expect((listeners.get(FAVORITES_CHANGE_EVENT)?.size ?? 0) === 0, 'unsubscribe must release the custom-event listener');
expect((listeners.get('storage')?.size ?? 0) === 0, 'unsubscribe must release the storage-event listener');

storage.clear();
let raceNotifications = 0;
const stopRaceRepair = subscribeFavoritePoems(() => { raceNotifications += 1; });
if (addA && addB) {
  const rawA = snapshotRaw([addA]);
  const rawB = snapshotRaw([addB]);
  storage.setItem(FAVORITES_STORAGE_KEY, rawA);
  storage.setItem(FAVORITES_STORAGE_KEY, rawB);
  dispatchStorage(rawA, rawB);
  const recoveredRace = getFavoritePoems().map((favorite) => favorite.id).sort();
  expect(JSON.stringify(recoveredRace) === JSON.stringify(['race-poem-a', 'race-poem-b']), 'storage-event repair must recover the distinct add overwritten by stale physical last-writer-wins');
  expect(raceNotifications === 1, 'one delivered physical overwrite must produce one subscriber notification');
}

if (baseAdd && concurrentRemove) {
  const rawRemoved = snapshotRaw([concurrentRemove]);
  const rawStaleAdd = snapshotRaw([baseAdd]);
  storage.setItem(FAVORITES_STORAGE_KEY, rawStaleAdd);
  dispatchStorage(rawRemoved, rawStaleAdd);
  expect(!isFavoritePoem('conflict-poem'), 'storage-event repair must restore a newer removal after a stale add physically overwrites it');
}
stopRaceRepair();

const invalid = toggleFavoritePoem('invalid favorite id');
expect(invalid.status === 'invalid' && !invalid.favorite, 'invalid ids must be explicitly rejected without changing the archive');
const invalidRemoval = removeFavoritePoem('invalid favorite id');
expect(invalidRemoval.status === 'invalid' && !invalidRemoval.favorite, 'invalid explicit removals must be rejected without changing the archive');
const unknownRemoval = removeFavoritePoem('not-present');
expect(unknownRemoval.status === 'unchanged' && !unknownRemoval.favorite, 'removing an unknown favorite must report unchanged false state');

toggleFavoritePoem('kept-on-write-failure');
storage.failWrites = true;
const failedAdd = toggleFavoritePoem('new-on-write-failure');
expect(failedAdd.status === 'failed' && !failedAdd.favorite, 'a failed add must report the unchanged false state');
expect(!isFavoritePoem('new-on-write-failure'), 'a failed add must not appear in subsequent reads');
const failedRemoval = toggleFavoritePoem('kept-on-write-failure');
expect(failedRemoval.status === 'failed' && failedRemoval.favorite, 'a failed removal must report the unchanged true state');
expect(isFavoritePoem('kept-on-write-failure'), 'a failed removal must leave the stored favorite intact');
const failedExplicitRemoval = removeFavoritePoem('kept-on-write-failure');
expect(failedExplicitRemoval.status === 'failed' && failedExplicitRemoval.favorite, 'explicit removal must preserve true state when storage rejects the write');
storage.failWrites = false;
const recoveredExplicitRemoval = removeFavoritePoem('kept-on-write-failure');
expect(recoveredExplicitRemoval.status === 'removed' && !recoveredExplicitRemoval.favorite, 'the same explicit removal must succeed after storage recovers');

for (const id of ['yesenin-2', 'pushkin-2', 'removed-poem']) {
  if (!isFavoritePoem(id)) toggleFavoritePoem(id);
}
const beforeReconcileRaw = storage.getItem(FAVORITES_STORAGE_KEY);
const reconciled = reconcileFavoritePoems(['yesenin-2', 'pushkin-2']);
expect(reconciled.every((favorite) => ['yesenin-2', 'pushkin-2'].includes(favorite.id)), 'reconciliation must prune poems removed from the library');
expect(!isFavoritePoem('removed-poem'), 'pruned poem ids must disappear from the active favorite view');
const afterReconcile = JSON.parse(storage.getItem(FAVORITES_STORAGE_KEY) ?? '{}') as { operations?: FavoriteArchiveOperation[] };
expect(afterReconcile.operations?.some((operation) => operation.id === 'removed-poem' && operation.favorite === false) === true, 'reconciliation must retain a tombstone so stale tabs cannot resurrect a removed-library poem');
expect(beforeReconcileRaw !== storage.getItem(FAVORITES_STORAGE_KEY), 'reconciliation must persist its tombstone state');

const leakedCopy = getFavoritePoems();
leakedCopy.push({ id: 'mutated-outside-store', addedAt: Date.now() });
expect(!isFavoritePoem('mutated-outside-store'), 'returned favorite arrays must not expose mutable internal state');

storage.setItem(FAVORITES_STORAGE_KEY, '{broken json');
const recovered = getFavoritePoems();
expect(Array.isArray(recovered), 'corrupt archive JSON must recover without throwing');
const recoveredRaw = storage.getItem(FAVORITES_STORAGE_KEY) ?? '';
expect(recoveredRaw.startsWith('{') && recoveredRaw.includes('"version":4'), 'corrupt archive JSON must be replaced with a valid v4 snapshot');

for (const failure of failures) console.error(`ERROR personal-archive: ${failure}`);
console.log(`Personal archive validation: ${failures.length} error(s), deterministic cross-tab convergence covered.`);
if (failures.length) process.exit(1);
