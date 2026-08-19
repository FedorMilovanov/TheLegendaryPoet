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
function declaredStatus(text: string): string {
  return text.match(/^Статус:\s*\*\*(.+?)\*\*/mu)?.[1] ?? '';
}

const arkhangelsk = requireFile('docs/research/SIMONOV_SON_ARTILLERISTA_ARKHANGELSK_RECEPTION_2026-08.md', 'Arkhangelsk reception gate');
requireMarkers('Arkhangelsk reception', arkhangelsk, [
  '28 ноября 1941 года', '3 декабря 1941 года', '4 декабря 1941 года',
  'Сергея Николаевича Плотникова', '7 декабря 1941 года',
  'не используется как publication fact',
  'institutional report / independent primary or theatre-object corroboration pending',
]);
if (/first performance.*verified|первое публичное исполнение.*verified/iu.test(declaredStatus(arkhangelsk))) {
  throw new Error('Arkhangelsk first-performance status overstated');
}

const award = requireFile('docs/research/SIMONOV_LOSKUTOV_AWARD_OBJECT_LOCATOR_2026-08.md', 'Loskutov award locator');
requireMarkers('Loskutov award locator', award, [
  'official object locator recovered / scan-text inspection still pending',
  '10800112', 'ЦАМО, ф. 33, оп. 682524, д. 34, л. 246–247',
  '50998202', '50678280', '31.7.41', '6 суток', '500–600 метров',
]);
if (/scan(?:-text)?\s+(?:directly\s+)?verified/iu.test(declaredStatus(award))) {
  throw new Error('Award locator falsely upgraded to scan in declared status');
}

const pravda1966 = requireFile('docs/research/SIMONOV_LOSKUTOV_1966_PRESS_WITNESS_2026-08.md', '1966 Pravda witness');
requireMarkers('1966 Pravda witness', pravda1966, [
  'exact issue/article locator recovered / scan inspection pending',
  'Человек из поэмы', '22 марта 1966', '№ 81 (17398)', 'страница 4',
  'pravda-1966-no.-81-17398-22-mar-1966',
  'не пересказывать содержание статьи как будто оно прочитано',
]);

const sakhalin = requireFile('docs/research/SIMONOV_LOSKUTOV_SAKHALIN_ARCHIVE_GATE_2026-08.md', 'Sakhalin archive gate');
requireMarkers('Sakhalin archive gate', sakhalin, [
  'high-value correspondence lead / museum item inspection pending',
  'Иван Елисеевич Солодовников', '1969 года', 'Музейно-мемориальный комплекс `Победа`',
  'Mmk-info@sakhalin.gov.ru', 'не item-level музейная опись',
]);
if (/meeting.*verified|личн(?:ая|ую) встреч(?:а|у).*подтвержден/iu.test(declaredStatus(sakhalin))) {
  throw new Error('Sakhalin gate declared an unverified personal meeting');
}

const vladivostok = requireFile('docs/research/SIMONOV_LOSKUTOV_VLADIVOSTOK_SCHOOL_ARCHIVE_GATE_2026-08.md', 'Vladivostok school gate');
requireMarkers('Vladivostok school gate', vladivostok, [
  'official school fund located / opis and item inspection pending',
  'Фонд Р-1510', 'Владивостокская школа-интернат № 2', '1961–1967',
  'arhivpk@bk.ru', 'chit.zal.gapk@mail.ru',
]);
// Current sending state is controlled by SIMONOV_REGIONAL_ARCHIVE_ACQUISITION_INQUIRIES_2026-08.md;
// this older file remains the discovery/history layer only.

const author = requireFile('docs/research/SIMONOV_AUTHOR_WITNESS_COLLATION_2026-08.md', 'author witness collation');
requireMarkers('author witness collation', author, [
  'author-witness strengthened / two textual conflicts explicitly gated',
  '28 ноября 1941 года', '5 декабря утром', 'Давидом Ортенбергом',
  'сразу была принята в номер', 'вымышленное имя Лёнька',
  'вымышленные фамилии Деева и Петрова', 'командир полка', 'комиссар полка',
  '`Иваном Михайловичем`', '**Алексеем Лоскутовым**',
]);

const shpl = requireFile('docs/research/SIMONOV_RED_STAR_SHPL_SCAN_GATE_2026-08.md', 'Red Star SHPL gate');
requireMarkers('Red Star SHPL gate', shpl, [
  'complete 1941 SHPL corpus verified / global p.3 content direct-verified via exact №288 PDF / exact SHPL child node and institutional comparison pending',
  '25135', '36558', '№ 1 (1 января) — № 309 (31 декабря)',
  'декабрь: **№ 283–309**', 'unknown / discover, do not infer',
  '№288 (5043)', 'global Red Star page-content gate is closed',
  'Военно-исторический журнал', 'Издание Министерства обороны России',
  '7 декабря. С. 3', 'institutional provenance/page-identity cross-check',
  '`SHPL p.3 уже просмотрена редакцией`',
]);
if (/SHPL p\.3.*(?:verified|просмотрена редакцией)/iu.test(declaredStatus(shpl))) {
  throw new Error('SHPL gate falsely declares holder-specific page inspection');
}

const page3 = requireFile('docs/research/SIMONOV_RED_STAR_PAGE_3_SCHOLARLY_GATE_2026-08.md', 'Red Star page-3 scholarly gate');
requireMarkers('Red Star page-3 scholarly gate', page3, [
  'official military-history scholarly p.3 locator independently confirmed by direct №288 page inspection',
  'КОЛОБОВ Евгений Юрьевич', 'примечании **39**', '7 декабря. С. 3',
  'A+ direct visual object', 'six-column', 'following p.4',
  'independent institutional scholarly corroboration',
]);
if (/direct newspaper scan still pending|direct object inspection required for page verification and columns/iu.test(declaredStatus(page3))) {
  throw new Error('Page-3 scholarly gate retained a stale pre-inspection status');
}

const addendum2 = requireFile('docs/research/SIMONOV_SON_ARTILLERISTA_SOURCE_ADDENDUM_2026-08.md', 'second-pass source addendum');
requireMarkers('second-pass source addendum', addendum2, [
  'second-pass addendum / does not mutate the closed 40-row ledger',
  'A2-01', '10800112', 'A2-07', '№ 288 (5043)', 'A2-09', 'Человек из поэмы', 'A2-13', 'ГПИБ / SHPL',
]);

console.log('Simonov research follow-ups: award/1966/archive gates remain open; Red Star №288 p.3 is direct-page verified, scholarly-corroborated, and SHPL remains a holder-specific institutional provenance cross-check.');