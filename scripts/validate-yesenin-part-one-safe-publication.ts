import { getEssayBySlug } from '../src/data/essays/index';
import type { EssayBlock } from '../src/types/essay';

const slug = 'sergei-yesenin-1895-1921';
const article = getEssayBySlug(slug);
if (!article) throw new Error(`public essay is not registered: ${slug}`);

const sections = article.blocks.filter((block) => block.type === 'section');
const authored = article.blocks.filter((block) => block.type !== 'section');
const images = article.blocks.filter(
  (block): block is Extract<EssayBlock, { type: 'image' }> => block.type === 'image',
);

if (sections.length !== 12) throw new Error(`expected 12 sections, found ${sections.length}`);
if (authored.length !== 140) throw new Error(`expected 140 reader-facing blocks, found ${authored.length}`);
if (article.blocks.length !== 152) throw new Error(`expected 152 render blocks, found ${article.blocks.length}`);
if (article.blocks.filter((block) => block.type === 'lead').length !== 1) throw new Error('expected one lead');
if (article.blocks.filter((block) => block.type === 'note').length !== 1) throw new Error('expected one note');
if (images.length !== 0) throw new Error('closed documentary images entered the public article');

const sources = article.sources ?? [];
if (sources.length !== 64) throw new Error(`expected 64 source cards, found ${sources.length}`);
const sourceIds = new Set<string>();
const sourceUrls = new Set<string>();
for (const source of sources) {
  if (!source.id) throw new Error(`source without stable id: ${source.title}`);
  if (sourceIds.has(source.id)) throw new Error(`duplicate source id: ${source.id}`);
  sourceIds.add(source.id);
  if (!source.url?.startsWith('https://')) throw new Error(`source without HTTPS locator: ${source.id}`);
  const normalized = source.url.endsWith('/') ? source.url.slice(0, -1) : source.url;
  if (sourceUrls.has(normalized)) throw new Error(`duplicate source URL: ${source.url}`);
  sourceUrls.add(normalized);
}
for (const block of article.blocks) {
  if (!('sourceIds' in block) || !block.sourceIds) continue;
  for (const sourceId of block.sourceIds) {
    if (!sourceIds.has(sourceId)) throw new Error(`block references missing source: ${sourceId}`);
  }
}

const readerText = [
  article.kicker ?? '',
  article.title,
  article.subtitle ?? '',
  article.excerpt,
  article.seoTitle ?? '',
  article.seoDescription ?? '',
  ...article.blocks.flatMap((block) => {
    if ('text' in block) return [block.text];
    if (block.type === 'section') return [block.heading];
    return [];
  }),
].join('\n');

for (const forbidden of [
  /непубличн/iu,
  /редакционн(?:ый|ого|ом) черновик/iu,
  /публикация изображения не разрешена/iu,
  /статья должна/iu,
  /в авторском тексте/iu,
  /citation topology/iu,
  /за один день стал знаменит/iu,
  /оставил семью ради поэзии(?!»)/iu,
  /лазарет № 17[^.]{0,80}(?:установлен|место службы)/iu,
  /окончательно разочаровался в революции/iu,
  /Дункан (?:погубила|стала причиной)/iu,
  /точно 3 октября 1921/iu,
]) {
  if (forbidden.test(readerText)) throw new Error(`forbidden public claim matched: ${forbidden}`);
}

for (const required of [
  'лазарет № 17 нельзя называть установленным местом формальной службы',
  'Фраза «Есенин оставил семью ради поэзии»',
  'ещё не является готовым свидетельством зрелой веры',
  'не принадлежит биографу',
  'видимо, 3 октября 1921 года',
]) {
  if (!readerText.includes(required)) throw new Error(`required public boundary is missing: ${required}`);
}

if (article.cover !== 'https://upload.wikimedia.org/wikipedia/commons/d/de/Esenin1914.jpg') {
  throw new Error('unexpected cover file');
}
if (article.cardCover !== article.cover) throw new Error('card cover diverges from the approved cover');
if (article.coverSourceUrl !== 'https://commons.wikimedia.org/wiki/File:Esenin1914.jpg') {
  throw new Error('cover source page changed');
}
if (!article.coverCredit?.includes('Public domain')) throw new Error('cover credit lost public-domain statement');
if (article.slug !== slug || article.id !== 'essay-yesenin-biography-part-one') {
  throw new Error('public article identity changed');
}
if (article.series?.part !== 1 || article.series.total !== 2) {
  throw new Error('Yesenin biography series contract changed');
}

console.log(
  `Yesenin Part I public: ${sections.length} sections, ${authored.length} blocks, ${sources.length} sources, ${images.length} in-body images`,
);
