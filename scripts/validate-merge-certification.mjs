import fs from 'node:fs';
import path from 'node:path';
import { classifyChangedFiles, globToRegExp } from './classify-merge-certification.mjs';

const root = process.cwd();
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const contract = JSON.parse(read('docs/merge-certification.json'));

expect(contract.version === 1, 'merge-certification contract version must remain 1');

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

const laneSpecs = [
  {
    id: 'hall-pushkin-offline-exhibit',
    workflowFile: '.github/workflows/hall-pushkin-offline-exhibit.yml',
    timeoutMin: 6600,
    timeoutMax: 7500,
    requiredPaths: [
      '.github/workflows/hall-pushkin-offline-exhibit.yml',
      'scripts/hall-pushkin/**',
      'package.json',
      'package-lock.json',
      '.github/actions/setup-node-deps/**',
    ],
  },
  {
    id: 'hall-pushkin-visual-remediation',
    workflowFile: '.github/workflows/hall-pushkin-visual-remediation.yml',
    timeoutMin: 7200,
    timeoutMax: 8400,
    requiredPaths: [
      '.github/workflows/hall-pushkin-visual-remediation.yml',
      'docs/hall-v3/pushkin-visual-remediation.json',
      'scripts/hall-lookdev/**',
      'scripts/hall-pushkin/**',
    ],
  },
  {
    id: 'hall-web-runtime-proof',
    workflowFile: '.github/workflows/hall-web-runtime-proof.yml',
    timeoutMin: 1800,
    timeoutMax: 3000,
    requiredPaths: [
      '.github/workflows/hall-web-runtime-proof.yml',
      'docs/hall-v3/web-runtime-proof.json',
      'qa/hall-web-runtime/**',
      'qa/hall-web-runtime.spec.mjs',
      'scripts/hall-web-runtime/**',
      'scripts/validate-hall-web-runtime-proof.mjs',
      'package.json',
      'package-lock.json',
      '.github/actions/setup-node-deps/action.yml',
      '.github/actions/install-playwright/action.yml',
    ],
  },
];

for (const spec of laneSpecs) {
  const lane = contract.lanes?.[spec.id];
  expect(Boolean(lane), `${spec.id} conditional lane is missing`);
  expect(lane?.workflowFile === spec.workflowFile, `${spec.id} workflow file drifted`);
  expect(lane?.event === 'pull_request', `${spec.id} must observe pull_request evidence`);
  expect(lane?.pollTimeoutSeconds >= spec.timeoutMin && lane?.pollTimeoutSeconds <= spec.timeoutMax, `${spec.id} poll timeout is outside bounded execution/queue headroom`);
  expect(lane?.pollIntervalSeconds >= 10 && lane?.pollIntervalSeconds <= 60, `${spec.id} poll interval must remain bounded`);

  const paths = lane?.paths ?? [];
  expect(paths.length > 0, `${spec.id} path contract is empty`);
  expect(new Set(paths).size === paths.length, `${spec.id} path contract contains duplicates`);
  const workflowPaths = pullRequestPaths(read(spec.workflowFile));
  expect(workflowPaths.length > 0, `${spec.id} pull_request path filter could not be parsed`);
  expect(JSON.stringify(workflowPaths) === JSON.stringify(paths), `${spec.id} pull_request paths drifted from docs/merge-certification.json; update the SSOT and workflow together`);

  for (const requiredPath of spec.requiredPaths) {
    expect(paths.includes(requiredPath), `${spec.id} mapping lost required path: ${requiredPath}`);
  }
  for (const pattern of paths) {
    const representative = pattern.endsWith('/**') ? `${pattern.slice(0, -3)}/representative.file` : pattern;
    expect(globToRegExp(pattern).test(representative), `glob classifier cannot match ${spec.id} pattern: ${pattern}`);
  }
}

const outside = classifyChangedFiles(['README.md', 'docs/research/example.md'], contract);
expect(outside.lanes['hall-pushkin-offline-exhibit']?.required === false, 'unrelated docs must not require offline Hall');
expect(outside.lanes['hall-pushkin-visual-remediation']?.required === false, 'unrelated docs must not require visual-remediation Hall');
expect(outside.lanes['hall-web-runtime-proof']?.required === false, 'unrelated docs must not require Hall web runtime proof');

const packageScope = classifyChangedFiles(['package.json'], contract);
expect(packageScope.lanes['hall-pushkin-offline-exhibit']?.required === true, 'package.json must require offline Hall');
expect(packageScope.lanes['hall-pushkin-visual-remediation']?.required === false, 'package.json must not require visual-remediation Hall unless its workflow trigger changes');
expect(packageScope.lanes['hall-web-runtime-proof']?.required === true, 'package.json must require Hall web runtime proof');

