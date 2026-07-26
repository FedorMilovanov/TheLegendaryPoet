import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { yeseninPartOnePublic } from '../src/data/essays/yeseninPartOnePublic';

interface Route {
  id: string;
  institution: string;
  url: string;
  kind: string;
}

interface Result extends Route {
  attempt: number;
  status: number | null;
  finalUrl: string | null;
  bytes: number;
  reachable: boolean;
  hardFailure: boolean;
  accessState: string;
  error?: string;
}

const sourceRoutes: Route[] = (yeseninPartOnePublic.sources ?? []).map((source) => ({
  id: source.id ?? source.title,
  institution: source.institution ?? 'unknown',
  url: source.url ?? '',
  kind: source.kind,
}));
const routes = sourceRoutes;

if (sourceRoutes.length !== 64 || routes.length !== 64) {
  throw new Error(`expected 64 public source routes, found ${sourceRoutes.length}/${routes.length}`);
}
const ids = new Set<string>();
const urls = new Set<string>();
for (const route of routes) {
  if (!route.url.startsWith('https://')) throw new Error(`non-HTTPS route: ${route.id}`);
  if (ids.has(route.id)) throw new Error(`duplicate route id: ${route.id}`);
  if (urls.has(route.url)) throw new Error(`duplicate route URL: ${route.url}`);
  ids.add(route.id);
  urls.add(route.url);
}

const defaultTimeoutMs = Number(process.env.LINK_TIMEOUT_MS || 30_000);
const concurrency = Number(process.env.LINK_CONCURRENCY || 3);
const sleep = (milliseconds: number) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
const userAgent = 'TheLegendaryPoet-Public-Part-One-Link-Audit/2 (+https://thelegendarypoet.ru)';

async function request(route: Route, attempt = 1): Promise<Result> {
  const slowHost = /rusneb\.ru|imli\.ru/i.test(route.url);
  const maximumAttempts = slowHost ? 4 : 2;
  const timeoutMs = slowHost ? Math.max(defaultTimeoutMs, 60_000) : defaultTimeoutMs;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(route.url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': userAgent,
        accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.5',
        'accept-language': 'ru,en;q=0.8',
      },
    });
    const text = await response.text();
    const status = response.status;
    const reachable = (status >= 200 && status < 400) || [401, 403, 429].includes(status);
    const hardFailure = status === 404 || status === 410 || status >= 500;
    return {
      ...route,
      attempt,
      status,
      finalUrl: response.url,
      bytes: Buffer.byteLength(text),
      reachable,
      hardFailure,
      accessState:
        status >= 200 && status < 400
          ? 'open-response'
          : [401, 403].includes(status)
            ? 'reachable-access-restricted'
            : status === 429
              ? 'reachable-rate-limited'
              : 'failed',
    };
  } catch (error) {
    if (attempt < maximumAttempts) {
      await sleep(2_000 * attempt);
      return request(route, attempt + 1);
    }
    return {
      ...route,
      attempt,
      status: null,
      finalUrl: null,
      bytes: 0,
      reachable: false,
      hardFailure: true,
      accessState: 'network-failure',
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function runPool(items: Route[], workerCount: number): Promise<Result[]> {
  const results = new Array<Result>(items.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      const result = await request(items[index]);
      results[index] = result;
      console.log(`${result.id} ${String(result.status ?? 'ERR').padStart(3)} ${result.accessState}`);
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, workerCount) }, () => worker()));
  return results;
}

const results = await runPool(routes, concurrency);
const hardFailures = results.filter((result) => result.hardFailure || !result.reachable);
const report = {
  generatedAt: new Date().toISOString(),
  routeCount: results.length,
  sourceRouteCount: sourceRoutes.length,
  openResponseCount: results.filter((result) => result.accessState === 'open-response').length,
  restrictedResponseCount: results.filter((result) => result.accessState.startsWith('reachable-')).length,
  hardFailureCount: hardFailures.length,
  coverRightsConfirmed: true,
  coverPolicy: 'Local editorial reconstruction; exact file integrity is enforced by the publication-boundary validator.',
  policy: {
    redirectsAccepted: true,
    accessRestrictedAcceptedAsReachable: true,
    notFoundAndGoneRejected: true,
    stableServerErrorsRejected: true,
    cataloguePageDoesNotProveUnseenContent: true,
    coverRightsMarkerRequired: 'not applicable: local editorial reconstruction',
  },
  results,
};

mkdirSync(resolve('artifacts'), { recursive: true });
writeFileSync(
  resolve('artifacts/yesenin-part-one-public-links.json'),
  `${JSON.stringify(report, null, 2)}\n`,
  'utf8',
);

console.log(
  `Part I public links: ${results.length} source routes, ${hardFailures.length} hard failures; local cover integrity is validated separately`,
);
if (hardFailures.length > 0) {
  for (const result of hardFailures) {
    console.error(`FAIL ${result.id}: status=${result.status ?? 'ERR'} ${result.url}`);
  }
  process.exitCode = 1;
}
