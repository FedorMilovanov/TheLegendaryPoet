import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { simonovSonArtilleristaDraft as essay } from '../src/data/essays/simonovSonArtilleristaDraft';
import { getAllEssays, getEssayBySlug } from '../src/data/essays/index';
import { publishEssay } from '../src/data/essays/publishEssay';
import { estimateReadTime } from '../src/utils/readTime';

function read(path: string, label: string): string {
  if (!existsSync(path)) throw new Error(`${label} is missing: ${path}`);
  return readFileSync(path, 'utf8');
}

function requireMarkers(label: string, text: string, markers: string[]): void {
  for (const marker of markers) {
    if (!text.includes(marker)) throw new Error(`${label} boundary disappeared: ${marker}`);
  }
}

// Publication isolation: staged prose must not become public by accident.
const published = getAllEssays();
if (getEssayBySlug(essay.slug) || published.some((item) => item.id === essay.id || item.slug === essay.slug)) {
  throw new Error('Simonov staged draft leaked into the canonical public essay catalog');
}
const catalogSource = read('src/data/essays/index.ts', 'canonical essay catalog');
if (catalogSource.includes('simonovSonArtilleristaDraft') || catalogSource.includes(essay.slug)) {
  throw new Error('Simonov staged draft is imported or named by the canonical catalog');
}
const browserPayload = read('src/data/essays/browserEssayData.ts', 'generated browser essay data');
if (browserPayload.includes(essay.slug) || browserPayload.includes(essay.id)) {
  throw new Error('Simonov staged draft leaked into generated browser publication data');
}

// Hero is an editorial reconstruction, not evidence photography.
if (essay.coverKind !== 'reconstruction') throw new Error('Simonov staged hero must remain reconstruction');
if (essay.coverSourceUrl) throw new Error('Simonov reconstruction must not claim an archival source URL');
if (!essay.coverCredit?.includes('не документальная фотография')) {
  throw new Error('Simonov staged hero lost its reconstruction disclosure');
}
const expectedCover = '/images/essays/simonov/simonov-son-artillerista-hero.webp';
const expectedCoverSha256 = '13ba95ba05eaa87eb8a7f6eac7fe888e0f5710bd9dc91a50c5b83dd2b6e7a087';
if (essay.cover !== expectedCover || essay.cardCover !== expectedCover) {
  throw new Error(`Simonov staged hero target drifted: ${essay.cover} / ${essay.cardCover}`);
}
let coverStatus = `pending-owner-approval:${expectedCoverSha256}`;
const coverPath = `public${expectedCover}`;
if (existsSync(coverPath)) {
  const actualSha = createHash('sha256').update(readFileSync(coverPath)).digest('hex');
  if (actualSha !== expectedCoverSha256) throw new Error(`Simonov hero SHA drift: ${actualSha}`);
  coverStatus = `exact-bytes-present:${actualSha}`;
}

// Closed baseline ledger.
const ledger = read('docs/research/SIMONOV_SON_ARTILLERISTA_SOURCE_LEDGER_2026-08.md', 'Simonov 40-source ledger');
const ledgerRows = ledger.match(/^\|\s*\d+\s*\|/gmu)?.length ?? 0;
if (ledgerRows !== 40) throw new Error(`Simonov research baseline drifted: expected 40 rows, found ${ledgerRows}`);
requireMarkers('Simonov 40-source ledger', ledger, [
  'точный день боя не выдан за установленный факт',
  'конфликт `3 ноября / 3 декабря / 7 декабря`',
  'полный охраняемый текст поэмы не включён',
  'owner approval для hero reconstruction',
  'register draft в `src/data/essays/index.ts` только отдельной publication-транзакцией',
]);

// Core historical witness reconciliation.
const witness = read('docs/research/SIMONOV_SON_ARTILLERISTA_WITNESS_RECONCILIATION_2026-08.md', 'Simonov witness reconciliation');
requireMarkers('Simonov witness reconciliation', witness, [
  'Лоскутов controlling',
  'примерно в **три километра**',
  '**двухкилометровом** пути',
  '**миномётную батарею**',
  '**двух миномётных батареях**',
  'портрет И. А. Лоскутова, 1941',
  'rights pending',
]);
if (witness.includes('расхождение источников устранено')) throw new Error('Witness conflicts were falsely harmonized');

