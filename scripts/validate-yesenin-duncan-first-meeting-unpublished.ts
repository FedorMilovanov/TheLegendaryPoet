import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { yeseninPartOneEditorialPassSeven } from '../src/data/essays/yeseninPartOneEditorialPassSeven';
import { yeseninPartOneTheatricalMoscowPassEleven } from '../src/data/essays/yeseninPartOneTheatricalMoscowPassEleven';
import {
  yeseninDuncanCompanionTransferredBlocks,
  yeseninDuncanMainArticleMaximumBlocks,
  yeseninDuncanMainArticleSplit,
  yeseninDuncanSplitApplied,
} from '../src/data/essays/yeseninDuncanMainArticleSplit';
import {
  YESENIN_DUNCAN_FIRST_MEETING_UNPUBLISHED_ID,
  YESENIN_DUNCAN_FIRST_MEETING_UNPUBLISHED_SLUG,
  yeseninDuncanFirstMeetingUnpublished,
} from './lib/yesenin-duncan-first-meeting-unpublished';

const fail = (message: string): never => {
  throw new Error(`[yesenin-duncan-companion] ${message}`);
};

const root = process.cwd();
const article = yeseninDuncanFirstMeetingUnpublished;
const essay = article.essay;

if (
  article.status !== 'unpublished-companion-investigation' ||
  article.publicationAuthorized !== false ||
  article.registrationAuthorized !== false ||
  article.mediaPublicationAuthorized !== false ||
  article.sourceImagesAuthorized !== false
) {
  fail('unpublished/publication/media boundary changed');
}
if (
  article.draftComplete !== true ||
  article.finalEditorialReviewComplete !== false ||
  essay.id !== YESENIN_DUNCAN_FIRST_MEETING_UNPUBLISHED_ID ||
  essay.slug !== YESENIN_DUNCAN_FIRST_MEETING_UNPUBLISHED_SLUG
) {
  fail('draft identity or editorial state changed');
}

const registryText = [
  'src/data/essays/index.ts',
  'src/data/essays/indexContent.ts',
].map((path) => readFileSync(resolve(root, path), 'utf8')).join('\n');
for (const forbiddenRegistration of [essay.id, essay.slug]) {
  if (registryText.includes(forbiddenRegistration)) {
    fail(`unpublished companion leaked into the public registry: ${forbiddenRegistration}`);
  }
}

const blockIds = essay.blocks.map((block) => block.id).filter((id): id is string => Boolean(id));
if (new Set(blockIds).size !== blockIds.length) fail('article block IDs must be unique');

const sections = essay.blocks.filter((block) => block.type === 'section');
const textBlocks = essay.blocks.filter(
  (block): block is typeof block & { text: string } => 'text' in block,
);
if (sections.length !== 9) fail(`expected nine investigation sections, found ${sections.length}`);
if (textBlocks.length < 24 || textBlocks.length > 28) {
  fail(`expected a substantial but bounded companion draft, found ${textBlocks.length} text blocks`);
}

const sourceIds = (essay.sources ?? []).map((source) => source.id).filter((id): id is string => Boolean(id));
if (new Set(sourceIds).size !== sourceIds.length) fail('companion source IDs must be unique');
const sourceIdSet = new Set(sourceIds);
for (const block of essay.blocks) {
  if (!('sourceIds' in block) || !block.sourceIds) continue;
  for (const sourceId of block.sourceIds) {
    if (!sourceIdSet.has(sourceId)) fail(`${block.id ?? block.type} references missing source ${sourceId}`);
  }
}

const theatricalSourceIds = yeseninPartOneTheatricalMoscowPassEleven.map(
  (record) => `yd1-${record.id.toLowerCase()}`,
);
for (const sourceId of theatricalSourceIds) {
  if (!sourceIdSet.has(sourceId)) fail(`companion omitted theatrical source ${sourceId}`);
}
for (const record of yeseninPartOneTheatricalMoscowPassEleven) {
  if (
    record.realPdfAcquired !== true ||
    record.visuallyInspected !== true ||
    record.ocrUsedForEvidence !== false ||
    record.syntheticContentUsed !== false ||
    record.archiveOriginalInspected !== false ||
    record.productionAuthorized !== false
  ) {
    fail(`${record.id} evidence boundary drifted before companion use`);
  }
}

