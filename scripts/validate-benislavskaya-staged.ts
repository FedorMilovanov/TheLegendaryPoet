import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { benislavskayaDraft as essay } from '../src/data/essays/benislavskayaDraft';
import { getAllEssays, getEssayBySlug } from '../src/data/essays/index';
import { publishEssay } from '../src/data/essays/publishEssay';
import { estimateReadTime } from '../src/utils/readTime';

const published = getAllEssays();
if (getEssayBySlug(essay.slug) || published.some((item) => item.id === essay.id || item.slug === essay.slug)) {
  throw new Error('Benislavskaya staged draft leaked into the canonical public essay catalog');
}

const catalogSource = readFileSync('src/data/essays/index.ts', 'utf8');
if (catalogSource.includes('benislavskayaDraft') || catalogSource.includes(essay.slug)) {
  throw new Error('Benislavskaya staged draft is imported or named by the canonical catalog');
}

const browserPayload = readFileSync('src/data/essays/browserEssayData.ts', 'utf8');
if (browserPayload.includes(essay.slug) || browserPayload.includes(essay.id)) {
  throw new Error('Benislavskaya staged draft leaked into generated browser publication data');
}

if (!essay.kicker?.includes('staged draft')) {
  throw new Error('Benislavskaya draft lost its explicit staged-draft marker');
}

const metadataText = [essay.kicker, essay.title, essay.subtitle, essay.excerpt].filter(Boolean).join('\n');
for (const forbidden of [/редактор без должности/iu, /литературн(?:ый|ого) агент/iu]) {
  if (forbidden.test(metadataText)) {
    throw new Error(`Benislavskaya metadata revived an unsupported occupational label: ${forbidden}`);
  }
}

const expectedCover = '/images/essays/benislavskaya/benislavskaya-editorial-hero.webp';
const expectedCoverSha256 = '0b1f1146f77ce154479042fc9a1afbe00133528eee14f220b4fa74990bd57e48';
const expectedCoverBytes = 132172;
if (essay.cover !== expectedCover || essay.cardCover !== expectedCover) {
  throw new Error(`Benislavskaya staged hero target drifted: ${essay.cover} / ${essay.cardCover}`);
}
if (essay.coverKind !== 'reconstruction') {
  throw new Error('Benislavskaya staged hero must remain classified as reconstruction');
}
if (essay.coverSourceUrl) {
  throw new Error('Benislavskaya editorial reconstruction must not claim an archival source URL');
}
if (!essay.coverCredit?.includes('редакционная кинематографическая реконструкция')) {
  throw new Error('Benislavskaya staged hero lost its reconstruction disclosure');
}

const coverPath = `public${expectedCover}`;
if (!existsSync(coverPath)) {
  throw new Error('Benislavskaya approved production hero is missing after owner-approved binary ingestion');
}
const coverBytes = readFileSync(coverPath);
if (coverBytes.byteLength !== expectedCoverBytes) {
  throw new Error(`Benislavskaya hero byte length drifted: ${coverBytes.byteLength} !== ${expectedCoverBytes}`);
}
const coverSha256 = createHash('sha256').update(coverBytes).digest('hex');
if (coverSha256 !== expectedCoverSha256) {
  throw new Error(`Benislavskaya hero does not match approved bytes: ${coverSha256}`);
}

const expectedHeadings = [
  'Знакомство: когда память расходится с календарём',
  'После заграницы: Брюсовский переулок как рабочее пространство',
  'Весна 1924-го: письма как журнал невидимой работы',
  '12 июня 1924 года: роль получает юридическую форму',
  'Осень 1924-го: рукописи едут быстрее автора',
  'Декабрь: деньги, книги и просьба датировать стихи',
  '1925 год: литературная работа ещё продолжается',
  '35, 16, 14, 13: почему числа переписки не складываются автоматически',
  'Дневник: источник, который нельзя превращать в автограф',
  'Разрыв и декабрь 1926-го: не делать трагедию жанром',
  'Что именно она делала — без завышенного титула',
  'Почему эта история важна для самого Есенина',
] as const;
const headings = essay.blocks.filter((block) => block.type === 'section').map((block) => block.heading);
if (headings.length !== expectedHeadings.length || expectedHeadings.some((heading, i) => headings[i] !== heading)) {
  throw new Error(`Benislavskaya staged section order changed: ${headings.join(' | ')}`);
}

