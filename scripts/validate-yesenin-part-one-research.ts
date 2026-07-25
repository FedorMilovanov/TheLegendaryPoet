import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { essays } from '../src/data/essays/index';
import {
  yeseninPartOneClaimCoverage,
  yeseninPartOneSources,
} from '../src/data/essays/yeseninPartOneSources';
import {
  yeseninPartOnePassTwoClaimCoverage,
  yeseninPartOneSourcesPassTwo,
} from '../src/data/essays/yeseninPartOneSourcesPassTwo';
import {
  yeseninPartOnePassThreeClaimCoverage,
  yeseninPartOneSourcesPassThree,
} from '../src/data/essays/yeseninPartOneSourcesPassThree';

const errors: string[] = [];
const sourceIds = new Set<string>();
const normalizedUrls = new Set<string>();
const allSources = [
  ...yeseninPartOneSources,
  ...yeseninPartOneSourcesPassTwo,
  ...yeseninPartOneSourcesPassThree,
] as const;
const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

function normalizedUrl(value: string): string {
  return value.replace(/^http:/, 'https:').replace(/\/$/, '');
}

function fail(message: string) {
  errors.push(message);
}

function markdownSection(text: string, startHeading: string, nextHeading: string): string {
  const start = text.indexOf(startHeading);
  if (start < 0) {
    fail(`missing request section ${startHeading}`);
    return '';
  }
  const end = text.indexOf(nextHeading, start + startHeading.length);
  if (end < 0) {
    fail(`missing request section boundary ${nextHeading}`);
    return text.slice(start);
  }
  return text.slice(start, end);
}

function requireRequestMarkers(
  path: string,
  section: string,
  label: string,
  requiredMarkers: readonly string[],
) {
  for (const marker of requiredMarkers) {
    if (!section.includes(marker)) {
      fail(`${path}: ${label} request lost required marker ${marker}`);
    }
  }
}

function forbidFalseAcquisition(path: string, section: string, label: string) {
  for (const forbiddenMarker of [
    'FULL-TEXT-ACQUIRED',
    'CONTENT-INSPECTED',
    'Status: `ACQUIRED',
    'Статус: `ACQUIRED',
  ] as const) {
    if (section.includes(forbiddenMarker)) {
      fail(`${path}: ${label} request was falsely upgraded (${forbiddenMarker})`);
    }
  }
}

if (allSources.length < 42) {
  fail(`source registry regressed below canonical threshold: ${allSources.length} < 42`);
}

for (const source of allSources) {
  if (!source.id) {
    fail(`source without stable id: ${source.title}`);
    continue;
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(source.id)) {
    fail(`${source.id}: source id must be lowercase kebab-case`);
  }
  if (sourceIds.has(source.id)) fail(`${source.id}: duplicate source id`);
  sourceIds.add(source.id);

  if (!source.url) {
    fail(`${source.id}: source URL is required in the canonical research registry`);
  } else {
    if (!source.url.startsWith('https://')) fail(`${source.id}: non-HTTPS source URL ${source.url}`);
    const urlKey = normalizedUrl(source.url);
    if (normalizedUrls.has(urlKey)) fail(`${source.id}: duplicate canonical URL ${urlKey}`);
    normalizedUrls.add(urlKey);
  }

  if (!source.kind) fail(`${source.id}: source kind is required`);
  if (!source.institution) fail(`${source.id}: institution is required`);
  if (!source.note || source.note.length < 40) {
    fail(`${source.id}: restrained evidence-limit note is required`);
  }

  for (const alias of source.aliases ?? []) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(alias)) {
      fail(`${source.id}: malformed alias ${alias}`);
    }
    if (sourceIds.has(alias)) fail(`${source.id}: alias collides with an earlier source id ${alias}`);
  }
}

const primaryCount = allSources.filter((source) => source.kind === 'primary').length;
if (primaryCount < 12 || primaryCount > 15) {
  fail(`primary-document registry must stay within issue #76 target: ${primaryCount} not in 12–15`);
}

const requiredClaims = [
  'YE1-001',
  'YE1-004',
  'YE1-007',
  'YE1-010',
  'YE1-012',
  'YE1-013',
  'YE1-015',
  'YE1-016',
  'YE1-020',
  'YE1-022',
  'YE1-023',
  'YE1-025',
  'YE1-027',
] as const;

