import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_LOSKUTOV_AWARD_ROSARCHIV_INQUIRY_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov Rosarchiv award inquiry missing: ${path}`);
const text = readFileSync(path, 'utf8');

for (const marker of [
  'exact TsAMO locator known / official Rosarchiv routing inquiry sent / reply and direct scan pending / no paid work authorized',
  '**10800112**',
  '**ЦАМО**',
  '**33**',
  '**682524**',
  '**34**',
  '**246–247**',
  '**`rosarchiv@gov.ru`**',
  '`1a0172f54376c20c`',
  'official routing inquiry sent ≠ Rosarchiv reply ≠ TsAMO confirmation ≠ scan received ≠ page inspected',
  '**не начинать платные работы без отдельного подтверждения после сообщения стоимости**',
  'ни одна спорная цифра не повышена до архивно проверенного факта',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov Rosarchiv award inquiry boundary disappeared: ${marker}`);
}

for (const forbidden of [
  'Росархив подтвердил конкретное дело',
  'ЦАМО ответил',
  'л.246–247 получены',
  '31.7.41 direct-object verified',
  '6 суток direct-object verified',
  'платное копирование разрешено',
]) {
  if (text.includes(forbidden)) throw new Error(`Simonov Rosarchiv award inquiry overstates closure: ${forbidden}`);
}

console.log('Simonov award object: exact TsAMO locator; official Rosarchiv routing inquiry sent; reply/scan pending; no paid work authorized.');
