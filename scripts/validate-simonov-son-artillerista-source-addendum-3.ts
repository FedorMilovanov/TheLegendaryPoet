import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/research/SIMONOV_SON_ARTILLERISTA_SOURCE_ADDENDUM_2_2026-08.md';
if (!existsSync(path)) throw new Error(`Simonov third-pass source addendum missing: ${path}`);
const text = readFileSync(path, 'utf8');

for (const marker of [
  'third-pass source addendum / direct-object hierarchy preserved',
  'A3-01',
  'сразу идёт в номер',
  'A3-02',
  '`Лёнька` — вымышленное имя',
  'A3-03',
  'Александр Санжара',
  '`Тихоокеанский прибой`',
  'direct print object pending',
  'A3-04',
  '1983',
  '1985',
  'не доказывает автоматически',
  'A3-05',
  'Светланы Филипповой',
  'A3-06',
  'exact passage',
  'не локализован',
  'A3-07',
  'tertiary bibliographic lead only',
  '15 февраля 1966',
  'Direct issue/article object',
  'не найдены',
]) {
  if (!text.includes(marker)) throw new Error(`Simonov third-pass source boundary disappeared: ${marker}`);
}

for (const forbidden of [
  'Тихоокеанский прибой 1984 direct object verified',
  'В номер original Ortenberg locus verified',
  'Учительская газета 15.02.1966 verified primary object',
]) {
  if (text.includes(forbidden)) throw new Error(`Simonov third-pass addendum overstates closure: ${forbidden}`);
}

console.log('Simonov source addendum III: author handoff and invented-name facts usable; Primorye 1984, Ortenberg exact locus and Feb-1966 press lead remain object-pending.');