for (const claimId of requiredClaims) {
  const coverage = yeseninPartOneClaimCoverage[claimId];
  if (!coverage) {
    fail(`${claimId}: required pass-one claim coverage disappeared`);
    continue;
  }
  for (const sourceId of coverage.sourceIds) {
    if (!sourceIds.has(sourceId)) fail(`${claimId}: unknown pass-one source id ${sourceId}`);
  }
  if (coverage.sourceIds.length === 0 && coverage.missing.length === 0) {
    fail(`${claimId}: empty coverage must retain an explicit missing-evidence reason`);
  }
}

for (const [passLabel, registry] of [
  ['pass-two', yeseninPartOnePassTwoClaimCoverage],
  ['pass-three', yeseninPartOnePassThreeClaimCoverage],
] as const) {
  for (const [claimId, coverage] of Object.entries(registry)) {
    if (!requiredClaims.includes(claimId as (typeof requiredClaims)[number])) {
      fail(`${claimId}: ${passLabel} coverage points to an unguarded claim`);
    }
    if (coverage.sourceIds.length === 0) {
      fail(`${claimId}: ${passLabel} coverage must add at least one exact source`);
    }
    for (const sourceId of coverage.sourceIds) {
      if (!sourceIds.has(sourceId)) fail(`${claimId}: unknown ${passLabel} source id ${sourceId}`);
    }
  }
}

const exactBoundaryAssertions: Array<[string, string]> = [
  ['YE1-004', 'Спас-Клепиковская второклассная учительская школа духовного ведомства'],
  ['YE1-016', '20 April 1916 train no. 143 team record'],
  ['YE1-027', 'Duncan meeting date/place'],
];

for (const [claimId, requiredText] of exactBoundaryAssertions) {
  const missingText = yeseninPartOneClaimCoverage[claimId as keyof typeof yeseninPartOneClaimCoverage]
    ?.missing.join(' ') ?? '';
  if (!missingText.includes(requiredText)) {
    fail(`${claimId}: required evidence boundary changed or disappeared (${requiredText})`);
  }
}

const passTwoHoldAssertions: Array<[keyof typeof yeseninPartOnePassTwoClaimCoverage, string]> = [
  ['YE1-004', 'facsimile'],
  ['YE1-013', 'object-level provenance'],
  ['YE1-016', '20 April 1916 train no. 143 team record'],
  ['YE1-020', 'marriage, birth and divorce'],
  ['YE1-023', 'first-publication facsimile'],
];

for (const [claimId, requiredText] of passTwoHoldAssertions) {
  const remainingText = yeseninPartOnePassTwoClaimCoverage[claimId].remaining.join(' ');
  if (!remainingText.includes(requiredText)) {
    fail(`${claimId}: pass-two archive/publication hold changed or disappeared (${requiredText})`);
  }
}

const passThreeHoldAssertions: Array<[keyof typeof yeseninPartOnePassThreeClaimCoverage, string]> = [
  ['YE1-007', 'employment and address'],
  ['YE1-010', 'birth/family record'],
  ['YE1-020', 'marriage, birth and divorce'],
  ['YE1-022', 'first-publication facsimiles'],
  ['YE1-023', '1919 declaration first-publication witness'],
];

for (const [claimId, requiredText] of passThreeHoldAssertions) {
  const remainingText = yeseninPartOnePassThreeClaimCoverage[claimId].remaining.join(' ');
  if (!remainingText.includes(requiredText)) {
    fail(`${claimId}: pass-three archive/publication hold changed or disappeared (${requiredText})`);
  }
}

const bookRequestPath = 'research/yesenin/PART_ONE_BOOK_REQUESTS_2026-07-24.md';
const bookRequestUpdatePath = 'research/yesenin/PART_ONE_BOOK_REQUESTS_UPDATE_MCVAY_2026-07-24.md';
const bookRequest = read(bookRequestPath);
const bookRequestUpdate = read(bookRequestUpdatePath);