// Loskutov print witness remains page-level pending despite full RSL viewer availability.
const printWitness = read('docs/research/SIMONOV_LOSKUTOV_PRINT_WITNESS_2026-08.md', 'Simonov Loskutov print witness');
requireMarkers('Simonov Loskutov print witness', printWitness, [
  '01007444220',
  'От Халхингола до Берлина',
  '1973',
  'с. 54–62',
  'bibliographic object + full-RSL-viewer availability verified / page 54–62 inspection pending',
  'Документ находится в открытом доступе в полном объёме',
  'командир / комиссар',
  'письмо Ивана Лоскутова Симонову от 3 марта 1966 года в опубликованной Симоновым передаче',
]);
if (printWitness.includes('страницы 54–62 визуально проверены в РГБ')) throw new Error('RSL print witness falsely closed');

// December 1941 newspaper hierarchy: page 3 is strong scholarly evidence, not a direct scan.
const newspaper = read('docs/research/SIMONOV_SON_ARTILLERISTA_NEWSPAPER_OBJECT_GATE_2026-08.md', 'Simonov newspaper gate');
requireMarkers('Simonov newspaper gate', newspaper, [
  'issue identity narrowed / Red Star page 3 strongly corroborated / direct page inspection still pending',
  '№288 (5043)',
  '4 258 147 байт',
  'Военно-исторического журнала',
  'Издание Министерства обороны России',
  '7 декабря. С. 3',
  'Пока **не** разрешено писать:',
  'direct scan №288, p.3 ещё не открыт',
  'page 3 strongly corroborated / direct newspaper-object inspection required',
  'только затем повысить статус до `direct page verified`',
  '01006521228',
  '3 декабря 1941 года',
  '**unknown / do not infer**',
  '3 ноября не используется как publication fact',
]);
// The gate may quote a forbidden sentence inside its explicit “do not write” policy.
// Fail only if its declared status itself is upgraded to a direct-page closure.
if (/Статус страницы:\s*\*\*direct page verified\*\*/u.test(newspaper)) {
  throw new Error('Newspaper gate falsely marks p.3 direct-verified');
}

const page3 = read('docs/research/SIMONOV_RED_STAR_PAGE_3_SCHOLARLY_GATE_2026-08.md', 'Simonov Red Star page-3 scholarly gate');
requireMarkers('Simonov Red Star page-3 scholarly gate', page3, [
  'page 3 strongly corroborated by official military-history scholarly citation / direct newspaper scan still pending',
  'Военно-исторический журнал',
  'Издание Министерства обороны России',
  'КОЛОБОВ Евгений Юрьевич',
  'примечании **39**',
  '7 декабря. С. 3',
  'direct page verified',
  'direct visual newspaper scan №288, p.3',
]);
if (/Текущий статус[^\n]*direct scan verified/iu.test(page3)) throw new Error('Page-3 scholarly gate falsely upgrades citation to scan');

// Award-object exact locator exists, scan still pending.
const awardLocator = read('docs/research/SIMONOV_LOSKUTOV_AWARD_OBJECT_LOCATOR_2026-08.md', 'Simonov Loskutov award locator');
requireMarkers('Simonov Loskutov award locator', awardLocator, [
  '10800112',
  'ЦАМО, ф. 33, оп. 682524, д. 34, л. 246–247',
  '31.7.41',
  '6 суток',
  '500–600 метров',
  'scan not visually inspected',
]);

// Text and image rights remain fail-closed.
const textRights = read('docs/research/SIMONOV_SON_ARTILLERISTA_TEXT_RIGHTS_GATE_2026-08.md', 'Simonov text-rights gate');
requireMarkers('Simonov text-rights gate', textRights, [
  'full-text publication blocked / short quotation only in staged essay',
  '31 декабря 2053 года',
  '1 января 2054 года',
  'полный текст «Сына артиллериста» не встраивается',
]);
if (textRights.includes('полный текст уже находится в общественном достоянии')) throw new Error('Text-rights gate falsely claims public domain');

