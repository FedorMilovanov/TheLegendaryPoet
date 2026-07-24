import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

const read = (path: string) => readFileSync(resolve(root, path), 'utf8');
const fail = (message: string): never => {
  throw new Error(`[yesenin-part-one-authoring] ${message}`);
};
const requireText = (content: string, fragment: string, label: string) => {
  if (!content.includes(fragment)) fail(`${label} is missing required fragment: ${fragment}`);
};

const verificationPath = 'research/yesenin/PART_ONE_SOURCE_VERIFICATION_PASS4_2026-07-24.md';
const supplementPath = 'research/yesenin/PART_ONE_TARGETED_WEB_SUPPLEMENT_2026-07-24.md';
const matrixPath = 'research/yesenin/PART_ONE_1895_1921_AUTHORING_MATRIX_V3.md';
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
  matrix,
  '52-WEB-VERIFICATIONS / 42-CANONICAL-SOURCES / 10-TARGETED-SUPPLEMENTS / 12-SECTIONS-DRAFTED',
  matrixPath,
);
requireText(matrix, 'PUBLICATION-NOT-AUTHORIZED', matrixPath);

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

const matrixRows = [...matrix.matchAll(/^\|\s*(\d+)\s*\|/gm)].map((match) => Number(match[1]));
for (const section of Array.from({ length: 12 }, (_, index) => index + 1)) {
  if (!matrixRows.includes(section)) fail(`matrix status table is missing section ${section}`);
}

for (const state of [
  'DRAFT-WRITTEN-WITH-QUALIFIERS',
  'DRAFT-WRITTEN-WITH-PUBLICATION-HOLD',
  'PRIMARY-TEXTS-COLLATED',
  'THREE-DATE-HISTORY-COLLATED',
  'ACADEMIC-DATING-AND-NEB-OBJECT',
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

const blockEntries = drafts.flatMap(({ path, content }) =>
  [...content.matchAll(/\[block:\s*([^\]]+)\]/g)].map((match) => ({ path, id: match[1].trim() })),
);
if (blockEntries.length < 100) {
  fail(`expected at least 100 authored paragraph blocks, found ${blockEntries.length}`);
}

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
for (const match of allDraftText.matchAll(/\[sources:\s*([^\]]+)\]/g)) {
  for (const rawToken of match[1].split(',')) {
    const token = rawToken.trim();
    if (token.startsWith('ye1-')) referencedYeSourceIds.add(token);
    if (token.startsWith('SUP-YE1-')) referencedSupplementalIds.add(token);
  }
}
for (const sourceId of referencedYeSourceIds) {
  if (!declaredSourceIds.has(sourceId)) fail(`draft references unknown canonical source ID ${sourceId}`);
}
for (const sourceId of referencedSupplementalIds) {
  if (!supplementalIdSet.has(sourceId)) fail(`draft references unknown supplemental source ID ${sourceId}`);
}
if (referencedSupplementalIds.size !== 10) {
  fail(`all 10 targeted supplemental records must be used in prose; found ${referencedSupplementalIds.size}`);
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

console.log(
  JSON.stringify(
    {
      canonicalVerificationRecords: verificationRows.length,
      targetedSupplementalRecords: supplementalIds.length,
      totalWebVerifications: verificationRows.length + supplementalIds.length,
      declaredCanonicalSourceIds: declaredSourceIds.size,
      referencedCanonicalSourceIds: referencedYeSourceIds.size,
      referencedSupplementalIds: referencedSupplementalIds.size,
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
