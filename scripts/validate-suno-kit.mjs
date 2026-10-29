import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { measureStyle } from './check-suno-style.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const clipDocuments = [
  'suno/clips/README.md', 'suno/clips/AGENT.md', 'suno/clips/ANIMATION.md',
  'suno/clips/AUDIT.md', 'suno/clips/CASE_YESENIN_HUNTER.md',
  'suno/clips/PROJECT_TEMPLATE.md', 'suno/clips/STORAGE.md', 'suno/clips/VISUALS.md',
  'suno/clips/references/yesenin-epic/README.md',
  'suno/clips/projects/yesenin-chto-eto-takoe.md',
];
export const documents = ['suno/README.md', 'suno/AGENT.md', 'suno/CASES.md',
  'suno/PRONUNCIATION_AND_REPAIR.md', 'suno/RESEARCH_2026-10-25.md', ...clipDocuments];
export const referenceAssets = [
  'action-two-guns.jpg', 'creature-root-giant.jpg', 'expression-calm-alert-daylight.jpg',
  'expression-full-shout-night.jpg', 'expression-startled-night.jpg',
  'expression-tense-call-night.jpg', 'identity-face-close.jpg', 'identity-master.jpg',
  'tree-origin.jpg',
].map(file => `suno/clips/references/yesenin-epic/${file}`);

// A bounded fence reader, not a full Markdown parser. Match delimiter and length;
// an info string opens a fence but cannot close one. Preserve CRLF semantics.
export function readFences(text) {
  const blocks = [];
  let open;
  for (const line of text.split(/\r?\n/)) {
    const match = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (!open) {
      if (match && !(match[1][0] === '`' && match[2].includes('`'))) {
        open = { delimiter: match[1], language: match[2].trim(), lines: [] };
      }
    } else if (match && match[1][0] === open.delimiter[0] &&
        match[1].length >= open.delimiter.length && !match[2].trim()) {
      blocks.push({ language: open.language, text: open.lines.join('\n') });
      open = undefined;
    } else { open.lines.push(line); }
  }
  return { blocks, unclosed: Boolean(open) };
}

// Structural checks only. This cannot certify a model response or a song.
export function validateKit(directory = root) {
  const errors = [];
  for (const file of documents) {
    const absolute = path.join(directory, file);
    if (!fs.existsSync(absolute)) { errors.push(`missing ${file}`); continue; }
    const text = fs.readFileSync(absolute, 'utf8');
    const fences = readFences(text);
    if (fences.unclosed) errors.push(`unclosed fence: ${file}`);
    for (const [, target] of text.matchAll(/\]\(([^)]+)\)/g)) {
      if (/^(?:https?:|#)/.test(target)) continue;
      const linked = path.resolve(path.dirname(absolute), target.split('#')[0]);
      if (!fs.existsSync(linked)) errors.push(`broken local link: ${file} -> ${target}`);
    }
    for (const block of fences.blocks.filter(block => block.language === 'style')) {
      if (!measureStyle(block.text).valid) errors.push(`invalid example Style: ${file}`);
    }
  }
  for (const file of referenceAssets) {
    if (!fs.existsSync(path.join(directory, file))) errors.push(`missing reference: ${file}`);
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
  if (pkg.scripts['check:suno-style'] !== 'node scripts/check-suno-style.mjs') {
    errors.push('missing Style CLI wiring');
  }
  if (pkg.scripts['check:suno-lyrics'] !== 'node scripts/check-suno-lyrics.mjs') {
    errors.push('missing literal Lyrics CLI wiring');
  }
  if (!pkg.scripts.check.split(' && ').includes('npm run validate:suno')) {
    errors.push('Suno gate missing from check');
  }
  if (!pkg.scripts['validate:suno']?.includes('scripts/tests/suno-lyrics.test.mjs')) {
    errors.push('literal Lyrics regressions missing from Suno gate');
  }
  const agents = fs.readFileSync(path.join(directory, 'AGENTS.md'), 'utf8');
  for (const file of ['suno/AGENT.md', 'suno/CASES.md', 'suno/clips/AGENT.md', 'suno/clips/README.md']) {
    if (!agents.includes(file)) errors.push(`missing agent routing: ${file}`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    validateKit();
    console.log('Suno kit: structural checks PASS (not a Lyrics/audio quality certificate)');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
