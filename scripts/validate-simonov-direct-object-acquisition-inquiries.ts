import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_DIRECT_OBJECT_ACQUISITION_INQUIRIES_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov direct-object acquisition inquiry gate missing: ${path}`);
const text = readFileSync(path, 'utf8');
const status = text.match(/^Статус:\s*\*\*(.+?)\*\*/mu)?.[1] ?? '';
const statusParts = status.split('/').map((part) => part.trim());

for (const marker of [
  '47news exact p.3 fragment image URL recovered but pixels undelivered / 47news and RSL replies pending / no paid work authorized / no page promoted to direct-inspected',
  'inquiry sent ≠ exact delivery URL recovered ≠ reply received ≠ bytes received ≠ page visually inspected',
  '`https://i.47news.ru/photos/2021/12//1280x1024_20211211_kzm9dp0vn4jze7ap9btg.jpg`',
  'URL получен из реального image link на странице статьи',
  'web click по image object дошёл до exact URL, но fetch вернул `Cache miss`',
  'pixels текущим toolchain не просмотрены',
  'exact 47news p.3 fragment image URL recovered / bytes not acquired / visual inspection pending',
  '`news@47news.ru`', '`1a01724745b80300`', '`sbo@rsl.ru`', '`1a017249f09e2e53`',
  '`01007444220`', 'printed **pp.54–62**', 'printed **p.393 and pp.430–433**',
  'reply pending / exact published image URL known / source pixels not received / p.3 remains direct-inspection pending',
  'reply pending / no RSL page bytes received / pp.54–62 and pp.393,430–433 remain visually uninspected',
  '**не начинать платное копирование без отдельного подтверждения**',
  '**не оплачивать и не подтверждать заказ автоматически**',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov direct-object acquisition boundary disappeared: ${marker}`);
}

if (!status.includes('exact p.3 fragment image URL recovered but pixels undelivered')) {
  throw new Error(`Simonov 47news exact-image transition disappeared: ${status}`);
}
const forbiddenPositiveParts = [
  '47news reply received',
  'RSL reply received',
  'bytes received',
  'page visually inspected',
  'direct-inspected',
  'paid work authorized',
];
if (statusParts.some((part) => forbiddenPositiveParts.includes(part))) {
  throw new Error(`Simonov direct-object acquisition status falsely closes an open gate: ${status}`);
}

console.log('Simonov direct-object acquisition: exact 47news p.3 image URL recovered but bytes remain undelivered; 47news/RSL replies and page inspection pending; no paid work authorized.');