import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const read=(file:string)=>fs.readFileSync(path.resolve(file),'utf8');
const raw=(file:string)=>fs.readFileSync(path.resolve(file));
const blob=(file:string)=>{const bytes=raw(file);return crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')};
const VERSION='cloak-20260801-22',SOURCE='canonical-reference-v2-black-monolith-v17-0';
const componentFile='src/components/BrandMark.tsx',motionCssFile='src/components/brandMotionV18.ts',motionFile='src/components/brandMotionFrameInvariant.ts',sourceFile='src/components/brandEmblemV18.svg',standaloneFile='public/brand-emblem.svg',microFile='public/brand-mark-micro.svg',maskFile='public/brand-emblem-mask.svg';
const component=read(componentFile),motionCss=read(motionCssFile),motion=read(motionFile),source=read(sourceFile),standalone=read(standaloneFile),micro=read(microFile),mask=read(maskFile);
const evaluation=JSON.parse(read('qa/brand-reference-evaluation.json')) as {candidateSource:string;candidateRevision:string;reviewerDecision:string;candidateGitBlobShas:Record<string,string>};

function validSvg(svg:string,file:string,viewBox:string){
  assert.match(svg,new RegExp(`<svg\\b[^>]*viewBox="${viewBox.split(' ').join('\\s+')}"`),`${file}: viewBox`);
  assert.ok(svg.trimEnd().endsWith('</svg>'),`${file}: truncated`);
  assert.equal((svg.match(/<g(?:\s[^>]*)?>/g)??[]).filter(tag=>!/\/\s*>$/.test(tag)).length,(svg.match(/<\/g>/g)??[]).length,`${file}: groups`);
  assert.doesNotMatch(svg,/<(?:image|rect|foreignObject|canvas)\b|data:image|base64,/i,`${file}: raster shortcut`);
  assert.doesNotMatch(svg,/<animate(?:Transform|Motion)?\b|@keyframes/i,`${file}: perpetual animation`);
}
for(const [svg,file,box] of [[source,sourceFile,'0 0 96 96'],[standalone,standaloneFile,'0 0 96 96'],[micro,microFile,'0 0 32 32'],[mask,maskFile,'0 0 96 96']] as const)validSvg(svg,file,box);
assert.equal(source,standalone,'authored and standalone SVG differ');
for(const svg of [source,standalone,micro,mask])assert.ok(svg.includes(`data-brand-vector-source="${SOURCE}"`));

for(const token of [
  "import rawVector from './brandEmblemV18.svg?raw'",
  "from './brandMotionFrameInvariant'",
  `const BRAND_VERSION = '${VERSION}'`,
  `const VECTOR_SOURCE = '${SOURCE}'`,
  'createBrandMotionController(node)',
  'controllerRef.current?.enter(event.clientX, event.clientY)',
  'controllerRef.current?.move(event.clientX, event.clientY)',
  'controllerRef.current?.leave()',
  'controllerRef.current?.cancel()',
  "event.pointerType === 'touch'",
  'useReducedMotion()',
  'data-brand-parallax="spring-awakening-v5"',
  'data-brand-motion-normalization="rendered-box-v1"',
  'data-brand-motion-timestep="bounded-substeps-v1"',
  'data-brand-awakening="aura-depth-cloth-v2"',
  "style={{ pointerEvents: 'none' }}",
])assert.ok(component.includes(token),`component missing ${token}`);
assert.doesNotMatch(component,/useState\s*\(/,'pointer movement entered React state');
assert.doesNotMatch(component,/brandMotionV17|layered-v1|spring-depth-v2|spring-awakening-v3/,'retired motion identity remains');

for(const token of [
  "import { BRAND_MOTION_CSS } from './brandMotionV18'",
  'requestAnimationFrame(step)',
  'cancelAnimationFrame(frame)',
  'new ResizeObserver(readBounds)',
  'node.getBoundingClientRect()',
  "node.dataset.brandInteraction = 'active'",
  "node.dataset.brandInteraction = 'settling'",
  "node.dataset.brandInteraction = 'idle'",
  'const auraWake = brandMotionPhase(state.wake, 0, 0.42)',
  'const figureWake = brandMotionPhase(state.wake, 0.12, 0.78)',
  'const detailWake = brandMotionPhase(state.wake, 0.32, 1)',
  'maxFrameDeltaSeconds: 0.1',
  'maxSubstepSeconds: 1 / 60',
  'while (remaining > 0.000_001)',
  '--brand-far-scale',
  '--brand-energy-scale',
  '--brand-folds-scale-x',
  '--brand-hood-layers-scale',
  '--brand-face-scale',
  '--brand-rim-brightness',
  '1 - 0.022 * detailWake',
])assert.ok(motion.includes(token),`motion missing ${token}`);
for(const token of [
  'brightness(1.08)',
  '@media (prefers-reduced-motion:reduce)',
  'a:focus-visible [data-brand-mark]',
])assert.ok(motionCss.includes(token),`motion CSS missing ${token}`);
assert.equal((motion.match(/getBoundingClientRect\(\)/g)??[]).length,1,'bounds read site count');
assert.equal((motion.match(/requestAnimationFrame\(/g)??[]).length,1,'rAF scheduling site count');
assert.doesNotMatch(motion,/setInterval|setTimeout|while\s*\(true\)/,'timer/idle loop shortcut');
assert.doesNotMatch(motion,/Math\.min\(0\.032/,'discarded-frame-time clamp returned');

for(const hook of ['atmosphere','energy','figure','cloak','folds','upper-folds','epic-folds','hood','hood-layers','face-void','face-depth','neck-shadow','collar','texture','seams','rim-light'])assert.ok(source.includes(`data-brand-${hook}`),`SVG missing ${hook}`);
assert.doesNotMatch(source.slice(source.indexOf('<g data-brand-energy='),source.indexOf('<g data-brand-figure=')),/<(?:line|polyline)\b/i);
for(const token of ['M48 36.5C40.4 35.9','M47.4 7.6C43.9 8.8','M47.5 16.2C44.8 16.8','data-brand-throat=""'])assert.ok(source.includes(token),`visual baseline missing ${token}`);
assert.ok(mask.includes('fill-rule="evenodd"'));
for(const token of ['M16 12.2C13.5 12','M15.8 2.6C14.6 2.9','M15.8 5.4C14.9 5.6'])assert.ok(micro.includes(token));

assert.equal(evaluation.candidateSource,SOURCE);
assert.match(evaluation.candidateRevision,/v18\.4 depth-first awakening/i);
assert.match(evaluation.candidateRevision,/v18\.6 frame-rate-invariant/i);
assert.equal(evaluation.reviewerDecision,'not-reference-approved');
for(const file of [componentFile,motionCssFile,motionFile,sourceFile,standaloneFile,microFile,maskFile])assert.equal(blob(file),evaluation.candidateGitBlobShas[file],`${file}: blob lock`);
for(const file of ['index.html','public/site.webmanifest','public/browserconfig.xml','public/brand-release.txt'])assert.ok(read(file).includes(VERSION),`${file}: release marker`);
console.log('brand validation: preserved visual baseline plus v18.6 frame-invariant aura-depth-cloth awakening are locked');
