export const AUDIO_SESSION_STORAGE_KEY = 'tlp-audio-session:v2';
export const AUDIO_SESSION_REGISTER_PREFIX = 'tlp-audio-session:v3:';
export const AUDIO_SESSION_LAST_TRACK_KEY = `${AUDIO_SESSION_REGISTER_PREFIX}last-track`;
export const AUDIO_SESSION_VOLUME_KEY = `${AUDIO_SESSION_REGISTER_PREFIX}volume`;
export const AUDIO_SESSION_POSITION_PREFIX = `${AUDIO_SESSION_REGISTER_PREFIX}position:`;
export const AUDIO_SESSION_COMPLETED_PREFIX = `${AUDIO_SESSION_REGISTER_PREFIX}completed:`;
export const AUDIO_COORDINATION_STORAGE_KEY = 'tlp-audio-coordination:v1';
export const AUDIO_COORDINATION_CHANNEL = 'tlp-audio-coordination:v1';

const AUDIO_SESSION_READY_KEY = `${AUDIO_SESSION_REGISTER_PREFIX}ready`;
const LEGACY_LAST_TRACK_KEY = 'tlp-audio-last-track';
const LEGACY_VOLUME_KEY = 'tlp-audio-volume';
const LEGACY_COMPLETED_KEY = 'tlp-audio-completed';
const LEGACY_POSITION_PREFIX = 'tlp-audio-position:';
const REGISTER_VERSION = 1;

export interface AudioSessionSnapshot {
  version: 2;
  lastTrackId: string | null;
  volume: number;
  muted: boolean;
  positions: Record<string, number>;
  completedTrackIds: string[];
  updatedAt: number;
}

interface AudioSessionRevision {
  counter: string;
  writerId: string;
  updatedAt: number;
}

interface AudioSessionRegister {
  version: 1;
  revision: AudioSessionRevision;
  value: unknown;
}

export interface AudioSessionReplica {
  read: () => AudioSessionSnapshot;
  writeSnapshot: (snapshot: AudioSessionSnapshot) => boolean;
  update: (mutator: (snapshot: AudioSessionSnapshot) => AudioSessionSnapshot | void) => AudioSessionSnapshot;
  reconcile: (trackIds: Iterable<string>) => AudioSessionSnapshot;
  getTrackPosition: (trackId: string) => number;
  setTrackPosition: (trackId: string, position: number | null) => void;
  setLastTrack: (trackId: string | null) => void;
  setVolume: (volume: number, muted: boolean) => void;
  setCompletedTracks: (trackIds: Iterable<string>) => void;
  acceptStorageEvent: (key: string | null, newValue: string | null) => boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function createDefaultSnapshot(now = Date.now()): AudioSessionSnapshot {
  return {
    version: 2,
    lastTrackId: null,
    volume: 0.9,
    muted: false,
    positions: {},
    completedTrackIds: [],
    updatedAt: now,
  };
}

function sanitizeTrackId(value: unknown) {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9-]{1,119}$/i.test(value) ? value : null;
}

function sanitizePositions(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const positions: Record<string, number> = {};
  for (const [rawId, rawPosition] of Object.entries(value)) {
    const id = sanitizeTrackId(rawId);
    const position = Number(rawPosition);
    if (id && Number.isFinite(position) && position >= 0) positions[id] = position;
  }
  return positions;
}

function sanitizeCompleted(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(sanitizeTrackId).filter((id): id is string => Boolean(id)))];
}

function sanitizeSnapshot(value: unknown, now = Date.now()): AudioSessionSnapshot | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<AudioSessionSnapshot>;
  if (candidate.version !== 2) return null;
  const numericVolume = Number(candidate.volume);
  const numericUpdatedAt = Number(candidate.updatedAt);
  return {
    version: 2,
    lastTrackId: sanitizeTrackId(candidate.lastTrackId),
    volume: Number.isFinite(numericVolume) ? clamp(numericVolume, 0, 1) : 0.9,
    muted: candidate.muted === true,
    positions: sanitizePositions(candidate.positions),
    completedTrackIds: sanitizeCompleted(candidate.completedTrackIds),
    updatedAt: Number.isFinite(numericUpdatedAt) && numericUpdatedAt > 0 ? numericUpdatedAt : now,
  };
}

