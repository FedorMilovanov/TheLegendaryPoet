import { spawnSync } from 'node:child_process';

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const common = [
  '--config=playwright.config.mjs',
  '--project=iphone-safari',
  '--workers=1',
  '--reporter=line,./scripts/qa-github-failure-reporter.mjs',
];

const hoverRoutes = ['home', 'articles', 'essay', 'poets', 'music', 'archive', 'ratings'];

const animatedLifetime = 'animated modal exit lifetime';
const suites = [
  { id: 'animated-modal-exit-lifetime', file: 'qa/reader-journeys.spec.mjs', grep: animatedLifetime },
  { id: 'mobile-platforms', file: 'qa/mobile-platforms.spec.mjs' },
  { id: 'poets-status', file: 'qa/poets-status.spec.mjs' },
  { id: 'poem-source-coverage-w83', file: 'qa/poem-source-coverage-w83.spec.mjs' },
  { id: 'poetry-first-editions-w84', file: 'qa/poetry-first-editions-w84.spec.mjs' },
  { id: 'poetry-first-edition-w85', file: 'qa/poetry-first-edition-w85.spec.mjs' },
  { id: 'poetry-stub-budget-w86', file: 'qa/poetry-stub-budget-w86.spec.mjs' },
  { id: 'poet-hash-layout-w88', file: 'qa/poet-hash-layout-w88.spec.mjs' },
  { id: 'ak-tolstoy-fulltexts', file: 'qa/ak-tolstoy-fulltexts.spec.mjs' },
  { id: 'mandelstam-fulltext-rights', file: 'qa/mandelstam-fulltext-rights.spec.mjs' },
  { id: 'simonov-excerpts-rights', file: 'qa/simonov-excerpts-rights.spec.mjs' },
  { id: 'rating-urlstate', file: 'qa/rating-urlstate.spec.mjs' },
  { id: 'audio-completion', file: 'qa/audio-completion.spec.mjs' },
  { id: 'community-request-topology', file: 'qa/community-request-topology.spec.mjs' },
  { id: 'secondary-data-failure', file: 'qa/secondary-data-failure.spec.mjs' },
  { id: 'reader-journeys', file: 'qa/reader-journeys.spec.mjs', grep: `^(?!.*${animatedLifetime})` },
  { id: 'fragment-navigation', file: 'qa/fragment-navigation.spec.mjs' },
  { id: 'premium-reader-certification', file: 'qa/premium-reader-certification.spec.mjs' },
  { id: 'yesenin-part-one', file: 'qa/yesenin-part-one.spec.mjs' },
  { id: 'brand-reference-raster', file: 'qa/brand-emblem.spec.mjs' },
  { id: 'brand-reference-comparison', file: 'qa/brand-reference-comparison.spec.mjs' },
  ...hoverRoutes.map((route) => ({
    id: `hover-${route}`,
    file: 'qa/hover-stability.spec.mjs',
    grep: `${route} interactive artwork uses the universal stable-hover contract`,
  })),
];

for (const [index, suite] of suites.entries()) {
  const args = ['playwright', 'test', suite.file, ...common];
  if (suite.grep) args.push('--grep', suite.grep);

  console.log(`\n[webkit-base-process ${index + 1}/${suites.length}] ${suite.id}`);
  const result = spawnSync(npx, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      TLP_WEBKIT_PROCESS_ID: suite.id,
    },
  });

  if (result.error) throw result.error;
  if (result.signal) {
    console.error(`[webkit-base-process] ${suite.id} terminated by ${result.signal}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`[webkit-base-process] ${suite.id} failed with status ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

console.log(`\n[webkit-base-process] ${suites.length} fresh-process base Safari contours passed`);
