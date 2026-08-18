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

console.log(
  'Simonov follow-up gates: Arkhangelsk chronology pinned; award record 10800112 locator pinned with scan pending; Pravda 22.03.1966 issue/article locator pinned with page pending.',
);
