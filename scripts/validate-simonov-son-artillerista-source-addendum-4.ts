import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_SON_ARTILLERISTA_SOURCE_ADDENDUM_4_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov source addendum IV missing: ${path}`);
const text = readFileSync(path, 'utf8');
const status = text.match(/^Статус:\s*\*\*(.+?)\*\*/mu)?.[1] ?? '';

for (const marker of [
  'page-3 bibliography upgraded / direct newspaper scan remains controlling target',
  'A4-01',
  '`Военно-исторический журнал` — **Издание Министерства обороны России**',
  'Евгений Юрьевич Колобов',
  'примечании **39**',
  'Красная звезда. 1941. 7 декабря. С. 3.',
  'p.3 strongly corroborated',
  'direct newspaper image №288, p.3 — pending',
  'A4-02',
  'материалами РГАЛИ',
  'после closure можно повысить C36 до A+ direct-object verified',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov source addendum IV boundary disappeared: ${marker}`);
}

if (/direct scan verified|direct page verified|columns verified|facsimile inspected/iu.test(status)) {
  throw new Error(`Simonov source addendum IV falsely closes p.3: ${status}`);
}

console.log('Simonov source addendum IV: official MoD scholarly citation pins Red Star p.3; direct newspaper scan and columns remain pending.');