const sources = essay.sources ?? [];
if (sources.length !== 13) throw new Error(`Benislavskaya staged source scope changed: ${sources.length}`);
const sourcesById = new Map<string, (typeof sources)[number]>();
for (const source of sources) {
  if (!source.id) throw new Error(`Benislavskaya staged source has no stable id: ${source.title}`);
  if (sourcesById.has(source.id)) throw new Error(`duplicate Benislavskaya staged source id: ${source.id}`);
  sourcesById.set(source.id, source);
}

const citedIds = new Set<string>();
for (const block of essay.blocks) {
  if (!('sourceIds' in block)) continue;
  for (const id of block.sourceIds ?? []) {
    if (!sourcesById.has(id)) throw new Error(`Benislavskaya staged block cites missing source: ${id}`);
    citedIds.add(id);
  }
}
for (const id of sourcesById.keys()) {
  if (!citedIds.has(id)) throw new Error(`Benislavskaya staged bibliography contains uncited source: ${id}`);
}

const expectedStrongSources = [
  'ben-pss-index',
  'ben-pss-letters',
  'ben-pss-business-documents',
  'ben-rgali-business-unit',
  'ben-letopis-t5-k1',
] as const;
for (const id of expectedStrongSources) {
  const source = sourcesById.get(id);
  if (!source) throw new Error(`missing strong Benislavskaya staged source: ${id}`);
  if (!source.url?.startsWith('https://')) throw new Error(`strong Benislavskaya source lost HTTPS provenance: ${id}`);
}

const controllingBook = sourcesById.get('ben-1995-book');
for (const marker of ['234–281 provisional', '4 марта', '18 января', '8 февраля', 'не приобретены']) {
  if (!controllingBook?.note?.includes(marker)) {
    throw new Error(`Benislavskaya controlling-book source note lost current holder/acquisition boundary: ${marker}`);
  }
}
const chronology1925 = sourcesById.get('ben-letopis-t5-k1');
for (const pageMarker of ['268–269', '271–272', '280–281', '339–340']) {
  if (!chronology1925?.note?.includes(pageMarker)) {
    throw new Error(`Benislavskaya 1925 page-map lost IMLI marker: ${pageMarker}`);
  }
}
if (!chronology1925?.note?.includes('воспроизводит полностью')) {
  throw new Error('Benislavskaya 16 July source note no longer states that IMLI reproduces the full letter');
}
const diary = sourcesById.get('ben-diary-copy');
if (!diary?.note?.includes('машинописная копия') || !diary.note.includes('Автограф дневника не заявляется')) {
  throw new Error('Benislavskaya diary/copy boundary drifted');
}

const reconciliationPath = 'docs/research/BENISLAVSKAYA_INBOUND_RECONCILIATION_MATRIX_2026-08.md';
if (!existsSync(reconciliationPath)) throw new Error('Benislavskaya inbound reconciliation matrix is missing');
const reconciliation = readFileSync(reconciliationPath, 'utf8');
for (const marker of [
  'Direct Yushin p. 411 holder evidence — CLOSED AS A 1969 RECORD WITNESS',
  'IMG_20260906_170814.jpg',
  '9c880be1979039c4f0dd95b9e42b4f313d00321e1bfcc636dcd36323294a84a8',
  '#121, #122, #128, #131 and #134 are no longer `unread Yushin records`',
  '4 Mar 1924 → pp. **234–235**',
  '6 Apr 1924 → p. **236**',
  'HISTORICALLY ATTESTED ARCHIVAL-LETTER RECORD',
  'pp. **339–340**',
  'text/page witness = **VERIFIED**',
  'do not claim sent/delivered/received/read without a transmission witness',
  'No paid scan, paid thematic search, paid reproduction, paid document delivery or paid source-acquisition route is authorized',
  'No payment and no merge are authorized by this ledger',
]) {
  if (!reconciliation.includes(marker)) {
    throw new Error(`Benislavskaya reconciliation boundary disappeared: ${marker}`);
  }
}
if (reconciliation.includes('remaining research blocker is the lawful 1995 witness pp. **236–281**')) {
  throw new Error('Benislavskaya reconciliation revived the obsolete 236–281-only acquisition boundary');
}

