import { createHash } from 'node:crypto';
import { loadYeseninPartOnePass6CitationTopology } from './lib/yesenin-part-one-pass6-citation-topology';
import { yeseninPartOneUnpublishedArticle } from './lib/yesenin-part-one-unpublished-article';
import {
  yeseninPartOneEditorialPassEightEarlyA,
  yeseninPartOneEditorialPassEightEarlyAExpectedCount,
  yeseninPartOneEditorialPassEightEarlyAExpectedSections,
} from '../src/data/essays/yeseninPartOneEditorialPassEightEarlyA';
import {
  yeseninPartOneEditorialPassEightEarlyB,
  yeseninPartOneEditorialPassEightEarlyBExpectedCount,
  yeseninPartOneEditorialPassEightEarlyBExpectedSections,
} from '../src/data/essays/yeseninPartOneEditorialPassEightEarlyB';
import { yeseninPartOneEditorialPassSeven } from '../src/data/essays/yeseninPartOneEditorialPassSeven';
import { yeseninPartOneEditorialPassSevenPass6 } from '../src/data/essays/yeseninPartOneEditorialPassSevenPass6';

const fail = (message: string): never => {
  throw new Error(`[yesenin-part-one-editorial-pass8] ${message}`);
};

const topology = loadYeseninPartOnePass6CitationTopology(process.cwd());
const articlePackage = yeseninPartOneUnpublishedArticle;
const earlyAEntries = Object.entries(yeseninPartOneEditorialPassEightEarlyA);
const earlyBEntries = Object.entries(yeseninPartOneEditorialPassEightEarlyB);
const passEightEntries = [...earlyAEntries, ...earlyBEntries];

if (
  articlePackage.publicationAuthorized !== false ||
  articlePackage.registrationAuthorized !== false ||
  articlePackage.mediaPublicationAuthorized !== false
) {
  fail('editorial pass must not authorize publication, registration or media reuse');
}
if (
  articlePackage.editorialPassEight !== 'lead-sections-1-8-literary-theological-pass-eight' ||
  JSON.stringify(articlePackage.editorialPassEightEditedSections) !==
    JSON.stringify([0, 1, 2, 3, 4, 5, 6, 7, 8]) ||
  articlePackage.wholeArticleSentenceEditComplete !== true
) {
  fail('whole-article pass-eight completion metadata is inconsistent');
}
if (topology.nodes.length !== 146) fail(`expected 146 topology nodes, found ${topology.nodes.length}`);
if (
  yeseninPartOneEditorialPassEightEarlyAExpectedCount !== 37 ||
  earlyAEntries.length !== yeseninPartOneEditorialPassEightEarlyAExpectedCount
) {
  fail(`expected 37 early-A overrides, found ${earlyAEntries.length}`);
}
if (
  yeseninPartOneEditorialPassEightEarlyBExpectedCount !== 38 ||
  earlyBEntries.length !== yeseninPartOneEditorialPassEightEarlyBExpectedCount
) {
  fail(`expected 38 early-B overrides, found ${earlyBEntries.length}`);
}
if (passEightEntries.length !== 75) {
  fail(`expected 75 total pass-eight overrides, found ${passEightEntries.length}`);
}
if (
  JSON.stringify(yeseninPartOneEditorialPassEightEarlyAExpectedSections) !==
    JSON.stringify([0, 1, 2, 3, 4]) ||
  JSON.stringify(yeseninPartOneEditorialPassEightEarlyBExpectedSections) !==
    JSON.stringify([5, 6, 7, 8])
) {
  fail('pass-eight section contracts changed');
}

const earlyNodes = topology.nodes.filter(
  (node) => node.sectionNumber >= 0 && node.sectionNumber <= 8,
);
const lateNodes = topology.nodes.filter(
  (node) => node.sectionNumber >= 9 && node.sectionNumber <= 12,
);
if (earlyNodes.length !== 75) fail(`expected 75 early nodes, found ${earlyNodes.length}`);
if (lateNodes.length !== 71) fail(`expected 71 late nodes, found ${lateNodes.length}`);

const earlyIds = new Set(earlyNodes.map((node) => node.blockId));
const passEightIds = new Set(passEightEntries.map(([blockId]) => blockId));
if (passEightIds.size !== 75) fail(`pass-eight registry contains duplicate IDs: ${passEightIds.size}/75`);
for (const blockId of earlyIds) {
  if (!passEightIds.has(blockId)) fail(`pass eight misses early block ${blockId}`);
}
for (const blockId of passEightIds) {
  if (!earlyIds.has(blockId)) fail(`pass eight escapes lead/sections 1-8 at ${blockId}`);
}

