import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

type ManifestTrack = {
  id: string;
  path: string;
  sha256: string;
  bytes: number;
  durationSeconds: number;
  cover: string;
};
type Manifest = { tracks: ManifestTrack[] };

const allowMissing = process.argv.includes('--allow-missing');
const root = process.cwd();
const manifestPath = resolve(root, 'public/audio/manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Manifest;
const errors: string[] = [];
const warnings: string[] = [];
let validated = 0;

function isMissing(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'ENOENT';
}

for (const track of manifest.tracks) {
  const audioPath = resolve(root, 'public', track.path.replace(/^\//, ''));
  const coverPath = resolve(root, 'public', track.cover.replace(/^\//, ''));
  let audioExists = true;

  try {
    const [audio, audioStat] = await Promise.all([readFile(audioPath), stat(audioPath)]);
    const digest = createHash('sha256').update(audio).digest('hex');
    if (digest !== track.sha256) errors.push(`${track.id}: SHA-256 mismatch (${digest})`);
    if (audioStat.size !== track.bytes) errors.push(`${track.id}: byte size mismatch (${audioStat.size})`);
    if (track.durationSeconds <= 0) errors.push(`${track.id}: invalid duration`);
    validated += 1;
  } catch (error) {
    audioExists = false;
    if (allowMissing && isMissing(error)) warnings.push(`${track.id}: master is not uploaded yet`);
    else errors.push(`${track.id}: audio missing or unreadable (${String(error)})`);
  }

  try {
    const coverStat = await stat(coverPath);
    if (!coverStat.isFile() || coverStat.size < 1024) errors.push(`${track.id}: cover is empty or invalid`);
  } catch (error) {
    if (allowMissing && !audioExists && isMissing(error)) warnings.push(`${track.id}: cover is not uploaded yet`);
    else errors.push(`${track.id}: cover missing or unreadable (${String(error)})`);
  }
}

if (validated === 0) errors.push('no uploaded audio masters were validated');
for (const warning of warnings) console.warn(`WARN audio: ${warning}`);
for (const error of errors) console.error(`ERROR audio: ${error}`);
console.log(`Audio validation: ${validated}/${manifest.tracks.length} uploaded master(s), ${warnings.length} warning(s), ${errors.length} error(s)`);
if (errors.length) process.exit(1);
