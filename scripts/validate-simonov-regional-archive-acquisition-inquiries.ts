import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_REGIONAL_ARCHIVE_ACQUISITION_INQUIRIES_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov regional archive acquisition gate missing: ${path}`);
const text = readFileSync(path, 'utf8');
const status = text.match(/^Статус:\s*\*\*(.+?)\*\*/mu)?.[1] ?? '';
const statusParts = status.split('/').map((part) => part.trim());

for (const marker of [
  'GAPK inquiry sent / Sakhalin museum + ministry email routes all SMTP-blocked / authenticated government-channel or phone route required / item-level evidence pending / no paid work authorized',
  'supersedes прежнюю operational-фразу `запрос подготовлен, но не отправлен`',
  '**`arhivpk@bk.ru`**', '**Р-1510**', '**1961–1967**', '`1a0173aec38d1bfe`',
  '`Mmk-info@sakhalin.gov.ru`', '`1a0173bb91ce4eaf`', '`1a0173bdfca2bbc7`',
  '`mmk-pobeda@sakhalin.gov.ru`', '`1a019baa84f7f995`', '`1a019bad09fb168d`',
  '`culture@sakhalin.gov.ru`', '`1a019c2ceabb6074`', '`1a019c2eed9dbe55`',
  '**`554 5.7.1 Access denied`**',
  'systemic `sakhalin.gov.ru` email-delivery block from current sender/channel',
  '**`https://gosuslugi65.ru/`**', '**`https://www.gosuslugi.ru/`**',
  'Приёмная граждан на сайте Правительства Сахалинской области',
  '**+7 (4242) 67-23-23**', '**+7 (4242) 49-57-27**',
  'не имитируем отправку и не обходим ЕСИА/капчу',
  'three official email attempts SMTP-blocked → authenticated government portal or phone required → museum item search not yet initiated through that channel',
  'личная встреча Солодовникова и Лоскутова не считается установленной',
  'GAPK inquiry sent / reply pending / opis and specific storage units remain uninspected',
  'Sakhalin authenticated portal / phone: manual-auth/human interaction required',
  'museum item: uninspected',
  '**никакой платной работы до точной стоимости и отдельного подтверждения**',
  '**не оплачивать/не подтверждать автоматически**',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov regional archive boundary disappeared: ${marker}`);
}

const forbiddenPositiveStatusParts = [
  'item inspected',
  'opis verified',
  'meeting verified',
  'paid work authorized',
  'museum confirmation',
  'portal submitted',
  'ticket received',
];
if (statusParts.some((part) => forbiddenPositiveStatusParts.includes(part))) {
  throw new Error(`Simonov regional archive status falsely closes an open gate: ${status}`);
}
if (/routing request sent|museum.*reply pending/iu.test(status)) {
  throw new Error(`Simonov regional archive status erased the proven ministry SMTP failure/manual-auth requirement: ${status}`);
}
if (!statusParts.includes('no paid work authorized')) {
  throw new Error(`Simonov regional archive status lost no-paid-work boundary: ${status}`);
}

console.log('Simonov regional archives: GAPK inquiry pending; both museum emails and ministry email SMTP-blocked; authenticated Sakhalin government portal/phone required; museum items/meeting remain unverified; no paid work authorized.');