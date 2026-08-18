import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_RED_STAR_DIRECT_MIRRORS_GATE_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov Red Star direct mirrors gate missing: ${path}`);
const text = readFileSync(path, 'utf8');

for (const marker of [
  'multiple actual scan/download routes recovered / exact issue bytes still not acquired in current toolchain',
  'Route A — ГПИБ / SHPL',
  'Route B — сайт Министерства обороны России',
  '1941, №145 (22 июня) — 1945, №207 (2 сентября)',
  'читать / скачать по номеру (PDF)',
  'Route C — ВБД `Военкор`',
  '`Читать онлайн`',
  '`Скачать`',
  'Internal issue ID **не равен номеру газеты**',
  'Route D — StudMed: декабрьская PDF-подшивка 1941',
  '`Красная звезда 1941 №283-309 декабрь`',
  '**160,87 МБ**',
  'krasnaya-zvezda-1941-283-309-dekabr_320f186f351.html',
  'Route E — LibInfo',
  '**4 258 147 байт**',
  'printed page **3**',
  'не republish facsimile',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov Red Star mirror boundary disappeared: ${marker}`);
}

for (const forbidden of [
  '№288 PDF bytes acquired',
  'page 3 direct scan verified',
  'mil.ru exact PDF URL recovered',
  'VBD issue ID вычислен',
]) {
  if (text.includes(forbidden)) throw new Error(`Simonov Red Star mirror gate overstates acquisition: ${forbidden}`);
}

console.log('Simonov Red Star scan routes: institutional and mirror acquisition paths pinned; exact №288 bytes/p.3 remain uninspected.');
