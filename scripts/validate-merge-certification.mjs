import fs from 'node:fs';
import path from 'node:path';
import { classifyChangedFiles, globToRegExp } from './classify-merge-certification.mjs';

const root = process.cwd();
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const contract = JSON.parse(read('docs/merge-certification.json'));
const lane = contract.lanes?.['hall-pushkin-offline-exhibit'];
expect(contract.version === 1, 'merge-certification contract version must remain 1');
expect(Boolean(lane), 'Hall Pushkin conditional lane is missing');
expect(lane?.workflowFile === '.github/workflows/hall-pushkin-offline-exhibit.yml', 'Hall workflow file drifted');
expect(lane?.event === 'pull_request', 'Hall certification must observe pull_request evidence');
expect(lane?.pollTimeoutSeconds >= 6600 && lane?.pollTimeoutSeconds <= 7500, 'Hall poll timeout must cover the 90-minute render plus bounded runner-queue headroom');
expect(lane?.pollIntervalSeconds >= 10 && lane?.pollIntervalSeconds <= 60, 'Hall poll interval must remain bounded');

const paths = lane?.paths ?? [];
expect(paths.length > 0, 'Hall path contract is empty');
expect(new Set(paths).size === paths.length, 'Hall path contract contains duplicates');

const hallWorkflow = read('.github/workflows/hall-pushkin-offline-exhibit.yml');
function pullRequestPaths(workflowText) {
  const lines = workflowText.split(/\r?\n/);
  let inPullRequest = false;
  let inPaths = false;
  const found = [];
  for (const line of lines) {
    if (/^  pull_request:\s*$/.test(line)) {
      inPullRequest = true;
      inPaths = false;
      continue;
    }
    if (inPullRequest && /^  [a-zA-Z_][\w-]*:\s*$/.test(line)) break;
    if (inPullRequest && /^    paths:\s*$/.test(line)) {
      inPaths = true;
      continue;
    }
    if (inPaths) {
      const match = /^      - ['"](.+)['"]\s*$/.exec(line);
      if (match) {
        found.push(match[1]);
        continue;
      }
      if (line.trim() && !/^\s{6,}-/.test(line)) break;
    }
  }
  return found;
}

const workflowPaths = pullRequestPaths(hallWorkflow);
expect(workflowPaths.length > 0, 'Hall pull_request path filter could not be parsed');
expect(JSON.stringify(workflowPaths) === JSON.stringify(paths), 'Hall pull_request paths drifted from docs/merge-certification.json; update the SSOT and workflow together');

for (const requiredPath of [
  '.github/workflows/hall-pushkin-offline-exhibit.yml',
  'scripts/hall-pushkin/**',
  'package.json',
  'package-lock.json',
  '.github/actions/setup-node-deps/**',
]) {
  expect(paths.includes(requiredPath), `Hall merge-certification mapping lost required path: ${requiredPath}`);
}

for (const pattern of paths) {
  const representative = pattern.endsWith('/**') ? `${pattern.slice(0, -3)}/representative.file` : pattern;
  expect(globToRegExp(pattern).test(representative), `glob classifier cannot match its own Hall pattern: ${pattern}`);
}

const outside = classifyChangedFiles(['README.md', 'docs/research/example.md'], contract);
expect(outside.lanes['hall-pushkin-offline-exhibit']?.required === false, 'unrelated docs must not require Hall');
const packageScope = classifyChangedFiles(['package.json'], contract);
expect(packageScope.lanes['hall-pushkin-offline-exhibit']?.required === true, 'package.json must require Hall');
const nestedHall = classifyChangedFiles(['scripts/hall-pushkin/example.mjs'], contract);
expect(nestedHall.lanes['hall-pushkin-offline-exhibit']?.required === true, 'nested Hall Pushkin scripts must require Hall');

const mergeWorkflow = read('.github/workflows/merge-certification.yml');
for (const token of [
  'name: Merge certification',
  'pull_request:',
  'branches: [main]',
  'cancel-in-progress: true',
  'actions: read',
  'ref: ${{ github.event.pull_request.head.sha }}',
  'fetch-depth: 0',
  'scripts/classify-merge-certification.mjs',
  "if: needs.scope.outputs.hall_required == 'true'",
  'timeout-minutes: 125',
  'scripts/wait-for-workflow-certification.mjs',
  'name: merge-certification',
  'if: ${{ !cancelled() }}',
  'test "$HALL_RESULT" = "success"',
  'test "$HALL_RESULT" = "skipped"',
]) {
  expect(mergeWorkflow.includes(token), `Merge certification workflow lost invariant: ${token}`);
}
expect(!mergeWorkflow.includes('if: always()'), 'final aggregate job must not use always(); stale concurrency cancellation must terminate instead of scheduling another job');
expect(!mergeWorkflow.includes('uses: ./.github/workflows/hall-pushkin-offline-exhibit.yml'), 'aggregate certification must observe the canonical Hall run, not start a duplicate render');

const waiter = read('scripts/wait-for-workflow-certification.mjs');
for (const token of [
  'path.posix.basename(workflowFile)',
  'head_sha',
  'event: lane.event',
  'run.head_sha !== headSha',
  "run.status === 'completed'",
  "run.conclusion !== 'success'",
  'GITHUB_TOKEN',
]) {
  expect(waiter.includes(token), `Hall waiter lost exact-head/terminal invariant: ${token}`);
}

const packageJson = JSON.parse(read('package.json'));
expect(packageJson.scripts?.['validate:merge-certification'] === 'node scripts/validate-merge-certification.mjs', 'package.json must expose validate:merge-certification');
expect(packageJson.scripts?.check?.includes('npm run validate:merge-certification'), 'repository check must execute validate:merge-certification');

const ci = read('.github/workflows/ci.yml');
expect(ci.includes('Validate conditional exact-head merge certification contract'), 'CI / verify must expose the merge-certification validator as an explicit step');
expect(ci.includes('run: npm run validate:merge-certification'), 'CI / verify must execute validate:merge-certification directly');

if (failures.length) {
  console.error('merge certification contract: FAILED');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`merge certification contract: OK lanes=${Object.keys(contract.lanes ?? {}).length} hallPaths=${paths.length}`);
