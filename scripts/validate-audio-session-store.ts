import {
  AUDIO_SESSION_STORAGE_KEY,
  getStoredTrackPosition,
  readAudioSession,
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
expect(storage.getItem(AUDIO_SESSION_STORAGE_KEY) !== null, 'fresh sessions must persist the validated v2 shape');

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
expect(storage.getItem('tlp-audio-completed') === null, 'legacy completion storage must be retired after migration');
expect(storage.getItem('tlp-audio-position:pushkin-tucha') === null, 'legacy progress storage must be retired after migration');

updateAudioSession((snapshot) => {
  snapshot.positions['pushkin-tucha'] = 140;
});
expect(getStoredTrackPosition('pushkin-tucha') === 140, 'void mutators must persist their draft changes');

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
expect(readAudioSession().completedTrackIds.join(',') === 'blok-rossiya', 'completed ids must remain unique and sanitized');

storage.setItem(AUDIO_SESSION_STORAGE_KEY, '{broken json');
const recovered = readAudioSession();
expect(recovered.version === 2, 'corrupt JSON must recover to a valid v2 session');
expect(Number.isFinite(recovered.volume), 'recovered volume must remain finite');

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
