import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_T8_SAME_EDITION_OCR_COLLATION_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov T8 same-edition OCR collation missing: ${path}`);
const text = readFileSync(path, 'utf8');
const status = text.match(/^Статус:\s*\*\*(.+?)\*\*/mu)?.[1] ?? '';

for (const marker of [
  'same-edition 1982 OCR strongly collated / printed pp.393 and 430–433 still visually uninspected',
  'Художественная литература, **1982**',
  'т. I — **479 с.**',
  '`Лёнька` — **вымышленное имя**',
  '**Деев** и **Петров** — тоже вымышленные',
  '**Иван Алексеевич Лоскутов**',
  '**`командир полка посчитал, что это ошибка, и переспросил`**',
  '**`Иван Михайлович`**',
  '**Алексей Михайлович / Алексей**',
  'OCR ≠ visual scan',
  'printed scan pp.393, 430–433',
  'same-edition 1982 OCR / Militera',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov T8 OCR collation boundary disappeared: ${marker}`);
}

if (/visually inspected|direct page verified|father-name conflict closed|Ivan Mikhailovich.*established/iu.test(status)) {
  throw new Error(`Simonov T8 OCR collation falsely upgrades OCR to page/object closure: ${status}`);
}

console.log('Simonov T8 same-edition OCR: textual variants strongly collated; printed pp.393/430–433 remain direct-scan pending.');
