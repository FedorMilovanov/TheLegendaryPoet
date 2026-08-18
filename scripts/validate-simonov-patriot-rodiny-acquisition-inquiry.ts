import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_PATRIOT_RODINY_ACQUISITION_INQUIRY_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov Patriot Rodiny acquisition inquiry missing: ${path}`);
const text = readFileSync(path, 'utf8');

for (const marker of [
  'two non-binding regional acquisition inquiries sent / replies pending / no paid work authorized',
  '`krai@aonb.ru`',
  '`1a017204907bb559`',
  '`arkhiv@dvinaland.ru`',
  '`1a017207f585d998`',
  '03.12.1941',
  'exact issue number',
  'printed page/полоса',
  'scan/photo',
  '**не начинать платные работы без отдельного подтверждения**',
  'no paid search/copying without exact quote and separate authorization',
  'номер выпуска **сознательно не заявлен** как факт',
  'До получения item/page evidence статус публикации остаётся fail-closed',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov Patriot Rodiny acquisition boundary disappeared: ${marker}`);
}

for (const forbidden of [
  'ответ АОНБ получен',
  'ответ ГААО получен',
  'скан 03.12.1941 получен',
  '№287 подтверждён архивом',
  'платные работы разрешены',
  'первая публикация direct-object verified',
]) {
  if (text.includes(forbidden)) throw new Error(`Simonov Patriot Rodiny acquisition gate overstates closure: ${forbidden}`);
}

console.log('Simonov Patriot Rodiny acquisition: AONB + GAAO inquiries sent; replies/page evidence pending; no paid work authorized; issue number remains unasserted.');
