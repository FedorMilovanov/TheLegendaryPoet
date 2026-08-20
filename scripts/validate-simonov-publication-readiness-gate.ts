import { existsSync, readFileSync } from 'node:fs';
import { getEssayBySlug } from '../src/data/essays/index';
import { simonovSonArtilleristaPublished as essay } from '../src/data/essays/simonovSonArtilleristaPublished';

const gatePath = 'docs/research/SIMONOV_PUBLICATION_READINESS_GATE_2026-08.md';
const closeoutPath = 'docs/research/SIMONOV_PUBLICATION_CLOSEOUT_2026-08.md';
const textRightsPath = 'docs/research/SIMONOV_SON_ARTILLERISTA_TEXT_RIGHTS_GATE_2026-08.md';

for (const [path, label] of [
  [gatePath, 'Simonov publication readiness gate'],
  [closeoutPath, 'Simonov publication closeout'],
  [textRightsPath, 'Simonov text-rights gate'],
] as const) {
  if (!existsSync(path)) throw new Error(`${label} missing: ${path}`);
}

const gate = readFileSync(gatePath, 'utf8');
const closeout = readFileSync(closeoutPath, 'utf8');
const textRights = readFileSync(textRightsPath, 'utf8');

for (const marker of [
  'claim-aware publication gate / artifact blockers closed / research closure separated from reader safety / exact-head execution gate remains',
  'authoritative для **claim-aware границ production reader**',
  '**03.12 issue/page = P1 research closure, не P0 publication blocker, пока qualification сохраняется.**',
  '**award scan = P1 research closure, не P0 publication blocker, пока blocked numbers не входят в reader.**',
  '**T8 1982 + RSL 1973 target pages = P1 research closure, не P0 publication blocker, пока neutral wording и father-name omission сохраняются.**',
  'не являются cited evidence production reader',
  'P0-A — approved production hero: CLOSED',
  '5aa9024cab522b4a6b4686231ba09b91dcc66969b85ba8f5f6dcecce67e16dd5',
  '1600×900',
  '130 386 bytes',
  'редакционная реконструкция; не документальная фотография Ивана Лоскутова',
  'P0-B — visual rights для реально включаемых documentary assets: CLOSED BY ABSENCE',
  'Публичный Essay не содержит body `image` blocks',
  'P0-C — registration/discovery artifact transaction: CLOSED',
  'Search index, sitemap и Atom feed синхронизированы',
  'Успешную матрицу нельзя фиксировать новым «финальным» коммитом',
  'около трёх километров по воспоминанию Лоскутова',
  'Если любой из этих invariants меняется, соответствующий research object автоматически возвращается в P0.',
  'Ни один из них не объявлен закрытым этим gate.',
]) {
  if (!gate.includes(marker)) throw new Error(`Simonov publication-readiness boundary disappeared: ${marker}`);
}

const canonical = getEssayBySlug(essay.slug);
if (canonical !== essay) throw new Error('Simonov readiness gate: publication-safe object is not the canonical registered essay');

const readerText = essay.blocks.map((block) => {
  if ('text' in block && typeof block.text === 'string') return block.text;
  if (block.type === 'section') return block.heading;
  if (block.type === 'note' && block.variant === 'myth') return `${block.claim} ${block.text}`;
  return '';
}).join('\n');
const folded = readerText.toLocaleLowerCase('ru-RU');

for (const required of [
  'июль 1941 года',
  'Точного дня в письме нет',
  'Около трёх километров до высоты',
  'На командном пункте решили, что произошла ошибка, и запросили подтверждение',
  'Архангельские институциональные источники относят публикацию в «Патриоте Родины» к 3 декабря 1941 года',
  'Саму полосу «Патриота Родины» от 3 декабря редакция ещё не просмотрела',
  'не превращает эту дату в безоговорочно доказанную «самую первую» публикацию',
  'точный выпуск № 288 и его печатная страница 3 уже визуально проверены',
  'Обложка этой публикации — редакционная художественная реконструкция.',
]) {
  if (!readerText.includes(required)) throw new Error(`Simonov claim-aware reader invariant disappeared: ${required}`);
}

for (const forbidden of [
  '31 июля 1941 года',
  '6 суток',
  '500–600',
  '20881',
  'Иван Михайлович',
  'Алексей Михайлович',
  'самая первая публикация была 3 декабря',
  '3 декабря 1941 года впервые',
  'осложнённая старой дружбой семей',
  'Hero-кандидат',
  'До production merge',
]) {
  if (readerText.includes(forbidden)) throw new Error(`Simonov reader promoted a P1-only/staging claim: ${forbidden}`);
}

if (folded.includes('около двух километров') || folded.includes('примерно два километра')) {
  throw new Error('Simonov reader promoted the competing ~2 km route without direct closure');
}

if (essay.blocks.some((block) => block.type === 'image')) {
  throw new Error('Simonov publication readiness changed: body documentary images now exist and require item-level P0 rights/bytes');
}
if (essay.blocks.some((block) => block.type === 'poem')) {
  throw new Error('Simonov publication readiness changed: full poem block is not allowed');
}
if (essay.coverKind !== 'reconstruction') throw new Error('Simonov hero must remain reconstruction unless a different licensed cover is deliberately approved');
if (essay.coverSourceUrl) throw new Error('Simonov reconstruction must not acquire an archival coverSourceUrl');
if (!essay.coverCredit?.includes('не документальная фотография Ивана Лоскутова')) {
  throw new Error('Simonov reconstruction disclosure disappeared');
}

for (const researchStillOpen of [
  '`Патриот Родины` 03.12.1941 exact issue/page',
  'TsAMO `10800112` direct scan',
  'Simonov T8 1982 p.393 / pp.430–433',
  'RSL 1973 pp.54–62',
  'Ortenberg 1984 pp.95–96',
  'Sanjara 1984 pp.3–13',
  '`Правда` 22.03.1966 p.4',
  '`Учительская газета` 15.02.1966',
]) {
  if (!gate.includes(researchStillOpen)) throw new Error(`Simonov readiness gate silently dropped an open research route: ${researchStillOpen}`);
}

for (const marker of [
  'PUBLICATION ARTIFACT COMPLETE / APPROVED HERO PRESENT / CLAIM-AWARE READER SAFETY PRESERVED / MERGE REQUIRES GREEN EXACT-HEAD CHECKS',
  'Execution evidence живёт в checks самого PR на его exact head',
  'После успешной матрицы не требуется технический «closeout commit»',
]) {
  if (!closeout.includes(marker)) throw new Error(`Simonov readiness/closeout transaction boundary disappeared: ${marker}`);
}

for (const marker of [
  'full-text publication blocked / short quotation only in staged essay',
  '31 декабря 2053 года',
  '1 января 2054 года',
  'полный текст «Сына артиллериста» не встраивается',
]) {
  if (!textRights.includes(marker)) throw new Error(`Simonov text-rights boundary disappeared: ${marker}`);
}
if (textRights.includes('полный текст уже находится в общественном достоянии')) {
  throw new Error('Simonov text-rights gate falsely claims public domain');
}

console.log('Simonov publication readiness: artifact blockers are closed; canonical reader remains claim-safe, text-rights fail-closed, unresolved P1 research routes remain explicit, and merge still requires one green exact-head execution matrix.');
