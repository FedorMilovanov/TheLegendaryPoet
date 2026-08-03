import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { yeseninPartTwoPublic } from '../src/data/essays/yeseninPartTwoPublic';
import { essays } from '../src/data/essays/index';

const researchDir = 'docs/research';
const archivedDrafts = [
  'YESENIN_PART_II_DRAFT_CH01_1921_V01_2026-08.md',
  'YESENIN_PART_II_DRAFT_CH02_DUNCAN_MEETING_V01_2026-08.md',
  'YESENIN_PART_II_DRAFT_CH03_MARRIAGE_PASSPORT_PUBLIC_COUPLE_V01_2026-08.md',
  'YESENIN_PART_II_DRAFT_CH04_BERLIN_V01_2026-08.md',
  'YESENIN_PART_II_DRAFT_CH05_EUROPE_ROUTE_V01_2026-08.md',
  'YESENIN_PART_II_DRAFT_CH06_US_PARTIAL_V02_2026-08.md',
  'YESENIN_PART_II_DRAFT_CH07_FOREIGN_WORK_V01_2026-08.md',
  'YESENIN_PART_II_DRAFT_CH08_RETURN_1923_V01_2026-08.md',
  'YESENIN_PART_II_DRAFT_CH09_MOSKVA_KABATSKAYA_V01_2026-08.md',
  'YESENIN_PART_II_DRAFT_CH10_IMAGISM_V01_2026-08.md',
  'YESENIN_PART_II_DRAFT_CH11_BENISLAVSKAYA_V01_2026-08.md',
  'YESENIN_PART_II_DRAFT_CH12_CAUCASUS_V01_2026-08.md',
  'YESENIN_PART_II_DRAFT_CH13_LATE_POETRY_V01_2026-08.md',
  'YESENIN_PART_II_DRAFT_CH14_SOFIA_CLINIC_PARTIAL_V01_2026-08.md',
] as const;

for (const name of archivedDrafts) {
  const path = join(researchDir, name);
  if (!existsSync(path)) throw new Error(`missing controlled research draft: ${path}`);
  const text = readFileSync(path, 'utf8');
  if (!text.includes('НЕ ПУБЛИКОВАТЬ')) {
    throw new Error(`${name}: research draft lost its non-public archive marker`);
  }
  if (!/(Gate|gate|гейт|Контролирующ|Основание:)/u.test(text)) {
    throw new Error(`${name}: controlling evidence boundary is missing`);
  }
}

const readRequired = (name: string): string => {
  const path = join(researchDir, name);
  if (!existsSync(path)) throw new Error(`missing final reader-safe chapter: ${path}`);
  return readFileSync(path, 'utf8');
};

const chapter15 = readRequired('YESENIN_PART_II_DRAFT_CH15_DECEMBER_1925_FINAL_2026-08.md');
const chapter16 = readRequired('YESENIN_PART_II_DRAFT_CH16_FINAL_SYNTHESIS_2026-08.md');

for (const marker of [
  'FINAL READER-SAFE DRAFT',
  'механизм прекращения лечения 21 декабря',
  'не определяет себя как судебное или медицинское признание',
  'есть пробел — значит доказано убийство',
  'В читательской статье не используются фотографии тела',
  'глава пригодна для переноса в типизированный читательский модуль',
]) {
  if (!chapter15.includes(marker)) throw new Error(`chapter 15 lost required boundary: ${marker}`);
}
for (const unsafe of [
  /Есенина доказанно убили/iu,
  /точно сбежал из клиники/iu,
  /бесспорная предсмертная записка Эрлиху/iu,
  /фотографи[яи] тела[^\n]{0,80}(?:используется|публикуется)/iu,
]) {
  if (unsafe.test(chapter15)) throw new Error(`chapter 15 contains an unsafe conclusion: ${unsafe}`);
}

for (const marker of [
  'MORAL/THEOLOGICAL REVIEW COMPLETE',
  'Разрушение не является доказательством избранности',
  'совершенный суд над сердцем принадлежит Богу',
  'Дар не оправдывает разрушение; разрушение не уничтожает дар',
  'глава пригодна для типизированного читательского модуля',
]) {
  if (!chapter16.includes(marker)) throw new Error(`chapter 16 lost required boundary: ${marker}`);
}
for (const unsafe of [
  /Есенин (?:спасён|осуждён Богом|в аду|в раю)/iu,
  /страдание оправдывает/iu,
  /талант освобождает от ответственности/iu,
]) {
  if (unsafe.test(chapter16)) throw new Error(`chapter 16 contains an impermissible judgment: ${unsafe}`);
}

const essay = yeseninPartTwoPublic;
if (essay.id !== 'essay-yesenin-biography-part-two') throw new Error('unexpected Part II essay id');
if (essay.slug !== 'sergei-yesenin-1921-1925') throw new Error('unexpected Part II slug');
if (essay.series?.part !== 2 || essay.series.total !== 2) {
  throw new Error('Yesenin biography series metadata is not 2 of 2');
}
if (essay.readTime < 45) throw new Error('Part II read time was compressed below longform scope');
if (essay.coverKind !== 'archive') throw new Error('Part II cover must remain an archive image');
if (!essay.coverSourceUrl?.includes('commons.wikimedia.org/wiki/File:Esenin1925.jpg')) {
  throw new Error('Part II cover lost its public-domain provenance URL');
}
if (!essay.coverCredit?.includes('общественное достояние')) {
  throw new Error('Part II cover lost its public-domain credit');
}

