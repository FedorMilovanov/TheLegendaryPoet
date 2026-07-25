import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  yeseninPrimarySourceMarathonPassFifteen as passes,
  yeseninPrimaryVisualPlacementsPassFifteen as visuals,
} from '../src/data/essays/yeseninPrimarySourceMarathonPassFifteen';

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');
const fail = (message: string): never => {
  throw new Error(`[yesenin-primary-source-marathon-pass15] ${message}`);
};

const researchPath = 'research/yesenin/PART_ONE_PRIMARY_SOURCE_MARATHON_PASS15_2026-07-25.md';
const visualPath = 'research/yesenin/PART_ONE_VISUAL_PLACEMENT_PASS15_2026-07-25.md';
const research = read(researchPath);
const visualDoc = read(visualPath);

if (passes.length !== 48) fail(`expected 48 routes, found ${passes.length}`);
if (visuals.length !== 16) fail(`expected 16 visuals, found ${visuals.length}`);

const ids = new Set<string>();
for (const [index, pass] of passes.entries()) {
  const expected = `PS15-${String(index + 1).padStart(3, '0')}`;
  if (pass.id !== expected) fail(`route ${index + 1}: expected ${expected}, found ${pass.id}`);
  if (ids.has(pass.id)) fail(`duplicate route ${pass.id}`);
  ids.add(pass.id);
  if (pass.resultUrl && !pass.resultUrl.startsWith('https://')) fail(`${pass.id}: non-HTTPS URL`);
  if (pass.fullTextAcquired !== false) fail(`${pass.id}: false full-text acquisition`);
  if (pass.wikipediaUsedAsEvidence !== false) fail(`${pass.id}: Wikipedia entered evidence`);
  if (/wikipedia\.org/i.test(pass.resultUrl ?? '')) fail(`${pass.id}: Wikipedia URL entered evidence`);
  if (pass.evidenceLimit.length < 45) fail(`${pass.id}: weak evidence boundary`);
}

const nullIds = passes.filter((pass) => pass.resultUrl === null).map((pass) => pass.id);
if (nullIds.join(',') !== 'PS15-013,PS15-014,PS15-040') {
  fail(`unexpected null locators: ${nullIds.join(',')}`);
}

const countBy = <T extends string>(values: readonly T[]) =>
  values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});

const grades = countBy(passes.map((pass) => pass.grade));
for (const [grade, expected] of [['A+', 12], ['A', 30], ['B', 3], ['EXCLUDED', 3]] as const) {
  if (grades[grade] !== expected) fail(`expected ${expected} ${grade}, found ${grades[grade] ?? 0}`);
}
if ((grades['A+'] ?? 0) + (grades.A ?? 0) !== 42) fail('A+/A route total must remain 42');

const states = countBy(passes.map((pass) => pass.resultState));
for (const [state, expected] of [
  ['archive-catalog', 8],
  ['reading-room-only', 4],
  ['exact-digital-object', 4],
  ['negative-disambiguation', 3],
  ['quarantined-visual', 3],
  ['quarantined-secondary', 2],
] as const) {
  if (states[state] !== expected) fail(`expected ${expected} ${state}, found ${states[state] ?? 0}`);
}

const markers: Record<string, readonly string[]> = {
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
for (const [id, required] of Object.entries(markers)) {
  const pass = passes.find((candidate) => candidate.id === id);
  if (!pass) fail(`missing route ${id}`);
  const text = `${pass.target} ${pass.evidenceLimit}`;
  for (const marker of required) if (!text.includes(marker)) fail(`${id}: missing ${marker}`);
}

const allowedHosts = new Set([
  'feb-web.ru', 'www.rgali.ru', 'www.prlib.ru', 'archives.nypl.org', 'www.loc.gov',
  'rusneb.ru', 'gosarchive.gov35.ru', 'commons.wikimedia.org', 'kulturologia.ru',
  'godliteratury.ru',
]);
for (const pass of passes) {
  if (!pass.resultUrl) continue;
  const host = new URL(pass.resultUrl).hostname;
  if (!allowedHosts.has(host)) fail(`${pass.id}: unreviewed host ${host}`);
}

const visualIds = new Set<string>();
const sections = new Map<string, number>();
for (const [index, item] of visuals.entries()) {
  const expected = `VIS-YE1-P15-${String(index + 1).padStart(3, '0')}`;
  if (item.id !== expected) fail(`visual ${index + 1}: expected ${expected}, found ${item.id}`);
  if (visualIds.has(item.id)) fail(`duplicate visual ${item.id}`);
  visualIds.add(item.id);
  if (!item.sourcePageUrl.startsWith('https://')) fail(`${item.id}: non-HTTPS source page`);
  if (item.originalSha256 !== null || item.derivativeSha256 !== null) {
    fail(`${item.id}: hashes appeared before byte acquisition`);
  }
  if (item.productionAuthorized !== false) fail(`${item.id}: production was falsely authorized`);
  if (item.editorialUse.length < 55) fail(`${item.id}: weak placement boundary`);
  sections.set(item.placement, (sections.get(item.placement) ?? 0) + 1);
}
for (const section of [
  'section-1-konstantinovo', 'section-3-moscow', 'section-4-blok-petrograd',
  'section-5-klyuev-image', 'section-6-radunitsa', 'section-7-military-service',
  'section-8-revolutionary-poems', 'section-9-reich-family', 'section-10-imagism',
  'section-11-transition-1921', 'section-12-duncan-threshold',
]) {
  if (!sections.has(section)) fail(`visual map lost ${section}`);
}
if (sections.get('section-7-military-service') !== 2) fail('military visual pair regressed');
if (sections.get('section-10-imagism') !== 2) fail('imagism visual pair regressed');

for (const marker of [
  '48-SEARCH-ROUTES', 'PRIMARY-FIRST', 'WIKIPEDIA-ZERO-EVIDENCE', 'NOT-YET-PUBLIC',
  '## 48 выполненных маршрутов', 'ВОМ-13607', '300 предметов', '1458 предметов',
  'поезд № 143', 'Википедия не включена ни в один evidence record',
]) {
  if (!research.includes(marker)) fail(`${researchPath}: missing ${marker}`);
}
if ((research.match(/^\| PS15-\d{3} \|/gm) ?? []).length !== 48) fail('research table lost routes');

for (const marker of [
  '16-REAL-VISUAL-TARGETS', 'NO-GENERATIVE-ARCHIVE', 'NO-PRODUCTION-AUTHORIZATION',
  'Записка Есенина Блоку', 'поезда № 143',
  'не подписывать LOC-портрет Дункан как `Москва, 1921`', 'productionAuthorized: true',
]) {
  if (!visualDoc.includes(marker)) fail(`${visualPath}: missing ${marker}`);
}
if ((visualDoc.match(/^\| VIS-YE1-P15-\d{3} \|/gm) ?? []).length !== 16) {
  fail('visual table lost placements');
}

const essayIndex = read('src/data/essays/index.ts');
for (const forbidden of ['essay-yesenin-1895-1921', "slug: 'yesenin-1895-1921'"]) {
  if (essayIndex.includes(forbidden)) fail(`public registry contains ${forbidden}`);
}

console.log(JSON.stringify({
  searchRoutes: passes.length,
  grades,
  states,
  primaryGradeRoutes: (grades['A+'] ?? 0) + (grades.A ?? 0),
  visualPlacements: visuals.length,
  visualSections: Object.fromEntries(sections),
  wikipediaEvidence: 0,
  newFullTextsAcquired: 0,
  productionAuthorizedVisuals: 0,
  articleRegistered: false,
}, null, 2));
