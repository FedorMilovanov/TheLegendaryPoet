import fs from 'node:fs';
import path from 'node:path';

const errors: string[] = [];

function read(filePath: string) {
  return fs.readFileSync(filePath, 'utf8');
}

function walk(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(entryPath);
    return entry.isFile() ? [entryPath.replaceAll('\\', '/')] : [];
  });
}

function requireText(filePath: string, text: string, label: string) {
  const source = read(filePath);
  if (!source.includes(text)) errors.push(`${filePath}: missing ${label}`);
}

const main = read('src/main.tsx');
const indexImport = main.indexOf('import "./index.css";');
const stabilityImport = main.indexOf('import "./hover-stability.css";');
if (indexImport < 0 || stabilityImport < 0 || stabilityImport <= indexImport) {
  errors.push('src/main.tsx: hover-stability.css must load after index.css');
}

const indexCss = read('src/index.css');
for (const [legacy, label] of [
  ['.tilt-card-wrapper { perspective: 1100px;', 'legacy TiltCard wrapper implementation'],
  ['.tilt-card-inner > * { transform: translateZ(28px); }', 'legacy direct-child depth rule'],
  ['left: -150%;', 'layout-driven sheen start'],
  ['transition: all 0.85s ease-out;', 'legacy sheen transition-all'],
  ['transform: translateY(-5px) scale(1.005);', 'legacy card hover transform'],
  ['.luxury-card:hover::before { left: 150%;', 'legacy layout-driven sheen hover'],
]) {
  if (indexCss.includes(legacy)) errors.push(`src/index.css: forbidden ${label}`);
}
for (const [required, label] of [
  ['.luxury-card {', 'luxury-card visual base'],
  ['.luxury-card::before {', 'luxury-card sheen visual base'],
  ['.luxury-card:hover {', 'luxury-card visual hover state'],
]) {
  if (!indexCss.includes(required)) errors.push(`src/index.css: missing ${label}`);
}

const tiltCard = read('src/components/TiltCard.tsx');
requireText('src/components/TiltCard.tsx', 'className="tilt-card-content relative h-full w-full"', 'stable tilt content plane');
requireText('src/components/TiltCard.tsx', 'onPointerEnter={prepareLayer}', 'pointer-entry compositor warm-up');
requireText('src/components/TiltCard.tsx', "node.dataset.tiltActive = 'true';", 'live-pointer transition ownership');
requireText('src/components/TiltCard.tsx', 'delete ref.current.dataset.tiltActive;', 'tilt transition cleanup');
requireText('src/components/TiltCard.tsx', 'className="tilt-card-sheen', 'separate sheen plane');
if (!tiltCard.includes('<div className="tilt-card-content relative h-full w-full">\n          {children}\n          {sheen && (')) {
  errors.push('src/components/TiltCard.tsx: children and sheen must share the single owned content plane');
}

const stability = read('src/hover-stability.css');
if (stability.includes('.tilt-card-inner > *')) {
  errors.push('src/hover-stability.css: broad direct-child transform reset is forbidden');
}
for (const [text, label] of [
  ['.tilt-card-content {', 'stable content plane CSS'],
  [".tilt-card-inner[data-tilt-active='true']", 'live-pointer transition override'],
  ['transition-duration: 0ms;', 'no transition backlog during pointer input'],
  ['backface-visibility: hidden;', 'backface stabilization'],
  ['transform: translate3d(-160%, 0, 0) skewX(-18deg);', 'transform-only luxury sweep'],
  ['transition-property: transform, opacity;', 'explicit sweep transition properties'],
  ['.tilt-card-inner,\n  .luxury-card {\n    transition: none !important;', 'central reduced-motion transition ownership'],
  ['img[class*="group-hover:scale-"]', 'automatic group-hover artwork protection'],
  ['img[class*="hover:scale-"]', 'automatic direct-hover artwork protection'],
  ['img[class*="group-hover:contrast-"]', 'automatic filter artwork protection'],
]) {
  if (!stability.includes(text)) errors.push(`src/hover-stability.css: missing ${label}`);
}

const nativeImageHook = read('src/hooks/useNativeImageState.ts');
for (const [text, label] of [
  ["image.addEventListener('load', synchronize)", 'native load listener'],
  ["image.addEventListener('error', synchronize)", 'native error listener'],
  ["image.naturalWidth > 0 ? 'ready' : 'error'", 'cached-image completeness synchronization'],
  ["snapshot.src === src ? snapshot.state : 'loading'", 'source-bound native state'],
]) {
  if (!nativeImageHook.includes(text)) errors.push(`src/hooks/useNativeImageState.ts: missing ${label}`);
}

const essayBlocks = read('src/components/essay/blocks.tsx');
for (const [text, label] of [
  ["useNativeImageState(imageSrc)", 'shared native image readiness hook'],
  ['data-image-state={imageState}', 'runtime image state marker'],
  ["imageReady ? 'opacity-100' : 'opacity-0'", 'readiness-driven visibility'],
]) {
  if (!essayBlocks.includes(text)) errors.push(`src/components/essay/blocks.tsx: missing ${label}`);
}
if (essayBlocks.includes('onLoad={() => setLoaded(true)}')) {
  errors.push('src/components/essay/blocks.tsx: synthetic onLoad must not be the sole readiness source');
}

