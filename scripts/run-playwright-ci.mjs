import { spawnSync } from 'node:child_process';
import process from 'node:process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const version = '1.61.1';

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Keep the committed lockfile unchanged while making a clean `npm ci` checkout
// capable of executing the browser suite. The package and browser are pinned.
run(npm, [
  'install',
  '--no-save',
  '--package-lock=false',
  `@playwright/test@${version}`,
]);

const installArgs = ['playwright', 'install'];
if (process.env.CI && process.platform === 'linux') installArgs.push('--with-deps');
installArgs.push('chromium');
run(npx, installArgs);
run(npx, ['playwright', 'test']);
