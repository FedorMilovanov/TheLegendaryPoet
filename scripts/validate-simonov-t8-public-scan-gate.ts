import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_T8_PUBLIC_SCAN_GATE_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov T8 public scan gate missing: ${path}`);
const text = readFileSync(path, 'utf8');
const status = text.match(/^Статус:\s*\*\*(.+?)\*\*/mu)?.[1] ?? '';
const statusParts = status.split('/').map((part) => part.trim());

for (const marker of [
  'exact public PDF/DjVu scan files located / same-edition OCR collated / relevant pages not yet visually inspected in current toolchain',
  '`Разные дни войны. Дневник писателя`',
  '**с. 393**',
  '**с. 430–433**',
  'Simonov_K.M.__Sobranie_sochineniy_v_10_tt._T.08.(1982).[djv].zip',
  '**13.8 MB**',
  'Simonov_K.M.__Sobranie_sochineniy_v_10_tt._T.08.(1982).[pdf].zip',
  '**10.4 MB**',
  'Скан, OCR, обработка, формат Djv, Pdf: vmakhankov, предоставил: Alexandr, 2018',
  '**479 с.**',
  '**`командир полка посчитал, что это ошибка, и переспросил`**',
  '**`Иван Михайлович`**',
  'Cache miss',
  'DNS/network failure',
  'exact scan located / same-edition OCR collated / bytes not acquired / relevant pages visually uninspected',
  'OCR ≠ visual scan',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov T8 scan boundary disappeared: ${marker}`);
}

const forbiddenPositiveStatusParts = [
  'relevant pages visually inspected in current toolchain',
  'direct page verified',
  'PDF SHA-256 verified',
  'freely licensed',
];
if (statusParts.some((part) => forbiddenPositiveStatusParts.includes(part))) {
  throw new Error(`Simonov T8 scan gate falsely closes an open page/rights boundary: ${status}`);
}
if (!statusParts.includes('relevant pages not yet visually inspected in current toolchain')) {
  throw new Error(`Simonov T8 scan gate lost the explicit visual-inspection boundary: ${status}`);
}

console.log('Simonov T8 scan: exact public packages located and same-edition OCR collated; printed pp.393/430–433 remain byte/page-inspection pending.');