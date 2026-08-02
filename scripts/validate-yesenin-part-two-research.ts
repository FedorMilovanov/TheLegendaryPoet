import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

const researchDir = 'docs/research';
const essayDir = 'src/data/essays';

const currentDrafts = [
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

type DraftName = (typeof currentDrafts)[number];

const readDraft = (name: DraftName): string => {
  const path = join(researchDir, name);
  if (!existsSync(path)) throw new Error(`missing current Yesenin Part II draft: ${path}`);
  return readFileSync(path, 'utf8');
};

const drafts = new Map<DraftName, string>();
for (const name of currentDrafts) drafts.set(name, readDraft(name));

for (const [name, text] of drafts) {
  if (!text.includes('НЕ ПУБЛИКОВАТЬ')) {
    throw new Error(`${name}: lost explicit non-public marker`);
  }
  if (!/(Контролирующ|Основание:)/u.test(text)) {
    throw new Error(`${name}: controlling research basis is not named`);
  }
  if (!/Gate/iu.test(text)) {
    throw new Error(`${name}: unresolved publication/source gate list is missing`);
  }
  if (/Публичный route:\s*(?:разрешён|открыт)/iu.test(text)) {
    throw new Error(`${name}: public route was authorised inside a research draft`);
  }
  if (/datePublished|publicationDate/iu.test(text)) {
    throw new Error(`${name}: production publication date entered a research draft`);
  }
}

const chapter1 = drafts.get('YESENIN_PART_II_DRAFT_CH01_1921_V01_2026-08.md')!;
for (const required of [
  'yes2-1921-ionov-polemic-letter-before-sep15',
  'yes2-1921-pir-editor-letter-before-sep15',
  'yes2-1921-oct17-poster',
  'yes2-1921-oct17-machtet-diary',
  'коллективные полемические письма',
]) {
  if (!chapter1.includes(required)) throw new Error(`chapter 1 lost source-gap closure: ${required}`);
}
for (const retired of ['yes2-1921-oct17-poster-correction', 'подписывал новые программные тексты']) {
  if (chapter1.includes(retired)) throw new Error(`chapter 1 restored retired wording/source: ${retired}`);
}

const chapter2 = drafts.get('YESENIN_PART_II_DRAFT_CH02_DUNCAN_MEETING_V01_2026-08.md')!;
for (const required of [
  'осенью 1921 года, вероятнее всего в начале октября',
  'yes2-marriage-date-1922-05-02',
  'yes2-foreign-passport-5072-1922-05-08',
  'yes2-departure-moscow-germany-1922-05-10',
  'Свадебная фотография подтверждает день события на академическом уровне, но не заменяет регистрационную запись',
]) {
  if (!chapter2.includes(required)) throw new Error(`chapter 2 lost qualification/source boundary: ${required}`);
}
if (/Для большой биографии достаточно следующей границы:\s*в начале октября 1921/iu.test(chapter2)) {
  throw new Error('chapter 2 conclusion overstates the first-meeting date');
}

const chapter5 = drafts.get('YESENIN_PART_II_DRAFT_CH05_EUROPE_ROUTE_V01_2026-08.md')!;
for (const required of [
  'Гаага остаётся целью дипломатической просьбы',
  'Рим — планом из письма',
  'Лондон, названный в раннем интервью как часть будущей поездки, не получает статуса совершённой остановки',
]) {
  if (!chapter5.includes(required)) throw new Error(`chapter 5 lost route boundary: ${required}`);
}

const chapter6 = drafts.get('YESENIN_PART_II_DRAFT_CH06_US_PARTIAL_V02_2026-08.md')!;
for (const required of [
  'юридическая депортация не доказана',
  '3 февраля 1923 года',
  'yes2-work-yarmolinsky-project',
  'yes2-work-strana-new-york-reading',
]) {
  if (!chapter6.includes(required)) throw new Error(`chapter 6 lost required boundary/source: ${required}`);
}
for (const retiredAlias of [
  'yes-us-mani-leib-reading-1923-01-27-28',
  'ye2-feb-yarmolinsky-book-project-1922',
]) {
  if (chapter6.includes(retiredAlias)) throw new Error(`chapter 6 still uses retired alias: ${retiredAlias}`);
}

const chapter10 = drafts.get('YESENIN_PART_II_DRAFT_CH10_IMAGISM_V01_2026-08.md')!;
if (!chapter10.includes('Полное сравнение вариантов требует обоих физических выпусков')) {
  throw new Error('chapter 10 lost the two-physical-witness boundary');
}
if (!chapter10.includes('Другие участники не признали за этим письмом окончательной власти')) {
  throw new Error('chapter 10 turned the Pravda letter into an uncontested group closure');
}

const chapter11 = drafts.get('YESENIN_PART_II_DRAFT_CH11_BENISLAVSKAYA_V01_2026-08.md')!;
for (const required of [
  'не получил полный текст всех четырнадцати писем Бениславской',
  'yes2-return-benislavskaya-sep8',
  'Опубликованные фрагменты происходят из копийной традиции',
]) {
  if (!chapter11.includes(required)) throw new Error(`chapter 11 lost required boundary/source: ${required}`);
}
if (chapter11.includes('ye2-benislavskaya-note-1923-09-08')) {
  throw new Error('chapter 11 still uses the duplicate 8 September note alias');
}

const chapter13 = drafts.get('YESENIN_PART_II_DRAFT_CH13_LATE_POETRY_V01_2026-08.md')!;
if (!/диагноз/iu.test(chapter13) || !/покаян/iu.test(chapter13)) {
  throw new Error('chapter 13 lost diagnosis/repentance interpretation boundaries');
}

const chapter14 = drafts.get('YESENIN_PART_II_DRAFT_CH14_SOFIA_CLINIC_PARTIAL_V01_2026-08.md')!;
for (const required of [
  'не называет в опубликованной формуле полный диагноз',
  'не является медицинским диагнозом',
  'практические действия не опровергают тяжесть кризиса',
]) {
  if (!chapter14.includes(required)) throw new Error(`chapter 14 lost medical boundary: ${required}`);
}

const researchFiles = readdirSync(researchDir);
for (const forbiddenDraft of [/YESENIN_PART_II_DRAFT_CH15/iu, /YESENIN_PART_II_DRAFT_CH16/iu]) {
  const match = researchFiles.find((name) => forbiddenDraft.test(name));
  if (match) throw new Error(`forensic/final chapter prose appeared prematurely: ${match}`);
}

const walkFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walkFiles(path) : [path];
  });

const essayFiles = walkFiles(essayDir);
for (const file of essayFiles) {
  const normalizedName = basename(file).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (/yesenin(?:parttwo|part2|biographyparttwo|biographypart2)/u.test(normalizedName)) {
    throw new Error(`premature Yesenin Part II essay module exists: ${file}`);
  }
}

const essayIndex = readFileSync(join(essayDir, 'index.ts'), 'utf8');
for (const forbiddenRegistration of [
  'yeseninPartTwo',
  'essay-yesenin-biography-part-two',
  'sergei-yesenin-1921-1925',
]) {
  if (essayIndex.includes(forbiddenRegistration)) {
    throw new Error(`premature Yesenin Part II registration: ${forbiddenRegistration}`);
  }
}

console.log(
  `Yesenin Part II research: ${currentDrafts.length} non-public drafts; chapters 15–16 withheld; route/data module absent; uncertainty, source-pair, legal-bridge, immigration, source-type and medical boundaries intact.`,
);
