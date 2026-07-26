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
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
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
    assert.equal(crc32(buffer.subarray(offset + 4, dataEnd)), buffer.readUInt32BE(dataEnd), `${file}: invalid ${type} CRC`);
    if (type === 'IHDR') dimensions = { width: buffer.readUInt32BE(offset + 8), height: buffer.readUInt32BE(offset + 12) };
    offset = chunkEnd;
    if (type === 'IEND') { sawIend = true; break; }
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
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    while (offset < buffer.length && buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset];
    if (marker === undefined) break;
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { offset += 1; continue; }
    if (marker === 0xda) break;
    const length = buffer.readUInt16BE(offset + 1);
    assert.ok(length >= 2 && offset + 1 + length <= buffer.length, `${file}: malformed JPEG segment`);
    if (sofMarkers.has(marker)) return { height: buffer.readUInt16BE(offset + 4), width: buffer.readUInt16BE(offset + 6) };
    offset += 1 + length;
  }
  throw new Error(`${file}: JPEG dimensions not found`);
}

function assertCompleteSvg(source: string, file: string, viewBox: string) {
  assert.match(source, new RegExp(`<svg\\b[^>]*viewBox="${viewBox.replaceAll(' ', '\\s+')}"`), `${file}: SVG root or viewBox changed`);
  assert.ok(source.trimEnd().endsWith('</svg>'), `${file}: closing </svg> is missing`);
  assert.equal((source.match(/<svg\b/g) || []).length, (source.match(/<\/svg>/g) || []).length, `${file}: unbalanced svg tags`);
  assert.equal((source.match(/<defs\b/g) || []).length, (source.match(/<\/defs>/g) || []).length, `${file}: unbalanced defs tags`);
  assert.equal((source.match(/<g(?:\s|>)/g) || []).length, (source.match(/<\/g>/g) || []).length, `${file}: unbalanced group tags`);
  assert.doesNotMatch(source, /&(?!amp;|lt;|gt;|quot;|apos;)/, `${file}: unescaped ampersand`);
  assert.doesNotMatch(source, /<[^>]+\sdata-brand-[\w-]+(?=\s|>)(?!\s*=)/, `${file}: valueless data-brand attribute breaks XML decoding`);
}

const component = read('src/components/BrandMark.tsx');
const index = read('index.html');
const manifest = JSON.parse(read('public/site.webmanifest')) as { icons?: Array<{ src?: string; sizes?: string; type?: string; purpose?: string }> };
const browserconfig = read('public/browserconfig.xml');
const materializer = read('scripts/materialize-brand-art.mjs');
const standaloneSvg = read('public/brand-emblem.svg');
const microSvg = read('public/brand-mark-micro.svg');
const maskSvg = read('public/brand-emblem-mask.svg');
const release = read('public/brand-release.txt');
const version = 'cloak-20260726-8';
const masterSha256 = 'f9e29065cc7191827750d252ecb8b8002385671faed5a4503dd2738065f661b7';

