import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_PATRIOT_RODINY_RSL_HOLDINGS_GAP_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov Patriot Rodiny holdings-gap gate missing: ${path}`);
const text = readFileSync(path, 'utf8');

for (const marker of [
  '3 Dec institutionally corroborated / RSL title object verified / target issue likely falls inside a missing late-1941 holdings interval / exact issue number and page remain direct-object pending',
  '`01006521228`',
  '№154 = 1 июля 1941',
  '№155 = 2 июля 1941',
  '№195 = 17 августа 1941',
  '**после №284–285 отсутствуют №286–289; затем есть №290–291.**',
  '**candidate №287**',
  '**не повышает №287 до установленного номера**',
  'RSL parent object verified / exact 03.12 issue likely absent from listed RSL 1941 holdings / regional or alternate copy required',
  'Архангельские фонды / региональная библиотека / краеведческий фонд',
  'не повторять попытки открыть parent viewer',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov Patriot Rodiny holdings boundary disappeared: ${marker}`);
}

for (const forbidden of [
  '№287 — установленный номер 3 декабря',
  'RSL direct issue 03.12.1941 verified',
  'первая публикация direct-object verified',
  'номер 03.12.1941 отсутствовал исторически',
]) {
  if (text.includes(forbidden)) throw new Error(`Simonov Patriot Rodiny holdings gate overstates closure: ${forbidden}`);
}

console.log('Simonov Patriot Rodiny: RSL parent/holdings verified; late-1941 gap isolated; candidate issue number remains inference-only; alternate regional copy required.');
