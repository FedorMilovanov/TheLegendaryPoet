import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve();
const publicDir = path.join(root, 'public');
const referencePath = path.join(root, 'qa', 'reference', 'brand-emblem-canonical-reference.webp');
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const expectedReferenceHash = '767be12318c21aeb2c259a4ab529f04caf9f5db9b131c38223ea85e109ea8532';

fs.mkdirSync(publicDir, { recursive: true });

if (!fs.existsSync(referencePath)) {
  throw new Error('brand materialize: canonical reference is missing');
}

const referenceBytes = fs.readFileSync(referencePath);
const referenceHash = crypto.createHash('sha256').update(referenceBytes).digest('hex');
if (referenceHash !== expectedReferenceHash) {
  throw new Error(`brand materialize: canonical reference integrity mismatch (${referenceHash})`);
}

const written = [];

function runFfmpeg(args, outputName) {
  const outputPath = path.join(publicDir, outputName);
  const result = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args, outputPath], { encoding: 'utf8' });
  if (result.error?.code === 'ENOENT') {
    throw new Error('brand materialize: ffmpeg was not found. Install FFmpeg or set FFMPEG_PATH.');
  }
  if (result.status !== 0) {
    throw new Error(`brand materialize: ffmpeg failed for ${outputName}: ${result.stderr || result.error || 'unknown error'}`);
  }
  const size = fs.statSync(outputPath).size;
  if (size < 180) throw new Error(`brand materialize: generated asset is unexpectedly small ${outputName}`);
  written.push(`${outputName} (${size} B)`);
  return outputPath;
}

const png = ['-frames:v', '1', '-c:v', 'png', '-compression_level', '9', '-pred', 'mixed'];

const primaryPath = runFfmpeg(
  ['-i', referencePath, '-vf', 'scale=256:256:flags=lanczos', ...png],
  'brand-emblem-primary.png',
);

const simplifiedPath = runFfmpeg(
  ['-i', referencePath, '-vf', 'crop=232:232:12:8,scale=256:256:flags=lanczos', ...png],
  'brand-emblem-simplified.png',
);

const microPath = runFfmpeg(
  ['-i', referencePath, '-vf', 'crop=220:220:18:8,scale=128:128:flags=lanczos', ...png],
  'brand-emblem-micro.png',
);

const headerPath = runFfmpeg(
  ['-i', referencePath, '-vf', 'scale=236:236:flags=lanczos,pad=384:256:74:10:color=0x02050b', ...png],
  'brand-emblem-header.png',
);

runFfmpeg(
  ['-i', primaryPath, '-frames:v', '1', '-c:v', 'libwebp', '-q:v', '90', '-compression_level', '6', '-pix_fmt', 'yuv420p'],
  'brand-emblem-master.webp',
);

runFfmpeg(['-i', microPath, '-vf', 'scale=16:16:flags=lanczos', ...png], 'favicon-16.png');
runFfmpeg(['-i', microPath, '-vf', 'scale=32:32:flags=lanczos', ...png], 'favicon-32.png');

function renderPaddedIcon(outputName, canvas, mark, source = simplifiedPath) {
  return runFfmpeg(
    ['-i', source, '-vf', `scale=${mark}:${mark}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${canvas}:${canvas}:(ow-iw)/2:(oh-ih)/2:color=0x02050b`, ...png],
    outputName,
  );
}

renderPaddedIcon('apple-touch-icon.png', 180, 154);
renderPaddedIcon('icon-192.png', 192, 168);
renderPaddedIcon('icon-512.png', 512, 448);
renderPaddedIcon('icon-maskable-512.png', 512, 396);
renderPaddedIcon('mstile-150x150.png', 150, 128);

runFfmpeg(
  [
    '-f', 'lavfi',
    '-i', 'color=c=0x02050b:s=1200x630:d=1',
    '-i', headerPath,
    '-filter_complex',
    '[1:v]scale=620:-1:flags=lanczos[mark];[0:v][mark]overlay=(W-w)/2:(H-h)/2',
    '-frames:v', '1',
    '-q:v', '3',
    '-pix_fmt', 'yuvj420p',
  ],
  'og-image.jpg',
);

console.log(`brand materialize: canonical reference ${referenceHash}; ${written.join(', ')}`);
