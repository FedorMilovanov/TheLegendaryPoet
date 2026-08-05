import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const contractPath = path.join(root, 'docs', 'project-contract.json');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const fail = (message) => failures.push(message);
const assert = (condition, message) => { if (!condition) fail(message); };

if (!fs.existsSync(contractPath)) {
  throw new Error('project contracts: docs/project-contract.json is missing');
}

const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
assert(contract.schemaVersion === 1, 'project contract schemaVersion must be 1');
assert(read('.nvmrc').trim() === String(contract.runtime.recommendedNodeMajor), '.nvmrc must match the recommended Node major');

const runtimePaths = Object.entries(contract.runtime)
  .filter(([, value]) => typeof value === 'string' && value.includes('/'));
for (const [key, relativePath] of runtimePaths) {
  assert(exists(relativePath), `runtime contract path ${key} does not exist: ${relativePath}`);
}

const authoritative = contract.documentation.authoritative ?? [];
const editorialAuthority = contract.documentation.editorialAuthority ?? [];
const historical = contract.documentation.historical ?? [];
const supersededTechnical = contract.documentation.supersededTechnicalDocuments ?? [];
for (const relativePath of [...authoritative, ...editorialAuthority, ...historical, ...supersededTechnical]) {
  assert(exists(relativePath), `document registry path does not exist: ${relativePath}`);
}
const overlap = authoritative.filter((entry) => historical.includes(entry));
assert(overlap.length === 0, `documents cannot be both runtime-authoritative and historical: ${overlap.join(', ')}`);
for (const entry of supersededTechnical) {
  assert(exists(entry), `superseded technical document does not exist: ${entry}`);
}
assert(authoritative.includes(contract.documentation.currentState), 'currentState must be authoritative');

const architecture = contract.architecture ?? {};
const auditAuthority = architecture.auditAuthority;
const openLaneIds = architecture.openLaneIds ?? [];
const openLaneStart = architecture.currentStateOpenLaneStart;
const openLaneEnd = architecture.currentStateOpenLaneEnd;
const forbiddenCurrentStateClaims = architecture.forbiddenCurrentStateClaims ?? [];

assert(
  typeof auditAuthority === 'string' && auditAuthority.startsWith('FedorMilovanov/AuditRepo/'),
  'architecture.auditAuthority must point to the governed AuditRepo project path',
);
assert(Array.isArray(openLaneIds) && openLaneIds.length > 0, 'architecture.openLaneIds must be a non-empty array');
assert(
  openLaneIds.every((id) => typeof id === 'string' && /^TLP-[A-Z]+-\d{3}$/.test(id)),
  'architecture.openLaneIds must contain canonical TLP IDs',
);
assert(new Set(openLaneIds).size === openLaneIds.length, 'architecture.openLaneIds must not contain duplicates');
assert(
  typeof openLaneStart === 'string' && typeof openLaneEnd === 'string' && openLaneStart !== openLaneEnd,
  'architecture must define distinct current-state open-lane markers',
);
assert(Array.isArray(forbiddenCurrentStateClaims), 'architecture.forbiddenCurrentStateClaims must be an array');

const currentStatePath = contract.documentation.currentState;
const currentStateText = read(currentStatePath);
assert(currentStateText.includes(auditAuthority), `${currentStatePath} must name the AuditRepo authority path`);

const openLaneStartIndex = typeof openLaneStart === 'string' ? currentStateText.indexOf(openLaneStart) : -1;
const openLaneEndIndex = typeof openLaneEnd === 'string' ? currentStateText.indexOf(openLaneEnd) : -1;
assert(openLaneStartIndex >= 0, `${currentStatePath} is missing the open-lane start marker`);
assert(openLaneEndIndex > openLaneStartIndex, `${currentStatePath} is missing or misorders the open-lane end marker`);

