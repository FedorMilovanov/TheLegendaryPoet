import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runtimeDocumentationFacts, validateFactTable } from '../lib/runtime-documentation.mjs';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const project = JSON.parse(read('docs/project-contract.json'));
const hall = JSON.parse(read(project.runtime.hallContract));
const facts = runtimeDocumentationFacts(project, hall);
const table = ({ id, values }) => [
  `<!-- runtime-facts:${id}:start -->`, '| Field | Value |', '| --- | --- |',
  ...Object.entries(values).map(([key, value]) => `| \`${key}\` | \`${value}\` |`),
  `<!-- runtime-facts:${id}:end -->`,
].join('\n');

for (const fact of facts) {
  test(`${fact.id}: accepts checked document, reordered rows and formatting`, () => {
    assert.deepEqual(validateFactTable(read(fact.path), fact), []);
    const reordered = { ...fact, values: Object.fromEntries(Object.entries(fact.values).reverse()) };
    assert.deepEqual(validateFactTable(table(reordered).replaceAll('`', '').replaceAll('\n', '\r\n'), fact), []);
  });
  for (const [key, value] of Object.entries(fact.values)) {
    test(`${fact.id}: rejects changed or missing ${key}`, () => {
      const row = `| \`${key}\` | \`${value}\` |`;
      const corrupt = table(fact).replace(row, `| \`${key}\` | \`wrong\` |`);
      assert.ok(validateFactTable(corrupt, fact).some((failure) => failure.includes(key)));
      assert.ok(validateFactTable(table(fact).replace(row, ''), fact).some((failure) => failure.includes(key)));
    });
  }
  test(`${fact.id}: rejects missing, duplicate, reversed blocks and duplicate/unknown rows`, () => {
    const valid = table(fact);
    for (const invalid of ['', valid + valid, valid.replace(':start', ':temporary').replace(':end', ':start').replace(':temporary', ':end'),
      valid.replace('| --- | --- |', `| --- | --- |\n${valid.split('\n')[3]}`),
      valid.replace('| --- | --- |', '| --- | --- |\n| invented | true |')]) {
      assert.ok(validateFactTable(invalid, fact).length > 0);
    }
  });
}

test('rejects retired Hall and Lenis states, including contract drift in the other direction', () => {
  const retiredHall = structuredClone(hall);
  retiredHall.phase = 'pushkinVerticalSlice';
  retiredHall.productionRoute.mode = 'placeholder';
  retiredHall.productionRoute.allowThreeRuntimeImports = false;
  const retiredProject = structuredClone(project);
  retiredProject.runtime.scrollMode = 'lenis';
  const retiredFacts = runtimeDocumentationFacts(retiredProject, retiredHall);
  for (let i = 0; i < facts.length; i++) {
    assert.ok(validateFactTable(table(retiredFacts[i]), facts[i]).length > 0);
    assert.ok(validateFactTable(table(facts[i]), retiredFacts[i]).length > 0);
  }
  delete retiredHall.gates.offlineVisualApproval;
  assert.throws(() => runtimeDocumentationFacts(project, retiredHall), /Missing runtime fact/);
});
