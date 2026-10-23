import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const script = path.resolve('.github/actions/install-build-tools/install.sh');
function run({ installed = [], cached = true, updateExit = 0, installExit = 0, broken = false, omitInstall = false, packages = ['ffmpeg'] } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'build-tools-'));
  try {
    const state = path.join(dir, 'state'), log = path.join(dir, 'log');
    fs.writeFileSync(state, installed.join('\n') + '\n');
    const mock = (name, body) => fs.writeFileSync(path.join(dir, name), '#!/bin/bash\nset -eu\n' + body, { mode: 0o755 });
    mock('dpkg-query', `p="\${!#}"; grep -Fxq "$p" "$STATE" || exit 1
if [[ "$*" == *Status* ]]; then printf 'install ok installed'; else echo "$p=fixture-version"; fi\n`);
    mock('apt-cache', `if [[ "$CACHED" == yes ]]; then echo '  Candidate: 1.0'; else echo '  Candidate: (none)'; fi\n`);
    mock('sudo', 'exec "$@"\n');
    mock('apt-get', `echo "$*" >> "$LOG"
if [[ "$*" == *' update'* ]]; then exit "$UPDATE_EXIT"; fi
if [[ "$INSTALL_EXIT" != 0 ]]; then exit "$INSTALL_EXIT"; fi
if [[ "$OMIT" != yes ]]; then
  found=no; for arg in "$@"; do
    if [[ "$found" == yes && "$arg" != -* ]]; then echo "$arg" >> "$STATE"; fi
    if [[ "$arg" == --no-install-recommends ]]; then found=yes; fi
  done
fi\n`);
    mock('ffmpeg', `if [[ "$BROKEN" == yes ]]; then exit 17; fi; echo 'ffmpeg version fixture'; echo 'configuration: fixture'\n`);
    const result = spawnSync('bash', [script, ...packages], { encoding: 'utf8', env: {
      ...process.env, PATH: `${dir}:${process.env.PATH}`, STATE: state, LOG: log,
      CACHED: cached ? 'yes' : 'no', UPDATE_EXIT: String(updateExit), INSTALL_EXIT: String(installExit),
      BROKEN: broken ? 'yes' : 'no', OMIT: omitInstall ? 'yes' : 'no',
    } });
    return { ...result, apt: fs.existsSync(log) ? fs.readFileSync(log, 'utf8') : '' };
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
test('installed runnable tools require no apt network operations', () => {
  const r = run({ installed: ['ffmpeg'] });
  assert.equal(r.status, 0); assert.equal(r.apt, ''); assert.match(r.stdout, /phase=verified/);
});
test('resolvable missing package installs from existing indexes without update', () => {
  const r = run(); assert.equal(r.status, 0); assert.doesNotMatch(r.apt, / update/);
  assert.match(r.apt, /install -y --no-install-recommends ffmpeg/);
  assert.match(r.apt, /Acquire::http::Timeout=30/);
});
test('absent cached candidate refreshes strictly before installation', () => {
  const r = run({ cached: false }); assert.equal(r.status, 0);
  assert.match(r.apt, /APT::Update::Error-Mode=any update/);
  assert.equal(r.apt.trim().split('\n').length, 2);
});
test('failed index refresh stops installation and reports the actual phase', () => {
  const r = run({ cached: false, updateExit: 42 }); assert.equal(r.status, 42);
  assert.doesNotMatch(r.apt, /install -y/); assert.match(r.stderr, /phase=apt-update.*exit=42/);
});
test('failed package download is not retried or disguised as success', () => {
  const r = run({ installExit: 43 }); assert.equal(r.status, 43);
  assert.equal(r.apt.trim().split('\n').length, 1); assert.match(r.stderr, /phase=apt-install/);
});
test('installed package with broken FFmpeg cannot pass the fast path', () => {
  const r = run({ installed: ['ffmpeg'], broken: true }); assert.equal(r.status, 17);
  assert.equal(r.apt, ''); assert.doesNotMatch(r.stdout, /phase=verified/);
});
test('successful apt exit without an installed package still fails verification', () => {
  const r = run({ omitInstall: true }); assert.equal(r.status, 1);
  assert.match(r.stderr, /not installed after setup/);
});
test('only missing packages are installed; invalid option-like names fail before apt', () => {
  const r = run({ installed: ['ffmpeg'], packages: ['ffmpeg', 'poppler-utils'] });
  assert.equal(r.status, 0); assert.match(r.apt, /--no-install-recommends poppler-utils/);
  const invalid = run({ packages: ['--allow-unauthenticated'] });
  assert.equal(invalid.status, 2); assert.equal(invalid.apt, '');
});
