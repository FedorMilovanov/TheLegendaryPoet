/**
 * Deep behavioural smoke for pure utilities (no DOM).
 * Complements check-integrity.ts (static/data) with logic matrices.
 * Run: npx tsx scripts/check-deep.ts  (or npm run check:deep)
 */
import { poets } from '../src/data/library/index.ts';
import { essays } from '../src/data/essays/index.ts';
import { getAllArticles } from '../src/utils/articleLibrary.ts';
import { getCommandItems } from '../src/components/command/commandItems.ts';
import {
  validateScores,
  validateCommentInput,
  pluralRu,
  formatRelativeRu,
  clampScore,
} from '../src/utils/feedbackValidation.ts';
import {
  poetRatingDimensions,
  poemRatingDimensions,
  articleRatingDimensions,
  trackRatingDimensions,
} from '../src/data/ratingDimensions.ts';
import { getPositiveComment, getCriticalComment } from '../src/utils/commentHighlights.ts';
import {
  averageScores,
  distributionFromRatings,
  makeFeedbackId,
  ratingScope,
  hasRated,
  rememberRated,
  checkCooldown,
  setCooldown,
  canMarkHelpful,
  rememberHelpful,
} from '../src/utils/communityStore.ts';
import { titleCase } from '../src/utils/titleCase.ts';
import { asset } from '../src/utils/asset.ts';
import { getPoemOfDay } from '../src/utils/dailyContent.ts';

let fails = 0;
const fail = (m: string) => {
  console.error(`  ✕ ${m}`);
  fails += 1;
};
const ok = (m: string) => console.log(`  ✓ ${m}`);

console.log('\n— Deep behavioural checks —');

for (const p of poets) {
  if (!p.photo?.startsWith('/images/')) fail(`photo ${p.id}`);
  if (!p.poems.length) fail(`no poems ${p.id}`);
}
ok(`poet shapes (${poets.length})`);

const items = getCommandItems();
const paths = items.map((i) => i.path);
for (const need of ['/hall', '/archive', `/essays/${essays[0].slug}`, `/poets/${poets[0].id}`]) {
  if (!paths.some((p) => p === need)) fail(`command palette missing ${need}`);
}
ok(`command items (${items.length}) cover hall/archive/essay/poet`);

const dims = poetRatingDimensions;
if (validateScores({ language: 0, depth: 3, legacy: 4, truth: 5 }, dims).ok) fail('validateScores should reject 0');
if (!validateScores({ language: 5, depth: 4, legacy: 5, truth: 3 }, dims).ok) fail('validateScores should accept full set');
if (validateCommentInput('', 'hi', 'literary').ok) fail('short comment should fail');
if (validateCommentInput('', 'aaaaaaaaaaaaaaaaaaaa', 'literary').ok) fail('spam comment should fail');
const fine = validateCommentInput('  Анна  ', 'Сильная и честная строка, очень точно сказано.', 'literary');
if (!fine.ok || fine.author !== 'Анна') fail('good comment should pass + trim author');
if (clampScore(99) !== 5 || clampScore(0.2) !== 1) fail('clampScore range');
if (pluralRu(21, 'оценка', 'оценки', 'оценок') !== 'оценка') fail('pluralRu(21)');
if (pluralRu(22, 'оценка', 'оценки', 'оценок') !== 'оценки') fail('pluralRu(22)');
if (pluralRu(25, 'оценка', 'оценки', 'оценок') !== 'оценок') fail('pluralRu(25)');
ok('validation matrix');

const ratings = [
  { id: '1', targetType: 'poet' as const, targetId: 'x', scores: { a: 5, b: 5 }, createdAt: '' },
  { id: '2', targetType: 'poet' as const, targetId: 'x', scores: { a: 3, b: 1 }, createdAt: '' },
];
const avg = averageScores(ratings);
if (Math.abs(avg.dimensions.a - 4) > 0.01) fail(`avg a = ${avg.dimensions.a}`);
if (Math.abs(avg.overall - 3.5) > 0.01) fail(`overall = ${avg.overall}`);
const dist = distributionFromRatings(ratings);
if (dist[5] !== 1 || dist[2] !== 1) fail(`distribution ${JSON.stringify(dist)}`);
ok('averages + distribution');

const comments = [
  {
    id: '1',
    targetType: 'poet' as const,
    targetId: 'x',
    author: 'A',
    text: 'Очень точно и сильно сказано',
    kind: 'literary' as const,
    helpful: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    targetType: 'poet' as const,
    targetId: 'x',
    author: 'B',
    text: 'Слабо и спорно, не убеждает',
    kind: 'literary' as const,
    helpful: 5,
    createdAt: new Date().toISOString(),
  },
];
if (getPositiveComment(comments)?.id !== '1') fail('positive highlight');
if (getCriticalComment(comments)?.id !== '2') fail('critical highlight');
ok('comment highlights');

if (titleCase('и Анализы', { isHeadingStart: false }) !== 'и Анализы') fail('titleCase mid-fragment');
if (titleCase('Статьи и анализы') !== 'Статьи и Анализы') fail(`titleCase full: ${titleCase('Статьи и анализы')}`);
ok('titleCase');

if (!asset('/images/pushkin.jpg').includes('images/pushkin')) fail('asset()');
ok('asset()');

if (makeFeedbackId('r') === makeFeedbackId('r')) fail('id collision');
ok('unique ids');

const pod1 = getPoemOfDay();
const pod2 = getPoemOfDay();
if (pod1.poem.id !== pod2.poem.id) fail('poem-of-day unstable');
ok(`poem of day: ${pod1.poem.title}`);

for (const [name, set] of Object.entries({
  poet: poetRatingDimensions,
  poem: poemRatingDimensions,
  article: articleRatingDimensions,
  track: trackRatingDimensions,
})) {
  if (!set.length) fail(`empty dimensions: ${name}`);
}
ok('rating dimension sets');

if (!formatRelativeRu(new Date(Date.now() - 90_000).toISOString())) fail('relative time empty');
ok('relative time');

if (ratingScope('essay', 'yesenin-kutezhi') !== 'rating:essay:yesenin-kutezhi') fail('ratingScope');
ok('ratingScope');

const sc = `rating:poet:deep-${Date.now()}`;
if (hasRated(sc)) fail('pre-rated');
rememberRated(sc);
if (!hasRated(sc)) fail('session rated memory');
if (!checkCooldown(sc).allowed) fail('cooldown pre');
setCooldown(sc);
if (checkCooldown(sc).allowed) fail('cooldown post');
const hs = `helpful:deep-${Date.now()}`;
if (!canMarkHelpful(hs)) fail('helpful pre');
rememberHelpful(hs);
if (canMarkHelpful(hs)) fail('helpful post');
ok('session vote guards (memory)');

ok(`content: ${getAllArticles().length} articles, ${essays.length} essays`);

console.log('\n— Result —');
if (fails === 0) {
  console.log('PASS — deep checks clean.');
  process.exit(0);
}
console.error(`FAIL — ${fails} deep check(s).`);
process.exit(1);
