import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { yeseninPartOneFebAcquiredRecords } from '../../src/data/essays/yeseninPartOneFebAcquisition';

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
const mcvayPath = 'research/yesenin/PART_ONE_MCVAY_DUNCAN_VERIFICATION_PASS5_2026-07-24.md';
const witnessPath = 'research/yesenin/PART_ONE_PAGE_WITNESS_LEDGER.md';
const claimLedgerPath = 'research/yesenin/part-one-claim-ledger-pass1.md';
const userMcVaySourceId = 'USR-YE1-MCVAY-ISADORA-ESENIN-1980';

const trainAcquisitionIds = yeseninPartOneFebAcquiredRecords
  .filter((record) => record.id.startsWith('feb-ye1-train-'))
  .map((record) => record.id);
const sirenaCoverAcquisitionId = 'feb-ye1-sirena-cover-621';

const witnessClaimSupport = new Map<string, ReadonlySet<string>>([
  ['WIT-YE1-001', new Set(['YE1-001', 'YE1-004', 'YE1-005'])],
  ['WIT-YE1-002', new Set(['YE1-016', 'YE1-018', 'YE1-019'])],
  ['WIT-YE1-003', new Set(['YE1-023'])],
  ['WIT-YE1-004', new Set(['YE1-020'])],
  ['WIT-YE1-005', new Set(['YE1-022'])],
]);

export type YeseninPartOneSourceLayer =
  | 'canonical'
  | 'supplemental'
  | 'research-check'
  | 'witness'
  | 'acquisition';

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
  rawSourceIds: string[];
  sourceIds: string[];
  canonicalSourceIds: string[];
  supplementalSourceIds: string[];
  researchCheckSourceIds: string[];
  witnessSourceIds: string[];
  acquisitionSourceIds: string[];
  legacySourceTokens: string[];
  sourceCorrections: string[];
}

export interface YeseninPartOneCitationTopology {
  nodes: YeseninPartOneCitationNode[];
  canonicalSourceIds: Set<string>;
  supplementalSourceIds: Set<string>;
  researchCheckSourceIds: Set<string>;
  witnessSourceIds: Set<string>;
  acquisitionSourceIds: Set<string>;
  claimIds: Set<string>;
  sectionHeadings: Map<number, string>;
}

