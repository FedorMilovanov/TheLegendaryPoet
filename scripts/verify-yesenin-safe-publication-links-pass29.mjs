import fs from 'node:fs/promises';
import path from 'node:path';

const routes = [
  ['P29-001', 'FEB', 'open-source', 'https://feb-web.ru/feb/esenin/texts/e77/e77-357-.htm?cmd=p'],
  ['P29-002', 'FEB', 'open-source', 'https://feb-web.ru/feb/esenin/critics/ev2/ev2-020-.htm?cmd=2'],
  ['P29-003', 'FEB', 'open-source', 'https://feb-web.ru/feb/esenin/critics/ev2/ev2-361-.htm?cmd=p'],
  ['P29-004', 'FEB', 'open-source', 'https://feb-web.ru/feb/esenin/critics/ev1/ev1-310-.htm?cmd=p'],
  ['P29-005', 'FEB', 'open-source', 'https://feb-web.ru/feb/esenin/critics/ev1/ev1-284-.htm?cmd=p'],
  ['P29-006', 'FEB', 'open-source', 'https://feb-web.ru/feb/esenin/critics/ev1/ev1-236-.htm?cmd=p'],
  ['P29-007', 'FEB', 'open-source', 'https://feb-web.ru/feb/esenin/texts/es6/es6-1372.htm?cmd=p'],
  ['P29-008', 'FEB', 'open-source', 'https://feb-web.ru/feb/esenin/texts/e77/e77-014-.htm?cmd=p'],
  ['P29-009', 'FEB', 'open-source', 'https://feb-web.ru/feb/esenin/chronics/el1/el1-068-.htm?cmd=p'],
  ['P29-010', 'FEB', 'open-source', 'https://feb-web.ru/feb/esenin/el-abc/el1/el1-1981.htm?cmd=p&istext=1'],
  ['P29-011', 'FEB', 'open-source', 'https://feb-web.ru/feb/esenin/texts/es6/es6-0642.htm?cmd=p'],
  ['P29-012', 'FEB', 'open-source', 'https://feb-web.ru/feb/esenin/texts/e77/e77-008-.htm?cmd=p'],
  ['P29-013', 'FEB', 'open-source', 'https://feb-web.ru/feb/esenin/el-abc/el2/el2-199-.htm?cmd=p&istext=1'],
  ['P29-014', 'FEB', 'open-source', 'https://feb-web.ru/feb/esenin/el-abc/el2/el2-325-.htm?cmd=p&istext=1'],
  ['P29-015', 'FEB', 'open-source', 'https://feb-web.ru/feb/esenin/texts/es2/es2-085-.htm?cmd=p'],
  ['P29-016', 'FEB', 'open-source', 'https://feb-web.ru/feb/esenin/texts/es2/es2-255-.htm?cmd=p'],
  ['P29-017', 'FEB', 'open-source', 'https://feb-web.ru/feb/esenin/chronics/el1/el1-551-.htm?cmd=p'],
  ['P29-018', 'FEB', 'open-source', 'https://feb-web.ru/feb/esenin/chronics/el1/el1-411-.htm?cmd=p'],
  ['P29-019', 'FEB', 'open-source', 'https://feb-web.ru/feb/esenin/chronics/el1/el1-669-.htm?cmd=p'],
  ['P29-020', 'FEB', 'open-source', 'https://feb-web.ru/feb/esenin/chronics/el2/el2-449-.htm?cmd=p'],
  ['P29-021', 'IMLI', 'catalogue', 'https://biblio.imli.ru/index.php/ruslit/527-esenin-s-a/821-letopis-zhizni-i-tvorchestva-s-a-esenina-tom-1'],
  ['P29-022', 'CiNii', 'catalogue', 'https://ci.nii.ac.jp/ncid/BA22825504'],
  ['P29-023', 'RSL', 'catalogue', 'https://search.rsl.ru/ru/record/01001662767'],
  ['P29-024', 'RSL', 'restricted', 'https://search.rsl.ru/ru/eorder/request?id=01001662767'],
  ['P29-025', 'RSL', 'restricted', 'https://search.rsl.ru/ru/fragment-eorder/rsl01001662767'],
  ['P29-026', 'NEB', 'catalogue', 'https://rusneb.ru/catalog/000207_000017_RU___%D0%A0%D0%93%D0%94%D0%91___EK___33452/'],
  ['P29-027', 'NEB', 'catalogue', 'https://rusneb.ru/catalog/000199_000009_001662767/'],
  ['P29-028', 'NEB', 'catalogue', 'https://rusneb.ru/catalog/000200_000018_0rc_70200/'],
  ['P29-029', 'NEB', 'catalogue', 'https://rusneb.ru/catalog/000199_000009_013560962/'],
  ['P29-030', 'NEB', 'catalogue', 'https://rusneb.ru/catalog/000199_000009_013560972/'],
  ['P29-031', 'NEB', 'catalogue', 'https://rusneb.ru/catalog/000199_000009_013560974/'],
  ['P29-032', 'NEB', 'catalogue', 'https://rusneb.ru/catalog/000199_000009_013560981/'],
  ['P29-033', 'NEB', 'catalogue', 'https://rusneb.ru/catalog/000199_000009_004210209/'],
  ['P29-034', 'NEB', 'catalogue', 'https://rusneb.ru/catalog/003333_000029_RU_%D0%93%D0%9F%D0%9D%D0%A2%D0%91%2B%D0%A0%D0%BE%D1%81%D1%81%D0%B8%D0%B8_EK_%D0%A02_%D0%95%2B823-314322/'],
  ['P29-035', 'NEB', 'catalogue', 'https://rusneb.ru/catalog/000200_000018_RU_NLR_A1SV_46886/'],
  ['P29-036', 'NYPL', 'archive-finding-aid', 'https://digitalcollections.nypl.org/collections/isadora-duncan-programs-and-announcements'],
  ['P29-037', 'NYPL', 'archive-finding-aid', 'https://archives.nypl.org/dan/19659'],
  ['P29-038', 'NYPL', 'archive-finding-aid', 'https://archives.nypl.org/dan/19739'],
  ['P29-039', 'NYPL', 'archive-finding-aid', 'https://archives.nypl.org/dan/19694'],
  ['P29-040', 'NYPL', 'archive-finding-aid', 'https://archives.nypl.org/dan/19640'],
  ['P29-041', 'NYPL', 'archive-finding-aid', 'https://archives.nypl.org/dan/19626'],
  ['P29-042', 'East View', 'restricted', 'https://on-demand.eastview.com/ondemand-featured/featured-articles?issueId=967207'],
  ['P29-043', 'East View', 'restricted', 'https://on-demand.eastview.com/browse/doc/21670570'],
  ['P29-044', 'East View', 'restricted', 'https://on-demand.eastview.com/browse/doc/21670575'],
  ['P29-045', 'Library of Congress', 'rights-safe', 'https://www.loc.gov/pictures/item/2014685647/'],
  ['P29-046', 'Library of Congress', 'rights-safe', 'https://www.loc.gov/pictures/item/2018709521/'],
  ['P29-047', 'Library of Congress', 'rights-safe', 'https://www.loc.gov/pictures/item/2018708264/'],
  ['P29-048', 'Library of Congress', 'rights-safe', 'https://www.loc.gov/pictures/item/2018708185/'],
  ['P29-049', 'Library of Congress', 'rights-safe', 'https://www.loc.gov/item/12760346'],
  ['P29-050', 'Library of Congress', 'rights-safe', 'https://www.loc.gov/pictures/item/2018708234/'],
  ['P29-051', 'Library of Congress', 'rights-safe', 'https://www.loc.gov/pictures/item/2018708221/'],
  ['P29-052', 'Library of Congress', 'rights-safe', 'https://www.loc.gov/pictures/item/2018704008/'],
  ['P29-053', 'Library of Congress', 'rights-safe', 'https://www.loc.gov/pictures/item/2018703992/'],
  ['P29-054', 'Library of Congress', 'rights-safe', 'https://www.loc.gov/item/2018704304/'],
  ['P29-055', 'Library of Congress', 'rights-safe', 'https://www.loc.gov/item/2018703943/'],
  ['P29-056', 'Library of Congress', 'rights-safe', 'https://www.loc.gov/pictures/item/2018703966/'],
  ['P29-057', 'Presidential Library', 'catalogue', 'https://www.prlib.ru/section/2004304'],
  ['P29-058', 'Presidential Library', 'catalogue', 'https://www.prlib.ru/news/2060020'],
  ['P29-059', 'RGALI', 'catalogue', 'https://www.rgali.ru/news-new/1320'],
  ['P29-060', 'Yesenin Museum', 'open-source', 'https://www.museum-esenin.ru/esenin/pisma/1915/bloku-a.a.-9-marta-1915'],
].map(([id, institution, lane, url]) => ({ id, institution, lane, url }));

