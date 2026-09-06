import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { benislavskayaDraft } from '../src/data/essays/benislavskayaDraft';
import { benislavskayaPublished } from '../src/data/essays/benislavskayaPublished';
import { getAllEssays, getEssayBySlug } from '../src/data/essays/index';

const essay = benislavskayaPublished;
const published = getAllEssays();
const catalogEssay = getEssayBySlug(essay.slug);

if (!catalogEssay || catalogEssay.id !== essay.id) {
  throw new Error('Benislavskaya publication is missing from the canonical essay catalog');
}
if (!published.some((item) => item.id === essay.id && item.slug === essay.slug)) {
  throw new Error('Benislavskaya publication is missing from the published catalog array');
}
if (catalogEssay === benislavskayaDraft || essay === benislavskayaDraft) {
  throw new Error('Benislavskaya public catalog must use the publication-safe projection, not the staged draft object');
}

const catalogSource = readFileSync('src/data/essays/index.ts', 'utf8');
if (!catalogSource.includes("from './benislavskayaPublished'")) {
  throw new Error('Canonical essay catalog does not import the Benislavskaya publication projection');
}
if (catalogSource.includes("from './benislavskayaDraft'")) {
  throw new Error('Canonical essay catalog imports the staged Benislavskaya draft directly');
}

if (essay.kicker?.includes('staged draft')) {
  throw new Error('Published Benislavskaya metadata still carries the staged-draft marker');
}
if (essay.kicker !== 'Документальное исследование') {
  throw new Error(`Unexpected Benislavskaya publication kicker: ${essay.kicker}`);
}
if (essay.date !== '2026-09-06') {
  throw new Error(`Unexpected Benislavskaya publication date: ${essay.date}`);
}

const expectedCover = '/images/essays/benislavskaya/benislavskaya-editorial-hero.webp';
const expectedCoverSha256 = '0b1f1146f77ce154479042fc9a1afbe00133528eee14f220b4fa74990bd57e48';
const expectedCoverBytes = 132172;
if (essay.cover !== expectedCover || essay.cardCover !== expectedCover) {
  throw new Error(`Benislavskaya publication hero target drifted: ${essay.cover} / ${essay.cardCover}`);
}
if (essay.coverKind !== 'reconstruction') {
  throw new Error('Benislavskaya publication hero must remain classified as reconstruction');
}
if (essay.coverSourceUrl) {
  throw new Error('Benislavskaya reconstruction must not claim an archival source URL');
}
if (!essay.coverCredit?.includes('редакционная кинематографическая реконструкция')) {
  throw new Error('Benislavskaya publication lost its reconstruction disclosure');
}

const coverPath = `public${expectedCover}`;
if (!existsSync(coverPath)) throw new Error('Benislavskaya publication hero file is missing');
const coverBytes = readFileSync(coverPath);
if (coverBytes.byteLength !== expectedCoverBytes) {
  throw new Error(`Benislavskaya hero byte length drifted: ${coverBytes.byteLength} !== ${expectedCoverBytes}`);
}
const coverSha256 = createHash('sha256').update(coverBytes).digest('hex');
if (coverSha256 !== expectedCoverSha256) {
  throw new Error(`Benislavskaya publication hero bytes drifted: ${coverSha256}`);
}

const bodyImages = essay.blocks.filter((block) => block.type === 'image');
if (bodyImages.length !== 0) {
  throw new Error('Benislavskaya v1 publication gained documentary body images without a rights package');
}

const sources = essay.sources ?? [];
if (sources.length !== 13) throw new Error(`Benislavskaya publication source scope changed: ${sources.length}`);
const sourceIds = new Set(sources.map((source) => source.id).filter(Boolean));
for (const block of essay.blocks) {
  if (!('sourceIds' in block)) continue;
  for (const id of block.sourceIds ?? []) {
    if (!sourceIds.has(id)) throw new Error(`Benislavskaya published block cites missing source: ${id}`);
  }
}

const readerText = essay.blocks.map((block) => {
  if ('text' in block) return block.text;
  if (block.type === 'section') return block.heading;
  if (block.type === 'note' && block.variant === 'myth') return `${block.claim} ${block.text}`;
  return '';
}).join('\n');

for (const marker of [
  '35 писем, записок и телеграмм',
  '14 писем Бениславской Есенину',
  '13 пронумерованных единиц',
  '16 позиций',
  'Состав переписки в разных источниках остаётся неодинаковым',
  'Прямой снимок с. 411 книги П. Ф. Юшина 1969 года',
  'не используются как доказательство пяти самостоятельных писем',
  '16 июля 1925 года',
  '339–340',
  'не доказывает самостоятельной редакционной власти',
  'не учреждает современную должность «агента»',
]) {
  if (!readerText.includes(marker)) throw new Error(`Benislavskaya publication evidence boundary disappeared: ${marker}`);
}

for (const forbidden of [
  'Публикационный gate остаётся честно открытым',
  'Для финальной reader-версии нужен полный непрерывный опубликованный корпус',
  '234–281 provisional',
]) {
  if (readerText.includes(forbidden)) {
    throw new Error(`Benislavskaya publication leaked obsolete staging-only wording: ${forbidden}`);
  }
}

const yushin = sources.find((source) => source.id === 'ben-yushin-bibliography');
for (const marker of ['с. 411', '#121–#134', '18.01', '08.02', '30.11', '29.12.1924', '12.04.1925']) {
  if (!yushin?.note?.includes(marker)) {
    throw new Error(`Benislavskaya Yushin publication source lost holder-readback marker: ${marker}`);
  }
}
const laterBook = sources.find((source) => source.id === 'ben-1995-book');
for (const marker of ['13-письменный горизонт', 'с. 234–235', 'платный скан для v1 не требуется']) {
  if (!laterBook?.note?.includes(marker)) {
    throw new Error(`Benislavskaya later-edition source lost publication boundary: ${marker}`);
  }
}

const resolutionPath = 'docs/research/BENISLAVSKAYA_PUBLICATION_RESOLUTION_2026-09-06.md';
if (!existsSync(resolutionPath)) throw new Error('Benislavskaya publication resolution ledger is missing');
const resolution = readFileSync(resolutionPath, 'utf8');
for (const marker of [
  'PUBLICATION ADMISSIBLE WITH EXPLICIT SOURCE-LAYER UNCERTAINTY',
  'claim-level evidentiary sufficiency',
  'Research crosswalk: OPEN FOR ENRICHMENT',
  'Reader claim gate: CLOSED AT THE QUALIFIED BOUNDARY ABOVE',
  'Paid acquisition gate: CLOSED / NOT REQUIRED',
  'no holder-supplied Yushin photograph in public Git or reader output',
]) {
  if (!resolution.includes(marker)) throw new Error(`Benislavskaya publication resolution boundary disappeared: ${marker}`);
}

// Browser payload parity is enforced by validate-essay-browser-data, which runs earlier in
// check:content and compares every generated catalog/route JSON payload against the canonical
// published essay objects. Do not look for article ids/slugs inside the generic runtime adapter.

console.log(
  `Benislavskaya publication DoD: catalogued=${essay.slug}; sources=${sources.length}; body-images=0; hero=${coverSha256}; 13↔16↔14 uncertainty preserved; paid acquisition not required.`,
);