const resilientImage = read('src/components/media/ResilientImage.tsx');
for (const [text, label] of [
  ["useNativeImageState(currentSrc)", 'shared native lifecycle source'],
  ["nativeState === 'ready'", 'native readiness-derived public state'],
  ["nativeState !== 'error'", 'native failure-driven fallback chain'],
  ['data-image-state={state}', 'runtime resilient image state marker'],
  ['data-image-source-index={hasActiveCandidate ? sourceIndex : undefined}', 'fallback source observability'],
]) {
  if (!resilientImage.includes(text)) errors.push(`src/components/media/ResilientImage.tsx: missing ${label}`);
}
for (const [legacy, label] of [
  ["onLoad={(event) => {\n        if (state !== 'failed') setState", 'synthetic-only load state transition'],
  ["onError={(event) => {\n        onError?.(event);\n        if (sourceIndex + 1", 'synthetic-only fallback transition'],
]) {
  if (resilientImage.includes(legacy)) errors.push(`src/components/media/ResilientImage.tsx: forbidden ${label}`);
}

const sourceFiles = walk('src').filter((filePath) => /\.(?:tsx?|css)$/.test(filePath));
const componentFiles = sourceFiles.filter((filePath) => filePath.endsWith('.tsx'));
const mediaTagPattern = /<(?:img|ResilientImage|PoetImage)\b[\s\S]*?\/>/g;
const interactiveMediaEffect = /(?:group-hover|hover|group-focus-within|focus-visible):(?:scale|rotate|translate|skew|saturate|brightness|contrast|opacity)(?:-|\[)/;
const transitionAll = /\btransition-all\b/;
const scalePattern = /(?:group-hover|hover):scale-(?:\[(1(?:\.\d+)?)\]|(\d+))/g;

let mediaTags = 0;
let interactiveMediaTags = 0;
let explicitlyMarkedMediaTags = 0;
let tiltUsages = 0;
let statefulNativeImageImplementations = 0;

for (const filePath of componentFiles) {
  const source = read(filePath);
  tiltUsages += source.match(/<TiltCard\b/g)?.length ?? 0;

  if (source.includes('data-image-state={')) {
    statefulNativeImageImplementations += 1;
    if (!source.includes('useNativeImageState(')) {
      errors.push(`${filePath}: data-image-state implementation must use the shared native lifecycle hook`);
    }
  }

  for (const tag of source.match(mediaTagPattern) ?? []) {
    mediaTags += 1;
    const interactive = interactiveMediaEffect.test(tag);
    if (interactive) interactiveMediaTags += 1;
    if (/\bhover-media\b/.test(tag)) explicitlyMarkedMediaTags += 1;

    if (transitionAll.test(tag)) {
      errors.push(`${filePath}: media element uses transition-all; animate only explicit compositor properties`);
    }

    for (const match of tag.matchAll(scalePattern)) {
      const bracketValue = match[1] ? Number(match[1]) : null;
      const utilityValue = match[2] ? Number(match[2]) / 100 : null;
      const scale = bracketValue ?? utilityValue;
      if (scale != null && scale > 1.08) {
        errors.push(`${filePath}: artwork hover scale ${scale.toFixed(3)} exceeds the 1.08 stability/quality ceiling`);
      }
    }
  }
}

if (tiltUsages === 0) errors.push('src: TiltCard is no longer used; remove or replace its contract intentionally');
if (interactiveMediaTags === 0) errors.push('src: no interactive artwork discovered; validator patterns may be stale');
if (statefulNativeImageImplementations < 2) {
  errors.push('src: expected shared native lifecycle coverage for resilient and essay image implementations');
}

const qa = read('qa/hover-stability.spec.mjs');
for (const [text, label] of [
  ['sample.src).toBe(initial.src)', 'source identity assertion'],
  ['initial.opacity - 0.05', 'relative opacity stability assertion'],
  ['component image state settled after native completion', 'native/component readiness synchronization'],
  ['loaded interactive artwork became painted', 'post-load painted-state assertion'],
  ["initial.transitionProperty).not.toContain('all')", 'transition-all rejection'],
  ['interactive artwork without compositor protection', 'runtime computed-style protection audit'],
  ['sampledImages.length < MAX_IMAGES_PER_SURFACE', 'bounded multi-image sampling'],
  ["path: '/essays/yesenin-duncan-first-meeting-documents'", 'inline essay artwork route'],
  ["path: '/archive'", 'listening archive route'],
  ['TiltCard follows live pointer input without a transition backlog', 'live-pointer tilt regression test'],
  ["card.getAttribute('data-tilt-active')", 'tilt active-state assertion'],
  ["expect(active.transitionDuration).toBe('0s')", 'no-backlog duration assertion'],
]) {
  if (!qa.includes(text)) errors.push(`qa/hover-stability.spec.mjs: missing ${label}`);
}

for (const error of [...new Set(errors)]) console.error(`ERROR ${error}`);
console.log(
  `Hover stability contract: ${sourceFiles.length} source files, ${mediaTags} media tags, `
  + `${interactiveMediaTags} interactive, ${explicitlyMarkedMediaTags} explicitly marked, `
  + `${statefulNativeImageImplementations} native-state implementations, ${tiltUsages} TiltCard usages, `
  + `${errors.length} errors`,
);
if (errors.length > 0) process.exit(1);
