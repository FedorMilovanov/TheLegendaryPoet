import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

interface ApprovedSource {
  source: string;
  output: string;
  mime: string;
  width: number;
  height: number;
  bytes: number;
  sha256: string;
}

interface ApprovedOutput {
  name: string;
  mime: string;
  width: number;
  height: number;
  bytes: number;
  sha256: string;
  derivedFrom: string;
}

interface ApprovedManifest {
  schemaVersion: number;
  brandVersion: string;
  generator: string;
  pillow: string;
  sources: ApprovedSource[];
  outputs: ApprovedOutput[];
}

const read = (file: string) => fs.readFileSync(path.resolve(file), 'utf8');
const readBuffer = (file: string) => fs.readFileSync(path.resolve(file));
const digest = (buffer: Buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
const sha256 = (file: string) => digest(readBuffer(file));

const component = read('src/components/BrandMark.tsx');
const index = read('index.html');
const webManifest = JSON.parse(read('public/site.webmanifest')) as {
  icons?: Array<{ src?: string; sizes?: string; type?: string; purpose?: string }>;
};
const approved = JSON.parse(read('src/brand-assets/approved-brand-manifest.json')) as ApprovedManifest;
const browserconfig = read('public/browserconfig.xml');
const materializer = read('scripts/materialize-brand-art.mjs');
const rebuilder = read('scripts/rebuild-approved-brand-platform-assets.py');
const ciWorkflow = read('.github/workflows/ci.yml');
const browserSpec = read('qa/brand-emblem.spec.mjs');

const version = 'cloak-20260725-2';

function pngDimensions(buffer: Buffer, file: string) {
  assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${file}: invalid PNG signature`);
  assert.equal(buffer.subarray(12, 16).toString('ascii'), 'IHDR', `${file}: PNG IHDR is missing`);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function webpDimensions(buffer: Buffer, file: string) {
  assert.equal(buffer.subarray(0, 4).toString('ascii'), 'RIFF', `${file}: invalid WebP RIFF signature`);
  assert.equal(buffer.subarray(8, 12).toString('ascii'), 'WEBP', `${file}: invalid WebP signature`);
  assert.equal(buffer.readUInt32LE(4) + 8, buffer.length, `${file}: RIFF byte length mismatch`);
  const chunk = buffer.subarray(12, 16).toString('ascii');
  assert.equal(chunk, 'VP8 ', `${file}: approved master must remain lossy VP8 WebP`);
  assert.equal(buffer.readUInt32LE(16) + 20, buffer.length, `${file}: VP8 chunk byte length mismatch`);
  const frame = 20;
  assert.deepEqual([...buffer.subarray(frame + 3, frame + 6)], [0x9d, 0x01, 0x2a], `${file}: VP8 keyframe header is missing`);
  return {
    width: buffer.readUInt16LE(frame + 6) & 0x3fff,
    height: buffer.readUInt16LE(frame + 8) & 0x3fff,
  };
}

function jpegDimensions(buffer: Buffer, file: string) {
  assert.deepEqual([...buffer.subarray(0, 2)], [0xff, 0xd8], `${file}: invalid JPEG signature`);
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
  assert.fail(`${file}: JPEG dimensions were not found`);
}

function dimensions(buffer: Buffer, mime: string, file: string) {
  if (mime === 'image/png') return pngDimensions(buffer, file);
  if (mime === 'image/webp') return webpDimensions(buffer, file);
  if (mime === 'image/jpeg') return jpegDimensions(buffer, file);
  assert.fail(`${file}: unsupported manifest MIME ${mime}`);
}

assert.match(component, /useId\(\)\.replace\(\/:\/g, ''\)/, 'BrandMark must keep a unique accessible title id');
assert.match(component, /data-brand-mark/, 'BrandMark must expose a stable QA hook');
assert.match(component, /data-brand-version=\{BRAND_VERSION\}/, 'BrandMark cache version hook is missing');
assert.match(component, /whileHover="hover"/, 'BrandMark must keep the restrained hover interaction');
assert.match(component, /data-brand-figure/, 'BrandMark selected cloaked figure is missing');
assert.match(component, /data-brand-glow/, 'BrandMark premium glow layer is missing');
assert.match(component, /brand-emblem-master\.webp\?v=\$\{BRAND_VERSION\}/, 'BrandMark does not use the versioned approved master');
assert.match(component, /pointerEvents: 'none'/, 'BrandMark SVG must not intercept the parent link target');
assert.doesNotMatch(component, /data-brand-fallback/, 'the retired substitute vector figure remains in BrandMark');
assert.doesNotMatch(component, /data-brand-(?:book|wing|halo|mist|aura)/, 'retired emblem layers remain in BrandMark');
assert.doesNotMatch(component, /<path|<circle|<ellipse|<polygon/, 'BrandMark must not redraw a different character over the selected artwork');

assert.match(index, new RegExp(`brand-emblem-master\\.webp\\?v=${version}`), 'the approved master preload is not cache-versioned');
assert.match(index, new RegExp(`favicon-32\\.png\\?v=${version}`), '32px favicon is not cache-versioned');
assert.match(index, new RegExp(`favicon-16\\.png\\?v=${version}`), '16px favicon is not cache-versioned');
assert.match(index, new RegExp(`apple-touch-icon\\.png\\?v=${version}`), 'Apple icon is not cache-versioned');
assert.match(index, new RegExp(`brand-emblem-mask\\.svg\\?v=${version}`), 'Safari mask is not cache-versioned');
assert.match(index, new RegExp(`site\\.webmanifest\\?v=${version}`), 'manifest link is not cache-versioned');
assert.doesNotMatch(index, /rel="icon"[^>]+favicon\.svg/, 'the retired SVG favicon is still preferred by browsers');
assert.match(index, /og-image\.jpg/, 'Open Graph image is missing');
assert.match(index, /og:image:type" content="image\/jpeg"/, 'Open Graph MIME type must remain JPEG');

const iconSources = new Set((webManifest.icons || []).map((icon) => icon.src));
for (const src of [
  `/favicon-32.png?v=${version}`,
  `/icon-192.png?v=${version}`,
  `/icon-512.png?v=${version}`,
  `/icon-maskable-512.png?v=${version}`,
]) {
  assert.ok(iconSources.has(src), `site manifest is missing ${src}`);
}
assert.ok(
  webManifest.icons?.some(
    (icon) => icon.src === `/icon-maskable-512.png?v=${version}` && icon.type === 'image/png' && icon.purpose === 'maskable',
  ),
  'site manifest maskable artwork is missing',
);
assert.match(browserconfig, new RegExp(`mstile-150x150\\.png\\?v=${version}`), 'Windows tile is not cache-versioned');

assert.equal(approved.schemaVersion, 1, 'approved brand manifest schema changed');
assert.equal(approved.brandVersion, version, 'approved brand manifest version changed');
assert.equal(approved.generator, 'scripts/rebuild-approved-brand-platform-assets.py@1', 'approved generator contract changed');
assert.equal(approved.pillow, '11.3.0', 'approved Pillow version changed');
assert.equal(approved.sources.length, 3, 'approved encoded source count changed');
assert.equal(approved.outputs.length, 9, 'approved platform output inventory must remain complete');
assert.match(materializer, /approved-brand-manifest\.json/, 'materializer no longer reads the integrity manifest');
assert.match(materializer, /non-canonical Base64/, 'materializer no longer verifies canonical Base64');
assert.match(materializer, /decoded SHA-256 mismatch/, 'materializer no longer verifies decoded SHA-256');
assert.match(materializer, /flag: 'wx'/, 'materializer no longer stages exclusive temporary files');
assert.match(materializer, /required platform asset is missing/, 'materializer no longer fails on incomplete platform output');
assert.match(rebuilder, /pillow==11\.3\.0/, 'rebuilder no longer documents the pinned Pillow version');
assert.match(rebuilder, /Image\.Resampling\.LANCZOS/, 'rebuilder no longer uses deterministic high-quality resizing');
assert.match(ciWorkflow, /Validate approved brand assets[\s\S]*npm run validate:brand/, 'main CI does not run the approved brand gate');
assert.match(browserSpec, /await image\.decode\(\)/, 'browser QA no longer proves real image decoding');

const expectedHashes: Record<string, string> = {
  'brand-emblem-master.webp': 'f9e29065cc7191827750d252ecb8b8002385671faed5a4503dd2738065f661b7',
  'favicon-16.png': 'b613d63da2b88f9c798ec171173fa86aa6d48aea5e59da7d64cce18ff4a8cd9c',
  'favicon-32.png': '27880a89ca75ef4ba8d8e21243cd189846e3213cd487fc921761965ec2d55622',
  'apple-touch-icon.png': '01d220f4ace8330dc5be0b3bcf82998520b6826e87cc809f6957376052150c04',
  'icon-192.png': 'e9b7f9a236eaf03c8b558d300f2cb5b202b545e110a8e422cc2a09abac6f8a7f',
  'icon-512.png': 'd597a25502e9a68c16b7348c6c718ecc5c8703d5124af0813937e5411815d6e1',
  'icon-maskable-512.png': '6b51f18819753c56df47c42ab8ec37883aeb060a4910bde9ba185bf9f8115a0b',
  'mstile-150x150.png': '1baff1315e77b75f91303e3eb4a1c00a19894c3e3d20a0ad39f75d3681cd1a08',
  'og-image.jpg': '71f968667560f29b85120d53b264c5b5f23c5e8c9a3ba208427dbb20156fc580',
};

assert.deepEqual(
  approved.outputs.map((output) => output.name).sort(),
  Object.keys(expectedHashes).sort(),
  'approved output names changed',
);

for (const source of approved.sources) {
  const sourcePath = path.resolve('src/brand-assets', source.source);
  assert.ok(fs.existsSync(sourcePath), `encoded source ${source.source} is missing`);
  const encoded = fs.readFileSync(sourcePath, 'utf8').replace(/\s+/g, '');
  assert.equal(encoded.length % 4, 0, `${source.source}: invalid Base64 length`);
  assert.match(encoded, /^[A-Za-z0-9+/]*={0,2}$/, `${source.source}: invalid Base64 alphabet`);
  const decoded = Buffer.from(encoded, 'base64');
  assert.equal(decoded.toString('base64'), encoded, `${source.source}: non-canonical Base64`);
  assert.equal(decoded.length, source.bytes, `${source.source}: decoded byte length changed`);
  assert.equal(digest(decoded), source.sha256, `${source.source}: decoded SHA-256 changed`);
  assert.equal(digest(decoded), expectedHashes[source.output], `${source.source}: decoded output is not approved`);
}

for (const output of approved.outputs) {
  const expectedHash = expectedHashes[output.name];
  assert.equal(output.sha256, expectedHash, `${output.name}: manifest SHA-256 is not approved`);
  const file = `public/${output.name}`;
  assert.ok(fs.existsSync(path.resolve(file)), `${file}: required platform asset is missing`);
  const buffer = readBuffer(file);
  assert.equal(buffer.length, output.bytes, `${file}: byte length differs from manifest`);
  assert.equal(digest(buffer), expectedHash, `${file}: selected-reference asset changed`);
  assert.deepEqual(
    dimensions(buffer, output.mime, output.name),
    { width: output.width, height: output.height },
    `${file}: decoded dimensions changed`,
  );
}

assert.equal(fs.existsSync(path.resolve('public/og-image.png')), false, 'retired PNG share card must be removed');
console.log('brand validation: approved master decodes, complete platform inventory is pinned, and CI/browser gates are active');
