import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_DIRECT_OBJECT_ACQUISITION_INQUIRIES_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov direct-object acquisition inquiry gate missing: ${path}`);
const text = readFileSync(path, 'utf8');
const status = text.match(/^Статус:\s*\*\*(.+?)\*\*/mu)?.[1] ?? '';
const statusParts = status.split('/').map((part) => part.trim());

for (const marker of [
  'Red Star №288 p.3 direct-inspected independently / 47news fragment bytes still undelivered / RSL 1973+1982 pages still pending / no paid work authorized',
  'global Red Star page-content state:',
  'direct-inspected independently',
  '47news fragment route:',
  'exact image URL known, bytes unavailable, fragment itself uninspected',
  'RSL print routes:',
  'inquiry sent ≠ exact delivery URL recovered ≠ reply received ≠ bytes received ≠ a particular source object visually inspected',
  '`https://i.47news.ru/photos/2021/12//1280x1024_20211211_kzm9dp0vn4jze7ap9btg.jpg`',
  'URL получен из реального image link на странице статьи',
  'web click по image object дошёл до exact URL, но fetch вернул `Cache miss`',
  '47news fragment pixels текущим toolchain не просмотрены',
  'exact 47news p.3 fragment image URL recovered / bytes not acquired / fragment visual inspection pending',
  '`news@47news.ru`', '`1a01724745b80300`', '`sbo@rsl.ru`', '`1a017249f09e2e53`',
  'Internet Archive item: **`no2661212191941`**',
  '**6 506 121 bytes**',
  '9e644dd79fd9d22199ec9cef158d2f1a9cf5ce5efbdc60f2eb3e578c8999e229',
  '**шесть газетных колонок**',
  'на p.4 продолжения нет',
  '`01007444220`', 'printed **pp.54–62**', 'printed **p.393 and pp.430–433**',
  'reply pending / exact published 47news image URL known / 47news source pixels not received / fragment inspection pending / global №288 p.3 already direct-verified independently',
  'reply pending / no RSL page bytes received / pp.54–62 and pp.393,430–433 remain visually uninspected',
  '**не начинать платное копирование без отдельного подтверждения**',
  '**не оплачивать и не подтверждать заказ автоматически**',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov direct-object acquisition boundary disappeared: ${marker}`);
}

for (const stale of [
  'no page promoted to direct-inspected',
  'p.3 remains direct-inspection pending',
  'Ни один claim не повышен до `direct object inspected`',
]) {
  if (text.includes(stale)) throw new Error(`Simonov direct-object acquisition retained stale global Red Star state: ${stale}`);
}

const forbiddenPositiveStatusParts = [
  '47news fragment visually inspected',
  'RSL pp.54–62 direct-inspected',
  'RSL pp.393,430–433 direct-inspected',
  'paid work authorized',
  'facsimile reuse rights cleared',
];
for (const forbidden of forbiddenPositiveStatusParts) {
  if (statusParts.includes(forbidden)) {
    throw new Error(`Simonov direct-object acquisition falsely closes an external route: ${forbidden}`);
  }
}

if (!status.includes('Red Star №288 p.3 direct-inspected independently')) {
  throw new Error(`Simonov acquisition gate lost global Red Star page closure: ${status}`);
}
if (!status.includes('47news fragment bytes still undelivered') || !status.includes('RSL 1973+1982 pages still pending')) {
  throw new Error(`Simonov acquisition gate lost open external-route boundaries: ${status}`);
}
if (!statusParts.includes('no paid work authorized')) {
  throw new Error(`Simonov acquisition gate lost no-paid-work boundary: ${status}`);
}

console.log('Simonov direct-object acquisition: Red Star №288 p.3 is independently direct-verified; 47news fragment remains undelivered/uninspected; RSL 1973/1982 target pages and replies remain pending; no paid work authorized.');