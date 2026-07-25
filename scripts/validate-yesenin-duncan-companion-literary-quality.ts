import { createHash } from 'node:crypto';
import { yeseninDuncanFirstMeetingUnpublished } from './lib/yesenin-duncan-first-meeting-unpublished';

const fail = (message: string): never => {
  throw new Error(`[yesenin-duncan-companion-literary-quality] ${message}`);
};

const article = yeseninDuncanFirstMeetingUnpublished;
const essay = article.essay;
const expectedSectionTextCounts = new Map<string, number>([
  ['yd1-section-method', 2],
  ['yd1-section-independent-project', 3],
  ['yd1-section-place', 2],
  ['yd1-section-date', 3],
  ['yd1-section-seven-november', 3],
  ['yd1-section-legend', 3],
  ['yd1-section-context', 3],
  ['yd1-section-boundaries', 3],
  ['yd1-section-biography', 2],
]);

const textBlocks = essay.blocks.filter(
  (block): block is typeof block & { id: string; text: string; sourceIds: readonly string[] } =>
    Boolean(block.id) && 'text' in block && 'sourceIds' in block && Array.isArray(block.sourceIds),
);
const sections = essay.blocks.filter(
  (block): block is typeof block & { id: string; heading: string } =>
    block.type === 'section' && Boolean(block.id) && 'heading' in block,
);

if (article.finalEditorialReviewComplete !== true) fail('final editorial review is not complete');
if (article.readerFacingTextBlockCap !== 25 || textBlocks.length !== 25) {
  fail(`expected exact 25-block reader corpus, found ${textBlocks.length}`);
}
if (sections.length !== expectedSectionTextCounts.size) {
  fail(`expected ${expectedSectionTextCounts.size} sections, found ${sections.length}`);
}

const observedSectionTextCounts = new Map<string, number>();
let currentSectionId = 'lead';
for (const block of essay.blocks) {
  if (block.type === 'section' && block.id) {
    currentSectionId = block.id;
    observedSectionTextCounts.set(currentSectionId, 0);
    continue;
  }
  if ('text' in block && currentSectionId !== 'lead') {
    observedSectionTextCounts.set(
      currentSectionId,
      (observedSectionTextCounts.get(currentSectionId) ?? 0) + 1,
    );
  }
}
for (const [sectionId, expectedCount] of expectedSectionTextCounts) {
  const observed = observedSectionTextCounts.get(sectionId);
  if (observed !== expectedCount) {
    fail(`${sectionId} expected ${expectedCount} text blocks, found ${observed ?? 0}`);
  }
}

const sourceIds = (essay.sources ?? []).map((source) => source.id).filter((id): id is string => Boolean(id));
if (sourceIds.length !== 17 || new Set(sourceIds).size !== 17) {
  fail(`expected 17 unique source cards, found ${sourceIds.length}/${new Set(sourceIds).size}`);
}
const theatricalSourceIds = sourceIds.filter((sourceId) => sourceId.startsWith('yd1-tm11-'));
if (theatricalSourceIds.length !== 4) {
  fail(`expected four Theatrical Moscow source cards, found ${theatricalSourceIds.length}`);
}

const referencedSourceIds = new Set<string>();
const exactTexts = new Set<string>();
for (const block of textBlocks) {
  if (block.sourceIds.length === 0) fail(`${block.id} has no source boundary`);
  if (block.sourceIds.length > 4) fail(`${block.id} has excessive source density ${block.sourceIds.length}`);
  for (const sourceId of block.sourceIds) referencedSourceIds.add(sourceId);

  const normalizedText = block.text.replace(/\s+/gu, ' ').trim();
  if (exactTexts.has(normalizedText)) fail(`${block.id} duplicates an existing paragraph exactly`);
  exactTexts.add(normalizedText);

  const words = normalizedText.split(/\s+/u).filter(Boolean).length;
  if (words < 24 || words > 120) {
    fail(`${block.id} has implausible reader-facing length ${words} words`);
  }
}
for (const sourceId of sourceIds) {
  if (!referencedSourceIds.has(sourceId)) fail(`unused source card ${sourceId}`);
}

const readerText = textBlocks.map((block) => block.text).join('\n');
for (const pattern of [
  /для статьи/iu,
  /для основной биографии/iu,
  /читательск(?:ий|ая|ое) корпус/iu,
  /редакционн(?:ый|ая|ое) план/iu,
  /следующий шаг/iu,
  /item-level/iu,
  /reader-facing/iu,
  /production/iu,
  /provenance/iu,
  /PDF-кадр/iu,
  /sha-?256/iu,
] as const) {
  if (pattern.test(readerText)) fail(`service or technical language leaked into prose: ${pattern}`);
}

const stableReaderShape = textBlocks.map((block) => ({
  id: block.id,
  text: block.text,
  sourceIds: [...block.sourceIds],
}));
const readerDigest = createHash('sha256').update(JSON.stringify(stableReaderShape)).digest('hex');

console.log(
  JSON.stringify(
    {
      status: 'COMPANION-LITERARY-QUALITY-PASS / 25-BLOCK-CAP / UNPUBLISHED',
      sections: sections.length,
      textBlocks: textBlocks.length,
      sources: sourceIds.length,
      theatricalSources: theatricalSourceIds.length,
      sectionTextCounts: Object.fromEntries(observedSectionTextCounts),
      readerSha256: readerDigest,
      publicationAuthorized: article.publicationAuthorized,
      registrationAuthorized: article.registrationAuthorized,
      mediaPublicationAuthorized: article.mediaPublicationAuthorized,
    },
    null,
    2,
  ),
);
