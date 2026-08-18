import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_DIRECT_OBJECT_ACQUISITION_INQUIRIES_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov direct-object acquisition inquiry gate missing: ${path}`);
const text = readFileSync(path, 'utf8');

for (const marker of [
  'two additional non-binding acquisition inquiries sent / replies pending / no paid work authorized / no page promoted to direct-inspected',
  'inquiry sent ≠ reply received ≠ bytes received ≠ page visually inspected',
  '`news@47news.ru`',
  '`1a01724745b80300`',
  '`sbo@rsl.ru`',
  '`1a017249f09e2e53`',
  '`01007444220`',
  'printed **pp.54–62**',
  'printed **p.393 and pp.430–433**',
  'reply pending / source pixels not received / p.3 remains direct-inspection pending',
  'reply pending / no RSL page bytes received / pp.54–62 and pp.393,430–433 remain visually uninspected',
  '**не начинать платное копирование без отдельного подтверждения**',
  '**не оплачивать и не подтверждать заказ автоматически**',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov direct-object acquisition boundary disappeared: ${marker}`);
}

for (const forbidden of [
  '47news прислал исходный файл',
  'РГБ прислала страницы',
  'pp.54–62 visually verified',
  'pp.430–433 visually verified',
  'p.3 direct object inspected',
  'paid copying authorized',
]) {
  if (text.includes(forbidden)) throw new Error(`Simonov direct-object acquisition gate overstates closure: ${forbidden}`);
}

console.log('Simonov direct-object acquisition: 47news + RSL inquiries sent; replies/bytes/page inspection pending; no paid work authorized.');
