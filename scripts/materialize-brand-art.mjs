import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve();
const sourceDir = path.join(root, 'src', 'brand-assets');
const publicDir = path.join(root, 'public');
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
fs.mkdirSync(publicDir, { recursive: true });

const atlasSources = [
  'spectral-atlas.part01.b64',
  'spectral-atlas.part02.b64',
  'spectral-atlas.part03.b64',
  'spectral-atlas.part04.b64',
  'spectral-atlas.part05.b64',
  'spectral-atlas.part06.b64',
  'spectral-atlas.part07.b64',
  'spectral-atlas.tail08-15.b64',
];

const encodedAtlas = atlasSources.map((sourceName) => {
  const sourcePath = path.join(sourceDir, sourceName);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`brand materialize: missing spectral atlas source ${sourceName}`);
  }
  return fs.readFileSync(sourcePath, 'utf8').replace(/\s+/g, '');
}).join('');

if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encodedAtlas)) {
  throw new Error('brand materialize: spectral atlas is not valid base64');
}

const atlasBytes = Buffer.from(encodedAtlas, 'base64');
if (atlasBytes.length < 10_000 || atlasBytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
  throw new Error('brand materialize: decoded spectral atlas is not a valid PNG');
}

const written = [];
const atlasPath = path.join(publicDir, 'brand-raster-atlas.png');
fs.writeFileSync(atlasPath, atlasBytes);
written.push(`brand-raster-atlas.png (${atlasBytes.length} B)`);

function runFfmpeg(args, outputName) {
  const outputPath = path.join(publicDir, outputName);
  const result = spawnSync(
    ffmpeg,
    ['-hide_banner', '-loglevel', 'error', '-y', ...args, outputPath],
    { encoding: 'utf8' },
  );

  if (result.error?.code === 'ENOENT') {
    throw new Error(
      'brand materialize: ffmpeg was not found. Install FFmpeg or set FFMPEG_PATH so the spectral brand family can be materialized.',
    );
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
const crop = (outputName, geometry) => runFfmpeg(
  ['-i', atlasPath, '-vf', `crop=${geometry}`, ...png],
  outputName,
);

const primaryPath = crop('brand-emblem-primary.png', '256:256:0:0');
const simplifiedPath = crop('brand-emblem-simplified.png', '256:256:256:0');
const microPath = crop('brand-emblem-micro.png', '128:128:512:0');
const headerPath = crop('brand-emblem-header.png', '384:256:256:256');

runFfmpeg(
  ['-i', primaryPath, '-frames:v', '1', '-c:v', 'libwebp', '-q:v', '88', '-compression_level', '6', '-pix_fmt', 'yuva420p'],
  'brand-emblem-master.webp',
);

runFfmpeg(['-i', microPath, '-vf', 'scale=16:16:flags=lanczos', ...png], 'favicon-16.png');
runFfmpeg(['-i', microPath, '-vf', 'scale=32:32:flags=lanczos', ...png], 'favicon-32.png');

function renderPaddedIcon(outputName, canvas, mark, source = simplifiedPath) {
  return runFfmpeg(
    [
      '-i', source,
      '-vf', `scale=${mark}:${mark}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${canvas}:${canvas}:(ow-iw)/2:(oh-ih)/2:color=0x02050b`,
      ...png,
    ],
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
    '[1:v]scale=900:-1:flags=lanczos[mark];[1:v]scale=900:-1:flags=lanczos,gblur=sigma=34,colorchannelmixer=aa=.42[glow];[0:v][glow]overlay=(W-w)/2:(H-h)/2[bg];[bg][mark]overlay=(W-w)/2:(H-h)/2',
    '-frames:v', '1',
    '-q:v', '3',
    '-pix_fmt', 'yuvj420p',
  ],
  'og-image.jpg',
);

console.log(`brand materialize: ${written.join(', ')}`);
