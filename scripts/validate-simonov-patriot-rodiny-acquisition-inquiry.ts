import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_PATRIOT_RODINY_ACQUISITION_INQUIRY_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov Patriot Rodiny acquisition inquiry missing: ${path}`);
const text = readFileSync(path, 'utf8');
const status = text.match(/^Статус:\s*\*\*(.+?)\*\*/mu)?.[1] ?? '';
const statusParts = status.split('/').map((part) => part.trim());

for (const marker of [
  'AONB inquiry sent / GAAO procedural reply received / exact RSL serial record 01004527271 recovered and viewer-route clarification sent / no 03.12 issue-page evidence / no paid work authorized',
  '`01004527271`', '`OVL ВО 200/21`',
  'Документ находится в открытом доступе в полном объёме', '`Читать онлайн`',
  'exact RSL serial record + full-viewer availability verified / exact 03.12.1941 child issue and page still unresolved',
  '`sbo@rsl.ru`', '`1a017249f09e2e53`', '`1a01b4933d588caa`',
  'stable viewer/child-object route **именно к выпуску 03.12.1941**',
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

for (const forbidden of [
  '03.12 issue verified',
  '03.12 page verified',
  'direct-object verified',
  'scan received',
  'paid work authorized',
  'first publication verified',
]) {
  if (text.includes(forbidden) || statusParts.includes(forbidden)) {
    throw new Error(`Simonov Patriot Rodiny acquisition falsely closes an open object gate: ${forbidden}`);
  }
}

if (!status.includes('exact RSL serial record 01004527271 recovered and viewer-route clarification sent')) {
  throw new Error(`Simonov Patriot Rodiny RSL route transition disappeared: ${status}`);
}
if (!status.includes('no 03.12 issue-page evidence')) {
  throw new Error(`Simonov Patriot Rodiny page boundary disappeared: ${status}`);
}

console.log('Simonov Patriot Rodiny acquisition: exact RSL serial record 01004527271/full-viewer declaration is pinned and a stable 03.12 child-route clarification was sent; AONB remains pending; GAAO requires ESIA/post; issue/page remain unverified; no paid work authorized.');