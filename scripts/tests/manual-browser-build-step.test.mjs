import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const workflow = fs.readFileSync(new URL('../../.github/workflows/manual-browser-qa.yml', import.meta.url), 'utf8');
const block = workflow.match(/      - name: Build production site\n[\s\S]*?        run: \|\n((?:          .*\n)+)/);
assert.ok(block, 'the canonical browser production build step must exist');
const script = block[1].replace(/^          /gm, '');
const stages = ['sitemap', 'build', 'validate:build-output'];

function run(failStage) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'browser-build-step-'));
  try {
    fs.writeFileSync(path.join(dir, 'npm'), `#!/bin/bash\nprintf 'stage=%s\\n' "$2"
if [[ "$2" == "$FAIL_STAGE" ]]; then printf 'failed=%s\\n' "$2" >&2; exit 42; fi
`, { mode: 0o755 });
    const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', script], {
      cwd: dir,
      encoding: 'utf8',
      timeout: 5000,
      env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, FAIL_STAGE: failStage ?? '' },
    });
    const log = fs.readFileSync(path.join(dir, 'production-build.log'), 'utf8');
    return { ...result, log };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('browser production build reports success and preserves the full log', () => {
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.log, stages.map(stage => `stage=${stage}\n`).join(''));
  assert.equal(result.stdout, result.log, 'the saved log must also be printed');
});

for (const [index, stage] of stages.entries()) {
  test(`browser production build fails closed on ${stage}, retaining its log`, () => {
    const result = run(stage);
    assert.equal(result.status, 42, result.stderr);
    assert.equal(result.log, stages.slice(0, index + 1).map(s => `stage=${s}\n`).join('') + `failed=${stage}\n`);
    assert.equal(result.stdout, result.log, 'the failed-stage log must also be printed');
  });
}
