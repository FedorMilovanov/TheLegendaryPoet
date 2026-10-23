import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const script = path.resolve('.github/actions/install-build-tools/install.sh');
function run({ installed = [], cached = true, updateExit = 0, installExit = 0, broken = false, omitInstall = false, detail = '', prepare = false, image = 'fixture-image', candidate = '1.0', archive = false, stall = false, packages = ['ffmpeg'] } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'build-tools-'));
  try {
    const state = path.join(dir, 'state'), log = path.join(dir, 'log');
    const output = path.join(dir, 'output'), deadlineLog = path.join(dir, 'deadline');
    const archiveDir = path.join(dir, 'tlp-build-tool-archives');
    if (archive) { fs.mkdirSync(archiveDir); fs.writeFileSync(path.join(archiveDir, 'fixture.deb'), 'not a trusted binary'); }
    fs.writeFileSync(state, installed.join('\n') + '\n');
    const mock = (name, body) => fs.writeFileSync(path.join(dir, name), '#!/bin/bash\nset -eu\n' + body, { mode: 0o755 });
    mock('dpkg-query', `p="\${!#}"; grep -Fxq "$p" "$STATE" || exit 1
if [[ "$*" == *Status* ]]; then printf 'install ok installed'; else echo "$p=fixture-version"; fi\n`);
    mock('apt-cache', `if [[ "$CACHED" == yes ]]; then echo "  Candidate: $CANDIDATE"; else echo '  Candidate: (none)'; fi\n`);
    mock('sudo', 'if [[ "$1" == install ]]; then mkdir -p "${!#}"; exit 0; fi; exec "$@"\n');
    mock('timeout', `echo "$*" >> "$DEADLINE_LOG"
args=("$@"); if [[ "$STALL" == yes ]]; then args[1]=0.1s; fi
exec /usr/bin/timeout "\${args[@]}"\n`);
    mock('apt-get', `echo "$*" >> "$LOG"
if [[ "$STALL" == yes ]]; then echo 'Get:1 https://fixture.invalid/pkg'; sleep 5; fi
if [[ "$*" == *' update'* ]]; then exit "$UPDATE_EXIT"; fi
if [[ "$INSTALL_EXIT" != 0 ]]; then printf '%s\n' "$DETAIL" >&2; exit "$INSTALL_EXIT"; fi
if [[ "$OMIT" != yes ]]; then
  found=no; for arg in "$@"; do
    if [[ "$found" == yes && "$arg" != -* ]]; then echo "$arg" >> "$STATE"; fi
    if [[ "$arg" == --no-install-recommends ]]; then found=yes; fi
  done
fi\n`);
    mock('ffmpeg', `if [[ "$BROKEN" == yes ]]; then exit 17; fi; echo 'ffmpeg version fixture'; echo 'configuration: fixture'\n`);
    const result = spawnSync('bash', [script, ...packages], { encoding: 'utf8', timeout: 3000, env: {
      ...process.env, BUILD_TOOL_PREPARE_CACHE: prepare ? '1' : '0', ImageOS: 'fixture-os', ImageVersion: image, RUNNER_TEMP: dir, GITHUB_OUTPUT: output,
      BUILD_TOOL_ARCHIVE_DIR: archive ? archiveDir : '', STALL: stall ? 'yes' : 'no', DEADLINE_LOG: deadlineLog, CANDIDATE: candidate, PATH: `${dir}:${process.env.PATH}`, STATE: state, LOG: log,
      CACHED: cached ? 'yes' : 'no', UPDATE_EXIT: String(updateExit), INSTALL_EXIT: String(installExit),
      DETAIL: detail, BROKEN: broken ? 'yes' : 'no', OMIT: omitInstall ? 'yes' : 'no',
    } });
    return { ...result, output: fs.existsSync(output) ? fs.readFileSync(output, 'utf8') : '', deadline: fs.existsSync(deadlineLog) ? fs.readFileSync(deadlineLog, 'utf8') : '', apt: fs.existsSync(log) ? fs.readFileSync(log, 'utf8') : '' };
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

test('APT failure annotations retain diagnostics, escape commands and redact URL credentials', () => {
  const r = run({ installExit: 43, detail: 'Failed 100%\nhttps://user:fixture@example.invalid/pkg?key=fixture' });
  assert.equal(r.status, 43);
  assert.match(r.stderr, /APT failure detail::Failed 100%25%0A/);
  assert.match(r.stderr, /https:\/\/\[redacted\]@example.invalid\/pkg\?key=\[redacted\]/);
  assert.doesNotMatch(r.stderr, /user:fixture|key=fixture/);
});

test('archive cache key is stable, changes with image/candidate/package and never installs during preparation', () => {
  const a = run({ prepare: true }), b = run({ prepare: true });
  assert.equal(a.status, 0); assert.equal(a.apt, ''); assert.equal(a.output, b.output);
  assert.match(a.output, /needed=true\nkey=tlp-apt-v1-[a-f0-9]{64}/);
  for (const change of [{ image: 'new-image' }, { candidate: '2.0' }, { packages: ['poppler-utils'] }]) {
    assert.notEqual(run({ prepare: true, ...change }).output, a.output);
  }
});
test('installed tools and unknown runner images do not request archive sharing', () => {
  for (const options of [{ installed: ['ffmpeg'] }, { image: '' }]) {
    const r = run({ prepare: true, ...options });
    assert.equal(r.status, 0); assert.equal(r.output, 'needed=false\n'); assert.equal(r.apt, '');
  }
});
test('restored archives never skip APT or runnable-tool verification', () => {
  const r = run({ archive: true }); assert.equal(r.status, 0);
  assert.match(r.apt, /Dir::Cache::archives=.*tlp-build-tool-archives/);
  assert.match(r.apt, /APT::Keep-Downloaded-Packages=true/);
  assert.match(r.stdout, /phase=verified/);
  const failed = run({ archive: true, installExit: 43 }); assert.equal(failed.status, 43);
  assert.doesNotMatch(failed.stdout, /phase=verified/);
  assert.equal(run({ archive: true, broken: true }).status, 17);
});
test('stalled APT is terminated by the wall-clock deadline and reports transfer context', () => {
  const r = run({ stall: true }); assert.equal(r.status, 124);
  assert.match(r.deadline, /^--kill-after=10s 600s sudo apt-get/);
  assert.match(r.stderr, /phase=apt-install.*exit=124/);
  assert.match(r.stderr, /APT failure detail::Get:1 https:\/\/fixture.invalid\/pkg/);
  assert.doesNotMatch(r.stdout, /phase=verified/);
});
test('archive cache wiring is exact-key only, immutable and never substitutes for install', () => {
  const action = fs.readFileSync('.github/actions/install-build-tools/action.yml', 'utf8');
  assert.match(action, /actions\/cache\/restore@[a-f0-9]{40}/);
  assert.match(action, /actions\/cache\/save@[a-f0-9]{40}/);
  assert.doesNotMatch(action, /restore-keys:|continue-on-error:/);
  assert.match(action, /steps.install.outcome == 'success'/);
  const install = action.split('- name: Install system build tools')[1].split('- name: Save')[0];
  assert.doesNotMatch(install, /^\s+if:/m);
  assert.match(action, /tlp-build-tool-archives\/\*\.deb/);
});
