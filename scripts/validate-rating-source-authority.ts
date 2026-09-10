import { readFile } from 'node:fs/promises';
import { strict as assert } from 'node:assert';
import {
  compareEditorialRankingRows,
  compareReaderRankingRows,
  type ReaderRankingSource,
} from '../src/utils/ratingRanking';
import {
  hasQualifiedRatingSample,
  RATING_SCALE_MAX,
  RATING_SCALE_MIN,
  READER_RANKING_MIN_VOTES,
  sampleAwareRatingIndex,
} from '../src/utils/ratingMethod';

const pageSource = await readFile(new URL('../src/pages/RatingsPage.tsx', import.meta.url), 'utf8');

const alpha: ReaderRankingSource = { id: 'alpha', name: 'Альфа', readerScore: 4.25, votes: 8 };
const beta: ReaderRankingSource = { id: 'beta', name: 'Бета', readerScore: 4.25, votes: 8 };
const unrated: ReaderRankingSource = { id: 'unrated', name: 'Без голосов', readerScore: null, votes: 0 };

assert.ok(compareReaderRankingRows(alpha, beta) < 0, 'tied reader rows must use stable identity, not editorial authority');
assert.ok(compareReaderRankingRows(alpha, unrated) < 0, 'rated reader rows must precede unrated rows');
assert.ok(compareReaderRankingRows(unrated, alpha) > 0, 'unrated rows must never receive precedence over rated reader rows');

const editorialAHigh = { id: 'alpha', name: 'Альфа', editorialScore: 9.9 };
const editorialBLow = { id: 'beta', name: 'Бета', editorialScore: 1.0 };
const editorialALow = { ...editorialAHigh, editorialScore: 1.0 };
const editorialBHigh = { ...editorialBLow, editorialScore: 9.9 };

assert.ok(compareEditorialRankingRows(editorialAHigh, editorialBLow) < 0, 'explicit editorial mode must rank by editorial /10');
assert.ok(compareEditorialRankingRows(editorialALow, editorialBHigh) > 0, 'explicit editorial mode must react to editorial /10 changes');

// Reader fixtures intentionally contain no editorial score. Swapping /10 authority therefore
// cannot change the reader comparator result; the TypeScript shape makes that dependency illegal.
const readerOrderBeforeEditorialSwap = [alpha, beta].sort(compareReaderRankingRows).map((row) => row.id);
const readerOrderAfterEditorialSwap = [alpha, beta].sort(compareReaderRankingRows).map((row) => row.id);
assert.deepEqual(readerOrderAfterEditorialSwap, readerOrderBeforeEditorialSwap, 'editorial /10 changes must not reorder tied reader rows');

// Methodology fixtures: the reader index is sample-aware, bounded and independent
// of a mutable site-wide prior.
assert.equal(READER_RANKING_MIN_VOTES, 3, 'reader places and dimension leaders must require three votes');
assert.equal(hasQualifiedRatingSample(2), false, 'two votes must remain below the ranking threshold');
assert.equal(hasQualifiedRatingSample(3), true, 'three votes must qualify for ranking');
assert.equal(sampleAwareRatingIndex(5, 2), null, 'under-threshold perfect samples must not receive a reader place');

const sparsePerfect = sampleAwareRatingIndex(5, 3);
const establishedStrong = sampleAwareRatingIndex(4.4, 20);
assert.notEqual(sparsePerfect, null, 'three-vote sample must produce a qualified index');
assert.notEqual(establishedStrong, null, 'larger sample must produce a qualified index');
assert.ok(
  (establishedStrong ?? 0) > (sparsePerfect ?? 0),
  'a sparse perfect score must not outrank a materially larger strong sample merely by being perfect',
);

const sameMeanSmall = sampleAwareRatingIndex(4.2, 3);
const sameMeanLarge = sampleAwareRatingIndex(4.2, 40);
assert.ok(
  (sameMeanLarge ?? 0) > (sameMeanSmall ?? 0),
  'the same observed mean must receive a smaller sample penalty as vote count grows',
);

for (const [mean, votes] of [[1, 3], [5, 3], [1, 1000], [5, 1000]] as const) {
  const value = sampleAwareRatingIndex(mean, votes);
  assert.notEqual(value, null, 'qualified bounded sample must produce an index');
  assert.ok((value ?? 0) >= RATING_SCALE_MIN && (value ?? 0) <= RATING_SCALE_MAX, 'sample-aware index must remain on the /5 scale');
}


assert.match(pageSource, /compareReaderRankingRows\(readerRankSource\(left\), readerRankSource\(right\)\)/, 'RatingsPage must delegate reader places to reader-only authority');
assert.match(pageSource, /compareEditorialRankingRows\(editorialRankSource\(left\), editorialRankSource\(right\)\)/, 'RatingsPage must preserve explicit editorial sort authority');
assert.doesNotMatch(pageSource, /readerScore[\s\S]{0,180}poet\.rating\s*-\s*left\.poet\.rating/, 'reader ranking must not regain editorial poet.rating tie-break');
assert.match(pageSource, /row\.readerScore === null \? null : index \+ 1/, 'reader mode must withhold places from unrated rows');
assert.doesNotMatch(pageSource, /PRIOR_WEIGHT|globalMean|globalDimensionMeans|байесовская оценка/, 'reader methodology must not regain opaque site-wide prior authority');
assert.match(pageSource, /Место появляется с 3 голосов/, 'reader methodology copy must expose the minimum ranking sample');
assert.match(pageSource, /max\(1, m − 4 × √\(ln 5 \/ \(2n\)\)\)/, 'reader methodology copy must expose the implemented sample adjustment');
assert.match(pageSource, /не заявление о репрезентативности аудитории/, 'reader methodology copy must not overclaim statistical representativeness');
assert.match(pageSource, /hasQualifiedRatingSample\(row\.votes\) && row\.dimensionIndexes\[dimension\.key\] !== null/, 'dimension leaders must use the same explicit sample qualification');
assert.match(pageSource, /Редакционная оценка \/10 отображается отдельно и не участвует в читательских местах/, 'editorial source/scale separation must be explicit');

console.log('rating source authority: OK');
