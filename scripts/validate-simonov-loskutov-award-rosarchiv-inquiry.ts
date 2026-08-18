import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_LOSKUTOV_AWARD_ROSARCHIV_INQUIRY_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov Rosarchiv award inquiry missing: ${path}`);
const text = readFileSync(path, 'utf8');
const status = text.match(/^Статус:\s*\*\*(.+?)\*\*/mu)?.[1] ?? '';

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
if (/Rosarchiv reply received|TsAMO confirmation|scan received|page inspected|direct-object verified|paid work authorized/iu.test(status)) {
  throw new Error(`Simonov Rosarchiv award status falsely closes an open gate: ${status}`);
}

console.log('Simonov award object: exact TsAMO locator; official Rosarchiv routing inquiry sent; reply/scan pending; no paid work authorized.');