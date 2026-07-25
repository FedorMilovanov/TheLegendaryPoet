import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve();
const sourceDir = path.join(root, 'src', 'brand-assets');
const parts = fs
  .readdirSync(sourceDir)
  .filter((name) => /^assets\.part\d+\.b64$/.test(name))
  .sort();

if (parts.length === 0) throw new Error('brand materialize: encoded asset parts are missing');

const encoded = parts
  .map((name) => fs.readFileSync(path.join(sourceDir, name), 'utf8').trim())
  .join('');
const archive = Buffer.from(encoded, 'base64');
let offset = 0;

function readLine() {
  const end = archive.indexOf(10, offset);
  if (end < 0) throw new Error('brand materialize: malformed archive header');
  const line = archive.subarray(offset, end).toString('utf8');
  offset = end + 1;
  return line;
}

if (readLine() !== 'LPBRAND1') throw new Error('brand materialize: invalid archive signature');
const fileCount = Number(readLine());
if (!Number.isInteger(fileCount) || fileCount < 1) throw new Error('brand materialize: invalid file count');

const publicDir = path.join(root, 'public');
fs.mkdirSync(publicDir, { recursive: true });
const written = [];

for (let index = 0; index < fileCount; index += 1) {
  const name = readLine();
  const length = Number(readLine());
  if (!/^[a-z0-9][a-z0-9.-]+$/i.test(name) || !Number.isInteger(length) || length < 1) {
    throw new Error(`brand materialize: invalid entry ${index + 1}`);
  }
  const end = offset + length;
  if (end > archive.length) throw new Error(`brand materialize: truncated entry ${name}`);
  fs.writeFileSync(path.join(publicDir, name), archive.subarray(offset, end));
  offset = end;
  written.push(`${name} (${length} B)`);
}

if (offset !== archive.length) throw new Error('brand materialize: unexpected trailing bytes');
console.log(`brand materialize: ${written.join(', ')}`);
