import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = process.cwd();
const acquisitionPath = path.join(root, 'docs/hall-v3/pushkin-acquisition.json');
const outputPath = path.join(root, 'qa-artifacts/pushkin-source-byte-evidence/source-byte-evidence.json');
const testedSha = process.env.TESTED_SHA || process.env.GITHUB_SHA || null;
const allowedIds = new Set([
  'pushkin-kiprensky-1827-portrait',
  'pushkin-onegin-1833-edition',
]);

function fail(message) {
  throw new Error(message);
}

function jpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) fail('JPEG magic mismatch');
  let offset = 2;
  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    while (offset < buffer.length && buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset++];
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) continue;
    if (offset + 2 > buffer.length) break;
    const length = buffer.readUInt16BE(offset);
    if (length < 2 || offset + length > buffer.length) fail('Malformed JPEG segment');
    const isSof = [0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker);
    if (isSof) {
      if (length < 7) fail('Malformed JPEG SOF segment');
      return [buffer.readUInt16BE(offset + 5), buffer.readUInt16BE(offset + 3)];
    }
    offset += length;
  }
  fail('JPEG dimensions not found');
}

async function pdfPageCount(filePath) {
  const { stdout } = await execFileAsync('pdfinfo', [filePath], { maxBuffer: 1024 * 1024 });
  const match = stdout.match(/^Pages:\s+(\d+)\s*$/m);
  if (!match) fail('pdfinfo did not report Pages');
  return Number(match[1]);
}

async function fetchBytes(url, filePath) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'upload.wikimedia.org') fail(`unexpected source host: ${url}`);
  const response = await fetch(url, {
    redirect: 'follow',
    headers: { 'user-agent': 'TheLegendaryPoet-source-byte-evidence/1.0' },
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) fail(`HTTP ${response.status} for ${url}`);
  const finalUrl = new URL(response.url);
  if (finalUrl.protocol !== 'https:' || finalUrl.hostname !== 'upload.wikimedia.org') fail(`unexpected final source host: ${response.url}`);
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  if (contentType.includes('text/html')) fail(`HTML response body rejected for ${url}`);
  const arrayBuffer = await response.arrayBuffer();
  const bytes = Buffer.from(arrayBuffer);
  if (bytes.length < 100_000 || bytes.length > 50_000_000) fail(`unexpected byte count ${bytes.length} for ${url}`);
  await fs.writeFile(filePath, bytes);
  return { bytes, contentType, finalUrl: response.url };
}

const acquisition = JSON.parse(await fs.readFile(acquisitionPath, 'utf8'));
const entries = (acquisition.assets || []).filter((entry) => allowedIds.has(entry.assetId));
if (entries.length !== allowedIds.size) fail('expected exactly two registered Commons acquisition entries');
if (new Set(entries.map((entry) => entry.assetId)).size !== allowedIds.size) fail('duplicate registered Commons acquisition entry');

const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tlp-pushkin-byte-evidence-'));
const evidence = {
  schemaVersion: 1,
  laneId: 'TLP-HALL-001',
  phase: 'pushkinVerticalSlice',
  testedSha,
  generatedAtUtc: new Date().toISOString(),
  sourceFilesCommitted: false,
  assets: [],
};

try {
  for (const entry of entries) {
    if (!entry.originalFileUrl) fail(`${entry.assetId} has no originalFileUrl`);
    const extension = entry.assetId === 'pushkin-kiprensky-1827-portrait' ? '.jpg' : '.pdf';
    const filePath = path.join(tempDir, `${entry.assetId}${extension}`);
    const { bytes, contentType, finalUrl } = await fetchBytes(entry.originalFileUrl, filePath);
    const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
    if (entry.sourceFileHash != null) {
      if (!/^sha256:[a-f0-9]{64}$/.test(entry.sourceFileHash)) fail(`${entry.assetId} recorded sourceFileHash format is invalid`);
      if (entry.sourceFileHash.slice('sha256:'.length) !== sha256) fail(`${entry.assetId} recorded sourceFileHash does not match freshly acquired bytes`);
    }

    const observed = {
      assetId: entry.assetId,
      requestedUrl: entry.originalFileUrl,
      finalUrl,
      responseContentType: contentType || null,
      byteCount: bytes.length,
      sha256: `sha256:${sha256}`,
      recordedSourceFileHash: entry.sourceFileHash ?? null,
    };

    if (entry.assetId === 'pushkin-kiprensky-1827-portrait') {
      const dimensions = jpegDimensions(bytes);
      const expected = entry.reportedRemoteMetadata?.dimensions;
      if (!Array.isArray(expected) || expected.length !== 2) fail('portrait expected dimensions missing');
      if (dimensions[0] !== expected[0] || dimensions[1] !== expected[1]) fail(`portrait dimensions ${dimensions.join('x')} do not match expected ${expected.join('x')}`);
      observed.detectedType = 'image/jpeg';
      observed.dimensions = dimensions;
    } else {
      if (bytes.subarray(0, 5).toString('ascii') !== '%PDF-') fail('PDF magic mismatch');
      const pages = await pdfPageCount(filePath);
      const expectedPages = entry.reportedRemoteMetadata?.pages;
      if (!Number.isInteger(expectedPages) || pages !== expectedPages) fail(`PDF pages ${pages} do not match expected ${expectedPages}`);
      observed.detectedType = 'application/pdf';
      observed.pages = pages;
    }

    evidence.assets.push(observed);
  }

  evidence.assets.sort((a, b) => a.assetId.localeCompare(b.assetId));
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  await fs.rm(tempDir, { recursive: true, force: true });
}
