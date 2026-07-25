import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  yeseninPrimarySourceMarathonPassFifteen,
  yeseninPrimaryVisualPlacementsPassFifteen,
} from '../src/data/essays/yeseninPrimarySourceMarathonPassFifteen';

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');
const fail = (message: string): never => {
  throw new Error(`[yesenin-primary-source-marathon-pass15] ${message}`);
};

const researchPath = 'research/yesenin/PART_ONE_PRIMARY_SOURCE_MARATHON_PASS15_2026-07-25.md';
const visualPath = 'research/yesenin/PART_ONE_VISUAL_PLACEMENT_PASS15_2026-07-25.md';
const research = read(researchPath);
const visual = read(visualPath);

if (yeseninPrimarySourceMarathonPassFifteen.length !== 48) {
  fail(`expected exactly 48 search routes, found ${yeseninPrimarySourceMarathonPassFifteen.length}`);
}
if (yeseninPrimaryVisualPlacementsPassFifteen.length !== 16) {
  fail(`expected exactly 16 visual placements, found ${yeseninPrimaryVisualPlacementsPassFifteen.length}`);
}

const passIds = new Set<string>();
for (const [index, pass] of yeseninPrimarySourceMarathonPassFifteen.entries()) {
  const expectedId = `PS15-${String(index + 1).padStart(3, '0')}`;
  if (pass.id !== expectedId) fail(`route ${index + 1} must be ${expectedId}, found ${pass.id}`);
  if (passIds.has(pass.id)) fail(`duplicate route id ${pass.id}`);
  passIds.add(pass.id);
  if (pass.resultUrl !== null && !pass.resultUrl.startsWith('https://')) {
    fail(`${pass.id}: result URL must be HTTPS`);
  }
  if (pass.fullTextAcquired !== false) {
    fail(`${pass.id}: pass 15 must not claim newly acquired full text`);
  }
  if (pass.wikipediaUsedAsEvidence !== false) {
    fail(`${pass.id}: Wikipedia must never be evidence`);
  }
  if (/wikipedia\.org/i.test(pass.resultUrl ?? '')) {
    fail(`${pass.id}: Wikipedia URL entered the evidence matrix`);
  }
  if (pass.evidenceLimit.length < 45) {
    fail(`${pass.id}: evidence-limit note is too weak`);
  }
}

const nullLocatorIds = yeseninPrimarySourceMarathonPassFifteen
  .filter((pass) => pass.resultUrl === null)
  .map((pass) => pass.id)
  .join(',');
if (nullLocatorIds !== 'PS15-013,PS15-014,PS15-040') {
  fail(`unexpected null-locator set: ${nullLocatorIds}`);
}

const gradeCounts = yeseninPrimarySourceMarathonPassFifteen.reduce<Record<string, number>>(
  (counts, pass) => {
    counts[pass.grade] = (counts[pass.grade] ?? 0) + 1;
    return counts;
  },
  {},
);
if (
  gradeCounts['A+'] !== 12 ||
  gradeCounts.A !== 30 ||
  gradeCounts.B !== 3 ||
  gradeCounts.EXCLUDED !== 3
) {
  fail(`unexpected grade distribution: ${JSON.stringify(gradeCounts)}`);
}
if ((gradeCounts['A+'] ?? 0) + (gradeCounts.A ?? 0) !== 42) {
  fail('pass 15 must retain exactly 42 A+/A routes');
}

const stateCounts = yeseninPrimarySourceMarathonPassFifteen.reduce<Record<string, number>>(
  (counts, pass) => {
    counts[pass.resultState] = (counts[pass.resultState] ?? 0) + 1;
    return counts;
  },
  {},
);
for (const [state, expected] of [
  ['archive-catalog', 8],
  ['reading-room-only', 4],
  ['exact-digital-object', 4],
  ['negative-disambiguation', 3],
  ['quarantined-visual', 3],
  ['quarantined-secondary', 2],
] as const) {
  if (stateCounts[state] !== expected) {
    fail(`expected ${expected} ${state} routes, found ${stateCounts[state] ?? 0}`);
  }
}

const requiredRouteMarkers: Record<string, readonly string[]> = {
  'PS15-002': ['30 июля', 'Кирико-Иулиттовская'],
  'PS15-006': ['«Советская страна»', '«Сирены»'],
  'PS15-012': ['видимо, 3 октября 1921'],
  'PS15-015': ['Ед. хр. 111', 'Клюева'],
  'PS15-019': ['Ед. хр. 143', 'дарственной'],
  'PS15-021': ['9 марта 1915', 'Блоку'],
  'PS15-025': ['12 июня 1921', 'имажинистов'],
  'PS15-031': ['Irma Duncan Collection'],
  'PS15-032': ['Irma Duncan papers'],
  'PS15-039': ['не «Советская страна»'],
  'PS15-040': ['ВОМ-13607'],
  'PS15-046': ['поездом № 143'],
};
for (const [id, markers] of Object.entries(requiredRouteMarkers)) {
  const pass = yeseninPrimarySourceMarathonPassFifteen.find((candidate) => candidate.id === id);
  if (!pass) fail(`missing required route ${id}`);
  const haystack = `${pass.target} ${pass.evidenceLimit}`;
  for (const marker of markers) {
    if (!haystack.includes(marker)) fail(`${id}: missing marker ${marker}`);
  }
}

