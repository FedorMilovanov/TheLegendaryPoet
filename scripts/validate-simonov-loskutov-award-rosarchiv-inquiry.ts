import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_LOSKUTOV_AWARD_ROSARCHIV_INQUIRY_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov TsAMO route dossier missing: ${path}`);
const text = readFileSync(path, 'utf8');
const status = text.match(/^Статус:\s*\*\*(.+?)\*\*/mu)?.[1] ?? '';

for (const marker of [
  'exact TsAMO locator known / Rosarchiv route reply received / direct TsAMO inquiry sent / TsAMO reply and direct scan pending / no paid work authorized',
  '**10800112**',
  '**ЦАМО**',
  '**33**',
  '**682524**',
  '**34**',
  '**246–247**',
  '**`rosarchiv@gov.ru`**',
  '**`official@mil.ru`**',
  'ЦАМО **не относится к федеральным государственным архивам, подведомственным Росархиву**',
  '142100, Московская область, г. Подольск, ул. Кирова, 74',
  '`1a0194590e01cf9e`',
  'Rosarchiv route reply received ≠ TsAMO reply received ≠ archive object confirmed ≠ scan received ≠ page inspected',
  '**не начинать платные работы без отдельного подтверждения после сообщения стоимости**',
  'Сам архивный объект и его текст всё ещё fail-closed до ответа ЦАМО и визуального просмотра',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov TsAMO route boundary disappeared: ${marker}`);
}

if (!status.includes('Rosarchiv route reply received') || !status.includes('direct TsAMO inquiry sent')) {
  throw new Error(`Simonov TsAMO route transition disappeared: ${status}`);
}
if (/TsAMO reply received|archive object confirmed|scan received|page inspected|direct-object verified|paid work authorized/iu.test(status)) {
  throw new Error(`Simonov TsAMO dossier falsely closes an open gate: ${status}`);
}

console.log('Simonov award object: Rosarchiv route reply received; direct TsAMO inquiry sent; TsAMO reply/scan pending; no paid work authorized.');