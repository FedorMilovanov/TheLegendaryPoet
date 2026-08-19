import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_SON_ARTILLERISTA_SOURCE_ADDENDUM_4_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov source addendum IV missing: ${path}`);
const text = readFileSync(path, 'utf8');
const status = text.match(/^Статус:\s*\*\*(.+?)\*\*/mu)?.[1] ?? '';

for (const marker of [
  'scholarly p.3 locator preserved / exact №288 facsimile later direct-inspected / bibliography now independent cross-check',
  'A4-01',
  '`Военно-исторический журнал` — **Издание Министерства обороны России**',
  'Евгений Юрьевич Колобов',
  'примечании **39**',
  'Красная звезда. 1941. 7 декабря. С. 3.',
  'p.3 стала strongly corroborated',
  'Internet Archive item: **`no2661212191941`**',
  '**6 506 121 bytes**',
  '9e644dd79fd9d22199ec9cef158d2f1a9cf5ce5efbdc60f2eb3e578c8999e229',
  '**шесть газетных колонок**',
  'на p.4 продолжения поэмы нет',
  '**A+ direct page evidence**',
  '**independent scholarly p.3 cross-check**',
  'A4-02',
  'материалами РГАЛИ',
  '[x] C36 повышен до A+ direct-page verified',
  'institutional provenance/reuse remain separate open gates',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov source addendum IV boundary disappeared: ${marker}`);
}

for (const stale of [
  'direct newspaper image №288, p.3 — pending',
  'До direct scan допустима формула',
  'после closure можно повысить C36 до A+ direct-object verified',
]) {
  if (text.includes(stale)) throw new Error(`Simonov source addendum IV retained stale pre-inspection state: ${stale}`);
}

for (const forbidden of [
  'institutional provenance closed',
  'facsimile reuse rights cleared',
  'первая публикация доказана',
]) {
  if (text.includes(forbidden)) throw new Error(`Simonov source addendum IV overstates a separate open gate: ${forbidden}`);
}

if (!/direct-inspected/iu.test(status) || !/independent cross-check/iu.test(status)) {
  throw new Error(`Simonov source addendum IV declared status lost direct-page/scholarly separation: ${status}`);
}

console.log('Simonov source addendum IV: scholarly p.3 locator preserved as independent cross-check; exact №288 p.3/p.4 direct inspection closed page geometry while provenance/reuse and first-publication remain separate.');