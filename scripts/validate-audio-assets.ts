import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { allMusicTracks } from '../src/data/library/musicTracks';
import { getPlaybackQueue } from '../src/data/musicCatalog';

type ManifestTrack = {
  id: string;
  path: string;
  sha256: string;
  bytes: number;
  durationSeconds: number;
  cover: string;
  codec: string;
};
type Manifest = { tracks: ManifestTrack[] };

// Compatibility mode may suppress redundant missing-art diagnostics only after
// a published master has already failed. It must never make a missing published
// master non-fatal.
const allowMissing = process.argv.includes('--allow-missing');
const root = process.env.TLP_AUDIO_VALIDATION_ROOT
  ? resolve(process.env.TLP_AUDIO_VALIDATION_ROOT)
  : process.cwd();
const manifestPath = resolve(root, 'public/audio/manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Manifest;
const manifestById = new Map(manifest.tracks.map((track) => [track.id, track]));
const publishedTracks = getPlaybackQueue(allMusicTracks);
const errors: string[] = [];
const warnings: string[] = [];
let validated = 0;

function isMissing(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'ENOENT';
}

function hasMp3Signature(buffer: Buffer) {
  if (buffer.length < 3) return false;
  if (buffer.subarray(0, 3).toString('ascii') === 'ID3') return true;
  return buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;
}


/** Inspect the first actual MPEG-1 Layer III frame, skipping optional ID3v2 tags.
 * This prevents a string-only manifest from advertising a false sample rate.
 */
function mp3SampleRateHz(buffer: Buffer): number | null {
  if (buffer.length < 4) return null;
  let start = 0;
  if (buffer.subarray(0, 3).toString('ascii') === 'ID3' && buffer.length >= 10) {
    const id3size = ((buffer[6] & 0x7f) << 21)
      | ((buffer[7] & 0x7f) << 14)
      | ((buffer[8] & 0x7f) << 7)
      | (buffer[9] & 0x7f);
    start = 10 + id3size + ((buffer[5] & 0x10) ? 10 : 0);
  }
  const end = Math.min(buffer.length - 4, start + 65536);
  for (let at = start; at <= end; at += 1) {
    if (buffer[at] !== 0xff || (buffer[at + 1] & 0xe0) !== 0xe0) continue;
    const version = (buffer[at + 1] >> 3) & 3;
    const layer = (buffer[at + 1] >> 1) & 3;
    const bitrateIndex = (buffer[at + 2] >> 4) & 15;
    const sampleIndex = (buffer[at + 2] >> 2) & 3;
    if (version !== 3 || layer !== 1 || bitrateIndex === 0 || bitrateIndex === 15 || sampleIndex === 3) continue;
    return [44100, 48000, 32000][sampleIndex];
  }
  return null;
}

function hasWebpSignature(buffer: Buffer) {
  return buffer.length >= 12
    && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
    && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
}

async function validateWebp(trackId: string, label: string, publicUrl: string, masterExists: boolean) {
  const filePath = resolve(root, 'public', publicUrl.replace(/^\//, ''));
  try {
    const [image, imageStat] = await Promise.all([readFile(filePath), stat(filePath)]);
    if (!imageStat.isFile() || imageStat.size < 1024) errors.push(`${trackId}: ${label} is empty or invalid`);
    if (!hasWebpSignature(image)) errors.push(`${trackId}: ${label} is not a real WebP file`);
  } catch (error) {
    if (allowMissing && !masterExists && isMissing(error)) warnings.push(`${trackId}: ${label} is not uploaded yet`);
    else errors.push(`${trackId}: ${label} missing or unreadable (${String(error)})`);
  }
}

for (const track of publishedTracks) {
  const manifestTrack = manifestById.get(track.id);
  if (!manifestTrack) {
    errors.push(`${track.id}: missing from audio manifest`);
    continue;
  }

  const audioPath = resolve(root, 'public', manifestTrack.path.replace(/^\//, ''));
  let audioExists = true;

  try {
    const [audio, audioStat] = await Promise.all([readFile(audioPath), stat(audioPath)]);
    const digest = createHash('sha256').update(audio).digest('hex');
    if (!hasMp3Signature(audio)) errors.push(`${track.id}: master does not have a valid MP3 signature`);
    if (digest !== manifestTrack.sha256) errors.push(`${track.id}: SHA-256 mismatch (${digest})`);
    if (audioStat.size !== manifestTrack.bytes) errors.push(`${track.id}: byte size mismatch (${audioStat.size})`);
    if (!Number.isFinite(manifestTrack.durationSeconds) || manifestTrack.durationSeconds <= 0) errors.push(`${track.id}: invalid duration`);
    const declaredSampleRate = /\b(44\.1|48)\s*kHz\b/i.exec(manifestTrack.codec ?? '');
    if (typeof manifestTrack.codec !== 'string'
      || !/\bMP3\b/i.test(manifestTrack.codec)
      || !/stereo/i.test(manifestTrack.codec)
      || !declaredSampleRate) {
      errors.push(`${track.id}: codec description must identify MP3, 44.1 or 48 kHz, and stereo`);
    } else {
      const actualSampleRateHz = mp3SampleRateHz(audio);
      const declaredSampleRateHz = Math.round(Number(declaredSampleRate[1]) * 1000);
      if (!actualSampleRateHz || actualSampleRateHz !== declaredSampleRateHz) {
        errors.push(
          `${track.id}: MP3 frame sample rate ${actualSampleRateHz ?? 'unknown'} Hz differs from manifest ${declaredSampleRateHz} Hz`,
        );
      }
    }
    validated += 1;
  } catch (error) {
    audioExists = false;
    if (isMissing(error)) errors.push(`${track.id}: published master is missing`);
    else errors.push(`${track.id}: audio unreadable (${String(error)})`);
  }

  if (!track.coverUrl || !track.wideCoverUrl) {
    errors.push(`${track.id}: published release is missing square or wide artwork URL`);
    continue;
  }
  if (manifestTrack.cover !== track.coverUrl) errors.push(`${track.id}: manifest cover differs from release registry`);
  if (track.coverUrl === track.wideCoverUrl) errors.push(`${track.id}: square and wide artwork must be separate files`);

  await validateWebp(track.id, 'square cover', track.coverUrl, audioExists);
  await validateWebp(track.id, 'wide cover', track.wideCoverUrl, audioExists);
}

for (const manifestTrack of manifest.tracks) {
  if (!publishedTracks.some((track) => track.id === manifestTrack.id)) {
    errors.push(`${manifestTrack.id}: manifest contains a non-public release`);
  }
}

if (validated === 0) errors.push('no uploaded audio masters were validated');
for (const warning of warnings) console.warn(`WARN audio: ${warning}`);
for (const error of errors) console.error(`ERROR audio: ${error}`);
console.log(`Audio validation: ${validated}/${publishedTracks.length} uploaded master(s), ${warnings.length} warning(s), ${errors.length} error(s)`);
if (errors.length) process.exit(1);
