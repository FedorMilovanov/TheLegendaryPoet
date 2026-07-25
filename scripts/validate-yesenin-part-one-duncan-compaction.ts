import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { yeseninPartOneUnpublishedArticle } from './lib/yesenin-part-one-unpublished-article';
import {
  YESENIN_DUNCAN_FIRST_MEETING_UNPUBLISHED_ID,
  YESENIN_DUNCAN_FIRST_MEETING_UNPUBLISHED_SLUG,
  yeseninDuncanFirstMeetingUnpublished,
} from './lib/yesenin-duncan-first-meeting-unpublished';
import {
  yeseninDuncanMainArticleSplit,
  yeseninDuncanSplitApplied,
} from '../src/data/essays/yeseninDuncanMainArticleSplit';

const fail = (message: string): never => {
  throw new Error(`[yesenin-part-one-duncan-compaction] ${message}`);
};

const root = process.cwd();
const read = (path: string): string => readFileSync(resolve(root, path), 'utf8');
const partOne = yeseninPartOneUnpublishedArticle;
const companion = yeseninDuncanFirstMeetingUnpublished;
const transferred = yeseninDuncanMainArticleSplit.filter(
  (record) => record.destination === 'companion-investigation',
);
const retained = yeseninDuncanMainArticleSplit.filter(
  (record) => record.destination === 'main-biography',
);
const transferredIds = new Set<string>(transferred.map((record) => record.blockId));
const retainedIds = new Set<string>(retained.map((record) => record.blockId));

if (yeseninDuncanSplitApplied !== true) fail('the planned split has not been applied');
if (transferred.length !== 6 || retained.length !== 6) {
  fail(`expected a 6/6 split, found ${retained.length}/${transferred.length}`);
}
if (
  partOne.publicationAuthorized !== false ||
  partOne.registrationAuthorized !== false ||
  partOne.mediaPublicationAuthorized !== false ||
  companion.publicationAuthorized !== false ||
  companion.registrationAuthorized !== false ||
  companion.mediaPublicationAuthorized !== false ||
  companion.sourceImagesAuthorized !== false
) {
  fail('publication, registration or media boundary changed');
}
if (
  partOne.evidenceNodeCount !== 146 ||
  partOne.readerFacingTextBlocks !== 140 ||
  partOne.duncanCompactionApplied !== true ||
  partOne.companionArticleId !== YESENIN_DUNCAN_FIRST_MEETING_UNPUBLISHED_ID ||
  partOne.companionTransferredBlockIds.length !== 6
) {
  fail('Part I compaction metadata is inconsistent');
}
if (
  JSON.stringify([...partOne.companionTransferredBlockIds].sort()) !==
  JSON.stringify([...transferredIds].sort())
) {
  fail('Part I metadata does not preserve the exact transferred ID set');
}

const renderedBlocks = partOne.essay.blocks.filter((block) => block.type !== 'section');
const sectionBlocks = partOne.essay.blocks.filter((block) => block.type === 'section');
const renderedIds = new Set(
  renderedBlocks.map((block) => block.id).filter((id): id is string => Boolean(id)),
);
if (renderedBlocks.length !== 140 || renderedIds.size !== 140) {
  fail(`expected 140 unique reader-facing text blocks, found ${renderedBlocks.length}/${renderedIds.size}`);
}
if (sectionBlocks.length !== 12 || partOne.essay.blocks.length !== 152) {
  fail(`expected 12 sections and 152 total blocks, found ${sectionBlocks.length}/${partOne.essay.blocks.length}`);
}
if (Object.keys(partOne.evidenceByBlockId).length !== 146) {
  fail(`expected 146 evidence records, found ${Object.keys(partOne.evidenceByBlockId).length}`);
}

for (const blockId of transferredIds) {
  if (renderedIds.has(blockId)) fail(`transferred block still renders in Part I: ${blockId}`);
  const evidence = partOne.evidenceByBlockId[blockId];
  if (!evidence) fail(`transferred block lost its evidence record: ${blockId}`);
  if (evidence.readerFacingInPartOne !== false) {
    fail(`transferred block is not marked non-reader-facing: ${blockId}`);
  }
  if (evidence.transferredToCompanionArticleId !== YESENIN_DUNCAN_FIRST_MEETING_UNPUBLISHED_ID) {
    fail(`transferred block lost companion linkage: ${blockId}`);
  }
  if (!evidence.editorialPassSevenApplied) {
    fail(`transferred block lost its completed editorial state: ${blockId}`);
  }
}
for (const blockId of retainedIds) {
  if (!renderedIds.has(blockId)) fail(`retained Duncan bridge block disappeared: ${blockId}`);
  const evidence = partOne.evidenceByBlockId[blockId];
  if (!evidence?.readerFacingInPartOne) fail(`retained block is not marked reader-facing: ${blockId}`);
  if (evidence.transferredToCompanionArticleId) {
    fail(`retained block is incorrectly linked as transferred: ${blockId}`);
  }
}

const companionText = companion.essay.blocks
  .filter((block): block is typeof block & { text: string } => 'text' in block)
  .map((block) => block.text)
  .join('\n');
for (const phrase of [
  '23 и ранним утром 24 июля',
  'началом ноября',
  'взаимное разрушение',
  'item-level',
] as const) {
  if (!companionText.toLocaleLowerCase('ru-RU').includes(phrase.toLocaleLowerCase('ru-RU'))) {
    fail(`companion draft does not preserve transferred subject: ${phrase}`);
  }
}

const earlyB = read('src/data/essays/yeseninPartOneEditorialPassEightEarlyB.ts');
const physicalOverrides = read('src/data/essays/yeseninPartOneEditorialPhysicalEditionsPassEight.ts');
const builder = read('scripts/lib/yesenin-part-one-unpublished-article.ts');
if (earlyB.includes("import './yeseninPartOneEditorialPhysicalEditionsPassEight'")) {
  fail('EarlyB still depends on a side-effect import');
}
if (/Object\.assign\s*\(/u.test(physicalOverrides)) {
  fail('physical editorial overrides still mutate the pass-seven registry');
}
if (!builder.includes('yeseninPartOneEditorialPhysicalEditionsPassEight')) {
  fail('Part I builder does not explicitly import physical-edition overrides');
}
if (!builder.includes('yeseninDuncanMainArticleSplit')) {
  fail('Part I builder does not explicitly consume the Duncan split registry');
}

const publicRegistry = [
  read('src/data/essays/index.ts'),
  read('src/data/essays/indexContent.ts'),
  read('public/sitemap.xml'),
].join('\n');
for (const forbidden of [
  YESENIN_DUNCAN_FIRST_MEETING_UNPUBLISHED_ID,
  YESENIN_DUNCAN_FIRST_MEETING_UNPUBLISHED_SLUG,
]) {
  if (publicRegistry.includes(forbidden)) fail(`companion leaked into public output: ${forbidden}`);
}

console.log(
  JSON.stringify(
    {
      status: '146-EVIDENCE-NODES / 140-READER-TEXT-BLOCKS / 6-MOVED-TO-COMPANION',
      evidenceNodes: Object.keys(partOne.evidenceByBlockId).length,
      readerFacingTextBlocks: renderedBlocks.length,
      sectionBlocks: sectionBlocks.length,
      totalRenderBlocks: partOne.essay.blocks.length,
      retainedDuncanBlocks: retained.length,
      transferredDuncanBlocks: transferred.length,
      companionSections: companion.essay.blocks.filter((block) => block.type === 'section').length,
      companionRegistered: false,
      publicationAuthorized: false,
      mediaPublicationAuthorized: false,
    },
    null,
    2,
  ),
);
