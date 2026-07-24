import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  YESENIN_MCVAY_USER_SOURCE_ID,
  yeseninPartOneMcVayResearchCheckIds,
  yeseninPartOneMcVayResearchChecks,
} from '../src/data/essays/yeseninPartOneMcVayResearchChecks';

const root = process.cwd();

const read = (path: string) => readFileSync(resolve(root, path), 'utf8');
const fail = (message: string): never => {
  throw new Error(`[yesenin-part-one-authoring] ${message}`);
};
const requireText = (content: string, fragment: string, label: string) => {
  if (!content.includes(fragment)) fail(`${label} is missing required fragment: ${fragment}`);
};
const normalizeLedgerLabel = (value: string) => value.replace(/\s+/g, ' ').trim();

const verificationPath = 'research/yesenin/PART_ONE_SOURCE_VERIFICATION_PASS4_2026-07-24.md';
const supplementPath = 'research/yesenin/PART_ONE_TARGETED_WEB_SUPPLEMENT_2026-07-24.md';
const mcvayPath = 'research/yesenin/PART_ONE_MCVAY_DUNCAN_VERIFICATION_PASS5_2026-07-24.md';
const bookUpdatePath = 'research/yesenin/PART_ONE_BOOK_REQUESTS_UPDATE_MCVAY_2026-07-24.md';
const matrixPath = 'research/yesenin/PART_ONE_1895_1921_AUTHORING_MATRIX_V4.md';
const draftPaths = [
  'research/yesenin/PART_ONE_DRAFT_1895_1921.md',
  'research/yesenin/PART_ONE_DRAFT_CONTINUATION_1916_1920.md',
  'research/yesenin/PART_ONE_DRAFT_FINAL_SECTIONS_1917_1921.md',
] as const;
const sourcePaths = [
  'src/data/essays/yeseninPartOneSources.ts',
  'src/data/essays/yeseninPartOneSourcesPassTwo.ts',
  'src/data/essays/yeseninPartOneSourcesPassThree.ts',
] as const;

const verification = read(verificationPath);
const supplement = read(supplementPath);
const mcvay = read(mcvayPath);
const bookUpdate = read(bookUpdatePath);
const matrix = read(matrixPath);
const drafts = draftPaths.map((path) => ({ path, content: read(path) }));
const sourceModules = sourcePaths.map((path) => read(path)).join('\n');
const essayIndex = read('src/data/essays/index.ts');

requireText(
  verification,
  '42-REGISTRY-RECORDS-CHECKED / 39-CONTENT-COLLATED / 3-LEGACY-ENCODING-HOLDS',
  verificationPath,
);
requireText(
  supplement,
  '10-TARGETED-WEB-VERIFICATIONS / 52-TOTAL-CHECKS-WITH-PASS4',
  supplementPath,
);
requireText(
  mcvay,
  'USER-SUPPLIED-BOOK-COLLATED / 44-NEW-WEB-CHECKS / FIRST-MEETING-DATE-RECLASSIFIED',
  mcvayPath,
);
requireText(
  matrix,
  '96-CUMULATIVE-WEB-VERIFICATIONS / 44-MCVAY-CONTROL-CHECKS / 42-CANONICAL-SOURCES / 10-TARGETED-SUPPLEMENTS / 12-SECTIONS-DRAFTED',
  matrixPath,
);
requireText(matrix, 'PUBLICATION-NOT-AUTHORIZED', matrixPath);
requireText(bookUpdate, 'ONE-BOOK-ACQUIRED / RELATIONSHIP-MONOGRAPH-COLLATED', bookUpdatePath);

