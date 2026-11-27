#!/usr/bin/env node
// Offline-only, byte-identity-checked source acquisition. Never a production media path.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';

const digest = (buffer) => 'sha256:' + crypto.createHash('sha256').update(buffer).digest('hex');
const ACCEPTED_FILES = new Set(['kiprensky-1827-source.jpg', 'onegin-1833-source.pdf']);
const MAX_ATTEMPTS = 3;
const MAX_RETRY_AFTER_MS = 60_000;

// The two workflows own only these generated source directories and files.
// Never recursively remove a caller-provided directory or traverse a symlink.
export function prepareOfflineSourceOutput(root, outputDir) {
  const base = path.resolve(root);
  const target = path.resolve(outputDir);
  const allowed = ['hall-pushkin-offline', 'hall-pushkin-lookdev']
    .map(lane => path.join(base, 'qa-artifacts', lane, 'sources'));
  if (!allowed.includes(target)) throw new Error('unapproved offline source output directory');
  let current = base;
  for (const part of path.relative(base, target).split(path.sep)) {
    current = path.join(current, part);
    let stat;
    try { stat = fs.lstatSync(current); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      fs.mkdirSync(current);
      stat = fs.lstatSync(current);
    }
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('unsafe offline source directory: ' + current);
  }
  const owned = new Set([...ACCEPTED_FILES, 'onegin-1833-title-page.png', 'source-assets-evidence.json']);
  const entries = fs.readdirSync(target, { withFileTypes: true });
  // Check every entry before removing anything, including a stale evidence receipt.
  for (const entry of entries) {
    if (!owned.has(entry.name) || !entry.isFile() || entry.isSymbolicLink()) {
      throw new Error('unexpected offline source output entry: ' + entry.name);
    }
  }
  for (const entry of entries) fs.unlinkSync(path.join(target, entry.name));
}

const retryDelay = (header, attempt, now) => {
  if (!header) return 8_000 * attempt;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.max(1_000, Math.ceil(seconds * 1000));
  const date = Date.parse(header);
  return Number.isFinite(date) ? Math.max(1_000, date - now()) : null;
};

export async function acquireExactOfflineSource({
  asset, outputName, outputDir, cacheDir, fetchImpl = fetch, sleepImpl = sleep, now = Date.now,
}) {
  if (!asset?.offlineAuthoringAuthorized) throw new Error('source is not authorized for offline authoring');
  if (!ACCEPTED_FILES.has(outputName)) throw new Error('unexpected offline source filename');
  if (!/^sha256:[a-f0-9]{64}$/.test(asset.sourceFileHash ?? '')) throw new Error('missing exact source SHA-256 authority');
  const url = new URL(asset.originalFileUrl);
  if (url.protocol !== 'https:' || url.hostname !== 'upload.wikimedia.org') {
    throw new Error(asset.assetId + ': source host must remain upload.wikimedia.org');
  }
  const cacheFile = cacheDir
    ? path.join(path.resolve(cacheDir), asset.sourceFileHash.slice(7) + '-' + outputName)
    : null;
  let bytes;
  let finalUrl = url.href;
  if (cacheFile && fs.existsSync(cacheFile)) {
    bytes = fs.readFileSync(cacheFile);
    if (digest(bytes) !== asset.sourceFileHash) {
      throw new Error(asset.assetId + ': verified offline cache SHA-256 mismatch; refusing cached bytes');
    }
    console.log(asset.assetId + ': using byte-verified offline-only source cache');
  } else {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const response = await fetchImpl(url.href, {
        redirect: 'follow',
        headers: { 'user-agent': 'TheLegendaryPoet-HallV3-offline-evidence/1.1 (https://thelegendarypoet.ru)' },
        signal: AbortSignal.timeout(90_000),
      });
      if (response.ok) {
        const resolved = new URL(response.url || url.href);
        if (resolved.protocol !== 'https:' || resolved.hostname !== 'upload.wikimedia.org') {
          throw new Error(asset.assetId + ': unapproved source redirect host');
        }
        bytes = Buffer.from(await response.arrayBuffer());
        finalUrl = resolved.href;
        break;
      }
      if ((response.status !== 429 && response.status !== 503) || attempt === MAX_ATTEMPTS) {
        throw new Error(asset.assetId + ': source download failed: ' + response.status);
      }
      const retryAfter = response.headers?.get?.('retry-after');
      const delay = retryDelay(retryAfter, attempt, now);
      if (delay === null || delay > MAX_RETRY_AFTER_MS) {
        throw new Error(asset.assetId + ': upstream ' + response.status +
          ' Retry-After exceeds bounded 60s budget; stop rather than bypass rate limit');
      }
      console.warn(asset.assetId + ': upstream ' + response.status + '; respecting Retry-After before retry ' + (attempt + 1));
      await sleepImpl(delay);
    }
    if (!bytes) throw new Error(asset.assetId + ': download did not return bytes');
    if (digest(bytes) !== asset.sourceFileHash) {
      throw new Error(asset.assetId + ': source hash mismatch: ' + digest(bytes) + ' != ' + asset.sourceFileHash);
    }
    if (cacheFile) {
      fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
      const tmp = cacheFile + '.tmp-' + process.pid;
      try {
        fs.writeFileSync(tmp, bytes, { flag: 'wx' });
        fs.renameSync(tmp, cacheFile);
      } finally {
        if (fs.existsSync(tmp)) fs.rmSync(tmp);
      }
    }
  }
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, outputName), bytes);
  return { assetId: asset.assetId, requestedUrl: url.href, finalUrl,
    byteCount: bytes.byteLength, sha256: asset.sourceFileHash, file: outputName };
}