const registered = essays.filter((item) => item.slug === essay.slug);
if (registered.length !== 1 || registered[0] !== essay) {
  throw new Error('Part II is not registered exactly once in the canonical essay catalog');
}

const expectedHeadings = [
  '1921: слава, групповая машина и внутренняя трещина',
  'Айседора Дункан: встреча после снятия легенды',
  'Брак, паспорт и публичная пара',
  'Берлин: книги, деньги и литературная работа',
  'Европа: совершённый маршрут и объявленные планы',
  'Америка: гастрольная машина и отчуждение',
  'Что действительно было написано за границей',
  'Возвращение: Москва после Запада',
  '«Москва кабацкая»: роль, рынок и реальная зависимость',
  'Имажинизм после единства',
  'Галина Бениславская: невидимая редакция',
  'Кавказ и воображаемая Персия',
  'Поздняя поэзия: ясность без посмертного диагноза',
  'Софья Толстая и клиника: попытка порядка',
  'Декабрь 1925 года: что устанавливают документы',
  'После легенды: дар и ответственность',
] as const;
const headings = essay.blocks
  .filter((block) => block.type === 'section')
  .map((block) => block.heading);
if (headings.length !== expectedHeadings.length) {
  throw new Error(`expected 16 sections, found ${headings.length}`);
}
for (const heading of expectedHeadings) {
  if (!headings.includes(heading)) throw new Error(`missing final Part II section: ${heading}`);
}

const proseBlocks = essay.blocks.filter(
  (block) => block.type === 'lead' || block.type === 'paragraph' || block.type === 'note',
);
if (proseBlocks.length < 45) {
  throw new Error(`Part II is too compressed: ${proseBlocks.length} prose blocks`);
}

const articleText = [essay.title, essay.subtitle ?? '', essay.excerpt]
  .concat(
    essay.blocks.map((block) => {
      if ('text' in block) return block.text;
      if (block.type === 'section') return block.heading;
      if (block.type === 'image') return `${block.alt} ${block.caption} ${block.credit ?? ''}`;
      return '';
    }),
  )
  .join('\n');
if (articleText.length < 26000) {
  throw new Error(`Part II reader text is below the longform floor: ${articleText.length} characters`);
}
for (const marker of [
  'юридической депортации',
  'не доказывают физического присутствия автора в Иране',
  'механизм окончания лечения 21 декабря',
  'Вопрос не равен доказательству',
  'официальная версия не имела документов» неверно',
  'совершенный суд над сердцем принадлежит Богу',
  'Главное произведение Есенина — не его смерть',
]) {
  if (!articleText.includes(marker)) throw new Error(`Part II lost a required reader boundary: ${marker}`);
}
for (const unsafe of [
  /Есенина (?:доказанно|точно) убили/iu,
  /Дункан (?:погубила|уничтожила) Есенина/iu,
  /Есенин (?:побывал|жил) в (?:Персии|Иране)/iu,
  /клиника[^.]{0,100}точный диагноз/iu,
  /вне всяких сомнений[^.]{0,100}предсмертн/iu,
]) {
  if (unsafe.test(articleText)) throw new Error(`Part II contains an unsupported claim: ${unsafe}`);
}

const myths = essay.blocks.filter((block) => block.type === 'note' && block.variant === 'myth');
if (myths.length !== 4) throw new Error(`expected 4 restrained myth checks, found ${myths.length}`);
const reflections = essay.blocks.filter((block) => block.type === 'reflection');
if (reflections.length !== 1) throw new Error(`expected one concentrated reflection, found ${reflections.length}`);

const images = essay.blocks.filter((block) => block.type === 'image');
if (images.length < 3) throw new Error(`expected at least 3 rights-cleared archive images, found ${images.length}`);
for (const [index, image] of images.entries()) {
  if (image.kind !== 'archive') throw new Error(`image ${index + 1} is not classified as archive`);
  if (!image.sourceUrl?.startsWith('https://commons.wikimedia.org/wiki/File:')) {
    throw new Error(`image ${index + 1} lacks Wikimedia Commons provenance`);
  }
  if (/тело|петл|rope|autopsy|посмертн(?:ая|ое) фотограф/iu.test(`${image.src} ${image.alt} ${image.caption}`)) {
    throw new Error(`image ${index + 1} violates the dignity/forensic visual boundary`);
  }
}

const sourceIds = new Set(
  (essay.sources ?? []).map((source) => source.id).filter((id): id is string => Boolean(id)),
);
if (sourceIds.size < 14) throw new Error(`Part II bibliography is too small: ${sourceIds.size} stable ids`);
let citationCount = 0;
for (const [index, block] of essay.blocks.entries()) {
  if (!('sourceIds' in block) || !block.sourceIds?.length) continue;
  for (const sourceId of block.sourceIds) {
    citationCount += 1;
    if (!sourceIds.has(sourceId)) {
      throw new Error(`block ${index + 1} cites missing source id: ${sourceId}`);
    }
  }
}
if (citationCount < 70) throw new Error(`Part II citation topology is too sparse: ${citationCount}`);

console.log(
  `Yesenin Part II publication: 16 sections, ${proseBlocks.length} prose blocks, ${citationCount} citations, ${sourceIds.size} sources, ${images.length} public-domain images; documentary, visual and theological boundaries passed.`,
);
