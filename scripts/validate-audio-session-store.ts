import {
  AUDIO_SESSION_COMPLETED_PREFIX,
  AUDIO_SESSION_LAST_TRACK_KEY,
  AUDIO_SESSION_POSITION_PREFIX,
  AUDIO_SESSION_STORAGE_KEY,
  AUDIO_SESSION_VOLUME_KEY,
  createAudioSessionReplica,
  getStoredTrackPosition,
  readAudioSession,
  reconcileAudioSession,
  setStoredCompletedTracks,
  setStoredLastTrack,
  setStoredTrackPosition,
  setStoredVolume,
  updateAudioSession,
} from '../src/components/music/audioSessionStore';
import {
  buildTrackMomentPath,
  formatAudioTime,
  formatIsoDuration,
  parseAudioMoment,
} from '../src/components/music/audioPresentation';

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
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { localStorage: storage },
});

const failures: string[] = [];
const expect = (condition: unknown, message: string) => {
  if (!condition) failures.push(message);
};

storage.clear();
const fresh = readAudioSession();
expect(fresh.volume === 0.9, 'fresh sessions must default to 90% volume');
expect(fresh.muted === false, 'fresh sessions must not start muted');
expect(storage.getItem(AUDIO_SESSION_STORAGE_KEY) === null, 'whole-snapshot v2 must not remain a writable authority after migration');
expect(storage.getItem(AUDIO_SESSION_LAST_TRACK_KEY) !== null, 'fresh sessions must seed the last-track register');
expect(storage.getItem(AUDIO_SESSION_VOLUME_KEY) !== null, 'fresh sessions must seed the volume register');

storage.clear();
storage.setItem('tlp-audio-last-track', 'pushkin-tucha');
storage.setItem('tlp-audio-volume', '0.42');
storage.setItem('tlp-audio-completed', JSON.stringify(['pushkin-tucha', 'pushkin-tucha', 12]));
storage.setItem('tlp-audio-position:pushkin-tucha', '128.5');
const migrated = readAudioSession();
expect(migrated.lastTrackId === 'pushkin-tucha', 'legacy last-track id must migrate');
expect(migrated.volume === 0.42, 'legacy volume must migrate');
expect(migrated.positions['pushkin-tucha'] === 128.5, 'legacy progress must migrate');
expect(migrated.completedTrackIds.length === 1, 'legacy completed ids must be deduplicated and sanitized');
expect(storage.getItem('tlp-audio-last-track') === null, 'legacy last-track storage must be retired after migration');
expect(storage.getItem('tlp-audio-volume') === null, 'legacy volume storage must be retired after migration');
expect(storage.getItem('tlp-audio-completed') === null, 'legacy completed storage must be retired after migration');
expect(storage.getItem('tlp-audio-position:pushkin-tucha') === null, 'legacy progress storage must be retired after migration');

updateAudioSession((snapshot) => {
  snapshot.positions['pushkin-tucha'] = 140;
});
expect(getStoredTrackPosition('pushkin-tucha') === 140, 'void mutators must persist their field-level changes');

setStoredTrackPosition('pushkin-tucha', null);
expect(getStoredTrackPosition('pushkin-tucha') === 0, 'cleared progress must read as zero');
setStoredTrackPosition('pushkin-tucha', 12.25);
expect(getStoredTrackPosition('pushkin-tucha') === 12.25, 'valid progress must persist');
setStoredTrackPosition('invalid track id', 50);
expect(getStoredTrackPosition('invalid track id') === 0, 'invalid track ids must not create progress entries');

setStoredVolume(4, false);
expect(readAudioSession().volume === 1, 'volume must be clamped to one');
setStoredVolume(-2, true);
const muted = readAudioSession();
expect(muted.volume === 0 && muted.muted, 'negative volume must clamp to zero without losing muted state');

setStoredLastTrack('INVALID ID WITH SPACES');
expect(readAudioSession().lastTrackId === null, 'invalid track ids must not enter the session');
setStoredCompletedTracks(['blok-rossiya', 'blok-rossiya', 'bad id']);
const additiveCompleted = readAudioSession().completedTrackIds;
expect(
  additiveCompleted.includes('blok-rossiya') && additiveCompleted.includes('pushkin-tucha'),
  'completion updates must sanitize ids and preserve previously completed tracks instead of treating stale omission as deletion',
);

