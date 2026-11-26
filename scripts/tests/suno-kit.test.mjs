import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { preflight, comparePayload, verifySourceMap } from '../check-suno-payload.mjs';
import { measureStyle } from '../check-suno-style.mjs';
import { documents, referenceAssets, readFences, validateKit } from '../validate-suno-kit.mjs';

for (const [label, text, valid, warning] of [
  ['empty', '', false, false],
  ['whitespace', ' \n\t', false, false],
  ['900 units', 'a'.repeat(900), true, false],
  ['901 units', 'a'.repeat(901), true, true],
  ['1000 units', 'a'.repeat(1000), true, true],
  ['1001 units', 'a'.repeat(1001), false, false],
  ['500 astral characters', '🎵'.repeat(500), true, true],
  ['501 astral characters', '🎵'.repeat(501), false, false],
]) {
  test(`Style budget: ${label}`, () => {
    const actual = measureStyle(text);
    assert.equal(actual.valid, valid);
    assert.equal(actual.warning, warning);
    const cli = spawnSync(process.execPath, ['scripts/check-suno-style.mjs'], {
      input: text, encoding: 'utf8', timeout: 5000,
    });
    assert.equal(cli.status, valid ? 0 : 1, cli.stderr);
    assert.equal(cli.stderr.includes('Style warning:'), warning);
    assert.match(cli.stdout, new RegExp(`Style: ${text.length}/1000`));
  });
}

test('CLI positional input agrees with stdin', () => {
  const cli = spawnSync(process.execPath, ['scripts/check-suno-style.mjs', 'free-time', 'phrasing'], {
    encoding: 'utf8', timeout: 5000,
  });
  assert.equal(cli.status, 0);
  assert.match(cli.stdout, /Style: 18\/1000/);
});

test('current kit passes its structural contract', () => validateKit());

function fixture(run) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'suno-kit-'));
  try {
    for (const file of [...documents, ...referenceAssets, 'package.json', 'AGENTS.md', 'docs/MUSIC_RELEASE_WORKFLOW.md', 'docs/BRAND_EMBLEM.md']) {
      const target = path.join(directory, file);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(file, target);
    }
    // A fixture must be valid before a test deliberately breaks one specific thing.
    validateKit(directory);
    run(directory);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
}

test('missing document is a failure', () => fixture(directory => {
  fs.unlinkSync(path.join(directory, 'suno/CASES.md'));
  assert.throws(() => validateKit(directory), /missing suno\/CASES/);
}));
for (const file of ['WORKBENCH.md', 'EXPERIENCE.md', 'NEW_YEAR_SERIES.md']) {
  test(`missing seasonal/workbench document fails: ${file}`, () => fixture(directory => {
    const relative = `suno/${file}`;
    fs.unlinkSync(path.join(directory, relative));
    assert.throws(() => validateKit(directory), error =>
      error.message.split('\n').includes(`missing ${relative}`));
  }));
}

for (const relative of ['suno/NEW_UNREGISTERED.md', 'suno/clips/projects/NEW_UNREGISTERED.md']) {
  test(`unregistered document fails: ${relative}`, () => fixture(directory => {
    fs.writeFileSync(path.join(directory, relative), '# New document\n');
    assert.throws(() => validateKit(directory), error =>
      error.message.split('\n').includes(`unregistered Suno document: ${relative}`));
  }));
}

for (const relative of ['suno/PRONUNCIATION_AND_REPAIR.md', 'suno/WORKBENCH.md', 'suno/NEW_YEAR_SERIES.md']) {
  test(`missing new agent routing fails: ${relative}`, () => fixture(directory => {
    const file = path.join(directory, 'AGENTS.md');
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replaceAll(relative, ''));
    assert.throws(() => validateKit(directory), error =>
      error.message.split('\n').includes(`missing agent routing: ${relative}`));
  }));
}

