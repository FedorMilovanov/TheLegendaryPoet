import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const resolve = (file: string) => path.resolve(file);
const read = (file: string) => fs.readFileSync(resolve(file), 'utf8');
const raw = (file: string) => fs.readFileSync(resolve(file));
const exists = (file: string) => fs.existsSync(resolve(file));
const digest = (bytes: Buffer) => crypto.createHash('sha256').update(bytes).digest('hex');
const RELEASE = 'approved-single-reference-20260804-1';
const SOURCE_SHA256 = '898cf6bd0321f6f48ed12971f49803f7ed6758961f51e06628f0da2ffd50ff17';
const SOURCE_PARTS = Array.from({ length: 25 }, (_, index) => `qa/reference/approved-brand/final-reference.part${String(index).padStart(2, '0')}.b64`);

for (const source of SOURCE_PARTS) assert.ok(exists(source), `approved single source part is missing: ${source}`);
const sourceBytes = Buffer.from(SOURCE_PARTS.map((source) => read(source).replace(/\s+/g, '')).join(''), 'base64');
assert.equal(sourceBytes.subarray(0, 4).toString('ascii'), 'RIFF', 'approved source is not RIFF WebP');
assert.equal(sourceBytes.subarray(8, 12).toString('ascii'), 'WEBP', 'approved source is not WebP');
assert.equal(digest(sourceBytes), SOURCE_SHA256, 'approved single source hash changed');

for (const file of [
  'public/brand-emblem.png',
  'public/favicon-16.png', 'public/favicon-32.png', 'public/apple-touch-icon.png',
  'public/icon-192.png', 'public/icon-512.png', 'public/icon-maskable-512.png',
  'public/mstile-150x150.png', 'public/og-image.jpg',
]) {
  assert.ok(exists(file), `${file}: materialized asset missing`);
  assert.ok(raw(file).length > 180, `${file}: materialized asset too small`);
}

for (const retired of [
  'public/brand-emblem-master.webp',
  'public/brand-emblem-header.png', 'public/brand-emblem-primary.png',
  'public/brand-emblem-simplified.png', 'public/brand-emblem-micro.png',
  'qa/reference/brand-emblem-canonical-reference.webp',
  'src/components/BrandMark.tsx', 'src/components/brandEmblemV18.svg',
  'public/brand-emblem.svg', 'public/brand-mark-micro.svg', 'public/brand-emblem-mask.svg',
  'public/brand-emblem-v19-candidate.svg', 'public/brand-emblem-v19-optical-candidate.svg',
  'public/brand-emblem-v19-micro-candidate.svg', 'public/brand-emblem-v20-candidate.svg',
  'public/brand-emblem-v20-micro-candidate.svg',
]) assert.equal(exists(retired), false, `${retired}: retired brand asset returned`);

const component = read('src/components/SpectralBrandMark.tsx');
const materializer = read('scripts/materialize-brand-art.mjs');
const release = read('public/brand-release.txt');

for (const token of [
  "asset('/brand-emblem.png')",
  'data-brand-release="approved-single-reference-20260804-1"',
  'data-brand-renderer="single-approved-rgba-subtle-depth"',
  'data-brand-reference-source="single-user-selected-transparent-reference"',
  'data-brand-raster-variant="single"',
  'background:transparent', 'data-brand-raster-base', 'data-brand-raster-aura',
  "event.pointerType === 'touch'", 'useReducedMotion()',
]) assert.ok(component.includes(token), `component missing ${token}`);

assert.doesNotMatch(component, /brand-emblem-(header|primary|simplified|micro)\.png|headerSizes|<svg|data-brand-vector|mix-blend-mode|filter:|drop-shadow|blur\(/i);
assert.doesNotMatch(materializer, /brand-emblem-canonical-reference|spectral-atlas|brand-raster-atlas|generated-transparent-rgba-family/i);
assert.ok(materializer.includes(SOURCE_SHA256));
assert.ok(materializer.includes("Array.from({ length: 25 }"));
assert.ok(materializer.includes("'brand-emblem.png'"));
assert.ok(materializer.includes("'brand-emblem-master.webp'"), 'materializer must actively remove the retired WebP runtime asset');
assert.ok(release.includes(RELEASE));
assert.ok(release.includes('approved-source=single-user-selected-transparent-reference'));
assert.ok(release.includes(`source-sha256=${SOURCE_SHA256}`));
assert.ok(release.includes('roles=single'));

console.log('brand validation: one exact user-selected transparent emblem is locked for every placement');
