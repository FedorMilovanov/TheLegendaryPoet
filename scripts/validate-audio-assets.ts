import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

type Manifest = { tracks: Array<{ id: string; path: string; sha256: string; bytes: number; durationSeconds: number; cover: string }> };
const root = process.cwd();
const manifestPath = resolve(root, 'public/audio/manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Manifest;
const errors: string[] = [];
for (const track of manifest.tracks) {
  const audioPath = resolve(root, 'public', track.path.replace(/^\//, ''));
  const coverPath = resolve(root, 'public', track.cover.replace(/^\//, ''));
  try {
    const [audio, audioStat] = await Promise.all([readFile(audioPath), stat(audioPath)]);
    const digest = createHash('sha256').update(audio).digest('hex');
    if (digest !== track.sha256) errors.push(`${track.id}: SHA-256 mismatch (${digest})`);
    if (audioStat.size !== track.bytes) errors.push(`${track.id}: byte size mismatch (${audioStat.size})`);
    if (track.durationSeconds <= 0) errors.push(`${track.id}: invalid duration`);
  } catch (error) { errors.push(`${track.id}: audio missing (${String(error)})`); }
  try { await stat(coverPath); } catch { errors.push(`${track.id}: cover missing`); }
}
for (const error of errors) console.error(`ERROR audio: ${error}`);
console.log(`Audio validation: ${manifest.tracks.length} track(s), ${errors.length} error(s)`);
if (errors.length) process.exit(1);
