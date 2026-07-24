import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  YESENIN_PART_ONE_UNPUBLISHED_ID,
  YESENIN_PART_ONE_UNPUBLISHED_SLUG,
  yeseninPartOneUnpublishedArticle,
} from './lib/yesenin-part-one-unpublished-article';
import { loadYeseninPartOneCompleteCitationTopology } from './lib/yesenin-part-one-complete-citation-topology';
import {
  yeseninPartOneEditorialPassSeven,
  yeseninPartOneEditorialPassSevenExpectedCount,
  yeseninPartOneEditorialPassSevenExpectedSections,
} from '../src/data/essays/yeseninPartOneEditorialPassSeven';
import { yeseninPartOnePhysicalWitnessesPassSix } from '../src/data/essays/yeseninPartOnePhysicalWitnessesPassSix';

const fail = (message: string): never => {
  throw new Error(`[yesenin-part-one-unpublished] ${message}`);
};

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');
const topology = loadYeseninPartOneCompleteCitationTopology(root);
const articlePackage = yeseninPartOneUnpublishedArticle;
const { essay, evidenceByBlockId } = articlePackage;

if (
  articlePackage.status !== 'unpublished-typed-article' ||
  articlePackage.publicationAuthorized !== false ||
  articlePackage.registrationAuthorized !== false ||
  articlePackage.mediaPublicationAuthorized !== false
) {
  fail('article package must remain unpublished, unregistered and media-blocked');
}
if (articlePackage.bibliographyPolicy !== 'canonical-only-rendering') {
  fail('rendered bibliography must remain canonical-only');
}
if (essay.id !== YESENIN_PART_ONE_UNPUBLISHED_ID || essay.slug !== YESENIN_PART_ONE_UNPUBLISHED_SLUG) {
  fail('unpublished essay identity changed');
}
if (essay.series?.part !== 1 || essay.series.total !== 2) {
  fail('Yesenin biography must remain a two-part series with this package as part one');
}
if (
  articlePackage.editorialPass !== 'sections-9-12-literary-theological-pass-seven' ||
  JSON.stringify(articlePackage.editedSections) !== JSON.stringify([9, 10, 11, 12]) ||
  articlePackage.fullyEditedSections !== false
) {
  fail('pass seven must cover sections 9-12 without claiming whole-article completion');
}

const evidenceEntries = Object.values(evidenceByBlockId);
if (topology.nodes.length !== 137 || evidenceEntries.length !== 137) {
  fail(`expected 137 topology/evidence nodes; found ${topology.nodes.length}/${evidenceEntries.length}`);
}
const evidenceIds = new Set(evidenceEntries.map((entry) => entry.blockId));
if (evidenceIds.size !== 137) fail('evidence map contains duplicate stable block IDs');
for (const node of topology.nodes) {
  const evidence = evidenceByBlockId[node.blockId];
  if (!evidence) fail(`missing evidence record for ${node.blockId}`);
  if (evidence.sourceOrder !== node.sourceOrder || evidence.sectionNumber !== node.sectionNumber) {
    fail(`${node.blockId} changed canonical order or section ownership`);
  }
  if (evidence.publicationAuthorized !== false) {
    fail(`${node.blockId} silently authorizes publication`);
  }
  const pairs: Array<[string, readonly string[], readonly string[]]> = [
    ['claims', evidence.claimIds, node.claimIds],
    ['render sources', evidence.renderSourceIds, node.canonicalSourceIds],
    ['supplements', evidence.supplementalSourceIds, node.supplementalSourceIds],
    ['research checks', evidence.researchCheckSourceIds, node.researchCheckSourceIds],
    ['witnesses', evidence.witnessSourceIds, node.witnessSourceIds],
    ['acquisitions', evidence.acquisitionSourceIds, node.acquisitionSourceIds],
  ];
  for (const [label, left, right] of pairs) {
    if (JSON.stringify(left) !== JSON.stringify(right)) {
      fail(`${node.blockId} changed ${label}`);
    }
  }
}

const sectionBlocks = essay.blocks.filter((block) => block.type === 'section');
const authoredBlocks = essay.blocks.filter((block) => block.type !== 'section');
if (sectionBlocks.length !== 12) fail(`expected 12 rendered section blocks, found ${sectionBlocks.length}`);
if (authoredBlocks.length !== 137) fail(`expected 137 authored render blocks, found ${authoredBlocks.length}`);
if (essay.blocks.length !== 149) fail(`expected 149 total render blocks, found ${essay.blocks.length}`);
if (essay.blocks.filter((block) => block.type === 'lead').length !== 1) {
  fail('typed article must render exactly one lead block');
}
if (essay.blocks.filter((block) => block.type === 'note').length !== 1) {
  fail('typed article must render exactly one qualified editorial override note');
}
if (essay.blocks.some((block) => block.type === 'image')) {
  fail('unpublished package must not contain documentary image blocks');
}

