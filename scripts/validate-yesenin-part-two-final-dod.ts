import { getEssayBySlug } from '../src/data/essays/index';

const essay = getEssayBySlug('sergei-yesenin-1921-1925');
if (!essay) throw new Error('Yesenin Part II is not registered');

const words = essay.blocks
  .flatMap((block) => {
    const value = block as Record<string, unknown>;
    return ['text', 'heading', 'caption', 'note', 'quote', 'lines']
      .flatMap((key) => (Array.isArray(value[key]) ? value[key] as unknown[] : [value[key]]))
      .filter((item): item is string => typeof item === 'string');
  })
  .reduce((sum, text) => sum + (text.match(/[\p{L}\p{N}]+/gu)?.length ?? 0), 0);
if (words < 8500 || words > 11500) throw new Error(`final word scope violated: ${words}`);

const expectedHeadings = [
  '1921: слава, групповая машина и внутренняя трещина',
  'Айседора Дункан: встреча после снятия легенды',
  'Брак, паспорт и публичная пара',
  'Берлин: книги, деньги и литературная работа',
  'Европа: совершённый маршрут и объявленные планы',
  'Америка: гастрольная машина и отчуждение',
  'Что действительно было написано за границей',
  'Возвращение: Москва после Запада',
  '«Москва кабацкая»: роль, рынок и документированные эпизоды',
  'Имажинизм после единства',
  'Галина Бениславская: рукописи и издательские дела',
  'Кавказ и воображаемая Персия',
  'Поздняя поэзия: ясность без посмертного диагноза',
  'Софья Толстая и клиника: попытка порядка',
  'Декабрь 1925 года: что устанавливают документы',
  'После легенды: дар и ответственность',
] as const;
const headings = essay.blocks.filter((block) => block.type === 'section').map((block) => block.heading);
if (headings.length !== expectedHeadings.length || expectedHeadings.some((heading, i) => headings[i] !== heading)) {
  throw new Error(`canonical 16-section order changed: ${headings.join(' | ')}`);
}

const sources = essay.sources ?? [];
const sourcesById = new Map(sources.map((source) => [source.id, source]));
if (sourcesById.size < 75 || sourcesById.size > 110) {
  throw new Error(`final source-unit scope violated: ${sourcesById.size}`);
}
const primaryOrResearch = sources.filter((source) => source.kind === 'primary' || source.kind === 'research').length;
if (primaryOrResearch < 45) throw new Error(`strong primary/research support fell below 45: ${primaryOrResearch}`);

const expectedLetterIds = [
  'yes2-letter-klyuev-1922-05-05',
  'yes2-letter-schneider-1922-06-21',
  'yes2-letter-mariengof-1922-07-09',
  'yes2-letter-schneider-1922-07-13',
  'yes2-letter-benislavskaya-1924-10-29',
  'yes2-letter-benislavskaya-1924-after-11-02',
  'yes2-letter-benislavskaya-1925-01-20',
  'yes2-letter-chagin-1925-03',
  'yes2-letter-yesenina-1925-06-16',
  'yes2-letter-evdokimov-1925-12-06',
  'yes2-letter-ehrlich-1925-12-07',
  'yes2-letter-yesenina-1925-12-07-13',
  'yes2-letter-zeitlin-1925-12-13',
] as const;
for (const id of expectedLetterIds) {
  const source = sourcesById.get(id);
  if (!source) throw new Error(`missing exact expansion letter: ${id}`);
  if (!source.url?.startsWith('https://www.museum-esenin.ru/esenin/pisma/')) {
    throw new Error(`expansion letter lost official museum URL: ${id}`);
  }
  if (source.kind !== 'primary') throw new Error(`expansion letter is not primary: ${id}`);
}

const citedIds = new Set<string>();
for (const block of essay.blocks) {
  if (!('sourceIds' in block)) continue;
  for (const id of block.sourceIds ?? []) citedIds.add(id);
}
for (const id of expectedLetterIds) {
  if (!citedIds.has(id)) throw new Error(`exact expansion letter is bibliography-only dead data: ${id}`);
}

