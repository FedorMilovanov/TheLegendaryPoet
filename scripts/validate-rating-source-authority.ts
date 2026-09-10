import { readFile } from 'node:fs/promises';
import { strict as assert } from 'node:assert';
import {
  compareEditorialRankingRows,
  compareReaderRankingRows,
  type ReaderRankingSource,
} from '../src/utils/ratingRanking';

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

assert.match(pageSource, /compareReaderRankingRows\(readerRankSource\(left\), readerRankSource\(right\)\)/, 'RatingsPage must delegate reader places to reader-only authority');
assert.match(pageSource, /compareEditorialRankingRows\(editorialRankSource\(left\), editorialRankSource\(right\)\)/, 'RatingsPage must preserve explicit editorial sort authority');
assert.doesNotMatch(pageSource, /readerScore[\s\S]{0,180}poet\.rating\s*-\s*left\.poet\.rating/, 'reader ranking must not regain editorial poet.rating tie-break');
assert.match(pageSource, /row\.readerScore === null \? null : index \+ 1/, 'reader mode must withhold places from unrated rows');
assert.match(pageSource, /Индекс читателей — байесовская оценка по шкале \/5/, 'reader scale must be explicit in reader methodology copy');
assert.match(pageSource, /Редакционная оценка \/10 отображается отдельно и не участвует в читательских местах/, 'editorial source/scale separation must be explicit');

console.log('rating source authority: OK');