const authoredBlockIds = authoredBlocks.map((block) => block.id);
if (authoredBlockIds.some((id) => !id)) fail('every authored render block needs a stable ID');
if (new Set(authoredBlockIds).size !== 137) fail('authored render block IDs are not unique');
const expectedOrder = topology.nodes.map((node) => node.blockId);
if (JSON.stringify(authoredBlockIds) !== JSON.stringify(expectedOrder)) {
  fail('render block order differs from complete citation topology');
}

const renderedTextById = new Map(
  authoredBlocks.map((block) => [
    block.id as string,
    'text' in block && typeof block.text === 'string' ? block.text : '',
  ] as const),
);
const editorialEntries = Object.entries(yeseninPartOneEditorialPassSeven);
if (
  yeseninPartOneEditorialPassSevenExpectedCount !== 68 ||
  editorialEntries.length !== yeseninPartOneEditorialPassSevenExpectedCount
) {
  fail(`expected 68 pass-seven overrides, found ${editorialEntries.length}`);
}
if (JSON.stringify(yeseninPartOneEditorialPassSevenExpectedSections) !== JSON.stringify([9, 10, 11, 12])) {
  fail('pass-seven section contract changed');
}
const targetNodes = topology.nodes.filter((node) => node.sectionNumber >= 9 && node.sectionNumber <= 12);
if (targetNodes.length !== 68) fail(`expected 68 topology nodes in sections 9-12, found ${targetNodes.length}`);
const targetIds = new Set(targetNodes.map((node) => node.blockId));
const overrideIds = new Set(editorialEntries.map(([blockId]) => blockId));
if (overrideIds.size !== 68) fail('pass-seven overrides contain duplicate block IDs');
for (const blockId of targetIds) {
  if (!overrideIds.has(blockId)) fail(`pass seven misses late-section block ${blockId}`);
}
for (const [blockId, text] of editorialEntries) {
  const node = topology.nodes.find((candidate) => candidate.blockId === blockId);
  if (!node) fail(`pass seven targets unknown block ${blockId}`);
  if (node.sectionNumber < 9 || node.sectionNumber > 12) {
    fail(`pass seven escapes sections 9-12 at ${blockId}`);
  }
  if (!evidenceByBlockId[blockId]?.editorialPassSevenApplied) {
    fail(`${blockId} is not marked as edited in the internal evidence map`);
  }
  if (renderedTextById.get(blockId) !== text) {
    fail(`${blockId} does not render the reviewed pass-seven text`);
  }
  if (text.length < 120 || text.length > 1200) {
    fail(`${blockId} has implausible edited text length ${text.length}`);
  }
  if (/\[(?:block|claims|sources):/u.test(text)) {
    fail(`${blockId} leaks authoring metadata into reader-facing prose`);
  }
}
for (const node of topology.nodes.filter((candidate) => candidate.sectionNumber < 9)) {
  if (evidenceByBlockId[node.blockId]?.editorialPassSevenApplied) {
    fail(`pass seven silently edits early-section block ${node.blockId}`);
  }
}

const serviceLanguagePatterns = [
  /статья должна/iu,
  /в авторском тексте/iu,
  /нужный следующий шаг/iu,
  /citation topology/iu,
  /должны быть включены в финальную/iu,
  /историческая добросовестность требует/iu,
];
for (const [blockId, text] of editorialEntries) {
  for (const pattern of serviceLanguagePatterns) {
    if (pattern.test(text)) fail(`${blockId} retains service-language pattern ${pattern}`);
  }
}
const requiredEditorialAnchors: Readonly<Record<string, readonly string[]>> = {
  'yesenin-p1-reich-family-memory-boundary': ['семейная память', 'не превращаются'],
  'yesenin-p1-poems-analysis-method': ['что именно написано', 'богословская оценка'],
  'yesenin-p1-poems-inoniya-cross-conflict': ['распятого и воскресшего Христа'],
  'yesenin-p1-poems-christian-reflection-limit': ['не принадлежит биографу'],
  'yesenin-p1-imaginism-three-dates': ['30 января 1919 года', '10 февраля', '17 или 18 апреля'],
  'yesenin-p1-transition-duncan-academic-date-hierarchy': ['видимо, 3 октября 1921 года', 'предположительность'],
  'yesenin-p1-transition-duncan-mariengof-attribution': ['Анатолия Мариенгофа', 'не'],
  'yesenin-p1-transition-duncan-competing-chronologies': ['Маквей', 'Ирма Дункан', 'Шнейдер'],
};
for (const [blockId, anchors] of Object.entries(requiredEditorialAnchors)) {
  const text = yeseninPartOneEditorialPassSeven[blockId as keyof typeof yeseninPartOneEditorialPassSeven];
  if (!text) fail(`missing anchored editorial block ${blockId}`);
  for (const anchor of anchors) {
    if (!text.includes(anchor)) fail(`${blockId} is missing editorial anchor ${anchor}`);
  }
}

const bibliographyIds = new Set(
  (essay.sources ?? []).map((source) => source.id).filter((id): id is string => Boolean(id)),
);
if (bibliographyIds.size !== 37 || essay.sources?.length !== 37) {
  fail(`expected 37 referenced canonical bibliography rows, found ${essay.sources?.length ?? 0}/${bibliographyIds.size}`);
}
const forbiddenInternalId = /^(?:SUP-YE1-|MCVAY-P5-|USR-YE1-|WIT-YE1-|feb-ye1-)/;
for (const source of essay.sources ?? []) {
  if (!source.id) fail(`bibliography source ${source.title} has no stable ID`);
  if (forbiddenInternalId.test(source.id)) fail(`internal evidence leaked into bibliography: ${source.id}`);
}
for (const block of authoredBlocks) {
  if (!('sourceIds' in block) || !block.sourceIds) continue;
  for (const sourceId of block.sourceIds) {
    if (forbiddenInternalId.test(sourceId)) {
      fail(`${block.id} leaks internal source ${sourceId} into rendered citations`);
    }
    if (!bibliographyIds.has(sourceId)) {
      fail(`${block.id} references missing rendered bibliography source ${sourceId}`);
    }
  }
}

const claims = new Set(evidenceEntries.flatMap((entry) => entry.claimIds));
const supplements = new Set(evidenceEntries.flatMap((entry) => entry.supplementalSourceIds));
const researchChecks = new Set(evidenceEntries.flatMap((entry) => entry.researchCheckSourceIds));
const acquisitions = new Set(evidenceEntries.flatMap((entry) => entry.acquisitionSourceIds));
if (claims.size !== 27) fail(`expected all 27 claims, found ${claims.size}`);
if (supplements.size !== 10) fail(`expected all 10 supplemental IDs, found ${supplements.size}`);
if (researchChecks.size !== 24) fail(`expected 24 referenced McVay research IDs, found ${researchChecks.size}`);
if (acquisitions.size !== 7) fail(`expected all seven FEB acquisitions, found ${acquisitions.size}`);

const stableShape = topology.nodes.map((node) => ({
  blockId: node.blockId,
  origin: node.origin,
  sectionNumber: node.sectionNumber,
  claimIds: node.claimIds,
  editorialClaims: node.editorialClaims,
  rawSourceIds: node.rawSourceIds,
  sourceIds: node.sourceIds,
  researchCheckSourceIds: node.researchCheckSourceIds,
  acquisitionSourceIds: node.acquisitionSourceIds,
  overrideSourceIds: node.overrideSourceIds,
  legacySourceTokens: node.legacySourceTokens,
  sourceCorrections: node.sourceCorrections,
}));
const topologyDigest = createHash('sha256').update(JSON.stringify(stableShape)).digest('hex');
if (topologyDigest !== '26b6ef20ccb07abde9064c18bff716a4890b6823242f808e2aecccb551b53a52') {
  fail(`unexpected complete topology digest ${topologyDigest}`);
}
const editorialDigest = createHash('sha256').update(JSON.stringify(editorialEntries)).digest('hex');

const registryText = [
  read('src/data/essays/index.ts'),
  read('src/data/essays/indexContent.ts'),
  read('public/sitemap.xml'),
].join('\n');
for (const forbidden of [
  'yeseninPartOneUnpublishedArticle',
  YESENIN_PART_ONE_UNPUBLISHED_ID,
  YESENIN_PART_ONE_UNPUBLISHED_SLUG,
]) {
  if (registryText.includes(forbidden)) fail(`unpublished article leaked into a public registry: ${forbidden}`);
}

if (yeseninPartOnePhysicalWitnessesPassSix.length !== 12) {
  fail(`expected 12 pass-six physical witness records, found ${yeseninPartOnePhysicalWitnessesPassSix.length}`);
}
const witnessIds = new Set(yeseninPartOnePhysicalWitnessesPassSix.map((record) => record.id));
if (witnessIds.size !== yeseninPartOnePhysicalWitnessesPassSix.length) {
  fail('pass-six physical witness IDs are not unique');
}
for (const record of yeseninPartOnePhysicalWitnessesPassSix) {
  if (
    record.productionReuseAuthorized !== false ||
    record.facsimileBytesAcquired ||
    record.facsimileVisuallyInspected ||
    record.archiveOriginalInspected
  ) {
    fail(`${record.id} silently upgrades an uninspected object or authorizes reuse`);
  }
}
const ispoved = yeseninPartOnePhysicalWitnessesPassSix.find((record) => record.id === 'PW6-YE1-ISPOVED-1921');
if (!ispoved?.exactLocator?.includes('000200_000018_RU_NLR_A1SV_46698')) {
  fail('exact NEB identifier for the 1921 Ispoved khuligana object is missing');
}
const nypl = yeseninPartOnePhysicalWitnessesPassSix.find((record) => record.id === 'PW6-YE1-NYPL-DUNCAN-PROGRAM');
if (!nypl?.exactLocator?.includes('*MGZB-Res. ++ 93-8695')) {
  fail('NYPL Duncan program shelf locator is missing');
}
const pravda = yeseninPartOnePhysicalWitnessesPassSix.find((record) => record.id === 'PW6-YE1-PRAVDA-1921-11-09');
if (pravda?.state !== 'still-unresolved') fail('Pravda 9 November target must remain unresolved');

const passSixLedger = read('research/yesenin/PART_ONE_DEEP_SOURCE_PASS6_AND_EDITORIAL_GATE_2026-07-24.md');
const passRows = [...passSixLedger.matchAll(/^\|\s*(\d+)\s*\|/gm)].map((match) => Number(match[1]));
if (passRows.length !== 44 || passRows.some((row, index) => row !== index + 1)) {
  fail(`expected continuous 44-row deep-source ledger, found ${passRows.length}`);
}
for (const status of [
  'AUDIT-COMPLETE / BLOCK-BY-BLOCK-LITERARY-REWRITE-PENDING',
  'THEOLOGICAL-BOUNDARIES-FROZEN / SENTENCE-LEVEL-EDIT-PENDING',
  'PUBLICATION-AUTHORIZATION-FALSE',
]) {
  if (!passSixLedger.includes(status)) fail(`pass-six ledger is missing status ${status}`);
}
const passSevenLedger = read('research/yesenin/PART_ONE_EDITORIAL_PASS7_SECTIONS_9_12_2026-07-24.md');
for (const status of [
  'SECTIONS-9-12-LITERARY-EDIT-COMPLETE',
  'SECTION-10-THEOLOGICAL-SENTENCE-EDIT-COMPLETE',
  'SECTIONS-1-8-SENTENCE-EDIT-PENDING',
  'PUBLICATION-AUTHORIZATION-FALSE',
]) {
  if (!passSevenLedger.includes(status)) fail(`pass-seven ledger is missing status ${status}`);
}

console.log(
  JSON.stringify(
    {
      status: articlePackage.status,
      essayId: essay.id,
      slug: essay.slug,
      totalRenderBlocks: essay.blocks.length,
      sectionBlocks: sectionBlocks.length,
      evidenceBearingBlocks: authoredBlocks.length,
      passSevenEditedBlocks: editorialEntries.length,
      passSevenEditedSections: articlePackage.editedSections,
      renderedBibliographySources: bibliographyIds.size,
      representedClaims: claims.size,
      internalSupplementalSources: supplements.size,
      referencedResearchChecks: researchChecks.size,
      internalAcquisitionSources: acquisitions.size,
      physicalWitnessRecords: yeseninPartOnePhysicalWitnessesPassSix.length,
      deepSourceChecks: passRows.length,
      stableTopologySha256: topologyDigest,
      editorialPassSevenSha256: editorialDigest,
      sectionsNineToTwelveLiteraryEditComplete: true,
      sectionTenTheologicalSentenceEditComplete: true,
      wholeArticleSentenceEditComplete: false,
      publicationAuthorized: false,
      mediaPublicationAuthorized: false,
    },
    null,
    2,
  ),
);