updateAudioSession((snapshot) => {
  snapshot.lastTrackId = 'pushkin-tucha';
  snapshot.positions['pushkin-tucha'] = 88;
  snapshot.positions['removed-release'] = 33;
  snapshot.completedTrackIds = ['blok-rossiya', 'removed-release'];
});
const reconciled = reconcileAudioSession(['pushkin-tucha', 'blok-rossiya']);
expect(reconciled.lastTrackId === 'pushkin-tucha', 'reconciliation must preserve a valid last track');
expect(reconciled.positions['pushkin-tucha'] === 88, 'reconciliation must preserve valid progress');
expect(reconciled.positions['removed-release'] === undefined, 'reconciliation must remove progress for deleted releases');
expect(reconciled.completedTrackIds.join(',') === 'blok-rossiya', 'reconciliation must prune removed completion ids');
const reconciledAgain = reconcileAudioSession(['blok-rossiya']);
expect(reconciledAgain.lastTrackId === null, 'reconciliation must clear a last track that left the public catalog');
expect(reconciledAgain.positions['pushkin-tucha'] === undefined, 'reconciliation must remove positions for archived releases');

storage.clear();
storage.setItem(AUDIO_SESSION_STORAGE_KEY, JSON.stringify({
  version: 2,
  lastTrackId: 'pushkin-tucha',
  volume: 0.55,
  muted: false,
  positions: { 'pushkin-tucha': 17 },
  completedTrackIds: ['blok-rossiya'],
  updatedAt: 1234,
}));
const migratedV2 = readAudioSession();
expect(migratedV2.lastTrackId === 'pushkin-tucha', 'v2 aggregate last track must migrate into registers');
expect(migratedV2.positions['pushkin-tucha'] === 17, 'v2 aggregate position must migrate into a per-track register');
expect(migratedV2.completedTrackIds.includes('blok-rossiya'), 'v2 aggregate completion must migrate into a per-track register');
expect(storage.getItem(AUDIO_SESSION_STORAGE_KEY) === null, 'v2 aggregate must be retired after successful register migration');

storage.clear();
storage.setItem(AUDIO_SESSION_STORAGE_KEY, '{broken json');
const recovered = readAudioSession();
expect(recovered.version === 2, 'corrupt v2 JSON must recover to a valid session projection');
expect(Number.isFinite(recovered.volume), 'recovered volume must remain finite');
expect(storage.getItem(AUDIO_SESSION_STORAGE_KEY) === null, 'corrupt v2 authority must be retired after recovery');

// Two logical tabs share one physical localStorage but own independent clocks.
// Unrelated writes use separate keys, so a stale tab can no longer erase a peer field.
const shared = new MemoryStorage();
const tabA = createAudioSessionReplica(shared, 'tab-a', () => 10_000);
const tabB = createAudioSessionReplica(shared, 'tab-b', () => 10_000);
tabA.read();
tabB.read();
tabA.setTrackPosition('pushkin-tucha', 41);
tabB.setTrackPosition('blok-rossiya', 73);
let sharedSession = tabA.read();
expect(sharedSession.positions['pushkin-tucha'] === 41, 'tab B must not erase tab A progress for another track');
expect(sharedSession.positions['blok-rossiya'] === 73, 'tab A must retain tab B progress for another track');
expect(shared.getItem(`${AUDIO_SESSION_POSITION_PREFIX}pushkin-tucha`) !== null, 'position A must have its own conflict domain');
expect(shared.getItem(`${AUDIO_SESSION_POSITION_PREFIX}blok-rossiya`) !== null, 'position B must have its own conflict domain');

tabA.setCompletedTracks(['pushkin-tucha']);
tabB.setCompletedTracks(['blok-rossiya']);
sharedSession = tabA.read();
expect(
  sharedSession.completedTrackIds.join(',') === 'blok-rossiya,pushkin-tucha',
  'stale completion sets must converge additively instead of deleting peer completion',
);
expect(shared.getItem(`${AUDIO_SESSION_COMPLETED_PREFIX}pushkin-tucha`) !== null, 'completion A must have its own register');
expect(shared.getItem(`${AUDIO_SESSION_COMPLETED_PREFIX}blok-rossiya`) !== null, 'completion B must have its own register');