const bridgeParagraphBudget = article.mainArticleBridge.reduce(
  (total, bridge) => total + bridge.maximumParagraphs,
  0,
);
if (
  article.mainArticleMaximumDuncanProseBlocks !== 6 ||
  yeseninDuncanMainArticleMaximumBlocks !== 6 ||
  yeseninDuncanCompanionTransferredBlocks !== 6 ||
  bridgeParagraphBudget !== 6 ||
  yeseninDuncanSplitApplied !== true
) {
  fail('main-biography six-block budget or applied split state changed');
}

const splitIds = yeseninDuncanMainArticleSplit.map((record) => record.blockId);
if (new Set(splitIds).size !== splitIds.length) fail('Duncan split contains duplicate block IDs');
const mainBlocks = yeseninDuncanMainArticleSplit.filter((record) => record.destination === 'main-biography');
const companionBlocks = yeseninDuncanMainArticleSplit.filter(
  (record) => record.destination === 'companion-investigation',
);
if (mainBlocks.length !== 6 || companionBlocks.length !== 6) {
  fail(`expected a 6/6 split, found ${mainBlocks.length}/${companionBlocks.length}`);
}

const currentDuncanIds = [
  ...Object.keys(yeseninPartOneEditorialPassSeven).filter((blockId) =>
    blockId.startsWith('yesenin-p1-transition-duncan-'),
  ),
  'yesenin-p1-transition-series-boundary',
].filter((blockId) => blockId in yeseninPartOneEditorialPassSeven);
if (currentDuncanIds.length !== 12) {
  fail(`expected twelve current Duncan transition/series blocks, found ${currentDuncanIds.length}`);
}
const currentDuncanIdSet = new Set(currentDuncanIds);
for (const blockId of splitIds) {
  if (!currentDuncanIdSet.has(blockId)) fail(`split references unknown current block ${blockId}`);
}
for (const blockId of currentDuncanIds) {
  if (!splitIds.includes(blockId as (typeof splitIds)[number])) {
    fail(`current Duncan block is missing from the split: ${blockId}`);
  }
}

const readerText = textBlocks.map((block) => block.text).join('\n');
for (const required of [
  'самостоятельный московский проект',
  'мастерская Георгия Якулова',
  'точная дата первой встречи неизвестна',
  '7 ноября',
  'не доказывает присутствие Есенина',
  'Анатолия Мариенгофа',
  'шести движений',
] as const) {
  if (!readerText.toLocaleLowerCase('ru-RU').includes(required.toLocaleLowerCase('ru-RU'))) {
    fail(`reader-facing draft is missing required boundary phrase: ${required}`);
  }
}
for (const forbidden of [
  /sha-?256/iu,
  /43[\s,.]?100[\s,.]?448/iu,
  /catalogueCode/iu,
  /book_id/iu,
  /getFiles\.php/iu,
  /PDF\s+\d{2}/u,
] as const) {
  if (forbidden.test(readerText)) fail(`technical acquisition apparatus leaked into prose: ${forbidden}`);
}

if (essay.relatedEssayIds?.length !== 1 || essay.relatedEssayIds[0] !== 'essay-yesenin-biography-part-one-unpublished') {
  fail('companion must point back only to the unpublished Part I draft at this stage');
}
if (essay.cluster?.role !== 'investigation' || essay.series) {
  fail('companion must remain an investigation, not a numbered biography part');
}

console.log(
  JSON.stringify(
    {
      status: 'UNPUBLISHED-COMPANION-DRAFT / MAIN-BIOGRAPHY-6-BLOCK-BUDGET / NO-REGISTRATION',
      articleId: essay.id,
      slug: essay.slug,
      sections: sections.length,
      textBlocks: textBlocks.length,
      sources: sourceIds.length,
      theatricalFacsimiles: theatricalSourceIds.length,
      currentDuncanBlocks: currentDuncanIds.length,
      mainBiographyBlocksPlanned: mainBlocks.length,
      companionBlocksPlanned: companionBlocks.length,
      splitApplied: yeseninDuncanSplitApplied,
      publicationAuthorized: article.publicationAuthorized,
      registrationAuthorized: article.registrationAuthorized,
      mediaPublicationAuthorized: article.mediaPublicationAuthorized,
      sourceImagesAuthorized: article.sourceImagesAuthorized,
    },
    null,
    2,
  ),
);
