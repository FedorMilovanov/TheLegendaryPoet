import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// A successful native browser decode can still accept a truncated VP8 stream.
export function assertWebPContainer(bytes) {
  if (bytes.length < 20 || bytes.toString('ascii', 0, 4) !== 'RIFF'
    || bytes.toString('ascii', 8, 12) !== 'WEBP') throw new Error('invalid WebP header');
  const declared = bytes.readUInt32LE(4) + 8;
  if (declared !== bytes.length) throw new Error(`RIFF length ${declared} != stored ${bytes.length}`);
  let offset = 12;
  let imageChunks = 0;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) throw new Error('truncated WebP chunk header');
    const tag = bytes.toString('ascii', offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const end = offset + 8 + size + (size % 2);
    if (end > bytes.length) throw new Error(`truncated WebP ${tag} payload`);
    if (['VP8 ', 'VP8L', 'ANMF'].includes(tag)) imageChunks++;
    offset = end;
  }
  if (!imageChunks) throw new Error('WebP has no image payload');
}

export function selectDecoder() {
  for (const [command, flag] of [['ffmpeg', '-version'], ['convert', '-version']]) {
    const result = spawnSync(command, [flag], { timeout: 5000, encoding: 'utf8' });
    if (!result.error && result.status === 0) return command;
  }
  throw new Error('Full image decoder required: install FFmpeg (CI shared build-tools action) or ImageMagick. No header-only pass.');
}

export function validateImage(file, decoder) {
  if (path.extname(file).toLowerCase() === '.webp') assertWebPContainer(fs.readFileSync(file));
  const args = decoder === 'ffmpeg'
    ? ['-v', 'error', '-xerror', '-i', file, '-f', 'null', '-']
    : ['-regard-warnings', file, 'null:'];
  const result = spawnSync(decoder, args, { timeout: 30_000, maxBuffer: 1024 * 1024, encoding: 'utf8' });
  if (result.error || result.status !== 0 || result.stderr.trim()) {
    throw new Error(`full decode failed (${decoder}): ${result.error?.message || result.stderr.trim() || `exit ${result.status}`}`);
  }
}

export function imageFiles(root) {
  return fs.readdirSync(root, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) return imageFiles(file);
    return entry.isFile() && /\.(?:avif|gif|jpe?g|png|webp)$/i.test(entry.name) ? [file] : [];
  });
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    const files = imageFiles(process.argv[2] || 'public');
    if (!files.length) throw new Error('No raster images found; refusing an empty validation pass');
    const decoder = selectDecoder();
    const errors = [];
    for (const file of files) {
      try { validateImage(file, decoder); }
      catch (error) { errors.push(`${file}: ${error.message}`); }
    }
    if (errors.length) throw new Error(errors.join('\n'));
    console.log(`Image integrity: ${files.length} raster images, RIFF/chunk checks + full ${decoder} decode PASS`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
