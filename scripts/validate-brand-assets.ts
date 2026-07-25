import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const read = (file: string) => fs.readFileSync(path.resolve(file), 'utf8');
const readBuffer = (file: string) => fs.readFileSync(path.resolve(file));
const sha256 = (file: string) => crypto.createHash('sha256').update(readBuffer(file)).digest('hex');

const component = read('src/components/BrandMark.tsx');
const emblem = read('public/brand-emblem.svg');
const maskEmblem = read('public/brand-emblem-mask.svg');
const favicon = read('public/favicon.svg');
const index = read('index.html');
const manifest = JSON.parse(read('public/site.webmanifest')) as {
  icons?: Array<{ src?: string; sizes?: string; type?: string; purpose?: string }>;
};
const prerender = read('scripts/prerender-og.mjs');
const seo = read('src/hooks/useSeo.ts');
const browserconfig = read('public/browserconfig.xml');
const materializer = read('scripts/materialize-brand-art.mjs');

assert.match(component, /useId\(\)\.replace\(\/:\/g, ''\)/, 'BrandMark must namespace SVG definition ids');
assert.match(component, /data-brand-mark/, 'BrandMark must expose a stable QA hook');
assert.match(component, /whileHover="hover"/, 'BrandMark must keep the restrained hover interaction');
assert.match(component, /data-brand-figure/, 'BrandMark selected cloaked figure is missing');
assert.match(component, /data-brand-aura/, 'BrandMark cold aura is missing');
assert.match(component, /data-brand-mist/, 'BrandMark lower mist transition is missing');
assert.match(component, /brand-emblem-master\.webp/, 'BrandMark does not use the selected master artwork');
assert.doesNotMatch(component, /data-brand-(?:book|wing|halo)/, 'retired book, wing or halo hooks remain in BrandMark');
assert.doesNotMatch(component, /\sid="(?:aura|soft|mist)"/, 'BrandMark contains collision-prone fixed SVG ids');
assert.ok(
  component.indexOf('data-brand-aura') < component.indexOf('data-brand-figure'),
  'the aura must render behind the figure so the hidden face stays black',
);

assert.match(emblem, /viewBox="0 0 96 96"/, 'brand-emblem.svg: canonical viewBox changed');
assert.match(emblem, /brand-emblem-master\.webp/, 'brand-emblem.svg: selected artwork is not referenced');
assert.doesNotMatch(emblem, /<script|<foreignObject/i, 'brand-emblem.svg: unsafe or non-portable SVG content');
assert.doesNotMatch(emblem, /(?:book|wing|halo|<circle)/i, 'brand-emblem.svg: retired emblem symbolism remains');
assert.doesNotMatch(emblem, /<rect width="96" height="96"/, 'canonical emblem must remain frameless');

assert.match(favicon, /viewBox="0 0 96 96"/, 'favicon.svg: canonical viewBox changed');
assert.match(favicon, /<rect width="96" height="96" rx="18"/, 'favicon must retain its dark safe-area tile');
assert.match(favicon, /M48 7 C39 9 34 19 32 31/, 'favicon hood silhouette changed');
assert.doesNotMatch(favicon, /<image|data:image|brand-emblem-master/i, 'favicon must be self-contained and not depend on an external raster');
assert.doesNotMatch(favicon, /(?:book|wing|halo|<circle)/i, 'favicon: retired emblem symbolism remains');
assert.doesNotMatch(favicon, /<script|<foreignObject/i, 'favicon: unsafe SVG content');

assert.match(maskEmblem, /viewBox="0 0 96 96"/, 'Safari mask icon viewBox changed');
assert.match(maskEmblem, /<path fill="#000"/, 'Safari mask icon must be a monochrome vector path');
assert.doesNotMatch(maskEmblem, /<image|data:image|<circle/i, 'Safari mask icon must stay pure vector and ring-free');
assert.match(materializer, /LPBRAND1/, 'brand materializer archive signature changed');
assert.match(materializer, /assets\.part/, 'brand materializer no longer reads the encoded source parts');

for (const pathName of [
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
assert.doesNotMatch(index, /(?:с раскрытой книгой|og-image\.png|brand-emblem-master\.webp" \/>\s*<meta property="og:image)/, 'retired brand metadata remains in index.html');
assert.match(index, /og:image:type" content="image\/jpeg"/, 'Open Graph image MIME type must use the selected JPEG share card');
assert.match(prerender, /og-image\.jpg/g, 'prerender default does not use the selected share card');
assert.doesNotMatch(prerender, /og-image\.png|brand-emblem-master\.webp/, 'prerender still references retired share defaults');
assert.match(seo, /image \|\| '\/og-image\.jpg'/, 'runtime SEO default does not use the selected share card');
assert.match(seo, /logo: \{ '@type': 'ImageObject', url: `\$\{siteConfig\.url\}\/icon-512\.png` \}/, 'runtime publisher logo is not the selected platform icon');
assert.doesNotMatch(seo, /og-image\.png/, 'runtime SEO still references the retired share card');

const iconSources = new Set((manifest.icons || []).map((icon) => icon.src));
for (const src of ['/favicon.svg', '/icon-192.png', '/icon-512.png', '/icon-maskable-512.png']) {
  assert.ok(iconSources.has(src), `manifest is missing ${src}`);
}
assert.ok(
  manifest.icons?.some((icon) => icon.src === '/icon-maskable-512.png' && icon.type === 'image/png' && icon.purpose === 'maskable'),
  'manifest maskable selected artwork is missing',
);
assert.match(browserconfig, /mstile-150x150\.png/, 'Windows tile does not use the selected emblem');

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
  assert.equal(sha256(file), expected, `${file}: selected-reference asset changed or an old emblem returned`);
}
assert.equal(fs.existsSync(path.resolve('public/og-image.png')), false, 'retired PNG share card must be removed');

console.log('brand validation: selected cloaked figure, self-contained favicon, ring-free SVG, hover, metadata and platform assets are consistent');
