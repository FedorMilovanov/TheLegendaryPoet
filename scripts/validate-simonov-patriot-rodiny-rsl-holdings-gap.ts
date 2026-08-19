import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_PATRIOT_RODINY_RSL_HOLDINGS_GAP_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov Patriot Rodiny holdings-gap gate missing: ${path}`);
const text = readFileSync(path, 'utf8');

for (const marker of [
  '3 Dec institutionally corroborated / RSL holdings record 01006521228 has gap №286–289 / second full-viewer serial record 01004527271 recovered / exact 03.12 child issue and page remain direct-object pending',
  '`01006521228`', '`01004527271`', '`OVL ВО 200/21`',
  '№154 = 1 июля 1941',
  '№155 = 2 июля 1941',
  '№195 = 17 августа 1941',
  '**после №284–285 отсутствуют №286–289; затем есть №290–291.**',
  '`Документ находится в открытом доступе в полном объёме`',
  '`Читать онлайн`',
  'old holdings gap verified / second RSL full-viewer serial object verified / exact relationship between second record and 03.12.1941 issue unknown until RSL child route or pixels are obtained',
  '**candidate №287**',
  '**не повышает №287 до установленного номера**',
  'РГБ record `01004527271`',
  'получить официальный stable child/viewer route для 03.12.1941',
  'gap `01006521228` доказывает отсутствие номера во всей РГБ',
  'candidate №287 остаётся только навигационной гипотезой',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov Patriot Rodiny holdings boundary disappeared: ${marker}`);
}

for (const forbidden of [
  '№287 — установленный номер 3 декабря',
  'RSL direct issue 03.12.1941 verified',
  'первая публикация direct-object verified',
  'номер 03.12.1941 отсутствовал исторически',
  'record 01004527271 already shows the 03.12.1941 issue',
]) {
  if (text.includes(forbidden)) throw new Error(`Simonov Patriot Rodiny holdings gate overstates closure: ${forbidden}`);
}

console.log('Simonov Patriot Rodiny: old RSL holdings gap №286–289 remains verified, but second full-viewer serial record 01004527271 reopens a lawful RSL child-route check; candidate №287 remains inference-only and 03.12 issue/page remain pending.');
