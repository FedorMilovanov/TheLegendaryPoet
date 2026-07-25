import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve();
const sourceDir = path.join(root, 'src', 'brand-assets');
const publicDir = path.join(root, 'public');
fs.mkdirSync(publicDir, { recursive: true });

const sourceAssets = [
  ['master-320-q92.webp.b64', 'brand-emblem-master.webp'],
  ['favicon-16.png.b64', 'favicon-16.png'],
  ['favicon-32.png.b64', 'favicon-32.png'],
];

const written = [];

for (const [sourceName, outputName] of sourceAssets) {
  const sourcePath = path.join(sourceDir, sourceName);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`brand materialize: missing encoded source ${sourceName}`);
  }

  const encoded = fs.readFileSync(sourcePath, 'utf8').replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
    throw new Error(`brand materialize: invalid base64 source ${sourceName}`);
  }

  const binary = Buffer.from(encoded, 'base64');
  if (binary.length < 100) {
    throw new Error(`brand materialize: decoded asset is unexpectedly small ${outputName}`);
  }

  fs.writeFileSync(path.join(publicDir, outputName), binary);
  written.push(`${outputName} (${binary.length} B)`);
}

const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const masterPath = path.join(publicDir, 'brand-emblem-master.webp');

function render(outputName, args) {
  const outputPath = path.join(publicDir, outputName);
  const result = spawnSync(
    ffmpeg,
    ['-hide_banner', '-loglevel', 'error', '-y', '-i', masterPath, ...args, outputPath],
    { encoding: 'utf8' },
  );

  if (result.error?.code === 'ENOENT') {
    throw new Error(
      `brand materialize: ffmpeg was not found. Install FFmpeg or set FFMPEG_PATH so platform icons can be derived from the approved master artwork.`,
    );
  }
  if (result.status !== 0) {
    throw new Error(`brand materialize: ffmpeg failed for ${outputName}: ${result.stderr || result.error || 'unknown error'}`);
  }

  const size = fs.statSync(outputPath).size;
  if (size < 500) throw new Error(`brand materialize: generated asset is unexpectedly small ${outputName}`);
  written.push(`${outputName} (${size} B)`);
}

const png = ['-frames:v', '1', '-c:v', 'png', '-compression_level', '9', '-pred', 'mixed'];
render('apple-touch-icon.png', ['-vf', 'scale=180:180:flags=lanczos', ...png]);
render('icon-192.png', ['-vf', 'scale=192:192:flags=lanczos', ...png]);
render('icon-512.png', ['-vf', 'scale=512:512:flags=lanczos', ...png]);
render('icon-maskable-512.png', [
  '-vf',
  'scale=430:430:flags=lanczos,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x02050b',
  ...png,
]);
render('mstile-150x150.png', ['-vf', 'scale=150:150:flags=lanczos', ...png]);
render('og-image.jpg', [
  '-filter_complex',
  '[0:v]scale=1200:1200:flags=lanczos,crop=1200:630,gblur=sigma=24,eq=brightness=-0.38[bg];[0:v]scale=630:630:flags=lanczos[fg];[bg][fg]overlay=(W-w)/2:0',
  '-frames:v',
  '1',
  '-q:v',
  '3',
  '-pix_fmt',
  'yuvj420p',
]);

console.log(`brand materialize: ${written.join(', ')}`);