const noUrlCited = [...citedIds]
  .filter((id) => sourcesById.get(id) && !sourcesById.get(id)?.url)
  .sort();
const expectedNoUrl = [
  'yes2-aronson-receipt-1925-12-16',
  'yes2-medical-facsimile-1925',
].sort();
if (noUrlCited.join('|') !== expectedNoUrl.join('|')) {
  throw new Error(`unexpected cited no-URL set: ${noUrlCited.join(', ')}`);
}

const images = essay.blocks.filter((block) => block.type === 'image');
if (images.length < 16 || images.length > 24) throw new Error(`final visual scope violated: ${images.length}`);
const documentary = images.filter((image) => image.kind === 'archive' || image.kind === 'document');
if (documentary.length < 10) throw new Error(`documentary visual floor violated: ${documentary.length}`);
const imageSources = images.map((image) => image.sourceUrl ?? '');
if (new Set(imageSources).size !== images.length) throw new Error('body documentary visual provenance contains duplicates');
for (const [index, image] of images.entries()) {
  if (!image.sourceUrl?.startsWith('https://commons.wikimedia.org/wiki/File:')) {
    throw new Error(`body image ${index + 1} lacks exact Commons file provenance`);
  }
  if (!image.credit?.includes('общественное достояние')) {
    throw new Error(`body image ${index + 1} lost explicit public-domain credit`);
  }
  if (/тело|петл|rope|autopsy|посмертн(?:ая|ое) фотограф/iu.test(`${image.alt} ${image.caption} ${image.src}`)) {
    throw new Error(`body image ${index + 1} violates dignity boundary`);
  }
}

const expectedCover = 'https://commons.wikimedia.org/wiki/File:Сергей_Есенин_в_1923_году.jpg';
if (essay.coverSourceUrl !== expectedCover) throw new Error(`unexpected final cover provenance: ${essay.coverSourceUrl ?? '<none>'}`);
if (imageSources.includes(expectedCover)) throw new Error('dedicated Part II cover is reused as a body visual');
if (!essay.coverCredit?.includes('общественное достояние')) throw new Error('dedicated Part II cover lost public-domain credit');

const visualSourceIds = sources
  .filter((source) => source.id?.startsWith('yes2-visual-'))
  .map((source) => source.id as string);
if (visualSourceIds.length !== 13) throw new Error(`expected 13 new visual provenance source units, found ${visualSourceIds.length}`);
for (const id of visualSourceIds) {
  const source = sourcesById.get(id)!;
  if (!source.url?.startsWith('https://commons.wikimedia.org/wiki/File:')) {
    throw new Error(`visual source unit lost exact Commons provenance: ${id}`);
  }
}
const coverSource = sourcesById.get('yes2-cover-esenin-1923');
if (!coverSource || coverSource.url !== expectedCover) throw new Error('dedicated cover source unit is missing or drifted');

const articleText = essay.blocks.map((block) => {
  if ('text' in block) return block.text;
  if (block.type === 'note') return `${block.claim} ${block.text}`;
  return '';
}).join('\n');
for (const boundary of [
  'письмо подтверждает именно ожидание автора на конкретную дату',
  'будущее время нельзя читать как готовую хронологию',
  'из неё нельзя восстанавливать диагноз',
  'Он устанавливает только реальный план переезда',
  'честнее оставить архивный адрес без ссылки',
]) {
  if (!articleText.includes(boundary)) throw new Error(`final expansion lost evidence boundary: ${boundary}`);
}

console.log(
  `Yesenin Part II final DoD: ${words} words; ${sourcesById.size} source units; ${primaryOrResearch} primary/research; ${citedIds.size} cited source units; ${images.length} visuals; ${documentary.length} documentary; 2 honest no-URL objects preserved.`,
);
