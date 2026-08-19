import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_PATRIOT_RODINY_ACQUISITION_INQUIRY_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov Patriot Rodiny acquisition inquiry missing: ${path}`);
const text = readFileSync(path, 'utf8');
const status = text.match(/^Статус:\s*\*\*(.+?)\*\*/mu)?.[1] ?? '';

for (const marker of [
  'AONB inquiry sent / AONB reply pending / GAAO email reply received with authenticated-channel requirement / GAAO item search not initiated / no page evidence / no paid work authorized',
  '`krai@aonb.ru`', '`1a017204907bb559`', '`arkhiv@dvinaland.ru`', '`1a017207f585d998`',
  '03.12.1941', 'exact issue number', 'printed page/полоса', 'scan/photo',
  'с **28 апреля 2025 года** прекратил приём запросов и обращений граждан, направленных по электронной почте',
  'Единая архивная информационная система Архангельской области',
  'ЕСИА / Госуслуги',
  'ул. Федота Шубина, 1, Архангельск, 163001',
  'GAAO email reply received / authenticated or postal request still required / item search not initiated',
  'номер выпуска **сознательно не заявлен** как факт',
  '`first publication` остаётся fail-closed',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov Patriot Rodiny acquisition boundary disappeared: ${marker}`);
}

if (!status.includes('GAAO email reply received') || !status.includes('GAAO item search not initiated')) {
  throw new Error(`Simonov Patriot Rodiny GAAO route transition disappeared: ${status}`);
}
if (/page verified|issue verified|direct-object verified|scan received|paid work authorized/iu.test(status)) {
  throw new Error(`Simonov Patriot Rodiny status falsely closes an open object gate: ${status}`);
}

console.log('Simonov Patriot Rodiny acquisition: AONB reply pending; GAAO procedural reply requires ESIA/Gosuslugi or post; issue/page remain unverified; no paid work authorized.');