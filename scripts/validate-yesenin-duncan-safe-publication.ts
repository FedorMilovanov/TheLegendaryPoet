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
const imageBlocks = article.blocks.filter(
  (block): block is Extract<EssayBlock, { type: 'image' }> => block.type === 'image',
);

if (sectionCount !== 9) throw new Error(`expected 9 sections, found ${sectionCount}`);
if (readerTextBlocks !== 25) {
  throw new Error(`expected 25 reader-facing text blocks, found ${readerTextBlocks}`);
}
if (imageBlocks.length !== 1) throw new Error(`expected one in-body image, found ${imageBlocks.length}`);

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
  /точно 3 октября/iu,
  /бесспорно 3 октября/iu,
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

const allowedImageHostnames = new Set(['cdn.loc.gov', 'tile.loc.gov']);
for (const [label, imageUrl, itemUrl, credit] of [
  ['cover', article.cover, article.coverSourceUrl, article.coverCredit],
  ...imageBlocks.map((block, index) => [
    `image-${index + 1}`,
    block.src,
    block.sourceUrl,
    block.credit,
  ]),
] as Array<[string, string, string | undefined, string | undefined]>) {
  const image = new URL(imageUrl);
  if (!allowedImageHostnames.has(image.hostname)) {
    throw new Error(`${label} uses a non-approved image host: ${image.hostname}`);
  }
  if (!itemUrl?.startsWith('https://www.loc.gov/')) {
    throw new Error(`${label} has no exact Library of Congress item page`);
  }
  if (!credit?.includes('No known restrictions on publication')) {
    throw new Error(`${label} is missing the exact LOC rights advisory`);
  }
}

const prohibitedVisualDomains = /rusneb\.ru|eastview\.com|nypl\.org|rgali\.ru|rsl\.ru/iu;
for (const block of imageBlocks) {
  if (prohibitedVisualDomains.test(`${block.src}\n${block.sourceUrl ?? ''}`)) {
    throw new Error('archive, newspaper or restricted viewer image entered public media');
  }
}

if (!article.coverSourceUrl?.includes('/pictures/item/2014685647/')) {
  throw new Error('cover must remain anchored to the accepted Bain News Service LOC item');
}
if (!imageBlocks[0].sourceUrl?.includes('/pictures/item/2018708234/')) {
  throw new Error('in-body visual must remain anchored to the accepted Genthe LOC item');
}

console.log(
  `yesenin-duncan safe publication: ${sectionCount} sections, ${readerTextBlocks} text blocks, ${sources.length} sources, ${imageBlocks.length + 1} LOC visuals`,
);
