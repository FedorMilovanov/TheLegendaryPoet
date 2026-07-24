import { yeseninPartOneFebAcquiredRecords } from '../../src/data/essays/yeseninPartOneFebAcquisition';
import {
  yeseninPartOneTopologyInsertions,
  yeseninPartOneTopologySourceAugmentations,
} from '../../src/data/essays/yeseninPartOneTopologyOverrides';
import {
  loadYeseninPartOneCitationTopology,
  type YeseninPartOneCitationNode,
  type YeseninPartOneCitationTopology,
} from './yesenin-part-one-citation-topology';

export type YeseninPartOneTopologyOrigin = 'authoring-markdown' | 'editorial-override';

export interface YeseninPartOneCompleteCitationNode
  extends Omit<YeseninPartOneCitationNode, 'file'> {
  file: string;
  origin: YeseninPartOneTopologyOrigin;
  overrideSourceIds: string[];
}

export interface YeseninPartOneCompleteCitationTopology
  extends Omit<YeseninPartOneCitationTopology, 'nodes'> {
  nodes: YeseninPartOneCompleteCitationNode[];
}

const overridePath = 'src/data/essays/yeseninPartOneTopologyOverrides.ts';

const fail = (message: string): never => {
  throw new Error(`[yesenin-part-one-complete-topology] ${message}`);
};

export function loadYeseninPartOneCompleteCitationTopology(
  root = process.cwd(),
): YeseninPartOneCompleteCitationTopology {
  const base = loadYeseninPartOneCitationTopology(root);
  const acquisitionClaimSupport = new Map(
    yeseninPartOneFebAcquiredRecords.map((record) => [record.id, new Set(record.claimIds)] as const),
  );
  const nodes: YeseninPartOneCompleteCitationNode[] = base.nodes.map((node) => ({
    ...node,
    file: node.file,
    origin: 'authoring-markdown',
    overrideSourceIds: [],
  }));

  for (const augmentation of yeseninPartOneTopologySourceAugmentations) {
    const node = nodes.find((candidate) => candidate.blockId === augmentation.blockId);
    if (!node) fail(`source augmentation targets unknown block ${augmentation.blockId}`);

    for (const sourceId of augmentation.sourceIds) {
      if (!base.acquisitionSourceIds.has(sourceId)) {
        fail(`source augmentation ${augmentation.blockId} references non-acquisition ID ${sourceId}`);
      }
      const supportedClaims = acquisitionClaimSupport.get(sourceId);
      if (
        supportedClaims &&
        node.claimIds.length > 0 &&
        !node.claimIds.some((claimId) => supportedClaims.has(claimId))
      ) {
        fail(
          `source augmentation ${sourceId} is incompatible with ${augmentation.blockId} claims ${node.claimIds.join(', ')}`,
        );
      }
      if (!node.sourceIds.includes(sourceId)) node.sourceIds.push(sourceId);
      if (!node.acquisitionSourceIds.includes(sourceId)) node.acquisitionSourceIds.push(sourceId);
      if (!node.overrideSourceIds.includes(sourceId)) node.overrideSourceIds.push(sourceId);
    }
  }

  for (const [insertionIndex, insertion] of yeseninPartOneTopologyInsertions.entries()) {
    if (nodes.some((node) => node.blockId === insertion.blockId)) {
      fail(`editorial insertion duplicates block ID ${insertion.blockId}`);
    }
    const afterIndex = nodes.findIndex((node) => node.blockId === insertion.afterBlockId);
    if (afterIndex === -1) fail(`editorial insertion target ${insertion.afterBlockId} does not exist`);

    for (const claimId of insertion.claimIds) {
      if (!base.claimIds.has(claimId)) {
        fail(`editorial insertion ${insertion.blockId} references unknown claim ID ${claimId}`);
      }
    }

    const canonicalSourceIds: string[] = [];
    const supplementalSourceIds: string[] = [];
    const witnessSourceIds: string[] = [];
    const acquisitionSourceIds: string[] = [];
    for (const sourceId of insertion.sourceIds) {
      if (base.canonicalSourceIds.has(sourceId)) canonicalSourceIds.push(sourceId);
      else if (base.supplementalSourceIds.has(sourceId)) supplementalSourceIds.push(sourceId);
      else if (base.witnessSourceIds.has(sourceId)) witnessSourceIds.push(sourceId);
      else if (base.acquisitionSourceIds.has(sourceId)) acquisitionSourceIds.push(sourceId);
      else fail(`editorial insertion ${insertion.blockId} references unknown source ID ${sourceId}`);
    }

    const anchor = nodes[afterIndex];
    if (anchor.sectionNumber !== insertion.sectionNumber) {
      fail(
        `editorial insertion ${insertion.blockId} section ${insertion.sectionNumber} does not match anchor section ${anchor.sectionNumber}`,
      );
    }

    const node: YeseninPartOneCompleteCitationNode = {
      blockId: insertion.blockId,
      file: overridePath,
      paragraphNumber: insertionIndex + 1,
      sourceOrder: anchor.sourceOrder + 0.5,
      sectionNumber: insertion.sectionNumber,
      sectionHeading: insertion.sectionHeading,
      subsectionHeading: insertion.subsectionHeading,
      text: insertion.text,
      claimIds: [...insertion.claimIds],
      editorialClaims: [...insertion.editorialClaims],
      rawSourceIds: [...insertion.sourceIds],
      sourceIds: [...insertion.sourceIds],
      canonicalSourceIds,
      supplementalSourceIds,
      witnessSourceIds,
      acquisitionSourceIds,
      legacySourceTokens: [],
      sourceCorrections: [],
      origin: 'editorial-override',
      overrideSourceIds: [...insertion.sourceIds],
    };
    nodes.splice(afterIndex + 1, 0, node);
  }

  nodes.sort((left, right) =>
    left.sectionNumber === right.sectionNumber
      ? left.sourceOrder - right.sourceOrder
      : left.sectionNumber - right.sectionNumber,
  );
  nodes.forEach((node, index) => {
    node.sourceOrder = index;
  });

  return {
    ...base,
    nodes,
  };
}