const verificationRows = [...verification.matchAll(/^\|\s*(\d+)\s*\|\s*`ye1-/gm)].map((match) =>
  Number(match[1]),
);
if (verificationRows.length !== 42) {
  fail(`expected 42 canonical verification-table records, found ${verificationRows.length}`);
}
const expectedRows = Array.from({ length: 42 }, (_, index) => index + 1);
if (verificationRows.some((value, index) => value !== expectedRows[index])) {
  fail('canonical verification-table numbering must remain continuous from 1 through 42');
}

const supplementalIds = [...supplement.matchAll(/^\|\s*`(SUP-YE1-\d{3})`\s*\|/gm)].map(
  (match) => match[1],
);
if (supplementalIds.length !== 10) {
  fail(`expected 10 targeted supplemental verification records, found ${supplementalIds.length}`);
}
if (new Set(supplementalIds).size !== supplementalIds.length) {
  fail('targeted supplemental verification IDs must be unique');
}
const expectedSupplementalIds = Array.from(
  { length: 10 },
  (_, index) => `SUP-YE1-${String(index + 1).padStart(3, '0')}`,
);
if (supplementalIds.some((value, index) => value !== expectedSupplementalIds[index])) {
  fail('supplemental verification IDs must remain continuous from SUP-YE1-001 through SUP-YE1-010');
}

const mcvayRows = [...mcvay.matchAll(/^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|/gm)].map(
  (match) => ({ row: Number(match[1]), ledgerLabel: normalizeLedgerLabel(match[2]) }),
);
if (mcvayRows.length !== yeseninPartOneMcVayResearchChecks.length) {
  fail(`expected 44 McVay pass-five verification records, found ${mcvayRows.length}`);
}
for (const check of yeseninPartOneMcVayResearchChecks) {
  const row = mcvayRows.find((candidate) => candidate.row === check.row);
  if (!row) fail(`McVay ledger is missing row ${check.row} for ${check.id}`);
  if (row.ledgerLabel !== normalizeLedgerLabel(check.ledgerLabel)) {
    fail(
      `McVay ledger row ${check.row} does not match ${check.id}: expected “${check.ledgerLabel}”, found “${row.ledgerLabel}”`,
    );
  }
}

for (const fragment of [
  'ACADEMIC-RECONSTRUCTION / NO-CONTEMPORANEOUS-MEETING-RECORD / COMPETING-MEMOIR-CHRONOLOGIES',
  YESENIN_MCVAY_USER_SOURCE_ID,
  '1a3167db1cb9cc2aa1ad64ac59b07bad4d97ebc51c5a142c334f2a74a0dc3238',
] as const) {
  requireText(mcvay, fragment, mcvayPath);
}
requireText(mcvay, 'PDF не коммитится и не перераспространяется', mcvayPath);

const matrixRows = [...matrix.matchAll(/^\|\s*(\d+)\s*\|/gm)].map((match) => Number(match[1]));
for (const section of Array.from({ length: 12 }, (_, index) => index + 1)) {
  if (!matrixRows.includes(section)) fail(`matrix status table is missing section ${section}`);
}

for (const state of [
  'DRAFT-WRITTEN-WITH-QUALIFIERS',
  'DRAFT-WRITTEN-WITH-PUBLICATION-HOLD',
  'PRIMARY-TEXTS-COLLATED',
  'THREE-DATE-HISTORY-COLLATED',
  'ACADEMIC-RECONSTRUCTION / COMPETING-MEMOIRS / MCVAY-COLLATED',
  'TYPED-CITATIONS-PENDING',
] as const) {
  requireText(matrix, state, matrixPath);
}

const allDraftText = drafts.map(({ content }) => content).join('\n');
for (const heading of [
  '## 1. Константиново',
  '## 2. Спас-Клепики',
  '## 3. Москва',
  '## 4. Анна Изряднова',
  '## 5. Девятое марта',
  '## 6. Николай Клюев',
  '## 7. «Радуница»',
  '## 8. Поезд № 143',
  '## 9. Зинаида Райх',
  '## 10. Религиозно-революционные поэмы',
  '## 11. Имажинизм',
  '## 12. 1921 год',
]) {
  requireText(allDraftText, heading, 'authored drafts');
}

for (const { path, content } of drafts) {
  requireText(content, 'NOT-YET-PUBLIC', path);
  if (/PUBLIC-READY|PUBLICATION-AUTHORIZED/.test(content)) {
    fail(`${path} must not claim public readiness`);
  }
}

const finalDraft = drafts.find(({ path }) => path.endsWith('PART_ONE_DRAFT_FINAL_SECTIONS_1917_1921.md'))
  ?.content ?? fail('final-section draft is missing');
for (const fragment of [
  'McVay после сопоставления мемуаров прямо заключает, что точная дата первой встречи неизвестна',
  'видимо, 3 октября 1921 года',
  '2 мая 1922 года',
  'Мастерская Якулова подтверждена лучше, чем календарное число',
  'Сцена `золотая голова — ангел — чёрт` принадлежит мемуарной версии Мариенгофа',
] as const) {
  requireText(finalDraft, fragment, draftPaths[2]);
}
if (/они точно встретились 3 октября/i.test(finalDraft)) {
  fail('final draft must not promote the reconstructed 3 October date to certainty');
}

const blockParagraphs = drafts.flatMap(({ path, content }) =>
  content
    .split(/\n\s*\n/)
    .map((paragraph, index) => ({ path, paragraph: paragraph.trim(), paragraphNumber: index + 1 }))
    .filter(({ paragraph }) => paragraph.includes('[block:')),
);
if (blockParagraphs.length !== 136) {
  fail(`expected exactly 136 authored paragraph blocks after McVay pass, found ${blockParagraphs.length}`);
}

const blockEntries = blockParagraphs.map(({ path, paragraph, paragraphNumber }) => {
  const blockMatches = [...paragraph.matchAll(/\[block:\s*([^\]]+)\]/g)];
  const claimMatches = [...paragraph.matchAll(/\[claims:\s*([^\]]+)\]/g)];
  const sourceMatches = [...paragraph.matchAll(/\[sources:\s*([^\]]+)\]/g)];
  const label = `${path} paragraph ${paragraphNumber}`;

  if (blockMatches.length !== 1) {
    fail(`${label} must contain exactly one [block] tag; found ${blockMatches.length}`);
  }
  if (claimMatches.length !== 1) {
    fail(`${label} must contain exactly one [claims] tag; found ${claimMatches.length}`);
  }
  if (sourceMatches.length !== 1) {
    fail(`${label} must contain exactly one [sources] tag; found ${sourceMatches.length}`);
  }

  const blockIndex = blockMatches[0].index ?? -1;
  const claimIndex = claimMatches[0].index ?? -1;
  const sourceIndex = sourceMatches[0].index ?? -1;
  if (!(blockIndex < claimIndex && claimIndex < sourceIndex)) {
    fail(`${label} must keep tag order [block] [claims] [sources]`);
  }

  return { path, id: blockMatches[0][1].trim() };
});

const blockOwners = new Map<string, string>();
for (const { path, id } of blockEntries) {
  if (!/^yesenin-p1-[a-z0-9-]+$/.test(id)) fail(`invalid block ID ${id} in ${path}`);
  const previous = blockOwners.get(id);
  if (previous) fail(`duplicate block ID ${id} in ${previous} and ${path}`);
  blockOwners.set(id, path);
}

const declaredSourceIds = new Set(
  [...sourceModules.matchAll(/\bid:\s*'([^']+)'/g)].map((match) => match[1]),
);
if (declaredSourceIds.size !== 42) {
  fail(`expected 42 declared canonical Yesenin Part I source IDs, found ${declaredSourceIds.size}`);
}

const supplementalIdSet = new Set(supplementalIds);
const referencedYeSourceIds = new Set<string>();
const referencedSupplementalIds = new Set<string>();
const referencedMcVayIds = new Set<string>();
let userMcVayCopyReferenced = false;
for (const match of allDraftText.matchAll(/\[sources:\s*([^\]]+)\]/g)) {
  for (const rawToken of match[1].split(',')) {
    const token = rawToken.trim();
    if (token.startsWith('ye1-')) referencedYeSourceIds.add(token);
    if (token.startsWith('SUP-YE1-')) referencedSupplementalIds.add(token);
    if (token.startsWith('MCVAY-P5-')) referencedMcVayIds.add(token);
    if (token === YESENIN_MCVAY_USER_SOURCE_ID) userMcVayCopyReferenced = true;
  }
}
for (const sourceId of referencedYeSourceIds) {
  if (!declaredSourceIds.has(sourceId)) fail(`draft references unknown canonical source ID ${sourceId}`);
}
for (const sourceId of referencedSupplementalIds) {
  if (!supplementalIdSet.has(sourceId)) fail(`draft references unknown supplemental source ID ${sourceId}`);
}
for (const sourceId of referencedMcVayIds) {
  if (!yeseninPartOneMcVayResearchCheckIds.has(sourceId)) {
    fail(`draft references unknown explicit McVay research-check ID ${sourceId}`);
  }
}
if (referencedYeSourceIds.size < 37) {
  fail(`expected at least 37 canonical source IDs used in prose, found ${referencedYeSourceIds.size}`);
}
if (referencedSupplementalIds.size !== 10) {
  fail(`all 10 targeted supplemental records must be used in prose; found ${referencedSupplementalIds.size}`);
}
if (referencedMcVayIds.size !== 23) {
  fail(`expected 23 explicit MCVAY-P5 IDs used in prose, found ${referencedMcVayIds.size}`);
}
if (!userMcVayCopyReferenced) {
  fail('user-supplied McVay copy must remain explicitly referenced in the Duncan prose');
}

const forbiddenPublicTokens = ['essay-yesenin-1895-1921', "slug: 'yesenin-1895-1921'"];
for (const token of forbiddenPublicTokens) {
  if (essayIndex.includes(token)) fail(`public essay registry must not contain ${token} yet`);
}

requireText(matrix, '0 document images authorized for production reuse', matrixPath);
requireText(matrix, 'route unregistered', matrixPath);
requireText(verification, '`LEGACY-ENCODING-HOLD`', verificationPath);
requireText(
  verification,
  'Три старые страницы ФЭБ отвечают по известному адресу',
  verificationPath,
);
requireText(supplement, 'PHYSICAL-WITNESSES-STILL-HELD', supplementPath);
requireText(bookUpdate, 'COPYRIGHTED-PDF-NOT-COMMITTED', bookUpdatePath);

console.log(
  JSON.stringify(
    {
      canonicalVerificationRecords: verificationRows.length,
      targetedSupplementalRecords: supplementalIds.length,
      mcvayControlChecks: mcvayRows.length,
      totalWebVerifications: verificationRows.length + supplementalIds.length + mcvayRows.length,
      declaredCanonicalSourceIds: declaredSourceIds.size,
      referencedCanonicalSourceIds: referencedYeSourceIds.size,
      referencedSupplementalIds: referencedSupplementalIds.size,
      declaredMcVayResearchCheckIds: yeseninPartOneMcVayResearchChecks.length,
      referencedMcVayIds: referencedMcVayIds.size,
      userMcVayCopyReferenced,
      authoredBlocks: blockEntries.length,
      draftedSections: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      pendingSections: [],
      typedCitationsPending: true,
      publicationAuthorized: false,
    },
    null,
    2,
  ),
);
