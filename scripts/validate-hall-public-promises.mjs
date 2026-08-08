import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const legacyHallPrefix = 'src/components/hall/';
const roots = ['src', 'qa'];
const sourcePattern = /\.(?:ts|tsx|js|jsx|mjs)$/;

const retiredTokens = [
  'Храм Русской Поэзии',
  'Храм русской поэзии',
  'купольный пантеон',
  'залы разных эпох',
  'hall-preview.webp',
  'hall_target_v3_temple.webp',
];

function walk(relativeDir) {
  const absoluteDir = path.join(root, relativeDir);
  return fs.readdirSync(absoluteDir, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.posix.join(relativeDir, entry.name);
    if (entry.isDirectory()) return walk(relativePath);
    return entry.isFile() && sourcePattern.test(entry.name) ? [relativePath] : [];
  });
}

for (const sourceRoot of roots) {
  for (const relativePath of walk(sourceRoot)) {
    if (relativePath.startsWith(legacyHallPrefix)) continue;
    const text = fs.readFileSync(path.join(root, relativePath), 'utf8');
    for (const token of retiredTokens) {
      if (text.includes(token)) failures.push(`${relativePath}: retired Hall promise/reference remains: ${token}`);
    }
  }
}

if (failures.length) {
  console.error('Hall public-promise validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Hall public-promise validation passed: ${retiredTokens.length} retired architecture/reference tokens are absent from current source and QA outside legacy Hall evidence.`);
