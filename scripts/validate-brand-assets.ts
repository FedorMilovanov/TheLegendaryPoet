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
  assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  let offset = 8;
  let dimensions: { width: number; height: number } | null = null;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    const dataEnd = offset + 8 + length;
    assert.ok(dataEnd + 4 <= buffer.length);
    assert.equal(crc32(buffer.subarray(offset + 4, dataEnd)), buffer.readUInt32BE(dataEnd));
    if (type === 'IHDR') dimensions = { width: buffer.readUInt32BE(offset + 8), height: buffer.readUInt32BE(offset + 12) };
    offset = dataEnd + 4;
    if (type === 'IEND') break;
  }
  assert.ok(dimensions);
  return dimensions;
}

function jpegSize(file: string) {
  const buffer = readBuffer(file);
  assert.equal(buffer[0], 0xff); assert.equal(buffer[1], 0xd8);
  const sof = new Set([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]);
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    while (buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset];
    if (marker === 0xda || marker === undefined) break;
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { offset += 1; continue; }
    const length = buffer.readUInt16BE(offset + 1);
    if (sof.has(marker)) return { height: buffer.readUInt16BE(offset + 4), width: buffer.readUInt16BE(offset + 6) };
    offset += 1 + length;
  }
  throw new Error(`${file}: JPEG dimensions not found`);
}

function assertCompleteSvg(source: string, file: string, viewBox: string) {
  const escaped = viewBox.split(' ').join('\\s+');
  assert.match(source, new RegExp(`<svg\\b[^>]*viewBox="${escaped}"`), `${file}: viewBox changed`);
  assert.ok(source.trimEnd().endsWith('</svg>'));
  assert.equal((source.match(/<svg\b/g) || []).length, (source.match(/<\/svg>/g) || []).length);
  assert.equal((source.match(/<defs\b/g) || []).length, (source.match(/<\/defs>/g) || []).length);
  assert.equal((source.match(/<g(?:\s|>)/g) || []).length, (source.match(/<\/g>/g) || []).length);
  assert.doesNotMatch(source, /<[^>]+\sdata-brand-[\w-]+(?=\s|>)(?!\s*=)/);
}

const component = read('src/components/BrandMark.tsx');
const standalone = read('public/brand-emblem.svg');
const micro = read('public/brand-mark-micro.svg');
const mask = read('public/brand-emblem-mask.svg');
const index = read('index.html');
const manifest = JSON.parse(read('public/site.webmanifest')) as { icons?: Array<{ src?: string }> };
const browserconfig = read('public/browserconfig.xml');
const materializer = read('scripts/materialize-brand-art.mjs');
const release = read('public/brand-release.txt');
const evaluation = JSON.parse(read('qa/brand-reference-evaluation.json')) as { candidateSource: string; candidateRevision: string; reviewerDecision: string };

const version = 'cloak-20260728-14';
const vectorSource = 'canonical-reference-v2-reset-v12-7';
const masterSha256 = 'f9e29065cc7191827750d252ecb8b8002385671faed5a4503dd2738065f661b7';
const hooks = ['data-brand-mark','data-brand-vector','data-brand-figure','data-brand-hood','data-brand-cloak','data-brand-face-void','data-brand-rim-light','data-brand-folds','data-brand-collar','data-brand-atmosphere','data-brand-energy','data-brand-texture','data-brand-seams','data-brand-hood-layers','data-brand-neck-shadow'];

