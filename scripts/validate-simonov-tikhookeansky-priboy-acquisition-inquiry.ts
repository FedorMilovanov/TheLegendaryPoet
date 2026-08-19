import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_TIKHOOKEANSKY_PRIBOY_ACQUISITION_INQUIRY_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov Pacific Surf acquisition gate missing: ${path}`);
const text = readFileSync(path, 'utf8');
const status = text.match(/^Статус:\s*\*\*(.+?)\*\*/mu)?.[1] ?? '';
const statusParts = status.split('/').map((part) => part.trim());

for (const marker of [
  'non-binding item-level inquiry sent to PKDB holdings / reply pending / no paid work authorized / pp.3–13 uninspected',
  'Александр Санжара', '`Тихоокеанский прибой`', '1984', 'С. 3–13',
  '`hranenie@pkdb.net`', '`biblio@pkdb.net`', '`1a01727f8a2e9b03`',
  'Алексеем Михайловичем Лоскутовым',
  '**не начинать платные работы без отдельного подтверждения после сообщения стоимости**',
  'PKDB institutional delivery + exact named 1984 print source / direct pp.3–13 pending',
  '**имя не публиковать как установленное**', '**не direct-print verified**',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov Pacific Surf acquisition boundary disappeared: ${marker}`);
}
const forbiddenPositiveParts = [
  'reply received',
  'pp.3–13 verified',
  'pp.3–13 inspected',
  'direct-print verified',
  'family document received',
  'reuse rights granted',
  'paid work authorized',
];
if (statusParts.some((part) => forbiddenPositiveParts.includes(part))) {
  throw new Error(`Simonov Pacific Surf status falsely closes an open gate: ${status}`);
}

console.log('Simonov Pacific Surf 1984: PKDB holdings inquiry sent; pp.3–13/reply/bytes pending; father-name conflict remains fail-closed; no paid work authorized.');