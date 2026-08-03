import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const resolve = (file: string) => path.resolve(file);
const read = (file: string) => fs.readFileSync(resolve(file), 'utf8');
const raw = (file: string) => fs.readFileSync(resolve(file));
const exists = (file: string) => fs.existsSync(resolve(file));
const sha256 = (file: string) => crypto.createHash('sha256').update(raw(file)).digest('hex');

const RELEASE = 'reference-raster-20260803-1';
const REFERENCE = 'qa/reference/brand-emblem-canonical-reference.webp';
const REFERENCE_HASH = '767be12318c21aeb2c259a4ab529f04caf9f5db9b131c38223ea85e109ea8532';
const component = read('src/components/SpectralBrandMark.tsx');
const motionCss = read('src/components/brandMotionV18.ts');
const motion = read('src/components/brandMotionFrameInvariant.ts');
const materializer = read('scripts/materialize-brand-art.mjs');

assert.ok(exists(REFERENCE), 'canonical reference is missing');
assert.equal(sha256(REFERENCE), REFERENCE_HASH, 'canonical reference hash changed');

for (const file of [
  'public/brand-emblem-primary.png',
  'public/brand-emblem-simplified.png',
  'public/brand-emblem-micro.png',
  'public/brand-emblem-header.png',
  'public/brand-emblem-master.webp',
  'public/favicon-16.png',
  'public/favicon-32.png',
  'public/apple-touch-icon.png',
  'public/icon-192.png',
  'public/icon-512.png',
  'public/icon-maskable-512.png',
  'public/mstile-150x150.png',
  'public/og-image.jpg',
]) {
  assert.ok(exists(file), `${file}: materialized asset missing`);
  assert.ok(raw(file).length > 180, `${file}: materialized asset too small`);
}

const retired = [
  'src/components/BrandMark.tsx',
  'src/components/brandEmblemV18.svg',
  'public/brand-emblem.svg',
  'public/brand-mark-micro.svg',
  'public/brand-emblem-mask.svg',
  'public/brand-emblem-v19-candidate.svg',
  'public/brand-emblem-v19-optical-candidate.svg',
  'public/brand-emblem-v19-micro-candidate.svg',
  'public/brand-emblem-v20-candidate.svg',
  'public/brand-emblem-v20-micro-candidate.svg',
];
for (const file of retired) assert.equal(exists(file), false, `${file}: retired Shredder/vector asset returned`);

assert.doesNotMatch(materializer, /spectral-atlas|brand-raster-atlas|gblur|drop-shadow/i);
assert.ok(materializer.includes(REFERENCE_HASH));
assert.ok(materializer.includes('brand-emblem-canonical-reference.webp'));

for (const token of [
  'data-brand-renderer="reference-raster-subtle-depth"',
  'data-brand-reference-source="canonical-hooded-figure-v2-clean-base"',
  'data-brand-parallax="subtle-reference-depth-v1"',
  'data-brand-awakening="reference-subtle-depth-v1"',
  'data-brand-raster-base',
  'data-brand-raster-aura',
  'event.pointerType === \'touch\'',
  'useReducedMotion()',
]) assert.ok(component.includes(token), `component missing ${token}`);

assert.doesNotMatch(component, /<svg|data-brand-vector|hood-layers|face-depth|epic-folds|drop-shadow|blur\(/i);
assert.doesNotMatch(component, /opacity:\.(?:1[2-9]|[2-9]\d)|brightness\(1\.[2-9]|saturate\(1\.[2-9]/i, 'component reintroduced excessive glow');
assert.equal((component.match(/data-brand-raster-layer/g) ?? []).length >= 2, true);

assert.doesNotMatch(motionCss, /drop-shadow|brightness|saturate|data-brand-vector|data-brand-energy|data-brand-rim-light/i);
assert.ok(motion.includes('1 + 0.008 * wake'));
assert.ok(motion.includes('scaled(0.92) * state.x * detail'));
assert.ok(motion.includes('maxSubstepSeconds: 1 / 60'));
assert.doesNotMatch(motion, /3\.66|2\.55|0\.022 \* figureWake|--brand-hood|--brand-face|--brand-folds|--brand-rim/i);

for (const file of ['index.html', 'public/site.webmanifest', 'public/browserconfig.xml', 'public/brand-release.txt']) {
  assert.ok(read(file).includes(RELEASE), `${file}: release marker missing`);
}
assert.doesNotMatch(read('index.html'), /brand-mark-micro\.svg|brand-emblem-mask\.svg|image\/svg\+xml/);

console.log('brand validation: canonical reference raster, restrained hover depth and zero legacy Shredder SVGs are locked');