const mcvayRequestSections = [
  {
    path: bookRequestPath,
    text: markdownSection(
      bookRequest,
      '### A1. Gordon McVay — `Esenin: A Life`',
      '### A2. Н. И. Шубникова-Гусева',
    ),
  },
  {
    path: bookRequestUpdatePath,
    text: markdownSection(
      bookRequestUpdate,
      '### A1 — остаётся полезным',
      '### A2 — точный НЭБ-объект найден, полный текст не получен',
    ),
  },
];
const mcvayLifeCatalogUrl = 'https://ci.nii.ac.jp/ncid/BA03831281';
const requiredMcvayRequestMarkers = [
  mcvayLifeCatalogUrl,
  'BA03831281',
  '0340204613',
  '77355924',
  'STILL-REQUESTED / CATALOG-IDENTIFIED / FULL-TEXT-NOT-ACQUIRED / CONTENT-NOT-INSPECTED',
] as const;
for (const requestSection of mcvayRequestSections) {
  requireRequestMarkers(
    requestSection.path,
    requestSection.text,
    'McVay Life',
    requiredMcvayRequestMarkers,
  );
  forbidFalseAcquisition(requestSection.path, requestSection.text, 'McVay Life');
}
if (!mcvayRequestSections[0].text.includes('Ardis ISBN `0882331825`')) {
  fail(`${bookRequestPath}: Hodder catalogue must not silently replace the separate Ardis edition`);
}
if (!mcvayRequestSections[1].text.includes('не подменяет отдельную Ardis-версию ISBN `0882331825`')) {
  fail(`${bookRequestUpdatePath}: McVay update lost the Hodder/Ardis edition boundary`);
}

const shubnikovaRequestSections = [
  {
    path: bookRequestPath,
    text: markdownSection(
      bookRequest,
      '### A2. Н. И. Шубникова-Гусева',
      '### A3. С. А. Серегина',
    ),
  },
  {
    path: bookRequestUpdatePath,
    text: markdownSection(
      bookRequestUpdate,
      '### A2 — точный НЭБ-объект найден, полный текст не получен',
      '### A3 — официальный легальный PDF существует, проект его не приобретал',
    ),
  },
];
const shubnikovaNebUrl = 'https://rusneb.ru/catalog/000199_000009_002300124/';
const requiredShubnikovaMarkers = [
  shubnikovaNebUrl,
  '000199_000009_002300124',
  '71 02-10/172',
  '688 с.',
  '5-9208-0069-0',
  'STILL-REQUESTED / NEB-RECORD-IDENTIFIED / ELECTRONIC-READING-ROOM-ONLY / FULL-TEXT-NOT-ACQUIRED / CONTENT-NOT-INSPECTED',
] as const;
for (const requestSection of shubnikovaRequestSections) {
  requireRequestMarkers(
    requestSection.path,
    requestSection.text,
    'Shubnikova-Guseva Poems',
    requiredShubnikovaMarkers,
  );
  forbidFalseAcquisition(requestSection.path, requestSection.text, 'Shubnikova-Guseva Poems');
  if (!requestSection.text.includes('не подменяет')) {
    fail(`${requestSection.path}: Shubnikova request lost the dissertation/monograph boundary`);
  }
}

const sereginaRequestSections = [
  {
    path: bookRequestPath,
    text: markdownSection(
      bookRequest,
      '### A3. С. А. Серегина',
      '## Приоритет B — существенно усилит статью',
    ),
  },
  {
    path: bookRequestUpdatePath,
    text: markdownSection(
      bookRequestUpdate,
      '### A3 — официальный легальный PDF существует, проект его не приобретал',
      '## Более высокий page-witness приоритет',
    ),
  },
];
const sereginaPublisherUrl = 'https://ed-imli.ru/index.php/ru/4033-nikolaj-klyuev-i-sergej-esenin-dialog-s-epokhoj';
const requiredSereginaMarkers = [
  sereginaPublisherUrl,
  '978-5-9208-0781-6',
  '10.22455/978-5-9208-0781-6',
  'FOHRPT',
  '816 с.',
  'STILL-REQUESTED / OFFICIAL-PUBLISHER-RECORD / LEGAL-PDF-PURCHASE-AVAILABLE / FULL-TEXT-NOT-ACQUIRED / CONTENT-NOT-INSPECTED',
] as const;
for (const requestSection of sereginaRequestSections) {
  requireRequestMarkers(
    requestSection.path,
    requestSection.text,
    'Seregina Klyuev-Esenin',
    requiredSereginaMarkers,
  );
  forbidFalseAcquisition(requestSection.path, requestSection.text, 'Seregina Klyuev-Esenin');
  if (!requestSection.text.toLocaleLowerCase('ru-RU').includes('платный pdf')) {
    fail(`${requestSection.path}: Seregina request lost the lawful paid-PDF access boundary`);
  }
}