function migrateLegacySnapshot(storage: Storage, now: () => number) {
  const snapshot = createDefaultSnapshot(now());
  snapshot.lastTrackId = sanitizeTrackId(storage.getItem(LEGACY_LAST_TRACK_KEY));

  const legacyVolumeRaw = storage.getItem(LEGACY_VOLUME_KEY);
  if (legacyVolumeRaw !== null) {
    const legacyVolume = Number(legacyVolumeRaw);
    if (Number.isFinite(legacyVolume)) snapshot.volume = clamp(legacyVolume, 0, 1);
  }
  snapshot.muted = snapshot.volume === 0;

  try {
    snapshot.completedTrackIds = sanitizeCompleted(JSON.parse(storage.getItem(LEGACY_COMPLETED_KEY) ?? '[]'));
  } catch {
    snapshot.completedTrackIds = [];
  }

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key?.startsWith(LEGACY_POSITION_PREFIX)) continue;
    const id = sanitizeTrackId(key.slice(LEGACY_POSITION_PREFIX.length));
    const position = Number(storage.getItem(key));
    if (id && Number.isFinite(position) && position >= 0) snapshot.positions[id] = position;
  }

  return snapshot;
}

function clearLegacySnapshot(storage: Storage) {
  const keysToRemove = [LEGACY_LAST_TRACK_KEY, LEGACY_VOLUME_KEY, LEGACY_COMPLETED_KEY];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(LEGACY_POSITION_PREFIX)) keysToRemove.push(key);
  }
  for (const key of keysToRemove) storage.removeItem(key);
}

function createWriterId() {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    // Deterministic ordering only needs a stable per-page id, not cryptographic identity.
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseRegister(raw: string | null): AudioSessionRegister | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const candidate = value as Partial<AudioSessionRegister>;
    const revision = candidate.revision as Partial<AudioSessionRevision> | undefined;
    if (candidate.version !== REGISTER_VERSION || !revision) return null;
    if (typeof revision.counter !== 'string' || !/^(?:0|[1-9]\d*)$/.test(revision.counter)) return null;
    if (typeof revision.writerId !== 'string' || revision.writerId.length < 1 || revision.writerId.length > 160) return null;
    const updatedAt = Number(revision.updatedAt);
    if (!Number.isFinite(updatedAt) || updatedAt <= 0) return null;
    return {
      version: REGISTER_VERSION,
      revision: {
        counter: revision.counter,
        writerId: revision.writerId,
        updatedAt,
      },
      value: candidate.value,
    };
  } catch {
    return null;
  }
}

function compareRegisters(left: AudioSessionRegister, right: AudioSessionRegister) {
  const leftCounter = BigInt(left.revision.counter);
  const rightCounter = BigInt(right.revision.counter);
  if (leftCounter !== rightCounter) return leftCounter > rightCounter ? 1 : -1;
  if (left.revision.writerId === right.revision.writerId) return 0;
  return left.revision.writerId > right.revision.writerId ? 1 : -1;
}

function isRegisterKey(key: string | null): key is string {
  return Boolean(key?.startsWith(AUDIO_SESSION_REGISTER_PREFIX) && key !== AUDIO_SESSION_READY_KEY);
}

function listStorageKeys(storage: Storage) {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key) keys.push(key);
  }
  return keys;
}