const gateLedgerPath = 'docs/research/BENISLAVSKAYA_PUBLICATION_GATE_2026-08.md';
if (!existsSync(gateLedgerPath)) throw new Error('Benislavskaya publication gate ledger is missing');
const gateLedger = readFileSync(gateLedgerPath, 'utf8');
for (const marker of [
  'STAGED-DRAFT / SOURCE-GATED / HERO-CLOSED',
  '16 July text/page witness: VERIFIED via IMLI 2013, pp. 339–340',
  'Direct holder inspection — 2026-08-20',
  'Working range: **234–281 provisional**',
  '**NO PAYMENT AUTHORIZED.**',
  '0 documentary body images',
  'not an outstanding acquisition prerequisite',
]) {
  if (!gateLedger.includes(marker)) {
    throw new Error(`Benislavskaya current publication gate disappeared: ${marker}`);
  }
}
if (/acquire\/verify (?:a|the) controlling witness for the 16 July/iu.test(gateLedger)) {
  throw new Error('Benislavskaya gate incorrectly re-opened acquisition of the already verified 16 July IMLI witness');
}
if (gateLedger.includes('pending binary ingestion')) {
  throw new Error('Benislavskaya ledger incorrectly reports the already-ingested hero as pending');
}

const bodyImages = essay.blocks.filter((block) => block.type === 'image');
if (bodyImages.length !== 0) {
  throw new Error('Benislavskaya staged v1 gained documentary body visuals without a separate item-level rights package');
}

const readerText = essay.blocks.map((block) => {
  if ('text' in block) return block.text;
  if (block.type === 'section') return block.heading;
  if (block.type === 'note' && block.variant === 'myth') return `${block.claim} ${block.text}`;
  return '';
}).join('\n');

const words = readerText.match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
if (words < 2000 || words > 5000) throw new Error(`Benislavskaya staged longform scope drifted: ${words} words`);
const expectedReadTime = estimateReadTime(essay.blocks);
const publicationCandidate = publishEssay(essay);
if (publicationCandidate === essay) throw new Error('publishEssay reused mutable Benislavskaya authoring identity');
if (publicationCandidate.readTime !== expectedReadTime) {
  throw new Error(
    `Benislavskaya publication-derived readTime drift: ${publicationCandidate.readTime} !== ${expectedReadTime}`,
  );
}

for (const boundary of [
  '35 писем, записок и телеграмм',
  'одну дарственную надпись',
  '14 писем Бениславской Есенину',
  '13 пронумерованных единиц',
  '16 позиций',
  'Публикационный gate остаётся честно открытым',
  '20 августа 2026 года',
  '4 марта находится на с. 234',
  '6 апреля — на с. 236',
  '234–281 provisional',
  '339–340',
  'машинописная копия',
  'не доказывает самостоятельной редакционной власти',
  'не учреждает современную должность «агента»',
]) {
  if (!readerText.includes(boundary)) throw new Error(`Benislavskaya staged evidence boundary disappeared: ${boundary}`);
}

if (!readerText.includes('16 июля 1925 года') || !readerText.includes('не публикует')) {
  throw new Error('Benislavskaya staged draft lost the qualified 16 July letter boundary');
}
if (!readerText.includes('указанного ранее письма в ЦГАЛИ/РГАЛИ нет') || !readerText.includes('оно осталось у Бениславской')) {
  throw new Error('Benislavskaya reader text lost the corrected 16 July provenance boundary');
}
if (!readerText.includes('Письмо 16 июля уже имеет отдельный полный академический page-witness')) {
  throw new Error('Benislavskaya reader text no longer closes the 16 July acquisition branch with IMLI evidence');
}
if (/для финальной reader-версии нужны законные страницы 236–281/iu.test(readerText)) {
  throw new Error('Benislavskaya staged reader revived the obsolete 236–281-only acquisition request');
}
if (/Для последнего известного письма от 16 июля нужен отдельный controlling witness/iu.test(readerText)) {
  throw new Error('Benislavskaya reader text revived the obsolete 1997/2008 acquisition requirement for 16 July');
}

console.log(
  `Benislavskaya staged DoD: unpublished; ${words} words; raw readTime=${essay.readTime}; publication readTime=${publicationCandidate.readTime}; ${sourcesById.size} cited source units; hero=verified:${coverSha256}; 13↔16↔14 gate preserved; reconciliation=Yushin-p411-direct/no-payment; holder map=4-Mar pp.234–235 onward; IMLI 16-Jul witness=339–340 verified.`,
);