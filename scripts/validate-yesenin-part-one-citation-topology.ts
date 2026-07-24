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
  if (node.legacySourceTokens.length > 1) {
    fail(`${node.blockId} contains more than one legacy source token`);
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
const referencedClaimIds = new Set(nodes.flatMap((node) => node.claimIds));
const editorialClaimLabels = new Set(nodes.flatMap((node) => node.editorialClaims));
const legacySourceTokens = new Set(nodes.flatMap((node) => node.legacySourceTokens));

if (referencedCanonicalSourceIds.size < 37) {
  fail(`expected at least 37 canonical source IDs in topology, found ${referencedCanonicalSourceIds.size}`);
}
if (referencedSupplementalSourceIds.size !== 10) {
  fail(`expected all 10 supplemental source IDs in topology, found ${referencedSupplementalSourceIds.size}`);
}
for (const token of legacySourceTokens) {
  if (token !== 'yeseninPartOneFebAcquisition') {
    fail(`unexpected legacy source token ${token}`);
  }
}

const stableShape = nodes.map((node) => ({
  blockId: node.blockId,
  sectionNumber: node.sectionNumber,
  claimIds: node.claimIds,
  editorialClaims: node.editorialClaims,
  rawSourceIds: node.rawSourceIds,
  sourceIds: node.sourceIds,
  legacySourceTokens: node.legacySourceTokens,
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
      declaredClaimIds: topology.claimIds.size,
      referencedClaimIds: referencedClaimIds.size,
      editorialClaimLabels: [...editorialClaimLabels].sort(),
      legacySourceTokens: [...legacySourceTokens].sort(),
      stableShapeSha256: digest,
      sectionCoverage,
      publicationAuthorized: false,
    },
    null,
    2,
  ),
);
