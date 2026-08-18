import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { simonovSonArtilleristaDraft as essay } from '../src/data/essays/simonovSonArtilleristaDraft';
import { getAllEssays, getEssayBySlug } from '../src/data/essays/index';
import { publishEssay } from '../src/data/essays/publishEssay';
import { estimateReadTime } from '../src/utils/readTime';

const published = getAllEssays();
if (getEssayBySlug(essay.slug) || published.some((item) => item.id === essay.id || item.slug === essay.slug)) {
  throw new Error('Simonov staged draft leaked into the canonical public essay catalog');
}

const catalogSource = readFileSync('src/data/essays/index.ts', 'utf8');
if (catalogSource.includes('simonovSonArtilleristaDraft') || catalogSource.includes(essay.slug)) {
  throw new Error('Simonov staged draft is imported or named by the canonical catalog');
}

const browserPayload = readFileSync('src/data/essays/browserEssayData.ts', 'utf8');
if (browserPayload.includes(essay.slug) || browserPayload.includes(essay.id)) {
  throw new Error('Simonov staged draft leaked into generated browser publication data');
}

if (essay.coverKind !== 'reconstruction') {
  throw new Error('Simonov staged hero must remain classified as reconstruction');
}
if (essay.coverSourceUrl) {
  throw new Error('Simonov reconstruction must not claim an archival source URL');
}
if (!essay.coverCredit?.includes('не документальная фотография')) {
  throw new Error('Simonov staged hero lost its reconstruction disclosure');
}

const expectedCover = '/images/essays/simonov/simonov-son-artillerista-hero.webp';
const expectedCoverSha256 = '13ba95ba05eaa87eb8a7f6eac7fe888e0f5710bd9dc91a50c5b83dd2b6e7a087';
if (essay.cover !== expectedCover || essay.cardCover !== expectedCover) {
  throw new Error(`Simonov staged hero target drifted: ${essay.cover} / ${essay.cardCover}`);
}
const coverPath = `public${expectedCover}`;
let coverStatus = `pending-owner-approval:${expectedCoverSha256}`;
if (existsSync(coverPath)) {
  const actualSha = createHash('sha256').update(readFileSync(coverPath)).digest('hex');
  if (actualSha !== expectedCoverSha256) {
    throw new Error(`Simonov hero exists but does not match staged candidate bytes: ${actualSha}`);
  }
  coverStatus = `exact-bytes-present:${actualSha}`;
}

const ledgerPath = 'docs/research/SIMONOV_SON_ARTILLERISTA_SOURCE_LEDGER_2026-08.md';
if (!existsSync(ledgerPath)) throw new Error('Simonov 40-source research ledger is missing');
const ledger = readFileSync(ledgerPath, 'utf8');
const ledgerRows = ledger.match(/^\|\s*\d+\s*\|/gmu)?.length ?? 0;
if (ledgerRows !== 40) throw new Error(`Simonov research round drifted: expected 40 ledger rows, found ${ledgerRows}`);
for (const boundary of [
  'точный день боя не выдан за установленный факт',
  'конфликт `3 ноября / 3 декабря / 7 декабря`',
  'полный охраняемый текст поэмы не включён',
  'owner approval для hero reconstruction',
  'register draft в `src/data/essays/index.ts` только отдельной publication-транзакцией',
]) {
  if (!ledger.includes(boundary)) throw new Error(`Simonov publication boundary disappeared from ledger: ${boundary}`);
}

const archivalFollowupPath = 'docs/research/SIMONOV_SON_ARTILLERISTA_ARCHIVAL_FOLLOWUP_2026-08.md';
if (!existsSync(archivalFollowupPath)) {
  throw new Error('Simonov archival follow-up ledger is missing');
}
const archivalFollowup = readFileSync(archivalFollowupPath, 'utf8');
for (const marker of [
  '01006521228',
  '000199_000009_004509621',
  'ЦАМО, фонд 33, опись 682524, дело 32',
  'CC BY-SA 4.0',
  'File:Petsamo 02.jpg',
  'Поныри, 1943',
  'конкретная полоса «Патриот Родины» 03.12.1941',
  'конкретная полоса «Красной звезды» 07.12.1941',
]) {
  if (!archivalFollowup.includes(marker)) {
    throw new Error(`Simonov archival follow-up boundary disappeared: ${marker}`);
  }
}
if (archivalFollowup.includes('3 декабря 1941 года несомненно была первой публикацией')) {
  throw new Error('Simonov archival follow-up overstates the unresolved first-publication claim');
}

