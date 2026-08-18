import { existsSync, readFileSync } from 'node:fs';

function requireFile(path: string, label: string): string {
  if (!existsSync(path)) throw new Error(`${label} is missing: ${path}`);
  return readFileSync(path, 'utf8');
}

function requireMarkers(label: string, text: string, markers: string[]): void {
  for (const marker of markers) {
    if (!text.includes(marker)) throw new Error(`${label} boundary disappeared: ${marker}`);
  }
}

const arkhangelskPath = 'docs/research/SIMONOV_SON_ARTILLERISTA_ARKHANGELSK_RECEPTION_2026-08.md';
const arkhangelsk = requireFile(arkhangelskPath, 'Simonov Arkhangelsk reception gate');
requireMarkers('Simonov Arkhangelsk reception', arkhangelsk, [
  '28 ноября 1941 года',
  '3 декабря 1941 года',
  '4 декабря 1941 года',
  'Сергея Николаевича Плотникова',
  '7 декабря 1941 года',
  'не используется как publication fact',
  'institutional report / independent primary or theatre-object corroboration pending',
]);
if (arkhangelsk.includes('первое публичное исполнение безусловно состоялось 4 декабря')) {
  throw new Error('Arkhangelsk gate overstates the still-uninspected first-performance claim');
}

const awardLocatorPath = 'docs/research/SIMONOV_LOSKUTOV_AWARD_OBJECT_LOCATOR_2026-08.md';
const awardLocator = requireFile(awardLocatorPath, 'Simonov Loskutov award object locator');
requireMarkers('Simonov Loskutov award locator', awardLocator, [
  'official object locator recovered / scan-text inspection still pending',
  '10800112',
  'ЦАМО, ф. 33, оп. 682524, д. 34, л. 246–247',
  '50998202',
  '50678280',
  'locator verified, scan not visually inspected here',
  '31.7.41',
  '6 суток',
  '500–600 метров',
]);
if (awardLocator.includes('наградной лист собственноручно проверен')) {
  throw new Error('Award locator falsely claims direct scan inspection');
}
if (awardLocator.includes('scan verified')) {
  throw new Error('Award locator falsely upgrades locator evidence to scan verification');
}

const press1966Path = 'docs/research/SIMONOV_LOSKUTOV_1966_PRESS_WITNESS_2026-08.md';
const press1966 = requireFile(press1966Path, 'Simonov Loskutov 1966 press witness');
requireMarkers('Simonov Loskutov 1966 press witness', press1966, [
  'exact issue/article locator recovered / scan inspection pending',
  'Человек из поэмы',
  '22 марта 1966',
  '№ 81 (17398)',
  'страница 4',
  'pravda-1966-no.-81-17398-22-mar-1966',
  'не пересказывать содержание статьи как будто оно прочитано',
]);
if (press1966.includes('страница 4 визуально просмотрена редакцией')) {
  throw new Error('1966 Pravda gate falsely claims page inspection');
}

const sakhalinPath = 'docs/research/SIMONOV_LOSKUTOV_SAKHALIN_ARCHIVE_GATE_2026-08.md';
const sakhalin = requireFile(sakhalinPath, 'Simonov Loskutov Sakhalin archive gate');
requireMarkers('Simonov Loskutov Sakhalin archive', sakhalin, [
  'high-value correspondence lead / museum item inspection pending',
  'Иван Елисеевич Солодовников',
  '1969 года',
  '2-й Владивостокской школы-интерната',
  'Музейно-мемориальный комплекс `Победа`',
  'Mmk-info@sakhalin.gov.ru',
  'не item-level музейная опись',
  'не реконструировать',
]);
if (sakhalin.includes('личная встреча Лоскутова со школьниками подтверждена')) {
  throw new Error('Sakhalin gate invents a meeting that the discovery source leaves unresolved');
}