const lookdevScope = classifyChangedFiles(['scripts/hall-lookdev/example.mjs'], contract);
expect(lookdevScope.lanes['hall-pushkin-offline-exhibit']?.required === false, 'lookdev-only change must not require offline Hall');
expect(lookdevScope.lanes['hall-pushkin-visual-remediation']?.required === true, 'lookdev-only change must require visual-remediation Hall');
expect(lookdevScope.lanes['hall-web-runtime-proof']?.required === false, 'lookdev-only change must not require web runtime proof');

const sharedHallScope = classifyChangedFiles(['scripts/hall-pushkin/example.mjs'], contract);
expect(sharedHallScope.lanes['hall-pushkin-offline-exhibit']?.required === true, 'shared Hall Pushkin script must require offline Hall');
expect(sharedHallScope.lanes['hall-pushkin-visual-remediation']?.required === true, 'shared Hall Pushkin script must require visual-remediation Hall');
expect(sharedHallScope.lanes['hall-web-runtime-proof']?.required === false, 'offline Pushkin tooling alone must not require web runtime proof');

const webScope = classifyChangedFiles(['qa/hall-web-runtime/main.ts'], contract);
expect(webScope.lanes['hall-pushkin-offline-exhibit']?.required === false, 'web proof harness must not require offline Hall');
expect(webScope.lanes['hall-pushkin-visual-remediation']?.required === false, 'web proof harness must not require visual remediation');
expect(webScope.lanes['hall-web-runtime-proof']?.required === true, 'web proof harness must require web runtime exact-head certification');

const sharedAuthorityScope = classifyChangedFiles(['docs/hall-v3/greybox-layouts.json'], contract);
expect(sharedAuthorityScope.lanes['hall-pushkin-offline-exhibit']?.required === true, 'H3 layout authority must require offline Hall');
expect(sharedAuthorityScope.lanes['hall-pushkin-visual-remediation']?.required === true, 'H3 layout authority must require visual remediation');
expect(sharedAuthorityScope.lanes['hall-web-runtime-proof']?.required === true, 'H3 layout authority must require web runtime proof');

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
  'hall_offline_required:',
  'hall_visual_required:',
  'hall_web_runtime_required:',
  "if: needs.scope.outputs.hall_offline_required == 'true'",
  "if: needs.scope.outputs.hall_visual_required == 'true'",
  "if: needs.scope.outputs.hall_web_runtime_required == 'true'",
  '--lane hall-pushkin-offline-exhibit',
  '--lane hall-pushkin-visual-remediation',
  '--lane hall-web-runtime-proof',
  'needs: [scope, hall-pushkin-offline, hall-pushkin-visual, hall-web-runtime]',
  'name: merge-certification',
  'test "$OFFLINE_RESULT" = "success"',
  'test "$OFFLINE_RESULT" = "skipped"',
  'test "$VISUAL_RESULT" = "success"',
  'test "$VISUAL_RESULT" = "skipped"',
  'test "$WEB_RUNTIME_RESULT" = "success"',
  'test "$WEB_RUNTIME_RESULT" = "skipped"',
]) {
  expect(mergeWorkflow.includes(token), `Merge certification workflow lost invariant: ${token}`);
}
expect(!mergeWorkflow.includes('if: always()'), 'final aggregate job must not use always(); stale concurrency cancellation must terminate instead of scheduling another job');
expect(!mergeWorkflow.includes('uses: ./.github/workflows/hall-pushkin-offline-exhibit.yml'), 'aggregate certification must observe offline Hall rather than start a duplicate render');
expect(!mergeWorkflow.includes('uses: ./.github/workflows/hall-pushkin-visual-remediation.yml'), 'aggregate certification must observe visual-remediation Hall rather than start a duplicate render');
expect(!mergeWorkflow.includes('uses: ./.github/workflows/hall-web-runtime-proof.yml'), 'aggregate certification must observe web runtime proof rather than start duplicate browser work');

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
  expect(waiter.includes(token), `workflow waiter lost exact-head/terminal invariant: ${token}`);
}

const packageJson = JSON.parse(read('package.json'));
expect(packageJson.scripts?.['validate:merge-certification'] === 'node scripts/validate-merge-certification.mjs', 'package.json must expose validate:merge-certification');
expect(packageJson.scripts?.check?.includes('npm run validate:merge-certification'), 'repository check must execute validate:merge-certification');
const ci = read('.github/workflows/ci.yml');
expect(ci.includes('Validate conditional exact-head merge certification contract'), 'CI / verify must expose merge-certification validation explicitly');
expect(ci.includes('run: npm run validate:merge-certification'), 'CI / verify must execute validate:merge-certification directly');

if (failures.length) {
  console.error('merge certification contract: FAILED');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`merge certification contract: OK lanes=${Object.keys(contract.lanes ?? {}).length}`);
