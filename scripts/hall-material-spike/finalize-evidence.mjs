import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2];
if (!root) {
  console.error('Usage: node finalize-evidence.mjs <evidence-root>');
  process.exit(2);
}

function sha256(filePath) {
  const digest = crypto.createHash('sha256');
  digest.update(fs.readFileSync(filePath));
  return digest.digest('hex');
}

function walk(directory) {
  const result = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...walk(full));
    else if (entry.isFile()) result.push(full);
  }
  return result;
}

const manifestPath = path.join(root, 'sha256-manifest.json');
const files = {};
for (const full of walk(root).sort()) {
  if (path.resolve(full) === path.resolve(manifestPath)) continue;
  files[path.relative(root, full).split(path.sep).join('/')] = sha256(full);
}
fs.writeFileSync(manifestPath, `${JSON.stringify({ schemaVersion: 1, files }, null, 2)}\n`);
console.log(`Finalized ${Object.keys(files).length} Hall spike evidence hashes`);
