import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_TIKHOOKEANSKY_PRIBOY_ACQUISITION_INQUIRY_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov Pacific Surf acquisition gate missing: ${path}`);
const text = readFileSync(path, 'utf8');

for (const marker of [
  'non-binding item-level inquiry sent to PKDB holdings / reply pending / no paid work authorized / pp.3–13 uninspected',
  'Александр Санжара',
  '`Тихоокеанский прибой`',
  '1984',
  'С. 3–13',
  '`hranenie@pkdb.net`',
  '`biblio@pkdb.net`',
  '`1a01727f8a2e9b03`',
  'Алексеем Михайловичем Лоскутовым',
  '**не начинать платные работы без отдельного подтверждения после сообщения стоимости**',
  'PKDB institutional delivery + exact named 1984 print source / direct pp.3–13 pending',
  '**имя не публиковать как установленное**',
  '**не direct-print verified**',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov Pacific Surf acquisition boundary disappeared: ${marker}`);
}

for (const forbidden of [
  'ПКДБ подтвердила наличие экземпляра',
  'с. 3–13 визуально просмотрены',
  'Алексей Михайлович direct-print verified',
  'семейный документ получен',
  'право на перепубликацию получено',
  'платное копирование разрешено',
]) {
  if (text.includes(forbidden)) throw new Error(`Simonov Pacific Surf acquisition gate overstates closure: ${forbidden}`);
}

console.log('Simonov Pacific Surf 1984: PKDB holdings inquiry sent; pp.3–13/reply/bytes pending; father-name conflict remains fail-closed; no paid work authorized.');
