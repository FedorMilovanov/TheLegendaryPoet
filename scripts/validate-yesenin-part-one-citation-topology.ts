import { createHash } from 'node:crypto';
import { loadYeseninPartOneCitationTopology } from './lib/yesenin-part-one-citation-topology';

const fail = (message: string): never => {
  throw new Error(`[yesenin-part-one-topology] ${message}`);
};

const topology = loadYeseninPartOneCitationTopology();
const { nodes } = topology;

if (nodes.length < 128) {
  fail(`expected at least 128 typed citation nodes, found ${nodes.length}`);
}

const allowedLegacySourceTokens = new Set([
  'yeseninPartOneFebAcquisition',
  'PART_ONE_PAGE_WITNESS_LEDGER',
  'WIT-YE1-003',
  'WIT-YE1-004',
]);
const allowedCorrectionPatterns = [
  /^yeseninPartOneFebAcquisition=>feb-ye1-/,
  /^PART_ONE_PAGE_WITNESS_LEDGER=>WIT-YE1-002$/,
  /^WIT-YE1-003=>WIT-YE1-002$/,
  /^WIT-YE1-004=>WIT-YE1-003$/,
];

const blockIds = new Set<string>();
for (const node of nodes) {
  if (!/^yesenin-p1-[a-z0-9-]+$/.test(node.blockId)) {
    fail(`invalid stable block ID ${node.blockId}`);
  }
  if (blockIds.has(node.blockId)) fail(`duplicate stable block ID ${node.blockId}`);
  blockIds.add(node.blockId);

  if (node.sourceIds.length === 0) fail(`${node.blockId} has no typed source IDs`);
  if (node.claimIds.length === 0 && node.editorialClaims.length === 0) {
    fail(`${node.blockId} has no claim classification`);
  }
  if (node.legacySourceTokens.length !== node.sourceCorrections.length) {
    fail(`${node.blockId} must record one correction for each legacy source token`);
  }
  for (const token of node.legacySourceTokens) {
    if (!allowedLegacySourceTokens.has(token)) {
      fail(`${node.blockId} contains unexpected legacy source token ${token}`);
    }
  }
  for (const correction of node.sourceCorrections) {
    if (!allowedCorrectionPatterns.some((pattern) => pattern.test(correction))) {
      fail(`${node.blockId} contains unexpected source correction ${correction}`);
    }
  }
}

const expectedSections = Array.from({ length: 12 }, (_, index) => index + 1);
const numberedSections = new Set(nodes.map((node) => node.sectionNumber).filter((value) => value > 0));
for (const section of expectedSections) {
  if (!numberedSections.has(section)) fail(`typed topology is missing section ${section}`);
  const sectionNodes = nodes.filter((node) => node.sectionNumber === section);
  if (sectionNodes.length === 0) fail(`typed topology section ${section} contains no nodes`);
}
if (!nodes.some((node) => node.sectionNumber === 0)) fail('typed topology is missing lead nodes');

const referencedCanonicalSourceIds = new Set(nodes.flatMap((node) => node.canonicalSourceIds));
const referencedSupplementalSourceIds = new Set(nodes.flatMap((node) => node.supplementalSourceIds));
const referencedWitnessSourceIds = new Set(nodes.flatMap((node) => node.witnessSourceIds));
const referencedAcquisitionSourceIds = new Set(nodes.flatMap((node) => node.acquisitionSourceIds));
const referencedClaimIds = new Set(nodes.flatMap((node) => node.claimIds));
const editorialClaimLabels = new Set(nodes.flatMap((node) => node.editorialClaims));
const legacySourceTokens = new Set(nodes.flatMap((node) => node.legacySourceTokens));
const sourceCorrections = new Set(nodes.flatMap((node) => node.sourceCorrections));

if (referencedCanonicalSourceIds.size < 37) {
  fail(`expected at least 37 canonical source IDs in topology, found ${referencedCanonicalSourceIds.size}`);
}
if (referencedSupplementalSourceIds.size !== 10) {
  fail(`expected all 10 supplemental source IDs in topology, found ${referencedSupplementalSourceIds.size}`);
}
if (referencedAcquisitionSourceIds.size < 6) {
  fail(`expected at least six exact FEB acquisition IDs in topology, found ${referencedAcquisitionSourceIds.size}`);
}

const stableShape = nodes.map((node) => ({
  blockId: node.blockId,
  sectionNumber: node.sectionNumber,
  claimIds: node.claimIds,
  editorialClaims: node.editorialClaims,
  rawSourceIds: node.rawSourceIds,
  sourceIds: node.sourceIds,
  acquisitionSourceIds: node.acquisitionSourceIds,
  legacySourceTokens: node.legacySourceTokens,
  sourceCorrections: node.sourceCorrections,
}));
const digest = createHash('sha256').update(JSON.stringify(stableShape)).digest('hex');

const sectionCoverage = expectedSections.map((sectionNumber) => {
  const sectionNodes = nodes.filter((node) => node.sectionNumber === sectionNumber);
  return {
    sectionNumber,
    heading: topology.sectionHeadings.get(sectionNumber),
    blocks: sectionNodes.length,
    canonicalSources: new Set(sectionNodes.flatMap((node) => node.canonicalSourceIds)).size,
    supplementalSources: new Set(sectionNodes.flatMap((node) => node.supplementalSourceIds)).size,
    witnesses: new Set(sectionNodes.flatMap((node) => node.witnessSourceIds)).size,
    acquisitions: new Set(sectionNodes.flatMap((node) => node.acquisitionSourceIds)).size,
  };
});

console.log(
  JSON.stringify(
    {
      typedCitationNodes: nodes.length,
      stableBlockIds: blockIds.size,
      leadBlocks: nodes.filter((node) => node.sectionNumber === 0).length,
      numberedSections: numberedSections.size,
      declaredCanonicalSourceIds: topology.canonicalSourceIds.size,
      referencedCanonicalSourceIds: referencedCanonicalSourceIds.size,
      declaredSupplementalSourceIds: topology.supplementalSourceIds.size,
      referencedSupplementalSourceIds: referencedSupplementalSourceIds.size,
      declaredWitnessSourceIds: topology.witnessSourceIds.size,
      referencedWitnessSourceIds: referencedWitnessSourceIds.size,
      declaredAcquisitionSourceIds: topology.acquisitionSourceIds.size,
      referencedAcquisitionSourceIds: referencedAcquisitionSourceIds.size,
      declaredClaimIds: topology.claimIds.size,
      referencedClaimIds: referencedClaimIds.size,
      editorialClaimLabels: [...editorialClaimLabels].sort(),
      legacySourceTokens: [...legacySourceTokens].sort(),
      sourceCorrections: [...sourceCorrections].sort(),
      stableShapeSha256: digest,
      sectionCoverage,
      publicationAuthorized: false,
    },
    null,
    2,
  ),
);
