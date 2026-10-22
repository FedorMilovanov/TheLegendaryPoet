import { test } from 'node:test';
import assert from 'node:assert/strict';
import Reporter from '../qa-github-failure-reporter.mjs';

function report(outcome, errors = []) {
  const reporter = new Reporter();
  reporter.onBegin({}, { allTests: () => [{
    outcome: () => outcome,
    titlePath: () => ['Safari', 'name, with: punctuation'],
    location: { file: `${process.cwd()}/qa/example.spec.mjs`, line: 12 },
    results: [{ errors }],
  }] });
  const output = [];
  const original = console.error;
  console.error = (message) => output.push(message);
  try { reporter.onEnd(); } finally { console.error = original; }
  return output;
}

for (const outcome of ['expected', 'skipped']) {
  test(`${outcome} tests produce no failure annotations`, () => assert.deepEqual(report(outcome), []));
}
test('unexpected failure includes location and escaped diagnostic, without ANSI', () => {
  const [message] = report('unexpected', [{ message: '\u001b[31mExpected 4.5\nReceived 4.08%\r\n::error::not a new command\u001b[0m' }]);
  assert.match(message, /^::error file=qa\/example.spec.mjs,line=12,title=unexpected/);
  assert.match(message, /name%2C with%3A punctuation/);
  assert.match(message, /Expected 4.5%0AReceived 4.08%25%0D%0A::error::/);
  assert.ok(!message.includes('\n') && !message.includes('\u001b'));
});
test('flaky outcomes remain visible under strict CI fail-on-flaky policy', () => {
  assert.match(report('flaky', [{ message: 'First attempt failed' }])[0], /title=flaky/);
});
test('diagnostic size is bounded and empty failures still report', () => {
  assert.ok(report('unexpected', [{ message: 'x'.repeat(9000) }])[0].length < 8300);
  assert.match(report('unexpected')[0], /Final test outcome: unexpected/);
});
