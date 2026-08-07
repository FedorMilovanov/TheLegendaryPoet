export const FAVORITES_STORAGE_KEY = 'tlp-my-archive:v4';
export const FAVORITES_CHANGE_EVENT = 'tlp:archive-change';
export const FAVORITES_V3_STORAGE_KEY = 'tlp-my-archive:v3';
export const LEGACY_FAVORITES_STORAGE_KEY = 'tlp-my-archive-favorites-v2';

const POEM_ID = /^[a-z0-9][a-z0-9-]{1,159}$/i;
const WRITER_ID = /^[a-z0-9][a-z0-9:._-]{7,127}$/i;
const GENERATION = /^[1-9][0-9]{0,47}$/;

export interface FavoritePoem {
  id: string;
  addedAt: number;
}

export interface FavoriteArchiveOperation {
  id: string;
  favorite: boolean;
  addedAt: number;
  generation: string;
  writerId: string;
}

export type ArchiveMutationStatus = 'added' | 'removed' | 'unchanged' | 'failed' | 'invalid';

export interface ArchiveMutationResult {
  status: ArchiveMutationStatus;
  favorite: boolean;
}

interface FavoriteArchiveSnapshot {
  version: 4;
  operations: FavoriteArchiveOperation[];
  updatedAt: number;
}

interface PreviousFavoriteArchiveSnapshot {
  version: 3;
  items: FavoritePoem[];
  updatedAt: number;
}

function createWriterId() {
  try {
    if (typeof globalThis.crypto?.randomUUID === 'function') return `tab:${globalThis.crypto.randomUUID()}`;
  } catch {
    // Restricted runtimes fall through to a process-local nonce.
  }
  return `tab:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 14)}`;
}

const LOCAL_WRITER_ID = createWriterId();

function getStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function sanitizeLegacyAddedAt(value: unknown) {
  const addedAt = Number(value);
  return Number.isFinite(addedAt) && addedAt > 0 ? Math.min(addedAt, Date.now()) : 0;
}

function sanitizeOperationAddedAt(value: unknown) {
  const addedAt = Number(value);
  return Number.isSafeInteger(addedAt) && addedAt > 0 ? addedAt : 0;
}

function sanitizeFavorite(value: unknown): FavoritePoem | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<FavoritePoem>;
  if (typeof candidate.id !== 'string' || !POEM_ID.test(candidate.id)) return null;
  return { id: candidate.id, addedAt: sanitizeLegacyAddedAt(candidate.addedAt) };
}

function sanitizeItems(value: unknown) {
  if (!Array.isArray(value)) return [];
  const byId = new Map<string, FavoritePoem>();
  for (const entry of value) {
    const favorite = sanitizeFavorite(entry);
    if (!favorite) continue;
    const existing = byId.get(favorite.id);
    if (!existing || favorite.addedAt >= existing.addedAt) byId.set(favorite.id, favorite);
  }
  return [...byId.values()];
}

function sanitizeGeneration(value: unknown) {
  if (typeof value !== 'string' || !GENERATION.test(value)) return null;
  return value;
}

function compareGeneration(left: string, right: string) {
  if (left.length !== right.length) return left.length - right.length;
  return left === right ? 0 : left < right ? -1 : 1;
}

function incrementGeneration(value: string | null) {
  if (!value) return '1';
  const digits = value.split('');
  let carry = 1;
  for (let index = digits.length - 1; index >= 0 && carry; index -= 1) {
    const next = Number(digits[index]) + carry;
    digits[index] = String(next % 10);
    carry = next >= 10 ? 1 : 0;
  }
  if (carry) digits.unshift('1');
  const result = digits.join('');
  return GENERATION.test(result) ? result : null;
}

function sanitizeOperation(value: unknown): FavoriteArchiveOperation | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<FavoriteArchiveOperation>;
  const generation = sanitizeGeneration(candidate.generation);
  if (
    typeof candidate.id !== 'string'
    || !POEM_ID.test(candidate.id)
    || typeof candidate.favorite !== 'boolean'
    || !generation
    || typeof candidate.writerId !== 'string'
    || !WRITER_ID.test(candidate.writerId)
  ) return null;

  return {
    id: candidate.id,
    favorite: candidate.favorite,
    addedAt: candidate.favorite ? sanitizeOperationAddedAt(candidate.addedAt) : 0,
    generation,
    writerId: candidate.writerId,
  };
}

export function compareFavoriteArchiveOperations(
  left: FavoriteArchiveOperation,
  right: FavoriteArchiveOperation,
) {
  const generationOrder = compareGeneration(left.generation, right.generation);
  if (generationOrder) return generationOrder;
  if (left.favorite !== right.favorite) return left.favorite ? -1 : 1;
  const writerOrder = left.writerId.localeCompare(right.writerId);
  if (writerOrder) return writerOrder;
  return left.addedAt - right.addedAt;
}