if (routes.length < 60) throw new Error(`expected at least 60 routes, found ${routes.length}`);

const ids = new Set();
const urls = new Set();
for (const route of routes) {
  if (ids.has(route.id)) throw new Error(`duplicate route id ${route.id}`);
  if (urls.has(route.url)) throw new Error(`duplicate route URL ${route.url}`);
  if (!route.url.startsWith('https://')) throw new Error(`non-HTTPS route ${route.id}`);
  ids.add(route.id);
  urls.add(route.url);
}

const timeoutMs = Number(process.env.LINK_TIMEOUT_MS || 18_000);
const concurrency = Number(process.env.LINK_CONCURRENCY || 6);
const rightsMarker = /No known restrictions on publication/i;
const userAgent = 'TheLegendaryPoet-Research-Link-Audit/29 (+https://thelegendarypoet.ru)';

async function request(route, attempt = 1) {
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
    const rightsConfirmed = route.lane !== 'rights-safe' || (status >= 200 && status < 400 && rightsMarker.test(text));
    return {
      ...route,
      attempt,
      status,
      finalUrl: response.url,
      bytes: Buffer.byteLength(text),
      reachable,
      hardFailure,
      rightsConfirmed,
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
    if (attempt < 2) return request(route, attempt + 1);
    return {
      ...route,
      attempt,
      status: null,
      finalUrl: null,
      bytes: 0,
      reachable: false,
      hardFailure: true,
      rightsConfirmed: false,
      accessState: 'network-failure',
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function runPool(items, workerCount) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await request(items[index]);
      const result = results[index];
      console.log(`${result.id} ${String(result.status ?? 'ERR').padStart(3)} ${result.accessState} ${result.institution}`);
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, workerCount) }, () => worker()));
  return results;
}

