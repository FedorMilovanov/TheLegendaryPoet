import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { assertWebPContainer, readIntrinsicSize } from './lib/image-metrics.mjs';

// Re-exported: the regression suite imports the container check from here.
export { assertWebPContainer };

export function selectDecoder() {
  for (const [command, flag] of [['ffmpeg', '-version'], ['convert', '-version']]) {
    const result = spawnSync(command, [flag], { timeout: 5000, encoding: 'utf8' });
    if (!result.error && result.status === 0) return command;
  }
  throw new Error('Full image decoder required: install FFmpeg (CI shared build-tools action) or ImageMagick. No header-only pass.');
}

export function validateImage(file, decoder) {
  const bytes = fs.readFileSync(file);
  if (path.extname(file).toLowerCase() === '.webp') assertWebPContainer(bytes);
  const args = decoder === 'ffmpeg'
    ? ['-v', 'error', '-xerror', '-i', file, '-f', 'null', '-']
    : ['-regard-warnings', file, 'null:'];
  const result = spawnSync(decoder, args, { timeout: 30_000, maxBuffer: 1024 * 1024, encoding: 'utf8' });
  if (result.error || result.status !== 0 || result.stderr.trim()) {
    throw new Error(`full decode failed (${decoder}): ${result.error?.message || result.stderr.trim() || `exit ${result.status}`}`);
  }
  // Last: the size a page can actually paint, read from the headers. A file
  // whose frame size cannot be read is a file we must not ship, and 0x0 must
  // never be mistaken for "unknown, carry on". It comes after the pixel decode
  // so corrupt-but-consistent bytes are still reported as a decode failure.
  const size = readIntrinsicSize(bytes);
  if (!(size.width > 0 && size.height > 0)) {
    throw new Error(`unreadable intrinsic size ${size.width}x${size.height}`);
  }
  return size;
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
    console.log(`Image integrity: ${files.length} raster images, container + intrinsic size + full ${decoder} decode PASS`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
