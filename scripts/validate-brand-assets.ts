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
const SOURCE = 'square-closeup-reference-v18-2';
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

for (const svg of [source, standalone, micro, mask]) {
  assert.ok(svg.includes(`data-brand-vector-source="${SOURCE}"`), 'surface source identity differs');
}

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
assert.doesNotMatch(component, /brandEmblemV17|brandMotionV17|layered-v1/, 'component still references retired v17 plumbing');

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
  '[data-brand-turbulence]',
  '[data-brand-displacement]',
  'time - lastFilterWrite >= 48',
]) assert.ok(motion.includes(token), `motion controller missing ${token}`);
assert.equal((motion.match(/getBoundingClientRect\(\)/g) ?? []).length, 1, 'bounds must have one cached read site');
assert.equal((motion.match(/requestAnimationFrame\(/g) ?? []).length, 1, 'motion must have one rAF scheduling site');
assert.doesNotMatch(motion, /setInterval|setTimeout|while\s*\(true\)|requestAnimationFrame\([^)]*=>\s*requestAnimationFrame/, 'idle loop or recursive shortcut detected');
assert.doesNotMatch(motion, /new\s+(?:Map|Set|Array|Object)\b|\.map\(|\.filter\(|\.reduce\(/, 'hot motion module should avoid collection allocation patterns');

for (const hook of [
  'atmosphere', 'energy', 'figure', 'cloak', 'folds', 'left-folds', 'right-folds',
  'central-folds', 'epic-folds', 'hood', 'hood-layers', 'face-void', 'face-depth',
  'neck-shadow', 'cowl', 'collar', 'texture', 'seams', 'rim-light',
  'turbulence', 'displacement',
]) assert.ok(source.includes(`data-brand-${hook}`), `SVG missing semantic layer ${hook}`);

assert.ok((source.match(/<filter\b/g) ?? []).length <= 3, 'too many filtered groups for header emblem');
assert.ok((source.match(/<feTurbulence\b/g) ?? []).length === 1, 'one controlled turbulence field is required');
assert.ok((source.match(/<feDisplacementMap\b/g) ?? []).length === 1, 'one controlled displacement field is required');
assert.doesNotMatch(source, /<line\b|<polyline\b/i, 'energy must use curved authored paths');

for (const geometryToken of [
  'M48 38.8C39.8 38',
  'M48 6.8C43.5 8',
  'M48 17.2C43.2 17.9',
  'M21.7 39.4C29.6 37.9',
  'M3.1 96C8.7 80.4',
  'M92.9 96C87.3 80.6',
]) assert.ok(source.includes(geometryToken), `v18.2 macro geometry missing ${geometryToken}`);

const atmosphere = source.slice(source.indexOf('<g data-brand-atmosphere='), source.indexOf('<g data-brand-energy='));
for (const match of atmosphere.matchAll(/d="([^"]+)"/g)) {
  const numbers = (match[1].match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  const ys = numbers.filter((_, index) => index % 2 === 1);
  assert.ok(ys.every((value) => value <= 59), 'aura leaked into the clean lower crop');
}

const face = source.match(/data-brand-face-depth="" data-brand-face-void="" d="([^"]+)"/)?.[1] ?? '';
assert.ok(face.includes('M48 17.2') && face.includes('48 43.2'), 'broad deep face void is not locked');
assert.ok(mask.includes('fill-rule="evenodd"'), 'mask must cut out the face void');
assert.ok(micro.includes('M16 2.1C14.3 2.6'), 'micro hood geometry is missing');
assert.ok(micro.includes('M16 5.6C14.2 5.9'), 'micro face void geometry is missing');

assert.equal(evaluation.candidateSource, SOURCE, 'evaluation source differs from production source');
assert.match(evaluation.candidateRevision, /v18\.2/, 'evaluation does not describe v18.2');
assert.equal(evaluation.reviewerDecision, 'not-reference-approved', 'v18.2 must remain honest until owner approval');
for (const file of [componentFile, motionFile, sourceFile, standaloneFile, microFile, maskFile]) {
  assert.equal(blob(file), evaluation.candidateGitBlobShas[file], `${file}: evaluation blob lock differs`);
}

for (const file of ['index.html', 'public/site.webmanifest', 'public/browserconfig.xml', 'public/brand-release.txt']) {
  assert.ok(read(file).includes(VERSION), `${file}: cache marker differs from v18 release`);
}

console.log('brand validation: v18.2 square-reference geometry, synchronized surfaces and damped hover awakening are locked');
