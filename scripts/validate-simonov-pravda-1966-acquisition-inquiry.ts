import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_PRAVDA_1966_ACQUISITION_INQUIRY_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov Pravda 1966 acquisition source missing: ${path}`);
const text = readFileSync(path, 'utf8');
const status = text.match(/^Статус:\s*\*\*(.+?)\*\*/mu)?.[1] ?? '';
const requiredStatus = 'DIRECT PAGE VERIFIED / RNL reply received 2026-09-07 / byline Е. Манько / publication rights HOLD / no paid work';
if (status !== requiredStatus) throw new Error(`Unexpected Pravda 1966 evidence status: ${status}`);

for (const marker of [
  '**Е. Манько. `Человек из поэмы` // `Правда`. 1966. 22 марта. № 81 (17398). С. 4.**',
  '## 2. Исторический отправленный запрос (2026-08-19; as sent)',
  'Исторический отправленный запрос',
  'О. Манько',
  '## 5. Superseding holder-supplied primary-object readback — 2026-11-06',
  '2026-09-07',
  '1788763734379.pdf',
  '1,026,611 bytes',
  'a27efcd9b72f706a7c3b0afe5d54668dd52edc958b5f2fbfde2a3eaacb711a89',
  '«Е. МАНЬКО.»',
  'PAGE_TITLE_BYLINE_VISUALLY_VERIFIED',
  'RIGHTS_HOLD_FOR_FACSIMILE',
  'RESEARCH_ONLY_UNTIL_SEPARATE_CLAIM_HANDOFF',
  '**не начинать платные работы без отдельного подтверждения после сообщения стоимости**',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov Pravda 1966 evidence marker missing: ${marker}`);
}

// Historical correspondence with the wrong initial must remain clearly superseded;
// the current canonical citation must not regress to the unverified old byline.
const currentCitation = text.match(/^\*\*[^\n]*Человек из поэмы[^\n]*\*\*$/mu)?.[0] ?? '';
if (!currentCitation.startsWith('**Е. Манько.')) {
  throw new Error(`Current canonical Pravda citation is not Е. Манько: ${currentCitation}`);
}
if (!text.includes('earlier `О. Манько`')) {
  throw new Error('Superseded attribution must remain explained');
}
if (!text.includes('not a license to reproduce')) {
  throw new Error('Research copy must not be silently promoted to reuse permission');
}
console.log('Simonov Pravda 1966: NLR actual p.4 read, Е. Манько byline verified, historical О. superseded, facsimile rights hold.');
