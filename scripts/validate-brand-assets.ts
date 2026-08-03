import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const resolve = (file: string) => path.resolve(file);
const read = (file: string) => fs.readFileSync(resolve(file), 'utf8');
const raw = (file: string) => fs.readFileSync(resolve(file));
const exists = (file: string) => fs.existsSync(resolve(file));
const digest = (bytes: Buffer) => crypto.createHash('sha256').update(bytes).digest('hex');
const RELEASE = 'approved-rgba-20260803-1';
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const approved = {
  header: ['qa/reference/approved-brand/header-rgba.png.b64', 'public/brand-emblem-header.png', '4c33e0bed07a86356e35ec8c8d0b5a16cd5c690ae763f14062d255a0762416f9'],
  primary: ['qa/reference/approved-brand/primary-rgba.png.b64', 'public/brand-emblem-primary.png', 'a44ed31b02ae6cd22d17ef96bce24e6ec1a4b85b49df74bc2fbc85826f7a46be'],
  simplified: ['qa/reference/approved-brand/simplified-rgba.png.b64', 'public/brand-emblem-simplified.png', 'e2d40570733eb4e3a332fe955a74815b05a7c6ff7481b135afd385c99636a8a7'],
  micro: ['qa/reference/approved-brand/micro-rgba.png.b64', 'public/brand-emblem-micro.png', 'def54ca3c95795937743737bd12767d33d48c8979b0d7600178f8cf2d445d6e5'],
} as const;

for (const [role, [source, output, expectedHash]] of Object.entries(approved)) {
  assert.ok(exists(source), `${role}: approved RGBA source is missing`);
  const bytes = Buffer.from(read(source).replace(/\s+/g, ''), 'base64');
  assert.ok(bytes.subarray(0, 8).equals(pngSignature), `${role}: approved source is not PNG`);
  assert.equal(digest(bytes), expectedHash, `${role}: approved source hash changed`);
  assert.ok(bytes.includes(Buffer.from('tRNS')) || [4, 6].includes(bytes[25]), `${role}: approved source lost transparency`);
  assert.ok(exists(output), `${role}: public asset is missing`);
  assert.equal(digest(raw(output)), expectedHash, `${role}: runtime output is not the approved source`);
}

for (const file of [
  'public/brand-emblem-master.webp', 'public/favicon-16.png', 'public/favicon-32.png',
  'public/apple-touch-icon.png', 'public/icon-192.png', 'public/icon-512.png',
  'public/icon-maskable-512.png', 'public/mstile-150x150.png', 'public/og-image.jpg',
]) {
  assert.ok(exists(file), `${file}: materialized asset missing`);
  assert.ok(raw(file).length > 180, `${file}: materialized asset too small`);
}

const retired = [
  'qa/reference/brand-emblem-canonical-reference.webp',
  'src/components/BrandMark.tsx', 'src/components/brandEmblemV18.svg',
  'public/brand-emblem.svg', 'public/brand-mark-micro.svg', 'public/brand-emblem-mask.svg',
  'public/brand-emblem-v19-candidate.svg', 'public/brand-emblem-v19-optical-candidate.svg',
  'public/brand-emblem-v19-micro-candidate.svg', 'public/brand-emblem-v20-candidate.svg',
  'public/brand-emblem-v20-micro-candidate.svg',
];
for (const file of retired) assert.equal(exists(file), false, `${file}: retired reference/vector asset returned`);

const component = read('src/components/SpectralBrandMark.tsx');
const motionCss = read('src/components/brandMotionV18.ts');
const motion = read('src/components/brandMotionFrameInvariant.ts');
const materializer = read('scripts/materialize-brand-art.mjs');

for (const token of [
  'data-brand-renderer="approved-rgba-family-subtle-depth"',
  'data-brand-reference-source="generated-transparent-rgba-family"',
  'data-brand-parallax="subtle-rgba-depth-v1"',
  'data-brand-awakening="approved-rgba-subtle-depth-v1"',
  'background:transparent', 'data-brand-raster-base', 'data-brand-raster-aura',
  "if (size === 'sm') return 'micro'", "event.pointerType === 'touch'", 'useReducedMotion()',
]) assert.ok(component.includes(token), `component missing ${token}`);

assert.doesNotMatch(component, /<svg|data-brand-vector|hood-layers|face-depth|epic-folds|mix-blend-mode|filter:|#02050b|drop-shadow|blur\(/i);
assert.doesNotMatch(materializer, /brand-emblem-canonical-reference|spectral-atlas|brand-raster-atlas|gblur|drop-shadow/i);
for (const hash of Object.values(approved).map((item) => item[2])) assert.ok(materializer.includes(hash));

assert.doesNotMatch(motionCss, /drop-shadow|brightness|saturate|data-brand-vector|data-brand-energy|data-brand-rim-light/i);
assert.ok(motion.includes('1 + 0.004 * wake'));
assert.ok(motion.includes('scaled(0.5) * state.x * detail'));
assert.ok(motion.includes('1 + 0.003 * detail'));
assert.ok(motion.includes('maxSubstepSeconds: 1 / 60'));
assert.doesNotMatch(motion, /0\.008 \* wake|scaled\(0\.92\)|--brand-hood|--brand-face|--brand-folds|--brand-rim/i);

for (const file of ['index.html', 'public/site.webmanifest', 'public/browserconfig.xml', 'public/brand-release.txt']) {
  assert.ok(read(file).includes(RELEASE), `${file}: release marker missing`);
}
assert.doesNotMatch(read('index.html'), /brand-mark-micro\.svg|brand-emblem-mask\.svg|image\/svg\+xml/);

console.log('brand validation: approved transparent RGBA family, restrained depth and zero legacy SVG/reference fallback are locked');
