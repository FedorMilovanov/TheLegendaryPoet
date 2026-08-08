import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const failures: string[] = [];
const expect = (condition: unknown, message: string) => {
  if (!condition) failures.push(message);
};

const hallDocsPath = 'docs/hall-v3/README.md';
const hallContractPath = 'docs/hall-v3/hall-v3-contract.json';
const hallContract = JSON.parse(read(hallContractPath)) as {
  schemaVersion?: number;
  laneId?: string;
  productIssue?: number;
  phase?: string;
  productionRoute?: {
    path?: string;
    mode?: string;
    module?: string;
    maxRouteBytes?: number;
    allowLegacyHallImports?: boolean;
    allowThreeRuntimeImports?: boolean;
    allowUnapprovedConceptArt?: boolean;
  };
  legacy?: {
    sourceDirectory?: string;
    currentAuthority?: boolean;
    historicalValidator?: string;
    historicalValidatorMandatory?: boolean;
  };
  sourceAuthority?: Record<string, string>;
  gates?: Record<string, string>;
};

const hallPagePath = hallContract.productionRoute?.module ?? 'src/pages/HallPage.tsx';
const legacyHallDir = hallContract.legacy?.sourceDirectory ?? 'src/components/hall';

function sourceFiles(relativeDir: string): string[] {
  const absoluteDir = path.join(root, relativeDir);
  const files: string[] = [];
  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    const relativePath = path.posix.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...sourceFiles(relativePath));
      continue;
    }
    if (/\.(?:ts|tsx|js|jsx|mjs)$/.test(entry.name)) files.push(relativePath);
  }
  return files;
}

