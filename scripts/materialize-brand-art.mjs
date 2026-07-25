import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve();
const sourceDir = path.join(root, 'src', 'brand-assets');
const publicDir = path.join(root, 'public');
fs.mkdirSync(publicDir, { recursive: true });

const assets = [
  ['master-320-q92.webp.b64', 'brand-emblem-master.webp'],
  ['favicon-16.png.b64', 'favicon-16.png'],
  ['favicon-32.png.b64', 'favicon-32.png'],
];

const written = [];

for (const [sourceName, outputName] of assets) {
  const sourcePath = path.join(sourceDir, sourceName);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`brand materialize: missing encoded source ${sourceName}`);
  }

  const encoded = fs.readFileSync(sourcePath, 'utf8').replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
    throw new Error(`brand materialize: invalid base64 source ${sourceName}`);
  }

  const binary = Buffer.from(encoded, 'base64');
  if (binary.length < 100) {
    throw new Error(`brand materialize: decoded asset is unexpectedly small ${outputName}`);
  }

  fs.writeFileSync(path.join(publicDir, outputName), binary);
  written.push(`${outputName} (${binary.length} B)`);
}

console.log(`brand materialize: ${written.join(', ')}`);
