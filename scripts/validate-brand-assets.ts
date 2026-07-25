import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const read = (file: string) => fs.readFileSync(path.resolve(file), 'utf8');
const readBuffer = (file: string) => fs.readFileSync(path.resolve(file));
const sha256 = (file: string) => crypto.createHash('sha256').update(readBuffer(file)).digest('hex');

const component = read('src/components/BrandMark.tsx');
const index = read('index.html');
const manifest = JSON.parse(read('public/site.webmanifest')) as {
  icons?: Array<{ src?: string; sizes?: string; type?: string; purpose?: string }>;
};
const browserconfig = read('public/browserconfig.xml');
const materializer = read('scripts/materialize-brand-art.mjs');
const standaloneSvg = read('public/brand-emblem.svg');
const release = read('public/brand-release.txt');

const version = 'cloak-20260725-3';
const masterSha256 = '3022d9f142bd0705a639b373c7fae995d42df00ac865440f270823adb2dc0c8d';

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

const expectedHashes: Record<string, string> = {
  'public/brand-emblem-master.webp': masterSha256,
  'public/favicon-16.png': 'b613d63da2b88f9c798ec171173fa86aa6d48aea5e59da7d64cce18ff4a8cd9c',
  'public/favicon-32.png': '27880a89ca75ef4ba8d8e21243cd189846e3213cd487fc921761965ec2d55622',
  'public/apple-touch-icon.png': '884850ea18bcfaf46d839c94c153d8daf552c677daac3b585fd3a62a313ffff2',
  'public/icon-192.png': '67f484fb1cf3d774f87522370fb97fbc3052ed0ec9b3b4813b4414ed63ec393b',
  'public/icon-512.png': '87b10432c44520f659c5f1ecde293f655f68792ec1e3aa4aa4aed2b65911b281',
  'public/icon-maskable-512.png': 'e90b2455c37a99aa86b9c5d85c1097c250249b103953d678c1040b34cdf5c09e',
  'public/mstile-150x150.png': '30be3316fc001a5d2308d9ee47a83260a298094c6684aaefa7ef82660b68c744',
  'public/og-image.jpg': '5562fbdebddc81777672a165a1eb10c964adb207ef3a58a260a305a4587882f3',
};

for (const [file, expected] of Object.entries(expectedHashes)) {
  assert.equal(sha256(file), expected, `${file}: selected-reference asset changed or the old emblem returned`);
}
assert.equal(fs.existsSync(path.resolve('public/og-image.png')), false, 'retired PNG share card must be removed');

console.log('brand validation: deterministic approved artwork, no substitute SVG, versioned surfaces and live release sentinel are consistent');
