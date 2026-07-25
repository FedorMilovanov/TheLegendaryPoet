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

const version = 'cloak-20260725-2';

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
assert.match(index, /og-image\.jpg/, 'Open Graph image is missing');
assert.match(index, /og:image:type" content="image\/jpeg"/, 'Open Graph MIME type must remain JPEG');

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
assert.match(materializer, /LPBRAND1/, 'brand materializer archive signature changed');
assert.match(materializer, /assets\.part/, 'brand materializer no longer reads the encoded source parts');

const expectedHashes: Record<string, string> = {
  'public/brand-emblem-master.webp': '186ed97c95eed248e9a4cdca3a01e3f2bc93a6681729c0fdc73f2c484df3ea4d',
  'public/favicon-16.png': 'fcbbf903d3a14e88a009696b55622cc5d8b755f9e09b5c80f174c3ef2699ee5b',
  'public/favicon-32.png': 'b546bfbae1477781052748380f3c0ae15032038e24d9a305ee26c0818f52f8df',
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

console.log('brand validation: approved cloaked artwork, no substitute figure, cache-busted icons and platform assets are consistent');
