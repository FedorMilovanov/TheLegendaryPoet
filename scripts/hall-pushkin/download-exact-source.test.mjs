import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { acquireExactOfflineSource, prepareOfflineSourceOutput } from './download-exact-source.mjs';

const bytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x11, 0x55, 0x22]);
const hash = 'sha256:' + crypto.createHash('sha256').update(bytes).digest('hex');
const url = 'https://upload.wikimedia.org/wikipedia/commons/7/7a/portrait.jpg';
const asset = { assetId: 'pushkin-kiprensky-1827-portrait',
  originalFileUrl: url, offlineAuthoringAuthorized: true, sourceFileHash: hash };
const make = (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hall-exact-source-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return { outputDir: path.join(dir, 'output'), cacheDir: path.join(dir, 'cache'), outputName: 'kiprensky-1827-source.jpg' };
};
const response = (status, payload = bytes, retryAfter) => ({
  status, ok: status === 200, url,
  headers: { get: () => retryAfter ?? null },
  arrayBuffer: async () => Uint8Array.from(payload).buffer,
});

test('verified cache avoids network and preserves source evidence identity', async (t) => {
  const paths = make(t);
  let calls = 0;
  const first = await acquireExactOfflineSource({ asset, ...paths, fetchImpl: async () => { calls++; return response(200); } });
  assert.equal(calls, 1);
  fs.rmSync(paths.outputDir, { recursive: true, force: true });
  const second = await acquireExactOfflineSource({ asset, ...paths, fetchImpl: () => { throw new Error('network should not be called'); } });
  assert.deepEqual(second, first);
  assert.deepEqual(fs.readFileSync(path.join(paths.outputDir, paths.outputName)), bytes);
});

test('tampered cache fails closed without fetching a substitute', async (t) => {
  const paths = make(t); fs.mkdirSync(paths.cacheDir, {recursive:true});
  fs.writeFileSync(path.join(paths.cacheDir, hash.slice(7) + '-' + paths.outputName), Buffer.from('poison'));
  await assert.rejects(acquireExactOfflineSource({ asset, ...paths,
    fetchImpl: () => { throw new Error('network must not run'); },
  }), /cache SHA-256 mismatch/);
});

test('large upstream Retry-After is respected without hammering CDN', async (t) => {
  const paths = make(t); let calls = 0;
  await assert.rejects(acquireExactOfflineSource({ asset, ...paths,
    fetchImpl: async () => { calls++; return response(429, bytes, '600'); },
  }), /Retry-After exceeds bounded/);
  assert.equal(calls, 1);
});

test('bounded 429 retries once and verifies eventual bytes', async (t) => {
  const paths = make(t); let calls = 0; const waits = [];
  const result = await acquireExactOfflineSource({ asset, ...paths,
    fetchImpl: async () => { calls++; return calls === 1 ? response(429, bytes, '1') : response(200); },
    sleepImpl: async ms => { waits.push(ms); },
  });
  assert.equal(calls, 2); assert.deepEqual(waits, [1000]); assert.equal(result.sha256, hash);
});

test('wrong bytes cannot populate cache or output', async (t) => {
  const paths = make(t);
  await assert.rejects(acquireExactOfflineSource({ asset, ...paths,
    fetchImpl: async () => response(200, Buffer.from('wrong')),
  }), /source hash mismatch/);
  assert.equal(fs.existsSync(paths.outputDir), false);
  assert.equal(fs.existsSync(paths.cacheDir), false);
});

test('unauthorized source and off-Wikimedia redirect are refused', async (t) => {
  const paths = make(t);
  await assert.rejects(acquireExactOfflineSource({ asset: {...asset, offlineAuthoringAuthorized:false}, ...paths,
    fetchImpl: async () => response(200),
  }), /not authorized/);
  await assert.rejects(acquireExactOfflineSource({ asset, ...paths,
    fetchImpl: async () => ({...response(200), url:'https://example.org/hijack'}),
  }), /unapproved source redirect/);
});


test('offline source cleanup is confined to the two generated source directories', (t) => {
  const root = path.dirname(make(t).outputDir);
  const keep = path.join(root, 'keep.txt');
  fs.writeFileSync(keep, 'keep');
  for (const target of [root, path.dirname(root), path.join(root, 'qa-artifacts'), path.join(root, 'other')]) {
    assert.throws(() => prepareOfflineSourceOutput(root, target), /unapproved offline source output directory/);
  }
  for (const lane of ['hall-pushkin-offline', 'hall-pushkin-lookdev']) {
    const target = path.join(root, 'qa-artifacts', lane, 'sources');
    prepareOfflineSourceOutput(root, target);
    for (const name of ['kiprensky-1827-source.jpg', 'onegin-1833-source.pdf', 'onegin-1833-title-page.png', 'source-assets-evidence.json']) {
      fs.writeFileSync(path.join(target, name), 'old generated output');
    }
    prepareOfflineSourceOutput(root, target);
    assert.deepEqual(fs.readdirSync(target), []);
  }
  assert.equal(fs.readFileSync(keep, 'utf8'), 'keep');
});

test('offline source cleanup refuses foreign files before deleting owned output', (t) => {
  const root = path.dirname(make(t).outputDir);
  const target = path.join(root, 'qa-artifacts', 'hall-pushkin-offline', 'sources');
  prepareOfflineSourceOutput(root, target);
  const owned = path.join(target, 'source-assets-evidence.json');
  fs.writeFileSync(owned, 'receipt');
  fs.writeFileSync(path.join(target, 'notes.txt'), 'keep');
  assert.throws(() => prepareOfflineSourceOutput(root, target), /unexpected offline source output entry/);
  assert.equal(fs.readFileSync(owned, 'utf8'), 'receipt');
  assert.equal(fs.readFileSync(path.join(target, 'notes.txt'), 'utf8'), 'keep');
});

test('offline source cleanup refuses symlinked directories and files', (t) => {
  const root = path.dirname(make(t).outputDir);
  const external = path.join(root, 'outside');
  fs.mkdirSync(external);
  const keep = path.join(external, 'source-assets-evidence.json');
  fs.writeFileSync(keep, 'keep');
  const parent = path.join(root, 'qa-artifacts');
  fs.symlinkSync(external, parent, 'junction');
  const target = path.join(parent, 'hall-pushkin-offline', 'sources');
  assert.throws(() => prepareOfflineSourceOutput(root, target), /unsafe offline source directory/);
  fs.unlinkSync(parent);
  prepareOfflineSourceOutput(root, target);
  fs.symlinkSync(external, path.join(target, 'onegin-1833-source.pdf'), 'junction');
  assert.throws(() => prepareOfflineSourceOutput(root, target), /unexpected offline source output entry/);
  assert.equal(fs.readFileSync(keep, 'utf8'), 'keep');
});
