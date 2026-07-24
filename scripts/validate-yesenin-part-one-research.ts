import { essays } from '../src/data/essays/index';
import {
  yeseninPartOneClaimCoverage,
  yeseninPartOneSources,
} from '../src/data/essays/yeseninPartOneSources';
import {
  yeseninPartOnePassTwoClaimCoverage,
  yeseninPartOneSourcesPassTwo,
} from '../src/data/essays/yeseninPartOneSourcesPassTwo';

const errors: string[] = [];
const sourceIds = new Set<string>();
const normalizedUrls = new Set<string>();
const allSources = [...yeseninPartOneSources, ...yeseninPartOneSourcesPassTwo] as const;

function normalizedUrl(value: string): string {
  return value.replace(/^http:/, 'https:').replace(/\/$/, '');
}

function fail(message: string) {
  errors.push(message);
}

if (allSources.length < 29) {
  fail(`source registry regressed below pass-two floor: ${allSources.length} < 29`);
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
    fail(`${source.id}: source URL is required in pass-two registry`);
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

for (const [claimId, coverage] of Object.entries(yeseninPartOnePassTwoClaimCoverage)) {
  if (!requiredClaims.includes(claimId as (typeof requiredClaims)[number])) {
    fail(`${claimId}: pass-two coverage points to an unguarded claim`);
  }
  if (coverage.sourceIds.length === 0) {
    fail(`${claimId}: pass-two coverage must add at least one exact source`);
  }
  for (const sourceId of coverage.sourceIds) {
    if (!sourceIds.has(sourceId)) fail(`${claimId}: unknown pass-two source id ${sourceId}`);
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

const primaryCount = allSources.filter((source) => source.kind === 'primary').length;
const unresolvedClaims = Object.values(yeseninPartOneClaimCoverage)
  .filter((coverage) => coverage.missing.length > 0)
  .length;
const passTwoOpenHolds = Object.values(yeseninPartOnePassTwoClaimCoverage)
  .filter((coverage) => coverage.remaining.length > 0)
  .length;

console.log(
  `Yesenin Part I research validation: ${allSources.length} classified sources `
  + `(${yeseninPartOneSources.length} pass one + ${yeseninPartOneSourcesPassTwo.length} pass two), `
  + `${primaryCount} primary records, ${requiredClaims.length} guarded claims, `
  + `${unresolvedClaims} pass-one gaps and ${passTwoOpenHolds} pass-two archive/publication holds; `
  + 'public registration remains blocked.',
);