assert.match(component, /useId\(\)\.replace\(\/:\/g, ''\)/);
assert.match(component, /useReducedMotion\(\)/);
for (const hook of hooks) assert.match(component, new RegExp(hook), `${hook} missing`);
assert.match(component, new RegExp(`const VECTOR_SOURCE = '${vectorSource}'`));
assert.match(component, new RegExp(`const BRAND_VERSION = '${version}'`));
assert.match(component, /data-brand-vector-source=\{VECTOR_SOURCE\}/);
assert.match(component, /pointerEvents: 'none'/);
assert.match(component, /sm: 'h-12 w-12'/);
assert.match(component, /M47\.8 34\.8C42\.2 34\.6/);
assert.match(component, /M48 12\.1C43\.8 13\.3/);
assert.match(component, /M47\.6 19\.6L44\.1 21\.4/);
assert.ok((component.match(/d="M/g) || []).length >= 48);
assert.doesNotMatch(component, /<(?:motion\.)?image\b|<img\b|data:image|base64,|<rect\b/i);

assertCompleteSvg(standalone, 'public/brand-emblem.svg', '0 0 96 96');
assert.match(standalone, new RegExp(`data-brand-vector-source="${vectorSource}"`));
assert.match(standalone, /M47\.8 34\.8C42\.2 34\.6/);
assert.match(standalone, /M48 12\.1C43\.8 13\.3/);
assert.match(standalone, /M47\.6 19\.6L44\.1 21\.4/);
assert.ok((standalone.match(/<path\b/g) || []).length >= 48);
assert.doesNotMatch(standalone, /<(?:image|rect)\b|data:image|base64,/i);
assert.doesNotMatch(standalone, /M18 91C24 85/);

assertCompleteSvg(micro, 'public/brand-mark-micro.svg', '0 0 32 32');
assert.match(micro, new RegExp(`data-brand-vector-source="${vectorSource}"`));
assert.match(micro, /M16 11\.7C14 11\.6/);
assert.match(micro, /M16 3\.9C14\.6 4\.3/);
assert.match(micro, /M15\.9 6\.5L14\.7 7\.1/);
assert.ok((micro.match(/<path\b/g) || []).length >= 22);
assert.doesNotMatch(micro, /<(?:image|rect)\b|data:image|base64,/i);

assertCompleteSvg(mask, 'public/brand-emblem-mask.svg', '0 0 96 96');
assert.match(mask, /fill-rule="evenodd"/);
assert.match(mask, /M48 12\.1C43\.8 13\.3/);
assert.match(mask, /M47\.6 19\.6L44\.1 21\.4/);
assert.doesNotMatch(mask, /<(?:image|rect)\b|data:image|base64,/i);

assert.equal(evaluation.candidateSource, vectorSource);
assert.match(evaluation.candidateRevision, /v12\.7/);
assert.equal(evaluation.reviewerDecision, 'not-reference-approved');

for (const pattern of [
  `name="brand-release" content="${version}"`,
  `brand-mark-micro\\.svg\\?v=${version}`,
  `favicon-32\\.png\\?v=${version}`,
  `favicon-16\\.png\\?v=${version}`,
  `apple-touch-icon\\.png\\?v=${version}`,
  `brand-emblem-mask\\.svg\\?v=${version}`,
  `site\\.webmanifest\\?v=${version}`,
  `og-image\\.jpg\\?v=${version}`,
  `icon-512\\.png\\?v=${version}`,
]) assert.match(index, new RegExp(pattern));

assert.equal(release.trim(), `${version}\nmaster-sha256=${masterSha256}`);
const iconSources = new Set((manifest.icons || []).map(icon => icon.src));
for (const src of [`/favicon-32.png?v=${version}`,`/icon-192.png?v=${version}`,`/icon-512.png?v=${version}`,`/icon-maskable-512.png?v=${version}`]) assert.ok(iconSources.has(src));
assert.match(browserconfig, new RegExp(`mstile-150x150\\.png\\?v=${version}`));
for (const source of ['master-320-q92.webp.b64','favicon-16.png.b64','favicon-32.png.b64']) {
  assert.match(materializer, new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.ok(fs.existsSync(path.resolve('src/brand-assets', source)));
}

const expectedHashes: Record<string,string> = {
  'public/brand-emblem-master.webp': masterSha256,
  'public/favicon-16.png': 'b613d63da2b88f9c798ec171173fa86aa6d48aea5e59da7d64cce18ff4a8cd9c',
  'public/favicon-32.png': '27880a89ca75ef4ba8d8e21243cd189846e3213cd487fc921761965ec2d55622',
};
for (const [file, expected] of Object.entries(expectedHashes)) assert.equal(sha256(file), expected);
const expectedPngSizes: Record<string,{width:number;height:number}> = {
  'public/favicon-16.png':{width:16,height:16},
  'public/favicon-32.png':{width:32,height:32},
  'public/apple-touch-icon.png':{width:180,height:180},
  'public/icon-192.png':{width:192,height:192},
  'public/icon-512.png':{width:512,height:512},
  'public/icon-maskable-512.png':{width:512,height:512},
  'public/mstile-150x150.png':{width:150,height:150},
};
for (const [file, expected] of Object.entries(expectedPngSizes)) assert.deepEqual(pngSize(file), expected);
assert.deepEqual(jpegSize('public/og-image.jpg'), {width:1200,height:630});
console.log('brand validation: v12.7 canonical reset, reduced cavern, darker crushed cowl, irregular upper-side atmosphere and clean lower edge are consistent');
