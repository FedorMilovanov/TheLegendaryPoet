import { readFileSync } from 'node:fs';
import communityWorker from '../workers/community-api/src/index';

const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };

const MANIFEST_URL = 'https://manifest.test.invalid/community-targets.json';
const ORIGIN = 'https://thelegendarypoet.ru';
const KNOWN_TARGET = 'alexander-pushkin';
const RETIRED_TARGET = 'retired-poet';
const workerSource = readFileSync('workers/community-api/src/index.ts', 'utf8');

expect(workerSource.includes('request.body.getReader()'), 'Worker must enforce body limits while consuming the request stream');
expect(workerSource.includes('value.byteLength') && workerSource.includes('MAX_BODY_BYTES'), 'Worker body limit must count bytes, not decoded JS characters');
expect(!workerSource.includes('await request.text()'), 'Worker must not fully buffer an unbounded request before checking its size');

let manifestAvailable = false;
let dbTouches = 0;

const statement = {
  bind(..._values: unknown[]) {
    return this;
  },
  async first<T>() {
    return { count: 0, rating_count: 0 } as T;
  },
  async all<T>() {
    return { results: [] as T[], success: true };
  },
  async run() {
    return { success: true };
  },
};

const db = {
  prepare(_query: string) {
    dbTouches += 1;
    return statement;
  },
};

const env = {
  DB: db,
  ALLOWED_ORIGINS: ORIGIN,
  COMMUNITY_TARGET_MANIFEST_URL: MANIFEST_URL,
};

function request(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Origin', ORIGIN);
  if (init.body) headers.set('Content-Type', 'application/json');
  return new Request(`https://community.test.invalid${path}`, { ...init, headers });
}

async function code(response: Response) {
  const body = await response.json() as { code?: unknown };
  return typeof body.code === 'string' ? body.code : null;
}

const originalFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL) => {
  if (String(input) !== MANIFEST_URL) throw new Error(`unexpected external fetch: ${String(input)}`);
  if (!manifestAvailable) return new Response(null, { status: 503 });
  return Response.json({
    version: 1,
    targets: {
      poet: [KNOWN_TARGET],
      poem: [],
      track: [],
      article: [],
    },
  });
}) as typeof fetch;

try {
  dbTouches = 0;
  let response = await communityWorker.fetch(request(`/v1/summary?targetType=poet&targetId=${RETIRED_TARGET}`), env);
  expect(response.status === 503 && await code(response) === 'target_manifest_unavailable', 'public summary must fail closed when target manifest is unavailable');
  expect(dbTouches === 0, 'manifest-unavailable summary must not query D1');

  manifestAvailable = true;

  dbTouches = 0;
  response = await communityWorker.fetch(request('/v1/summary/batch', {
    method: 'POST',
    body: JSON.stringify({ targetType: 'poet', targetIds: [], padding: 'x'.repeat(13_000) }),
  }), env);
  expect(response.status === 413 && await code(response) === 'payload_too_large', 'oversized public POST bodies must fail with 413 before parsing or authority lookup');
  expect(dbTouches === 0, 'oversized public POST bodies must be rejected before D1 access');

  dbTouches = 0;
  response = await communityWorker.fetch(request(`/v1/summary?targetType=poet&targetId=${RETIRED_TARGET}`), env);
  expect(response.status === 404 && await code(response) === 'unknown_target', 'public summary must reject a syntactically valid retired target');
  expect(dbTouches === 0, 'retired-target summary must be rejected before querying D1');

  dbTouches = 0;
  response = await communityWorker.fetch(request(`/v1/comments?targetType=poet&targetId=${RETIRED_TARGET}&limit=10`), env);
  expect(response.status === 404 && await code(response) === 'unknown_target', 'public comments must reject a syntactically valid retired target');
  expect(dbTouches === 0, 'retired-target comments must be rejected before querying D1');

  dbTouches = 0;
  response = await communityWorker.fetch(request('/v1/summary/batch', {
    method: 'POST',
    body: JSON.stringify({ targetType: 'poet', targetIds: [KNOWN_TARGET, RETIRED_TARGET] }),
  }), env);
  expect(response.status === 404 && await code(response) === 'unknown_target', 'aggregate batch must reject the whole request when any target is non-canonical');
  expect(dbTouches === 0, 'mixed canonical/non-canonical aggregate batch must be rejected before querying D1');

  dbTouches = 0;
  response = await communityWorker.fetch(request(`/v1/summary?targetType=poet&targetId=${KNOWN_TARGET}`), env);
  expect(response.status === 200, 'canonical public summary must proceed to D1');
  expect(dbTouches === 2, 'canonical public summary must execute only its bounded rating/comment aggregate queries');
} finally {
  globalThis.fetch = originalFetch;
}

for (const failure of failures) console.error(`ERROR community-worker-target-authority: ${failure}`);
console.log(`Community Worker target authority: ${failures.length} error(s); request bodies are byte-bounded while streaming, unavailable manifest and retired-target reads fail before D1, canonical read proceeds.`);
if (failures.length) process.exit(1);
