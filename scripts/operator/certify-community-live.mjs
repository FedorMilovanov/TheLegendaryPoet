#!/usr/bin/env node

import { randomUUID } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const PRODUCTION_ORIGIN = 'https://thelegendarypoet.ru';
const DEFAULT_MANIFEST_URL = 'https://thelegendarypoet.ru/community-targets.json';
const DATABASE_NAME = 'the-legendary-poet-community';
const WRANGLER_VERSION = '4.120.0';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TARGET_ID = /^[a-z0-9][a-z0-9-]{1,159}$/;
const TARGET_TYPES = new Set(['poet', 'poem', 'track', 'article']);

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith('--')) fail(`Unexpected argument: ${key}`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) fail(`Missing value for ${key}`);
    args.set(key, value);
    index += 1;
  }
  const apiUrl = args.get('--api-url')?.replace(/\/+$/, '');
  const targetType = args.get('--target-type');
  const targetId = args.get('--target-id');
  const manifestUrl = args.get('--manifest-url') ?? DEFAULT_MANIFEST_URL;

  if (!apiUrl) fail('Required: --api-url https://<production-worker-host>');
  let parsedApi;
  try {
    parsedApi = new URL(apiUrl);
  } catch {
    fail('--api-url must be an absolute URL');
  }
  if (parsedApi.protocol !== 'https:' || parsedApi.username || parsedApi.password) {
    fail('--api-url must be credential-free HTTPS');
  }
  if (!TARGET_TYPES.has(targetType)) fail('--target-type must be poet, poem, track or article');
  if (!targetId || !TARGET_ID.test(targetId)) fail('--target-id must satisfy the production canonical ID syntax');

  let parsedManifest;
  try {
    parsedManifest = new URL(manifestUrl);
  } catch {
    fail('--manifest-url must be an absolute URL');
  }
  if (parsedManifest.protocol !== 'https:') fail('--manifest-url must use HTTPS');

  return { apiUrl, targetType, targetId, manifestUrl };
}

function readHidden(label) {
  if (!process.stdin.isTTY || !process.stdout.isTTY || typeof process.stdin.setRawMode !== 'function') {
    fail('Actor tokens must be entered from an interactive local TTY; piping/environment token injection is deliberately unsupported.');
  }

  return new Promise((resolveValue, reject) => {
    process.stdout.write(label);
    const stdin = process.stdin;
    const previousRaw = stdin.isRaw === true;
    let value = '';

    const restore = () => {
      stdin.off('data', onData);
      stdin.setRawMode(previousRaw);
      stdin.pause();
      process.stdout.write('\n');
    };

    const finish = () => {
      restore();
      const trimmed = value.trim();
      if (!trimmed) reject(new Error('Actor token cannot be empty'));
      else resolveValue(trimmed);
    };

    const onData = (chunk) => {
      for (const char of String(chunk)) {
        if (char === '\u0003') {
          restore();
          reject(new Error('Operator cancelled'));
          return;
        }
        if (char === '\r' || char === '\n') {
          finish();
          return;
        }
        if (char === '\u007f' || char === '\b') {
          value = value.slice(0, -1);
          continue;
        }
        if (char >= ' ') value += char;
      }
    };

    stdin.setEncoding('utf8');
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
  });
}

function decodeActorSession(token) {
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') fail('Actor token is not a v1 signed session');
  let payload;
  try {
    payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    fail('Actor token payload is not valid base64url JSON');
  }
  if (payload?.v !== 1 || !UUID.test(payload.actor) || !Number.isFinite(payload.iat) || !Number.isFinite(payload.exp)) {
    fail('Actor token payload does not satisfy the production session contract');
  }
  if (payload.exp <= Date.now()) fail('Actor token is expired');
  return { actor: payload.actor, iat: payload.iat, exp: payload.exp };
}

async function fetchJson(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      Origin: PRODUCTION_ORIGIN,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(15_000),
  });
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { status: response.status, ok: response.ok, body };
}

