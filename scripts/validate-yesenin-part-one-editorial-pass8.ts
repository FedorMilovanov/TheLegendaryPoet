import { createHash } from 'node:crypto';
import { loadYeseninPartOnePass6CitationTopology } from './lib/yesenin-part-one-pass6-citation-topology';
import { yeseninPartOneUnpublishedArticle } from './lib/yesenin-part-one-unpublished-article';
import {
  yeseninPartOneEditorialPassEightEarlyA,
  yeseninPartOneEditorialPassEightEarlyAExpectedCount,
  yeseninPartOneEditorialPassEightEarlyAExpectedSections,
} from '../src/data/essays/yeseninPartOneEditorialPassEightEarlyA';
import { yeseninPartOneEditorialPassSeven } from '../src/data/essays/yeseninPartOneEditorialPassSeven';
import { yeseninPartOneEditorialPassSevenPass6 } from '../src/data/essays/yeseninPartOneEditorialPassSevenPass6';

const fail = (message: string): never => {
  throw new Error(`[yesenin-part-one-editorial-pass8] ${message}`);
};

const topology = loadYeseninPartOnePass6CitationTopology(process.cwd());
const articlePackage = yeseninPartOneUnpublishedArticle;
const entries = Object.entries(yeseninPartOneEditorialPassEightEarlyA);

if (
  articlePackage.publicationAuthorized !== false ||
  articlePackage.registrationAuthorized !== false ||
  articlePackage.mediaPublicationAuthorized !== false
) {
  fail('editorial pass must not authorize publication, registration or media reuse');
}
if (topology.nodes.length !== 146) fail(`expected 146 topology nodes, found ${topology.nodes.length}`);
if (
  yeseninPartOneEditorialPassEightEarlyAExpectedCount !== 37 ||
  entries.length !== yeseninPartOneEditorialPassEightEarlyAExpectedCount
) {
  fail(`expected 37 pass-eight early overrides, found ${entries.length}`);
}
if (
  JSON.stringify(yeseninPartOneEditorialPassEightEarlyAExpectedSections) !==
  JSON.stringify([0, 1, 2, 3, 4])
) {
  fail('pass-eight early-A section contract changed');
}

const targetNodes = topology.nodes.filter(
  (node) => node.sectionNumber >= 0 && node.sectionNumber <= 4,
);
const remainingEarlyNodes = topology.nodes.filter(
  (node) => node.sectionNumber >= 5 && node.sectionNumber <= 8,
);
const lateNodes = topology.nodes.filter(
  (node) => node.sectionNumber >= 9 && node.sectionNumber <= 12,
);
if (targetNodes.length !== 37) fail(`expected 37 nodes in lead/sections 1-4, found ${targetNodes.length}`);
if (remainingEarlyNodes.length !== 38) {
  fail(`expected 38 still-pending nodes in sections 5-8, found ${remainingEarlyNodes.length}`);
}
if (lateNodes.length !== 71) fail(`expected 71 pass-seven nodes in sections 9-12, found ${lateNodes.length}`);

const targetIds = new Set(targetNodes.map((node) => node.blockId));
const overrideIds = new Set(entries.map(([blockId]) => blockId));
if (overrideIds.size !== 37) fail(`pass-eight registry contains duplicate IDs: ${overrideIds.size}/37`);
for (const blockId of targetIds) {
  if (!overrideIds.has(blockId)) fail(`pass eight misses target block ${blockId}`);
}
for (const blockId of overrideIds) {
  if (!targetIds.has(blockId)) fail(`pass eight escapes lead/sections 1-4 at ${blockId}`);
}

const passSevenIds = new Set([
  ...Object.keys(yeseninPartOneEditorialPassSeven),
  ...Object.keys(yeseninPartOneEditorialPassSevenPass6),
]);
for (const blockId of overrideIds) {
  if (passSevenIds.has(blockId)) fail(`pass-eight block overlaps pass seven: ${blockId}`);
}
if (passSevenIds.size !== 71) fail(`expected 71 preserved pass-seven IDs, found ${passSevenIds.size}`);

