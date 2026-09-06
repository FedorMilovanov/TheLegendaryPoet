import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const CONTRACT_PATH = 'docs/merge-certification.json';

function escapeRegexChar(char) {
  return /[\\^$.*+?()[\]{}|]/.test(char) ? `\\${char}` : char;
}

export function globToRegExp(pattern) {
  let source = '^';
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    if (char === '*') {
      if (pattern[index + 1] === '*') {
        source += '.*';
        index += 1;
      } else {
        source += '[^/]*';
      }
      continue;
    }
    if (char === '?') {
      source += '[^/]';
      continue;
    }
    source += escapeRegexChar(char);
  }
  source += '$';
  return new RegExp(source);
}

export function loadMergeCertificationContract(root = process.cwd()) {
  const contractPath = path.join(root, CONTRACT_PATH);
  return JSON.parse(fs.readFileSync(contractPath, 'utf8'));
}

export function classifyChangedFiles(changedFiles, contract) {
  const normalizedFiles = [...new Set(changedFiles.map((file) => file.replaceAll('\\\\', '/')))].sort();
  const lanes = {};

  for (const [laneId, lane] of Object.entries(contract.lanes ?? {})) {
    const patterns = lane.paths ?? [];
    const regexes = patterns.map((pattern) => [pattern, globToRegExp(pattern)]);
    const matches = [];

    for (const file of normalizedFiles) {
      const matchedPattern = regexes.find(([, regex]) => regex.test(file))?.[0];
      if (matchedPattern) matches.push({ file, pattern: matchedPattern });
    }

    lanes[laneId] = {
      required: matches.length > 0,
      matches,
      workflowFile: lane.workflowFile,
      event: lane.event,
    };
  }

  return { changedFiles: normalizedFiles, lanes };
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) throw new Error(`Unexpected argument: ${token}`);
    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`);
    args[key] = value;
    index += 1;
  }
  return args;
}

function requireExactSha(value, label) {
  if (!/^[0-9a-f]{40}$/.test(value ?? '')) {
    throw new Error(`${label} must be an exact 40-character lowercase commit SHA`);
  }
  return value;
}

function changedFilesFromGit(baseSha, headSha) {
  const stdout = execFileSync(
    'git',
    ['diff', '--name-only', `${baseSha}...${headSha}`],
    { encoding: 'utf8' },
  );
  return stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function appendOutput(file, key, value) {
  if (!file) return;
  fs.appendFileSync(file, `${key}=${value}\n`);
}

function appendSummary(file, report) {
  if (!file) return;
  const lines = [
    '### Merge certification scope',
    '',
    `Exact head: \`${report.headSha}\``,
    `Base: \`${report.baseSha}\``,
    '',
    '| Conditional lane | Required | Matching files |',
    '| --- | --- | --- |',
  ];
  for (const [laneId, lane] of Object.entries(report.lanes)) {
    const matched = lane.matches.map((match) => `\`${match.file}\``).join('<br>') || '—';
    lines.push(`| ${laneId} | ${lane.required ? 'yes' : 'no'} | ${matched} |`);
  }
  fs.appendFileSync(file, `${lines.join('\n')}\n`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseSha = requireExactSha(args.base, '--base');
  const headSha = requireExactSha(args.head, '--head');
  const contract = loadMergeCertificationContract();
  const classification = classifyChangedFiles(changedFilesFromGit(baseSha, headSha), contract);
  const report = { baseSha, headSha, ...classification };
  const hall = report.lanes['hall-pushkin-offline-exhibit'];
  if (!hall) throw new Error('merge certification contract is missing hall-pushkin-offline-exhibit');

  fs.writeFileSync('merge-certification-scope.json', `${JSON.stringify(report, null, 2)}\n`);
  appendOutput(process.env.GITHUB_OUTPUT, 'tested_sha', headSha);
  appendOutput(process.env.GITHUB_OUTPUT, 'hall_required', hall.required ? 'true' : 'false');
  appendSummary(process.env.GITHUB_STEP_SUMMARY, report);
  console.log(JSON.stringify(report, null, 2));
}

const invokedAsScript = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (invokedAsScript) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.stack : error);
    process.exit(1);
  }
}
