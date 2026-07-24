import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { EssaySourceKind } from '../src/types/essay';
import { yeseninPartOneSources } from '../src/data/essays/yeseninPartOneSources';
import { yeseninPartOneSourcesPassTwo } from '../src/data/essays/yeseninPartOneSourcesPassTwo';
import { yeseninPartOneSourcesPassThree } from '../src/data/essays/yeseninPartOneSourcesPassThree';
import { yeseninPartOneSourcesPassFour } from '../src/data/essays/yeseninPartOneSourcesPassFour';
import { loadYeseninPartOneCompleteCitationTopology } from './lib/yesenin-part-one-complete-citation-topology';
import {
  loadYeseninPartOnePass6CitationTopology,
  yeseninPartOnePass6AdditionPath,
} from './lib/yesenin-part-one-pass6-citation-topology';

const root = process.cwd();
const sourcePackagePaths = [
  'research/yesenin/PART_ONE_SOURCE_SWEEP_PASS6_EARLY.md',
  'research/yesenin/PART_ONE_SOURCE_SWEEP_PASS6_MOSCOW.md',
  'research/yesenin/PART_ONE_SOURCE_SWEEP_PASS6_NETWORKS.md',
  'research/yesenin/PART_ONE_SOURCE_SWEEP_PASS6_BOOKS.md',
  'research/yesenin/PART_ONE_SOURCE_SWEEP_PASS6_IMAGISM.md',
  'research/yesenin/PART_ONE_SOURCE_SWEEP_PASS6_DUNCAN.md',
] as const;
const visualPath = 'research/yesenin/PART_ONE_VISUAL_BRIEFS_PASS6.md';
const indexPath = 'research/yesenin/PART_ONE_SOURCE_SWEEP_PASS6_INDEX.md';
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');
const fail = (message: string): never => {
  throw new Error(`[yesenin-part-one-source-sweep-pass6] ${message}`);
};

const base = loadYeseninPartOneCompleteCitationTopology(root);
const topology = loadYeseninPartOnePass6CitationTopology(root);
const sourcePackages = sourcePackagePaths.map((path) => ({ path, text: read(path) }));
const visual = read(visualPath);
const index = read(indexPath);
const additions = read(yeseninPartOnePass6AdditionPath);

if (base.nodes.length !== 137) {
  fail(`expected accepted pre-pass6 topology to contain 137 nodes, found ${base.nodes.length}`);
}
if (topology.nodes.length !== 145) {
  fail(`expected exact pass6 topology size 145, found ${topology.nodes.length}`);
}
if (topology.pass6BlockIds.size !== 8) {
  fail(`expected eight pass6 prose blocks, found ${topology.pass6BlockIds.size}`);
}
if (topology.nodes.filter((node) => node.origin === 'authoring-markdown').length !== 144) {
  fail('expected 144 Markdown-authored nodes after pass6');
}
const editorialOverrides = topology.nodes.filter((node) => node.origin === 'editorial-override');
if (
  editorialOverrides.length !== 1 ||
  editorialOverrides[0].blockId !== 'yesenin-p1-reich-1918-retrospective-boundary'
) {
  fail('pass6 must preserve exactly the accepted YE1-021 editorial override');
}