const results = await runPool(routes, concurrency);
const hardFailures = results.filter((result) => result.hardFailure || !result.reachable);
const rightsFailures = results.filter((result) => result.lane === 'rights-safe' && !result.rightsConfirmed);
const openResponses = results.filter((result) => result.accessState === 'open-response');
const restrictedResponses = results.filter((result) => result.accessState.startsWith('reachable-'));

const report = {
  generatedAt: new Date().toISOString(),
  pass: 29,
  routeCount: results.length,
  openResponseCount: openResponses.length,
  restrictedResponseCount: restrictedResponses.length,
  hardFailureCount: hardFailures.length,
  rightsSafeCount: results.filter((result) => result.lane === 'rights-safe' && result.rightsConfirmed).length,
  policy: {
    redirectsAccepted: true,
    accessRestrictedAcceptedAsReachable: true,
    notFoundAndGoneRejected: true,
    serverErrorsRejectedAfterRetry: true,
    rightsSafeRequiresLiteralMarker: 'No known restrictions on publication',
    contentClaimsFromCatalogueOnly: false,
  },
  results,
};

const artifactDir = path.resolve('artifacts');
await fs.mkdir(artifactDir, { recursive: true });
await fs.writeFile(
  path.join(artifactDir, 'yesenin-safe-publication-links-pass29.json'),
  `${JSON.stringify(report, null, 2)}\n`,
  'utf8',
);

console.log(`\npass29: ${results.length} routes; ${openResponses.length} open; ${restrictedResponses.length} restricted; ${hardFailures.length} hard failures; ${report.rightsSafeCount} rights-safe LOC records`);

if (hardFailures.length > 0 || rightsFailures.length > 0) {
  for (const result of [...hardFailures, ...rightsFailures]) {
    console.error(`FAIL ${result.id}: status=${result.status ?? 'ERR'} rightsConfirmed=${result.rightsConfirmed} ${result.url}`);
  }
  process.exitCode = 1;
}
