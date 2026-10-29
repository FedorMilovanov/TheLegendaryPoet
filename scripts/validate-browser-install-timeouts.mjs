import { browserInstallTimeoutFailures } from './browser-install-timeouts.mjs';

const failures = browserInstallTimeoutFailures(process.cwd());

if (failures.length) {
  console.error('browser install timeout budget: FAILED');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('browser install timeout budget: OK');