function importSpecifiers(source: string) {
  return [...source.matchAll(/(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g)].map((match) => match[1]);
}

const hallPage = read(hallPagePath);
const routeRuntime = read('src/routes/routeModules.ts');
const routeContract = JSON.parse(read('src/routes/route-contract.json')) as {
  routes?: Array<{ id?: string; path?: string; page?: string; module?: string; budgetBytes?: number }>;
};
const projectContract = JSON.parse(read('docs/project-contract.json')) as {
  architecture?: { openLaneIds?: string[] };
  documentation?: { authoritative?: string[] };
};
const currentState = read('docs/CURRENT_STATE.md');
const packageManifest = JSON.parse(read('package.json')) as {
  scripts?: Record<string, string>;
};

expect(hallContract.schemaVersion === 1, 'Hall v3 machine contract schemaVersion must remain 1 during foundation');
expect(hallContract.laneId === 'TLP-HALL-001', 'Hall v3 machine contract must remain owned by TLP-HALL-001');
expect(hallContract.productIssue === 369, 'Hall v3 machine contract must point to Product #369');
expect(hallContract.phase === 'foundation', 'Hall v3 must not advance beyond foundation without an explicit contract change');
expect(hallContract.productionRoute?.mode === 'placeholder', 'production /hall must remain a placeholder during foundation');
expect(hallContract.productionRoute?.allowLegacyHallImports === false, 'foundation contract must forbid legacy Hall imports');
expect(hallContract.productionRoute?.allowThreeRuntimeImports === false, 'foundation contract must forbid Three/R3F runtime imports');
expect(hallContract.productionRoute?.allowUnapprovedConceptArt === false, 'foundation contract must keep unapproved concept art off /hall');
expect(hallContract.legacy?.currentAuthority === false, 'Hall v2 must remain non-authoritative');
expect(hallContract.legacy?.historicalValidatorMandatory === false, 'Hall v2 validator must remain non-mandatory');

for (const [gate, status] of Object.entries(hallContract.gates ?? {})) {
  if (gate === 'foundation') expect(status === 'active', 'foundation gate must remain active until this wave is closed');
  else expect(status === 'blocked', `later Hall gate must remain blocked during foundation: ${gate}`);
}

const hallRoute = routeContract.routes?.find((route) => route.id === 'hall');
const hallBudgetBytes = hallRoute?.budgetBytes;
const maxRouteBytes = hallContract.productionRoute?.maxRouteBytes;
expect(Boolean(hallRoute), 'route contract must retain one hall route');
expect(hallRoute?.path === hallContract.productionRoute?.path, 'Hall route path must match the Hall v3 machine contract');
expect(hallRoute?.page === 'HallPage', 'hall route must remain owned by HallPage');
expect(hallRoute?.module === hallPagePath, 'Hall route module must match the Hall v3 machine contract');
expect(
  typeof hallBudgetBytes === 'number'
    && typeof maxRouteBytes === 'number'
    && Number.isInteger(hallBudgetBytes)
    && hallBudgetBytes <= maxRouteBytes,
  'dormant Hall shell must remain within the machine-contract route budget',
);

for (const specifier of importSpecifiers(hallPage)) {
  expect(
    !specifier.includes('/components/hall') && !specifier.includes('components/hall/'),
    `HallPage must not import the dormant Hall v2 runtime: ${specifier}`,
  );
  expect(
    !['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'].includes(specifier),
    `HallPage must not import a 3D runtime dependency while dormant: ${specifier}`,
  );
}

for (const relativePath of sourceFiles('src')) {
  if (relativePath === legacyHallDir || relativePath.startsWith(`${legacyHallDir}/`)) continue;
  for (const specifier of importSpecifiers(read(relativePath))) {
    const resolvedRelativeImport = specifier.startsWith('.')
      ? path.posix.normalize(path.posix.join(path.posix.dirname(relativePath), specifier))
      : null;
    const importsLegacyHall = specifier.includes('/components/hall')
      || specifier.startsWith('components/hall/')
      || resolvedRelativeImport === legacyHallDir
      || resolvedRelativeImport?.startsWith(`${legacyHallDir}/`) === true;
    expect(!importsLegacyHall, `production source must not import legacy Hall v2: ${relativePath} -> ${specifier}`);
  }
}

expect(
  routeRuntime.includes("HallPage: () => import('../pages/HallPage')"),
  'route runtime must lazy-load the HallPage shell through the canonical route registry',
);

for (const retiredPromise of [
  'Храм русской поэзии',
  'Храм Русской Поэзии',
  'советская и современная поэзия',
  'Золотой век, Серебряный век',
]) {
  expect(!hallPage.includes(retiredPromise), `public Hall placeholder must not promise unapproved architecture: ${retiredPromise}`);
}
expect(!hallPage.includes('hall-preview.webp'), 'dormant Hall route must not load stale concept artwork');
expect(
  hallPage.includes('без выдачи ранних концептов за финальную архитектуру'),
  'Hall placeholder must state that early concepts are not the final architecture',
);

const requiredHallDocs = [hallDocsPath, hallContractPath, ...Object.values(hallContract.sourceAuthority ?? {})];
for (const relativePath of new Set(requiredHallDocs)) {
  expect(fs.existsSync(path.join(root, relativePath)), `Hall v3 contract document must exist: ${relativePath}`);
}
expect(fs.existsSync(path.join(root, legacyHallDir, 'README.md')), 'legacy Hall directory must declare its non-authoritative status');
expect(
  projectContract.architecture?.openLaneIds?.includes(hallContract.laneId ?? '') === true,
  'project contract must register the Hall machine-contract lane while it is open',
);
expect(currentState.includes(`\`${hallContract.laneId}\``), 'CURRENT_STATE must register the Hall machine-contract lane');
expect(
  projectContract.documentation?.authoritative?.includes(hallDocsPath) === true,
  'project contract must register the Hall v3 README as an authoritative architecture entrypoint',
);

const scripts = packageManifest.scripts ?? {};
expect(
  scripts['validate:hall-foundation'] === 'tsx scripts/validate-hall-foundation.ts',
  'package scripts must expose the Hall foundation validator',
);
expect(
  scripts['validate:interaction-runtime']?.includes('validate-hall-audio-runtime') === false,
  'mandatory interaction validation must not preserve Hall-v2 FPS/audio behavior as current architecture',
);
expect(
  scripts.check?.includes('validate:hall-foundation') === true,
  'normal project check must run the Hall foundation validator',
);

if (failures.length > 0) {
  console.error('\nHall v3 foundation validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Hall v3 foundation validation passed: machine phase, lightweight route, full legacy isolation and architecture ownership are enforced.');
