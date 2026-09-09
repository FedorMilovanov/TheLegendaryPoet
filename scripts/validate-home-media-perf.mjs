import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const poets = ['yesenin', 'lermontov', 'pushkin', 'tyutchev', 'mayakovsky', 'fet'];
const critical = ['yesenin', 'lermontov'];
const failures = [];

function fail(message) {
  failures.push(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function jpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9) continue;
    if (marker === 0xda) break;
    if (offset + 2 > buffer.length) break;
    const length = buffer.readUInt16BE(offset);
    if (length < 2 || offset + length > buffer.length) break;
    const isSof = [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker);
    if (isSof && length >= 7) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      };
    }
    offset += length;
  }
  return null;
}

const sizesByWidth = new Map([[320, new Map()], [480, new Map()]]);
for (const poet of poets) {
  for (const width of [320, 480]) {
    const relativePath = `public/images/${poet}-${width}.jpg`;
    const fullPath = path.join(root, relativePath);
    if (!fs.existsSync(fullPath)) {
      fail(`missing responsive hero derivative: ${relativePath}`);
      continue;
    }
    const bytes = fs.readFileSync(fullPath);
    const dimensions = jpegDimensions(bytes);
    const expectedHeight = width * 5 / 4;
    if (!dimensions || dimensions.width !== width || dimensions.height !== expectedHeight) {
      fail(`${relativePath} must be ${width}x${expectedHeight}; got ${dimensions ? `${dimensions.width}x${dimensions.height}` : 'non-JPEG/unknown'}`);
    }
    sizesByWidth.get(width).set(poet, bytes.length);
  }
}

const critical320 = critical.reduce((sum, poet) => sum + (sizesByWidth.get(320).get(poet) ?? Number.POSITIVE_INFINITY), 0);
const critical480 = critical.reduce((sum, poet) => sum + (sizesByWidth.get(480).get(poet) ?? Number.POSITIVE_INFINITY), 0);
if (critical320 > 32 * 1024) fail(`critical 320w pair exceeds 32 KiB: ${critical320} bytes`);
if (critical480 > 56 * 1024) fail(`critical 480w pair exceeds 56 KiB: ${critical480} bytes`);

const hero = read('src/components/home/HeroPoetWindow.tsx');
for (const required of [
  'const isHighPriority = index < 2;',
  "return photo?.replace(/\\.jpg$/i, '-320.jpg');",
  'src={portraitPrimary}',
  "loading={isHighPriority ? 'eager' : 'lazy'}",
  "fetchPriority={isHighPriority ? 'high' : 'low'}",
  "window.addEventListener('load', releaseAfterLoad, { once: true });",
  'requestAnimationFrame(() => {',
  "`${asset(`${stem}-320.jpg`)} 320w`",
  "`${asset(`${stem}-480.jpg`)} 480w`",
  "`${asset(photo)} 1000w`",
]) {
  if (!hero.includes(required)) fail(`HeroPoetWindow contract missing: ${required}`);
}

const resilient = read('src/components/media/ResilientImage.tsx');
for (const required of [
  'const hasResponsivePrimary = Boolean(src?.trim()) && hasActiveCandidate && sourceIndex === 0;',
  'srcSet={hasResponsivePrimary ? srcSet : undefined}',
  'sizes={hasResponsivePrimary ? sizes : undefined}',
  'src={currentSrc}',
]) {
  if (!resilient.includes(required)) fail(`ResilientImage responsive fallback contract missing: ${required}`);
}

const perfSpec = read('qa/home-media-perf.spec.mjs');
for (const required of [
  "page.on('request'",
  "page.once('load'",
  'heroDerivativeRequests',
  'boundedFallbacks',
  'isHeroDerivative(identity)',
]) {
  if (!perfSpec.includes(required)) fail(`home media browser proof missing protocol ownership contract: ${required}`);
}
if (perfSpec.includes("getEntriesByType('resource')")) {
  fail('home media browser proof must not depend on optional Resource Timing exposure');
}

const config = read('playwright.home-polish.config.mjs');
if (!config.includes('media-perf')) fail('home media perf spec is not selected by playwright.home-polish.config.mjs');

const standardRunner = read('scripts/run-home-polish-process-isolated.mjs');
if (!standardRunner.includes("'qa/home-media-perf.spec.mjs'")) fail('desktop/Pixel runner does not include home-media-perf.spec.mjs');

const iphoneRunner = read('scripts/run-home-polish-iphone-critical-process-isolated.mjs');
if (!iphoneRunner.includes("file: 'qa/home-media-perf.spec.mjs'")) fail('critical iPhone runner does not include home-media-perf.spec.mjs');

if (failures.length) {
  console.error('Home media performance contract failed:');
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

console.log(`Home media performance contract passed: 12 derivatives; critical320=${critical320}B; critical480=${critical480}B`);