export function mergeFavoriteArchiveOperations(
  ...operationSets: ReadonlyArray<readonly FavoriteArchiveOperation[]>
) {
  const byId = new Map<string, FavoriteArchiveOperation>();
  for (const operationSet of operationSets) {
    for (const rawOperation of operationSet) {
      const operation = sanitizeOperation(rawOperation);
      if (!operation) continue;
      const existing = byId.get(operation.id);
      if (!existing || compareFavoriteArchiveOperations(operation, existing) > 0) {
        byId.set(operation.id, operation);
      }
    }
  }
  return [...byId.values()].sort((left, right) => left.id.localeCompare(right.id));
}

export function createFavoriteArchiveOperation(
  poemId: string,
  favorite: boolean,
  previous: FavoriteArchiveOperation | null,
  writerId: string,
  now = Date.now(),
): FavoriteArchiveOperation | null {
  if (!POEM_ID.test(poemId) || !WRITER_ID.test(writerId)) return null;
  const generation = incrementGeneration(previous?.generation ?? null);
  if (!generation) return null;
  return {
    id: poemId,
    favorite,
    addedAt: favorite ? sanitizeOperationAddedAt(now) : 0,
    generation,
    writerId,
  };
}

function sanitizeSnapshot(value: unknown): FavoriteArchiveSnapshot | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<FavoriteArchiveSnapshot>;
  if (candidate.version !== 4 || !Array.isArray(candidate.operations)) return null;
  const updatedAt = Number(candidate.updatedAt);
  return {
    version: 4,
    operations: mergeFavoriteArchiveOperations(candidate.operations),
    updatedAt: Number.isFinite(updatedAt) && updatedAt > 0 ? Math.min(updatedAt, Date.now()) : Date.now(),
  };
}

function parseSnapshotRaw(raw: string | null | undefined) {
  if (!raw) return null;
  try {
    return sanitizeSnapshot(JSON.parse(raw));
  } catch {
    return null;
  }
}

function snapshotFingerprint(snapshot: FavoriteArchiveSnapshot) {
  return JSON.stringify({ version: 4, operations: snapshot.operations });
}

function mergeSnapshots(...snapshots: Array<FavoriteArchiveSnapshot | null | undefined>): FavoriteArchiveSnapshot {
  return {
    version: 4,
    operations: mergeFavoriteArchiveOperations(
      ...snapshots.filter((snapshot): snapshot is FavoriteArchiveSnapshot => Boolean(snapshot))
        .map((snapshot) => snapshot.operations),
    ),
    updatedAt: Date.now(),
  };
}

function notifyArchiveChanged() {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  try { window.dispatchEvent(new Event(FAVORITES_CHANGE_EVENT)); } catch { /* restricted environment */ }
}

function writeSnapshot(snapshot: FavoriteArchiveSnapshot, notify = true) {
  const storage = getStorage();
  if (!storage) return false;
  const sanitized = sanitizeSnapshot({ ...snapshot, version: 4, updatedAt: Date.now() });
  if (!sanitized) return false;
  try {
    storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(sanitized));
    if (notify) notifyArchiveChanged();
    return true;
  } catch {
    return false;
  }
}

function snapshotFromItems(items: readonly FavoritePoem[], writerId: string): FavoriteArchiveSnapshot {
  const operations = items
    .map((favorite) => createFavoriteArchiveOperation(favorite.id, true, null, writerId, favorite.addedAt))
    .filter((operation): operation is FavoriteArchiveOperation => Boolean(operation));
  return { version: 4, operations, updatedAt: Date.now() };
}

