import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadYeseninPartOnePass6CitationTopology } from './lib/yesenin-part-one-pass6-citation-topology';
import { yeseninPartOneEditorialPassEightEarlyA } from '../src/data/essays/yeseninPartOneEditorialPassEightEarlyA';
import { yeseninPartOneEditorialPassEightEarlyB } from '../src/data/essays/yeseninPartOneEditorialPassEightEarlyB';

const fail = (message: string): never => {
  throw new Error(`[yesenin-part-one-pass8-inventory] ${message}`);
};

const root = process.cwd();
const topology = loadYeseninPartOnePass6CitationTopology(root);
const earlyNodes = topology.nodes.filter((node) => node.sectionNumber >= 0 && node.sectionNumber <= 8);
const lateNodes = topology.nodes.filter((node) => node.sectionNumber >= 9 && node.sectionNumber <= 12);
const passEight = {
  ...yeseninPartOneEditorialPassEightEarlyA,
  ...yeseninPartOneEditorialPassEightEarlyB,
} as const satisfies Readonly<Record<string, string>>;
const passEightEntries = Object.entries(passEight);

if (topology.nodes.length !== 146) fail(`expected 146 total nodes, found ${topology.nodes.length}`);
if (earlyNodes.length !== 75) fail(`expected 75 lead/section-1-8 nodes, found ${earlyNodes.length}`);
if (lateNodes.length !== 71) fail(`expected 71 section-9-12 nodes, found ${lateNodes.length}`);
if (passEightEntries.length !== 75) fail(`expected 75 pass-eight overrides, found ${passEightEntries.length}`);

const sectionCounts = new Map<number, number>();
for (const node of earlyNodes) {
  sectionCounts.set(node.sectionNumber, (sectionCounts.get(node.sectionNumber) ?? 0) + 1);
}

const expectedSections = Array.from({ length: 9 }, (_, index) => index);
for (const sectionNumber of expectedSections) {
  if (!sectionCounts.has(sectionNumber)) fail(`early inventory is missing section ${sectionNumber}`);
}

const duplicateIds = earlyNodes
  .map((node) => node.blockId)
  .filter((blockId, index, all) => all.indexOf(blockId) !== index);
if (duplicateIds.length > 0) fail(`duplicate early block IDs: ${duplicateIds.join(', ')}`);

const earlyIds = new Set(earlyNodes.map((node) => node.blockId));
for (const [blockId] of passEightEntries) {
  if (!earlyIds.has(blockId)) fail(`pass-eight override targets unknown early block ${blockId}`);
}
for (const blockId of earlyIds) {
  if (!(blockId in passEight)) fail(`early inventory lacks reviewed text for ${blockId}`);
}

const records = earlyNodes.map((node) => ({
  sourceOrder: node.sourceOrder,
  sectionNumber: node.sectionNumber,
  sectionHeading: node.sectionHeading,
  subsectionHeading: node.subsectionHeading ?? null,
  blockId: node.blockId,
  origin: node.origin,
  file: node.file,
  paragraphNumber: node.paragraphNumber,
  sourceText: node.text,
  reviewedText: passEight[node.blockId as keyof typeof passEight],
  claimIds: node.claimIds,
  editorialClaims: node.editorialClaims,
  canonicalSourceIds: node.canonicalSourceIds,
  supplementalSourceIds: node.supplementalSourceIds,
  researchCheckSourceIds: node.researchCheckSourceIds,
  witnessSourceIds: node.witnessSourceIds,
  acquisitionSourceIds: node.acquisitionSourceIds,
  sourceCorrections: node.sourceCorrections,
}));

const outputDir = resolve(root, 'artifacts/yesenin-part-one-pass8');
mkdirSync(outputDir, { recursive: true });
const passEightDigest = createHash('sha256').update(JSON.stringify(passEightEntries)).digest('hex');

const report = {
  status: 'EARLY-HALF-INVENTORIED / 75-OF-75-EDITED / WHOLE-ARTICLE-SENTENCE-EDIT-COMPLETE / UNPUBLISHED',
  topologySha256: '49354adab3d14bbe03ca48b3fb6c4f1795601d7101c82694a5f7fa5cfec1b838',
  passEightSha256: passEightDigest,
  totalTopologyNodes: topology.nodes.length,
  earlyNodes: earlyNodes.length,
  lateNodes: lateNodes.length,
  sectionCounts: Object.fromEntries([...sectionCounts.entries()].sort(([left], [right]) => left - right)),
  records,
};

writeFileSync(resolve(outputDir, 'early-editorial-inventory.json'), `${JSON.stringify(report, null, 2)}\n`);

const markdown = [
  '# Сергей Есенин, часть I — editorial pass 8 inventory',
  '',
  'Статус: `75/75 EARLY-NODES-EDITED / 71/71 LATE-NODES-PRESERVED / 146/146 SENTENCE-EDITED / UNPUBLISHED / UNREGISTERED / MEDIA-HOLD`',
  '',
  `Total topology nodes: ${topology.nodes.length}`,
  `Lead and sections 1–8 edited by pass 8: ${earlyNodes.length}`,
  `Sections 9–12 preserved from pass 7: ${lateNodes.length}`,
  `Pass 8 SHA-256: ${passEightDigest}`,
  '',
  '## Section counts',
  '',
  '| Section | Heading | Blocks |',
  '|---:|---|---:|',
  ...expectedSections.map((sectionNumber) => {
    const heading = earlyNodes.find((node) => node.sectionNumber === sectionNumber)?.sectionHeading ?? '';
    return `| ${sectionNumber} | ${heading.replaceAll('|', '\\|')} | ${sectionCounts.get(sectionNumber) ?? 0} |`;
  }),
  '',
  '## Stable block inventory and reviewed prose',
  '',
  ...records.flatMap((record) => [
    `### ${record.blockId}`,
    '',
    `- section: ${record.sectionNumber} — ${record.sectionHeading}`,
    `- source order: ${record.sourceOrder}`,
    `- origin: ${record.origin}`,
    `- source file: ${record.file} paragraph ${record.paragraphNumber}`,
    `- claims: ${record.claimIds.join(', ') || 'editorial-only'}`,
    `- canonical sources: ${record.canonicalSourceIds.join(', ') || 'none'}`,
    '',
    '**Reviewed text**',
    '',
    record.reviewedText,
    '',
    '<details><summary>Source authoring text</summary>',
    '',
    record.sourceText,
    '',
    '</details>',
    '',
  ]),
].join('\n');

writeFileSync(resolve(outputDir, 'early-editorial-inventory.md'), `${markdown}\n`);

console.log(
  JSON.stringify(
    {
      status: report.status,
      totalTopologyNodes: report.totalTopologyNodes,
      earlyNodes: report.earlyNodes,
      lateNodes: report.lateNodes,
      sectionCounts: report.sectionCounts,
      passEightSha256: passEightDigest,
      outputDir,
    },
    null,
    2,
  ),
);
