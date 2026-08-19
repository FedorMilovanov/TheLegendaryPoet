import { existsSync, readFileSync } from 'node:fs';
import { simonovSonArtilleristaDraft as essay } from '../src/data/essays/simonovSonArtilleristaDraft';

const gatePath = 'docs/research/SIMONOV_PUBLICATION_READINESS_GATE_2026-08.md';
if (!existsSync(gatePath)) throw new Error(`Simonov publication readiness gate missing: ${gatePath}`);
const gate = readFileSync(gatePath, 'utf8');

for (const marker of [
  'claim-aware publication gate / research closure separated from reader safety / owner-approved hero bytes + final publication transaction remain hard blockers',
  'authoritative gate **для production registration текущего reader**',
  '**03.12 issue/page = P1 research closure, не P0 publication blocker, пока qualification сохраняется.**',
  '**award scan = P1 research closure, не P0 publication blocker, пока blocked numbers не входят в reader.**',
  '**T8 1982 + RSL 1973 target pages = P1 research closure, не P0 publication blocker, пока neutral wording и father-name omission сохраняются.**',
  'не являются cited evidence production reader',
  'P0-A — exact hero bytes + owner approval',
  '13ba95ba05eaa87eb8a7f6eac7fe888e0f5710bd9dc91a50c5b83dd2b6e7a087',
  'редакционная реконструкция; не документальная фотография Ивана Лоскутова',
  'P0-B — visual rights только для реально включаемых documentary assets',
  'Текущий Essay не содержит body `image` blocks',
  'P0-C — final reader/registration transaction',
  'около трёх километров по воспоминанию Лоскутова',
  'Если любой из этих invariants меняется, соответствующий research object автоматически возвращается в P0.',
  'Ни один из них не объявлен закрытым этим gate.',
]) {
  if (!gate.includes(marker)) throw new Error(`Simonov publication-readiness boundary disappeared: ${marker}`);
}

const readerText = essay.blocks.map((block) => {
  if ('text' in block) return block.text;
  if (block.type === 'section') return block.heading;
  if (block.type === 'note' && block.variant === 'myth') return `${block.claim} ${block.text}`;
  return '';
}).join('\n');
const folded = readerText.toLocaleLowerCase('ru-RU');

for (const required of [
  'июль 1941 года',
  'Точного дня в письме нет',
  'Три километра до высоты',
  'На командном пункте решили, что произошла ошибка, и запросили подтверждение',
  'Архангельские институциональные источники относят публикацию в «Патриоте Родины» к 3 декабря 1941 года',
  'Саму полосу «Патриота Родины» от 3 декабря редакция ещё не просмотрела',
  'не превращает эту дату в безоговорочно доказанную «самую первую» публикацию',
  'exact выпуск № 288 и его p.3 уже визуально проверены',
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
]) {
  if (readerText.includes(forbidden)) throw new Error(`Simonov reader promoted a P1-only unresolved claim: ${forbidden}`);
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
if (essay.coverKind !== 'reconstruction') throw new Error('Simonov hero must remain reconstruction until a different licensed cover is deliberately approved');
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

console.log('Simonov publication readiness: current reader is claim-safe without promoting unresolved P1 objects; hard blockers are artifact-specific hero approval/bytes plus the final registration and QA transaction.');