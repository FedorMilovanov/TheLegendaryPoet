import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const resolve = (file: string) => path.resolve(file);
const read = (file: string) => fs.readFileSync(resolve(file), 'utf8');
const readBuffer = (file: string) => fs.readFileSync(resolve(file));
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
assert.match(component, /data-brand-fallback/, 'BrandMark coded SVG fallback is missing');
assert.match(component, /data-brand-aura/, 'BrandMark cold aura is missing');
assert.match(component, /data-brand-mist/, 'BrandMark lower mist transition is missing');
assert.match(component, /brand-emblem-master\.png/, 'BrandMark does not use the committed selected master artwork');
assert.doesNotMatch(component, /brand-emblem-master\.webp/, 'BrandMark still references the retired WebP master');
assert.match(component, /pointerEvents: 'none'/, 'BrandMark SVG must not intercept the parent link hover/click target');
assert.doesNotMatch(component, /data-brand-(?:book|wing|halo)/, 'retired book, wing or halo hooks remain in BrandMark');
assert.doesNotMatch(component, /\sid="(?:aura|cloak|rim|void|soft|mist)"/, 'BrandMark contains collision-prone fixed SVG ids');
assert.ok(
  component.indexOf('data-brand-aura') < component.indexOf('data-brand-fallback') &&
    component.indexOf('data-brand-fallback') < component.indexOf('data-brand-figure'),
  'the aura and coded fallback must render behind the approved master artwork',
);

assert.match(emblem, /viewBox="0 0 96 96"/, 'brand-emblem.svg: canonical viewBox changed');
assert.match(emblem, /id="vector-fallback"/, 'brand-emblem.svg: coded vector fallback is missing');
assert.match(emblem, /brand-emblem-master\.png/, 'brand-emblem.svg: committed selected artwork is not referenced');
assert.doesNotMatch(emblem, /brand-emblem-master\.webp/, 'brand-emblem.svg still references the retired WebP master');
assert.match(emblem, /M48 7 C39 9 34 19 32 31/, 'brand-emblem.svg: hood fallback silhouette changed');
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

assert.match(materializer, /brand assets verified/, 'brand prebuild no longer verifies direct immutable assets');
assert.match(materializer, /retired archive parts remain/, 'brand prebuild does not reject the corrupt archive format');
assert.doesNotMatch(materializer, /LPBRAND1|Buffer\.from\(encoded, 'base64'\)/, 'brand prebuild still parses the retired binary archive');

for (const pathName of [
  'brand-emblem-master.png',
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
  /<link rel="preload" href="%BASE_URL%brand-emblem-master\.png" as="image" type="image\/png" fetchpriority="high" \/>/,
  'the selected PNG master must be preloaded to avoid a header flash',
);
assert.doesNotMatch(index, /brand-emblem-master\.webp|og-image\.png|с раскрытой книгой/, 'retired brand metadata remains in index.html');
assert.match(index, /og:image:type" content="image\/jpeg"/, 'Open Graph image MIME type must use the selected JPEG share card');
assert.match(prerender, /og-image\.jpg/g, 'prerender default does not use the selected share card');
assert.doesNotMatch(prerender, /og-image\.png|brand-emblem-master\.(?:png|webp)/, 'prerender still references a non-share default');
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
  'public/brand-emblem-master.png': '4638cac0aab4b7a3bbacdd851c748ece5362e623876f717db0fdaa4feea97d6b',
  'public/favicon-16.png': 'a44d3fcaa2e4a46d5399d48b6257e4e7dee3c9a6b6bc6542ecf991d8bc280ff1',
  'public/favicon-32.png': '2c04279a8df520a3ce72188fca9ac6c71d8b78259c4779fc6d240197733c2f38',
  'public/apple-touch-icon.png': 'bbe8cf441d0f3a7099148f8668078dca47aa5ce1b7d71b305dc8413af47fc0e0',
  'public/icon-192.png': 'e4d3fa41b617680a863588f06ef8778e014bf718b7b2d6b305a2a9cde8f54a49',
  'public/icon-512.png': 'c28d87ed099f018a01e6968cc5126f51c80c84f1e1d7fd90947737a9983c54fd',
  'public/icon-maskable-512.png': '634033d5512eda3f7653472ad8e0e95fa3e9fee7a8ba830c9089e589155ee411',
  'public/mstile-150x150.png': 'b44796d8a5feb8989f3c214ef33b63667eb9c9de4c83142a400acf3c2b8f6723',
  'public/og-image.jpg': '3064016c3e3cb672a90564af224ef3ca1774bf9b883dfdcb30c6da2c3bbf8974',
};

for (const [file, expected] of Object.entries(expectedHashes)) {
  assert.equal(sha256(file), expected, `${file}: selected-reference asset changed or an old emblem returned`);
}

const expectedPngDimensions: Record<string, [number, number]> = {
  'public/brand-emblem-master.png': [256, 256],
  'public/favicon-16.png': [16, 16],
  'public/favicon-32.png': [32, 32],
  'public/apple-touch-icon.png': [180, 180],
  'public/icon-192.png': [192, 192],
  'public/icon-512.png': [512, 512],
  'public/icon-maskable-512.png': [512, 512],
  'public/mstile-150x150.png': [150, 150],
};
for (const [file, [width, height]] of Object.entries(expectedPngDimensions)) {
  const buffer = readBuffer(file);
  assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${file}: invalid PNG signature`);
  assert.equal(buffer.readUInt32BE(16), width, `${file}: unexpected width`);
  assert.equal(buffer.readUInt32BE(20), height, `${file}: unexpected height`);
}
const share = readBuffer('public/og-image.jpg');
assert.equal(share.subarray(0, 3).toString('hex'), 'ffd8ff', 'og-image.jpg: invalid JPEG signature');
assert.equal(share.subarray(-2).toString('hex'), 'ffd9', 'og-image.jpg: incomplete JPEG');

const retired = [
  'public/brand-emblem-master.webp',
  'public/og-image.png',
  'src/brand-assets/assets.part01.b64',
  'src/brand-assets/assets.part02.b64',
];
for (const file of retired) assert.equal(fs.existsSync(resolve(file)), false, `${file}: retired asset must be removed`);

console.log('brand validation: selected cloaked figure, direct immutable assets, coded fallback, preload and platform metadata are consistent');
