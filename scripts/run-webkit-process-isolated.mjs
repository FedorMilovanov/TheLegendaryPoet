import { spawnSync } from 'node:child_process';

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const common = [
  '--config=playwright.config.mjs',
  '--project=iphone-safari',
  '--workers=1',
  '--reporter=line',
];

const hoverRoutes = ['home', 'articles', 'essay', 'poets', 'music', 'archive', 'ratings'];

const mobilePlatformContours = [
  {
    id: 'mobile-ratings-community',
    grep: 'ratings and community input survive touch entry and reload',
  },
  {
    id: 'mobile-music-shell',
    grep: 'music shell, immersive dialog and mobile dock do not collide',
  },
  {
    id: 'mobile-orientation-navigation',
    grep: 'portrait, landscape and back navigation stay stable',
  },
  {
    id: 'mobile-engine-identity',
    grep: 'engine identity is honest for Android Chrome and iPhone Safari',
  },
];

const suites = [
  ...mobilePlatformContours.map((contour) => ({
    ...contour,
    file: 'qa/mobile-platforms.spec.mjs',
  })),
  { id: 'yesenin-part-one', file: 'qa/yesenin-part-one.spec.mjs' },
  { id: 'mayakovsky-visual-wave', file: 'qa/mayakovsky-visual-wave.spec.mjs' },
  { id: 'optical-matrix', file: 'qa/brand-v19-optical.spec.mjs' },
  { id: 'micro-matrix', file: 'qa/brand-v19-micro.spec.mjs' },
  ...hoverRoutes.map((route) => ({
    id: `hover-${route}`,
    file: 'qa/hover-stability.spec.mjs',
    grep: `${route} interactive artwork uses the universal stable-hover contract`,
  })),
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
    id: 'home-dock-search',
    file: 'qa/mobile-home-webkit.spec.mjs',
    grep: 'WebKit home dock, search sheet and tap targets remain usable in a fresh context',
  },
];

for (const [index, suite] of suites.entries()) {
  const args = ['playwright', 'test', suite.file, ...common];
  if (suite.grep) args.push('--grep', suite.grep);

  console.log(`\n[webkit-process ${index + 1}/${suites.length}] ${suite.id}`);
  const result = spawnSync(npx, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      TLP_WEBKIT_PROCESS_ID: suite.id,
    },
  });

  if (result.error) throw result.error;
  if (result.signal) {
    console.error(`[webkit-process] ${suite.id} terminated by ${result.signal}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`[webkit-process] ${suite.id} failed with status ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

console.log(`\n[webkit-process] ${suites.length} fresh-process Safari contours passed`);
