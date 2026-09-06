import { cp, mkdtemp, mkdir, rm, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = await mkdtemp(join(tmpdir(), 'tlp-audio-release-gate-'));
const validator = resolve(repoRoot, 'scripts/validate-audio-assets.ts');
const missingTrackId = 'blok-rossiya';
const missingMaster = 'blok-rossiya.tlp-2026.mp3';

function runValidator() {
  return spawnSync(
    process.execPath,
    ['--import', 'tsx', validator, '--allow-missing'],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        TLP_AUDIO_VALIDATION_ROOT: fixtureRoot,
      },
      encoding: 'utf8',
    },
  );
}

function outputOf(result) {
  return `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
}

try {
  await mkdir(resolve(fixtureRoot, 'public/images'), { recursive: true });
  await cp(resolve(repoRoot, 'public/audio'), resolve(fixtureRoot, 'public/audio'), { recursive: true });
  await cp(resolve(repoRoot, 'public/images/music'), resolve(fixtureRoot, 'public/images/music'), { recursive: true });

  const baseline = runValidator();
  if (baseline.error) throw baseline.error;
  if (baseline.status !== 0) {
    throw new Error(`audio release fixture baseline must pass before mutation\n${outputOf(baseline)}`);
  }

  await unlink(resolve(fixtureRoot, 'public/audio', missingMaster));

  const missingMasterResult = runValidator();
  if (missingMasterResult.error) throw missingMasterResult.error;
  const missingMasterOutput = outputOf(missingMasterResult);
  if (missingMasterResult.status === 0) {
    throw new Error(`--allow-missing falsely accepted a missing published master\n${missingMasterOutput}`);
  }
  if (!missingMasterOutput.includes(`ERROR audio: ${missingTrackId}: published master is missing`)) {
    throw new Error(`missing published master did not produce the fail-closed diagnostic\n${missingMasterOutput}`);
  }
  if (missingMasterOutput.includes(`WARN audio: ${missingTrackId}: master is not uploaded yet`)) {
    throw new Error(`missing published master was downgraded to a warning\n${missingMasterOutput}`);
  }

  console.log('Audio release gate regression: published masters remain fatal even under --allow-missing compatibility mode.');
} finally {
  await rm(fixtureRoot, { recursive: true, force: true });
}
