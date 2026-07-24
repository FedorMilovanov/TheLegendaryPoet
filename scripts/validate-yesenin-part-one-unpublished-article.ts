import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  YESENIN_PART_ONE_UNPUBLISHED_ID,
  YESENIN_PART_ONE_UNPUBLISHED_SLUG,
  yeseninPartOneUnpublishedArticle,
} from './lib/yesenin-part-one-unpublished-article';
import { loadYeseninPartOnePass6CitationTopology } from './lib/yesenin-part-one-pass6-citation-topology';
import { yeseninPartOnePhysicalWitnessesPassSix } from '../src/data/essays/yeseninPartOnePhysicalWitnessesPassSix';
import { yeseninPartOneRealVisualsPassSix } from '../src/data/essays/yeseninPartOneRealVisualsPassSix';

const fail = (message: string): never => {
  throw new Error(`[yesenin-part-one-unpublished] ${message}`);
};

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');
const topology = loadYeseninPartOnePass6CitationTopology(root);
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

const evidenceEntries = Object.values(evidenceByBlockId);
if (topology.nodes.length !== 146 || evidenceEntries.length !== 146) {
  fail(`expected 146 pass-6 topology/evidence nodes; found ${topology.nodes.length}/${evidenceEntries.length}`);
}
if (topology.pass6BlockIds.size !== 9) {
  fail(`expected nine pass-6 authored additions, found ${topology.pass6BlockIds.size}`);
}
if (topology.canonicalSourceIds.size !== 90) {
  fail(`expected 90 declared canonical source IDs, found ${topology.canonicalSourceIds.size}`);
}
const evidenceIds = new Set(evidenceEntries.map((entry) => entry.blockId));
if (evidenceIds.size !== 146) fail('evidence map contains duplicate stable block IDs');
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
if (authoredBlocks.length !== 146) fail(`expected 146 authored render blocks, found ${authoredBlocks.length}`);
if (essay.blocks.length !== 158) fail(`expected 158 total render blocks, found ${essay.blocks.length}`);
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
if (new Set(authoredBlockIds).size !== 146) fail('authored render block IDs are not unique');
const expectedOrder = topology.nodes.map((node) => node.blockId);
if (JSON.stringify(authoredBlockIds) !== JSON.stringify(expectedOrder)) {
  fail('render block order differs from pass-6 citation topology');
}
for (const blockId of topology.pass6BlockIds) {
  if (!authoredBlockIds.includes(blockId)) fail(`pass-6 block ${blockId} is absent from the typed article`);
}

const bibliographyIds = new Set(
  (essay.sources ?? []).map((source) => source.id).filter((id): id is string => Boolean(id)),
);
if (bibliographyIds.size !== 64 || essay.sources?.length !== 64) {
  fail(`expected 64 referenced canonical bibliography rows, found ${essay.sources?.length ?? 0}/${bibliographyIds.size}`);
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

const pass6ReferencedSources = new Set(
  topology.nodes
    .filter((node) => topology.pass6BlockIds.has(node.blockId))
    .flatMap((node) => node.canonicalSourceIds)
    .filter((sourceId) => topology.passFourSourceIds.has(sourceId)),
);
if (pass6ReferencedSources.size !== 27) {
  fail(`expected 27 pass-four sources rendered by new prose, found ${pass6ReferencedSources.size}`);
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
  sourceIds: node.sourceIds,
  overrideSourceIds: node.overrideSourceIds,
}));
const topologyDigest = createHash('sha256').update(JSON.stringify(stableShape)).digest('hex');
if (topologyDigest !== '49354adab3d14bbe03ca48b3fb6c4f1795601d7101c82694a5f7fa5cfec1b838') {
  fail(`unexpected pass-6 topology digest ${topologyDigest}`);
}

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

if (yeseninPartOneRealVisualsPassSix.length !== 8) {
  fail(`expected eight real-only visual records, found ${yeseninPartOneRealVisualsPassSix.length}`);
}
if (yeseninPartOneRealVisualsPassSix.some((record) => record.productionAuthorized !== false)) {
  fail('real visual registry silently authorizes production use');
}

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

console.log(
  JSON.stringify(
    {
      status: articlePackage.status,
      essayId: essay.id,
      slug: essay.slug,
      totalRenderBlocks: essay.blocks.length,
      sectionBlocks: sectionBlocks.length,
      evidenceBearingBlocks: authoredBlocks.length,
      pass6AuthoredBlocks: topology.pass6BlockIds.size,
      declaredCanonicalSources: topology.canonicalSourceIds.size,
      renderedBibliographySources: bibliographyIds.size,
      pass6SourcesRenderedInNewProse: pass6ReferencedSources.size,
      representedClaims: claims.size,
      internalSupplementalSources: supplements.size,
      referencedResearchChecks: researchChecks.size,
      internalAcquisitionSources: acquisitions.size,
      physicalWitnessRecords: yeseninPartOnePhysicalWitnessesPassSix.length,
      realOnlyVisualRecords: yeseninPartOneRealVisualsPassSix.length,
      deepSourceChecks: passRows.length,
      stableTopologySha256: topologyDigest,
      literaryRewriteComplete: false,
      theologicalSentenceEditComplete: false,
      publicationAuthorized: false,
      mediaPublicationAuthorized: false,
    },
    null,
    2,
  ),
);
