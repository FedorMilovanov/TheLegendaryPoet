import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (file: string) => fs.readFileSync(path.resolve(file), 'utf8');
const readBuffer = (file: string) => fs.readFileSync(path.resolve(file));

const component = read('src/components/BrandMark.tsx');
const emblem = read('public/brand-emblem.svg');
const favicon = read('public/favicon.svg');
const index = read('index.html');
const manifest = JSON.parse(read('public/site.webmanifest')) as {
  icons?: Array<{ src?: string; sizes?: string; purpose?: string }>;
};
const prerender = read('scripts/prerender-og.mjs');
const seo = read('src/hooks/useSeo.ts');
const browserconfig = read('public/browserconfig.xml');

assert.match(component, /useId\(\)\.replace\(\/:\/g, ''\)/, 'BrandMark must namespace SVG definition ids');
assert.match(component, /data-brand-mark/, 'BrandMark must expose a stable QA hook');
assert.match(component, /whileHover="hover"/, 'BrandMark must keep the restrained hover interaction');
assert.match(component, /data-brand-wing="left"/, 'BrandMark left cloak wing is missing');
assert.match(component, /data-brand-wing="right"/, 'BrandMark right cloak wing is missing');
assert.match(component, /data-brand-book/, 'BrandMark illuminated book is missing');
assert.doesNotMatch(component, /\sid="(?:cloak|hood|edge|book|glow|void)"/, 'BrandMark contains collision-prone fixed SVG ids');

for (const [name, svg] of [['brand-emblem.svg', emblem], ['favicon.svg', favicon]] as const) {
  assert.match(svg, /viewBox="0 0 96 96"/, `${name}: canonical viewBox changed`);
  assert.match(svg, /M48 28 C38 28 31 33 26 42/, `${name}: canonical cloak silhouette changed`);
  assert.match(svg, /M33 55 C38 52\.5 43\.5 53\.7 48 58/, `${name}: illuminated book changed`);
  assert.doesNotMatch(svg, /<script|<foreignObject/i, `${name}: unsafe or non-portable SVG content`);
}
assert.doesNotMatch(emblem, /<rect width="96" height="96"/, 'canonical emblem must remain frameless');
assert.match(favicon, /<rect width="96" height="96" rx="18"/, 'favicon must retain its dark safe-area tile');

for (const pathName of [
  'favicon.svg',
  'favicon-16.png',
  'favicon-32.png',
  'apple-touch-icon.png',
  'brand-emblem.svg',
  'icon-512.png',
  'og-image.png',
  'site.webmanifest',
  'browserconfig.xml',
]) {
  assert.ok(index.includes(pathName), `index.html does not reference ${pathName}`);
}
assert.doesNotMatch(index, /og-image\.jpg/, 'index.html still points to the retired OG artwork');
assert.match(index, /og:image:type" content="image\/png"/, 'Open Graph image MIME type is missing');
assert.match(prerender, /og-image\.png/g, 'prerender default does not use the new share card');
assert.doesNotMatch(prerender, /og-image\.jpg/, 'prerender still references the retired share card');
assert.match(seo, /image \|\| '\/og-image\.png'/, 'runtime SEO default does not use the new share card');
assert.doesNotMatch(seo, /og-image\.jpg/, 'runtime SEO still references the retired share card');

const iconSources = new Set((manifest.icons || []).map((icon) => icon.src));
for (const src of ['/favicon.svg', '/icon-192.png', '/icon-512.png', '/icon-maskable-512.png']) {
  assert.ok(iconSources.has(src), `manifest is missing ${src}`);
}
assert.ok(
  manifest.icons?.some((icon) => icon.src === '/icon-maskable-512.png' && icon.purpose === 'maskable'),
  'manifest maskable icon is missing',
);
assert.match(browserconfig, /mstile-150x150\.png/, 'Windows tile does not use the canonical emblem');

function pngDimensions(buffer: Buffer) {
  assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'invalid PNG signature');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

const expectedPngs: Record<string, { width: number; height: number }> = {
  'public/favicon-16.png': { width: 16, height: 16 },
  'public/favicon-32.png': { width: 32, height: 32 },
  'public/apple-touch-icon.png': { width: 180, height: 180 },
  'public/icon-192.png': { width: 192, height: 192 },
  'public/icon-512.png': { width: 512, height: 512 },
  'public/icon-maskable-512.png': { width: 512, height: 512 },
  'public/mstile-150x150.png': { width: 150, height: 150 },
  'public/og-image.png': { width: 1200, height: 630 },
};

for (const [file, expected] of Object.entries(expectedPngs)) {
  assert.deepEqual(pngDimensions(readBuffer(file)), expected, `${file}: unexpected dimensions`);
}

console.log('brand validation: canonical SVG, hover hooks, metadata and platform assets are consistent');
