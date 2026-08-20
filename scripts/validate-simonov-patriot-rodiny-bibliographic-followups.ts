import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_PATRIOT_RODINY_BIBLIOGRAPHIC_FOLLOWUPS_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov Patriot Rodiny bibliographic follow-up gate missing: ${path}`);
const text = readFileSync(path, 'utf8');
const status = text.match(/^Статус:\s*\*\*(.+?)\*\*/mu)?.[1] ?? '';

for (const marker of [
  'Pravda Severa provenance inquiry + RKP bibliographic inquiry sent / replies pending / exact 03.12.1941 issue-page still uninspected',
  '`portal@pravdasevera.ru`', '`1a01991b3cd97453`',
  '`info@inforost.org`', '`1a019984437dc5a3`',
  '`Газетная летопись 1941 №39–40`',
  'не используется как negative evidence',
  'chronologically impossible derivative error',
  '`Петрозаводск, 1940-`',
  'Место изд.: Архангельск',
  '20 мая 1941 года',
  'catalog-history ambiguity',
  '3 декабря — безусловно первая публикация',
  '03.12.1941 issue/page uninspected',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov Patriot Rodiny bibliographic boundary disappeared: ${marker}`);
}

if (/reply received|exact RKP entry recovered|issue-page inspected|direct issue verified|first publication direct-verified/iu.test(status)) {
  throw new Error(`Simonov Patriot Rodiny bibliographic status falsely closes an open gate: ${status}`);
}

console.log('Simonov Patriot Rodiny bibliography: Pravda Severa provenance + RKP inquiries sent; early-November derivative rejected chronologically; Petrozavodsk retained as catalog-history ambiguity; direct 03.12 issue/page pending.');