assert.match(component, /useId\(\)\.replace\(\/:\/g, ''\)/, 'BrandMark must keep unique SVG ids');
assert.match(component, /useReducedMotion\(\)/, 'BrandMark must respect reduced motion');
for (const hook of ['data-brand-mark', 'data-brand-vector', 'data-brand-figure', 'data-brand-hood', 'data-brand-cloak', 'data-brand-face-void', 'data-brand-rim-light', 'data-brand-folds', 'data-brand-collar', 'data-brand-atmosphere', 'data-brand-energy', 'data-brand-texture']) assert.match(component, new RegExp(hook), `${hook} is missing`);
assert.match(component, /data-brand-version=\{BRAND_VERSION\}/, 'BrandMark release hook is missing');
assert.match(component, /data-brand-renderer="inline-vector"/, 'BrandMark must declare its vector renderer');
assert.match(component, /data-brand-vector-source="reference-derived-contours-v8-5"/, 'v8.5 contour provenance is missing');
assert.match(component, /pointerEvents: 'none'/, 'BrandMark SVG must not intercept its parent link');
assert.match(component, /sm: 'h-12 w-12'/, 'small optical mark must retain the larger footprint');
assert.match(component, /const cloakPath = 'M48 41\.2C37\.2 40\.8/, 'runtime mantle geometry changed');
assert.match(component, /const hoodPath = 'M48 8\.6C41\.1 10\.4/, 'runtime hood geometry changed');
assert.match(component, /const voidPath = 'M48\.3 20\.8C40\.3 20\.9/, 'runtime face void geometry changed');
assert.match(component, /const foldPaths = \[/, 'runtime fold system is missing');
assert.match(component, /const rimPaths = \[/, 'runtime broken-rim system is missing');
assert.ok((component.match(/\['M/g) || []).length >= 40, 'runtime SVG lost layered path data');
assert.doesNotMatch(component, /<(?:motion\.)?image\b|<img\b|data:image|base64,/i, 'BrandMark embeds raster artwork');
assert.doesNotMatch(component, /brand-emblem-master\.webp|<rect\b|data-brand-light-core|coreGradientId|data-brand-(?:book|wing|halo|fallback)/, 'retired or raster concept returned');

assertCompleteSvg(standaloneSvg, 'public/brand-emblem.svg', '0 0 96 96');
assert.match(standaloneSvg, /data-brand-vector-source="reference-derived-contours-v8-5"/, 'standalone contour provenance is missing');
assert.match(standaloneSvg, /id="mist"/, 'standalone SVG lost atmospheric depth');
assert.match(standaloneSvg, /id="glow"/, 'standalone SVG lost contour glow');
assert.match(standaloneSvg, /M48 41\.2C37\.2 40\.8/, 'standalone mantle geometry changed');
assert.match(standaloneSvg, /M48 8\.6C41\.1 10\.4/, 'standalone hood geometry changed');
assert.match(standaloneSvg, /M48\.3 20\.8C40\.3 20\.9/, 'standalone face void changed');
assert.ok((standaloneSvg.match(/<path\b/g) || []).length >= 52, 'standalone SVG lost layered path depth');
assert.doesNotMatch(standaloneSvg, /<(?:image|rect)\b|data:image|base64,|id="core"|49\.5L51\.5 57|7fecff/i, 'standalone SVG contains raster, plate or retired crystal');

assertCompleteSvg(microSvg, 'public/brand-mark-micro.svg', '0 0 32 32');
assert.match(microSvg, /M5\.6 16\.4C3 18\.2/, 'micro mantle geometry changed');
assert.match(microSvg, /M16 3C13\.7 3\.8/, 'micro hood geometry changed');
assert.match(microSvg, /M16\.1 7C13\.4 7/, 'micro face void geometry changed');
assert.ok((microSvg.match(/<path\b/g) || []).length >= 14, 'micro mark lost its optical layers');
assert.doesNotMatch(microSvg, /<(?:image|rect)\b|data:image|base64,|7fecff|f2ffff|17\.6 1\.65 3\.4/i, 'micro mark contains raster, plate or retired crystal');

assertCompleteSvg(maskSvg, 'public/brand-emblem-mask.svg', '0 0 96 96');
assert.match(maskSvg, /fill-rule="evenodd"/, 'Safari mask must preserve the faceless opening');
assert.match(maskSvg, /M48 8\.6C41\.1 10\.4/, 'Safari mask must preserve the hood');
assert.match(maskSvg, /M48\.3 20\.8C40\.3 20\.9/, 'Safari mask must preserve the face opening');
assert.match(maskSvg, /C16\.6 95\.6 31\.9 95\.8 48 96/, 'Safari mask must preserve the broad mantle');
assert.doesNotMatch(maskSvg, /<(?:image|rect)\b|data:image|base64,/i, 'Safari mask embeds raster art or a plate');

for (const pattern of [`name="brand-release" content="${version}"`, `brand-mark-micro\\.svg\\?v=${version}`, `favicon-32\\.png\\?v=${version}`, `favicon-16\\.png\\?v=${version}`, `apple-touch-icon\\.png\\?v=${version}`, `brand-emblem-mask\\.svg\\?v=${version}`, `site\\.webmanifest\\?v=${version}`, `og-image\\.jpg\\?v=${version}`, `icon-512\\.png\\?v=${version}`]) assert.match(index, new RegExp(pattern), `index cache identity missing: ${pattern}`);
assert.doesNotMatch(index, /rel="preload"[^>]+brand-emblem-master\.webp/, 'inline vector must not preload the retired runtime raster');
assert.match(index, /og:image:type" content="image\/jpeg"/, 'Open Graph MIME type must remain JPEG');
assert.equal(release.trim(), `${version}\nmaster-sha256=${masterSha256}`, 'brand release sentinel or preserved platform master changed unexpectedly');

const iconSources = new Set((manifest.icons || []).map((icon) => icon.src));
for (const src of [`/favicon-32.png?v=${version}`, `/icon-192.png?v=${version}`, `/icon-512.png?v=${version}`, `/icon-maskable-512.png?v=${version}`]) assert.ok(iconSources.has(src), `manifest is missing ${src}`);
assert.ok(manifest.icons?.some((icon) => icon.src === `/icon-maskable-512.png?v=${version}` && icon.type === 'image/png' && icon.purpose === 'maskable'), 'manifest maskable artwork is missing');
assert.match(browserconfig, new RegExp(`mstile-150x150\\.png\\?v=${version}`), 'Windows tile is not cache-versioned');
for (const source of ['master-320-q92.webp.b64', 'favicon-16.png.b64', 'favicon-32.png.b64']) {
  assert.match(materializer, new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `materializer is missing ${source}`);
  assert.ok(fs.existsSync(path.resolve('src/brand-assets', source)), `encoded source ${source} is missing`);
}
assert.match(materializer, /spawnSync/, 'platform asset materializer is missing');
assert.match(materializer, /ffmpeg/i, 'FFmpeg image pipeline is missing');
const expectedHashes: Record<string, string> = { 'public/brand-emblem-master.webp': masterSha256, 'public/favicon-16.png': 'b613d63da2b88f9c798ec171173fa86aa6d48aea5e59da7d64cce18ff4a8cd9c', 'public/favicon-32.png': '27880a89ca75ef4ba8d8e21243cd189846e3213cd487fc921761965ec2d55622' };
for (const [file, expected] of Object.entries(expectedHashes)) assert.equal(sha256(file), expected, `${file}: preserved platform fallback changed`);
const expectedPngSizes: Record<string, { width: number; height: number }> = { 'public/favicon-16.png': { width: 16, height: 16 }, 'public/favicon-32.png': { width: 32, height: 32 }, 'public/apple-touch-icon.png': { width: 180, height: 180 }, 'public/icon-192.png': { width: 192, height: 192 }, 'public/icon-512.png': { width: 512, height: 512 }, 'public/icon-maskable-512.png': { width: 512, height: 512 }, 'public/mstile-150x150.png': { width: 150, height: 150 } };
const minimumPngBytes: Record<string, number> = { 'public/favicon-16.png': 250, 'public/favicon-32.png': 500, 'public/apple-touch-icon.png': 5_000, 'public/icon-192.png': 5_000, 'public/icon-512.png': 20_000, 'public/icon-maskable-512.png': 20_000, 'public/mstile-150x150.png': 5_000 };
for (const [file, expected] of Object.entries(expectedPngSizes)) { assert.deepEqual(pngSize(file), expected, `${file}: generated dimensions are wrong`); assert.ok(fs.statSync(path.resolve(file)).size >= minimumPngBytes[file], `${file}: generated asset is unexpectedly small`); }
assert.deepEqual(jpegSize('public/og-image.jpg'), { width: 1200, height: 630 }, 'share image dimensions are wrong');
assert.ok(fs.statSync(path.resolve('public/og-image.jpg')).size > 5_000, 'share preview is unexpectedly small');
assert.equal(fs.existsSync(path.resolve('public/og-image.png')), false, 'retired PNG share card must stay removed');
console.log('brand validation: v8.5 reference-shaped hood, broad mantle, optical micro mark and platform fallbacks are consistent');
