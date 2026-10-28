import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { laneTimeoutFailures } from '../merge-certification-timeouts.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const contract = JSON.parse(read('docs/merge-certification.json'));
const waiterWorkflow = read('.github/workflows/merge-certification.yml');

const lanes = Object.entries(contract.lanes).map(([id, lane]) => ({
  id,
  lane,
  canonical: read(lane.workflowFile),
}));

test('every conditional lane keeps canonical, poll and waiter timeouts ordered', () => {
  assert.equal(lanes.length, 3);
  for (const { id, lane, canonical } of lanes) {
    assert.deepEqual(laneTimeoutFailures(lane, canonical, waiterWorkflow), [], `${id} timeout margin drifted`);
  }
});

test('a waiter job timeout below its poll window is rejected', () => {
  // Historical red: the Hall web runtime waiter carried a 50m job timeout while
  // the canonical proof job could run 75m, so a slow-but-passing run failed.
  const { lane, canonical } = lanes.find((entry) => entry.id === 'hall-web-runtime-proof');
  const stale = { ...lane, waiterJobTimeoutMinutes: 50 };
  const failures = laneTimeoutFailures(stale, canonical, waiterWorkflow);
  assert.ok(failures.length >= 2, 'stale waiter timeout and workflow drift must both be reported');
  assert.ok(failures.some((failure) => /drifted/.test(failure)), 'workflow drift must be reported');
  assert.ok(failures.some((failure) => /cannot cover its/.test(failure)), 'poll coverage must be reported');
});

test('a poll timeout below the canonical job timeout is rejected', () => {
  const { lane, canonical } = lanes.find((entry) => entry.id === 'hall-web-runtime-proof');
  const failures = laneTimeoutFailures({ ...lane, pollTimeoutSeconds: 1800 }, canonical, waiterWorkflow);
  assert.ok(failures.some((failure) => /cannot cover the canonical job timeout/.test(failure)), failures.join('; '));
});

test('a missing canonical job block is rejected instead of silently passing', () => {
  const { lane } = lanes.find((entry) => entry.id === 'hall-web-runtime-proof');
  const failures = laneTimeoutFailures(lane, 'jobs:\n  some-other-job:\n    timeout-minutes: 75\n', waiterWorkflow);
  assert.deepEqual(failures, [`${lane.workflowFile} canonical job ${lane.canonicalJob} timeout drifted: workflow=null contract=${lane.canonicalJobTimeoutMinutes}`]);
});
