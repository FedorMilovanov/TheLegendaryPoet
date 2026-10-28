import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { browserInstallTimeoutFailures, jobBlocks } from '../browser-install-timeouts.mjs';

const root = path.resolve(import.meta.dirname, '../..');

function temporaryRepository({ jobTimeout, budgetPatch = {} }) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'browser-install-budget-'));
  const budget = JSON.parse(fs.readFileSync(path.join(root, 'docs/browser-install-budget.json'), 'utf8'));
  fs.mkdirSync(path.join(directory, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(directory, 'docs/browser-install-budget.json'), JSON.stringify({ ...budget, ...budgetPatch }, null, 2));
  fs.mkdirSync(path.join(directory, '.github/workflows'), { recursive: true });
  fs.writeFileSync(path.join(directory, '.github/workflows/synthetic.yml'), `name: Synthetic\non: workflow_dispatch\njobs:\n  installs-browsers:\n    runs-on: ubuntu-latest\n${jobTimeout === null ? '' : `    timeout-minutes: ${jobTimeout}\n`}    steps:\n      - uses: ./.github/actions/install-playwright\n      - run: npx playwright test\n  no-browsers:\n    runs-on: ubuntu-latest\n    timeout-minutes: 5\n    steps:\n      - run: npm run check\n`);
  return directory;
}

test('the repository keeps every browser-installing job above the documented floor', () => {
  assert.deepEqual(browserInstallTimeoutFailures(root), []);
});

test('a job below the floor is rejected', () => {
  // Real red: analytics-route-qa was cancelled at 30m while browsers installed.
  const directory = temporaryRepository({ jobTimeout: 20 });
  const failures = browserInstallTimeoutFailures(directory);
  assert.equal(failures.length, 1, failures.join('; '));
  assert.match(failures[0], /job installs-browsers timeout 20m is below the browser install floor 60m/);
});

test('a job with no explicit timeout is rejected instead of inheriting a default', () => {
  const directory = temporaryRepository({ jobTimeout: null });
  const failures = browserInstallTimeoutFailures(directory);
  assert.deepEqual(failures, ['.github/workflows/synthetic.yml job installs-browsers installs browsers without an explicit timeout-minutes']);
});

test('jobs that never install browsers are not forced onto the floor', () => {
  const blocks = jobBlocks(fs.readFileSync(path.join(root, '.github/workflows/manual-browser-qa.yml'), 'utf8'));
  const covered = blocks.filter((block) => block.usesInstallAction).map((block) => block.name);
  assert.deepEqual(covered, ['browser-qa', 'analytics-route-qa', 'webkit-home-reveal-qa', 'premium-home-qa', 'premium-iphone-critical-qa']);
  for (const block of blocks.filter((entry) => entry.usesInstallAction)) {
    assert.ok(block.timeoutMinutes >= 60, `${block.name} must respect the floor`);
  }
});

test('a floor with no headroom above the observed install maximum is rejected', () => {
  const directory = temporaryRepository({ jobTimeout: 60, budgetPatch: { minimumJobTimeoutMinutes: 45 } });
  const failures = browserInstallTimeoutFailures(directory);
  assert.deepEqual(failures, ['minimum job timeout 45m leaves no headroom above the observed install maximum 44m']);
});
