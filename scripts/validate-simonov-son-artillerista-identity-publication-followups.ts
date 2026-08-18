import { existsSync, readFileSync } from 'node:fs';

function read(path: string, label: string): string {
  if (!existsSync(path)) throw new Error(`${label} missing: ${path}`);
  return readFileSync(path, 'utf8');
}

function requireAll(label: string, text: string, markers: string[]): void {
  for (const marker of markers) {
    if (!text.includes(marker)) throw new Error(`${label} boundary disappeared: ${marker}`);
  }
}

const fatherPath = 'docs/research/SIMONOV_LOSKUTOV_FATHER_IDENTITY_GATE_2026-08.md';
const father = read(fatherPath, 'Simonov Loskutov father identity gate');
requireAll('Simonov Loskutov father identity', father, [
  'strong conflict isolated / Alexei Mikhailovich substantially better supported / primary family-service object pending',
  '`Иваном Михайловичем`',
  '**Иван Алексеевич Лоскутов**',
  '**Алексея Михайловича Лоскутова**',
  'Александр Санжара. `Сын артиллериста`',
  '`Тихоокеанский прибой`',
  '**1984**',
  'Светланы Филипповой',
  'Алексея Михайловича существенно более вероятным',
  '**Не добавлять имя** в основной narrative до закрытия gate',
]);
for (const forbidden of [
  'Иван Михайлович — бесспорно отец Ивана Алексеевича',
  'Алексей Михайлович — primary object verified',
  'первичный семейный документ просмотрен',
]) {
  if (father.includes(forbidden)) throw new Error(`Father identity gate overstates closure: ${forbidden}`);
}

const ortenbergPath = 'docs/research/SIMONOV_ORTENBERG_PUBLICATION_WITNESS_GATE_2026-08.md';
const ortenberg = read(ortenbergPath, 'Simonov Ortenberg publication witness gate');
requireAll('Simonov Ortenberg publication witness', ortenberg, [
  'author handoff verified in Simonov retrospective / Ortenberg quote independently transmitted but exact original locus pending',
  '5 декабря утром',
  'Давид Ортенберг',
  'сразу пошла в номер',
  '`В номер`',
  'Приморская краевая детская библиотека',
  '`Июнь — декабрь сорок первого: Рассказ-хроника`',
  'Текущий поиск **не локализовал в этой книге exact phrase**',
  'exact original locus ещё должен быть найден',
]);
for (const forbidden of [
  'рукопись с автографом `В номер` непосредственно просмотрена',
  'Ортенберг, Июнь—декабрь сорок первого, 1984, стр.',
  'exact Ortenberg locus verified',
]) {
  if (ortenberg.includes(forbidden)) throw new Error(`Ortenberg publication gate overstates closure: ${forbidden}`);
}

console.log('Simonov identity/publication follow-ups: father name remains primary-object pending; Ortenberg “В номер” scene remains exact-locus pending while Simonov handoff is usable.');
