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
const historical = contract.documentation.historical ?? [];
for (const relativePath of [...authoritative, ...historical]) {
  assert(exists(relativePath), `document registry path does not exist: ${relativePath}`);
}
const overlap = authoritative.filter((entry) => historical.includes(entry));
assert(overlap.length === 0, `documents cannot be both authoritative and historical: ${overlap.join(', ')}`);
assert(authoritative.includes(contract.documentation.currentState), 'currentState must be authoritative');

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
  'PROJECT_CHARTER.md': [
    'PR №31 остаётся черновым',
    'Интеграционный PR:',
    '/articles/:id` — старые статьи',
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

console.log(`project contracts: OK (${authoritative.length} authoritative docs, ${historical.length} historical docs)`);
