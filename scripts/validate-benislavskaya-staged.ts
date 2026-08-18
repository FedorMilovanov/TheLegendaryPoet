import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { benislavskayaDraft as essay } from '../src/data/essays/benislavskayaDraft';
import { getAllEssays, getEssayBySlug } from '../src/data/essays/index';
import { estimateReadTime } from '../src/utils/readTime';

const published = getAllEssays();
if (getEssayBySlug(essay.slug) || published.some((item) => item.id === essay.id || item.slug === essay.slug)) {
  throw new Error('Benislavskaya staged draft leaked into the canonical public essay catalog');
}

const catalogSource = readFileSync('src/data/essays/index.ts', 'utf8');
if (catalogSource.includes('benislavskayaDraft') || catalogSource.includes(essay.slug)) {
  throw new Error('Benislavskaya staged draft is imported or named by the canonical catalog');
}

const browserPayload = readFileSync('src/data/essays/browserEssayData.ts', 'utf8');
if (browserPayload.includes(essay.slug) || browserPayload.includes(essay.id)) {
  throw new Error('Benislavskaya staged draft leaked into generated browser publication data');
}

if (!essay.kicker?.includes('staged draft')) {
  throw new Error('Benislavskaya draft lost its explicit staged-draft marker');
}

const metadataText = [essay.kicker, essay.title, essay.subtitle, essay.excerpt].filter(Boolean).join('\n');
for (const forbidden of [/редактор без должности/iu, /литературн(?:ый|ого) агент/iu]) {
  if (forbidden.test(metadataText)) {
    throw new Error(`Benislavskaya metadata revived an unsupported occupational label: ${forbidden}`);
  }
}

const expectedCover = '/images/essays/benislavskaya/benislavskaya-editorial-hero.webp';
const expectedCoverSha256 = '0b1f1146f77ce154479042fc9a1afbe00133528eee14f220b4fa74990bd57e48';
if (essay.cover !== expectedCover || essay.cardCover !== expectedCover) {
  throw new Error(`Benislavskaya staged hero drifted: ${essay.cover} / ${essay.cardCover}`);
}
if (essay.coverKind !== 'reconstruction') {
  throw new Error('Benislavskaya staged hero must remain classified as reconstruction');
}
if (essay.coverSourceUrl) {
  throw new Error('Benislavskaya editorial reconstruction must not claim an archival source URL');
}
if (!essay.coverCredit?.includes('редакционная кинематографическая реконструкция')) {
  throw new Error('Benislavskaya staged hero lost its reconstruction disclosure');
}
const coverPath = `public${expectedCover}`;
if (!existsSync(coverPath)) throw new Error(`Benislavskaya staged hero is missing: ${coverPath}`);
const coverSha256 = createHash('sha256').update(readFileSync(coverPath)).digest('hex');
if (coverSha256 !== expectedCoverSha256) {
  throw new Error(`Benislavskaya approved hero bytes changed: ${coverSha256}`);
}

const expectedHeadings = [
  'Знакомство: когда память расходится с календарём',
  'После заграницы: Брюсовский переулок как рабочее пространство',
  'Весна 1924-го: письма как журнал невидимой работы',
  '12 июня 1924 года: роль получает юридическую форму',
  'Осень 1924-го: рукописи едут быстрее автора',
  'Декабрь: деньги, книги и просьба датировать стихи',
  '1925 год: литературная работа ещё продолжается',
  '35, 16, 14, 13: почему числа переписки не складываются автоматически',
  'Дневник: источник, который нельзя превращать в автограф',
  'Разрыв и декабрь 1926-го: не делать трагедию жанром',
  'Что именно она делала — без завышенного титула',
  'Почему эта история важна для самого Есенина',
] as const;
const headings = essay.blocks.filter((block) => block.type === 'section').map((block) => block.heading);
if (headings.length !== expectedHeadings.length || expectedHeadings.some((heading, i) => headings[i] !== heading)) {
  throw new Error(`Benislavskaya staged section order changed: ${headings.join(' | ')}`);
}