const renderedTextById = new Map(
  articlePackage.essay.blocks
    .filter((block) => block.type !== 'section' && block.id && 'text' in block)
    .map((block) => [block.id as string, String(block.text)] as const),
);
for (const [blockId, text] of entries) {
  const node = targetNodes.find((candidate) => candidate.blockId === blockId);
  if (!node) fail(`unknown pass-eight target ${blockId}`);
  const evidence = articlePackage.evidenceByBlockId[blockId];
  if (!evidence) fail(`missing internal evidence for ${blockId}`);
  if (!evidence.editorialPassEightApplied) fail(`${blockId} is not marked as pass-eight edited`);
  if (evidence.editorialPassSevenApplied) fail(`${blockId} is incorrectly marked as pass-seven edited`);
  if (renderedTextById.get(blockId) !== text) fail(`${blockId} does not render pass-eight text`);
  if (text.length < 280 || text.length > 900) {
    fail(`${blockId} has implausible edited length ${text.length}`);
  }
  if (/\[(?:block|claims|sources):/u.test(text)) {
    fail(`${blockId} leaks authoring metadata into reader-facing prose`);
  }
}

for (const node of remainingEarlyNodes) {
  const evidence = articlePackage.evidenceByBlockId[node.blockId];
  if (!evidence) fail(`missing evidence for pending block ${node.blockId}`);
  if (evidence.editorialPassEightApplied) {
    fail(`sections 5-8 must remain pending in early-A checkpoint: ${node.blockId}`);
  }
  if (renderedTextById.get(node.blockId) !== node.text) {
    fail(`pending block ${node.blockId} changed before its pass-eight review`);
  }
}
for (const node of lateNodes) {
  const evidence = articlePackage.evidenceByBlockId[node.blockId];
  if (!evidence?.editorialPassSevenApplied) fail(`late pass-seven edit was lost at ${node.blockId}`);
  if (evidence.editorialPassEightApplied) fail(`pass eight overlaps late block ${node.blockId}`);
}

const serviceLanguagePatterns = [
  /для статьи/iu,
  /в окончательной статье/iu,
  /биограф должен/iu,
  /нужно показать/iu,
  /авторская проза/iu,
  /редакционная граница/iu,
  /следующий шаг/iu,
  /citation topology/iu,
];
for (const [blockId, text] of entries) {
  for (const pattern of serviceLanguagePatterns) {
    if (pattern.test(text)) fail(`${blockId} retains service-language pattern ${pattern}`);
  }
}

const textById = new Map(entries);
const requiredAnchors: Readonly<Record<string, readonly string[]>> = {
  'yesenin-p1-lead-method': ['Документы сопротивляются', 'синхронным'],
  'yesenin-p1-konstantinovo-birth-date': ['21 сентября 1895 года', '3 октября'],
  'yesenin-p1-konstantinovo-church-language': ['культурная память', 'личное исповедание'],
  'yesenin-p1-spas-klepiki-official-school-name': [
    'второклассную учительскую школу',
    'церковно-учительская школа',
  ],
  'yesenin-p1-spas-klepiki-certificate': ['свидетельство № 85', 'не разрешённым медиаобъектом'],
  'yesenin-p1-moscow-sytin-printing-house': ['подчитчик', 'единая история устройства'],
  'yesenin-p1-moscow-worker-literary-circles': ['Полицейские материалы', 'не дают основания'],
  'yesenin-p1-izryadnova-son-birth': ['21 декабря 1914 года', 'Юрием', 'Георгий'],
  'yesenin-p1-izryadnova-moral-assessment': [
    'Нравственная тяжесть',
    'окончательный суд о человеке',
  ],
};
for (const [blockId, anchors] of Object.entries(requiredAnchors)) {
  const text = textById.get(blockId);
  if (!text) fail(`missing anchored pass-eight block ${blockId}`);
  const normalized = text.toLocaleLowerCase('ru-RU');
  for (const anchor of anchors) {
    if (!normalized.includes(anchor.toLocaleLowerCase('ru-RU'))) {
      fail(`${blockId} is missing anchor ${anchor}`);
    }
  }
}

const sectionCounts = Object.fromEntries(
  Array.from({ length: 5 }, (_, sectionNumber) => [
    sectionNumber,
    targetNodes.filter((node) => node.sectionNumber === sectionNumber).length,
  ]),
);
const registryDigest = createHash('sha256').update(JSON.stringify(entries)).digest('hex');

console.log(
  JSON.stringify(
    {
      status: 'PASS8-EARLY-A-37-OF-75 / UNPUBLISHED / UNREGISTERED / MEDIA-HOLD',
      totalTopologyNodes: topology.nodes.length,
      passEightEditedBlocks: entries.length,
      passEightEditedSections: [0, 1, 2, 3, 4],
      remainingPassEightBlocks: remainingEarlyNodes.length,
      remainingPassEightSections: [5, 6, 7, 8],
      preservedPassSevenBlocks: passSevenIds.size,
      sectionCounts,
      registrySha256: registryDigest,
      publicationAuthorized: articlePackage.publicationAuthorized,
      registrationAuthorized: articlePackage.registrationAuthorized,
      mediaPublicationAuthorized: articlePackage.mediaPublicationAuthorized,
    },
    null,
    2,
  ),
);
