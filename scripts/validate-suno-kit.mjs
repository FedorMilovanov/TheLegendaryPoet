import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { measureStyle } from './check-suno-style.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const documents = ['suno/README.md', 'suno/AGENT.md', 'suno/CASES.md'];

// Structural checks only. This cannot certify a model response or a song.
export function validateKit(directory = root) {
  const errors = [];
  for (const file of documents) {
    const absolute = path.join(directory, file);
    if (!fs.existsSync(absolute)) { errors.push(`missing ${file}`); continue; }
    const text = fs.readFileSync(absolute, 'utf8');
    if ((text.match(/^```/gm) || []).length % 2) errors.push(`unclosed fence: ${file}`);
    for (const [, target] of text.matchAll(/\]\(([^)]+)\)/g)) {
      if (/^(?:https?:|#)/.test(target)) continue;
      const linked = path.resolve(path.dirname(absolute), target.split('#')[0]);
      if (!fs.existsSync(linked)) errors.push(`broken local link: ${file} -> ${target}`);
    }
    for (const [, style] of text.matchAll(/^```style\n([\s\S]*?)\n```/gm)) {
      if (!measureStyle(style).valid) errors.push(`invalid example Style: ${file}`);
    }
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
  if (pkg.scripts['check:suno-style'] !== 'node scripts/check-suno-style.mjs') {
    errors.push('missing Style CLI wiring');
  }
  if (!pkg.scripts.check.split(' && ').includes('npm run validate:suno')) {
    errors.push('Suno gate missing from check');
  }
  const agents = fs.readFileSync(path.join(directory, 'AGENTS.md'), 'utf8');
  for (const file of ['suno/AGENT.md', 'suno/CASES.md']) {
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
