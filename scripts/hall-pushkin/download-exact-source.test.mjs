import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { acquireExactOfflineSource } from './download-exact-source.mjs';

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
