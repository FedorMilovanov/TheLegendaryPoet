import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { measureStyle } from '../check-suno-style.mjs';
import { documents, validateKit } from '../validate-suno-kit.mjs';

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
    for (const file of [...documents, 'package.json', 'AGENTS.md', 'docs/MUSIC_RELEASE_WORKFLOW.md']) {
      const target = path.join(directory, file);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(file, target);
    }
    run(directory);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
}

test('missing document is a failure', () => fixture(directory => {
  fs.unlinkSync(path.join(directory, 'suno/CASES.md'));
  assert.throws(() => validateKit(directory), /missing suno\/CASES/);
}));
test('broken local link is a failure', () => fixture(directory => {
  fs.appendFileSync(path.join(directory, 'suno/README.md'), '\n[broken](./absent.md)');
  assert.throws(() => validateKit(directory), /broken local link/);
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
