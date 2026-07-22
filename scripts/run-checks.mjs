import { spawnSync } from 'node:child_process';
import process from 'node:process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const checks = [
  'validate:library',
  'validate:essays',
  'validate:citations',
  'validate:yesenin-archive',
  'validate:media',
  'validate:style',
  'typecheck',
  'test:e2e',
];

function tail(text, count = 120) {
  return text.trim().split(/\r?\n/).slice(-count).join('\n');
}

for (const check of checks) {
  process.stdout.write(`\n=== ${check} ===\n`);
  const result = spawnSync(npm, ['run', check], {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
    maxBuffer: 100 * 1024 * 1024,
  });

  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(tail(output));
    process.exit(result.status ?? 1);
  }

  const summary = tail(output, 8);
  if (summary) console.log(summary);
}

console.log('\nAll static, media and browser checks passed.');
