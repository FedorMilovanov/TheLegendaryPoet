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
const matrixPath = 'research/yesenin/PART_ONE_1895_1921_AUTHORING_MATRIX_V2.md';
const draftPaths = [
  'research/yesenin/PART_ONE_DRAFT_1895_1921.md',
  'research/yesenin/PART_ONE_DRAFT_CONTINUATION_1916_1920.md',
] as const;
const sourcePaths = [
  'src/data/essays/yeseninPartOneSources.ts',
  'src/data/essays/yeseninPartOneSourcesPassTwo.ts',
  'src/data/essays/yeseninPartOneSourcesPassThree.ts',
] as const;

const verification = read(verificationPath);
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
  matrix,
  '42-SOURCES-VERIFIED / 14-PRIMARY-RECORDS / 7-EXACT-FEB-PAGE-IMAGES',
  matrixPath,
);
requireText(matrix, 'PUBLICATION-NOT-AUTHORIZED', matrixPath);

const verificationRows = [...verification.matchAll(/^\|\s*(\d+)\s*\|\s*`ye1-/gm)].map((match) =>
  Number(match[1]),
);
if (verificationRows.length !== 42) {
  fail(`expected 42 verification-table records, found ${verificationRows.length}`);
}
const expectedRows = Array.from({ length: 42 }, (_, index) => index + 1);
if (verificationRows.some((value, index) => value !== expectedRows[index])) {
  fail('verification-table numbering must remain continuous from 1 through 42');
}

const matrixRows = [...matrix.matchAll(/^\|\s*(\d+)\s*\|/gm)].map((match) => Number(match[1]));
for (const section of Array.from({ length: 12 }, (_, index) => index + 1)) {
  if (!matrixRows.includes(section)) fail(`matrix status table is missing section ${section}`);
}

const requiredMatrixStates = [
  'DRAFT-WRITTEN / CITATION-CONVERSION-REQUIRED',
  'DRAFT-WRITTEN / EXACT-WITNESS-GUARDED',
  'DRAFT-WRITTEN / ARCHIVE-DETAILS-PENDING',
  'DRAFT-WRITTEN / CAUSAL-BOUNDARY-LOCKED',
  'DRAFT-WRITTEN / PRIMARY-PAIR-COLLATED',
  'DRAFT-WRITTEN / CORRESPONDENCE-GAPS-DECLARED',
  'DRAFT-WRITTEN / PDF-PAGE-COLLATION-PENDING',
  'SOURCE-PACK-READY / PROSE-NEXT',
  'PARTIAL-SOURCE / EXACT-1917-1918-COLLATION-HOLD',
  'PRIMARY-TEXTS-COLLATED / PROSE-NEXT',
  'PARTIAL / FIRST-PUBLICATION-HOLD',
  'PARTIAL / CHRONICLE-V3-DATING-REQUIRED',
] as const;
for (const state of requiredMatrixStates) requireText(matrix, state, matrixPath);

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
  '## 10. Религиозно-революционные поэмы',
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
if (blockEntries.length < 70) {
  fail(`expected at least 70 authored paragraph blocks, found ${blockEntries.length}`);
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
  fail(`expected 42 declared Yesenin Part I source IDs, found ${declaredSourceIds.size}`);
}

const referencedYeSourceIds = new Set<string>();
for (const match of allDraftText.matchAll(/\[sources:\s*([^\]]+)\]/g)) {
  for (const rawToken of match[1].split(',')) {
    const token = rawToken.trim();
    if (token.startsWith('ye1-')) referencedYeSourceIds.add(token);
  }
}
for (const sourceId of referencedYeSourceIds) {
  if (!declaredSourceIds.has(sourceId)) fail(`draft references unknown source ID ${sourceId}`);
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

console.log(
  JSON.stringify(
    {
      verificationRecords: verificationRows.length,
      declaredSourceIds: declaredSourceIds.size,
      referencedSourceIds: referencedYeSourceIds.size,
      authoredBlocks: blockEntries.length,
      draftedSections: [1, 2, 3, 4, 5, 6, 7, 8, 10],
      pendingSections: [9, 11, 12],
      publicationAuthorized: false,
    },
    null,
    2,
  ),
);
