import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve();
const sourceDir = path.join(root, 'src', 'brand-assets');
const manifestPath = path.join(sourceDir, 'manifest.json');

function fail(message) {
  throw new Error(`brand materialize: ${message}`);
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

if (!fs.existsSync(manifestPath)) fail('manifest.json is missing');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.schemaVersion !== 2 || manifest.signature !== 'LPBRAND2') {
  fail('unsupported manifest schema or archive signature');
}
if (!Array.isArray(manifest.entries) || manifest.entries.length === 0) {
  fail('manifest entries are missing');
}
if (!Array.isArray(manifest.archive?.parts) || manifest.archive.parts.length === 0) {
  fail('manifest part inventory is missing');
}

const expectedEntries = new Map();
for (const entry of manifest.entries) {
  if (!entry || typeof entry.name !== 'string' || path.basename(entry.name) !== entry.name) {
    fail('manifest contains an invalid entry name');
  }
  if (expectedEntries.has(entry.name)) fail(`manifest contains duplicate entry ${entry.name}`);
  if (!Number.isInteger(entry.size) || entry.size < 1 || !/^[a-f0-9]{64}$/.test(entry.sha256)) {
    fail(`manifest contains invalid integrity data for ${entry.name}`);
  }
  expectedEntries.set(entry.name, entry);
}

const decodedParts = [];
for (const part of manifest.archive.parts) {
  if (!part || typeof part.name !== 'string' || !/^assets\.part\d+\.b64$/.test(part.name)) {
    fail('manifest contains an invalid part name');
  }
  const partPath = path.join(sourceDir, part.name);
  if (!fs.existsSync(partPath)) fail(`encoded part ${part.name} is missing`);
  const encoded = fs.readFileSync(partPath, 'utf8').replace(/\s+/g, '');
  if (encoded.length !== part.encodedLength || encoded.length % 4 !== 0) {
    fail(`${part.name} encoded length mismatch`);
  }
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) fail(`${part.name} contains invalid base64 data`);
  const bytes = Buffer.from(encoded, 'base64');
  if (bytes.toString('base64') !== encoded) fail(`${part.name} is not canonical base64`);
  if (bytes.length !== part.decodedBytes || sha256(bytes) !== part.sha256) {
    fail(`${part.name} decoded integrity mismatch`);
  }
  decodedParts.push(bytes);
}

const archive = Buffer.concat(decodedParts);
if (archive.length !== manifest.archive.byteLength || sha256(archive) !== manifest.archive.sha256) {
  fail('complete archive integrity mismatch');
}

let offset = 0;
function readLine() {
  const end = archive.indexOf(10, offset);
  if (end < 0) fail(`malformed archive header at ${offset}/${archive.length}`);
  const line = archive.subarray(offset, end).toString('utf8');
  offset = end + 1;
  return line;
}

if (readLine() !== manifest.signature) fail('archive signature mismatch');
const fileCount = Number(readLine());
if (!Number.isInteger(fileCount) || fileCount !== expectedEntries.size) {
  fail(`archive file count mismatch: ${String(fileCount)}`);
}

const parsed = [];
const seen = new Set();
for (let index = 0; index < fileCount; index += 1) {
  const name = readLine();
  const length = Number(readLine());
  const expected = expectedEntries.get(name);
  if (!expected || seen.has(name)) fail(`unexpected or duplicate archive entry ${name}`);
  if (!Number.isInteger(length) || length !== expected.size) {
    fail(`archive length mismatch for ${name}`);
  }
  const end = offset + length;
  if (end > archive.length) fail(`truncated archive entry ${name}`);
  const bytes = Buffer.from(archive.subarray(offset, end));
  if (sha256(bytes) !== expected.sha256) fail(`archive hash mismatch for ${name}`);
  parsed.push({ name, bytes });
  seen.add(name);
  offset = end;
}
if (offset !== archive.length) fail(`unexpected trailing bytes: ${archive.length - offset}`);
if (seen.size !== expectedEntries.size) fail('archive is missing expected entries');

const publicDir = path.join(root, 'public');
fs.mkdirSync(publicDir, { recursive: true });
const temporaryFiles = [];
try {
  for (const entry of parsed) {
    const target = path.join(publicDir, entry.name);
    const temporary = `${target}.tmp-${process.pid}-${crypto.randomBytes(4).toString('hex')}`;
    fs.writeFileSync(temporary, entry.bytes, { flag: 'wx' });
    temporaryFiles.push(temporary);
  }
  for (let index = 0; index < parsed.length; index += 1) {
    fs.renameSync(temporaryFiles[index], path.join(publicDir, parsed[index].name));
  }
} finally {
  for (const temporary of temporaryFiles) {
    if (fs.existsSync(temporary)) fs.rmSync(temporary, { force: true });
  }
}

console.log(
  `brand materialize: ${manifest.archive.parts.length} verified parts / ${archive.length} B -> ${parsed
    .map(({ name, bytes }) => `${name} (${bytes.length} B)`)
    .join(', ')}`,
);
