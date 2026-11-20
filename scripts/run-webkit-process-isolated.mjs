import { spawnSync } from 'node:child_process';

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const common = [
  '--config=playwright.config.mjs',
  '--project=iphone-safari',
  '--workers=1',
  '--reporter=line,./scripts/qa-github-failure-reporter.mjs',
];

const hoverRoutes = ['home', 'articles', 'essay', 'poets', 'music', 'archive', 'ratings'];

const suites = [
  { id: 'mobile-platforms', file: 'qa/mobile-platforms.spec.mjs' },
  { id: 'poets-status', file: 'qa/poets-status.spec.mjs' },
  { id: 'rating-urlstate', file: 'qa/rating-urlstate.spec.mjs' },
  { id: 'audio-completion', file: 'qa/audio-completion.spec.mjs' },
  { id: 'community-request-topology', file: 'qa/community-request-topology.spec.mjs' },
  { id: 'reader-journeys', file: 'qa/reader-journeys.spec.mjs' },
  { id: 'reader-dialog-return', file: 'qa/reader-dialog-return.spec.mjs' },
  { id: 'reader-history', file: 'qa/reader-history.spec.mjs' },
  { id: 'shared-passage', file: 'qa/shared-passage.spec.mjs' },
  { id: 'command-navigation', file: 'qa/command-navigation.spec.mjs' },
  { id: 'route-recovery', file: 'qa/route-recovery.spec.mjs' },
  { id: 'fragment-navigation', file: 'qa/fragment-navigation.spec.mjs' },
  { id: 'premium-reader-certification', file: 'qa/premium-reader-certification.spec.mjs' },
  { id: 'yesenin-part-one', file: 'qa/yesenin-part-one.spec.mjs' },
  { id: 'brand-reference-raster', file: 'qa/brand-emblem.spec.mjs' },
  { id: 'brand-reference-comparison', file: 'qa/brand-reference-comparison.spec.mjs' },
  { id: 'compact-touch-surfaces', file: 'qa/hover-surfaces.spec.mjs' },
  // One launch for every route's stable-hover contract: same file, same
  // isolation, six fewer browser starts before the job's own timeout.
  {
    id: 'stable-hover-routes',
    file: 'qa/hover-stability.spec.mjs',
    grep: `(${hoverRoutes.join('|')}) interactive artwork uses the universal stable-hover contract`,
  },
];

// Each bundle is independent. A failed test cannot pass the job, but must
// not hide the diagnostics and screenshots of every later reader surface.
let failureStatus = 0;
for (const [index, suite] of suites.entries()) {
  const args = ['playwright', 'test', suite.file, ...common, `--output=test-results/webkit-${suite.id}`];
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
    failureStatus ||= result.status ?? 1;
  }
}

if (failureStatus) process.exit(failureStatus);
console.log(`\n[webkit-base-process] ${suites.length} fresh-process base Safari contours passed`);
