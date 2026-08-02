import { spawnSync } from 'node:child_process';

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const common = [
  '--config=playwright.home-polish.config.mjs',
  '--project=home-iphone-safari',
  '--workers=1',
  '--reporter=line',
];
const suites = [
  {
    id: 'iphone-first-viewport',
    grep: 'first viewport keeps six decoded portraits, crisp title and usable labels',
  },
  {
    id: 'iphone-reduced-motion',
    grep: 'reduced motion removes title, hero-root, window and decorative movement',
  },
];

for (const [index, suite] of suites.entries()) {
  const args = [
    'playwright',
    'test',
    'qa/home-polish.spec.mjs',
    ...common,
    '--grep',
    suite.grep,
  ];

  console.log(`\n[home-iphone-critical-process ${index + 1}/${suites.length}] ${suite.id}`);
  const result = spawnSync(npx, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      TLP_HOME_PROCESS_ID: suite.id,
    },
  });

  if (result.error) throw result.error;
  if (result.signal) {
    console.error(`[home-iphone-critical-process] ${suite.id} terminated by ${result.signal}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`[home-iphone-critical-process] ${suite.id} failed with status ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

console.log(`\n[home-iphone-critical-process] ${suites.length} fresh-process critical iPhone contours passed`);
