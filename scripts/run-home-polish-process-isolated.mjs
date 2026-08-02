import { spawnSync } from 'node:child_process';

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const files = [
  'qa/home-polish.spec.mjs',
  'qa/home-labels.spec.mjs',
  'qa/home-ambient.spec.mjs',
];
const common = [
  '--config=playwright.home-polish.config.mjs',
  '--workers=1',
  '--reporter=line',
];

const suites = [
  { id: 'desktop-premium', project: 'home-desktop', files },
  { id: 'pixel7-premium', project: 'home-pixel7', files },
  { id: 'iphone-ambient', project: 'home-iphone-safari', files: ['qa/home-ambient.spec.mjs'] },
  { id: 'iphone-labels', project: 'home-iphone-safari', files: ['qa/home-labels.spec.mjs'] },
  {
    id: 'iphone-first-viewport',
    project: 'home-iphone-safari',
    files: ['qa/home-polish.spec.mjs'],
    grep: 'first viewport keeps six decoded portraits, crisp title and usable labels',
  },
  {
    id: 'iphone-reduced-motion',
    project: 'home-iphone-safari',
    files: ['qa/home-polish.spec.mjs'],
    grep: 'reduced motion removes title, hero-root, window and decorative movement',
  },
];

for (const [index, suite] of suites.entries()) {
  const args = ['playwright', 'test', ...suite.files, ...common, `--project=${suite.project}`];
  if (suite.grep) args.push('--grep', suite.grep);

  console.log(`\n[home-process ${index + 1}/${suites.length}] ${suite.id}`);
  const result = spawnSync(npx, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      TLP_HOME_PROCESS_ID: suite.id,
    },
  });

  if (result.error) throw result.error;
  if (result.signal) {
    console.error(`[home-process] ${suite.id} terminated by ${result.signal}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`[home-process] ${suite.id} failed with status ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

console.log(`\n[home-process] ${suites.length} fresh-process premium contours passed`);