if (yeseninPartOneSourcesPassFour.length !== 48) {
  fail(`expected 48 pass-four source records, found ${yeseninPartOneSourcesPassFour.length}`);
}
const prePass6Sources = [
  ...yeseninPartOneSources,
  ...yeseninPartOneSourcesPassTwo,
  ...yeseninPartOneSourcesPassThree,
];
if (prePass6Sources.length !== 42) {
  fail(`expected 42 pre-pass6 canonical source records, found ${prePass6Sources.length}`);
}
const prePass6Urls = new Set(prePass6Sources.map((source) => source.url).filter(Boolean));
const passFourIds = new Set(yeseninPartOneSourcesPassFour.map((source) => source.id));
const passFourUrls = new Set(yeseninPartOneSourcesPassFour.map((source) => source.url));
if (passFourIds.size !== 48) fail('pass-four source IDs must be unique');
if (passFourUrls.size !== 48) fail('pass-four source URLs must be unique');
for (const source of yeseninPartOneSourcesPassFour) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(source.id)) fail(`invalid source ID ${source.id}`);
  if (!source.url.startsWith('https://')) fail(`${source.id} must use HTTPS`);
  if (base.canonicalSourceIds.has(source.id)) fail(`${source.id} duplicates a pre-pass6 source ID`);
  if (prePass6Urls.has(source.url)) fail(`${source.id} duplicates a pre-pass6 source URL`);
  if (!source.note || source.note.length < 60) fail(`${source.id} has an insufficient evidence-boundary note`);
}
if (topology.canonicalSourceIds.size !== 90) {
  fail(`expected 90 canonical source IDs after pass6, found ${topology.canonicalSourceIds.size}`);
}
if (topology.claimIds.size !== 27) {
  fail(`pass6 must preserve 27 declared claims, found ${topology.claimIds.size}`);
}
if (topology.acquisitionSourceIds.size !== 7) {
  fail(`pass6 must preserve seven exact FEB acquisitions, found ${topology.acquisitionSourceIds.size}`);
}

const kindCounts: Record<EssaySourceKind, number> = {
  primary: 0,
  archive: 0,
  research: 0,
  institutional: 0,
  context: 0,
};
for (const source of yeseninPartOneSourcesPassFour) {
  kindCounts[source.kind ?? 'research'] += 1;
}
if (
  kindCounts.primary !== 32 ||
  kindCounts.archive !== 8 ||
  kindCounts.research !== 6 ||
  kindCounts.institutional !== 2 ||
  kindCounts.context !== 0
) {
  fail(`unexpected pass-four source-kind distribution: ${JSON.stringify(kindCounts)}`);
}

const pass6Nodes = topology.nodes.filter((node) => topology.pass6BlockIds.has(node.blockId));
const expectedSections = [1, 2, 3, 7, 8, 10, 11];
const actualSections = [...new Set(pass6Nodes.map((node) => node.sectionNumber))].sort(
  (left, right) => left - right,
);
if (actualSections.join(',') !== expectedSections.join(',')) {
  fail(`pass6 section coverage drifted: ${actualSections.join(',')}`);
}
if (pass6Nodes.filter((node) => node.sectionNumber === 3).length !== 2) {
  fail('Moscow section must retain two pass6 blocks');
}
for (const node of pass6Nodes) {
  if (!node.blockId.startsWith('yesenin-p1-pass6-')) fail(`unexpected pass6 block ID ${node.blockId}`);
  if (!node.canonicalSourceIds.some((sourceId) => passFourIds.has(sourceId))) {
    fail(`${node.blockId} has no pass-four source`);
  }
  if (node.researchCheckSourceIds.length > 0) {
    fail(`${node.blockId} incorrectly cites McVay research-check IDs`);
  }
  if (node.origin !== 'authoring-markdown') fail(`${node.blockId} has wrong origin ${node.origin}`);
}
const referencedPassFourIds = new Set(
  pass6Nodes.flatMap((node) => node.canonicalSourceIds.filter((sourceId) => passFourIds.has(sourceId))),
);
if (referencedPassFourIds.size !== 23) {
  fail(`expected exactly 23 pass-four source IDs wired into prose, found ${referencedPassFourIds.size}`);
}

const packageRows = sourcePackages.flatMap(({ path, text }) => {
  const rows = [
    ...text.matchAll(/^\|\s*(\d+)\s*\|\s*`(ye1-[a-z0-9-]+)`\s*\|[^|]*\|[^|]*\|\s*(https:\/\/[^|\s]+)\s*\|/gm),
  ].map((match) => ({ number: Number(match[1]), id: match[2], url: match[3] }));
  if (rows.length !== 8) fail(`${path} must contain exactly eight source rows; found ${rows.length}`);
  if (rows.some((row, index) => row.number !== index + 1)) fail(`${path} numbering must run 1 through 8`);
  if (!text.includes('NOT-YET-PUBLIC')) fail(`${path} lost unpublished status`);
  return rows;
});
if (packageRows.length !== 48) fail(`expected 48 source-package rows, found ${packageRows.length}`);
for (const [index, source] of yeseninPartOneSourcesPassFour.entries()) {
  const row = packageRows[index];
  if (row.id !== source.id) fail(`package/source ID mismatch at global row ${index + 1}`);
  if (row.url !== source.url) fail(`package/source URL mismatch for ${source.id}`);
}

