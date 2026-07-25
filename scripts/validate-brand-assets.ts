import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const read = (file: string) => fs.readFileSync(path.resolve(file), 'utf8');
const readBuffer = (file: string) => fs.readFileSync(path.resolve(file));
const sha256 = (file: string) => crypto.createHash('sha256').update(readBuffer(file)).digest('hex');

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngSize(file: string) {
  const buffer = readBuffer(file);
  assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${file}: invalid PNG signature`);

  let offset = 8;
  let dimensions: { width: number; height: number } | null = null;
  let sawIend = false;

  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    const dataEnd = offset + 8 + length;
    const chunkEnd = dataEnd + 4;
    assert.ok(chunkEnd <= buffer.length, `${file}: truncated ${type || 'unknown'} chunk`);
    assert.equal(
      crc32(buffer.subarray(offset + 4, dataEnd)),
      buffer.readUInt32BE(dataEnd),
      `${file}: invalid ${type} CRC`,
    );
    if (type === 'IHDR') {
      assert.equal(length, 13, `${file}: invalid IHDR length`);
      dimensions = {
        width: buffer.readUInt32BE(offset + 8),
        height: buffer.readUInt32BE(offset + 12),
      };
    }
    offset = chunkEnd;
    if (type === 'IEND') {
      assert.equal(length, 0, `${file}: invalid IEND length`);
      sawIend = true;
      break;
    }
  }

  assert.ok(dimensions, `${file}: IHDR chunk is missing`);
  assert.ok(sawIend, `${file}: IEND chunk is missing`);
  assert.equal(offset, buffer.length, `${file}: trailing bytes after IEND`);
  return dimensions;
}

function jpegSize(file: string) {
  const buffer = readBuffer(file);
  assert.ok(buffer.length >= 12, `${file}: truncated JPEG`);
  assert.equal(buffer[0], 0xff, `${file}: invalid JPEG signature`);
  assert.equal(buffer[1], 0xd8, `${file}: invalid JPEG signature`);

  const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;

  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    while (offset < buffer.length && buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset];
    if (marker === undefined) break;

    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 1;
      continue;
    }
    if (marker === 0xda) break;

    assert.ok(offset + 2 < buffer.length, `${file}: malformed JPEG segment`);
    const length = buffer.readUInt16BE(offset + 1);
    assert.ok(length >= 2 && offset + 1 + length <= buffer.length, `${file}: malformed JPEG segment length`);

    if (sofMarkers.has(marker)) {
      return {
        height: buffer.readUInt16BE(offset + 4),
        width: buffer.readUInt16BE(offset + 6),
      };
    }

    offset += 1 + length;
  }

  throw new Error(`${file}: JPEG dimensions not found`);
}

const component = read('src/components/BrandMark.tsx');
const index = read('index.html');
const manifest = JSON.parse(read('public/site.webmanifest')) as {
  icons?: Array<{ src?: string; sizes?: string; type?: string; purpose?: string }>;
};
const browserconfig = read('public/browserconfig.xml');
const materializer = read('scripts/materialize-brand-art.mjs');
const standaloneSvg = read('public/brand-emblem.svg');
const release = read('public/brand-release.txt');

const version = 'cloak-20260725-4';
const masterSha256 = 'f9e29065cc7191827750d252ecb8b8002385671faed5a4503dd2738065f661b7';

assert.match(component, /useId\(\)\.replace\(\/:\/g, ''\)/, 'BrandMark must keep a unique accessible title id');
assert.match(component, /data-brand-mark/, 'BrandMark must expose a stable QA hook');
assert.match(component, /data-brand-version=\{BRAND_VERSION\}/, 'BrandMark cache version hook is missing');
assert.match(component, /whileHover="hover"/, 'BrandMark must keep the restrained hover interaction');
assert.match(component, /data-brand-figure/, 'BrandMark selected cloaked figure is missing');
assert.match(component, /data-brand-glow/, 'BrandMark premium glow layer is missing');
assert.match(
  component,
  /brand-emblem-master\.webp\?v=\$\{BRAND_VERSION\}/,
  'BrandMark does not use the versioned owner-approved master artwork',
);
assert.match(component, /pointerEvents: 'none'/, 'BrandMark SVG must not intercept the parent link target');
assert.doesNotMatch(component, /data-brand-fallback/, 'the retired substitute vector figure remains in BrandMark');
assert.doesNotMatch(component, /data-brand-(?:book|wing|halo|mist|aura)/, 'retired emblem layers remain in BrandMark');
assert.doesNotMatch(component, /<path|<circle|<ellipse|<polygon/, 'BrandMark must not redraw a different character over the selected artwork');

assert.match(index, new RegExp(`name="brand-release" content="${version}"`), 'live release marker is missing');
assert.match(
  index,
  new RegExp(`brand-emblem-master\\.webp\\?v=${version}`),
  'the approved master preload is not cache-versioned',
);
assert.match(index, new RegExp(`favicon-32\\.png\\?v=${version}`), '32px favicon is not cache-versioned');
assert.match(index, new RegExp(`favicon-16\\.png\\?v=${version}`), '16px favicon is not cache-versioned');
assert.match(index, new RegExp(`apple-touch-icon\\.png\\?v=${version}`), 'Apple icon is not cache-versioned');
assert.match(index, new RegExp(`brand-emblem-mask\\.svg\\?v=${version}`), 'Safari mask is not cache-versioned');
assert.match(index, new RegExp(`site\\.webmanifest\\?v=${version}`), 'manifest link is not cache-versioned');
assert.doesNotMatch(index, /rel="icon"[^>]+favicon\.svg/, 'the retired SVG favicon is still preferred by browsers');
assert.match(index, new RegExp(`og-image\\.jpg\\?v=${version}`), 'Open Graph image is not cache-versioned');
assert.match(index, /og:image:type" content="image\/jpeg"/, 'Open Graph MIME type must remain JPEG');
assert.match(index, new RegExp(`icon-512\\.png\\?v=${version}`), 'structured-data logo is not cache-versioned');

assert.match(standaloneSvg, new RegExp(`brand-emblem-master\\.webp\\?v=${version}`), 'standalone SVG does not use the approved master');
assert.doesNotMatch(standaloneSvg, /<(?:path|circle|ellipse|polygon|polyline)\b/, 'standalone SVG still contains a retired substitute character');
assert.equal(fs.existsSync(path.resolve('public/favicon.svg')), false, 'obsolete fallback favicon.svg must not be published');
assert.equal(
  release.trim(),
  `${version}\nmaster-sha256=${masterSha256}`,
  'brand release sentinel does not match the selected artwork',
);

const iconSources = new Set((manifest.icons || []).map((icon) => icon.src));
for (const src of [
  `/favicon-32.png?v=${version}`,
  `/icon-192.png?v=${version}`,
  `/icon-512.png?v=${version}`,
  `/icon-maskable-512.png?v=${version}`,
]) {
  assert.ok(iconSources.has(src), `manifest is missing ${src}`);
}
assert.ok(
  manifest.icons?.some(
    (icon) =>
      icon.src === `/icon-maskable-512.png?v=${version}` &&
      icon.type === 'image/png' &&
      icon.purpose === 'maskable',
  ),
  'manifest maskable selected artwork is missing',
);
assert.match(browserconfig, new RegExp(`mstile-150x150\\.png\\?v=${version}`), 'Windows tile is not cache-versioned');

for (const source of ['master-320-q92.webp.b64', 'favicon-16.png.b64', 'favicon-32.png.b64']) {
  assert.match(materializer, new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `materializer is missing ${source}`);
  assert.ok(fs.existsSync(path.resolve('src/brand-assets', source)), `encoded source ${source} is missing`);
}
assert.doesNotMatch(materializer, /LPBRAND1|assets\.part/, 'the retired truncated archive reader remains active');
assert.match(materializer, /spawnSync/, 'platform assets are no longer generated from the approved master');
assert.match(materializer, /ffmpeg/i, 'FFmpeg image pipeline is missing');

for (const output of [
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'mstile-150x150.png',
  'og-image.jpg',
]) {
  assert.match(materializer, new RegExp(output.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `materializer does not create ${output}`);
}

const expectedHashes: Record<string, string> = {
  'public/brand-emblem-master.webp': masterSha256,
  'public/favicon-16.png': 'b613d63da2b88f9c798ec171173fa86aa6d48aea5e59da7d64cce18ff4a8cd9c',
  'public/favicon-32.png': '27880a89ca75ef4ba8d8e21243cd189846e3213cd487fc921761965ec2d55622',
};
for (const [file, expected] of Object.entries(expectedHashes)) {
  assert.equal(sha256(file), expected, `${file}: selected-reference asset changed or the old emblem returned`);
}

const expectedPngSizes: Record<string, { width: number; height: number }> = {
  'public/favicon-16.png': { width: 16, height: 16 },
  'public/favicon-32.png': { width: 32, height: 32 },
  'public/apple-touch-icon.png': { width: 180, height: 180 },
  'public/icon-192.png': { width: 192, height: 192 },
  'public/icon-512.png': { width: 512, height: 512 },
  'public/icon-maskable-512.png': { width: 512, height: 512 },
  'public/mstile-150x150.png': { width: 150, height: 150 },
};
const minimumPngBytes: Record<string, number> = {
  'public/favicon-16.png': 250,
  'public/favicon-32.png': 500,
  'public/apple-touch-icon.png': 5_000,
  'public/icon-192.png': 5_000,
  'public/icon-512.png': 20_000,
  'public/icon-maskable-512.png': 20_000,
  'public/mstile-150x150.png': 5_000,
};
for (const [file, expected] of Object.entries(expectedPngSizes)) {
  assert.deepEqual(pngSize(file), expected, `${file}: generated dimensions are wrong`);
  assert.ok(
    fs.statSync(path.resolve(file)).size >= minimumPngBytes[file],
    `${file}: generated asset is unexpectedly small`,
  );
}

assert.deepEqual(jpegSize('public/og-image.jpg'), { width: 1200, height: 630 }, 'public/og-image.jpg: generated dimensions are wrong');
assert.ok(fs.statSync(path.resolve('public/og-image.jpg')).size > 5_000, 'public/og-image.jpg: generated share preview is unexpectedly small');
assert.equal(fs.existsSync(path.resolve('public/og-image.png')), false, 'retired PNG share card must be removed');

console.log('brand validation: deterministic approved artwork, CRC-checked platform assets, clean SVG and live release sentinel are consistent');
