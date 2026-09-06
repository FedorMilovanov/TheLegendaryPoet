import { existsSync, readFileSync } from 'node:fs';

const historicalPath = 'docs/research/SIMONOV_1966_UCHITELSKAYA_GAZETA_GATE_2026-08.md';
const closeoutPath = 'docs/research/SIMONOV_1966_UCHITELSKAYA_GAZETA_PRLIB_CLOSEOUT_2026-09.md';

for (const path of [historicalPath, closeoutPath]) {
  if (!existsSync(path)) throw new Error(`Simonov 1966 Uchitelskaya Gazeta control missing: ${path}`);
}

const historical = readFileSync(historicalPath, 'utf8');
const closeout = readFileSync(closeoutPath, 'utf8');
const closeoutStatus = closeout.match(/^Статус:\s*\*\*(.+?)\*\*/mu)?.[1] ?? '';

for (const marker of [
  'C — tertiary bibliographic lead',
  '15 февраля',
  'Приоритетный маршрут теперь известен',
  'не доказывает',
]) {
  if (!historical.includes(marker)) throw new Error(`Simonov 1966 historical gate lost provenance marker: ${marker}`);
}

for (const marker of [
  'exact issue + institutional item + article/scan locator verified / article content not transcribed',
  '15 февраля 1966 года',
  '№ 20 (5537)',
  'В. Гаспарян',
  '`Отец артиллериста`',
  'https://www.prlib.ru/item/1986920',
  'скан 3',
  'Bibliographic/object gate: CLOSED',
  'NOT ESTABLISHED',
  'NOT CLAIMED',
  'Никакие платные копии',
]) {
  if (!closeout.includes(marker)) throw new Error(`Simonov 1966 PRLIB closeout boundary disappeared: ${marker}`);
}

if (closeoutStatus !== 'exact issue + institutional item + article/scan locator verified / article content not transcribed') {
  throw new Error(`Unexpected Simonov 1966 closeout status: ${closeoutStatus}`);
}

for (const forbidden of [
  /article content transcribed/iu,
  /causal (?:link|relation).*(?:established|verified)/iu,
  /facsimile reuse rights.*(?:granted|verified|cleared)/iu,
  /paid work authorized/iu,
]) {
  if (forbidden.test(closeout)) throw new Error(`Simonov 1966 closeout overclaims evidence/rights: ${forbidden}`);
}

console.log('Simonov 1966 Uchitelskaya Gazeta: PRLIB closes exact issue/item/author/title/scan locator; article content, causality and facsimile reuse remain explicitly unclaimed; paid acquisition is closed.');