const zakharovRequestSection = markdownSection(
  bookRequest,
  '### B1. А. Н. Захаров — `Поэтика Есенина`',
  '### B2. Е. А. Самоделова',
);
const zakharovBibliographyUrl = 'https://esenin.ru/bibliografiia/1995-g/knigi-o-esenine';
requireRequestMarkers(
  bookRequestPath,
  zakharovRequestSection,
  'Zakharov Poetics',
  [
    zakharovBibliographyUrl,
    'тираж 300 экземпляров',
    '220 или 221 страницу',
    '224 страницы',
    'STILL-REQUESTED / SECONDARY-BIBLIOGRAPHY-IDENTIFIED / AUTHORITATIVE-CATALOG-UNRESOLVED / PAGINATION-CONFLICT-220-221-224 / FULL-TEXT-NOT-ACQUIRED / CONTENT-NOT-INSPECTED',
  ],
);
forbidFalseAcquisition(bookRequestPath, zakharovRequestSection, 'Zakharov Poetics');
if (!zakharovRequestSection.includes('Устойчивой авторитетной карточки РГБ, РНБ или НЭБ')) {
  fail(`${bookRequestPath}: Zakharov request lost the unresolved authoritative-catalog boundary`);
}

const samodelovaRequestSection = markdownSection(
  bookRequest,
  '### B2. Е. А. Самоделова',
  '## Приоритет C — только при наличии',
);
const samodelovaNebUrl = 'https://rusneb.ru/catalog/000199_000009_003044118/';
requireRequestMarkers(
  bookRequestPath,
  samodelovaRequestSection,
  'Samodelova Anthropological Poetics',
  [
    samodelovaNebUrl,
    '000199_000009_003044118',
    '918 с., `[16]` л. ил.',
    '5-9551-0159-4',
    '07-8896',
    'STILL-REQUESTED / NEB-RECORD-IDENTIFIED / ELECTRONIC-READING-ROOM-ONLY / FULL-TEXT-NOT-ACQUIRED / CONTENT-NOT-INSPECTED',
  ],
);
forbidFalseAcquisition(bookRequestPath, samodelovaRequestSection, 'Samodelova Anthropological Poetics');
if (
  !samodelovaRequestSection.includes('920, 954') ||
  !samodelovaRequestSection.includes('контролирующей остаётся физическая формула НЭБ')
) {
  fail(`${bookRequestPath}: Samodelova request lost the physical-pagination boundary`);
}

const forbiddenPublishedIds = new Set([
  'essay-yesenin-1895-1921',
]);
for (const essay of essays) {
  if (forbiddenPublishedIds.has(essay.id)) {
    fail(`${essay.id}: unpublished Part I was registered before source/media/editorial gates`);
  }
}

const forbiddenPublishedSlugs = new Set([
  'yesenin-1895-1921',
]);
for (const essay of essays) {
  if (forbiddenPublishedSlugs.has(essay.slug)) {
    fail(`${essay.slug}: unpublished route was registered before PUBLIC-READY decision`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}

const unresolvedClaims = Object.values(yeseninPartOneClaimCoverage)
  .filter((coverage) => coverage.missing.length > 0)
  .length;
const passTwoOpenHolds = Object.values(yeseninPartOnePassTwoClaimCoverage)
  .filter((coverage) => coverage.remaining.length > 0)
  .length;
const passThreeOpenHolds = Object.values(yeseninPartOnePassThreeClaimCoverage)
  .filter((coverage) => coverage.remaining.length > 0)
  .length;

console.log(
  `Yesenin Part I research validation: ${allSources.length} classified unique sources `
  + `(${yeseninPartOneSources.length} pass one + ${yeseninPartOneSourcesPassTwo.length} pass two `
  + `+ ${yeseninPartOneSourcesPassThree.length} pass three), `
  + `${primaryCount} primary records, ${requiredClaims.length} guarded claims, `
  + `${unresolvedClaims} pass-one gaps, ${passTwoOpenHolds} pass-two holds and `
  + `${passThreeOpenHolds} pass-three holds; five requested books are access-bounded but unacquired; `
  + `public registration remains blocked.`,
);
