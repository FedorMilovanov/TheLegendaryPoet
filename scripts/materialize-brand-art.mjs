import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve();
const sourceDir = path.join(root, 'src', 'brand-assets');
const publicDir = path.join(root, 'public');
const manifestPath = path.join(sourceDir, 'approved-brand-manifest.json');

function fail(message) {
  throw new Error(`brand materialize: ${message}`);
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

if (!fs.existsSync(manifestPath)) fail('approved-brand-manifest.json is missing');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.schemaVersion !== 1 || manifest.brandVersion !== 'cloak-20260725-2') {
  fail('unsupported manifest schema or brand version');
}
if (!Array.isArray(manifest.sources) || manifest.sources.length !== 3) {
  fail('manifest must declare exactly three encoded approved sources');
}
if (!Array.isArray(manifest.outputs) || manifest.outputs.length !== 9) {
  fail('manifest must declare the complete nine-file platform inventory');
}

fs.mkdirSync(publicDir, { recursive: true });
const staged = [];
try {
  for (const source of manifest.sources) {
    const sourcePath = path.join(sourceDir, source.source);
    if (path.basename(source.source) !== source.source || path.basename(source.output) !== source.output) {
      fail(`unsafe source/output path for ${String(source.source)}`);
    }
    if (!fs.existsSync(sourcePath)) fail(`missing encoded source ${source.source}`);

    const encoded = fs.readFileSync(sourcePath, 'utf8').replace(/\s+/g, '');
    if (!encoded || encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) {
      fail(`invalid Base64 envelope ${source.source}`);
    }
    const binary = Buffer.from(encoded, 'base64');
    if (binary.toString('base64') !== encoded) fail(`non-canonical Base64 ${source.source}`);
    if (binary.length !== source.bytes) fail(`decoded byte length mismatch ${source.source}`);
    if (sha256(binary) !== source.sha256) fail(`decoded SHA-256 mismatch ${source.source}`);

    const target = path.join(publicDir, source.output);
    const temporary = `${target}.tmp-${process.pid}-${crypto.randomBytes(4).toString('hex')}`;
    fs.writeFileSync(temporary, binary, { flag: 'wx' });
    staged.push({ temporary, target, name: source.output });
  }

  for (const entry of staged) fs.renameSync(entry.temporary, entry.target);
} finally {
  for (const entry of staged) {
    if (fs.existsSync(entry.temporary)) fs.rmSync(entry.temporary, { force: true });
  }
}

const seen = new Set();
for (const output of manifest.outputs) {
  if (path.basename(output.name) !== output.name || seen.has(output.name)) {
    fail(`unsafe or duplicate output ${String(output.name)}`);
  }
  seen.add(output.name);
  const outputPath = path.join(publicDir, output.name);
  if (!fs.existsSync(outputPath)) fail(`required platform asset is missing ${output.name}`);
  const binary = fs.readFileSync(outputPath);
  if (binary.length !== output.bytes) fail(`platform byte length mismatch ${output.name}`);
  if (sha256(binary) !== output.sha256) fail(`platform SHA-256 mismatch ${output.name}`);
}

console.log(
  `brand materialize: ${staged.map((entry) => entry.name).join(', ')}; verified ${manifest.outputs.length} approved outputs`,
);