// A later same-field mutation receives a greater logical counter. If an older
// physical value arrives afterwards, the peer that already observed the winner
// must reassert it instead of regressing.
tabA.setVolume(0.25, false);
const olderVolume = shared.getItem(AUDIO_SESSION_VOLUME_KEY);
expect(Boolean(olderVolume), 'first volume register must exist');
if (olderVolume) tabB.acceptStorageEvent(AUDIO_SESSION_VOLUME_KEY, olderVolume);
tabB.setVolume(0.8, true);
const winningVolume = shared.getItem(AUDIO_SESSION_VOLUME_KEY);
expect(Boolean(winningVolume) && winningVolume !== olderVolume, 'later volume register must have a newer revision');
if (winningVolume) tabA.acceptStorageEvent(AUDIO_SESSION_VOLUME_KEY, winningVolume);
if (olderVolume && winningVolume) {
  shared.setItem(AUDIO_SESSION_VOLUME_KEY, olderVolume);
  const acceptedRegression = tabA.acceptStorageEvent(AUDIO_SESSION_VOLUME_KEY, olderVolume);
  expect(acceptedRegression === false, 'older storage events must not be accepted as new state');
  expect(shared.getItem(AUDIO_SESSION_VOLUME_KEY) === winningVolume, 'anti-entropy must restore the known winning register');
}

// Independent replicas can create the same logical counter. Writer id is the
// deterministic total-order tie-break, so delivery order cannot change winner.
const tieStorageA = new MemoryStorage();
const tieStorageZ = new MemoryStorage();
const tieA = createAudioSessionReplica(tieStorageA, 'writer-a', () => 20_000);
const tieZ = createAudioSessionReplica(tieStorageZ, 'writer-z', () => 20_000);
tieA.read();
tieZ.read();
tieA.setVolume(0.11, false);
tieZ.setVolume(0.91, true);
const tiedA = tieStorageA.getItem(AUDIO_SESSION_VOLUME_KEY);
const tiedZ = tieStorageZ.getItem(AUDIO_SESSION_VOLUME_KEY);
expect(Boolean(tiedA && tiedZ), 'equal-clock fixture must produce both registers');
const resolverStorage = new MemoryStorage();
const resolver = createAudioSessionReplica(resolverStorage, 'resolver', () => 30_000);
if (tiedZ) {
  resolverStorage.setItem(AUDIO_SESSION_VOLUME_KEY, tiedZ);
  resolver.acceptStorageEvent(AUDIO_SESSION_VOLUME_KEY, tiedZ);
}
if (tiedA && tiedZ) {
  resolverStorage.setItem(AUDIO_SESSION_VOLUME_KEY, tiedA);
  const acceptedLoser = resolver.acceptStorageEvent(AUDIO_SESSION_VOLUME_KEY, tiedA);
  expect(acceptedLoser === false, 'lower writer id must lose an equal-counter conflict');
  expect(resolverStorage.getItem(AUDIO_SESSION_VOLUME_KEY) === tiedZ, 'equal-counter winner must be independent of delivery order');
}

expect(formatAudioTime(61.9) === '1:01', 'clock labels must use stable whole seconds');
expect(formatAudioTime(Number.NaN) === '0:00', 'invalid clock values must be harmless');
expect(formatIsoDuration(239.6) === 'PT4M0S', 'ISO durations must never emit sixty seconds');
expect(parseAudioMoment(null, 100) === undefined, 'a missing t parameter must not implicitly load a track');
expect(parseAudioMoment('', 100) === undefined, 'an empty t parameter must be rejected');
expect(parseAudioMoment('not-a-time', 100) === undefined, 'invalid t parameters must be rejected');
expect(parseAudioMoment('500', 100) === 99.9, 'shared moments must stay inside the release duration');
expect(buildTrackMomentPath('pushkin-tucha', 4.9) === '/music/pushkin-tucha', 'tiny positions must not pollute shared links');
expect(buildTrackMomentPath('pushkin-tucha', 128.8) === '/music/pushkin-tucha?t=128', 'shared links must use a stable whole-second moment');

for (const failure of failures) console.error(`ERROR audio-session: ${failure}`);
console.log(`Audio session validation: ${failures.length} error(s)`);
if (failures.length) process.exit(1);
