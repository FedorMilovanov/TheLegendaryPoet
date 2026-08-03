import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve();
const publicDir = path.join(root, 'public');
const approvedDir = path.join(root, 'qa', 'reference', 'approved-brand');
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const RELEASE = 'approved-rgba-20260803-1';

const approved = {
  header: {
    source: 'header-rgba.png.b64',
    output: 'brand-emblem-header.png',
    sha256: '4c33e0bed07a86356e35ec8c8d0b5a16cd5c690ae763f14062d255a0762416f9',
  },
  primary: {
    source: 'primary-rgba.png.b64',
    output: 'brand-emblem-primary.png',
    sha256: 'a44ed31b02ae6cd22d17ef96bce24e6ec1a4b85b49df74bc2fbc85826f7a46be',
  },
  simplified: {
    source: 'simplified-rgba.png.b64',
    output: 'brand-emblem-simplified.png',
    sha256: 'e2d40570733eb4e3a332fe955a74815b05a7c6ff7481b135afd385c99636a8a7',
  },
  micro: {
    source: 'micro-rgba.png.b64',
    output: 'brand-emblem-micro.png',
    sha256: 'def54ca3c95795937743737bd12767d33d48c8979b0d7600178f8cf2d445d6e5',
  },
};

fs.mkdirSync(publicDir, { recursive: true });

const digest = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const written = [];
const materialized = {};

for (const [role, item] of Object.entries(approved)) {
  const sourcePath = path.join(approvedDir, item.source);
  if (!fs.existsSync(sourcePath)) throw new Error(`brand materialize: approved ${role} source is missing`);
  const encoded = fs.readFileSync(sourcePath, 'utf8').replace(/\s+/g, '');
  const bytes = Buffer.from(encoded, 'base64');
  if (!bytes.subarray(0, 8).equals(pngSignature)) throw new Error(`brand materialize: ${role} is not a PNG`);
  const actualHash = digest(bytes);
  if (actualHash !== item.sha256) {
    throw new Error(`brand materialize: approved ${role} integrity mismatch (${actualHash})`);
  }
  const outputPath = path.join(publicDir, item.output);
  fs.writeFileSync(outputPath, bytes);
  materialized[role] = outputPath;
  written.push(`${item.output} (${bytes.length} B, ${actualHash})`);
}

function runFfmpeg(args, outputName) {
  const outputPath = path.join(publicDir, outputName);
  const result = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args, outputPath], { encoding: 'utf8' });
  if (result.error?.code === 'ENOENT') throw new Error('brand materialize: FFmpeg was not found');
  if (result.status !== 0) throw new Error(`brand materialize: FFmpeg failed for ${outputName}: ${result.stderr || result.error || 'unknown error'}`);
  const size = fs.statSync(outputPath).size;
  if (size < 180) throw new Error(`brand materialize: generated asset is unexpectedly small ${outputName}`);
  written.push(`${outputName} (${size} B)`);
  return outputPath;
}

const png = ['-frames:v', '1', '-c:v', 'png', '-compression_level', '9', '-pred', 'mixed'];
runFfmpeg(['-i', materialized.primary, '-frames:v', '1', '-c:v', 'libwebp', '-lossless', '1', '-compression_level', '6', '-pix_fmt', 'yuva420p'], 'brand-emblem-master.webp');
runFfmpeg(['-i', materialized.micro, '-vf', 'scale=16:16:flags=lanczos', ...png], 'favicon-16.png');
runFfmpeg(['-i', materialized.micro, '-vf', 'scale=32:32:flags=lanczos', ...png], 'favicon-32.png');

function renderPlatformIcon(outputName, canvas, mark, source = materialized.simplified) {
  return runFfmpeg(
    ['-f', 'lavfi', '-i', `color=c=0x02050b:s=${canvas}x${canvas}:d=1`, '-i', source, '-filter_complex', `[1:v]scale=${mark}:${mark}:force_original_aspect_ratio=decrease:flags=lanczos[mark];[0:v][mark]overlay=(W-w)/2:(H-h)/2`, ...png],
    outputName,
  );
}

renderPlatformIcon('apple-touch-icon.png', 180, 154);
renderPlatformIcon('icon-192.png', 192, 168);
renderPlatformIcon('icon-512.png', 512, 448);
renderPlatformIcon('icon-maskable-512.png', 512, 396);
renderPlatformIcon('mstile-150x150.png', 150, 128);
runFfmpeg(['-f', 'lavfi', '-i', 'color=c=0x02050b:s=1200x630:d=1', '-i', materialized.header, '-filter_complex', '[1:v]scale=620:-1:flags=lanczos[mark];[0:v][mark]overlay=(W-w)/2:(H-h)/2', '-frames:v', '1', '-q:v', '3', '-pix_fmt', 'yuvj420p'], 'og-image.jpg');

fs.writeFileSync(path.join(publicDir, 'brand-release.txt'), `${RELEASE}\napproved-source=generated-transparent-rgba-family\nroles=header,primary,simplified,micro\n`);
console.log(`brand materialize: ${RELEASE}; ${written.join(', ')}`);
