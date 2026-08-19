import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_RED_STAR_DIRECT_MIRRORS_GATE_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov Red Star direct mirrors gate missing: ${path}`);
const text = readFileSync(path, 'utf8');

for (const marker of [
  'exact №288 PDF bytes acquired / p.3 visually inspected / poem boundaries and no-continuation verified / institutional scan cross-check still desirable',
  'Internet Archive item: `no2661212191941`',
  'Газета «Красная Звезда» №288 от 07 декабря 1941 года.pdf',
  '**6 506 121 bytes**',
  '9e644dd79fd9d22199ec9cef158d2f1a9cf5ce5efbdc60f2eb3e578c8999e229',
  'printed page number: **3**',
  'title: **`Сын артиллериста`**',
  'subtitle: **`(Фронтовая поэма)`**',
  'текст занимает **шесть газетных колонок**',
  '**`К. СИМОНОВ.`**',
  '**`СЕВЕРНЫЙ ФРОНТ.`**',
  'продолжения `Сына артиллериста`',
  '**page-content gate: CLOSED**',
  '**institutional provenance cross-check: OPEN / desirable**',
  '**facsimile reuse-rights gate: OPEN / separate**',
  'Route A — ГПИБ / SHPL',
  'Route B — сайт Министерства обороны России',
  'Route C — ВБД `Военкор`',
  'Route D — StudMed: декабрьская PDF-подшивка 1941',
  '`Красная звезда 1941 №283-309 декабрь`',
  '**160,87 МБ**',
  'Route E — LibInfo',
  '**4 258 147 байт**',
  'do not republish facsimile',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov Red Star direct-object boundary disappeared: ${marker}`);
}

for (const stale of [
  'exact issue bytes still not acquired in current toolchain',
  'exact №288 bytes/p.3 remain uninspected',
  'Columns, start/end and continuation remain direct-page pending',
]) {
  if (text.includes(stale)) throw new Error(`Simonov Red Star gate retained stale pre-inspection state: ${stale}`);
}

for (const forbidden of [
  'mil.ru exact PDF URL recovered',
  'VBD issue ID вычислен',
  'facsimile reuse rights cleared',
  'institutional provenance closed',
]) {
  if (text.includes(forbidden)) throw new Error(`Simonov Red Star direct-object gate overstates a separate open boundary: ${forbidden}`);
}

console.log('Simonov Red Star direct object: exact №288 PDF acquired and hashed; p.3/p.4 visually inspected; six-column poem boundaries closed; institutional provenance/reuse remain separate open gates.');
