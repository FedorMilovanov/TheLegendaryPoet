import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_SON_ARTILLERISTA_CLAIM_MATRIX_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov claim matrix missing: ${path}`);

const matrix = readFileSync(path, 'utf8');
const required = [
  'C06',
  '31 июля 1941 г.',
  'record `10800112`',
  'визуальный просмотр record `10800112`',
  'C09',
  'примерно 3 км',
  'C10',
  'около 2 км',
  'C16',
  'открыть огонь непосредственно по занимаемой высоте',
  'C21',
  'Задание/корректировка длились 6 суток',
  'C29',
  '`Патриот Родины` опубликовал поэму 3 декабря 1941',
  'C30',
  '3 декабря — безусловно первая публикация',
  'C34',
  '`Красная звезда` напечатала поэму 7 декабря 1941',
  'C36',
  'не указывать страницу',
  'C41',
  'письмо ... в опубликованной Симоновым передаче',
  'C45',
  'research-only',
  'C46',
  'редакционная реконструкция; не документальная фотография',
  'Direct object supersedes delivery copy',
];

for (const marker of required) {
  if (!matrix.includes(marker)) throw new Error(`Simonov claim matrix boundary disappeared: ${marker}`);
}

const claimRows = matrix.match(/^\| C\d{2} \|/gmu)?.length ?? 0;
if (claimRows < 48) throw new Error(`Simonov claim matrix unexpectedly thin: ${claimRows} rows`);

const forbidden = [
  '10800112 direct scan verified',
  '3 декабря 1941 года несомненно была первой публикацией',
  'страница «Красной звезды» установлена',
  'архивные фотографии свободны для перепубликации',
];
for (const marker of forbidden) {
  if (matrix.includes(marker)) throw new Error(`Simonov claim matrix overstates an open gate: ${marker}`);
}

console.log(`Simonov claim matrix: ${claimRows} claims pinned; primary-object and rights gates remain fail-closed.`);