const imageRights = read('docs/research/SIMONOV_SON_ARTILLERISTA_IMAGE_RIGHTS_GATE_2026-08.md', 'Simonov image-rights gate');
requireMarkers('Simonov image-rights gate', imageRights, [
  'archive images research-only pending item-level reuse authority',
  'G1 — Иван Алексеевич Лоскутов, 1941',
  'G2 — Ефим Самсонович Рыклис, 1941',
  'Они не являются разрешением на скачивание и перепубликацию',
  'В production нельзя переносить ни сами JPEG, ни их производные WebP автоматически',
]);

// Strong conflicts remain explicitly isolated.
const father = read('docs/research/SIMONOV_LOSKUTOV_FATHER_IDENTITY_GATE_2026-08.md', 'Loskutov father identity gate');
requireMarkers('Loskutov father identity gate', father, [
  'Alexei Mikhailovich substantially better supported',
  '`Иваном Михайловичем`',
  'Алексеем Михайловичем Лоскутовым',
  '**Не добавлять имя** в основной narrative до закрытия gate',
]);

const claimMatrix = read('docs/research/SIMONOV_SON_ARTILLERISTA_CLAIM_MATRIX_2026-08.md', 'Simonov claim matrix');
const claimRows = claimMatrix.match(/^\| C\d{2} \|/gmu)?.length ?? 0;
if (claimRows !== 48) throw new Error(`Simonov claim matrix drifted: expected 48 rows, found ${claimRows}`);
requireMarkers('Simonov claim matrix', claimMatrix, [
  'C36',
  '`Сын артиллериста` опубликован на с.3 №288',
  'A/B scholarly page citation; direct scan pending',
  'Страницу 3 `Красной звезды` можно называть только с provenance scholarly citation',
]);

// Bibliography integrity inside the Essay object.
const sources = essay.sources ?? [];
const sourcesById = new Map<string, (typeof sources)[number]>();
for (const source of sources) {
  if (!source.id) throw new Error(`Simonov staged source has no stable id: ${source.title}`);
  if (sourcesById.has(source.id)) throw new Error(`duplicate Simonov staged source id: ${source.id}`);
  sourcesById.set(source.id, source);
}
if (sourcesById.size < 18) throw new Error(`Simonov staged bibliography unexpectedly thin: ${sourcesById.size}`);
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

// Reader-text boundaries.
const readerText = essay.blocks.map((block) => {
  if ('text' in block) return block.text;
  if (block.type === 'section') return block.heading;
  if (block.type === 'note' && block.variant === 'myth') return `${block.claim} ${block.text}`;
  return '';
}).join('\n');
const words = readerText.match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
if (words < 1800 || words > 6000) throw new Error(`Simonov staged longform scope drifted: ${words} words`);
for (const forbidden of ['31 июля 1941 года', 'шесть суток', '3 ноября 1941 года впервые']) {
  if (readerText.includes(forbidden)) throw new Error(`Simonov staged prose promoted a blocked claim: ${forbidden}`);
}
for (const required of ['июль 1941 года', 'Точного дня в письме нет', 'два разведчика', 'радиостанция была разбита', 'Отец я тебе иль нет?', '3 декабря 1941 года', '7 декабря']) {
  if (!readerText.includes(required)) throw new Error(`Simonov staged evidence boundary disappeared: ${required}`);
}
if (essay.blocks.some((block) => block.type === 'poem')) throw new Error('Simonov staged article must not embed the full copyrighted poem');
if (essay.blocks.some((block) => block.type === 'image')) throw new Error('Documentary body images appeared before item-level rights ingestion');

const publicationCandidate = publishEssay(essay);
const expectedReadTime = estimateReadTime(essay.blocks);
if (publicationCandidate.readTime !== expectedReadTime) {
  throw new Error(`Simonov publication-derived readTime drift: ${publicationCandidate.readTime} !== ${expectedReadTime}`);
}

console.log(
  `Simonov staged DoD: unpublished; ${words} words; ${sourcesById.size} cited source units; baseline=${ledgerRows}; claims=${claimRows}; RedStar=№288/p3-scholarly-corroborated/direct-scan-pending; Loskutov1973=RSL-full-viewer/page54-62-pending; award=10800112-scan-pending; image-rights=fail-closed; text-rights=full-text-blocked; hero=${coverStatus}.`,
);