export function createAudioSessionReplica(
  storage: Storage | null,
  writerId = createWriterId(),
  now: () => number = () => Date.now(),
): AudioSessionReplica {
  let logicalClock = 0n;
  let migrating = false;
  const knownRegisters = new Map<string, AudioSessionRegister>();

  const observe = (register: AudioSessionRegister) => {
    const counter = BigInt(register.revision.counter);
    if (counter > logicalClock) logicalClock = counter;
  };

  const persistKnown = (key: string, register: AudioSessionRegister) => {
    if (!storage) return false;
    try {
      storage.setItem(key, JSON.stringify(register));
      return true;
    } catch {
      return false;
    }
  };

  const winnerForKey = (key: string): AudioSessionRegister | null => {
    if (!storage) return knownRegisters.get(key) ?? null;
    let physical: AudioSessionRegister | null = null;
    try { physical = parseRegister(storage.getItem(key)); } catch { /* unavailable storage */ }
    const known = knownRegisters.get(key) ?? null;

    if (known && (!physical || compareRegisters(known, physical) > 0)) {
      persistKnown(key, known);
      observe(known);
      return known;
    }
    if (physical) {
      knownRegisters.set(key, physical);
      observe(physical);
      return physical;
    }
    return known;
  };

  const writeRegister = (key: string, value: unknown) => {
    if (!storage) return false;
    const current = winnerForKey(key);
    if (current) {
      const currentCounter = BigInt(current.revision.counter);
      if (currentCounter > logicalClock) logicalClock = currentCounter;
    }
    logicalClock += 1n;
    const candidate: AudioSessionRegister = {
      version: REGISTER_VERSION,
      revision: {
        counter: logicalClock.toString(),
        writerId,
        updatedAt: Math.max(1, Math.floor(now())),
      },
      value,
    };
    if (!persistKnown(key, candidate)) return false;
    knownRegisters.set(key, candidate);
    return true;
  };

  const seedSnapshot = (snapshot: AudioSessionSnapshot) => {
    writeRegister(AUDIO_SESSION_LAST_TRACK_KEY, snapshot.lastTrackId);
    writeRegister(AUDIO_SESSION_VOLUME_KEY, { volume: snapshot.volume, muted: snapshot.muted });
    for (const [id, position] of Object.entries(snapshot.positions)) {
      writeRegister(`${AUDIO_SESSION_POSITION_PREFIX}${id}`, position);
    }
    for (const id of snapshot.completedTrackIds) {
      writeRegister(`${AUDIO_SESSION_COMPLETED_PREFIX}${id}`, true);
    }
  };

  const ensureMigrated = () => {
    if (!storage || migrating) return;
    try {
      if (storage.getItem(AUDIO_SESSION_READY_KEY) === '1') return;
    } catch {
      return;
    }

    migrating = true;
    try {
      let snapshot: AudioSessionSnapshot | null = null;
      try {
        const raw = storage.getItem(AUDIO_SESSION_STORAGE_KEY);
        if (raw) snapshot = sanitizeSnapshot(JSON.parse(raw), now());
      } catch {
        snapshot = null;
      }
      if (!snapshot) snapshot = migrateLegacySnapshot(storage, now);
      seedSnapshot(snapshot);
      try {
        storage.setItem(AUDIO_SESSION_READY_KEY, '1');
        storage.removeItem(AUDIO_SESSION_STORAGE_KEY);
        clearLegacySnapshot(storage);
      } catch {
        // Register writes remain self-validating; a later read can retry cleanup.
      }
    } finally {
      migrating = false;
    }
  };

  const read = (): AudioSessionSnapshot => {
    if (!storage) return createDefaultSnapshot(now());
    ensureMigrated();
    const snapshot = createDefaultSnapshot(now());
    let latestUpdatedAt = 0;

    const lastTrack = winnerForKey(AUDIO_SESSION_LAST_TRACK_KEY);
    if (lastTrack) {
      snapshot.lastTrackId = lastTrack.value === null ? null : sanitizeTrackId(lastTrack.value);
      latestUpdatedAt = Math.max(latestUpdatedAt, lastTrack.revision.updatedAt);
    }

    const volume = winnerForKey(AUDIO_SESSION_VOLUME_KEY);
    if (volume && volume.value && typeof volume.value === 'object' && !Array.isArray(volume.value)) {
      const candidate = volume.value as { volume?: unknown; muted?: unknown };
      const numericVolume = Number(candidate.volume);
      snapshot.volume = Number.isFinite(numericVolume) ? clamp(numericVolume, 0, 1) : 0.9;
      snapshot.muted = candidate.muted === true;
      latestUpdatedAt = Math.max(latestUpdatedAt, volume.revision.updatedAt);
    }

    const positions: Record<string, number> = {};
    const completed: string[] = [];
    for (const key of listStorageKeys(storage)) {
      if (key.startsWith(AUDIO_SESSION_POSITION_PREFIX)) {
        const id = sanitizeTrackId(key.slice(AUDIO_SESSION_POSITION_PREFIX.length));
        const register = winnerForKey(key);
        if (!id || !register) continue;
        const position = Number(register.value);
        if (register.value !== null && Number.isFinite(position) && position >= 0) positions[id] = position;
        latestUpdatedAt = Math.max(latestUpdatedAt, register.revision.updatedAt);
      } else if (key.startsWith(AUDIO_SESSION_COMPLETED_PREFIX)) {
        const id = sanitizeTrackId(key.slice(AUDIO_SESSION_COMPLETED_PREFIX.length));
        const register = winnerForKey(key);
        if (!id || !register) continue;
        if (register.value === true) completed.push(id);
        latestUpdatedAt = Math.max(latestUpdatedAt, register.revision.updatedAt);
      }
    }
    snapshot.positions = positions;
    snapshot.completedTrackIds = [...new Set(completed)].sort();
    snapshot.updatedAt = latestUpdatedAt || snapshot.updatedAt;
    return snapshot;
  };

  const applyDiff = (before: AudioSessionSnapshot, after: AudioSessionSnapshot) => {
    let ok = true;
    if (before.lastTrackId !== after.lastTrackId) {
      ok = writeRegister(AUDIO_SESSION_LAST_TRACK_KEY, after.lastTrackId) && ok;
    }
    if (before.volume !== after.volume || before.muted !== after.muted) {
      ok = writeRegister(AUDIO_SESSION_VOLUME_KEY, { volume: after.volume, muted: after.muted }) && ok;
    }

    const positionIds = new Set([...Object.keys(before.positions), ...Object.keys(after.positions)]);
    for (const id of positionIds) {
      if (before.positions[id] === after.positions[id]) continue;
      ok = writeRegister(`${AUDIO_SESSION_POSITION_PREFIX}${id}`, after.positions[id] ?? null) && ok;
    }

    const beforeCompleted = new Set(before.completedTrackIds);
    const afterCompleted = new Set(after.completedTrackIds);
    for (const id of new Set([...beforeCompleted, ...afterCompleted])) {
      if (beforeCompleted.has(id) === afterCompleted.has(id)) continue;
      ok = writeRegister(`${AUDIO_SESSION_COMPLETED_PREFIX}${id}`, afterCompleted.has(id)) && ok;
    }
    return ok;
  };

  const writeSnapshot = (snapshot: AudioSessionSnapshot) => {
    const sanitized = sanitizeSnapshot({ ...snapshot, version: 2 }, now()) ?? createDefaultSnapshot(now());
    const before = read();
    return applyDiff(before, sanitized);
  };

  const update = (mutator: (snapshot: AudioSessionSnapshot) => AudioSessionSnapshot | void) => {
    const before = read();
    const draft: AudioSessionSnapshot = {
      ...before,
      positions: { ...before.positions },
      completedTrackIds: [...before.completedTrackIds],
    };
    const result = mutator(draft);
    const candidate = sanitizeSnapshot(result ?? draft, now()) ?? before;
    applyDiff(before, candidate);
    return read();
  };

  const getTrackPosition = (trackId: string) => {
    const id = sanitizeTrackId(trackId);
    if (!id) return 0;
    ensureMigrated();
    const register = winnerForKey(`${AUDIO_SESSION_POSITION_PREFIX}${id}`);
    const position = register?.value === null ? 0 : Number(register?.value);
    return Number.isFinite(position) && position >= 0 ? position : 0;
  };

  const setTrackPosition = (trackId: string, position: number | null) => {
    const id = sanitizeTrackId(trackId);
    if (!id) return;
    ensureMigrated();
    const value = position === null || !Number.isFinite(position) || position < 0 ? null : position;
    writeRegister(`${AUDIO_SESSION_POSITION_PREFIX}${id}`, value);
  };

  const setLastTrack = (trackId: string | null) => {
    ensureMigrated();
    writeRegister(AUDIO_SESSION_LAST_TRACK_KEY, sanitizeTrackId(trackId));
  };

  const setVolume = (volume: number, muted: boolean) => {
    ensureMigrated();
    writeRegister(AUDIO_SESSION_VOLUME_KEY, { volume: clamp(volume, 0, 1), muted });
  };

  const setCompletedTracks = (trackIds: Iterable<string>) => {
    ensureMigrated();
    // Completion is monotonic during normal listening. Omissions in a stale tab
    // are never interpreted as deletions; catalog reconciliation owns pruning.
    for (const id of sanitizeCompleted([...trackIds])) {
      writeRegister(`${AUDIO_SESSION_COMPLETED_PREFIX}${id}`, true);
    }
  };

  const reconcile = (trackIds: Iterable<string>) => {
    const validIds = new Set(
      [...trackIds]
        .map(sanitizeTrackId)
        .filter((id): id is string => Boolean(id)),
    );
    const current = read();
    if (current.lastTrackId && !validIds.has(current.lastTrackId)) {
      writeRegister(AUDIO_SESSION_LAST_TRACK_KEY, null);
    }
    for (const id of Object.keys(current.positions)) {
      if (!validIds.has(id)) writeRegister(`${AUDIO_SESSION_POSITION_PREFIX}${id}`, null);
    }
    for (const id of current.completedTrackIds) {
      if (!validIds.has(id)) writeRegister(`${AUDIO_SESSION_COMPLETED_PREFIX}${id}`, false);
    }
    return read();
  };

  const acceptStorageEvent = (key: string | null, newValue: string | null) => {
    if (!storage || !isRegisterKey(key)) return false;
    const incoming = parseRegister(newValue);
    const known = knownRegisters.get(key) ?? null;

    if (!incoming) {
      if (known) persistKnown(key, known);
      return false;
    }
    if (known && compareRegisters(known, incoming) > 0) {
      // A stale writer can physically overwrite a newer register after reading
      // an older value. Reassert the deterministic winner; peers will observe it.
      persistKnown(key, known);
      return false;
    }
    if (known && compareRegisters(known, incoming) === 0) return false;
    knownRegisters.set(key, incoming);
    observe(incoming);
    return true;
  };

  return {
    read,
    writeSnapshot,
    update,
    reconcile,
    getTrackPosition,
    setTrackPosition,
    setLastTrack,
    setVolume,
    setCompletedTracks,
    acceptStorageEvent,
  };
}

function getStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const DEFAULT_WRITER_ID = createWriterId();
let defaultStorage: Storage | null | undefined;
let defaultReplica: AudioSessionReplica | null = null;

function getDefaultReplica() {
  const storage = getStorage();
  if (storage !== defaultStorage || !defaultReplica) {
    defaultStorage = storage;
    defaultReplica = createAudioSessionReplica(storage, DEFAULT_WRITER_ID);
  }
  return defaultReplica;
}

export function readAudioSession(): AudioSessionSnapshot {
  return getDefaultReplica().read();
}

export function writeAudioSession(snapshot: AudioSessionSnapshot) {
  return getDefaultReplica().writeSnapshot(snapshot);
}

export function updateAudioSession(mutator: (snapshot: AudioSessionSnapshot) => AudioSessionSnapshot | void) {
  return getDefaultReplica().update(mutator);
}

export function reconcileAudioSession(trackIds: Iterable<string>) {
  return getDefaultReplica().reconcile(trackIds);
}

export function getStoredTrackPosition(trackId: string) {
  return getDefaultReplica().getTrackPosition(trackId);
}

export function setStoredTrackPosition(trackId: string, position: number | null) {
  getDefaultReplica().setTrackPosition(trackId, position);
}

export function setStoredLastTrack(trackId: string | null) {
  getDefaultReplica().setLastTrack(trackId);
}

export function setStoredVolume(volume: number, muted: boolean) {
  getDefaultReplica().setVolume(volume, muted);
}

export function setStoredCompletedTracks(trackIds: Iterable<string>) {
  getDefaultReplica().setCompletedTracks(trackIds);
}

export function subscribeAudioSession(listener: (snapshot: AudioSessionSnapshot) => void) {
  if (typeof window === 'undefined') return () => undefined;
  const replica = getDefaultReplica();
  const onStorage = (event: StorageEvent) => {
    if (!replica.acceptStorageEvent(event.key, event.newValue)) return;
    listener(replica.read());
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}
