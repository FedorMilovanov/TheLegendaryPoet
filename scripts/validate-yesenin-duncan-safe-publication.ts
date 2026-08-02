import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { essays, getEssayBySlug } from '../src/data/essays/index';
import type { EssayBlock } from '../src/types/essay';

const slug = 'yesenin-duncan-first-meeting-documents';
const article = getEssayBySlug(slug);

if (!article) throw new Error(`public essay is not registered: ${slug}`);
if (essays.filter((essay) => essay.slug === slug).length !== 1) {
  throw new Error(`public essay must be registered exactly once: ${slug}`);
}

const sectionCount = article.blocks.filter((block) => block.type === 'section').length;
const readerTextBlocks = article.blocks.filter((block) =>
  ['lead', 'paragraph', 'note'].includes(block.type),
).length;
const mythBlocks = article.blocks.filter(
  (block): block is Extract<EssayBlock, { type: 'note'; variant: 'myth' }> =>
    block.type === 'note' && block.variant === 'myth',
);
const imageBlocks = article.blocks.filter(
  (block): block is Extract<EssayBlock, { type: 'image' }> => block.type === 'image',
);

if (sectionCount !== 9) throw new Error(`expected 9 sections, found ${sectionCount}`);
if (readerTextBlocks !== 27) {
  throw new Error(`expected 27 reader-facing text blocks, found ${readerTextBlocks}`);
}
if (mythBlocks.length !== 2) {
  throw new Error(`expected two verified myth checks, found ${mythBlocks.length}`);
}
if (imageBlocks.length !== 1) throw new Error(`expected one in-body image, found ${imageBlocks.length}`);

const exactDateMyth = mythBlocks.find((block) => block.claim.includes('точно 3 октября 1921 года'));
if (!exactDateMyth) throw new Error('exact-date myth check is missing');
if (exactDateMyth.verdict !== 'unproven') {
  throw new Error(`exact-date myth must remain unproven, found ${exactDateMyth.verdict}`);
}
for (const sourceId of [
  'yd1-pss-duncan-chronology',
  'yd1-mcvay-isadora-yesenin',
  'ye1-schneider-memoir-commentary',
]) {
  if (!exactDateMyth.sourceIds?.includes(sourceId)) {
    throw new Error(`exact-date myth lost required source: ${sourceId}`);
  }
}

const transcriptMyth = mythBlocks.find((block) => block.claim.includes('точной стенограммой'));
if (!transcriptMyth) throw new Error('memoir-transcript myth check is missing');
if (transcriptMyth.verdict !== 'unproven') {
  throw new Error(`memoir-transcript myth must remain unproven, found ${transcriptMyth.verdict}`);
}
for (const sourceId of ['ye1-mariengof-memoir', 'yd1-mcvay-isadora-yesenin']) {
  if (!transcriptMyth.sourceIds?.includes(sourceId)) {
    throw new Error(`memoir-transcript myth lost required source: ${sourceId}`);
  }
}

const searchable = [
  article.kicker ?? '',
  article.title,
  article.subtitle ?? '',
  article.excerpt,
  ...article.blocks.flatMap((block) => {
    if ('text' in block) return [block.text];
    if (block.type === 'section') return [block.heading];
    if (block.type === 'image') return [block.alt, block.caption, block.credit ?? ''];
    return [];
  }),
].join('\n');

for (const forbidden of [
  /непубличн/iu,
  /черновик/iu,
  /Есенин присутствовал на вечере 7 ноября/iu,
  /первые слова были/iu,
  /его трагический финал — предрешён/iu,
]) {
  if (forbidden.test(searchable)) throw new Error(`forbidden public claim matched: ${forbidden}`);
}

