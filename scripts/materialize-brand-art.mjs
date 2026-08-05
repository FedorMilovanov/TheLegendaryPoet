import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve();
const publicDir = path.join(root, 'public');
const approvedDir = path.join(root, 'qa', 'reference', 'approved-brand');
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const RELEASE = 'approved-single-reference-20260804-1';
const SOURCE_SHA256 = '898cf6bd0321f6f48ed12971f49803f7ed6758961f51e06628f0da2ffd50ff17';
const SOURCE_PARTS = Array.from({ length: 25 }, (_, index) => `final-reference.part${String(index).padStart(2, '0')}.b64`);

fs.mkdirSync(publicDir, { recursive: true });

const digest = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const encoded = SOURCE_PARTS.map((source) => {
  const sourcePath = path.join(approvedDir, source);
  if (!fs.existsSync(sourcePath)) throw new Error(`brand materialize: approved source part is missing: ${source}`);
  return fs.readFileSync(sourcePath, 'utf8').replace(/\s+/g, '');
}).join('');
const sourceBytes = Buffer.from(encoded, 'base64');
const sourceHash = digest(sourceBytes);
if (sourceHash !== SOURCE_SHA256) throw new Error(`brand materialize: approved source integrity mismatch (${sourceHash})`);
if (sourceBytes.subarray(0, 4).toString('ascii') !== 'RIFF' || sourceBytes.subarray(8, 12).toString('ascii') !== 'WEBP') {
  throw new Error('brand materialize: approved source is not WebP');
}

const sourcePath = path.join(publicDir, '.brand-emblem-approved-source.webp');
fs.writeFileSync(sourcePath, sourceBytes);
const written = [];

function recordOutput(outputPath, outputName) {
  const size = fs.statSync(outputPath).size;
  if (size < 180) throw new Error(`brand materialize: generated asset is unexpectedly small ${outputName}`);
  written.push(`${outputName} (${size} B)`);
  return outputPath;
}

function runFfmpeg(args, outputName) {
  const outputPath = path.join(publicDir, outputName);
  const result = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args, outputPath], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`brand materialize: FFmpeg failed for ${outputName}: ${result.stderr || result.error || 'unknown error'}`);
  return recordOutput(outputPath, outputName);
}

function runConvert(args, outputName) {
  const outputPath = path.join(publicDir, outputName);
  const result = spawnSync('convert', [...args, outputPath], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`brand materialize: ImageMagick failed for ${outputName}: ${result.stderr || result.error || 'unknown error'}`);
  return recordOutput(outputPath, outputName);
}

const ffmpegAvailable = spawnSync(ffmpeg, ['-version'], { encoding: 'utf8' }).status === 0;
const png = ['-frames:v', '1', '-c:v', 'png', '-compression_level', '9', '-pred', 'mixed'];
const emblem = ffmpegAvailable
  ? runFfmpeg(['-i', sourcePath, ...png], 'brand-emblem.png')
  : runConvert([sourcePath, '-strip'], 'brand-emblem.png');

if (ffmpegAvailable) {
  runFfmpeg(['-i', emblem, '-vf', 'scale=16:16:flags=lanczos', ...png], 'favicon-16.png');
  runFfmpeg(['-i', emblem, '-vf', 'scale=32:32:flags=lanczos', ...png], 'favicon-32.png');
} else {
  runConvert([emblem, '-resize', '16x16', '-strip'], 'favicon-16.png');
  runConvert([emblem, '-resize', '32x32', '-strip'], 'favicon-32.png');
}

function renderPlatformIcon(outputName, canvas, mark) {
  if (ffmpegAvailable) {
    return runFfmpeg(
      ['-f', 'lavfi', '-i', `color=c=0x02050b:s=${canvas}x${canvas}:d=1`, '-i', emblem, '-filter_complex', `[1:v]scale=${mark}:${mark}:force_original_aspect_ratio=decrease:flags=lanczos[mark];[0:v][mark]overlay=(W-w)/2:(H-h)/2`, ...png],
      outputName,
    );
  }
  return runConvert(
    ['-size', `${canvas}x${canvas}`, 'xc:#02050b', '(', emblem, '-resize', `${mark}x${mark}`, ')', '-gravity', 'center', '-composite', '-strip'],
    outputName,
  );
}

renderPlatformIcon('apple-touch-icon.png', 180, 154);
renderPlatformIcon('icon-192.png', 192, 168);
renderPlatformIcon('icon-512.png', 512, 448);
renderPlatformIcon('icon-maskable-512.png', 512, 396);
renderPlatformIcon('mstile-150x150.png', 150, 128);
if (ffmpegAvailable) {
  runFfmpeg(['-f', 'lavfi', '-i', 'color=c=0x02050b:s=1200x630:d=1', '-i', emblem, '-filter_complex', '[1:v]scale=500:500:force_original_aspect_ratio=decrease:flags=lanczos[mark];[0:v][mark]overlay=(W-w)/2:(H-h)/2', '-frames:v', '1', '-q:v', '3', '-pix_fmt', 'yuvj420p'], 'og-image.jpg');
} else if (!fs.existsSync(path.join(publicDir, 'og-image.jpg'))) {
  // A checked-in OG fallback is already valid. Avoid a platform-specific byte
  // change in a local no-FFmpeg checkout; deploys still use the FFmpeg recipe.
  runConvert(['-size', '1200x630', 'xc:#02050b', '(', emblem, '-resize', '500x500', ')', '-gravity', 'center', '-composite', '-quality', '92'], 'og-image.jpg');
}

for (const retired of [
  'brand-emblem-master.webp',
  'brand-emblem-header.png',
  'brand-emblem-primary.png',
  'brand-emblem-simplified.png',
  'brand-emblem-micro.png',
]) {
  const retiredPath = path.join(publicDir, retired);
  if (fs.existsSync(retiredPath)) fs.rmSync(retiredPath);
}
fs.rmSync(sourcePath);
fs.writeFileSync(path.join(publicDir, 'brand-release.txt'), `${RELEASE}\napproved-source=single-user-selected-transparent-reference\nsource-sha256=${SOURCE_SHA256}\nroles=single\n`);
console.log(`brand materialize: ${RELEASE}; source ${sourceBytes.length} B (${sourceHash}); ${written.join(', ')}`);