const requiredHosts = new Set([
  'feb-web.ru',
  'www.rgali.ru',
  'www.prlib.ru',
  'archives.nypl.org',
  'www.loc.gov',
  'rusneb.ru',
  'gosarchive.gov35.ru',
  'commons.wikimedia.org',
  'kulturologia.ru',
  'godliteratury.ru',
]);
for (const pass of yeseninPrimarySourceMarathonPassFifteen) {
  if (!pass.resultUrl) continue;
  const host = new URL(pass.resultUrl).hostname;
  if (!requiredHosts.has(host)) fail(`${pass.id}: unreviewed host ${host}`);
}

const visualIds = new Set<string>();
const placementCounts = new Map<string, number>();
for (const [index, item] of yeseninPrimaryVisualPlacementsPassFifteen.entries()) {
  const expectedId = `VIS-YE1-P15-${String(index + 1).padStart(3, '0')}`;
  if (item.id !== expectedId) fail(`visual ${index + 1} must be ${expectedId}, found ${item.id}`);
  if (visualIds.has(item.id)) fail(`duplicate visual id ${item.id}`);
  visualIds.add(item.id);
  if (!item.sourcePageUrl.startsWith('https://')) fail(`${item.id}: source page must use HTTPS`);
  if (item.originalSha256 !== null || item.derivativeSha256 !== null) {
    fail(`${item.id}: hashes must remain null until real bytes and derivatives are acquired`);
  }
  if (item.productionAuthorized !== false) {
    fail(`${item.id}: production authorization must remain false`);
  }
  if (item.editorialUse.length < 55) fail(`${item.id}: editorial placement note is too weak`);
  placementCounts.set(item.placement, (placementCounts.get(item.placement) ?? 0) + 1);
}
for (const section of [
  'section-1-konstantinovo',
  'section-3-moscow',
  'section-4-blok-petrograd',
  'section-5-klyuev-image',
  'section-6-radunitsa',
  'section-7-military-service',
  'section-8-revolutionary-poems',
  'section-9-reich-family',
  'section-10-imagism',
  'section-11-transition-1921',
  'section-12-duncan-threshold',
] as const) {
  if (!placementCounts.has(section)) fail(`visual map lost ${section}`);
}
if (placementCounts.get('section-7-military-service') !== 2) {
  fail('military section must retain notice + train no. 143 visual pair');
}
if (placementCounts.get('section-10-imagism') !== 2) {
  fail('imagism section must retain leaflet + Sirena-cover visual pair');
}

for (const marker of [
  '48-SEARCH-ROUTES',
  'PRIMARY-FIRST',
  'WIKIPEDIA-ZERO-EVIDENCE',
  'NOT-YET-PUBLIC',
  '42 A+/A',
  'ВОМ-13607',
  '300 предметов',
  '1458 предметов',
  'поезд № 143',
  'Википедия не включена ни в один evidence record',
] as const) {
  if (!research.includes(marker)) fail(`${researchPath}: missing marker ${marker}`);
}
if ((research.match(/^\| PS15-\d{3} \|/gm) ?? []).length !== 48) {
  fail(`${researchPath}: markdown table must retain 48 routes`);
}
for (const marker of [
  '16-REAL-VISUAL-TARGETS',
  'NO-GENERATIVE-ARCHIVE',
  'NO-PRODUCTION-AUTHORIZATION',
  'Записка Есенина Блоку',
  'поезда № 143',
  'не подписывать LOC-портрет Дункан как `Москва, 1921`',
  'productionAuthorized: true',
] as const) {
  if (!visual.includes(marker)) fail(`${visualPath}: missing marker ${marker}`);
}
if ((visual.match(/^\| VIS-YE1-P15-\d{3} \|/gm) ?? []).length !== 16) {
  fail(`${visualPath}: markdown table must retain 16 visual placements`);
}

const essayIndex = read('src/data/essays/index.ts');
for (const forbidden of ['essay-yesenin-1895-1921', "slug: 'yesenin-1895-1921'"]) {
  if (essayIndex.includes(forbidden)) fail(`public essay registry must not contain ${forbidden}`);
}

console.log(
  JSON.stringify(
    {
      searchRoutes: yeseninPrimarySourceMarathonPassFifteen.length,
      gradeCounts,
      stateCounts,
      primaryGradeRoutes: (gradeCounts['A+'] ?? 0) + (gradeCounts.A ?? 0),
      visualPlacements: yeseninPrimaryVisualPlacementsPassFifteen.length,
      visualSections: Object.fromEntries(placementCounts),
      wikipediaEvidence: 0,
      newFullTextsAcquired: 0,
      productionAuthorizedVisuals: 0,
      articleRegistered: false,
    },
    null,
    2,
  ),
);
