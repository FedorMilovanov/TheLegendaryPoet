import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_SON_ARTILLERISTA_CLAIM_MATRIX_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov claim matrix missing: ${path}`);
const matrix = readFileSync(path, 'utf8');

const required = [
  'C06', '31 июля 1941 г.', 'record `10800112`', 'визуальный просмотр record `10800112`',
  'C09', 'примерно 3 км', 'C10', 'около 2 км',
  'C16', 'Группа потребовала огонь собственной артиллерии непосредственно по занимаемой высоте',
  'C17', 'командир полка посчитал, что это ошибка, и переспросил',
  'C21', 'Задание/корректировка длились 6 суток',
  'C26', 'same-edition 1982 OCR Симонова: `Иван Михайлович`', 'Primorye/Sanjara 1984 delivery + family provenance',
  'strong unresolved two-lineage conflict', '**имя в основной narrative не ставить**',
  'C29', '`Патриот Родины` опубликовал поэму 3 декабря 1941',
  'C30', '3 декабря — безусловно первая публикация',
  'C34', '`Красная звезда` напечатала поэму 7 декабря 1941',
  '**A+ direct page verified**',
  'C35', '**A+ direct issue identity**',
  'C36', '`Сын артиллериста` опубликован на с.3 №288; занимает шесть колонок и заканчивается там же',
  '9e644dd79fd9d22199ec9cef158d2f1a9cf5ce5efbdc60f2eb3e578c8999e229',
  'на p.4 продолжения нет',
  '`Красная звезда` №288 p.3 теперь direct-inspected',
  'institutional scan comparison и reuse rights остаются отдельными вопросами',
  'C41', 'письмо ... в опубликованной Симоновым передаче',
  'C45', 'research-only',
  'C46', 'редакционная реконструкция; не документальная фотография',
  'Direct object supersedes delivery copy',
  'Father identity remains fail-closed',
];
for (const marker of required) {
  if (!matrix.includes(marker)) throw new Error(`Simonov claim matrix boundary disappeared: ${marker}`);
}

const claimRows = matrix.match(/^\| C\d{2} \|/gmu)?.length ?? 0;
if (claimRows !== 48) throw new Error(`Simonov claim matrix drifted: expected 48 rows, found ${claimRows}`);

for (const stale of [
  'A/B scholarly page citation; direct scan pending',
  'не писать `мы визуально проверили p.3`',
  'Страницу 3 `Красной звезды` можно называть только с provenance scholarly citation',
  '`Красная звезда` №288 (5043), 07.12.1941 — direct **p.3 + column/continuation inspection**',
  'Ключевые object gaps: `Красная звезда` p.3',
]) {
  if (matrix.includes(stale)) throw new Error(`Simonov claim matrix retained stale Red Star state: ${stale}`);
}

for (const forbidden of [
  '10800112 direct scan verified',
  '3 декабря 1941 года несомненно была первой публикацией',
  'архивные фотографии свободны для перепубликации',
  'Алексей Михайлович окончательно установлен',
  'Иван Михайлович окончательно установлен',
  'institutional provenance closed',
  'facsimile reuse rights cleared',
]) {
  if (matrix.includes(forbidden)) throw new Error(`Simonov claim matrix overstates an open gate: ${forbidden}`);
}

console.log(`Simonov claim matrix: ${claimRows} claims pinned; Red Star №288 p.3 is direct-inspected while provenance/reuse stay separate; father identity and remaining P0 objects remain fail-closed.`);