if (openLaneStartIndex >= 0 && openLaneEndIndex > openLaneStartIndex) {
  const openLaneSection = currentStateText.slice(openLaneStartIndex + openLaneStart.length, openLaneEndIndex);
  const laneLines = openLaneSection
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^(?:\d+\.|[-*])\s+/.test(line));
  const backtickedLaneIds = [...openLaneSection.matchAll(/`(TLP-[A-Z]+-\d{3})`/g)].map((match) => match[1]);
  const everyLaneMention = [...openLaneSection.matchAll(/TLP-[A-Z]+-\d{3}/g)].map((match) => match[0]);

  assert(laneLines.length === openLaneIds.length, `open-lane section must contain exactly ${openLaneIds.length} registered entries`);
  for (const line of laneLines) {
    const ids = [...line.matchAll(/`(TLP-[A-Z]+-\d{3})`/g)].map((match) => match[1]);
    assert(ids.length === 1, `every open-lane entry must contain exactly one backticked canonical ID: ${line}`);
  }
  assert(
    JSON.stringify(backtickedLaneIds) === JSON.stringify(openLaneIds),
    `current-state open lanes must exactly match project-contract order: expected ${openLaneIds.join(', ')}, found ${backtickedLaneIds.join(', ')}`,
  );
  assert(
    everyLaneMention.length === backtickedLaneIds.length,
    'every TLP ID in the open-lane section must be represented as the canonical backticked entry ID',
  );
}

for (const claim of forbiddenCurrentStateClaims) {
  assert(typeof claim === 'string' && claim.length > 0, 'forbidden current-state claims must be non-empty strings');
  if (typeof claim === 'string' && claim.length > 0) {
    assert(!currentStateText.includes(claim), `${currentStatePath} reintroduced a closed architecture claim: ${claim}`);
  }
}

function literalWorkflowPaths(workflowText) {
  const values = [];
  const lines = workflowText.split(/\r?\n/);
  let pathsIndent = null;
  for (const line of lines) {
    const pathsMatch = line.match(/^(\s*)paths:\s*$/);
    if (pathsMatch) {
      pathsIndent = pathsMatch[1].length;
      continue;
    }
    if (pathsIndent === null) continue;
    const trimmed = line.trim();
    const indent = line.length - line.trimStart().length;
    if (trimmed && indent <= pathsIndent) {
      pathsIndent = null;
      continue;
    }
    const item = line.match(/^\s*-\s*['"]?([^'"#]+?)['"]?\s*$/);
    if (item) values.push(item[1].trim());
  }
  return values.filter((value) => !/[*!?\[\]{}]/.test(value));
}

const exceptions = contract.workflowPathExceptions ?? [];
const usedExceptions = new Set();
const workflowsDir = path.join(root, '.github', 'workflows');
for (const name of fs.readdirSync(workflowsDir).filter((entry) => /\.ya?ml$/i.test(entry))) {
  const relativePath = path.posix.join('.github/workflows', name);
  for (const watchedPath of literalWorkflowPaths(read(relativePath))) {
    if (exists(watchedPath)) continue;
    const exceptionIndex = exceptions.findIndex((entry) => entry.workflow === relativePath && entry.path === watchedPath);
    if (exceptionIndex >= 0) {
      usedExceptions.add(exceptionIndex);
      continue;
    }
    fail(`${relativePath} watches a path that does not exist: ${watchedPath}`);
  }
}
for (const [index, exception] of exceptions.entries()) {
  assert(usedExceptions.has(index), `workflow exception is no longer needed and must be removed: ${exception.workflow} -> ${exception.path}`);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(exception.expiresOn ?? ''), `workflow exception needs an ISO expiry: ${exception.workflow}`);
}

const brandWorkflow = read('.github/workflows/brand-progress.yml');
for (const currentPath of [
  'src/components/SpectralBrandMark.tsx',
  'scripts/materialize-brand-art.mjs',
  'qa/reference/approved-brand/**',
]) {
  assert(brandWorkflow.includes(currentPath), `brand progress workflow must watch ${currentPath}`);
}
for (const retiredPath of ['src/components/BrandMark.tsx', 'public/brand-emblem.svg', 'public/brand-mark-micro.svg']) {
  assert(!brandWorkflow.includes(retiredPath), `brand progress workflow still watches retired ${retiredPath}`);
}

const forbiddenByFile = {
  'README.md': [
    'сейчас Google Fonts',
    'base` = `/TheLegendaryPoet/',
    'src/routes/routeModules.tsx',
  ],
  'docs/CURRENT_STATE.md': ['src/routes/routeModules.tsx'],
};
for (const [relativePath, tokens] of Object.entries(forbiddenByFile)) {
  const text = read(relativePath);
  for (const token of tokens) {
    assert(!text.includes(token), `${relativePath} contains retired contract text: ${token}`);
  }
}

if (failures.length) {
  console.error('project contracts: FAILED');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`project contracts: OK (${authoritative.length} runtime docs, ${editorialAuthority.length} editorial docs, ${historical.length} historical docs, ${openLaneIds.length} open architecture lanes)`);
