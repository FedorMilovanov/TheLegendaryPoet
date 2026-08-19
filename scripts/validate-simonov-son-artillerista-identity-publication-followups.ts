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

function declaredStatus(text: string): string {
  return text.match(/^Статус:\s*\*\*(.+?)\*\*/mu)?.[1] ?? '';
}

const fatherPath = 'docs/research/SIMONOV_LOSKUTOV_FATHER_IDENTITY_GATE_2026-08.md';
const father = read(fatherPath, 'Simonov Loskutov father identity gate');
requireAll('Simonov Loskutov father identity', father, [
  'strong conflict isolated / same-edition 1982 OCR supports Ivan Mikhailovich / Primorye+family line supports Alexei / primary object pending',
  '**`Иван Михайлович`**',
  '`Иван Алексеевич`',
  '`Алексей Михайлович`',
  'патроним — не документ о личности отца',
  'Александр Санжара',
  '`Тихоокеанский прибой`',
  '**1984**',
  'Светлана Филиппова',
  'два сильных конкурирующих textual lineages',
  '**Не добавлять имя** в основной narrative до закрытия gate',
  'primary identity object не просмотрен',
]);
if (/primary.*(?:verified|closed)|family-service object verified|conflict closed/iu.test(declaredStatus(father))) {
  throw new Error('Father identity gate falsely declares primary-object closure');
}

const ortenbergPath = 'docs/research/SIMONOV_ORTENBERG_PUBLICATION_WITNESS_GATE_2026-08.md';
const ortenberg = read(ortenbergPath, 'Simonov Ortenberg publication witness gate');
requireAll('Simonov Ortenberg publication witness', ortenberg, [
  'author handoff verified / exact Ortenberg print locus strongly corroborated / pp. 95–96 direct scan inspection pending',
  '5 декабря утром',
  'Давид Ортенберг',
  'сразу пошла в номер',
  '`В номер`',
  'Приморская краевая детская библиотека',
  '`Каким я его знал`',
  'с. 86–112',
  '**с. 95–96**',
  'exact print locus strongly corroborated',
  'direct page scan not yet inspected',
  '`Июнь — декабрь сорок первого: Рассказ-хроника`',
  'необходимости насильно приписывать сцену `В номер` этой книге',
  '### Пока нельзя',
  '`THE LEGENDARY POET визуально проверил с. 95–96`',
]);
if (/direct scan (?:verified|inspected)|facsimile verified/iu.test(declaredStatus(ortenberg))) {
  throw new Error('Ortenberg publication gate falsely declares direct-scan closure');
}

console.log('Simonov identity/publication follow-ups: father name remains a two-lineage conflict pending primary/printed objects; patronymic is explicitly not treated as identity proof; Ortenberg pp.95–96 remain direct-page pending; Simonov handoff usable.');
