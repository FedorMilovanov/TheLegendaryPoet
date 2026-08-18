import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_PATRIOT_RODINY_ACQUISITION_INQUIRY_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov Patriot Rodiny acquisition inquiry missing: ${path}`);
const text = readFileSync(path, 'utf8');
const status = text.match(/^Статус:\s*\*\*(.+?)\*\*/mu)?.[1] ?? '';

for (const marker of [
  'two non-binding regional acquisition inquiries sent / replies pending / no paid work authorized',
  '`krai@aonb.ru`', '`1a017204907bb559`', '`arkhiv@dvinaland.ru`', '`1a017207f585d998`',
  '03.12.1941', 'exact issue number', 'printed page/полоса', 'scan/photo',
  '**не начинать платные работы без отдельного подтверждения**',
  'no paid search/copying without exact quote and separate authorization',
  'номер выпуска **сознательно не заявлен** как факт',
  'До получения item/page evidence статус публикации остаётся fail-closed',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov Patriot Rodiny acquisition boundary disappeared: ${marker}`);
}
if (/repl(?:y|ies) received|scan received|issue verified|direct-object verified|paid work authorized/iu.test(status)) {
  throw new Error(`Simonov Patriot Rodiny status falsely closes an open gate: ${status}`);
}

console.log('Simonov Patriot Rodiny acquisition: AONB + GAAO inquiries sent; replies/page evidence pending; no paid work authorized; issue number remains unasserted.');