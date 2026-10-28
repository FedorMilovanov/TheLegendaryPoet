import fs from 'node:fs';
import path from 'node:path';

// Shared authority for the timeout floor of every job that installs locked
// Playwright browsers. Observed installs on 2026-10-26 took 25-44 minutes, so a
// job that installs browsers can be cancelled by its own timeout before a single
// test runs. The floor is patience, not a quality gate: no assertion, threshold,
// retry policy or install method is relaxed by raising it.

const WORKFLOW_DIRECTORY = '.github/workflows';

export function jobBlocks(workflowText) {
  const lines = (workflowText ?? '').split(/\r?\n/);
  const blocks = [];
  let current = null;
  for (const line of lines) {
    const job = /^  ([A-Za-z0-9_-]+):\s*$/.exec(line);
    if (job) {
      current = { name: job[1], usesInstallAction: false, timeoutMinutes: null };
      blocks.push(current);
      continue;
    }
    if (!current) continue;
    if (/^\s+(?:-\s+)?uses:\s*\.\/\.github\/actions\/install-playwright\s*$/.test(line)) current.usesInstallAction = true;
    const timeout = /^\s+timeout-minutes:\s*(\d+)\s*$/.exec(line);
    if (timeout && current.timeoutMinutes === null) current.timeoutMinutes = Number(timeout[1]);
  }
  return blocks;
}

export function browserInstallTimeoutFailures(root = process.cwd()) {
  const failures = [];
  const budgetPath = path.join(root, 'docs/browser-install-budget.json');
  const budget = JSON.parse(fs.readFileSync(budgetPath, 'utf8'));

  if (budget.version !== 1) failures.push('browser install budget version must remain 1');

  const minimum = Number(budget.minimumJobTimeoutMinutes);
  const maximum = Number(budget.maximumJobTimeoutMinutes);
  const observed = Number(budget.observedInstallMinutesMax);

  if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum <= 0 || maximum < minimum) {
    failures.push('browser install budget must define minimum <= maximum job timeout minutes');
    return failures;
  }
  if (!Number.isFinite(observed) || observed <= 0) {
    failures.push('browser install budget must record a positive observedInstallMinutesMax');
    return failures;
  }
  if (minimum < observed + 10) {
    failures.push(`minimum job timeout ${minimum}m leaves no headroom above the observed install maximum ${observed}m`);
  }

  const workflowDirectory = path.join(root, WORKFLOW_DIRECTORY);
  const files = fs.readdirSync(workflowDirectory).filter((file) => file.endsWith('.yml')).sort();
  let covered = 0;

  for (const file of files) {
    const text = fs.readFileSync(path.join(workflowDirectory, file), 'utf8');
    for (const block of jobBlocks(text)) {
      if (!block.usesInstallAction) continue;
      covered += 1;
      if (block.timeoutMinutes === null) {
        failures.push(`${WORKFLOW_DIRECTORY}/${file} job ${block.name} installs browsers without an explicit timeout-minutes`);
        continue;
      }
      if (block.timeoutMinutes < minimum) {
        failures.push(`${WORKFLOW_DIRECTORY}/${file} job ${block.name} timeout ${block.timeoutMinutes}m is below the browser install floor ${minimum}m`);
      }
      if (block.timeoutMinutes > maximum) {
        failures.push(`${WORKFLOW_DIRECTORY}/${file} job ${block.name} timeout ${block.timeoutMinutes}m exceeds the bounded ceiling ${maximum}m`);
      }
    }
  }

  if (covered === 0) failures.push('no workflow job uses the shared browser install action; the floor check lost its subject');
  return failures;
}
