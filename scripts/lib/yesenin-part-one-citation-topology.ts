import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const yeseninPartOneDraftPaths = [
  'research/yesenin/PART_ONE_DRAFT_1895_1921.md',
  'research/yesenin/PART_ONE_DRAFT_CONTINUATION_1916_1920.md',
  'research/yesenin/PART_ONE_DRAFT_FINAL_SECTIONS_1917_1921.md',
] as const;

const sourcePaths = [
  'src/data/essays/yeseninPartOneSources.ts',
  'src/data/essays/yeseninPartOneSourcesPassTwo.ts',
  'src/data/essays/yeseninPartOneSourcesPassThree.ts',
] as const;

const supplementPath = 'research/yesenin/PART_ONE_TARGETED_WEB_SUPPLEMENT_2026-07-24.md';
const witnessPath = 'research/yesenin/PART_ONE_PAGE_WITNESS_LEDGER.md';
const claimLedgerPath = 'research/yesenin/part-one-claim-ledger-pass1.md';

export type YeseninPartOneSourceLayer = 'canonical' | 'supplemental' | 'witness';

export interface YeseninPartOneCitationNode {
  blockId: string;
  file: (typeof yeseninPartOneDraftPaths)[number];
  paragraphNumber: number;
  sourceOrder: number;
  sectionNumber: number;
  sectionHeading: string;
  subsectionHeading?: string;
  text: string;
  claimIds: string[];
  editorialClaims: string[];
  sourceIds: string[];
  canonicalSourceIds: string[];
  supplementalSourceIds: string[];
  witnessSourceIds: string[];
}

export interface YeseninPartOneCitationTopology {
  nodes: YeseninPartOneCitationNode[];
  canonicalSourceIds: Set<string>;
  supplementalSourceIds: Set<string>;
  witnessSourceIds: Set<string>;
  claimIds: Set<string>;
  sectionHeadings: Map<number, string>;
}

