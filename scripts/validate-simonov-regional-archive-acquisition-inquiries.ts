import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_REGIONAL_ARCHIVE_ACQUISITION_INQUIRIES_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov regional archive acquisition gate missing: ${path}`);
const text = readFileSync(path, 'utf8');
const status = text.match(/^Статус:\s*\*\*(.+?)\*\*/mu)?.[1] ?? '';
const statusParts = status.split('/').map((part) => part.trim());

for (const marker of [
  'two official regional archive/museum inquiries sent / replies and item-level evidence pending / no paid work authorized',
  'supersedes прежнюю operational-фразу `запрос подготовлен, но не отправлен`',
  '**`arhivpk@bk.ru`**', '**Р-1510**', '**1961–1967**', '`1a0173aec38d1bfe`',
  '**`Mmk-info@sakhalin.gov.ru`**', '`1a0173bb91ce4eaf`',
  'личная встреча Солодовникова и Лоскутова не считается установленной',
  'inquiry sent / reply pending / opis and specific storage units remain uninspected',
  'museum inquiry sent / reply pending / no museum item inspected / no personal meeting promoted to fact',
  '**никакой платной работы до точной стоимости и отдельного подтверждения**',
  '**не оплачивать/не подтверждать автоматически**',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov regional archive boundary disappeared: ${marker}`);
}
const forbiddenPositiveParts = [
  'reply received',
  'item inspected',
  'opis verified',
  'meeting verified',
  'paid work authorized',
];
if (statusParts.some((part) => forbiddenPositiveParts.includes(part))) {
  throw new Error(`Simonov regional archive status falsely closes an open gate: ${status}`);
}

console.log('Simonov regional archives: GAKP R-1510 + Sakhalin Pobeda inquiries sent; replies/items pending; meeting remains unverified; no paid work authorized.');