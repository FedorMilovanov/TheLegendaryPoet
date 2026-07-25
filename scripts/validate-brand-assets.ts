import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

interface BrandEntry {
  name: string;
  size: number;
  sha256: string;
  width: number;
  height: number;
  mime: string;
}

interface BrandPart {
  name: string;
  encodedLength: number;
  decodedBytes: number;
  sha256: string;
}

interface BrandManifest {
  schemaVersion: number;
  signature: string;
  generator: string;
  source: { path: string; sha256: string };
  archive: { byteLength: number; sha256: string; parts: BrandPart[] };
  entries: BrandEntry[];
}

const read = (file: string) => fs.readFileSync(path.resolve(file), 'utf8');
const readBuffer = (file: string) => fs.readFileSync(path.resolve(file));
const digest = (buffer: Buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
const sha256 = (file: string) => digest(readBuffer(file));

const component = read('src/components/BrandMark.tsx');
const emblem = read('public/brand-emblem.svg');
const maskEmblem = read('public/brand-emblem-mask.svg');
const favicon = read('public/favicon.svg');
const index = read('index.html');
const manifest = JSON.parse(read('src/brand-assets/manifest.json')) as BrandManifest;
const materializer = read('scripts/materialize-brand-art.mjs');
const rebuilder = read('scripts/rebuild-brand-assets.py');
const prerender = read('scripts/prerender-og.mjs');
const seo = read('src/hooks/useSeo.ts');
const browserconfig = read('public/browserconfig.xml');
const webManifest = JSON.parse(read('public/site.webmanifest')) as {
  icons?: Array<{ src?: string; sizes?: string; type?: string; purpose?: string }>;
};

function pngDimensions(buffer: Buffer, file: string) {
  assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${file}: invalid PNG signature`);
  assert.equal(buffer.subarray(12, 16).toString('ascii'), 'IHDR', `${file}: IHDR chunk is missing`);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function webpDimensions(buffer: Buffer, file: string) {
  assert.equal(buffer.subarray(0, 4).toString('ascii'), 'RIFF', `${file}: invalid RIFF signature`);
  assert.equal(buffer.subarray(8, 12).toString('ascii'), 'WEBP', `${file}: invalid WebP signature`);
  const chunk = buffer.subarray(12, 16).toString('ascii');
  if (chunk === 'VP8X') {
    return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
  }
  if (chunk === 'VP8L') {
    assert.equal(buffer[20], 0x2f, `${file}: invalid lossless WebP header`);
    const b1 = buffer[21];
    const b2 = buffer[22];
    const b3 = buffer[23];
    const b4 = buffer[24];
    return {
      width: 1 + b1 + ((b2 & 0x3f) << 8),
      height: 1 + ((b2 & 0xc0) >> 6) + (b3 << 2) + ((b4 & 0x0f) << 10),
    };
  }
  if (chunk === 'VP8 ') {
    for (let offset = 20; offset + 9 < buffer.length; offset += 1) {
      if (buffer[offset] === 0x9d && buffer[offset + 1] === 0x01 && buffer[offset + 2] === 0x2a) {
        return {
          width: buffer.readUInt16LE(offset + 3) & 0x3fff,
          height: buffer.readUInt16LE(offset + 5) & 0x3fff,
        };
      }
    }
  }
  assert.fail(`${file}: unsupported WebP chunk ${chunk}`);
}

function jpegDimensions(buffer: Buffer, file: string) {
  assert.equal(buffer[0], 0xff, `${file}: invalid JPEG signature`);
  assert.equal(buffer[1], 0xd8, `${file}: invalid JPEG signature`);
  let offset = 2;
  while (offset + 8 < buffer.length) {
    while (buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset];
    offset += 1;
    if (marker === 0xd8 || marker === 0xd9) continue;
    const length = buffer.readUInt16BE(offset);
    assert.ok(length >= 2 && offset + length <= buffer.length, `${file}: malformed JPEG segment`);
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { width: buffer.readUInt16BE(offset + 5), height: buffer.readUInt16BE(offset + 3) };
    }
    offset += length;
  }
  assert.fail(`${file}: JPEG dimensions are missing`);
}

function dimensions(buffer: Buffer, mime: string, file: string) {
  if (mime === 'image/png') return pngDimensions(buffer, file);
  if (mime === 'image/webp') return webpDimensions(buffer, file);
  if (mime === 'image/jpeg') return jpegDimensions(buffer, file);
  assert.fail(`${file}: unsupported manifest MIME ${mime}`);
}

assert.match(component, /useId\(\)\.replace\(\/:\/g, ''\)/, 'BrandMark must namespace SVG definition ids');
assert.match(component, /data-brand-mark/, 'BrandMark must expose a stable QA hook');
assert.match(component, /whileHover="hover"/, 'BrandMark must keep the restrained hover interaction');
assert.match(component, /data-brand-figure/, 'BrandMark deterministic raster derivative is missing');
assert.match(component, /data-brand-fallback/, 'BrandMark coded SVG source is missing');
assert.match(component, /data-brand-aura/, 'BrandMark cold aura is missing');
assert.match(component, /data-brand-mist/, 'BrandMark lower mist transition is missing');
assert.match(component, /brand-emblem-master\.webp/, 'BrandMark does not use the deterministic raster derivative');
assert.match(component, /pointerEvents: 'none'/, 'BrandMark SVG must not intercept the parent link hover/click target');
assert.doesNotMatch(component, /data-brand-(?:book|wing|halo)/, 'retired book, wing or halo hooks remain in BrandMark');
assert.doesNotMatch(component, /\sid="(?:aura|cloak|rim|void|soft|mist)"/, 'BrandMark contains collision-prone fixed SVG ids');
assert.ok(
  component.indexOf('data-brand-aura') < component.indexOf('data-brand-fallback') &&
    component.indexOf('data-brand-fallback') < component.indexOf('data-brand-figure'),
  'the aura and coded source must render before the raster derivative',
);

assert.match(emblem, /viewBox="0 0 96 96"/, 'brand-emblem.svg: canonical viewBox changed');
assert.match(emblem, /id="vector-fallback"/, 'brand-emblem.svg: coded vector source is missing');
assert.match(emblem, /brand-emblem-master\.webp/, 'brand-emblem.svg: deterministic raster derivative is not referenced');
assert.match(emblem, /M48 7 C39 9 34 19 32 31/, 'brand-emblem.svg: hood silhouette changed');
assert.doesNotMatch(emblem, /<script|<foreignObject/i, 'brand-emblem.svg: unsafe or non-portable SVG content');
assert.doesNotMatch(emblem, /(?:book|wing|halo|<circle)/i, 'brand-emblem.svg: retired emblem symbolism remains');
assert.doesNotMatch(emblem, /<rect width="96" height="96"/, 'canonical emblem must remain frameless');

assert.match(favicon, /viewBox="0 0 96 96"/, 'favicon.svg: canonical viewBox changed');
assert.match(favicon, /<rect width="96" height="96" rx="18"/, 'favicon must retain its dark safe-area tile');
assert.match(favicon, /M48 7 C39 9 34 19 32 31/, 'favicon hood silhouette changed');
assert.doesNotMatch(favicon, /<image|data:image|brand-emblem-master/i, 'favicon must be self-contained');
assert.doesNotMatch(favicon, /(?:book|wing|halo|<circle)/i, 'favicon: retired emblem symbolism remains');
assert.doesNotMatch(favicon, /<script|<foreignObject/i, 'favicon: unsafe SVG content');

assert.match(maskEmblem, /viewBox="0 0 96 96"/, 'Safari mask icon viewBox changed');
assert.match(maskEmblem, /<path fill="#000"/, 'Safari mask icon must be a monochrome vector path');
assert.doesNotMatch(maskEmblem, /<image|data:image|<circle/i, 'Safari mask icon must stay pure vector and ring-free');

assert.equal(manifest.schemaVersion, 2, 'brand manifest schema changed');
assert.equal(manifest.signature, 'LPBRAND2', 'brand archive signature changed');
assert.equal(manifest.generator, 'scripts/rebuild-brand-assets.py@2', 'brand generator contract changed');
assert.equal(manifest.source.path, 'public/brand-emblem.svg', 'brand source path changed');
assert.equal(manifest.source.sha256, sha256(manifest.source.path), 'brand source digest drifted from the manifest');
assert.match(rebuilder, /cairosvg==2\.8\.2/, 'brand rebuilder no longer documents the pinned CairoSVG version');
assert.match(rebuilder, /pillow==11\.3\.0/, 'brand rebuilder no longer documents the pinned Pillow version');
assert.match(rebuilder, /LPBRAND2/, 'brand rebuilder archive signature changed');
assert.match(materializer, /manifest\.json/, 'brand materializer no longer reads the integrity manifest');
assert.match(materializer, /complete archive integrity mismatch/, 'brand materializer does not verify the full archive');
assert.match(materializer, /decoded integrity mismatch/, 'brand materializer does not verify each encoded part');
assert.match(materializer, /flag: 'wx'/, 'brand materializer no longer stages exclusive temporary files');

const expectedSpecs = new Map<string, { width: number; height: number; mime: string }>([
  ['brand-emblem-master.webp', { width: 512, height: 512, mime: 'image/webp' }],
  ['favicon-16.png', { width: 16, height: 16, mime: 'image/png' }],
  ['favicon-32.png', { width: 32, height: 32, mime: 'image/png' }],
  ['apple-touch-icon.png', { width: 180, height: 180, mime: 'image/png' }],
  ['icon-192.png', { width: 192, height: 192, mime: 'image/png' }],
  ['icon-512.png', { width: 512, height: 512, mime: 'image/png' }],
  ['icon-maskable-512.png', { width: 512, height: 512, mime: 'image/png' }],
  ['mstile-150x150.png', { width: 150, height: 150, mime: 'image/png' }],
  ['og-image.jpg', { width: 1200, height: 630, mime: 'image/jpeg' }],
]);
assert.deepEqual(
  manifest.entries.map((entry) => entry.name).sort(),
  [...expectedSpecs.keys()].sort(),
  'brand manifest file inventory changed',
);

for (const entry of manifest.entries) {
  const expected = expectedSpecs.get(entry.name);
  assert.ok(expected, `${entry.name}: unexpected manifest entry`);
  assert.equal(entry.width, expected.width, `${entry.name}: manifest width changed`);
  assert.equal(entry.height, expected.height, `${entry.name}: manifest height changed`);
  assert.equal(entry.mime, expected.mime, `${entry.name}: manifest MIME changed`);
  const file = `public/${entry.name}`;
  const buffer = readBuffer(file);
  assert.equal(buffer.length, entry.size, `${entry.name}: generated size does not match manifest`);
  assert.equal(digest(buffer), entry.sha256, `${entry.name}: generated SHA-256 does not match manifest`);
  assert.deepEqual(dimensions(buffer, entry.mime, entry.name), expected, `${entry.name}: decoded dimensions changed`);
}

assert.ok(manifest.archive.parts.length >= 2, 'brand archive must remain split into multiple independently verifiable parts');
const decodedParts: Buffer[] = [];
for (const [index, part] of manifest.archive.parts.entries()) {
  const expectedName = `assets.part${String(index + 1).padStart(2, '0')}.b64`;
  assert.equal(part.name, expectedName, 'brand part sequence contains a gap or reorder');
  const encoded = read(`src/brand-assets/${part.name}`).replace(/\s+/g, '');
  assert.equal(encoded.length, part.encodedLength, `${part.name}: encoded length changed`);
  assert.equal(encoded.length % 4, 0, `${part.name}: invalid base64 length`);
  assert.match(encoded, /^[A-Za-z0-9+/]*={0,2}$/, `${part.name}: invalid base64 alphabet`);
  const bytes = Buffer.from(encoded, 'base64');
  assert.equal(bytes.toString('base64'), encoded, `${part.name}: non-canonical base64`);
  assert.equal(bytes.length, part.decodedBytes, `${part.name}: decoded length changed`);
  assert.equal(digest(bytes), part.sha256, `${part.name}: decoded SHA-256 changed`);
  decodedParts.push(bytes);
}
const archive = Buffer.concat(decodedParts);
assert.equal(archive.length, manifest.archive.byteLength, 'complete brand archive length changed');
assert.equal(digest(archive), manifest.archive.sha256, 'complete brand archive SHA-256 changed');
assert.equal(archive.subarray(0, 'LPBRAND2\n'.length).toString('ascii'), 'LPBRAND2\n', 'complete brand archive signature changed');

for (const pathName of [
  'brand-emblem-master.webp',
  'favicon.svg',
  'favicon-16.png',
  'favicon-32.png',
  'apple-touch-icon.png',
  'brand-emblem-mask.svg',
  'icon-512.png',
  'og-image.jpg',
  'site.webmanifest',
  'browserconfig.xml',
]) {
  assert.ok(index.includes(pathName), `index.html does not reference ${pathName}`);
}
assert.match(
  index,
  /<link rel="preload" href="%BASE_URL%brand-emblem-master\.webp" as="image" type="image\/webp" fetchpriority="high" \/>/,
  'the deterministic emblem derivative must be preloaded to avoid a header flash',
);
assert.doesNotMatch(index, /(?:с раскрытой книгой|og-image\.png|brand-emblem-master\.webp" \/>\s*<meta property="og:image)/, 'retired brand metadata remains in index.html');
assert.match(index, /og:image:type" content="image\/jpeg"/, 'Open Graph image MIME type must use the JPEG share card');
assert.match(prerender, /og-image\.jpg/g, 'prerender default does not use the share card');
assert.doesNotMatch(prerender, /og-image\.png|brand-emblem-master\.webp/, 'prerender still references retired share defaults');
assert.match(seo, /image \|\| '\/og-image\.jpg'/, 'runtime SEO default does not use the share card');
assert.match(seo, /logo: \{ '@type': 'ImageObject', url: `\$\{siteConfig\.url\}\/icon-512\.png` \}/, 'runtime publisher logo is not the platform icon');
assert.doesNotMatch(seo, /og-image\.png/, 'runtime SEO still references the retired share card');

const iconSources = new Set((webManifest.icons || []).map((icon) => icon.src));
for (const src of ['/favicon.svg', '/icon-192.png', '/icon-512.png', '/icon-maskable-512.png']) {
  assert.ok(iconSources.has(src), `manifest is missing ${src}`);
}
assert.ok(
  webManifest.icons?.some((icon) => icon.src === '/icon-maskable-512.png' && icon.type === 'image/png' && icon.purpose === 'maskable'),
  'manifest maskable artwork is missing',
);
assert.match(browserconfig, /mstile-150x150\.png/, 'Windows tile does not use the canonical emblem');
assert.equal(fs.existsSync(path.resolve('public/og-image.png')), false, 'retired PNG share card must be removed');

console.log('brand validation: vector SSOT, deterministic derivatives, manifest, archive parts, preload and platform assets are consistent');
