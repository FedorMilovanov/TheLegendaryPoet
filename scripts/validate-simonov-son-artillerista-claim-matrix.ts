import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_SON_ARTILLERISTA_CLAIM_MATRIX_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov claim matrix missing: ${path}`);
const matrix = readFileSync(path, 'utf8');

const required = [
  'C06', '31 июля 1941 г.', 'record `10800112`', 'визуальный просмотр record `10800112`',
  'C09', 'примерно 3 км', 'C10', 'около 2 км',
  'C16', 'открыть огонь непосредственно по занимаемой высоте',
  'C17', 'командир полка посчитал, что это ошибка, и переспросил',
  'C21', 'Задание/корректировка длились 6 суток',
  'C26', 'same-edition 1982 OCR Симонова: `Иван Михайлович`', 'Primorye/Sanjara 1984 delivery + family provenance',
  'strong unresolved two-lineage conflict', '**имя в основной narrative не ставить**',
  'C29', '`Патриот Родины` опубликовал поэму 3 декабря 1941',
  'C30', '3 декабря — безусловно первая публикация',
  'C34', '`Красная звезда` напечатала поэму 7 декабря 1941',
  'C36', '`Сын артиллериста` опубликован на с.3 №288',
  '`Военно-исторический журнал` — Издание Министерства обороны России',
  'A/B scholarly page citation; direct scan pending',
  'не писать `мы визуально проверили p.3`',
  'Страницу 3 `Красной звезды` можно называть только с provenance scholarly citation',
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

for (const forbidden of [
  '10800112 direct scan verified',
  '3 декабря 1941 года несомненно была первой публикацией',
  'Красная звезда p.3 direct scan verified',
  'колонки на с.3 установлены',
  'архивные фотографии свободны для перепубликации',
  'Алексей Михайлович окончательно установлен',
  'Иван Михайлович окончательно установлен',
]) {
  if (matrix.includes(forbidden)) throw new Error(`Simonov claim matrix overstates an open gate: ${forbidden}`);
}

console.log(`Simonov claim matrix: ${claimRows} claims pinned; father identity remains a two-lineage conflict; Red Star p.3 scholarly citation accepted while direct scan/columns remain fail-closed.`);
