import { existsSync, readFileSync } from 'node:fs';

const inquiryPath = 'docs/research/SIMONOV_UCHITELSKAYA_GAZETA_PRLIB_INQUIRY_2026-08.md';
const closeoutPath = 'docs/research/SIMONOV_1966_UCHITELSKAYA_GAZETA_PRLIB_CLOSEOUT_2026-09.md';

for (const path of [inquiryPath, closeoutPath]) {
  if (!existsSync(path)) throw new Error(`Simonov Uchitelskaya Gazeta PRLIB control missing: ${path}`);
}

const inquiry = readFileSync(inquiryPath, 'utf8');
const closeout = readFileSync(closeoutPath, 'utf8');

for (const marker of [
  '`reference@prlib.ru`',
  '`1a0172b0393c1c8f`',
  '**не указан вычисленный номер выпуска**',
  'не начинать платные работы без отдельного подтверждения',
]) {
  if (!inquiry.includes(marker)) throw new Error(`Simonov PRLIB inquiry historical boundary disappeared: ${marker}`);
}

for (const marker of [
  'exact issue + institutional item + article/scan locator verified / article content not transcribed',
  '№ 20 (5537)',
  '15 февраля 1966 года',
  'В. Гаспарян',
  '`Отец артиллериста`',
  'https://www.prlib.ru/item/1986920',
  'скан 3',
  'Bibliographic/object gate: CLOSED',
  'article text/content: **OPEN / not transcribed in this closeout**',
  'causal relation to the 03.03.1966 letter: **NOT ESTABLISHED**',
  'facsimile reuse rights: **NOT CLAIMED**',
  'Никакие платные копии',
]) {
  if (!closeout.includes(marker)) throw new Error(`Simonov PRLIB answer closeout boundary disappeared: ${marker}`);
}

if (/платн\S*\s+(?:заказан|оплачен|подтверждён)/iu.test(closeout)) {
  throw new Error('Simonov PRLIB closeout must not authorize paid acquisition');
}
if (/причин\S*\s+(?:доказан|установлен|подтверждён)/iu.test(closeout)) {
  throw new Error('Simonov PRLIB closeout must not infer causality from chronology');
}

console.log('Simonov Uchitelskaya Gazeta: PRLIB inquiry is answered; exact 15-Feb-1966 issue №20 (5537), item 1986920 and scan 3 are closed; content/causality/reuse remain bounded; no paid acquisition.');