const loskutovPrintWitnessPath = 'docs/research/SIMONOV_LOSKUTOV_PRINT_WITNESS_2026-08.md';
if (!existsSync(loskutovPrintWitnessPath)) {
  throw new Error('Simonov Loskutov print-witness gate is missing');
}
const loskutovPrintWitness = readFileSync(loskutovPrintWitnessPath, 'utf8');
for (const marker of [
  '01007444220',
  'От Халхингола до Берлина',
  '1973',
  'с. 54–62',
  'bibliographic object verified / page inspection pending',
  'письмо Ивана Лоскутова Симонову от 3 марта 1966 года в опубликованной Симоновым передаче',
  'точный календарный день боя',
  'шесть суток',
]) {
  if (!loskutovPrintWitness.includes(marker)) {
    throw new Error(`Simonov Loskutov print-witness boundary disappeared: ${marker}`);
  }
}
if (loskutovPrintWitness.includes('архивный автограф письма Лоскутова подтверждён')) {
  throw new Error('Simonov Loskutov witness incorrectly claims archival-autograph closure');
}

const sources = essay.sources ?? [];
const sourcesById = new Map<string, (typeof sources)[number]>();
for (const source of sources) {
  if (!source.id) throw new Error(`Simonov staged source has no stable id: ${source.title}`);
  if (sourcesById.has(source.id)) throw new Error(`duplicate Simonov staged source id: ${source.id}`);
  sourcesById.set(source.id, source);
}
if (sourcesById.size < 18) {
  throw new Error(`Simonov staged bibliography is unexpectedly thin: ${sourcesById.size}`);
}

const citedIds = new Set<string>();
for (const block of essay.blocks) {
  if (!('sourceIds' in block)) continue;
  for (const id of block.sourceIds ?? []) {
    if (!sourcesById.has(id)) throw new Error(`Simonov staged block cites missing source: ${id}`);
    citedIds.add(id);
  }
}
for (const id of sourcesById.keys()) {
  if (!citedIds.has(id)) throw new Error(`Simonov staged bibliography contains uncited source: ${id}`);
}

for (const id of ['rsl-1941', 'simonov-diary-neb', 'simonov-loskutov-letter', 'kola-ryklis']) {
  const source = sourcesById.get(id);
  if (!source?.url?.startsWith('https://')) throw new Error(`Simonov strong source lost HTTPS provenance: ${id}`);
}

const readerText = essay.blocks.map((block) => {
  if ('text' in block) return block.text;
  if (block.type === 'section') return block.heading;
  if (block.type === 'note' && block.variant === 'myth') return `${block.claim} ${block.text}`;
  return '';
}).join('\n');
const words = readerText.match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
if (words < 1800 || words > 6000) throw new Error(`Simonov staged longform scope drifted: ${words} words`);

for (const forbidden of [
  '31 июля 1941 года',
  'шесть суток',
  '3 ноября 1941 года впервые',
]) {
  if (readerText.includes(forbidden)) {
    throw new Error(`Simonov staged prose promoted a blocked claim: ${forbidden}`);
  }
}

for (const required of [
  'июлем 1941-го',
  'два разведчика',
  'радиостанция была разбита',
  'Отец я тебе иль нет?',
  '3 декабря 1941 года',
  '7 декабря',
]) {
  if (!readerText.includes(required)) throw new Error(`Simonov staged evidence boundary disappeared: ${required}`);
}

const fullPoemWarning = essay.blocks.filter((block) => block.type === 'poem');
if (fullPoemWarning.length !== 0) {
  throw new Error('Simonov staged article must not embed the full copyrighted poem');
}

const bodyImages = essay.blocks.filter((block) => block.type === 'image');
if (bodyImages.length !== 0) {
  throw new Error('Simonov staged draft gained documentary body images before item-level rights ingestion');
}

const publicationCandidate = publishEssay(essay);
const expectedReadTime = estimateReadTime(essay.blocks);
if (publicationCandidate.readTime !== expectedReadTime) {
  throw new Error(`Simonov publication-derived readTime drift: ${publicationCandidate.readTime} !== ${expectedReadTime}`);
}

console.log(
  `Simonov staged DoD: unpublished; ${words} words; ${sourcesById.size} cited source units; research-ledger=${ledgerRows}; archival-follow-up=verified; Loskutov-print-witness=verified-bibliographic/pending-pages; hero=${coverStatus}; newspaper-object gate remains open.`,
);
