import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_PRAVDA_1966_ACQUISITION_INQUIRY_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov Pravda 1966 acquisition inquiry missing: ${path}`);
const text = readFileSync(path, 'utf8');
const status = text.match(/^Статус:\s*\*\*(.+?)\*\*/mu)?.[1] ?? '';
const statusParts = status.split('/').map((part) => part.trim());

for (const marker of [
  'exact bibliographic locator + official digital-corpus route / RNL reference inquiry sent / reply and direct page pending / no paid work authorized',
  'О. Манько',
  '`Человек из поэмы`',
  '№ 81 (17398)',
  'С. 4',
  '**`ref.service@nlr.ru`**',
  '`1a0172cc3033b82a`',
  'exact locator / institutional digital corpus exists / direct p.4 uninspected',
  '**не начинать платные работы без отдельного подтверждения после сообщения стоимости**',
  '**не оплачивать/не подтверждать автоматически**',
  'До ответа и visual page inspection статус остаётся fail-closed',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov Pravda 1966 acquisition boundary disappeared: ${marker}`);
}
const forbiddenPositiveParts = [
  'reply received',
  'p.4 verified',
  'p.4 inspected',
  'direct-object verified',
  'paid work authorized',
  'reuse rights granted',
];
if (statusParts.some((part) => forbiddenPositiveParts.includes(part))) {
  throw new Error(`Simonov Pravda 1966 status falsely closes an open gate: ${status}`);
}

console.log('Simonov Pravda 1966: exact locator + official corpus route; RNL inquiry sent; reply/p.4 inspection pending; no paid work authorized.');