const sources = essay.sources ?? [];
if (sources.length !== 13) throw new Error(`Benislavskaya staged source scope changed: ${sources.length}`);
const sourcesById = new Map<string, (typeof sources)[number]>();
for (const source of sources) {
  if (!source.id) throw new Error(`Benislavskaya staged source has no stable id: ${source.title}`);
  if (sourcesById.has(source.id)) throw new Error(`duplicate Benislavskaya staged source id: ${source.id}`);
  sourcesById.set(source.id, source);
}

const citedIds = new Set<string>();
for (const block of essay.blocks) {
  if (!('sourceIds' in block)) continue;
  for (const id of block.sourceIds ?? []) {
    if (!sourcesById.has(id)) throw new Error(`Benislavskaya staged block cites missing source: ${id}`);
    citedIds.add(id);
  }
}
for (const id of sourcesById.keys()) {
  if (!citedIds.has(id)) throw new Error(`Benislavskaya staged bibliography contains uncited source: ${id}`);
}

const expectedStrongSources = [
  'ben-pss-index',
  'ben-pss-letters',
  'ben-pss-business-documents',
  'ben-rgali-business-unit',
  'ben-letopis-t5-k1',
] as const;
for (const id of expectedStrongSources) {
  const source = sourcesById.get(id);
  if (!source) throw new Error(`missing strong Benislavskaya staged source: ${id}`);
  if (!source.url?.startsWith('https://')) throw new Error(`strong Benislavskaya source lost HTTPS provenance: ${id}`);
}

const controllingBook = sourcesById.get('ben-1995-book');
if (!controllingBook?.note?.includes('236–280') || !controllingBook.note.includes('не приобретены')) {
  throw new Error('Benislavskaya controlling 1995-book source no longer discloses the open page-level gate');
}
const diary = sourcesById.get('ben-diary-copy');
if (!diary?.note?.includes('машинописная копия') || !diary.note.includes('Автограф дневника не заявляется')) {
  throw new Error('Benislavskaya diary/copy boundary drifted');
}

const bodyImages = essay.blocks.filter((block) => block.type === 'image');
if (bodyImages.length !== 0) {
  throw new Error('Benislavskaya staged draft gained body visuals before item-level rights approval');
}

const readerText = essay.blocks.map((block) => {
  if ('text' in block) return block.text;
  if (block.type === 'section') return block.heading;
  if (block.type === 'note' && block.variant === 'myth') return `${block.claim} ${block.text}`;
  return '';
}).join('\n');

const words = readerText.match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
if (words < 2000 || words > 5000) throw new Error(`Benislavskaya staged longform scope drifted: ${words} words`);
const expectedReadTime = estimateReadTime(essay.blocks);
if (essay.readTime !== expectedReadTime) {
  throw new Error(`Benislavskaya staged readTime drift: ${essay.readTime} !== ${expectedReadTime}`);
}

for (const boundary of [
  '35 писем, записок и телеграмм',
  'одну дарственную надпись',
  '14 писем Бениславской Есенину',
  '13 пронумерованных единиц',
  '16 позиций',
  'Публикационный gate остаётся честно открытым',
  'машинописная копия',
  'не доказывает самостоятельной редакционной власти',
  'не учреждает современную должность «агента»',
]) {
  if (!readerText.includes(boundary)) throw new Error(`Benislavskaya staged evidence boundary disappeared: ${boundary}`);
}

if (!readerText.includes('16 июля 1925 года') || !readerText.includes('не публикует')) {
  throw new Error('Benislavskaya staged draft lost the qualified 16 July 1925 letter boundary');
}

console.log(
  `Benislavskaya staged DoD: unpublished; ${words} words; ${expectedReadTime} min; ${sourcesById.size} cited source units; approved hero=${coverSha256}; 13↔16↔14 acquisition gate preserved.`,
);
