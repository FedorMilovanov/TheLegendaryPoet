import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
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
    for (const file of [...documents, ...referenceAssets, 'package.json', 'AGENTS.md', 'docs/MUSIC_RELEASE_WORKFLOW.md']) {
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
