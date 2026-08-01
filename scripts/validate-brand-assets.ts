import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const read = (file: string) => fs.readFileSync(path.resolve(file), 'utf8');
const raw = (file: string) => fs.readFileSync(path.resolve(file));
const blob = (file: string) => {
  const bytes = raw(file);
  return crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
};

const VERSION = 'cloak-20260801-21';
const SOURCE = 'canonical-reference-v2-black-monolith-v17-0';
const componentFile = 'src/components/BrandMark.tsx';
const motionFile = 'src/components/brandMotionV18.ts';
const sourceFile = 'src/components/brandEmblemV18.svg';
const standaloneFile = 'public/brand-emblem.svg';
const microFile = 'public/brand-mark-micro.svg';
const maskFile = 'public/brand-emblem-mask.svg';

const component = read(componentFile);
const motion = read(motionFile);
const source = read(sourceFile);
const standalone = read(standaloneFile);
const micro = read(microFile);
const mask = read(maskFile);
const evaluation = JSON.parse(read('qa/brand-reference-evaluation.json')) as {
  candidateSource: string;
  candidateRevision: string;
  reviewerDecision: string;
  candidateGitBlobShas: Record<string, string>;
};

function validSvg(svg: string, file: string, viewBox: string) {
  assert.match(svg, new RegExp(`<svg\\b[^>]*viewBox="${viewBox.split(' ').join('\\s+')}"`), `${file}: wrong viewBox`);
  assert.ok(svg.trimEnd().endsWith('</svg>'), `${file}: truncated`);
  assert.equal(
    (svg.match(/<g(?:\s[^>]*)?>/g) ?? []).filter((tag) => !/\/\s*>$/.test(tag)).length,
    (svg.match(/<\/g>/g) ?? []).length,
    `${file}: unbalanced groups`,
  );
  assert.doesNotMatch(svg, /<(?:image|rect|foreignObject|canvas)\b|data:image|base64,/i, `${file}: raster or wrapper shortcut`);
  assert.doesNotMatch(svg, /<animate(?:Transform|Motion)?\b|@keyframes/i, `${file}: perpetual SVG animation is forbidden`);
}

validSvg(source, sourceFile, '0 0 96 96');
validSvg(standalone, standaloneFile, '0 0 96 96');
validSvg(micro, microFile, '0 0 32 32');
validSvg(mask, maskFile, '0 0 96 96');
assert.equal(source, standalone, 'authored SVG and standalone asset diverged');
for (const svg of [source, standalone, micro, mask]) assert.ok(svg.includes(`data-brand-vector-source="${SOURCE}"`), 'surface source identity differs');

for (const token of [
  "import rawVector from './brandEmblemV18.svg?raw'",
  "from './brandMotionV18'",
  `const BRAND_VERSION = '${VERSION}'`,
  `const VECTOR_SOURCE = '${SOURCE}'`,
  'createBrandMotionController(node)',
  'controllerRef.current?.enter(event.clientX, event.clientY)',
  'controllerRef.current?.move(event.clientX, event.clientY)',
  'controllerRef.current?.leave()',
  'controllerRef.current?.cancel()',
  "event.pointerType === 'touch'",
  'useReducedMotion()',
  'data-brand-parallax="spring-depth-v2"',
  "style={{ pointerEvents: 'none' }}",
]) assert.ok(component.includes(token), `component missing ${token}`);
assert.doesNotMatch(component, /useState\s*\(/, 'pointer movement must not enter React state');
assert.doesNotMatch(component, /brandMotionV17|data-brand-parallax="layered-v1"/, 'retired interaction plumbing remains');

for (const token of [
  'requestAnimationFrame(step)',
  'cancelAnimationFrame(frame)',
  'new ResizeObserver(readBounds)',
  'node.getBoundingClientRect()',
  "node.dataset.brandInteraction = 'active'",
  "node.dataset.brandInteraction = 'settling'",
  "node.dataset.brandInteraction = 'idle'",
  '[data-brand-interaction="active"]',
  '@media (prefers-reduced-motion:reduce)',
  'a:focus-visible [data-brand-mark]',
]) assert.ok(motion.includes(token), `motion controller missing ${token}`);
assert.equal((motion.match(/getBoundingClientRect\(\)/g) ?? []).length, 1, 'bounds must have one cached read site');
assert.equal((motion.match(/requestAnimationFrame\(/g) ?? []).length, 1, 'motion must have one rAF scheduling site');
assert.doesNotMatch(motion, /setInterval|setTimeout|while\s*\(true\)/, 'idle loop or timer shortcut detected');

for (const hook of [
  'atmosphere', 'energy', 'figure', 'cloak', 'folds', 'upper-folds', 'epic-folds',
  'hood', 'hood-layers', 'face-void', 'face-depth', 'neck-shadow', 'collar',
  'texture', 'seams', 'rim-light',
]) assert.ok(source.includes(`data-brand-${hook}`), `SVG missing semantic layer ${hook}`);

assert.doesNotMatch(source.slice(source.indexOf('<g data-brand-energy='), source.indexOf('<g data-brand-figure=')), /<(?:line|polyline)\b/i, 'energy must use curved authored paths');
for (const geometryToken of [
  'M48 36.5C40.4 35.9',
  'M47.4 7.6C43.9 8.8',
  'M47.5 16.2C44.8 16.8',
  'data-brand-throat=""',
]) assert.ok(source.includes(geometryToken), `preserved v17 visual baseline missing ${geometryToken}`);

const atmosphere = source.slice(source.indexOf('<g data-brand-atmosphere='), source.indexOf('<g data-brand-energy='));
for (const match of atmosphere.matchAll(/d="([^"]+)"/g)) {
  const values = (match[1].match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  assert.ok(values.filter((_, index) => index % 2 === 1).every((value) => value <= 70), 'aura leaked into clean lower crop');
}

assert.ok(mask.includes('fill-rule="evenodd"'), 'mask must cut out the face void');
assert.ok(micro.includes('M16 12.2C13.5 12'), 'micro cloak baseline changed');
assert.ok(micro.includes('M15.8 2.6C14.6 2.9'), 'micro hood baseline changed');
assert.ok(micro.includes('M15.8 5.4C14.9 5.6'), 'micro face baseline changed');

assert.equal(evaluation.candidateSource, SOURCE, 'evaluation source differs from production source');
assert.match(evaluation.candidateRevision, /motion-foundation/i, 'evaluation does not describe the no-regression motion pass');
assert.equal(evaluation.reviewerDecision, 'not-reference-approved', 'visual baseline must remain honest until owner approval');
for (const file of [componentFile, motionFile, sourceFile, standaloneFile, microFile, maskFile]) {
  assert.equal(blob(file), evaluation.candidateGitBlobShas[file], `${file}: evaluation blob lock differs`);
}
for (const file of ['index.html', 'public/site.webmanifest', 'public/browserconfig.xml', 'public/brand-release.txt']) {
  assert.ok(read(file).includes(VERSION), `${file}: cache marker differs from motion-foundation release`);
}

console.log('brand validation: v17 visual baseline preserved byte-for-byte while v18 spring awakening is locked');