const fail = (message: string): never => {
  throw new Error(`[yesenin-part-one-topology] ${message}`);
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

const parseSectionHeading = (paragraph: string) => {
  const numbered = paragraph.match(/^##\s+(\d+)\.\s+(.+)$/);
  if (numbered) return { number: Number(numbered[1]), heading: numbered[2].trim() };
  const lead = paragraph.match(/^##\s+Лид(?:\.|:)?\s*(.*)$/i);
  if (lead) return { number: 0, heading: lead[1].trim() || 'Лид' };
  return null;
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

export function loadYeseninPartOneCitationTopology(
  root = process.cwd(),
): YeseninPartOneCitationTopology {
  const sourceModules = sourcePaths.map((path) => read(root, path)).join('\n');
  const canonicalSourceIds = new Set(
    [...sourceModules.matchAll(/\bid:\s*'([^']+)'/g)].map((match) => match[1]),
  );
  const supplementalSourceIds = new Set(
    [...read(root, supplementPath).matchAll(/^\|\s*`(SUP-YE1-\d{3})`\s*\|/gm)].map(
      (match) => match[1],
    ),
  );
  const witnessSourceIds = new Set(
    [...read(root, witnessPath).matchAll(/^##\s+(WIT-YE1-\d{3})\b/gm)].map((match) => match[1]),
  );
  const claimIds = new Set(
    [...read(root, claimLedgerPath).matchAll(/^\|\s*(YE1-\d{3})\s*\|/gm)].map(
      (match) => match[1],
    ),
  );

  if (canonicalSourceIds.size !== 42) {
    fail(`expected 42 canonical source IDs, found ${canonicalSourceIds.size}`);
  }
  if (supplementalSourceIds.size !== 10) {
    fail(`expected 10 supplemental source IDs, found ${supplementalSourceIds.size}`);
  }
  if (witnessSourceIds.size === 0) fail('page-witness registry contains no WIT-YE1 IDs');
  if (claimIds.size === 0) fail('claim ledger contains no YE1 claim IDs');

  const sectionHeadings = new Map<number, string>();
  const nodes: YeseninPartOneCitationNode[] = [];
  let sourceOrder = 0;

  for (const path of yeseninPartOneDraftPaths) {
    const paragraphs = read(root, path).split(/\n\s*\n/);
    let currentSectionNumber: number | null = null;
    let currentSectionHeading = '';
    let currentSubsectionHeading: string | undefined;

    for (const [paragraphIndex, rawParagraph] of paragraphs.entries()) {
      const paragraph = rawParagraph.trim();
      if (!paragraph) continue;

      const section = parseSectionHeading(paragraph);
      if (section) {
        currentSectionNumber = section.number;
        currentSectionHeading = section.heading;
        currentSubsectionHeading = undefined;
        const previous = sectionHeadings.get(section.number);
        if (previous && previous !== section.heading) {
          fail(`section ${section.number} has conflicting headings: ${previous} / ${section.heading}`);
        }
        sectionHeadings.set(section.number, section.heading);
        continue;
      }

      const subsection = paragraph.match(/^###\s+(.+)$/);
      if (subsection) {
        currentSubsectionHeading = subsection[1].trim();
        continue;
      }

      if (!paragraph.includes('[block:')) continue;
      const label = `${path} paragraph ${paragraphIndex + 1}`;
      if (currentSectionNumber == null || !currentSectionHeading) {
        fail(`${label} is not owned by a lead or numbered section`);
      }

      const block = parseTag(paragraph, 'block', label);
      const claims = parseTag(paragraph, 'claims', label);
      const sources = parseTag(paragraph, 'sources', label);
      if (!(block.index < claims.index && claims.index < sources.index)) {
        fail(`${label} must keep metadata order [block] [claims] [sources]`);
      }

      const claimTokens = splitTokens(claims.value, `${label} claims`);
      const sourceTokens = splitTokens(sources.value, `${label} sources`);
      const nodeClaimIds: string[] = [];
      const editorialClaims: string[] = [];

      for (const claim of claimTokens) {
        if (/^YE1-\d{3}$/.test(claim)) {
          if (!claimIds.has(claim)) fail(`${label} references unknown claim ID ${claim}`);
          nodeClaimIds.push(claim);
        } else {
          if (!/^[\p{L}\p{N}][\p{L}\p{N} .:/()'’«»“”–—-]*$/u.test(claim)) {
            fail(`${label} has malformed editorial claim label ${claim}`);
          }
          editorialClaims.push(claim);
        }
      }

      const canonical: string[] = [];
      const supplemental: string[] = [];
      const witnesses: string[] = [];
      for (const sourceId of sourceTokens) {
        if (canonicalSourceIds.has(sourceId)) canonical.push(sourceId);
        else if (supplementalSourceIds.has(sourceId)) supplemental.push(sourceId);
        else if (witnessSourceIds.has(sourceId)) witnesses.push(sourceId);
        else fail(`${label} references unknown source ID ${sourceId}`);
      }

      nodes.push({
        blockId: block.value,
        file: path,
        paragraphNumber: paragraphIndex + 1,
        sourceOrder: sourceOrder++,
        sectionNumber: currentSectionNumber,
        sectionHeading: currentSectionHeading,
        subsectionHeading: currentSubsectionHeading,
        text: stripMetadataTail(paragraph, label),
        claimIds: nodeClaimIds,
        editorialClaims,
        sourceIds: sourceTokens,
        canonicalSourceIds: canonical,
        supplementalSourceIds: supplemental,
        witnessSourceIds: witnesses,
      });
    }
  }

  nodes.sort((left, right) =>
    left.sectionNumber === right.sectionNumber
      ? left.sourceOrder - right.sourceOrder
      : left.sectionNumber - right.sectionNumber,
  );

  return {
    nodes,
    canonicalSourceIds,
    supplementalSourceIds,
    witnessSourceIds,
    claimIds,
    sectionHeadings,
  };
}