for (const required of [
  'с оговоркой «видимо»',
  'точная дата первой встречи неизвестна',
  'не доказывает присутствие Есенина',
  'принадлежит мемуарной традиции, а не стенограмме',
  'Открытый доступ к цифровой копии не означает автоматического разрешения',
  'его трагический финал ещё не был предрешён',
]) {
  if (!searchable.includes(required)) throw new Error(`required source boundary is missing: ${required}`);
}

const sources = article.sources ?? [];
if (sources.length !== 18) throw new Error(`expected 18 sources, found ${sources.length}`);

const sourceIds = new Set<string>();
const sourceUrls = new Set<string>();
for (const source of sources) {
  if (!source.id) throw new Error(`source without stable id: ${source.title}`);
  if (sourceIds.has(source.id)) throw new Error(`duplicate source id: ${source.id}`);
  sourceIds.add(source.id);

  if (!source.url?.startsWith('https://')) {
    throw new Error(`source must have an HTTPS locator: ${source.id}`);
  }
  const normalizedUrl = source.url.endsWith('/') ? source.url.slice(0, -1) : source.url;
  if (sourceUrls.has(normalizedUrl)) throw new Error(`duplicate source URL: ${source.url}`);
  sourceUrls.add(normalizedUrl);
}

for (const block of article.blocks) {
  if (!('sourceIds' in block) || !block.sourceIds) continue;
  for (const sourceId of block.sourceIds) {
    if (!sourceIds.has(sourceId)) {
      throw new Error(`block references missing source id: ${sourceId}`);
    }
  }
}

const expectedCover = '/images/essays/yesenin/yesenin-duncan-first-meeting-editorial.webp';
const expectedCoverSha256 = '29c84251741438878fc89ed6f691e1d6e510f6735a9cea502489d73cfdd6a659';
if (article.cover !== expectedCover) throw new Error('unexpected cover file');
if (article.cardCover !== expectedCover) throw new Error('card cover diverges from the approved cover');
if (article.coverKind !== 'reconstruction') throw new Error('cover must remain labelled as a reconstruction');
if (article.coverSourceUrl) throw new Error('local editorial reconstruction must not claim an external source page');
if (!article.coverCredit?.includes('редакционная реконструкция')) {
  throw new Error('cover credit lost the reconstruction disclosure');
}
const coverSha256 = createHash('sha256')
  .update(readFileSync(`public${expectedCover}`))
  .digest('hex');
if (coverSha256 !== expectedCoverSha256) throw new Error(`approved cover bytes changed: ${coverSha256}`);

const allowedImageHostnames = new Set(['cdn.loc.gov', 'tile.loc.gov']);
for (const [index, block] of imageBlocks.entries()) {
  const label = `image-${index + 1}`;
  const image = new URL(block.src);
  if (!allowedImageHostnames.has(image.hostname)) {
    throw new Error(`${label} uses a non-approved image host: ${image.hostname}`);
  }
  if (!block.sourceUrl?.startsWith('https://www.loc.gov/')) {
    throw new Error(`${label} has no exact Library of Congress item page`);
  }
  if (!block.credit?.includes('No known restrictions on publication')) {
    throw new Error(`${label} is missing the exact LOC rights advisory`);
  }
}

const prohibitedVisualDomains = /rusneb\.ru|eastview\.com|nypl\.org|rgali\.ru|rsl\.ru/iu;
for (const block of imageBlocks) {
  if (prohibitedVisualDomains.test(`${block.src}\n${block.sourceUrl ?? ''}`)) {
    throw new Error('archive, newspaper or restricted viewer image entered public media');
  }
}

if (!imageBlocks[0].sourceUrl?.includes('/pictures/item/2018708234/')) {
  throw new Error('in-body visual must remain anchored to the accepted Genthe LOC item');
}

console.log(
  `yesenin-duncan safe publication: ${sectionCount} sections, ${readerTextBlocks} text blocks, ${mythBlocks.length} myth checks, ${sources.length} sources, approved local reconstruction=${coverSha256}, ${imageBlocks.length} LOC in-body visual`,
);
