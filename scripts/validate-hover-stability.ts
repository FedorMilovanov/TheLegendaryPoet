import fs from 'node:fs';

const errors: string[] = [];

function read(path: string) {
  return fs.readFileSync(path, 'utf8');
}

function requireText(path: string, text: string, label: string) {
  const source = read(path);
  if (!source.includes(text)) errors.push(`${path}: missing ${label}`);
}

function forbidText(path: string, text: string, label: string) {
  const source = read(path);
  if (source.includes(text)) errors.push(`${path}: forbidden ${label}`);
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
  ['.tilt-card-inner > * {\n  transform: none;', 'legacy child-transform neutralizer'],
  ['.tilt-card-content {', 'stable content plane CSS'],
  ['backface-visibility: hidden;', 'backface stabilization'],
  ['transform: translate3d(-160%, 0, 0) skewX(-18deg);', 'transform-only luxury sweep'],
  ['transition-property: transform, opacity;', 'explicit sweep transition properties'],
  ['.hover-media {', 'shared artwork stabilization class'],
]) {
  if (!stability.includes(text)) errors.push(`src/hover-stability.css: missing ${label}`);
}

const interactiveCards = [
  'src/components/essay/EssayCard.tsx',
  'src/components/PoetCard.tsx',
  'src/components/music/TrackReleaseCard.tsx',
  'src/components/music/TrackAnnouncementCard.tsx',
];

for (const path of interactiveCards) {
  requireText(path, 'hover-media', 'hover-media class on artwork');
  forbidText(path, 'transition-all', 'transition-all on interactive card artwork');
}

const poetCard = read('src/components/PoetCard.tsx');
if (!poetCard.includes('transition-[opacity,transform]')) {
  errors.push('src/components/PoetCard.tsx: shine must animate opacity and transform together');
}
if (poetCard.includes('transition-opacity duration-700 pointer-events-none bg-gradient-to-r')) {
  errors.push('src/components/PoetCard.tsx: legacy transform-jumping shine returned');
}

const essayCard = read('src/components/essay/EssayCard.tsx');
if (!essayCard.includes('group-hover:scale-[1.025]')) {
  errors.push('src/components/essay/EssayCard.tsx: approved restrained cover zoom changed');
}

requireText('qa/hover-stability.spec.mjs', 'sample.src).toBe(initial.src)', 'source identity assertion');
requireText('qa/hover-stability.spec.mjs', 'sample.opacity).toBeGreaterThanOrEqual(0.9)', 'opacity stability assertion');
requireText('qa/hover-stability.spec.mjs', "initial.transitionProperty).not.toContain('all')", 'transition-all rejection');

for (const error of errors) console.error(`ERROR ${error}`);
console.log(`Hover stability contract: ${interactiveCards.length} card families, ${errors.length} errors`);
if (errors.length > 0) process.exit(1);
