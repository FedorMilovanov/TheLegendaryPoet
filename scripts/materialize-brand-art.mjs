import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve();
const sourceDir = path.join(root, 'src', 'brand-assets');
const parts = fs
  .readdirSync(sourceDir)
  .filter((name) => /^assets\.part\d+\.b64$/.test(name))
  .sort((left, right) => left.localeCompare(right, 'en', { numeric: true }));

if (parts.length === 0) throw new Error('brand materialize: encoded asset parts are missing');

function decodePart(name) {
  const encoded = fs.readFileSync(path.join(sourceDir, name), 'utf8').replace(/\s+/g, '');
  if (encoded.length === 0 || encoded.length % 4 !== 0) {
    throw new Error(`brand materialize: ${name} has an invalid base64 length (${encoded.length})`);
  }
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) {
    throw new Error(`brand materialize: ${name} contains invalid base64 data`);
  }

  const decoded = Buffer.from(encoded, 'base64');
  if (decoded.toString('base64') !== encoded) {
    throw new Error(`brand materialize: ${name} is not canonical base64`);
  }
  return { name, encodedLength: encoded.length, bytes: decoded };
}

// Each checked-in part is an independently encoded binary slice. Decoding the
// concatenated text would stop at the first part's padding and silently truncate
// the archive. Decode each part first, then join the binary slices.
const decodedParts = parts.map(decodePart);
const archive = Buffer.concat(decodedParts.map((part) => part.bytes));
const partSummary = decodedParts
  .map((part) => `${part.name}:${part.encodedLength}c/${part.bytes.length}B`)
  .join(', ');
console.log(`brand materialize input: ${partSummary}; archive=${archive.length}B`);
let offset = 0;

function readLine() {
  const end = archive.indexOf(10, offset);
  if (end < 0) throw new Error(`brand materialize: malformed archive header at ${offset}/${archive.length}`);
  const line = archive.subarray(offset, end).toString('utf8');
  offset = end + 1;
  return line;
}

if (readLine() !== 'LPBRAND1') throw new Error('brand materialize: invalid archive signature');
const fileCount = Number(readLine());
if (!Number.isInteger(fileCount) || fileCount < 1) throw new Error('brand materialize: invalid file count');

const entries = [];
const names = new Set();
for (let index = 0; index < fileCount; index += 1) {
  const name = readLine();
  const length = Number(readLine());
  if (!/^[a-z0-9][a-z0-9.-]+$/i.test(name) || path.basename(name) !== name) {
    throw new Error(`brand materialize: invalid entry name ${index + 1}`);
  }
  if (names.has(name)) throw new Error(`brand materialize: duplicate entry ${name}`);
  if (!Number.isInteger(length) || length < 1) {
    throw new Error(`brand materialize: invalid entry length for ${name}: ${String(length)}`);
  }

  const available = archive.length - offset;
  const end = offset + length;
  if (end > archive.length) {
    throw new Error(
      `brand materialize: truncated entry ${name}: expected=${length}B available=${available}B `
      + `offset=${offset} archive=${archive.length}B parts=[${partSummary}]`,
    );
  }
  entries.push({ name, bytes: archive.subarray(offset, end) });
  names.add(name);
  offset = end;
}

if (offset !== archive.length) {
  throw new Error(`brand materialize: unexpected trailing bytes: ${archive.length - offset}B`);
}

const publicDir = path.join(root, 'public');
fs.mkdirSync(publicDir, { recursive: true });
for (const entry of entries) {
  const target = path.join(publicDir, entry.name);
  const temporary = `${target}.tmp-${process.pid}`;
  fs.writeFileSync(temporary, entry.bytes);
  fs.renameSync(temporary, target);
}

console.log(
  `brand materialize: ${parts.length} parts / ${archive.length} B -> ${entries
    .map(({ name, bytes }) => `${name} (${bytes.length} B)`)
    .join(', ')}`,
);