const vladivostokSchoolPath = 'docs/research/SIMONOV_LOSKUTOV_VLADIVOSTOK_SCHOOL_ARCHIVE_GATE_2026-08.md';
const vladivostokSchool = requireFile(vladivostokSchoolPath, 'Simonov Loskutov Vladivostok school archive gate');
requireMarkers('Simonov Loskutov Vladivostok school archive', vladivostokSchool, [
  'official school fund located / opis and item inspection pending',
  'Фонд Р-1510',
  'Владивостокская школа-интернат № 2',
  '1961–1967',
  '1 опись',
  'arhivpk@bk.ru',
  'chit.zal.gapk@mail.ru',
  'заявку на выдачу дела отправлять рано',
  'Дата не угадывается по доступности сканов',
  'запрос подготовлен, но **не отправлен**',
]);
if (vladivostokSchool.includes('фотография Лоскутова найдена в деле')) {
  throw new Error('Vladivostok school gate falsely claims an uninspected photo item');
}
if (vladivostokSchool.includes('встреча Лоскутова со школьниками документально подтверждена фондом Р-1510')) {
  throw new Error('Vladivostok school gate falsely upgrades fund existence to event verification');
}

const authorCollationPath = 'docs/research/SIMONOV_AUTHOR_WITNESS_COLLATION_2026-08.md';
const authorCollation = requireFile(authorCollationPath, 'Simonov author witness collation');
requireMarkers('Simonov author witness collation', authorCollation, [
  'author-witness strengthened / two textual conflicts explicitly gated',
  '28 ноября 1941 года',
  '5 декабря утром',
  'Давидом Ортенбергом',
  'сразу была принята в номер',
  'вымышленное имя Лёнька',
  'вымышленные фамилии Деева и Петрова',
  'командир полка',
  'комиссар полка',
  '`Иваном Михайловичем`',
  '**Иван Алексеевич Лоскутов**',
  '**Алексеем Лоскутовым**',
  'Основной article draft правильно **не называет имя отца**',
]);
if (authorCollation.includes('Иван Михайлович — бесспорно отец Ивана Алексеевича Лоскутова')) {
  throw new Error('Author witness collation falsely closes the father-name conflict');
}
if (authorCollation.includes('thefireofthewar.ru доказанно ошибочно заменил командира на комиссара')) {
  throw new Error('Author witness collation overstates commander/commissar variant before print collation');
}

const shplPath = 'docs/research/SIMONOV_RED_STAR_SHPL_SCAN_GATE_2026-08.md';
const shpl = requireFile(shplPath, 'Simonov Red Star SHPL scan gate');
requireMarkers('Simonov Red Star SHPL', shpl, [
  'complete 1941 corpus verified / exact № 288 child node and poem page pending',
  '25135',
  '36558',
  '№ 1 (1 января) — № 309 (31 декабря)',
  'декабрь: **№ 283–309**',
  'unknown / discover, do not infer',
  '№ 288 (5043)',
  'не отмечен как повреждённый',
  'по полным текстам документов при наличии распознанного текста',
]);
if (/exact child node[^\n]*\b37\d{3}\b/ui.test(shpl)) {
  throw new Error('SHPL gate appears to invent an exact child-node ID before direct discovery');
}
if (shpl.includes('Мы просмотрели оригинальную полосу')) {
  throw new Error('SHPL gate falsely claims direct page inspection');
}

const addendumPath = 'docs/research/SIMONOV_SON_ARTILLERISTA_SOURCE_ADDENDUM_2026-08.md';
const addendum = requireFile(addendumPath, 'Simonov second-pass source addendum');
requireMarkers('Simonov source addendum', addendum, [
  'second-pass addendum / does not mutate the closed 40-row ledger',
  'A2-01',
  '10800112',
  'A2-03',
  'Музейно-мемориальный комплекс «Победа»',
  'A2-07',
  '№ 288 (5043)',
  'A2-09',
  'Человек из поэмы',
  'A2-12',
  'A2-13',
  'ГПИБ / SHPL',
  'direct object supersedes locator',
]);

console.log(
  'Simonov follow-up gates: Arkhangelsk chronology pinned; award record 10800112 locator pinned with scan pending; Pravda 22.03.1966 issue/article locator pinned with page pending; Sakhalin correspondence archive remains item-level pending; Vladivostok school fund R-1510 pinned with opis/item inspection pending; author diary chronology and commander/commissar + father-name conflicts pinned; SHPL full 1941 Red Star corpus pinned with №288 child/page discovery pending; second-pass source hierarchy pinned.',
);
