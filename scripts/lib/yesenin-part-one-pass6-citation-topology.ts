import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { yeseninPartOneSourcesPassFour } from '../../src/data/essays/yeseninPartOneSourcesPassFour';
import {
  loadYeseninPartOneCompleteCitationTopology,
  type YeseninPartOneCompleteCitationNode,
  type YeseninPartOneCompleteCitationTopology,
} from './yesenin-part-one-complete-citation-topology';

export const yeseninPartOnePass6AdditionPath =
  'research/yesenin/PART_ONE_DRAFT_SOURCE_SWEEP_PASS6_ADDITIONS.md';

export interface YeseninPartOnePass6CitationTopology
  extends Omit<YeseninPartOneCompleteCitationTopology, 'nodes' | 'canonicalSourceIds'> {
  nodes: YeseninPartOneCompleteCitationNode[];
  canonicalSourceIds: Set<string>;
  passFourSourceIds: Set<string>;
  pass6BlockIds: Set<string>;
}

const fail = (message: string): never => {
  throw new Error(`[yesenin-part-one-pass6-topology] ${message}`);
};

const read = (root: string, path: string) => readFileSync(resolve(root, path), 'utf8');

const parseTag = (paragraph: string, tag: 'block' | 'claims' | 'sources', label: string) => {
  const matches = [...paragraph.matchAll(new RegExp(`\\[${tag}:\\s*([^\\]]+)\\]`, 'g'))];
  if (matches.length !== 1) fail(`${label} must contain exactly one [${tag}] tag; found ${matches.length}`);
  return { value: matches[0][1].trim(), index: matches[0].index ?? -1 };
};

const splitTokens = (value: string, label: string) => {
  const tokens = value
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);
  if (tokens.length === 0) fail(`${label} must not be empty`);
  if (new Set(tokens).size !== tokens.length) fail(`${label} contains duplicate tokens`);
  return tokens;
};

const stripMetadataTail = (paragraph: string, label: string) => {
  const metadataTail = /\s*`?\[block:\s*[^\]]+\]\s*\[claims:\s*[^\]]+\]\s*\[sources:\s*[^\]]+\]\s*`?\s*$/;
  if (!metadataTail.test(paragraph)) {
    fail(`${label} must end with [block] [claims] [sources] metadata`);
  }
  const text = paragraph.replace(metadataTail, '').trim();
  if (!text) fail(`${label} has no authored prose before metadata`);
  return text;
};

