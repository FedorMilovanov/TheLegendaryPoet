import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_REGIONAL_ARCHIVE_ACQUISITION_INQUIRIES_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov regional archive acquisition gate missing: ${path}`);
const text = readFileSync(path, 'utf8');
const status = text.match(/^Статус:\s*\*\*(.+?)\*\*/mu)?.[1] ?? '';

for (const marker of [
  'GAPK inquiry sent / Sakhalin museum first address delivery failed then rerouted / replies and item-level evidence pending / no paid work authorized',
  'supersedes прежнюю operational-фразу `запрос подготовлен, но не отправлен`',
  '**`arhivpk@bk.ru`**', '**Р-1510**', '**1961–1967**', '`1a0173aec38d1bfe`',
  '`Mmk-info@sakhalin.gov.ru`', '`1a0173bb91ce4eaf`', '`1a0173bdfca2bbc7`',
  '**`554 5.7.1 Access denied`**',
  '**`mmk-pobeda@sakhalin.gov.ru`**', '`1a019baa84f7f995`',
  'личная встреча Солодовникова и Лоскутова не считается установленной',
  'GAPK inquiry sent / reply pending / opis and specific storage units remain uninspected',
  'museum first address delivery failed / reroute sent / reply pending / no museum item inspected / no personal meeting promoted to fact',
  '**никакой платной работы до точной стоимости и отдельного подтверждения**',
  '**не оплачивать/не подтверждать автоматически**',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov regional archive boundary disappeared: ${marker}`);
}

if (/item inspected|opis verified|meeting verified|paid work authorized/iu.test(status)) {
  throw new Error(`Simonov regional archive status falsely closes an open gate: ${status}`);
}
if (/two official regional archive\/museum inquiries sent/iu.test(status)) {
  throw new Error(`Simonov regional archive status erased the proven Sakhalin SMTP failure: ${status}`);
}

console.log('Simonov regional archives: GAPK inquiry pending; Sakhalin first address SMTP-failed and was rerouted to current museum address; items/meeting remain unverified; no paid work authorized.');
