import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_UCHITELSKAYA_GAZETA_PRLIB_INQUIRY_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov Uchitelskaya Gazeta Presidential Library inquiry missing: ${path}`);
const text = readFileSync(path, 'utf8');
const status = text.match(/^Статус:\s*\*\*(.+?)\*\*/mu)?.[1] ?? '';

for (const marker of [
  'official item corpus verified / exact-date bibliographic inquiry sent / reply pending / exact issue, page and article remain unverified',
  '`1966, № 5 (5522) (11 января)`',
  '`1966, № 36 (5553) (24 марта)`',
  '`reference@prlib.ru`',
  '`1a0172b0393c1c8f`',
  '**не указан вычисленный номер выпуска**',
  'Presidential Library 1966 item corpus verified / exact 15 Feb item inquiry sent / reply pending',
  '**не начинать платные работы без отдельного подтверждения после сообщения стоимости**',
  'статья Гаспаряна остаётся fail-closed tertiary lead',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov Uchitelskaya Gazeta PRLIB boundary disappeared: ${marker}`);
}
if (/reply received|item verified|page verified|article verified|paid work authorized/iu.test(status)) {
  throw new Error(`Simonov Uchitelskaya Gazeta PRLIB status falsely closes an open gate: ${status}`);
}

console.log('Simonov Uchitelskaya Gazeta: official 1966 item corpus verified; exact 15-Feb inquiry sent to PRLIB; reply/item/page pending; no paid work authorized.');