async function postComment(apiUrl, token, payload) {
  return fetchJson(`${apiUrl}/v1/comment`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

async function proveSignedSession(apiUrl, token, payload) {
  const result = await postComment(apiUrl, token, payload);
  expectResponse(result, 404, 'unknown_target');
  return true;
}

function expectResponse(result, status, code = null) {
  if (result.status !== status) {
    fail(`Expected HTTP ${status}, received ${result.status} with code ${String(result.body?.code ?? 'unknown')}`);
  }
  if (code && result.body?.code !== code) {
    fail(`Expected response code ${code}, received ${String(result.body?.code ?? 'unknown')}`);
  }
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

async function cleanupCertificationArtifacts({ actorA, actorB, targetType, targetId, commentId, repoRoot }) {
  const temp = await mkdtemp(join(tmpdir(), 'tlp-community-live-cleanup-'));
  const sqlPath = join(temp, 'cleanup.sql');
  const actors = `${sqlLiteral(actorA)}, ${sqlLiteral(actorB)}`;
  const sql = [
    'PRAGMA foreign_keys = ON;',
    `DELETE FROM tlp_helpful_votes WHERE comment_id = ${sqlLiteral(commentId)};`,
    `DELETE FROM tlp_comments WHERE id = ${sqlLiteral(commentId)} AND actor_id IN (${actors});`,
    `DELETE FROM tlp_ratings WHERE target_type = ${sqlLiteral(targetType)} AND target_id = ${sqlLiteral(targetId)} AND actor_id IN (${actors});`,
    '-- Deliberately do not delete unrelated rows for either actor.',
    '-- Deliberately do not delete tlp_rate_buckets: they are shared network-abuse authority.',
    '',
  ].join('\n');
  await writeFile(sqlPath, sql, { encoding: 'utf8', mode: 0o600 });

  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawnSync(
    npx,
    ['--yes', `wrangler@${WRANGLER_VERSION}`, 'd1', 'execute', DATABASE_NAME, '--remote', `--file=${sqlPath}`],
    {
      cwd: join(repoRoot, 'workers/community-api'),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    },
  );

  if (result.status !== 0) {
    process.stderr.write('ERROR: live proof completed, but D1 cleanup failed.\n');
    process.stderr.write(`Cleanup SQL retained locally at: ${sqlPath}\n`);
    process.stderr.write('Do not publish that file; it contains pseudonymous actor UUIDs. Re-run the pinned Wrangler cleanup locally.\n');
    const message = String(result.stderr || result.stdout || '').split(/\r?\n/).filter(Boolean).slice(-4).join(' | ');
    if (message) process.stderr.write(`Wrangler: ${message}\n`);
    return { ok: false, temp, sqlPath };
  }

  await rm(temp, { recursive: true, force: true });
  return { ok: true };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

  const health = await fetchJson(`${options.apiUrl}/health`);
  expectResponse(health, 200);
  const healthReady = health.body?.ok === true
    && health.body?.database === 'd1'
    && health.body?.databaseReady === true
    && health.body?.targetAuthorityReady === true
    && health.body?.writesReady === true;
  if (!healthReady) fail('Production /health is not fully write-ready');

  const manifest = await fetchJson(options.manifestUrl, { headers: { 'Cache-Control': 'no-cache' } });
  expectResponse(manifest, 200);
  const ids = manifest.body?.version === 1 ? manifest.body?.targets?.[options.targetType] : null;
  if (!Array.isArray(ids) || !ids.includes(options.targetId)) {
    fail(`Target ${options.targetType}:${options.targetId} is not present in the current production manifest`);
  }

  process.stdout.write([
    '',
    'Human boundary:',
    '- use TWO fresh normal browser profiles (not automation);',
    '- on the SAME canonical target, submit a temporary rating in each profile so Turnstile mints a signed actor session;',
    '- copy only actorToken from localStorage key tlp-community-actor:v1 into the hidden prompts below;',
    '- tokens stay in this process memory and are never printed or passed on the command line.',
    '',
  ].join('\n'));

  const tokenA = await readHidden('Fresh profile A actorToken (hidden): ');
  const tokenB = await readHidden('Fresh profile B actorToken (hidden): ');
  const sessionA = decodeActorSession(tokenA);
  const sessionB = decodeActorSession(tokenB);
  if (tokenA === tokenB || sessionA.actor === sessionB.actor) {
    fail('Rotated identity proof requires two distinct signed actor sessions from two fresh human-backed profiles');
  }

  const nonce = randomUUID().toLowerCase();
  const commentId = `comment-live-cert-${nonce}`;
  const basePayload = {
    commentId,
    targetType: options.targetType,
    targetId: options.targetId,
    author: 'Operator QA',
    text: `Temporary live certification ${nonce}; remove after proof.`,
    commentKind: 'history',
  };

  let cleanupResult = { ok: false };
  let cleanupAuthorized = false;
  let proofComplete = false;
  try {
    const unknownTargetPayload = {
      ...basePayload,
      commentId: `comment-live-cert-missing-${nonce}`,
      targetId: `live-cert-missing-${nonce.replaceAll('-', '')}`,
    };
    await Promise.all([
      proveSignedSession(options.apiUrl, tokenA, unknownTargetPayload),
      proveSignedSession(options.apiUrl, tokenB, {
        ...unknownTargetPayload,
        commentId: `comment-live-cert-missing-b-${nonce}`,
      }),
    ]);
    cleanupAuthorized = true;

    const concurrent = await Promise.all([
      postComment(options.apiUrl, tokenA, basePayload),
      postComment(options.apiUrl, tokenA, basePayload),
    ]);
    for (const result of concurrent) expectResponse(result, 200);

    const replay = await postComment(options.apiUrl, tokenA, basePayload);
    expectResponse(replay, 200);
    if (replay.body?.idempotent !== true) fail('Stable comment replay was not explicitly idempotent');

    const comments = await fetchJson(
      `${options.apiUrl}/v1/comments?targetType=${encodeURIComponent(options.targetType)}&targetId=${encodeURIComponent(options.targetId)}&limit=50`,
    );
    expectResponse(comments, 200);
    const visibleMatches = Array.isArray(comments.body?.comments)
      ? comments.body.comments.filter((entry) => entry?.id === commentId).length
      : -1;
    if (visibleMatches !== 1) fail(`Concurrent identical comment requests did not converge to one public row (matches=${visibleMatches})`);

    const changedPayload = await postComment(options.apiUrl, tokenA, {
      ...basePayload,
      text: `${basePayload.text} changed`,
    });
    expectResponse(changedPayload, 409, 'comment_id_conflict');

    const rotatedActor = await postComment(options.apiUrl, tokenB, basePayload);
    expectResponse(rotatedActor, 409, 'comment_id_conflict');

    proofComplete = true;
  } finally {
    if (cleanupAuthorized) {
      cleanupResult = await cleanupCertificationArtifacts({
        actorA: sessionA.actor,
        actorB: sessionB.actor,
        targetType: options.targetType,
        targetId: options.targetId,
        commentId,
        repoRoot,
      });
    }
  }

  if (!cleanupAuthorized) {
    fail('D1 cleanup authority was not established because both signed sessions did not pass the Worker authentication boundary');
  }
  if (!cleanupResult.ok) {
    fail('Live proof is not terminal until the exact certification artifacts are cleaned from D1');
  }

  const afterCleanup = await fetchJson(
    `${options.apiUrl}/v1/comments?targetType=${encodeURIComponent(options.targetType)}&targetId=${encodeURIComponent(options.targetId)}&limit=50`,
  );
  expectResponse(afterCleanup, 200);
  const stillVisible = Array.isArray(afterCleanup.body?.comments)
    && afterCleanup.body.comments.some((entry) => entry?.id === commentId);
  if (stillVisible) fail('Temporary certification comment is still publicly visible after D1 cleanup');

  if (!proofComplete) fail('Live proof did not complete');

  const evidence = {
    schemaVersion: 1,
    testedAt: new Date().toISOString(),
    apiOrigin: new URL(options.apiUrl).origin,
    manifestOrigin: new URL(options.manifestUrl).origin,
    target: { type: options.targetType, id: options.targetId },
    health: {
      ok: true,
      database: 'd1',
      databaseReady: true,
      targetAuthorityReady: true,
      writesReady: true,
    },
    humanBoundary: {
      freshProfiles: 2,
      actorSessionsDistinct: true,
      tokenMaterialLogged: false,
    },
    outcomes: {
      bothSignedSessionsAuthenticatedByUnknownTarget: '2 x 404 unknown_target',
      concurrentIdenticalComment: 'two HTTP 200 responses',
      stableReplay: 'HTTP 200 idempotent=true',
      publicConvergence: 'exactly one temporary comment row',
      changedPayload: '409 comment_id_conflict',
      rotatedActorSameCommentId: '409 comment_id_conflict',
    },
    cleanup: {
      exactCertificationRowsDeleted: true,
      temporaryCommentAbsent: true,
      networkRateBucketsPreserved: true,
    },
  };

  process.stdout.write('\nLIVE COMMUNITY CERTIFICATION PASS\n');
  process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`ERROR community-live-certifier: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
