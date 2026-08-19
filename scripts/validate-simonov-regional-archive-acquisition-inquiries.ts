import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_REGIONAL_ARCHIVE_ACQUISITION_INQUIRIES_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov regional archive acquisition gate missing: ${path}`);
const text = readFileSync(path, 'utf8');
const status = text.match(/^Статус:\s*\*\*(.+?)\*\*/mu)?.[1] ?? '';

for (const marker of [
  'GAPK inquiry sent / both published Sakhalin museum email routes SMTP-blocked / ministry routing request sent / replies and item-level evidence pending / no paid work authorized',
  'supersedes прежнюю operational-фразу `запрос подготовлен, но не отправлен`',
  '**`arhivpk@bk.ru`**', '**Р-1510**', '**1961–1967**', '`1a0173aec38d1bfe`',
  '`Mmk-info@sakhalin.gov.ru`', '`1a0173bb91ce4eaf`', '`1a0173bdfca2bbc7`',
  '**`mmk-pobeda@sakhalin.gov.ru`**', '`1a019baa84f7f995`', '`1a019bad09fb168d`',
  '**`554 5.7.1 Access denied`**',
  '**`culture@sakhalin.gov.ru`**', '**+7 (4242) 67-23-23**', '`1a019c2ceabb6074`',
  'museum-domain delivery blocked from current sender/channel',
  'личная встреча Солодовникова и Лоскутова не считается установленной',
  'GAPK inquiry sent / reply pending / opis and specific storage units remain uninspected',
  'Sakhalin Ministry: routing request sent → routing/substantive reply pending',
  'museum item: still uninspected',
  '**никакой платной работы до точной стоимости и отдельного подтверждения**',
  '**не оплачивать/не подтверждать автоматически**',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov regional archive boundary disappeared: ${marker}`);
}

if (/item inspected|opis verified|meeting verified|paid work authorized|museum confirmation/iu.test(status)) {
  throw new Error(`Simonov regional archive status falsely closes an open gate: ${status}`);
}
if (/reroute sent\s*\/\s*reply pending/iu.test(status)) {
  throw new Error(`Simonov regional archive status erased the proven second Sakhalin SMTP failure: ${status}`);
}

console.log('Simonov regional archives: GAPK inquiry pending; both published Sakhalin museum emails SMTP-blocked; ministry routing request sent; museum items/meeting remain unverified; no paid work authorized.');