interface SourceResolution {
  ids: readonly string[];
  correction?: string;
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

const expandClaimToken = (claim: string, claimIds: Set<string>, label: string) => {
  if (/^YE1-\d{3}$/.test(claim)) {
    if (!claimIds.has(claim)) fail(`${label} references unknown claim ID ${claim}`);
    return [claim];
  }

  const range = claim.match(/^YE1-(\d{3})[–—-]YE1-(\d{3})$/);
  if (!range) return null;

  const start = Number(range[1]);
  const end = Number(range[2]);
  if (end < start) fail(`${label} has reversed claim range ${claim}`);
  if (end - start > 50) fail(`${label} has implausibly wide claim range ${claim}`);

  return Array.from({ length: end - start + 1 }, (_, offset) => {
    const id = `YE1-${String(start + offset).padStart(3, '0')}`;
    if (!claimIds.has(id)) fail(`${label} range ${claim} expands to unknown claim ID ${id}`);
    return id;
  });
};

const resolveSourceToken = (
  rawSourceId: string,
  sectionNumber: number,
  claimIds: readonly string[],
  label: string,
): SourceResolution => {
  const hasClaim = (claimId: string) => claimIds.includes(claimId);

  if (rawSourceId === 'yeseninPartOneFebAcquisition') {
    if (sectionNumber === 8 || hasClaim('YE1-016')) {
      return {
        ids: trainAcquisitionIds,
        correction: `${rawSourceId}=>${trainAcquisitionIds.join('+')}`,
      };
    }
    if (sectionNumber === 11 || hasClaim('YE1-023')) {
      return {
        ids: [sirenaCoverAcquisitionId],
        correction: `${rawSourceId}=>${sirenaCoverAcquisitionId}`,
      };
    }
    fail(`${label} uses ${rawSourceId} outside a supported train or imagist context`);
  }

  if (rawSourceId === 'PART_ONE_PAGE_WITNESS_LEDGER') {
    if (sectionNumber !== 8) {
      fail(`${label} uses ${rawSourceId} outside the train section`);
    }
    return {
      ids: ['WIT-YE1-002'],
      correction: `${rawSourceId}=>WIT-YE1-002`,
    };
  }

  if (rawSourceId === 'WIT-YE1-003' && sectionNumber === 8) {
    return {
      ids: ['WIT-YE1-002'],
      correction: 'WIT-YE1-003=>WIT-YE1-002',
    };
  }

  if (rawSourceId === 'WIT-YE1-004' && (sectionNumber === 11 || hasClaim('YE1-023'))) {
    return {
      ids: ['WIT-YE1-003'],
      correction: 'WIT-YE1-004=>WIT-YE1-003',
    };
  }

  return { ids: [rawSourceId] };
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
  const mcvayText = read(root, mcvayPath);
  const mcvayControlIds = Array.from(
    { length: 44 },
    (_, index) => `MCVAY-P5-${String(index + 1).padStart(3, '0')}`,
  );
  const researchCheckSourceIds = new Set([userMcVaySourceId, ...mcvayControlIds]);
  const witnessSourceIds = new Set(
    [...read(root, witnessPath).matchAll(/^##\s+(WIT-YE1-\d{3})\b/gm)].map((match) => match[1]),
  );
  const acquisitionSourceIds = new Set(yeseninPartOneFebAcquiredRecords.map((record) => record.id));
  const acquisitionClaimSupport = new Map(
    yeseninPartOneFebAcquiredRecords.map((record) => [record.id, new Set(record.claimIds)] as const),
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
  if (researchCheckSourceIds.size !== 45) {
    fail(`expected 45 McVay research-check IDs, found ${researchCheckSourceIds.size}`);
  }
  const mcvayRows = [...mcvayText.matchAll(/^\|\s*(\d+)\s*\|/gm)].map((match) => Number(match[1]));
  if (mcvayRows.length !== 44 || mcvayRows.some((value, index) => value !== index + 1)) {
    fail('McVay research-check ledger must retain continuous rows 1 through 44');
  }
  if (!mcvayText.includes(userMcVaySourceId)) {
    fail(`McVay research ledger is missing user source ID ${userMcVaySourceId}`);
  }
  if (witnessSourceIds.size !== 5) {
    fail(`expected five WIT-YE1 witness records, found ${witnessSourceIds.size}`);
  }
  if (acquisitionSourceIds.size !== 7) {
    fail(`expected seven acquired FEB records, found ${acquisitionSourceIds.size}`);
  }
  if (trainAcquisitionIds.length !== 5) {
    fail(`expected five acquired train records for the legacy bundle, found ${trainAcquisitionIds.length}`);
  }
  if (!acquisitionSourceIds.has(sirenaCoverAcquisitionId)) {
    fail(`missing acquired Sirena cover record ${sirenaCoverAcquisitionId}`);
  }
  if (claimIds.size === 0) fail('claim ledger contains no YE1 claim IDs');

  const sectionHeadings = new Map<number, string>();
  const nodes: YeseninPartOneCitationNode[] = [];
  const sourceErrors: string[] = [];
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
      const rawSourceIds = splitTokens(sources.value, `${label} sources`);
      const nodeClaimIds: string[] = [];
      const editorialClaims: string[] = [];
      const seenClaimIds = new Set<string>();

      for (const claim of claimTokens) {
        const expanded = expandClaimToken(claim, claimIds, label);
        if (expanded) {
          for (const id of expanded) {
            if (seenClaimIds.has(id)) fail(`${label} resolves duplicate claim ID ${id}`);
            seenClaimIds.add(id);
            nodeClaimIds.push(id);
          }
          continue;
        }

        if (!/^[\p{L}\p{N}][\p{L}\p{N} .:/()'’«»“”–—-]*$/u.test(claim)) {
          fail(`${label} has malformed editorial claim label ${claim}`);
        }
        editorialClaims.push(claim);
      }

      const sourceIds: string[] = [];
      const legacySourceTokens: string[] = [];
      const sourceCorrections: string[] = [];
      for (const rawSourceId of rawSourceIds) {
        const resolution = resolveSourceToken(
          rawSourceId,
          currentSectionNumber,
          nodeClaimIds,
          label,
        );
        if (resolution.correction) {
          legacySourceTokens.push(rawSourceId);
          sourceCorrections.push(resolution.correction);
        }
        for (const normalizedSourceId of resolution.ids) {
          if (!sourceIds.includes(normalizedSourceId)) sourceIds.push(normalizedSourceId);
        }
      }

      const canonical: string[] = [];
      const supplemental: string[] = [];
      const researchChecks: string[] = [];
      const witnesses: string[] = [];
      const acquisitions: string[] = [];
      for (const sourceId of sourceIds) {
        if (canonicalSourceIds.has(sourceId)) canonical.push(sourceId);
        else if (supplementalSourceIds.has(sourceId)) supplemental.push(sourceId);
        else if (researchCheckSourceIds.has(sourceId)) researchChecks.push(sourceId);
        else if (witnessSourceIds.has(sourceId)) witnesses.push(sourceId);
        else if (acquisitionSourceIds.has(sourceId)) acquisitions.push(sourceId);
        else sourceErrors.push(`${label} references unknown source ID ${sourceId}`);
      }

      if (researchChecks.length > 0 && currentSectionNumber !== 12) {
        sourceErrors.push(`${label} uses McVay research checks outside section 12`);
      }
      if (researchChecks.length > 0 && !nodeClaimIds.includes('YE1-027')) {
        sourceErrors.push(`${label} uses McVay research checks without claim YE1-027`);
      }

      for (const witnessId of witnesses) {
        const supportedClaims = witnessClaimSupport.get(witnessId);
        if (!supportedClaims) {
          sourceErrors.push(`${label} has no semantic claim map for witness ${witnessId}`);
          continue;
        }
        if (nodeClaimIds.length > 0 && !nodeClaimIds.some((claimId) => supportedClaims.has(claimId))) {
          sourceErrors.push(
            `${label} cites ${witnessId} for incompatible claims ${nodeClaimIds.join(', ')}`,
          );
        }
      }

      for (const acquisitionId of acquisitions) {
        const supportedClaims = acquisitionClaimSupport.get(acquisitionId);
        if (
          supportedClaims &&
          nodeClaimIds.length > 0 &&
          !nodeClaimIds.some((claimId) => supportedClaims.has(claimId))
        ) {
          sourceErrors.push(
            `${label} cites ${acquisitionId} for incompatible claims ${nodeClaimIds.join(', ')}`,
          );
        }
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
        rawSourceIds,
        sourceIds,
        canonicalSourceIds: canonical,
        supplementalSourceIds: supplemental,
        researchCheckSourceIds: researchChecks,
        witnessSourceIds: witnesses,
        acquisitionSourceIds: acquisitions,
        legacySourceTokens,
        sourceCorrections,
      });
    }
  }

  if (sourceErrors.length > 0) {
    fail(`source topology has ${sourceErrors.length} error(s):\n- ${sourceErrors.join('\n- ')}`);
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
    researchCheckSourceIds,
    witnessSourceIds,
    acquisitionSourceIds,
    claimIds,
    sectionHeadings,
  };
}