const passSevenIds = new Set([
  ...Object.keys(yeseninPartOneEditorialPassSeven),
  ...Object.keys(yeseninPartOneEditorialPassSevenPass6),
]);
if (passSevenIds.size !== 71) fail(`expected 71 preserved pass-seven IDs, found ${passSevenIds.size}`);
for (const blockId of passEightIds) {
  if (passSevenIds.has(blockId)) fail(`pass-eight block overlaps pass seven: ${blockId}`);
}
if (new Set([...passEightIds, ...passSevenIds]).size !== 146) {
  fail('pass seven and pass eight do not cover the exact 146-node article');
}

const renderedTextById = new Map(
  articlePackage.essay.blocks
    .filter((block) => block.type !== 'section' && block.id && 'text' in block)
    .map((block) => [block.id as string, String(block.text)] as const),
);
for (const [blockId, text] of passEightEntries) {
  const node = earlyNodes.find((candidate) => candidate.blockId === blockId);
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
for (const node of lateNodes) {
  const evidence = articlePackage.evidenceByBlockId[node.blockId];
  if (!evidence?.editorialPassSevenApplied) fail(`late pass-seven edit was lost at ${node.blockId}`);
  if (evidence.editorialPassEightApplied) fail(`pass eight overlaps late block ${node.blockId}`);
}

const serviceLanguagePatterns = [
  /для статьи/iu,
  /в окончательной статье/iu,
  /будущая статья/iu,
  /следующий раздел должен/iu,
  /авторская проза/iu,
  /редакционная граница/iu,
  /нужный следующий шаг/iu,
  /citation topology/iu,
  /должны быть включены в финальную/iu,
];
for (const [blockId, text] of passEightEntries) {
  for (const pattern of serviceLanguagePatterns) {
    if (pattern.test(text)) fail(`${blockId} retains service-language pattern ${pattern}`);
  }
}

const textById = new Map(passEightEntries);
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
  'yesenin-p1-blok-arrival-9-march-1915': ['9 марта 1915 года', 'синхронных документов'],
  'yesenin-p1-blok-not-instant-fame': ['Блок открыл Есенина', 'не был пройден за один день'],
  'yesenin-p1-klyuev-agency-boundary': ['психологическим диагнозом', 'начинала диктовать'],
  'yesenin-p1-radunitsa-bibliographic-date': ['1916 года', 'ноябрь 1915-го'],
  'yesenin-p1-radunitsa-theological-boundary': [
    'библейские и литургические ассоциации',
    'распятого и воскресшего Христа',
  ],
  'yesenin-p1-train-143-enlistment-date': ['20 апреля 1916 года', 'вагона № 6'],
  'yesenin-p1-train-143-team-record': ['странице 673', 'SHA-256', 'дела РГИА'],
  'yesenin-p1-train-143-lazaret-17-rejection': ['лазарету № 17', 'поезда № 143'],
  'yesenin-p1-train-143-transition-poems': ['народной эсхатологией', 'богословское напряжение'],
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
  Array.from({ length: 9 }, (_, sectionNumber) => [
    sectionNumber,
    earlyNodes.filter((node) => node.sectionNumber === sectionNumber).length,
  ]),
);
const passEightDigest = createHash('sha256')
  .update(JSON.stringify(passEightEntries))
  .digest('hex');
const fullEditorialDigest = createHash('sha256')
  .update(
    JSON.stringify([
      ...passEightEntries,
      ...Object.entries(yeseninPartOneEditorialPassSeven),
      ...Object.entries(yeseninPartOneEditorialPassSevenPass6),
    ]),
  )
  .digest('hex');

console.log(
  JSON.stringify(
    {
      status: 'WHOLE-ARTICLE-SENTENCE-EDIT-COMPLETE / 146-OF-146 / UNPUBLISHED / UNREGISTERED / MEDIA-HOLD',
      totalTopologyNodes: topology.nodes.length,
      passEightEditedBlocks: passEightEntries.length,
      passEightEditedSections: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      preservedPassSevenBlocks: passSevenIds.size,
      totalEditedBlocks: passEightIds.size + passSevenIds.size,
      sectionCounts,
      passEightSha256: passEightDigest,
      fullEditorialSha256: fullEditorialDigest,
      wholeArticleSentenceEditComplete: articlePackage.wholeArticleSentenceEditComplete,
      publicationAuthorized: articlePackage.publicationAuthorized,
      registrationAuthorized: articlePackage.registrationAuthorized,
      mediaPublicationAuthorized: articlePackage.mediaPublicationAuthorized,
    },
    null,
    2,
  ),
);
