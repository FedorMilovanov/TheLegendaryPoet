import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const common = [
  '--config=playwright.config.mjs',
  '--workers=1',
  '--reporter=line',
];
const artifactDir = path.resolve('qa-artifacts');
const processLogPath = path.join(artifactDir, 'webkit-home-processes.log');
fs.mkdirSync(artifactDir, { recursive: true });
fs.writeFileSync(
  processLogPath,
  `tested_sha=${process.env.TESTED_SHA || process.env.GITHUB_SHA || 'unknown'}\nstarted_at=${new Date().toISOString()}\n`,
);

const suites = [
  {
    id: 'home-dock-search',
    file: 'qa/mobile-home-webkit.spec.mjs',
    grep: 'WebKit home dock, search sheet and tap targets remain usable in a fresh context',
  },
  {
    id: 'home-poet-count',
    file: 'qa/mobile-home-webkit.spec.mjs',
    grep: 'WebKit home principal section poet-count reveals in a fresh context',
  },
  {
    id: 'home-poem-of-day',
    file: 'qa/mobile-home-webkit.spec.mjs',
    grep: 'WebKit home principal section poem-of-day reveals in a fresh context',
  },
  {
    id: 'home-featured-poets',
    file: 'qa/mobile-home-webkit.spec.mjs',
    grep: 'WebKit home principal section featured-poets reveals in a fresh context',
  },
  {
    id: 'home-faith-culture',
    file: 'qa/mobile-home-webkit.spec.mjs',
    grep: 'WebKit home principal section faith-culture reveals in a fresh context',
  },
  ...['poets', 'ratings', 'articles', 'music', 'archive', 'about', 'not-found'].map((route) => ({
    id: `route-${route}`,
    file: 'qa/mobile-home-webkit.spec.mjs',
    grep: `WebKit ${route} route keeps one representative lazy landmark and runtime stable`,
  })),
  {
    id: 'desktop-reader-certification',
    file: 'qa/premium-reader-certification.spec.mjs',
    project: 'webkit-reader-desktop',
  },
];

const record = (line) => {
  const stamped = `${new Date().toISOString()} ${line}`;
  fs.appendFileSync(processLogPath, `${stamped}\n`);
  console.log(stamped);
};

for (const [index, suite] of suites.entries()) {
  const args = [
    'playwright',
    'test',
    suite.file,
    ...common,
    `--project=${suite.project ?? 'iphone-safari'}`,
  ];
  if (suite.grep) args.push('--grep', suite.grep);
  const label = `${index + 1}/${suites.length} ${suite.id}`;

  record(`[webkit-home-process START] ${label}`);
  const startedAt = Date.now();
  const result = spawnSync(npx, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      TLP_WEBKIT_PROCESS_ID: suite.id,
    },
  });
  const elapsedMs = Date.now() - startedAt;

  if (result.error) {
    record(`[webkit-home-process ERROR] ${label} elapsed_ms=${elapsedMs} message=${JSON.stringify(result.error.message)}`);
    throw result.error;
  }
  if (result.signal) {
    record(`[webkit-home-process SIGNAL] ${label} elapsed_ms=${elapsedMs} signal=${result.signal}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    record(`[webkit-home-process FAIL] ${label} elapsed_ms=${elapsedMs} status=${result.status ?? 'null'}`);
    process.exit(result.status ?? 1);
  }

  record(`[webkit-home-process PASS] ${label} elapsed_ms=${elapsedMs}`);
}

record(`[webkit-home-process COMPLETE] ${suites.length}/${suites.length} all contours passed`);
