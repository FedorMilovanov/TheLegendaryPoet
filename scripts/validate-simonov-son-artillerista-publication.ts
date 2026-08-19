import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { essays } from '../src/data/essays/index';
import { simonovSonArtilleristaPublished } from '../src/data/essays/simonovSonArtilleristaPublished';

const id = 'simonov-son-artillerista-real-story';
const slug = 'simonov-syn-artillerista-realnaya-istoriya';
const heroPath = 'public/images/essays/simonov/simonov-son-artillerista-hero.webp';
const heroSha256 = '5aa9024cab522b4a6b4686231ba09b91dcc66969b85ba8f5f6dcecce67e16dd5';
const heroBytes = 130386;
const closeoutPath = 'docs/research/SIMONOV_PUBLICATION_CLOSEOUT_2026-08.md';

const published = essays.filter((essay) => essay.id === id || essay.slug === slug);
if (published.length !== 1) {
  throw new Error(`Simonov publication must appear exactly once in canonical catalog; found ${published.length}`);
}
if (published[0] !== simonovSonArtilleristaPublished) {
  throw new Error('Simonov canonical catalog entry is not the publication-safe wrapper object');
}

const essay = published[0];
if (essay.id !== id || essay.slug !== slug) throw new Error('Simonov publication identity drift');
if (essay.cover !== heroPath.replace(/^public/, '') && essay.cover !== '/images/essays/simonov/simonov-son-artillerista-hero.webp') {
  throw new Error(`Simonov cover path drift: ${essay.cover}`);
}
if (essay.cardCover !== '/images/essays/simonov/simonov-son-artillerista-hero.webp') {
  throw new Error(`Simonov card cover path drift: ${essay.cardCover}`);
}
if (essay.coverKind !== 'reconstruction') throw new Error(`Simonov cover must remain reconstruction, got ${essay.coverKind}`);
if (!essay.coverCredit?.includes('редакционная реконструкция')) throw new Error('Simonov cover lost reconstruction disclosure');
if (!essay.coverCredit?.includes('не документальная фотография Ивана Лоскутова')) {
  throw new Error('Simonov cover lost explicit non-documentary Loskutov disclosure');
}
if (essay.coverSourceUrl) throw new Error('Simonov editorial reconstruction must not carry an archival coverSourceUrl');

if (!existsSync(heroPath)) throw new Error(`Simonov production hero missing: ${heroPath}`);
const bytes = readFileSync(heroPath);
if (bytes.length !== heroBytes) throw new Error(`Simonov production hero byte-size drift: ${bytes.length}`);
const actualHeroSha = createHash('sha256').update(bytes).digest('hex');
if (actualHeroSha !== heroSha256) throw new Error(`Simonov production hero SHA-256 drift: ${actualHeroSha}`);

if (essay.blocks.some((block) => block.type === 'image')) {
  throw new Error('Simonov public article must not contain documentary/body image blocks before item-level rights closure');
}
if (essay.blocks.some((block) => block.type === 'poem')) {
  throw new Error('Simonov public article must not embed a full poem block');
}

const readerText = essay.blocks
  .map((block) => {
    if ('text' in block && typeof block.text === 'string') return block.text;
    if (block.type === 'section') return block.heading;
    if (block.type === 'voice') return `${block.quote} ${block.author} ${block.role}`;
    if (block.type === 'note' && block.variant === 'myth') return `${block.claim} ${block.text}`;
    return '';
  })
  .join('\n');

for (const forbidden of [
  'Hero-кандидат',
  'До production merge',
  'рекламной формулой',
  'С ним шли два разведчика и радиостанция',
  '6 суток',
  '500–600 метров',
  '500-600 метров',
  'около 2 км',
  'Иван Михайлович Лоскутов',
  'Алексей Михайлович Лоскутов',
]) {
  if (readerText.includes(forbidden)) throw new Error(`Simonov reader leaked blocked/staging wording: ${forbidden}`);
}

for (const required of [
  'Он шёл с двумя разведчиками и радиостанцией',
  'публицистической формулой',
  'На командном пункте решили, что произошла ошибка, и запросили подтверждение.',
  'Точного дня в письме нет.',
  'с которым связывают дату 31 июля, но сам архивный лист редакцией ещё не просмотрен',
  'не повышается до безусловно установленного факта',
  'не превращает эту дату в безоговорочно доказанную «самую первую» публикацию',
  'exact выпуск № 288 и его p.3 уже визуально проверены',
  'отсутствие продолжения на p.4',
  'Обложка этой публикации — редакционная художественная реконструкция.',
  'Она не является документальной фотографией Ивана Лоскутова, конкретной высоты или боя 1941 года.',
]) {
  if (!readerText.includes(required)) throw new Error(`Simonov publication lost required reader-safety wording: ${required}`);
}

const publicSourceIds = new Set((essay.sources ?? []).map((source) => source.id).filter(Boolean));
for (const removedVisualSource of ['mustatunturi-commons', 'simonov-1943-commons']) {
  if (publicSourceIds.has(removedVisualSource)) {
    throw new Error(`Unused rights-sensitive visual source leaked into public bibliography: ${removedVisualSource}`);
  }
}

if (!existsSync(closeoutPath)) throw new Error(`Simonov publication closeout missing: ${closeoutPath}`);
const closeout = readFileSync(closeoutPath, 'utf8');
for (const marker of [
  'PUBLICATION CANDIDATE REGISTERED / APPROVED HERO PRESENT / CLAIM-AWARE READER SAFETY PRESERVED / EXACT-HEAD CI + BROWSER QA PENDING',
  heroSha256,
  '1600×900',
  '130 386 bytes',
  'Merge в `main` этим документом не разрешается автоматически.',
]) {
  if (!closeout.includes(marker)) throw new Error(`Simonov closeout contract marker missing: ${marker}`);
}

console.log('Simonov publication gate: canonical catalog registration, exact approved hero bytes, reconstruction disclosure, reader-safe claim boundaries, no full poem/body documentary images, and publication closeout all validated.');
