import { existsSync, readFileSync } from 'node:fs';
import { simonovSonArtilleristaPublished as essay } from '../src/data/essays/simonovSonArtilleristaPublished';

const path = 'docs/research/SIMONOV_RED_STAR_SHPL_HOLDER_JPG_CLOSEOUT_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov SHPL holder-JPG closeout missing: ${path}`);
const text = readFileSync(path, 'utf8');

for (const marker of [
  'exact SHPL p.3 JPG supplied by holder / pixels directly inspected / institutional p.3 cross-check CLOSED / facsimile reuse rights remain OPEN / binary not vendored',
  'Krasnaya_zvezda_1941_288-3.jpg',
  '543 907 bytes',
  '1146 × 1611',
  '9438e95c530f04a2eeffd60771a9425c7997889ea4b9ff977aa83c3a499d2824',
  'Exact issue node: **`37037`**',
  '#mode/inspect/page/3/zoom/4',
  '7 декабря 1941 г., воскресенье, № 288 (5043).',
  'printed page number **3**',
  '`Сын артиллериста`',
  '`(Фронтовая поэма)`',
  'шесть газетных колонок',
  '`К. СИМОНОВ.`',
  '`СЕВЕРНЫЙ ФРОНТ.`',
  'cross-copy content/geometry identity',
  'а не утверждение о byte-identical деривативах',
  'facsimile reuse/publication permission: **OPEN / separate**',
  'Исследовательский JPG **не вендорится в repository**',
  'THE LEGENDARY POET фактически получил и визуально сверил exact SHPL/GPIB p.3 derivative',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov SHPL holder-JPG closeout boundary disappeared: ${marker}`);
}

for (const forbidden of [
  'facsimile reuse/publication permission: **CLOSED',
  'ГПИБ разрешила публичную републикацию',
  'IA PDF и SHPL JPG являются byte-identical',
  'IA PDF и SHPL JPG — byte-identical деривативы',
  'IA и SHPL имеют одинаковый SHA-256',
  'ГПИБ прислала p.4',
]) {
  if (text.includes(forbidden)) throw new Error(`Simonov SHPL holder-JPG closeout overstates evidence/rights: ${forbidden}`);
}

if (essay.blocks.some((block) => block.type === 'image')) {
  throw new Error('SHPL research JPG must not leak into the current public Simonov reader as a body image');
}
if (essay.coverSourceUrl) {
  throw new Error('SHPL facsimile must not become a source URL for the reconstruction cover');
}

console.log('Simonov SHPL holder-JPG closeout: exact holder-supplied p.3 pixels are direct-inspected and fingerprinted; institutional p.3 cross-check is closed, binary remains unvendored, and reuse rights remain separate/open.');