export function loadYeseninPartOnePass6CitationTopology(
  root = process.cwd(),
): YeseninPartOnePass6CitationTopology {
  const base = loadYeseninPartOneCompleteCitationTopology(root);
  const passFourSourceIds = new Set(yeseninPartOneSourcesPassFour.map((source) => source.id));
  const canonicalSourceIds = new Set([...base.canonicalSourceIds, ...passFourSourceIds]);
  const pass6BlockIds = new Set<string>();
  const additions: YeseninPartOneCompleteCitationNode[] = [];
  const paragraphs = read(root, yeseninPartOnePass6AdditionPath).split(/\n\s*\n/);
  let currentSectionNumber: number | null = null;
  let currentSectionHeading = '';
  let currentSubsectionHeading: string | undefined;

  for (const [paragraphIndex, rawParagraph] of paragraphs.entries()) {
    const paragraph = rawParagraph.trim();
    if (!paragraph) continue;

    const section = paragraph.match(/^##\s+(\d+)\.\s+(.+)$/);
    if (section) {
      currentSectionNumber = Number(section[1]);
      currentSectionHeading = section[2].trim();
      currentSubsectionHeading = undefined;
      const canonicalHeading = base.sectionHeadings.get(currentSectionNumber);
      if (!canonicalHeading) fail(`addition file uses unknown section ${currentSectionNumber}`);
      if (canonicalHeading !== currentSectionHeading) {
        fail(
          `section ${currentSectionNumber} heading drifted: ${currentSectionHeading} / ${canonicalHeading}`,
        );
      }
      continue;
    }

    const subsection = paragraph.match(/^###\s+(.+)$/);
    if (subsection) {
      currentSubsectionHeading = subsection[1].trim();
      continue;
    }

    if (!paragraph.includes('[block:')) continue;
    const label = `${yeseninPartOnePass6AdditionPath} paragraph ${paragraphIndex + 1}`;
    if (currentSectionNumber == null || !currentSectionHeading) {
      fail(`${label} is not owned by a numbered section`);
    }

    const block = parseTag(paragraph, 'block', label);
    const claims = parseTag(paragraph, 'claims', label);
    const sources = parseTag(paragraph, 'sources', label);
    if (!(block.index < claims.index && claims.index < sources.index)) {
      fail(`${label} must keep metadata order [block] [claims] [sources]`);
    }
    if (!/^yesenin-p1-pass6-[a-z0-9-]+$/.test(block.value)) {
      fail(`${label} has invalid pass6 block ID ${block.value}`);
    }
    if (pass6BlockIds.has(block.value) || base.nodes.some((node) => node.blockId === block.value)) {
      fail(`${label} duplicates stable block ID ${block.value}`);
    }

    const claimIds: string[] = [];
    const editorialClaims: string[] = [];
    for (const claim of splitTokens(claims.value, `${label} claims`)) {
      if (/^YE1-\d{3}$/.test(claim)) {
        if (!base.claimIds.has(claim)) fail(`${label} references unknown claim ID ${claim}`);
        claimIds.push(claim);
      } else {
        if (!/^[\p{L}\p{N}][\p{L}\p{N} .:/()'’«»“”–—-]*$/u.test(claim)) {
          fail(`${label} has malformed editorial claim ${claim}`);
        }
        editorialClaims.push(claim);
      }
    }

    const sourceIds = splitTokens(sources.value, `${label} sources`);
    const canonical: string[] = [];
    const supplemental: string[] = [];
    const researchChecks: string[] = [];
    const witnesses: string[] = [];
    const acquisitions: string[] = [];
    for (const sourceId of sourceIds) {
      if (canonicalSourceIds.has(sourceId)) canonical.push(sourceId);
      else if (base.supplementalSourceIds.has(sourceId)) supplemental.push(sourceId);
      else if (base.researchCheckSourceIds.has(sourceId)) researchChecks.push(sourceId);
      else if (base.witnessSourceIds.has(sourceId)) witnesses.push(sourceId);
      else if (base.acquisitionSourceIds.has(sourceId)) acquisitions.push(sourceId);
      else fail(`${label} references unknown source ID ${sourceId}`);
    }
    if (!canonical.some((sourceId) => passFourSourceIds.has(sourceId))) {
      fail(`${label} must cite at least one pass-four source`);
    }
    if (researchChecks.length > 0) {
      fail(`${label} must not repurpose McVay research-check IDs outside the McVay prose layer`);
    }

    pass6BlockIds.add(block.value);
    additions.push({
      blockId: block.value,
      file: yeseninPartOnePass6AdditionPath,
      paragraphNumber: paragraphIndex + 1,
      sourceOrder: base.nodes.length + additions.length,
      sectionNumber: currentSectionNumber,
      sectionHeading: currentSectionHeading,
      subsectionHeading: currentSubsectionHeading,
      text: stripMetadataTail(paragraph, label),
      claimIds,
      editorialClaims,
      rawSourceIds: [...sourceIds],
      sourceIds: [...sourceIds],
      canonicalSourceIds: canonical,
      supplementalSourceIds: supplemental,
      researchCheckSourceIds: researchChecks,
      witnessSourceIds: witnesses,
      acquisitionSourceIds: acquisitions,
      legacySourceTokens: [],
      sourceCorrections: [],
      origin: 'authoring-markdown',
      overrideSourceIds: [],
    });
  }

  const nodes = [...base.nodes, ...additions].sort((left, right) =>
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
    canonicalSourceIds,
    passFourSourceIds,
    pass6BlockIds,
  };
}
