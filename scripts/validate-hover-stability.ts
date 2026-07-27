import fs from 'node:fs';
import path from 'node:path';

const errors: string[] = [];
const warnings: string[] = [];

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

requireText('src/components/TiltCard.tsx', 'className="tilt-card-content relative h-full w-full"', 'stable tilt content plane');
requireText('src/components/TiltCard.tsx', 'onPointerEnter={prepareLayer}', 'pointer-entry compositor warm-up');
requireText('src/components/TiltCard.tsx', 'className="tilt-card-sheen', 'separate sheen plane');

const stability = read('src/hover-stability.css');
for (const [text, label] of [
  ['.tilt-card-inner > * {\n  transform: none;', 'direct-child transform reset'],
  ['.tilt-card-content {', 'stable content plane CSS'],
  ['backface-visibility: hidden;', 'backface stabilization'],
  ['transform: translate3d(-160%, 0, 0) skewX(-18deg);', 'transform-only luxury sweep'],
  ['transition-property: transform, opacity;', 'explicit sweep transition properties'],
  ['.hover-media {', 'shared artwork stabilization class'],
]) {
  if (!stability.includes(text)) errors.push(`src/hover-stability.css: missing ${label}`);
}

const sourceFiles = walk('src').filter((filePath) => /\.(?:tsx?|css)$/.test(filePath));
const componentFiles = sourceFiles.filter((filePath) => filePath.endsWith('.tsx'));
const mediaTagPattern = /<(?:img|ResilientImage|PoetImage)\b[\s\S]*?\/>/g;
const interactiveMediaEffect = /(?:group-hover|hover|group-focus-within|focus-visible):(?:scale|rotate|translate|skew|saturate|brightness|contrast|opacity)(?:-|\[)/;
const transitionAll = /\btransition-all\b/;
const scalePattern = /(?:group-hover|hover):scale-(?:\[(1(?:\.\d+)?)\]|(\d+))/g;

let mediaTags = 0;
let interactiveMediaTags = 0;
let protectedMediaTags = 0;
let tiltUsages = 0;

for (const filePath of componentFiles) {
  const source = read(filePath);
  tiltUsages += source.match(/<TiltCard\b/g)?.length ?? 0;

  for (const tag of source.match(mediaTagPattern) ?? []) {
    mediaTags += 1;
    const interactive = interactiveMediaEffect.test(tag);
    const protectedMedia = /\bhover-media\b/.test(tag);

    if (interactive) interactiveMediaTags += 1;
    if (protectedMedia) protectedMediaTags += 1;

    if (transitionAll.test(tag)) {
      errors.push(`${filePath}: media element uses transition-all; animate only explicit compositor properties`);
    }
    if (interactive && !protectedMedia) {
      errors.push(`${filePath}: transformed/filtered interactive artwork is missing the hover-media stability contract`);
    }
    if (protectedMedia && !interactive) {
      warnings.push(`${filePath}: hover-media is present without an interactive media effect; verify the class is still needed`);
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
if (protectedMediaTags < interactiveMediaTags) {
  errors.push(`src: only ${protectedMediaTags}/${interactiveMediaTags} interactive media tags are protected`);
}

const qa = read('qa/hover-stability.spec.mjs');
for (const [text, label] of [
  ['sample.src).toBe(initial.src)', 'source identity assertion'],
  ['sample.opacity).toBeGreaterThanOrEqual(0.9)', 'opacity stability assertion'],
  ["initial.transitionProperty).not.toContain('all')", 'transition-all rejection'],
  ['interactive artwork without hover-media', 'runtime unprotected-artwork audit'],
  ['visibleImages.slice(0, MAX_IMAGES_PER_SURFACE)', 'multi-image sampling'],
]) {
  if (!qa.includes(text)) errors.push(`qa/hover-stability.spec.mjs: missing ${label}`);
}

for (const warning of [...new Set(warnings)]) console.warn(`WARN ${warning}`);
for (const error of [...new Set(errors)]) console.error(`ERROR ${error}`);
console.log(
  `Hover stability contract: ${sourceFiles.length} source files, ${mediaTags} media tags, `
  + `${interactiveMediaTags} interactive, ${protectedMediaTags} protected, ${tiltUsages} TiltCard usages, `
  + `${errors.length} errors`,
);
if (errors.length > 0) process.exit(1);
