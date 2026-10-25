import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { compareLiteralLyrics } from '../check-suno-lyrics.mjs';

const source = 'Все способности — дар.\nЯ помню день.';
for (const [label, lyrics] of [
  ['replacement', source.replace('дар', 'свет')],
  ['punctuation', source.replace('—', '-')],
  ['capitalization', source.toLowerCase()],
  ['contextual ё corruption', source.replace('Все', 'Всё')],
  ['acute addition', source.replace('дар', 'да́р')],
  ['Latin lookalike', source.replace('дар', 'дaр')],
  ['deleted line', source.split('\n')[0]],
  ['reordered lines', source.split('\n').reverse().join('\n')],
  ['unapproved repeat', source + '\nЯ помню день.'],
  ['added vocalise', source + '\nА-а-а'],
  ['extra final newline', source + '\n'],
  ['space trimming', source.replace('Все', ' Все')],
  ['long stage direction', '[Verse: sing softly]\n' + source],
]) {
  test(`literal Lyrics rejects ${label}, even with section tags`, () => {
    assert.equal(compareLiteralLyrics(source, lyrics, { sectionTags: true }).valid, false);
  });
}
test('literal identity and transport CRLF pass', () => {
  assert.equal(compareLiteralLyrics(source, source).valid, true);
  assert.equal(compareLiteralLyrics(source, source.replaceAll('\n', '\r\n')).valid, true);
});
test('section tags require explicit mode', () => {
  assert.equal(compareLiteralLyrics(source, '[Verse 1]\n' + source).valid, false);
  assert.deepEqual(compareLiteralLyrics(source, '[Verse 1]\n' + source + '\n[End]', { sectionTags: true }),
    { valid: true, sourceLines: 2, tags: 2 });
});
test('literal tag in source is consumed before treating added tags as metadata', () => {
  assert.equal(compareLiteralLyrics('[Verse]\nСтих', '[Verse]\nСтих', { sectionTags: true }).tags, 0);
  assert.equal(compareLiteralLyrics('[Verse]\nСтих', 'Стих', { sectionTags: true }).valid, false);
});
test('preserves author accents, й and ё; no broad normalization', () => {
  for (const text of ['Мой клён', 'за́мок', 'е\u0308', 'é']) {
    assert.equal(compareLiteralLyrics(text, text).valid, true);
    assert.equal(compareLiteralLyrics(text, text.normalize('NFD').replace(/\p{M}/gu, '')).valid, false);
  }
});
test('empty source and non-string inputs fail closed', () => {
  assert.equal(compareLiteralLyrics(' \n', ' \n').valid, false);
  assert.throws(() => compareLiteralLyrics(null, ''), TypeError);
});
test('CLI file, invalid UTF-8, usage and missing-file failures', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'suno-lyrics-'));
  const file = name => path.join(directory, name);
  const run = args => spawnSync(process.execPath, ['scripts/check-suno-lyrics.mjs', ...args],
    { encoding: 'utf8', timeout: 5000 });
  try {
    fs.writeFileSync(file('source'), source);
    fs.writeFileSync(file('lyrics'), '[Verse]\n' + source);
    assert.equal(run([file('source'), file('lyrics')]).status, 1);
    const valid = run([file('source'), file('lyrics'), '--section-tags']);
    assert.equal(valid.status, 0, valid.stderr);
    assert.equal(JSON.parse(valid.stdout).tags, 1);
    fs.writeFileSync(file('source'), '\ufeff' + source);
    fs.writeFileSync(file('lyrics'), source);
    assert.equal(run([file('source'), file('lyrics')]).status, 1);
    assert.equal(run([]).status, 1);
    assert.equal(run([file('source'), file('lyrics'), '--typo']).status, 1);
    assert.equal(run([file('absent'), file('lyrics')]).status, 1);
    for (const name of ['source', 'lyrics']) fs.writeFileSync(file(name), Buffer.from([0xff]));
    assert.equal(run([file('source'), file('lyrics')]).status, 1);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