test('missing clip document is a failure', () => fixture(directory => {
  fs.unlinkSync(path.join(directory, 'suno/clips/AGENT.md'));
  assert.throws(() => validateKit(directory), /missing suno\/clips\/AGENT\.md/);
}));
test('missing clip reference is a failure', () => fixture(directory => {
  fs.unlinkSync(path.join(directory, 'suno/clips/references/yesenin-epic/identity-master.jpg'));
  assert.throws(() => validateKit(directory),
    /missing reference: suno\/clips\/references\/yesenin-epic\/identity-master\.jpg/);
}));
test('broken local link is a failure', () => fixture(directory => {
  fs.appendFileSync(path.join(directory, 'suno/README.md'), '\n[broken](./absent.md)');
  assert.throws(() => validateKit(directory),
    /broken local link: suno\/README\.md -> \.\/absent\.md/);
}));
test('missing clip agent routing is a failure', () => fixture(directory => {
  const file = path.join(directory, 'AGENTS.md');
  const text = fs.readFileSync(file, 'utf8').replace('suno/clips/AGENT.md', '');
  fs.writeFileSync(file, text);
  assert.throws(() => validateKit(directory), /missing agent routing: suno\/clips\/AGENT\.md/);
}));
test('unclosed fence is a failure', () => fixture(directory => {
  fs.appendFileSync(path.join(directory, 'suno/CASES.md'), '\n```text\nunfinished');
  assert.throws(() => validateKit(directory), /unclosed fence/);
}));
test('over-budget example is a failure', () => fixture(directory => {
  fs.appendFileSync(path.join(directory, 'suno/CASES.md'), '\n```style\n' + 'a'.repeat(1001) + '\n```');
  assert.throws(() => validateKit(directory), /invalid example Style/);
}));
test('removing the check hook is a failure', () => fixture(directory => {
  const file = path.join(directory, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
  pkg.scripts.check = pkg.scripts.check.replace('npm run validate:suno && ', '');
  fs.writeFileSync(file, JSON.stringify(pkg));
  assert.throws(() => validateKit(directory), /Suno gate missing/);
}));

for (const [label, example, expected] of [
  ['info string is not a closer', '\n```text\n```style', /unclosed fence/],
  ['tilde is not a backtick closer', '\n~~~text\n```', /unclosed fence/],
  ['shorter backticks cannot close', '\n````text\n```', /unclosed fence/],
  ['tilde Style budget', '\n~~~style\n' + 'a'.repeat(1001) + '\n~~~', /invalid example Style/],
  ['CRLF Style budget', '\n```style\r\n' + 'a'.repeat(1001) + '\r\n```', /invalid example Style/],
  ['indented Style budget', '\n  ```style\n' + 'a'.repeat(1001) + '\n  ```', /invalid example Style/],
]) {
  test(`fence regression: ${label}`, () => fixture(directory => {
    fs.appendFileSync(path.join(directory, 'suno/CASES.md'), example);
    assert.throws(() => validateKit(directory), expected);
  }));
}

test('longer matching fence closes; nested-looking fence stays content', () => {
  assert.deepEqual(readFences('~~~text\n```style\n~~~'), {
    blocks: [{ language: 'text', text: '```style' }], unclosed: false,
  });
  assert.deepEqual(readFences('  ```style\r\nsolo piano\r\n  ````'), {
    blocks: [{ language: 'style', text: 'solo piano' }], unclosed: false,
  });
});
test('literal Lyrics CLI wiring cannot disappear silently', () => fixture(directory => {
  const file = path.join(directory, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
  delete pkg.scripts['check:suno-lyrics'];
  fs.writeFileSync(file, JSON.stringify(pkg));
  assert.throws(() => validateKit(directory), /missing literal Lyrics CLI wiring/);
}));

for (const relative of ['suno/covers/AGENT.md', 'suno/covers/RESEARCH.md', 'suno/covers/projects/fet-new-year.md']) {
  test('missing cover document fails: ' + relative, () => fixture(directory => {
    fs.unlinkSync(path.join(directory, relative));
    assert.throws(() => validateKit(directory), error =>
      error.message.split('\n').includes('missing ' + relative));
  }));
}
test('unregistered cover project fails', () => fixture(directory => {
  const relative = 'suno/covers/projects/NEW_UNREGISTERED.md';
  fs.writeFileSync(path.join(directory, relative), '# New cover project\n');
  assert.throws(() => validateKit(directory), /unregistered Suno document: suno\/covers\/projects\/NEW_UNREGISTERED\.md/);
}));
test('missing cover agent routing fails', () => fixture(directory => {
  const file = path.join(directory, 'AGENTS.md');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replaceAll('suno/covers/AGENT.md', ''));
  assert.throws(() => validateKit(directory), /missing agent routing: suno\/covers\/AGENT\.md/);
}));
test('missing cover identity reference fails', () => fixture(directory => {
  fs.unlinkSync(path.join(directory, 'public/images/fet-480.jpg'));
  assert.throws(() => validateKit(directory), /missing reference: public\/images\/fet-480\.jpg/);
}));
test('Fet draft contains ten separate full-image prompts, not a combined prompt', () => {
  const file = fs.readFileSync('suno/covers/projects/fet-new-year.md', 'utf8');
  const conceptPackage = file.split('## 01 —')[1]?.split('## Приёмка и урок W3')[0];
  assert.ok(conceptPackage, 'original concept package boundary missing');
  const blocks = readFences(conceptPackage).blocks.filter(block => block.language === 'text');
  assert.equal(blocks.length, 10);
  assert.equal(new Set(blocks.map(block => block.text)).size, 10);
  for (const block of blocks) {
    assert.match(block.text, /^Create ONE standalone/);
    assert.match(block.text, /16:9/);
    assert.match(block.text, /collage/i);
  }
  // Structural only, not a certificate of artistic quality or actual generations.
});

test('poetry preflight measures UTF-16 and permits empty Exclude', () => {
  const payload = { lyrics: 'а'.repeat(5000), style: 'piano', exclude: '' };
  assert.equal(preflight(payload).valid, true);
  assert.equal(preflight({ ...payload, lyrics: 'а'.repeat(4999) + '🎵' }).valid, false);
  assert.equal(preflight({ ...payload, style: ' '.repeat(5) }).valid, false);
  assert.equal(preflight({ lyrics: 'слово', style: 'piano' }).valid, false);
});
test('readback catches truncation, same-length substitution and missing fields', () => {
  const payload = { lyrics: 'Все звёзды', style: 'a'.repeat(900), exclude: '' };
  assert.equal(comparePayload(payload, payload, payload).valid, true);
  assert.equal(comparePayload(payload, payload, { ...payload, style: 'a'.repeat(800) }).valid, false);
  assert.equal(comparePayload(payload, { ...payload, lyrics: 'Всё звёзды' }, payload).valid, false);
  assert.equal(comparePayload(payload, payload, { lyrics: payload.lyrics, style: payload.style }).valid, false);
  assert.equal(comparePayload(payload, null, payload).valid, false);
});
test('source map accepts explicit sequence, repetition and accent edit only as recorded', () => {
  const ledger = { sources: { a: { text: 'Все звезды', locator: 'edition A, line 1' }, b: { text: 'Свет', locator: 'edition A, line 2' } },
    sequence: [{ tag: '[Verse]' }, { sourceId: 'b' }, { sourceId: 'a', edits: [{ at: 6, before: 'е', after: 'ё', reason: 'approved yo' }] }, { sourceId: 'b' }, { blank: true }] };
  const lyrics = '[Verse]\nСвет\nВсе звёзды\nСвет\n';
  assert.equal(verifySourceMap(ledger, lyrics).valid, true);
  assert.equal(verifySourceMap(ledger, lyrics.replace('Все', 'Всё')).valid, false);
  assert.equal(verifySourceMap(ledger, lyrics.trimEnd()).valid, false);
  assert.equal(verifySourceMap({ ...ledger, sequence: [{ sourceId: 'missing' }] }, 'Свет').valid, false);
  assert.equal(verifySourceMap({ ...ledger, sequence: [{ sourceId: 'a', edits: [{ at: 0, before: 'X', after: 'Y', reason: 'wrong' }] }] }, 'Все звезды').valid, false);
  assert.equal(verifySourceMap({ ...ledger, sequence: [{ tag: '[sing my words]' }] }, '[sing my words]').valid, false);
});

