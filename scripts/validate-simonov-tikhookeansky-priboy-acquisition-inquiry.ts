import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_TIKHOOKEANSKY_PRIBOY_ACQUISITION_INQUIRY_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov Pacific Surf acquisition gate missing: ${path}`);
const text = readFileSync(path, 'utf8');
const status = text.match(/^Статус:\s*\*\*(.+?)\*\*/mu)?.[1] ?? '';

for (const marker of [
  'PKDB holdings address delivery failed / direct bibliographic-department reroute sent / reply pending / no paid work authorized / pp.3–13 uninspected',
  'Александр Санжара', '`Тихоокеанский прибой`', '1984', 'С. 3–13',
  '`hranenie@pkdb.net`', '**`biblio@pkdb.net`**',
  '`1a01727f8a2e9b03`', '`1a0172809b8f0d48`', '`1a019ba719ab0fd2`',
  '**`550 5.7.1 No such user`**',
  'два сильных конкурирующих textual lineages',
  'delivery failed → direct biblio reroute sent → reply pending → pp.3–13 uninspected',
  '**никакой платной работы без exact quote и отдельного подтверждения**',
  'не direct-print fact',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov Pacific Surf acquisition boundary disappeared: ${marker}`);
}

if (/reply received|pp\.3–13 (?:verified|inspected)|direct-print verified|family object received|reuse rights granted|paid work authorized/iu.test(status)) {
  throw new Error(`Simonov Pacific Surf status falsely closes an open gate: ${status}`);
}
if (/holdings inquiry sent\s*\/\s*reply pending/iu.test(status)) {
  throw new Error(`Simonov Pacific Surf status erased the proven SMTP delivery failure: ${status}`);
}

console.log('Simonov Pacific Surf 1984: holdings address SMTP-failed; official biblio reroute sent; reply/pages pending; father-name conflict remains fail-closed; no paid work authorized.');
