export const AUDIO_SESSION_STORAGE_KEY = 'tlp-audio-session:v2';
export const AUDIO_COORDINATION_STORAGE_KEY = 'tlp-audio-coordination:v1';
export const AUDIO_COORDINATION_CHANNEL = 'tlp-audio-coordination:v1';

const LEGACY_LAST_TRACK_KEY = 'tlp-audio-last-track';
const LEGACY_VOLUME_KEY = 'tlp-audio-volume';
const LEGACY_COMPLETED_KEY = 'tlp-audio-completed';
const LEGACY_POSITION_PREFIX = 'tlp-audio-position:';

export interface AudioSessionSnapshot {
  version: 2;
  lastTrackId: string | null;
  volume: number;
  muted: boolean;
  positions: Record<string, number>;
  completedTrackIds: string[];
  updatedAt: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function createDefaultSnapshot(): AudioSessionSnapshot {
  return {
    version: 2,
    lastTrackId: null,
    volume: 0.9,
    muted: false,
    positions: {},
    completedTrackIds: [],
    updatedAt: Date.now(),
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

function sanitizeSnapshot(value: unknown): AudioSessionSnapshot | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<AudioSessionSnapshot>;
  if (candidate.version !== 2) return null;
  const numericVolume = Number(candidate.volume);
  return {
    version: 2,
    lastTrackId: sanitizeTrackId(candidate.lastTrackId),
    volume: Number.isFinite(numericVolume) ? clamp(numericVolume, 0, 1) : 0.9,
    muted: candidate.muted === true,
    positions: sanitizePositions(candidate.positions),
    completedTrackIds: sanitizeCompleted(candidate.completedTrackIds),
    updatedAt: Number.isFinite(Number(candidate.updatedAt)) ? Number(candidate.updatedAt) : Date.now(),
  };
}

function migrateLegacySnapshot(storage: Storage) {
  const snapshot = createDefaultSnapshot();
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

function getStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readAudioSession(): AudioSessionSnapshot {
  const storage = getStorage();
  if (!storage) return createDefaultSnapshot();

  try {
    const raw = storage.getItem(AUDIO_SESSION_STORAGE_KEY);
    if (raw) {
      const parsed = sanitizeSnapshot(JSON.parse(raw));
      if (parsed) return parsed;
    }
  } catch {
    // Corrupt storage is replaced by a validated migration/default below.
  }

  const migrated = migrateLegacySnapshot(storage);
  writeAudioSession(migrated);
  return migrated;
}

export function writeAudioSession(snapshot: AudioSessionSnapshot) {
  const storage = getStorage();
  if (!storage) return;
  const sanitized = sanitizeSnapshot({ ...snapshot, version: 2, updatedAt: Date.now() }) ?? createDefaultSnapshot();
  try {
    storage.setItem(AUDIO_SESSION_STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // Private browsing and storage quotas must never break playback.
  }
}

export function updateAudioSession(mutator: (snapshot: AudioSessionSnapshot) => AudioSessionSnapshot | void) {
  const current = readAudioSession();
  const draft: AudioSessionSnapshot = {
    ...current,
    positions: { ...current.positions },
    completedTrackIds: [...current.completedTrackIds],
  };
  const result = mutator(draft);
  const next = result ?? draft;
  writeAudioSession(next);
  return next;
}

export function getStoredTrackPosition(trackId: string) {
  const position = readAudioSession().positions[trackId];
  return Number.isFinite(position) && position >= 0 ? position : 0;
}

export function setStoredTrackPosition(trackId: string, position: number | null) {
  updateAudioSession((snapshot) => {
    if (position === null || !Number.isFinite(position) || position < 0) delete snapshot.positions[trackId];
    else snapshot.positions[trackId] = position;
  });
}

export function setStoredLastTrack(trackId: string | null) {
  updateAudioSession((snapshot) => {
    snapshot.lastTrackId = sanitizeTrackId(trackId);
  });
}

export function setStoredVolume(volume: number, muted: boolean) {
  updateAudioSession((snapshot) => {
    snapshot.volume = clamp(volume, 0, 1);
    snapshot.muted = muted;
  });
}

export function setStoredCompletedTracks(trackIds: Iterable<string>) {
  updateAudioSession((snapshot) => {
    snapshot.completedTrackIds = sanitizeCompleted([...trackIds]);
  });
}
