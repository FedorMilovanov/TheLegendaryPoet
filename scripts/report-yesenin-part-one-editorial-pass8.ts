import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadYeseninPartOnePass6CitationTopology } from './lib/yesenin-part-one-pass6-citation-topology';

const fail = (message: string): never => {
  throw new Error(`[yesenin-part-one-pass8-inventory] ${message}`);
};

const root = process.cwd();
const topology = loadYeseninPartOnePass6CitationTopology(root);
const earlyNodes = topology.nodes.filter((node) => node.sectionNumber >= 0 && node.sectionNumber <= 8);
const lateNodes = topology.nodes.filter((node) => node.sectionNumber >= 9 && node.sectionNumber <= 12);

if (topology.nodes.length !== 146) fail(`expected 146 total nodes, found ${topology.nodes.length}`);
if (earlyNodes.length !== 75) fail(`expected 75 lead/section-1-8 nodes, found ${earlyNodes.length}`);
if (lateNodes.length !== 71) fail(`expected 71 section-9-12 nodes, found ${lateNodes.length}`);

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

const records = earlyNodes.map((node) => ({
  sourceOrder: node.sourceOrder,
  sectionNumber: node.sectionNumber,
  sectionHeading: node.sectionHeading,
  subsectionHeading: node.subsectionHeading ?? null,
  blockId: node.blockId,
  origin: node.origin,
  file: node.file,
  paragraphNumber: node.paragraphNumber,
  text: node.text,
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

const report = {
  status: 'EARLY-HALF-INVENTORIED / EDITING-NOT-COMPLETE / UNPUBLISHED',
  topologySha256: '49354adab3d14bbe03ca48b3fb6c4f1795601d7101c82694a5f7fa5cfec1b838',
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
  'Статус: `75 EARLY-NODES-IN-SCOPE / EDITING-NOT-COMPLETE / UNPUBLISHED / UNREGISTERED / MEDIA-HOLD`',
  '',
  `Total topology nodes: ${topology.nodes.length}`,
  `Lead and sections 1–8: ${earlyNodes.length}`,
  `Already edited sections 9–12: ${lateNodes.length}`,
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
  '## Stable block inventory',
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
    record.text,
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
      outputDir,
    },
    null,
    2,
  ),
);