function readPreviousSnapshot(storage: Storage): PreviousFavoriteArchiveSnapshot | null {
  try {
    const raw = storage.getItem(FAVORITES_V3_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<PreviousFavoriteArchiveSnapshot>;
    if (!value || value.version !== 3) return null;
    return {
      version: 3,
      items: sanitizeItems(value.items),
      updatedAt: sanitizeLegacyAddedAt(value.updatedAt) || Date.now(),
    };
  } catch {
    return null;
  }
}

function readLegacyItems(storage: Storage) {
  try {
    return sanitizeItems(JSON.parse(storage.getItem(LEGACY_FAVORITES_STORAGE_KEY) ?? '[]'));
  } catch {
    return [];
  }
}

function migrateLegacy(storage: Storage) {
  const previous = readPreviousSnapshot(storage);
  const items = previous?.items ?? readLegacyItems(storage);
  const writerId = previous ? 'migration-v3' : 'migration-v2';
  const snapshot = snapshotFromItems(items, writerId);
  if (writeSnapshot(snapshot, false)) {
    try { storage.removeItem(FAVORITES_V3_STORAGE_KEY); } catch { /* storage became unavailable */ }
    try { storage.removeItem(LEGACY_FAVORITES_STORAGE_KEY); } catch { /* storage became unavailable */ }
  }
  return snapshot;
}

function readSnapshot(): FavoriteArchiveSnapshot {
  const storage = getStorage();
  if (!storage) return { version: 4, operations: [], updatedAt: Date.now() };
  const current = parseSnapshotRaw(storage.getItem(FAVORITES_STORAGE_KEY));
  if (current) return current;
  return migrateLegacy(storage);
}

function activeFavorites(snapshot: FavoriteArchiveSnapshot) {
  const now = Date.now();
  return snapshot.operations
    .filter((operation) => operation.favorite)
    .map((operation) => ({ id: operation.id, addedAt: Math.min(operation.addedAt, now) }))
    .sort((left, right) => left.addedAt - right.addedAt || left.id.localeCompare(right.id));
}

function currentOperation(snapshot: FavoriteArchiveSnapshot, poemId: string) {
  return snapshot.operations.find((operation) => operation.id === poemId) ?? null;
}

function repairStorageEvent(event: StorageEvent) {
  if (event.key !== FAVORITES_STORAGE_KEY) return false;
  const storage = getStorage();
  if (!storage) return false;
  const current = parseSnapshotRaw(storage.getItem(FAVORITES_STORAGE_KEY));
  const previousPhysical = parseSnapshotRaw(event.oldValue);
  const incomingPhysical = parseSnapshotRaw(event.newValue);
  const candidates = [current, previousPhysical, incomingPhysical].filter(Boolean);
  if (!candidates.length) return false;
  const merged = mergeSnapshots(current, previousPhysical, incomingPhysical);
  if (current && snapshotFingerprint(current) === snapshotFingerprint(merged)) return false;
  return writeSnapshot(merged, false);
}

export function getFavoritePoems(): FavoritePoem[] {
  return activeFavorites(readSnapshot()).map((favorite) => ({ ...favorite }));
}

export function isFavoritePoem(poemId: string): boolean {
  if (!POEM_ID.test(poemId)) return false;
  return currentOperation(readSnapshot(), poemId)?.favorite === true;
}

export function removeFavoritePoem(poemId: string): ArchiveMutationResult {
  if (!POEM_ID.test(poemId)) return { status: 'invalid', favorite: false };
  const snapshot = readSnapshot();
  const previous = currentOperation(snapshot, poemId);
  if (!previous?.favorite) return { status: 'unchanged', favorite: false };
  const operation = createFavoriteArchiveOperation(poemId, false, previous, LOCAL_WRITER_ID);
  if (!operation) return { status: 'failed', favorite: true };
  const next = { ...snapshot, operations: mergeFavoriteArchiveOperations(snapshot.operations, [operation]) };
  if (!writeSnapshot(next)) return { status: 'failed', favorite: true };
  return { status: 'removed', favorite: false };
}

export function toggleFavoritePoem(poemId: string): ArchiveMutationResult {
  if (!POEM_ID.test(poemId)) return { status: 'invalid', favorite: false };
  const snapshot = readSnapshot();
  const previous = currentOperation(snapshot, poemId);
  const existing = previous?.favorite === true;
  const operation = createFavoriteArchiveOperation(poemId, !existing, previous, LOCAL_WRITER_ID);
  if (!operation) return { status: 'failed', favorite: existing };
  const next = { ...snapshot, operations: mergeFavoriteArchiveOperations(snapshot.operations, [operation]) };
  if (!writeSnapshot(next)) return { status: 'failed', favorite: existing };
  return existing
    ? { status: 'removed', favorite: false }
    : { status: 'added', favorite: true };
}

export function reconcileFavoritePoems(validPoemIds: Iterable<string>) {
  const validIds = new Set([...validPoemIds].filter((id) => POEM_ID.test(id)));
  const snapshot = readSnapshot();
  let operations = snapshot.operations;
  let changed = false;

  for (const operation of snapshot.operations) {
    if (!operation.favorite || validIds.has(operation.id)) continue;
    const removal = createFavoriteArchiveOperation(operation.id, false, operation, LOCAL_WRITER_ID);
    if (!removal) continue;
    operations = mergeFavoriteArchiveOperations(operations, [removal]);
    changed = true;
  }

  if (!changed) return activeFavorites(snapshot).map((favorite) => ({ ...favorite }));
  const next = { ...snapshot, operations };
  if (!writeSnapshot(next)) return activeFavorites(snapshot).map((favorite) => ({ ...favorite }));
  return activeFavorites(next).map((favorite) => ({ ...favorite }));
}

export function subscribeFavoritePoems(listener: () => void) {
  if (typeof window === 'undefined') return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (event.key === FAVORITES_STORAGE_KEY) {
      repairStorageEvent(event);
      listener();
      return;
    }
    if (event.key === FAVORITES_V3_STORAGE_KEY || event.key === LEGACY_FAVORITES_STORAGE_KEY) listener();
  };
  window.addEventListener(FAVORITES_CHANGE_EVENT, listener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(FAVORITES_CHANGE_EVENT, listener);
    window.removeEventListener('storage', onStorage);
  };
}