const visualBriefIds = [...visual.matchAll(/`(VIS-YE1-P6-\d{3})`/g)].map((match) => match[1]);
if (visualBriefIds.length !== 8 || new Set(visualBriefIds).size !== 8) {
  fail(`expected eight unique visual briefs, found ${new Set(visualBriefIds).size}`);
}
for (const marker of [
  'historical reconstruction',
  'не объявлять точной реконструкцией',
  'не генерировать ложный автограф',
  'В production пока не добавляется ни одно новое изображение',
  'NYPL finding aids используются как очередь item-level поиска',
] as const) {
  if (!visual.includes(marker)) fail(`visual/provenance policy is missing marker: ${marker}`);
}

if ((additions.match(/\[block:/g) ?? []).length !== 8) {
  fail('addition file must retain exactly eight [block] tags');
}
if (!additions.includes('NOT-YET-PUBLIC')) fail('addition file lost the unpublished status');
for (const marker of [
  '48-NON-DUPLICATE-SOURCES',
  '90 canonical source IDs',
  '144 Markdown-блока',
  '145 complete topology nodes',
] as const) {
  if (!index.includes(marker)) fail(`source-sweep index is missing marker: ${marker}`);
}

const essayIndex = read('src/data/essays/index.ts');
for (const forbidden of ['essay-yesenin-1895-1921', "slug: 'yesenin-1895-1921'"]) {
  if (essayIndex.includes(forbidden)) fail(`public essay registry must not contain ${forbidden}`);
}

const referencedClaimIds = new Set(topology.nodes.flatMap((node) => node.claimIds));
const referencedAcquisitionIds = new Set(topology.nodes.flatMap((node) => node.acquisitionSourceIds));
if (referencedClaimIds.size !== 27) fail(`expected all 27 claims represented, found ${referencedClaimIds.size}`);
if (referencedAcquisitionIds.size !== 7) {
  fail(`expected all seven acquisitions represented, found ${referencedAcquisitionIds.size}`);
}

const stableShape = topology.nodes.map((node) => ({
  blockId: node.blockId,
  origin: node.origin,
  sectionNumber: node.sectionNumber,
  claimIds: node.claimIds,
  sourceIds: node.sourceIds,
  overrideSourceIds: node.overrideSourceIds,
}));
const stableShapeSha256 = createHash('sha256')
  .update(JSON.stringify(stableShape))
  .digest('hex');

console.log(
  JSON.stringify(
    {
      prePass6Nodes: base.nodes.length,
      pass6ProseBlocks: topology.pass6BlockIds.size,
      markdownNodes: topology.nodes.filter((node) => node.origin === 'authoring-markdown').length,
      editorialOverrideNodes: editorialOverrides.length,
      completeTopologyNodes: topology.nodes.length,
      prePass6CanonicalSources: base.canonicalSourceIds.size,
      passFourSourceRecords: yeseninPartOneSourcesPassFour.length,
      sourcePackages: sourcePackagePaths.length,
      canonicalSourcesAfterPass6: topology.canonicalSourceIds.size,
      passFourSourceKindCounts: kindCounts,
      passFourSourcesReferencedInNewProse: referencedPassFourIds.size,
      pass6Sections: actualSections,
      declaredClaims: topology.claimIds.size,
      representedClaims: referencedClaimIds.size,
      declaredAcquisitions: topology.acquisitionSourceIds.size,
      representedAcquisitions: referencedAcquisitionIds.size,
      visualBriefs: new Set(visualBriefIds).size,
      stableShapeSha256,
      publicationAuthorized: false,
      productionImagesAdded: 0,
    },
    null,
    2,
  ),
);
